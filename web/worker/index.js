// Nabız web sürümü sunucusu (Cloudflare Worker)
// - Statik dosyaları (sayfa, kaynak kütüphanesi, 3D model) sunar.
// - /api/sample: sayfanın sorularını Claude'a iletir, cevabı SSE olarak akıtır.
// API anahtarı yalnızca burada (Cloudflare gizli değişkeni) durur; soru ve cevaplar kaydedilmez.

import Anthropic from "@anthropic-ai/sdk";

const MAX_TEXT_BYTES = 262144;        // claude.ai sürümüyle aynı sınır
const MAX_IMAGES = 5;
const MAX_IMAGE_B64 = 7_000_000;      // tarayıcı görselleri küçülterek gönderir; bu üst sınır
const MAX_BODY_BYTES = 12_000_000;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
// Sayfanın istediği seviye → düşünme derinliği (model aynı kalır)
const EFFORT = { quick: "low", default: "medium", complex: "high" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/sample") return handleSample(request, env, ctx, url);
    if (url.pathname.startsWith("/api/")) return jsonError(404, "not_found");
    return env.ASSETS.fetch(request);
  },
};

function jsonError(status, code, message = code) {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// Sayfanın gönderdiği girdiyi doğrula ve Messages API biçimine çevir
function buildMessages(body) {
  const { input, images = [] } = body;
  let turns;
  if (typeof input === "string") turns = [{ role: "user", content: input }];
  else if (Array.isArray(input)) turns = input;
  else return { error: "input bir metin ya da tur listesi olmalı" };
  if (!turns.length || turns[0].role !== "user" || turns.at(-1).role !== "user") return { error: "turlar user ile başlayıp bitmeli" };
  let bytes = 0;
  for (const t of turns) {
    if (!t || !["user", "assistant"].includes(t.role) || typeof t.content !== "string" || !t.content.trim()) return { error: "geçersiz tur" };
    bytes += new TextEncoder().encode(t.content).length;
  }
  if (bytes > MAX_TEXT_BYTES) return { error: "prompt_too_large", code: "prompt_too_large" };
  if (!Array.isArray(images) || images.length > MAX_IMAGES) return { error: "çok fazla görsel", code: "image_rejected" };
  for (const img of images) {
    if (!img || !IMAGE_TYPES.has(img.media_type) || typeof img.data !== "string" || img.data.length > MAX_IMAGE_B64) return { error: "görsel kabul edilmedi", code: "image_rejected" };
  }
  const messages = turns.map((t) => ({ role: t.role, content: t.content }));
  if (images.length) {
    const last = messages.at(-1);
    last.content = [
      ...images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.media_type, data: img.data } })),
      { type: "text", text: last.content },
    ];
  }
  return { messages };
}

async function handleSample(request, env, ctx, url) {
  if (request.method !== "POST") return jsonError(405, "invalid_request", "POST gerekli");
  // Yalnızca kendi sayfamızdan gelen tarayıcı isteklerini kabul et
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== url.host) return jsonError(403, "not_granted", "başka siteden istek");
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return jsonError(413, "prompt_too_large");
  if (!env.ANTHROPIC_API_KEY) return jsonError(503, "sampling_disabled", "API anahtarı tanımlı değil");

  // Kötüye kullanım sınırı: IP başına dakikada birkaç istek (wrangler.jsonc → ratelimits)
  if (env.LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") || "yerel";
    const { success } = await env.LIMITER.limit({ key: ip });
    if (!success) return jsonError(429, "rate_limited", "çok sık istek");
  }

  let body;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_request", "JSON okunamadı"); }
  const built = buildMessages(body);
  if (built.error) return jsonError(400, built.code || "invalid_request", built.error);

  const tier = EFFORT[body.modelTier] ? body.modelTier : "default";
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined, maxRetries: 1 });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const send = (obj) => writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

  // Cevap akarken iş isteğin ömrüne bağlı kalsın
  ctx.waitUntil((async () => {
    let started = false;
    try {
      const stream = client.beta.messages.stream(
        {
          model: env.MODEL || "claude-opus-5",
          max_tokens: Number(env.MAX_TOKENS) || 16000,
          messages: built.messages,
          output_config: { effort: EFFORT[tier] },
          cache_control: { type: "ephemeral" },      // uzun talimat turu sonraki sorularda önbellekten okunur
          fallbacks: "default",                       // güvenlik filtresi reddederse sunucu tarafında uygun modelle yeniden dener
          betas: ["server-side-fallback-2026-07-01"],
        },
        { signal: request.signal },                  // kullanıcı durdurursa ya da sayfayı kapatırsa üretim de durur
      );
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          started = true;
          await send({ t: "d", x: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") await send({ t: "e", code: "refused" });
      else await send({ t: "done", truncated: final.stop_reason === "max_tokens", tier });
    } catch (err) {
      let code = "upstream_error";
      if (err instanceof Anthropic.APIUserAbortError || request.signal?.aborted) code = "cancelled";
      else if (err instanceof Anthropic.RateLimitError) code = "rate_limited";
      else if (err instanceof Anthropic.BadRequestError) code = started ? "upstream_error" : "invalid_request";
      else if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) code = "sampling_disabled";
      // İçerik kaydedilmez; yalnızca hata türü
      if (code !== "cancelled") console.error("sample hatası:", code, err?.status ?? "", err?.request_id ?? "");
      try { await send({ t: "e", code }); } catch {}
    } finally {
      try { await writer.close(); } catch {}
    }
  })());

  return new Response(readable, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

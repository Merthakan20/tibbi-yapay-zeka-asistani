// Uçtan uca yerel test: sahte Anthropic + wrangler dev (gerçek Worker) + sunucu kontrolleri.
// Kullanım: npm test   (önce derler; gerçek API'ye istek gitmez)
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOG = join(web, "test/.istekler.json");
const BASE = "http://127.0.0.1:8787";
const procs = [];
let failed = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "✓" : "✗"} ${name}${extra ? " · " + extra : ""}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start(cmd, args, ready) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: web, env: { ...process.env, FORCE_COLOR: "0" } });
    procs.push(p);
    let out = "";
    const on = (d) => { out += d; if (ready.test(out)) resolve(p); };
    p.stdout.on("data", on); p.stderr.on("data", on);
    p.on("exit", (c) => reject(new Error(`${cmd} kapandı (${c}):\n${out.slice(-2000)}`)));
    setTimeout(() => reject(new Error(`${cmd} başlamadı:\n${out.slice(-2000)}`)), 60000);
  });
}

async function sseCall(body, headers = {}) {
  const res = await fetch(`${BASE}/api/sample`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  if (!res.ok) return { status: res.status, json: await res.json().catch(() => null) };
  const raw = await res.text();
  const events = raw.split("\n\n").filter((l) => l.startsWith("data:")).map((l) => JSON.parse(l.slice(5)));
  return { status: res.status, events, text: events.filter((e) => e.t === "d").map((e) => e.x).join("") };
}

try {
  if (existsSync(LOG)) rmSync(LOG);
  writeFileSync(join(web, ".dev.vars"), "ANTHROPIC_API_KEY=test-anahtari\nANTHROPIC_BASE_URL=http://127.0.0.1:8799\n");
  await start("node", ["test/mock-anthropic.mjs", "8799", LOG], /sahte Anthropic/);
  await start("npx", ["wrangler", "dev", "--port", "8787", "--ip", "127.0.0.1", "--log-level", "info"], /Ready on|localhost:8787|127\.0\.0\.1:8787/);
  await sleep(1500);

  // Statik dosyalar
  const index = await (await fetch(`${BASE}/`)).text();
  ok("Ana sayfa sunuluyor", index.includes('<script src="bridge.js">') && index.includes("manifest.webmanifest"));
  ok("claude.ai metinleri uyarlandı", !index.includes("Sorularınız Claude hesabınız") && !index.includes("yalnızca claude.ai içinde") && index.includes("Aydınlatma metni"));
  for (const p of ["/kaynaklar.json", "/models/muscles.json", "/manifest.webmanifest", "/kvkk.html", "/icons/icon-512.png", "/icons/apple-touch-icon.png"]) {
    const r = await fetch(BASE + p); ok(`GET ${p}`, r.ok, String(r.status));
  }
  const sw = await (await fetch(`${BASE}/sw.js`)).text();
  ok("Önbellek sürümü dolduruldu", !sw.includes("__SURUM__"));

  // Akışlı soru
  const a = await sseCall({ input: [{ role: "user", content: "TALİMAT" }, { role: "user", content: "Başım ağrıyor" }], modelTier: "default" });
  ok("Akışlı cevap geldi", a.status === 200 && a.text.startsWith("ACİLİYET: evde") && a.events.at(-1)?.t === "done", `${a.events?.length} olay`);
  const req1 = JSON.parse(readFileSync(LOG, "utf8")).at(-1);
  ok("Model claude-opus-5", req1.body.model === "claude-opus-5");
  ok("Reddetme yedeği açık", req1.body.fallbacks === "default" && /server-side-fallback-2026-07-01/.test(req1.beta || ""), req1.beta);
  ok("Düşünme derinliği medium", req1.body.output_config?.effort === "medium");
  ok("Önbellek işareti", req1.body.cache_control?.type === "ephemeral");
  ok("API anahtarı sunucuda", req1.auth === "Bearer test-anahtari" || req1.key === "test-anahtari");
  ok("Turlar korunuyor", req1.body.messages.length === 2 && req1.body.messages[1].content === "Başım ağrıyor");

  // Derin analiz → high
  await sseCall({ input: "x", modelTier: "complex" });
  ok("Derin analiz high", JSON.parse(readFileSync(LOG, "utf8")).at(-1).body.output_config.effort === "high");

  // Görsel
  const png1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const g = await sseCall({ input: "Tahlilim", images: [{ media_type: "image/png", data: png1 }, { media_type: "image/png", data: png1 }] });
  const req2 = JSON.parse(readFileSync(LOG, "utf8")).at(-1);
  ok("Görseller iletiliyor", g.text === "Görsel sayısı: 2" && req2.body.messages[0].content[0].type === "image" && req2.body.messages[0].content.at(-1).type === "text");

  // Reddetme
  const r = await sseCall({ input: "REDDET" });
  ok("Reddetme → refused", r.events?.at(-1)?.code === "refused");

  // Güvenlik
  const x = await sseCall({ input: "selam" }, { Origin: "https://kotu-site.example" });
  ok("Başka siteden istek reddedildi", x.status === 403);
  const b1 = await sseCall({ input: [{ role: "assistant", content: "x" }] });
  ok("Geçersiz tur reddedildi", b1.status === 400);
  const b2 = await sseCall({ input: "x".repeat(270000) });
  ok("Çok uzun girdi reddedildi", b2.status === 400 && b2.json?.code === "prompt_too_large");
  const b3 = await sseCall({ input: "x", images: [{ media_type: "application/pdf", data: "AAAA" }] });
  ok("PDF görsel gibi gönderilemez", b3.status === 400 && b3.json?.code === "image_rejected");
  const g405 = await fetch(`${BASE}/api/sample`);
  ok("GET /api/sample 405", g405.status === 405);

  // Hız sınırı (dakikada 8)
  const codes = [];
  for (let i = 0; i < 10; i++) codes.push((await sseCall({ input: "hız " + i })).status);
  ok("Hız sınırı devrede", codes.includes(429), codes.join(","));
} catch (e) {
  console.error(e.message); failed++;
} finally {
  procs.forEach((p) => p.kill());
  rmSync(join(web, ".dev.vars"), { force: true });
  console.log(failed ? `\n${failed} kontrol BAŞARISIZ` : "\nTüm kontroller geçti");
  process.exit(failed ? 1 : 0);
}

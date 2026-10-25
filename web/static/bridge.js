// Nabız web sürümü köprüsü: claude.ai'nin sayfaya sağladığı window.claude arayüzünü taklit eder.
// sample → /api/sample (Nabız sunucusu), downloads → tarayıcı indirmesi, user → sahip değil, db → yok.
// Böylece artifact/nabiz.html hiç değiştirilmeden web uygulaması olarak çalışır.
(() => {
  "use strict";
  const CONSENT_KEY = "nabiz.kvkk.v1";
  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const fail = (code, message = code, text) => Promise.reject(text ? { code, message, text } : { code, message });

  // ---------------------------------------------------------------- KVKK açık rıza
  let consentWaiters = [];
  const hasConsent = () => { try { return Boolean(localStorage.getItem(CONSENT_KEY)); } catch { return false; } };
  function showConsent() {
    if (document.getElementById("kvkk")) return;
    const box = document.createElement("div");
    box.id = "kvkk";
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "kvkkT");
    box.innerHTML = `<div class="kv-panel">
      <h2 id="kvkkT">Nabız'a hoş geldiniz</h2>
      <p>Nabız bir <b>tıbbi bilgi asistanıdır</b>; teşhis koymaz, tedavi önermez ve muayenenin yerini tutmaz. Acil durumda <b>112</b>'yi arayın.</p>
      <p>Yazdığınız sorular, eklediğiniz belgeler ve profil bilgileriniz (ad soyad hariç) yanıt üretilmesi için yapay zeka hizmeti sağlayıcısı <b>Anthropic</b>'e (ABD) iletilir. Bunlar sağlık verisi olabileceğinden açık rızanız gerekir. Nabız sunucusu bu içerikleri saklamaz; sohbetiniz ve belgeleriniz yalnızca bu cihazda tutulur.</p>
      <label class="kv-check"><input type="checkbox" id="kvkkC"> <span><a href="/kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; sağlık verilerimin bu amaçla işlenmesine ve yurt dışına aktarılmasına açık rıza veriyorum.</span></label>
      <div class="kv-act"><button type="button" id="kvkkOk" disabled>Kabul ediyorum</button><button type="button" id="kvkkNo">Şimdilik göz at</button></div>
    </div>`;
    document.body.appendChild(box);
    const c = box.querySelector("#kvkkC"), ok = box.querySelector("#kvkkOk");
    c.onchange = () => { ok.disabled = !c.checked; };
    ok.onclick = () => {
      try { localStorage.setItem(CONSENT_KEY, new Date().toISOString()); } catch {}
      box.remove(); consentWaiters.splice(0).forEach((w) => w(true));
    };
    box.querySelector("#kvkkNo").onclick = () => { box.remove(); consentWaiters.splice(0).forEach((w) => w(false)); };
    setTimeout(() => c.focus(), 50);
  }
  const consentReady = () => hasConsent() ? Promise.resolve(true) : new Promise((res) => { consentWaiters.push(res); showConsent(); });
  document.addEventListener("DOMContentLoaded", () => { if (!hasConsent()) showConsent(); });

  // ---------------------------------------------------------------- Görseller
  // Büyük fotoğraflar gönderilmeden önce küçültülür (en uzun kenar 1568 px)
  const isBlob = (b) => b && typeof b.arrayBuffer === "function" && typeof b.size === "number";
  async function toImagePart(blob) {
    if (!isBlob(blob)) throw { code: "invalid_request", message: "görsel Blob olmalı" };
    if (blob.size > 20e6) throw { code: "image_rejected", message: "görsel çok büyük" };
    let bmp;
    try { bmp = await createImageBitmap(blob); } catch { throw { code: "image_rejected", message: "görsel açılamadı" }; }
    const k = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88));
    const buf = new Uint8Array(await out.arrayBuffer());
    let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { media_type: "image/jpeg", data: btoa(bin) };
  }

  // ---------------------------------------------------------------- sample
  async function call(input, opts = {}) {
    if (opts === null || typeof opts !== "object") return fail("invalid_request", "options düz bir nesne olmalı");
    if (typeof input !== "string" && !Array.isArray(input)) return fail("invalid_request", "input metin ya da tur listesi olmalı");
    if (opts.signal?.aborted) return fail("cancelled");
    if (!(await consentReady())) return fail("cancelled", "açık rıza verilmedi");

    let images = [];
    try {
      const list = opts.images ? (isBlob(opts.images) ? [opts.images] : [...opts.images]) : [];
      if (list.length > 5) return fail("image_rejected", "en fazla 5 görsel");
      images = await Promise.all(list.map(toImagePart));
    } catch (e) { return fail(e.code || "image_rejected", e.message); }

    const ctl = new AbortController();
    opts.signal?.addEventListener("abort", () => ctl.abort(), { once: true });
    let text = "";
    try {
      const res = await fetch("/api/sample", {
        method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
        body: JSON.stringify({ input, modelTier: opts.modelTier || "default", images }),
      });
      if (!res.ok) {
        let code = "upstream_error"; try { code = (await res.json()).code || code; } catch {}
        return fail(code);
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "", done = null;
      while (!done) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
          if (!line.startsWith("data:")) continue;
          const ev = JSON.parse(line.slice(5));
          if (ev.t === "d") { text += ev.x; try { opts.onText?.({ text, delta: ev.x }); } catch (err) { console.error(err); } }
          else if (ev.t === "e") return fail(ev.code, ev.code, ev.code === "refused" ? undefined : text || undefined);
          else if (ev.t === "done") done = ev;
        }
      }
      if (!done) return fail("upstream_error", "bağlantı kesildi", text || undefined);
      if (!text.trim()) return fail("empty_completion");
      return { text, truncated: Boolean(done.truncated), modelTierApplied: opts.modelTier || "default" };
    } catch (e) {
      if (ctl.signal.aborted) return fail("cancelled", "durduruldu", text || undefined);
      return fail("upstream_error", String(e?.message || e), text || undefined);
    }
  }

  // Cevaptan JSON değerini hoşgörülü biçimde çıkar (claude.ai'deki sample.json gibi)
  function parseJson(text) {
    try { return JSON.parse(text); } catch {}
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1]); } catch {} }
    const a = text.search(/[[{]/), b = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
    if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
    throw { code: "invalid_json", message: "JSON okunamadı", text };
  }

  const sample = (input, opts) => call(input, opts);
  sample.json = async (input, opts = {}) => {
    const res = await call(typeof input === "string" ? input + "\n\nYanıtını yalnızca geçerli JSON olarak ver." : input, opts);
    if (res.truncated) throw { code: "invalid_json", message: "cevap yarıda kesildi", text: res.text };
    return parseJson(res.text);
  };
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 5, maxInputBytes: 20e6, mediaTypes: IMAGE_TYPES } });

  // ---------------------------------------------------------------- downloads / user
  const downloads = {
    async save({ filename, data }) {
      const blob = isBlob(data) ? data : new Blob([data], { type: /\.html?$/i.test(filename) ? "text/html;charset=utf-8" : "application/octet-stream" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    },
  };
  const user = { isOwner: async () => false, canEdit: async () => false, can: async () => null, id: async () => null,
    me: async () => ({ id: null, name: "", avatarUrl: "", color: "#4cc2a0", email: null, isOwner: false, canEdit: false }) };

  const caps = { sample, downloads, user };
  window.claude = Object.freeze({ use: async (name) => caps[name] ?? null });
})();

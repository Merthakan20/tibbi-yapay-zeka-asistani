// Gerçek zamanlı tarayıcı testi (Chrome DevTools protokolü): test/harness.html adımlarını çalıştırır.
// Önce: sahte Anthropic (8799) ve wrangler dev (8787) açık olmalı; dist/__harness.html kopyalanmış olmalı.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", "--window-size=500,900", `--user-data-dir=${mkdtempSync(join(tmpdir(), "nabiz-"))}`, "about:blank"], { stdio: "ignore" });
let failed = 0;
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) { try { target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.type === "page"); } catch {} await sleep(250); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); });
  const cdp = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (expr) => (await cdp("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
  for (const step of process.argv.slice(2).length ? process.argv.slice(2) : ["consent", "chat", "labs"]) {
    await cdp("Page.navigate", { url: `http://127.0.0.1:8787/__harness.html?s=${step}` });
    let out = "";
    for (let i = 0; i < 80 && !out; i++) { await sleep(250); out = await evalJs("document.getElementById('OUT')?.textContent || ''"); }
    const r = out ? JSON.parse(out) : {};
    const checks = {
      consent: [["Açık rıza penceresi açıldı", r.consentShown], ["Kutu işaretlenmeden onay pasif", r.okDisabledBeforeTick]],
      chat: [["Rıza kaydedildi", r.consentStored], ["Asistan kullanılabilir", r.unavailableHidden], ["Güvenlik testi gizli", r.riskBtnHidden],
             ["Aciliyet göstergesi", r.gauge], ["Bölüm: Aile Hekimliği", r.dept === "Aile Hekimliği"], ["Cevap metni", /sahte/.test(r.answer || "")], ["Sohbet kaydedildi (2 mesaj)", r.saved === 2]],
      labs: [["Tahlil fotoğrafı okundu", r.reviewRows === 1], ["Onay tablosu", /değer okundu/.test(r.status || "")]],
    }[step];
    checks.forEach(([n, c]) => { console.log(`${c ? "✓" : "✗"} ${step}: ${n}`); if (!c) failed++; });
    if (checks.some(([, c]) => !c)) console.log("   ", out);
  }
  ws.close();
} catch (e) { console.error(e); failed++; }
finally { chrome.kill(); console.log(failed ? `\n${failed} kontrol BAŞARISIZ` : "\nTarayıcı kontrolleri geçti"); process.exit(failed ? 1 : 0); }

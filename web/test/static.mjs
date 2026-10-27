// Ücretsiz statik sitenin (web/site) tarayıcı testi. GitHub Pages gibi alt yolda sunar:
//   http://127.0.0.1:8790/tibbi-yapay-zeka-asistani/
// Kullanım: node build.mjs --static && node test/static.mjs [ekran-goruntusu-klasoru]
import http from "node:http";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "../site");
const PREFIX = "/tibbi-yapay-zeka-asistani/";
const shotsDir = process.argv[2];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".md": "text/plain; charset=utf-8" };
const requests = [], notFound = [];
const server = http.createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  requests.push(`${req.method} ${path}`);
  if (!path.startsWith(PREFIX)) { notFound.push(path); res.writeHead(404).end(); return; }
  let rel = normalize(path.slice(PREFIX.length)); if (!rel || rel.endsWith("/") || rel === ".") rel = join(rel, "index.html");
  try { const body = await readFile(join(site, rel)); res.writeHead(200, { "content-type": TYPES[extname(rel)] || "application/octet-stream" }).end(body); }
  catch { notFound.push(path); res.writeHead(404).end(); }
}).listen(8790, "127.0.0.1");

const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9334", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", `--user-data-dir=${await mkdtemp(join(tmpdir(), "nabiz-st-"))}`, "about:blank"], { stdio: "ignore" });
let failed = 0;
const ok = (n, c, extra = "") => { console.log(`${c ? "✓" : "✗"} ${n}${extra ? " · " + extra : ""}`); if (!c) failed++; };
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) { try { target = (await (await fetch("http://127.0.0.1:9334/json")).json()).find((t) => t.type === "page"); } catch {} await sleep(250); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); });
  const cdp = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async (expr) => (await cdp("Runtime.evaluate", { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const shot = async (name) => { if (!shotsDir) return; const r = await cdp("Page.captureScreenshot", { format: "png" }); await writeFile(join(shotsDir, name), Buffer.from(r.result.data, "base64")); };

  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await cdp("Page.navigate", { url: `http://127.0.0.1:8790${PREFIX}` });
  for (let i = 0; i < 40; i++) { await sleep(250); if (await js(`return document.getElementById("libInfo")?.textContent.includes("kaynak özeti")`)) break; }
  await sleep(1500);

  const r1 = await js(`const u = document.getElementById("unavailable"); return { shown: !u.hidden, text: u.textContent, link: u.querySelector("a")?.href, hint: document.querySelector(".hint").textContent }`);
  ok("Ücretsiz sürüm bilgisi görünüyor", r1.shown && /Ücretsiz sürüm/.test(r1.text));
  ok("Asistanlı sürüm linki", r1.link === "https://claude.ai/artifact/Sfo2aqbSsn4ie9zMLLiFd6");
  ok("Gizlilik metni (hiçbir yere gönderilmez)", /hiçbir yere gönderilmez/.test(r1.hint));
  ok("claude.ai'ye özgü metin kalmadı", !(await js(`return document.body.innerText.includes("Claude hesabınız üzerinden")`)));

  await shot("st-acilis.png");
  const r2 = await js(`const p = document.getElementById("prompt"); p.value = "Başım ağrıyor, ışıktan rahatsız oluyorum"; p.dispatchEvent(new Event("input"));
    const enabled = !document.getElementById("sendBtn").disabled; document.getElementById("sendBtn").click(); await new Promise((r) => setTimeout(r, 400));
    const card = [...document.querySelectorAll(".lib-card")].at(-1);
    return { enabled, srcs: card?.querySelectorAll(".src-card").length, first: card?.querySelector(".src-card a")?.textContent, ask: card?.querySelector("a.btn.primary")?.href, copy: Boolean([...card?.querySelectorAll("button") || []].find((b) => b.textContent === "Sorumu kopyala")) }`);
  ok("Gönder düğmesi açık", r2.enabled);
  ok("Kütüphane cevabı geldi", r2.srcs >= 2, `${r2.srcs} kaynak, ilki: ${r2.first}`);
  ok("Kaynaklar ilgili (migren/baş ağrısı)", /Migren|Baş Ağrısı|Headache|Migraine/i.test(r2.first || ""));
  ok("Asistana sor düğmesi", r2.ask === "https://claude.ai/artifact/Sfo2aqbSsn4ie9zMLLiFd6");
  await js(`document.getElementById("chat").scrollTop = 1e6`); await sleep(300); await shot("st-kutuphane-cevabi.png");

  const r3 = await js(`document.getElementById("newChat").click(); await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.region-btn[data-region="mide"]').click(); await new Promise((r) => setTimeout(r, 100));
    [...document.querySelectorAll(".complaint")].find((b) => b.textContent === "Mide yanması").click(); await new Promise((r) => setTimeout(r, 100));
    document.querySelector(".form-col form.cform button[type=submit]").click(); await new Promise((r) => setTimeout(r, 400));
    const card = [...document.querySelectorAll(".lib-card")].at(-1); return { srcs: card?.querySelectorAll(".src-card").length, first: card?.querySelector(".src-card a")?.textContent }`);
  ok("Vücut haritasından şikayet → ilgili kaynak", r3.srcs >= 1 && /Reflü|Gastrit|GERD/i.test(r3.first || ""), r3.first);

  const r4 = await js(`document.getElementById("labsBtn").click(); await new Promise((r) => setTimeout(r, 200));
    const btns = [...document.querySelectorAll("#sheetBody button")]; const upload = btns.find((b) => /PDF/.test(b.textContent));
    btns.find((b) => b.textContent === "+ Elle ekle").click(); await new Promise((r) => setTimeout(r, 100));
    const add = async (t, test, v) => { const F = document.querySelector(".lh-manual").elements; F.tarih.value = t; F.test.value = test; F.deger.value = v; F.birim.value = "g/dL"; F.alt.value = "12"; F.ust.value = "16";
      document.querySelector(".lh-manual button[type=submit]").click(); await new Promise((r) => setTimeout(r, 100)); };
    await add("2026-03-01", "Hemoglobin", "11,2");
    [...document.querySelectorAll("#sheetBody button")].find((b) => b.textContent === "+ Elle ekle").click(); await new Promise((r) => setTimeout(r, 100));
    await add("2026-09-15", "Hemoglobin", "12,6");
    const items = document.querySelectorAll(".lh-item").length; document.querySelector(".lh-item").click(); await new Promise((r) => setTimeout(r, 150));
    return { uploadHidden: !upload || upload.hidden, items, rows: document.querySelectorAll("#sheetBody .lh-table tbody tr").length, chart: Boolean(document.querySelector(".lh-svg polyline")), askHidden: [...document.querySelectorAll("#sheetBody button")].every((b) => b.hidden || !/yorumlat/.test(b.textContent)), stored: JSON.parse(localStorage.getItem("nabiz.labs.v1")).map((x) => x.deger) }`);
  ok("PDF yükleme gizli (asistan yok)", r4.uploadHidden);
  ok("Elle tahlil girişi", r4.items === 1 && r4.rows === 2, JSON.stringify(r4.stored));
  ok("Virgüllü değer sayıya çevrildi", r4.stored?.includes(11.2) && r4.stored?.includes(12.6));
  ok("Tarih grafiği çizildi", r4.chart);
  ok("Yapay zekâ düğmeleri gizli", r4.askHidden);
  await shot("st-tahlil.png");

  const r6 = await js(`document.getElementById("sheetClose").click(); document.getElementById("logBtn").click(); await new Promise((r) => setTimeout(r, 200));
    const wait = () => new Promise((r) => setTimeout(r, 120));
    const fill = async (vals) => { const F = document.querySelector(".lg-form").elements; Object.entries(vals).forEach(([k, v]) => { F[k].value = v; }); document.querySelector(".lg-form button[type=submit]").click(); await wait(); };
    await fill({ b: "128", k: "82", nabiz: "70", tarih: "2026-10-20", saat: "08:00" });
    await fill({ b: "186", k: "121", tarih: "2026-10-27", saat: "08:10" });
    const bp = { warn: document.querySelector("#sheetBody .er-warn")?.textContent || "", chip: document.querySelector(".lg-last .lab-chip")?.textContent, lines: document.querySelectorAll(".lg-line").length, rows: document.querySelectorAll("#sheetBody .lh-table tbody tr").length };
    await fill({ b: "80", k: "90", tarih: "2026-10-27", saat: "09:00" });
    const err = document.querySelector(".lg-err")?.textContent;
    document.querySelector('.tab[data-tur="seker"]').click(); await wait();
    await fill({ deger: "62", durum: "aclik", tarih: "2026-10-27", saat: "07:30" });
    const sugarWarn = document.querySelector("#sheetBody .er-warn")?.textContent || "";
    document.querySelector('.tab[data-tur="kilo"]').click(); await wait();
    await fill({ kg: "81,4", tarih: "2026-10-01", saat: "07:00" }); await fill({ kg: "79,9", tarih: "2026-10-27", saat: "07:00" });
    const kilo = document.querySelector(".lg-last")?.textContent;
    return { bp, err, sugarWarn, kilo, stored: JSON.parse(localStorage.getItem("nabiz.log.v1")).length, sum: document.getElementById("logSum").textContent, askHidden: [...document.querySelectorAll("#sheetBody button")].every((b) => b.hidden || !/yorumlat/.test(b.textContent)) }`);
  ok("Günlük: tansiyon kaydı ve iki seri grafik", r6.bp.rows === 2 && r6.bp.lines === 2, JSON.stringify(r6.bp).slice(0, 120));
  ok("Günlük: 180/120 üstünde 112 uyarısı", /112/.test(r6.bp.warn) && r6.bp.chip === "Çok yüksek");
  ok("Günlük: hatalı tansiyon reddedildi", /Büyük tansiyon/.test(r6.err || ""), r6.err);
  ok("Günlük: düşük şeker uyarısı", /15 gram/.test(r6.sugarWarn));
  ok("Günlük: kilo değişimi", /−?-?1,5 kg/.test(r6.kilo || ""), r6.kilo);
  ok("Günlük: saklandı ve panel özeti", r6.stored === 5 && /5 ölçüm/.test(r6.sum), r6.sum);
  ok("Günlük: yapay zekâ düğmesi gizli", r6.askHidden);
  await shot("st-gunluk.png");

  const r8 = await js(`document.getElementById("sheetClose").click(); document.getElementById("interactBtn").click(); await new Promise((r) => setTimeout(r, 200));
    return { warn: document.querySelector("#sheetBody .er-warn")?.textContent || "", link: document.querySelector("#sheetBody a.btn")?.href, form: Boolean(document.querySelector(".ix-add")) }`);
  ok("İlaç etkileşimi: asistansız sürümde yönlendirme", /asistan gerektirir/.test(r8.warn) && r8.link === "https://claude.ai/artifact/Sfo2aqbSsn4ie9zMLLiFd6" && !r8.form);

  const r5 = await js(`const reg = await navigator.serviceWorker.getRegistration(); return { scope: reg?.scope, models: performance.getEntriesByType("resource").some((e) => e.name.endsWith("models/muscles.json")) }`);
  ok("Çevrimdışı önbellek alt yolda kayıtlı", (r5.scope || "").endsWith(PREFIX), r5.scope);
  ok("3D model yüklendi", r5.models);
  ok("Sunucuya API isteği gitmedi", !requests.some((x) => x.includes("/api/")));
  const missing = notFound.filter((p) => !p.endsWith("/favicon.ico"));   // tarayıcının kendiliğinden istediği favicon.ico hariç
  ok("Eksik dosya yok (404)", missing.length === 0, missing.join(", "));

  // İlk yardım kartları: internet yokken (servis çalışanı önbelleğinden) açılmalı
  await cdp("Network.enable");
  await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp("Page.reload", { ignoreCache: false }); await sleep(2500);
  const r7 = await js(`document.getElementById("tab-aid").click(); await new Promise((r) => setTimeout(r, 150));
    const cards = document.querySelectorAll("#panel-aid .aid-card"); document.querySelector('#panel-aid .aid-card[data-aid="tyd"]').click(); await new Promise((r) => setTimeout(r, 200));
    const d = document.querySelector("#sheetBody .aid-detail");
    return { cards: cards.length, shown: !document.getElementById("panel-aid").hidden, title: d?.querySelector(".aid-title")?.textContent, steps: d?.querySelectorAll(".aid-steps li").length, tel: d?.querySelector(".aid-tels a")?.getAttribute("href"), src: d?.querySelectorAll(".aid-src a").length }`);
  ok("Çevrimdışı: sayfa ve ilk yardım kartları açıldı", r7?.shown && r7.cards === 15, JSON.stringify(r7));
  ok("İlk yardım kartı: adımlar, 112 ve kaynak", r7?.steps >= 5 && r7.tel === "tel:112" && r7.src === 2);
  await shot("st-ilkyardim.png");
  await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  ws.close();
} catch (e) { console.error(e); failed++; }
finally { chrome.kill(); server.close(); console.log(failed ? `\n${failed} kontrol BAŞARISIZ` : "\nStatik site kontrolleri geçti"); process.exit(failed ? 1 : 0); }

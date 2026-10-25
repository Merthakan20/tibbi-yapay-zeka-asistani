// Web sürümünü üretir: artifact/nabiz.html + köprü + PWA dosyaları → web/dist
// Kullanım: node build.mjs   (npm run build / dev / deploy bunu kendisi çalıştırır)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = join(here, "dist");

let page = readFileSync(join(root, "artifact/nabiz.html"), "utf8");

// claude.ai'ye özgü metinler web sürümünde değişir. Bulunamayan metin derlemeyi durdurur.
const REPLACE = [
  ["Sorularınız Claude hesabınız üzerinden yanıtlanır. Sohbet ve belgeler yalnızca bu tarayıcıda saklanır.",
   `Sorularınız yanıtlanmak için Claude'a (Anthropic) iletilir, sunucumuzda saklanmaz. Sohbet ve belgeler yalnızca bu cihazda tutulur. <a href="/kvkk.html" style="color:inherit">Aydınlatma metni</a>`],
  ["Asistan yalnızca claude.ai içinde açıldığında çalışır ve sorular sizin Claude hesabınız üzerinden yanıtlanır.",
   "Asistana şu anda ulaşılamıyor. Lütfen biraz sonra tekrar deneyin; kaynak kütüphanesi ve vücut haritası kullanılabilir."],
  ["soru sorduğunuzda asistana sizin Claude hesabınız üzerinden gönderilir.",
   "soru sorduğunuzda yanıt üretilmesi için Claude'a (Anthropic) iletilir."],
  ["Belge, değerleri okumak için Claude hesabınıza gönderilir;",
   "Belge, değerleri okumak için Claude'a (Anthropic) gönderilir;"],
  [`not_granted: "Bu sayfanın Claude'u kullanmasına izin verilmedi. Sayfayı yeniden açıp izin verebilirsiniz.",`,
   `not_granted: "Asistan şu anda kullanılamıyor.",`],
  [`sampling_disabled: "Claude bu hesap için kullanılamıyor.",`,
   `sampling_disabled: "Asistan hizmeti şu anda kapalı. Lütfen daha sonra tekrar deneyin.",`],
  [`session_expired: "Oturumunuz sona ermiş. claude.ai'ye yeniden giriş yapıp sayfayı yenileyin.",`,
   `session_expired: "Bağlantı yenilenmeli. Sayfayı yenileyin.",`],
  [`rate_limited: "Kullanım sınırına ulaşıldı. Biraz bekleyip tekrar deneyin.",`,
   `rate_limited: "Çok sık soru gönderildi ya da günlük kullanım sınırına ulaşıldı. Bir dakika bekleyip tekrar deneyin.",`],
  [`"Planınız derin analiz modeline izin vermediği için standart model yanıtladı."`,
   `"Derin analiz şu anda kullanılamadı; standart analizle yanıtlandı."`],
];
for (const [from, to] of REPLACE) {
  const n = page.split(from).length - 1;
  if (n !== 1) throw new Error(`Değiştirilecek metin ${n} kez bulundu (1 bekleniyordu):\n${from}`);
  page = page.replace(from, () => to);
}

const head = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Güvenilir kaynaklara dayanan Türkçe tıbbi bilgi asistanı. Şikayetinizin aciliyetini, hangi bölüme gitmeniz gerektiğini ve tahlil sonuçlarınızı anlatır. Muayenenin yerini tutmaz.">
<meta name="theme-color" content="#0e1412">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Nabız">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>
/* Web sürümü: açık rıza penceresi */
#kvkk { position: fixed; inset: 0; z-index: 100; background: rgba(6, 12, 10, .62); display: grid; place-items: center; padding: 16px; }
#kvkk .kv-panel { width: min(520px, 100%); max-height: calc(100dvh - 32px); overflow-y: auto; background: var(--surface, #151d1a); color: var(--ink, #e3ebe7); border: 1px solid var(--line, #2a3632); border-radius: 16px; padding: 22px 20px; box-shadow: 0 20px 60px rgba(0,0,0,.4); font: 15px/1.55 var(--f-body, system-ui, sans-serif); }
#kvkk h2 { font: 700 22px/1.2 var(--f-display, system-ui); margin: 0 0 10px; }
#kvkk p { margin: 0 0 12px; color: var(--ink-2, #9aaca5); } #kvkk p b { color: var(--ink, #e3ebe7); }
#kvkk a { color: var(--accent, #4cc2a0); }
#kvkk .kv-check { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; margin: 14px 0 16px; cursor: pointer; }
#kvkk .kv-check input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--accent, #4cc2a0); flex: none; }
#kvkk .kv-act { display: flex; gap: 8px; flex-wrap: wrap; }
#kvkk button { border-radius: 9px; padding: 10px 16px; font: 500 15px var(--f-body, system-ui); border: 1px solid var(--line, #2a3632); background: transparent; color: var(--ink, #e3ebe7); cursor: pointer; }
#kvkk #kvkkOk { background: var(--accent, #4cc2a0); border-color: var(--accent, #4cc2a0); color: var(--accent-ink, #062019); }
#kvkk #kvkkOk:disabled { opacity: .45; cursor: not-allowed; }
</style>
<script src="/bridge.js"></script>
</head>
<body>
`;
const tail = `
<script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));</script>
</body>
</html>
`;
const html = head + page + tail;

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "models"), { recursive: true });
cpSync(join(here, "static"), dist, { recursive: true });
writeFileSync(join(dist, "index.html"), html);
const lib = readFileSync(join(root, "kaynaklar/kaynaklar.json"));
writeFileSync(join(dist, "kaynaklar.json"), lib);
for (const f of ["muscles.json", "bones.json", "LICENSE.md"]) copyFileSync(join(root, "artifact/models", f), join(dist, "models", f));

// Her yayında önbellek sürümü değişsin
const surum = createHash("sha256").update(html).update(lib).update(readFileSync(join(here, "static/bridge.js"))).digest("hex").slice(0, 12);
const swPath = join(dist, "sw.js");
writeFileSync(swPath, readFileSync(swPath, "utf8").replaceAll("__SURUM__", surum));
console.log(`web/dist hazır · sürüm ${surum} · ${REPLACE.length} metin uyarlandı`);

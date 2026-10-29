// Nabız'ın web sürümlerini üretir (artifact/nabiz.html değişmeden sarılır):
//   node build.mjs           → web/dist  Cloudflare Workers sürümü: asistan sunucu üzerinden (API anahtarı gerekir)
//   node build.mjs --static  → web/site  Ücretsiz statik site (GitHub Pages): asistan yok, sorulara kütüphaneden
//                                        kaynaklar gösterilir, "Asistana sor" claude.ai sürümünü açar
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const STATIC = process.argv.includes("--static");
const out = join(here, STATIC ? "site" : "dist");
// claude.ai sürümünün herkese açık linki (Share › "anyone with the link" yapılmış olmalı)
const ASISTAN_URL = process.env.NABIZ_ASISTAN_URL || "https://claude.ai/artifact/Sfo2aqbSsn4ie9zMLLiFd6";

let page = readFileSync(join(root, "artifact/nabiz.html"), "utf8");

// claude.ai'ye özgü metinler. Bulunamayan metin derlemeyi durdurur (sayfa değişirse sessizce eski metin kalmasın).
const REPLACE_WORKER = [
  ["Sorularınız Claude hesabınız üzerinden yanıtlanır. Sohbet ve belgeler yalnızca bu tarayıcıda saklanır.",
   `Sorularınız yanıtlanmak için Claude'a (Anthropic) iletilir, sunucumuzda saklanmaz. Sohbet ve belgeler yalnızca bu cihazda tutulur. <a href="kvkk.html" style="color:inherit">Aydınlatma metni</a>`],
  ["Asistan yalnızca claude.ai içinde açıldığında çalışır ve sorular sizin Claude hesabınız üzerinden yanıtlanır.",
   "Asistana şu anda ulaşılamıyor. Sorularınıza kütüphaneden kaynaklar gösterilir; biraz sonra tekrar deneyin."],
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
const REPLACE_STATIC = [
  ["Sorularınız Claude hesabınız üzerinden yanıtlanır. Sohbet ve belgeler yalnızca bu tarayıcıda saklanır.",
   "Bu site tamamen tarayıcınızda çalışır; yazdıklarınız hiçbir yere gönderilmez. Sohbet, profil, tahlil geçmişi ve sağlık günlüğü yalnızca bu cihazda tutulur."],
  ["Asistan yalnızca claude.ai içinde açıldığında çalışır ve sorular sizin Claude hesabınız üzerinden yanıtlanır.",
   `<b>Ücretsiz sürüm:</b> asistan yok, sorularınıza kütüphaneden kaynaklar gösterilir. <a href="${ASISTAN_URL}" target="_blank" rel="noopener" style="color:var(--accent);white-space:nowrap">Asistanlı sürüm ↗</a>`],
  ["Bu bilgiler yalnızca bu tarayıcıda saklanır ve soru sorduğunuzda asistana sizin Claude hesabınız üzerinden gönderilir. Boş bıraktığınız alanlar gönderilmez.",
   "Bu bilgiler yalnızca bu tarayıcıda saklanır; bu sürümde hiçbir yere gönderilmez."],
];
for (const [from, to] of STATIC ? REPLACE_STATIC : REPLACE_WORKER) {
  const n = page.split(from).length - 1;
  if (n !== 1) throw new Error(`Değiştirilecek metin ${n} kez bulundu (1 bekleniyordu):\n${from}`);
  page = page.replace(from, () => to);
}

const description = STATIC
  ? "Türkçe tıbbi bilgi kütüphanesi: 3D vücut haritası, güvenilir kaynak özetleri ve tahlil geçmişi grafiği. Muayenenin yerini tutmaz."
  : "Güvenilir kaynaklara dayanan Türkçe tıbbi bilgi asistanı. Şikayetinizin aciliyetini, hangi bölüme gitmeniz gerektiğini ve tahlil sonuçlarınızı anlatır. Muayenenin yerini tutmaz.";
const consentCss = `<style>
/* Açık rıza penceresi (yalnızca asistanlı web sürümü) */
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
<script src="bridge.js"></script>`;

const head = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${description}">
<meta name="theme-color" content="#0e1412">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Nabız">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${STATIC ? `<script>window.NABIZ_ASISTAN_URL = ${JSON.stringify(ASISTAN_URL)};</script>
<style>#unavailable { font-size: 13px; line-height: 1.4; padding: 7px 12px; margin-top: 8px; }</style>` : consentCss}
</head>
<body>
`;
const tail = `
<script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>
</body>
</html>
`;
const html = head + page + tail;

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "models"), { recursive: true });
cpSync(join(here, "static"), out, { recursive: true });
if (STATIC) for (const f of ["bridge.js", "kvkk.html"]) rmSync(join(out, f));
writeFileSync(join(out, "index.html"), html);
const lib = readFileSync(join(root, "kaynaklar/kaynaklar.json"));
writeFileSync(join(out, "kaynaklar.json"), lib);
for (const f of ["muscles.json", "bones.json", "LICENSE.md"]) copyFileSync(join(root, "artifact/models", f), join(out, "models", f));
// İlk yardım fotoğrafları (kartlarda; çevrimdışı önbelleğe de alınır)
cpSync(join(root, "artifact/ilkyardim"), join(out, "ilkyardim"), { recursive: true });
const aidPhotos = readdirSync(join(root, "artifact/ilkyardim")).filter((f) => f.endsWith(".jpg")).sort().map((f) => "ilkyardim/" + f);
if (STATIC) writeFileSync(join(out, ".nojekyll"), "");   // GitHub Pages dosyaları olduğu gibi sunsun

// Çevrimdışı önbellek: sürüm her yayında değişir; açılışta önbelleğe alınacak dosyalar hedefe göre
const shell = STATIC
  ? ["./", "kaynaklar.json", "manifest.webmanifest", "icons/icon-192.png", ...aidPhotos]
  : ["./", "bridge.js", "kaynaklar.json", "manifest.webmanifest", "kvkk.html", "icons/icon-192.png", ...aidPhotos];
const hash = createHash("sha256").update(html).update(lib).update(readFileSync(join(here, "static/bridge.js")));
for (const f of aidPhotos) hash.update(readFileSync(join(out, f)));
const surum = hash.digest("hex").slice(0, 12);
const swPath = join(out, "sw.js");
writeFileSync(swPath, readFileSync(swPath, "utf8").replaceAll("__SURUM__", surum).replaceAll("__SHELL__", JSON.stringify(shell)));
console.log(`web/${STATIC ? "site" : "dist"} hazır · ${STATIC ? "ücretsiz statik site" : "Workers sürümü"} · sürüm ${surum}`);

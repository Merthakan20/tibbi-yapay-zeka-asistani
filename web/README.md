# Nabız web uygulaması (Cloudflare Workers)

claude.ai sayfasının (`artifact/nabiz.html`) kendi adresinde, telefona kurulabilen (PWA) sürümü. Sayfa kodu **değişmez**; `build.mjs` onu sarar.

| Dosya | Görev |
|---|---|
| `build.mjs` | `artifact/nabiz.html` + `static/` + kütüphane + 3D modeli `dist/`'e derler; claude.ai'ye özgü metinleri uyarlar (bulamazsa durur). |
| `static/bridge.js` | claude.ai'nin `window.claude` arayüzünü taklit eder: `sample` → `/api/sample`, indirme, KVKK açık rıza penceresi. |
| `worker/index.js` | Statik dosyaları sunar; `/api/sample` soruları Anthropic API'ye iletir (SSE). API anahtarı yalnızca burada. |
| `static/kvkk.html` | Aydınlatma metni taslağı. **Köşeli parantezli alanları doldurun, hukukçuya kontrol ettirin.** |
| `static/manifest.webmanifest`, `sw.js`, `icons/` | Telefona kurulum ve çevrimdışı açılış. |
| `test/` | Sahte Anthropic sunucusuyla yerel testler (kredi harcamaz). |

## Ayarlar (`wrangler.jsonc`)
- `MODEL`: varsayılan `claude-opus-5` ($5 / $25, 1M token). Daha ucuzu `claude-sonnet-5` ($2 / $10).
- `MAX_TOKENS`: cevap uzunluğu üst sınırı (16000).
- `ratelimits`: IP başına 60 saniyede 8 istek.
- Güvenlik filtresi bir isteği reddederse `fallbacks: "default"` ile sunucu tarafında uygun modelle yeniden denenir.
- Derin analiz düğmesi aynı modelde düşünme derinliğini artırır (`medium` → `high`).

## İlk yayın
```bash
cd web
npm install
npx wrangler login                          # tarayıcıda Cloudflare hesabınızla giriş
npx wrangler secret put ANTHROPIC_API_KEY   # anahtarı terminale siz yapıştırın
npm run deploy                              # https://nabiz.<hesabınız>.workers.dev
```
Anthropic Console'da **aylık harcama sınırı** koymayı unutmayın; maliyetin asıl güvencesi budur.

## Güncelleme ve test
- Sayfa değişince: `npm run deploy` (claude.ai sürümü ayrıca Artifact aracıyla yayınlanır).
- Yerel test: `npm test` (sunucu, 25 kontrol). Tarayıcı testi: `test/browser.mjs` (sahte Anthropic ve `wrangler dev` açıkken). Hız sınırı nedeniyle test grupları arasında 1 dakika bekleyin.

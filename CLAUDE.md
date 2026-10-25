# Nabız — Tıbbi Yapay Zeka Asistanı

Türkçe tıbbi bilgi asistanı. Kullanıcıyla Türkçe konuşulur.

## Bağlantılar
- **Canlı sayfa (asıl ürün):** https://claude.ai/artifact/Sfo2aqbSsn4ie9zMLLiFd6 (özel; sahibi görebilir)
- **GitHub (private):** https://github.com/Merthakan20/tibbi-yapay-zeka-asistani

## Mimari
İki sürüm var; **kullanılan sürüm claude.ai sayfası**.

| Sürüm | Dosyalar | Not |
|---|---|---|
| claude.ai artifact | `artifact/nabiz.html` (tek dosya) + `artifact/models/*.json` + `kaynaklar/kaynaklar.json` | Claude'a `sample` capability ile kullanıcının aboneliği üzerinden sorar. API anahtarı gerekmez. |
| Streamlit + Claude API | `app.py`, `asistan/` | Çalışır ama API kredisi yok (2026-10-24'te bakiye 0). Canlı web araması yalnızca burada. |

### Sayfanın bileşenleri (`artifact/nabiz.html`)
- Sohbet: `sample()` ile, talimat metni `RULES` sabitinde. Cevabın ilk satırı `ACİLİYET: evde|aile-hekimi|ayni-gun|acil` olursa 4 basamaklı aciliyet göstergesi çizilir.
- Tahlil grafiği: Claude değerleri ```` ```tahlil ```` JSON bloğunda verir, sayfa referans aralığı çubuklarına çevirir.
- Tahlil yükleme: PDF metni pdf.js ile çıkarılır; taranmış PDF ve fotoğraflar görsel olarak gönderilir.
- Kaynak kütüphanesi: `kaynaklar.json` sayfayla birlikte yayınlanır, BM25 ile aranır (anahtar kelimeler 3 kat ağırlıklı, en iyi sonucun %40'ının altı elenir). Cevaplarda [1], [2] kaynak linkleri.
- Kendi belgelerim: kullanıcı PDF/TXT/MD ekler, tarayıcıda (localStorage) saklanır.
- 3D vücut haritası (Three.js r128, cdnjs + jsdelivr): `buildBody3D()`. Gerçek kas+kemik modeli `models/muscles.json` ve `models/bones.json` içinde **base64 GLB** olarak durur (artifact servisi .glb sunmuyor), `GLTFLoader.parse` ile açılır. Yüklenemezse kodla çizilen yedek model, WebGL yoksa 2D SVG harita (`makeBodySvg`) kullanılır. 16 bölge `REGIONS` dizisinde; organlar ayrı tıklanabilir, diğer bölgeler dokunulan noktanın konumundan bulunur.
- Açılış ekranı 3 sütun: model | bölge ve şikayetler | şikayet formu (sağda, sticky).
- Konu kütüphanesi: kategori kartları, konuya tıklayınca kaynaklar.

### 3D model lisansı
`artifact/models/` — lucgrn3/anatomy-models, **CC BY-SA 4.0** (Z-Anatomy, BodyParts3D, NIH 3D). Künye sayfada gösteriliyor; ayrıntı `artifact/models/LICENSE.md`. Künye kaldırılmamalı.

## Sık işler

### Sayfayı yayınlamak (aynı linki günceller)
Artifact aracıyla `artifact/nabiz.html` yayınlanır; `files` içinde şunlar verilmeli:
`kaynaklar.json` → `kaynaklar/kaynaklar.json`, `models/muscles.json`, `models/bones.json`, `models/LICENSE.md`.
Yeni bir oturumdan güncellerken `url` olarak yukarıdaki artifact linki verilir (önce `read` edilir).

### Kütüphaneye konu eklemek
1. Her konu için 1 Türk kaynağı (saglik.gov.tr, Acıbadem, Medical Park, üniversite) + 1 MedlinePlus bulunur, özetler kendi cümlelerimizle yazılır.
2. Kayıtlar bir JSON listesine yazılır, `.venv/bin/python kaynaklar/ekle.py dosya.json` ile eklenir (alanları doğrular, tarihi günceller).
3. memorial.com.tr otomatik erişimi engelliyor (403) — kullanılmıyor.
4. Özetleri çıkaran model bazen sayı/ifade hatası yapıyor; sayılar kaynağıyla karşılaştırılmalı.

### Yerel test
- JS sözdizimi: `<script>` bloğunu çıkarıp `node --check`.
- Görsel: Chrome headless (`--use-angle=swiftshader --enable-unsafe-swiftshader`), model yüklemesi için klasörü `python3 -m http.server` ile sunmak gerekir (file:// fetch'e izin vermez).

## Nerede kaldık (2026-10-25)
**Durum:** 106 konu / 211 kaynak; 3D gerçek anatomi modeli; belirgin 112 uyarısı (üstte); şikayet formu sağda. Son sürüm: artifact v11, commit `4757389`.

**Doğrulanmamış olanlar:**
- Asistanın gerçek bir soruya baştan sona cevap verdiği henüz test edilmedi (kullanıcının sayfada denemesi gerekiyor).
- 3D modelin son parlaklık ayarı (kas alpha 0.28) ve telefonda görünüm görülmedi.
- 3D'de kol/bacak gibi bölgeler seçilince model üzerinde ayrıca vurgulanmıyor (yalnızca organlar).

**Önerilen sonraki adımlar** (kullanıcıya sunuldu, seçim bekleniyor):
1. Hasta profili (yaş, kronik hastalık, ilaçlar, alerjiler → her soruya otomatik eklenir) — önerilen
2. Doktora götürülecek özet (indirilebilir) — önerilen
3. Sağlık günlüğü (tansiyon, şeker, kilo) ve grafikler
4. İlaç etkileşim kontrolü
5. Tahlil karşılaştırma (tarihler arası grafik)
6. Çevrimdışı ilk yardım kartları
7. Asistanın güvenlik testi (zor/riskli sorular)
8. Kütüphaneyi büyütme, daha fazla üniversite kaynağı

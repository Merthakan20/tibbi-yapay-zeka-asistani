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
- Kaynak kütüphanesi: `kaynaklar.json` sayfayla birlikte yayınlanır, BM25 ile aranır (anahtar kelimeler 3 kat ağırlıklı, en iyi sonucun %40'ının altı elenir). Kelimeler `stem()` ile köke indirilir: Türkçe ekler ayıklanır ("başım ağrıyor" = "baş ağrısı"), sondaki d/t düşer, ğ→k, ilk 6 harf; düzensiz biçimler `DROPPED` (karnım→karın, kalbim→kalp), kısaltılmayacak kökler `KEEP` (makat, boyun…); genel sözcükler `STOP`/`FILLER` ile atılır. Kütüphane kaynağı ancak sorudaki bir sözcük konusunda/anahtar kelimelerinde geçiyorsa sonuç olur (özet metninde geçmesi yetmez). Arama değişikliğinden sonra eski/yeni sonuçları karşılaştır (kök hataları sessizce kaynak kaybettirir). Cevaplarda [1], [2] kaynak linkleri.
- Kendi belgelerim: kullanıcı PDF/TXT/MD ekler, tarayıcıda (localStorage) saklanır.
- 3D vücut haritası (Three.js r128, cdnjs + jsdelivr): `buildBody3D()`. Gerçek kas+kemik modeli `models/muscles.json` ve `models/bones.json` içinde **base64 GLB** olarak durur (artifact servisi .glb sunmuyor), `GLTFLoader.parse` ile açılır. Yüklenemezse kodla çizilen yedek model, WebGL yoksa 2D SVG harita (`makeBodySvg`) kullanılır. 16 bölge `REGIONS` dizisinde; organlar ayrı tıklanabilir, diğer bölgeler dokunulan noktanın konumundan bulunur.
- Açılış ekranı 3 sütun: model | bölge ve şikayetler | şikayet formu (sağda, sticky).
- Konu kütüphanesi: kategori kartları, konuya tıklayınca kaynaklar.
- Hasta profili (`profile`, localStorage `nabiz.profile.v1`): ad soyad (yalnızca PDF'te, Claude'a gönderilmez), yaş, cinsiyet, gebelik, kronik hastalık, ilaç, alerji. `trimmedTurns()` içinde talimat turuna `<hasta_profili>` olarak eklenir; şikayet formunu da doldurur.
- Randevu yönlendirmesi: aciliyet satırından sonra `BÖLÜM: <MHRS klinik adı>` satırı → `careBox()` önerilen bölüm + MHRS linki + ALO 182; acilde 112 butonu. MHRS/e-Nabız'ın açık API'si yok, randevu kullanıcı adına alınamaz.
- Tahlil geçmişi (`openLabs()`, localStorage `nabiz.labs.v1`): e-Nabız/laboratuvar PDF'i veya fotoğrafı `sample.json` + `EXTRACT_RULES` ile okunur (biçime bağlı ayrıştırıcı yok; `anahtar` alanı farklı laboratuvarlardaki aynı testi eşler), kayıttan önce onay tablosu gösterilir, test başına tarih grafiği (`trendChart`, eksen değerlere göre; referans sınırı yalnızca yakınsa eksene girer). Sohbetteki tahlil grafiğinde "Tahlil geçmişime ekle", doktor özetinde `<tahlil_gecmisi>`. Gerçek e-Nabız PDF'iyle henüz denenmedi.
- Güvenlik testi (yalnızca sahip, `isOwner()`): panelde "Güvenlik testi" düğmesi; `RISK_CASES` (23 vaka) gerçek akışla `sample`'a sorulur, kurallarla puanlanır, `db`'de `guvenlik/<runId>/sonuclar/<id>` altına yazılır (kural: kök read/write owner). Claude sonuçları `ArtifactData list` ile okur. Yayında capabilities: `{sample:{images:true}, downloads:true, user:{}, db:{rules:[{path:"",read:"owner",write:"owner"}]}}`.
- Doktora götürülecek özet: `openSummary()` yazışma + profilden `sample` ile özet yazar, `downloads` capability ile PDF indirir (pdfmake 0.2.10, cdnjs, ilk tıklamada yüklenir; Roboto Türkçe karakterleri destekler; yüklenemezse yazdırılabilir HTML). 

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
3. memorial.com.tr otomatik erişimi engelliyor (403) — kullanılmıyor. tektiklabilgielinde.saglik.gov.tr DNS'te çözülmüyor; ilk yardım için il/hastane saglik.gov.tr sayfaları kullanılıyor.
4. Özetleri çıkaran model bazen sayı/ifade hatası yapıyor; sayılar kaynağıyla karşılaştırılmalı.

### Yerel test
- JS sözdizimi: `<script>` bloğunu çıkarıp `node --check`.
- Headless Chrome'u `perl -e 'alarm 80; exec @ARGV' ...` ile sınırla (macOS'ta `timeout` yok). `python3 -m http.server` charset göndermediği için Türkçe bozulur; sahte `window.claude` ile testte `file://` kullan. `nabiz.html` içinde `</body>` yok (servis ekler), test betiğini dosyanın sonuna ekle.
- Görsel: Chrome headless (`--use-angle=swiftshader --enable-unsafe-swiftshader`), model yüklemesi için klasörü `python3 -m http.server` ile sunmak gerekir (file:// fetch'e izin vermez).
- Headless Chrome pencereyi en az 500 px açar; telefon (390 px) için sayfayı 390 px genişlikte bir iframe içinde açıp görüntüyü ortadan kırp.
- `paylasim/nabiz-linkedin.pdf`: LinkedIn için 8 sayfalık tanıtım (1080×1350). Ekran görüntülerindeki sohbetler sahte `window.claude` ile hazırlanmış örneklerdir (PDF'te belirtiliyor).

## Nerede kaldık (2026-10-25)
**Durum:** 124 konu / 249 kaynak; 3D gerçek anatomi modeli; belirgin 112 uyarısı (üstte); şikayet formu sağda. Son sürüm: artifact v22 — tahlil geçmişi + e-Nabız aktarımı, elektrolit konuları (sodyum, potasyum); v21 — güvenlik testi (2. tur 23/23; tek 'kaldı' kontrol hatasıydı), RULES'a kapsam/"siz" hitabı/ilgisiz kaynak kuralı, arama kök düzeltmeleri, hemoroid + anal fissür + makattan kanama; v18 — telefonda gönder düğmesinin taşması düzeltildi; telefonda (390 px) görünüm kontrol edildi; v17 — 10 konu: menenjit, kafa travması, kalp masajı (TYD), talasemi, gebelik şekeri, HbA1c, besin zehirlenmesi, göz kuruluğu, el-ayak-ağız, OKB; v16 — sırt ağrısı, kırık/çıkık/burkulma, aft konuları eklendi; v15 — kaynak aramasına Türkçe ek ayıklayıcı (baş ağrısı sorusunda kaynak bulunamama sorunu çözüldü); v14: profilde ad soyad, özet PDF; v13: hasta profili, randevu yönlendirmesi (MHRS/182/112), doktora götürülecek özet eklendi.

**Doğrulanmamış olanlar:**
- v13 özellikleri yalnızca sahte cevapla yerelde test edildi; gerçek Claude'un `BÖLÜM:` satırını yazması, özet kalitesi ve indirme claude.ai'de denenmedi.
- Asistan gerçek bir soruyu cevapladı (baş ağrısı, aciliyet göstergesi çalışıyor). Kaynak linkleri [1] o cevapta görülmedi.
- Telefonda aciliyet göstergesinin etiketleri (AİLE HEKİMİ / AYNI GÜN) birbirine çok yakın.
- 3D'de kol/bacak gibi bölgeler seçilince model üzerinde ayrıca vurgulanmıyor (yalnızca organlar).

**Önerilen sonraki adımlar** (kullanıcıya sunuldu, seçim bekleniyor):
1. ~~Tahlil geçmişi + e-Nabız aktarımı~~ (v22). Gerçek bir e-Nabız PDF'iyle denenmeli.
2. ~~Baş ağrısı sorusunda kaynak bulunamaması~~ (v15'te çözüldü; v16'da sırt ağrısı, kırık/burkulma, aft eklendi).
3. Sağlık günlüğü (tansiyon, şeker, kilo) ve grafikler
4. İlaç etkileşim kontrolü
5. ~~Tahlil karşılaştırma~~ (tahlil geçmişiyle birlikte geldi)
6. Çevrimdışı ilk yardım kartları
7. ~~Güvenlik testi~~ (v19-21'de yapıldı; yeni riskli vaka eklemek için `RISK_CASES`). Kütüphanede potasyum/elektrolit konusu yok (kritik tahlil sorusunda ilgisiz kaynak geliyor).
8. Kütüphaneyi büyütme, daha fazla üniversite kaynağı

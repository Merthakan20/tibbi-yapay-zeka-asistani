# 🩺 Tıbbi Yapay Zeka Asistanı

Claude (Anthropic) ile çalışan, Türkçe tıbbi bilgi asistanı.

> ⚠️ Bilgilendirme amaçlıdır, doktor muayenesinin yerini tutmaz. Acil durumda **112**.

## Özellikler
- **Semptom sohbeti:** olası nedenler, aciliyet düzeyi, hangi branşa gidileceği
- **İlaç bilgisi:** kullanım, yan etkiler, etkileşimler
- **Tahlil yorumlama:** PDF veya fotoğrafı sohbete sürükleyip bırakın
- **Güvenilir kaynak kütüphanesi:** Sağlık Bakanlığı, TİTCK, üniversite hastaneleri, özel hastaneler ve MedlinePlus'tan derlenmiş özetler; cevaplarda bağlantılı kaynak gösterilir
- **Kendi belgeleriniz (RAG):** `belgeler/` klasörüne eklenen PDF/TXT/MD dosyalarından alıntılı cevaplar
- **Canlı web araması (Streamlit, API kredisi gerekir):** yalnızca güvenilir alan adlarında (saglik.gov.tr, titck.gov.tr, üniversite ve hastane siteleri, MedlinePlus, WHO…)

## İki sürüm
| | claude.ai sayfası (`artifact/nabiz.html`) | Streamlit (`app.py`) |
|---|---|---|
| Maliyet | Claude aboneliğiyle çalışır | Anthropic API kredisi gerekir |
| Kaynak kütüphanesi | ✓ | ✓ |
| Canlı web araması | — | ✓ |
| Tahlil PDF/görsel | ✓ | ✓ |

## Kaynak kütüphanesi
`kaynaklar/kaynaklar.json` her iki sürüm tarafından kullanılır. Her kayıt: konu, anahtar kelimeler (halk ağzı ifadeler dahil),
kurum, kaynak türü (`resmi`, `universite`, `ozel`, `uluslararasi`), bağlantı ve Türkçe özet.

- Özetler kaynak sayfalardan kendi cümlelerimizle derlenmiştir; özel hastanelerin telifli metinleri kopyalanmaz, bağlantı verilir.
- Otomatik erişimi engelleyen siteler (ör. memorial.com.tr) kütüphaneye eklenmemiştir; canlı aramada yer alır.
- Yeni konu eklemek için aynı yapıda kayıt ekleyip `guncelleme` tarihini değiştirin, ardından artifact'i yeniden yayınlayın.

## Kurulum
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # ardından .env içine API anahtarınızı yazın
streamlit run app.py
```

## Yapı
```
app.py                    Streamlit arayüzü
asistan/prompts.py        Sistem talimatı (asistanın davranış kuralları)
asistan/claude_client.py  Claude API çağrısı, akış, kaynaklar
asistan/bilgi_bankasi.py  Belge okuma, parçalama ve BM25 araması
artifact/nabiz.html       claude.ai sürümü (tek sayfa)
kaynaklar/kaynaklar.json  Güvenilir kaynak kütüphanesi
belgeler/                 Kendi belgeleriniz (git'e eklenmez)
```

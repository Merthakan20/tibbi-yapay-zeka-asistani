# 🩺 Tıbbi Yapay Zeka Asistanı

Claude (Anthropic) ile çalışan, Türkçe tıbbi bilgi asistanı.

> ⚠️ Bilgilendirme amaçlıdır, doktor muayenesinin yerini tutmaz. Acil durumda **112**.

## Özellikler
- **Semptom sohbeti:** olası nedenler, aciliyet düzeyi, hangi branşa gidileceği
- **İlaç bilgisi:** kullanım, yan etkiler, etkileşimler
- **Tahlil yorumlama:** PDF veya fotoğrafı sohbete sürükleyip bırakın
- **Bilgi bankası (RAG):** `belgeler/` klasörüne eklenen PDF/TXT/MD dosyalarından alıntılı cevaplar
- **Web doğrulama:** WHO, NIH, MedlinePlus, FDA, TİTCK gibi güvenilir sitelerde arama (isteğe bağlı)

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
belgeler/                 Bilgi bankası dosyaları
```

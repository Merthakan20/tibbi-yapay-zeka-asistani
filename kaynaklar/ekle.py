"""Kaynak kütüphanesine kayıt ekleme yardımcısı.

Kullanım: python kaynaklar/ekle.py yeni_kayitlar.json
Girdi dosyası kayıt listesidir; aynı id'ye sahip kayıt varsa güncellenir.
"""

import json
import sys
from datetime import date
from pathlib import Path

ALANLAR = ["id", "konu", "kategori", "acil", "anahtar_kelimeler", "baslik", "kurum", "tur", "url", "dil", "ozet"]
TURLER = {"resmi", "universite", "dernek", "ozel", "uluslararasi"}

KURUMLAR = {
    "ML": "MedlinePlus (ABD Ulusal Tıp Kütüphanesi, NIH)",
    "ACB": "Acıbadem Sağlık Grubu",
    "MP": "Medical Park Hastaneleri",
}

yol = Path(__file__).with_name("kaynaklar.json")
veri = json.loads(yol.read_text(encoding="utf-8"))
mevcut = {k["id"]: i for i, k in enumerate(veri["kaynaklar"])}

yeni = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
for k in yeni:
    k["kurum"] = KURUMLAR.get(k["kurum"], k["kurum"])
    k.setdefault("acil", False)
    k.setdefault("dil", "en" if "medlineplus.gov" in k["url"] else "tr")
    eksik = [a for a in ALANLAR if a not in k]
    assert not eksik, f"{k.get('id')}: eksik alan {eksik}"
    assert k["tur"] in TURLER, k["id"]
    assert k["kategori"] in veri["kategoriler"], f"{k['id']}: bilinmeyen kategori {k['kategori']}"
    kayit = {a: k[a] for a in ALANLAR}
    if k["id"] in mevcut:
        # Aynı id yalnızca aynı konunun kaydını günceller; başka konudaysa çakışmadır (eski kaydı silerdi)
        eski = veri["kaynaklar"][mevcut[k["id"]]]
        assert eski["konu"] == k["konu"], f"{k['id']}: bu id zaten '{eski['konu']}' konusunda kullanılıyor; farklı bir id seçin"
        veri["kaynaklar"][mevcut[k["id"]]] = kayit
    else:
        mevcut[k["id"]] = len(veri["kaynaklar"])
        veri["kaynaklar"].append(kayit)

veri["guncelleme"] = date.today().isoformat()
yol.write_text(json.dumps(veri, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{len(yeni)} kayıt işlendi; toplam {len(veri['kaynaklar'])} kaynak, "
      f"{len({k['konu'] for k in veri['kaynaklar']})} konu")

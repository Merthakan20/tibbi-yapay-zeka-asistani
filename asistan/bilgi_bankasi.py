"""Yerel tıbbi belgelerden basit bir bilgi bankası (RAG).

`belgeler/` klasöründeki PDF, TXT ve MD dosyaları parçalara bölünür ve BM25 ile
aranır. Bulunan parçalar Claude'a `document` bloğu olarak verilir; böylece
Claude cevabında hangi belgenin hangi kısmından alıntı yaptığını gösterebilir.

Ek bir vektör veritabanı gerektirmez. Belge sayısı binlerle ifade edilecek kadar
büyürse embedding tabanlı bir aramaya geçmek mantıklı olur.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

DESTEKLENEN_UZANTILAR = {".pdf", ".txt", ".md"}
PARCA_BOYUTU = 1200  # karakter
PARCA_ORTUSMESI = 200  # karakter

# Aramada anlam taşımayan sık Türkçe kelimeler
DURAK_KELIMELER = set(
    "ve veya ile de da ki bir bu şu o için gibi daha çok en mi mı mu mü ne "
    "nasıl neden ama fakat ise olan olarak olur olabilir var yok her hangi "
    "benim bana beni sen siz biz ben".split()
)


@dataclass
class Parca:
    kaynak: str  # dosya adı
    sayfa: int | None  # PDF ise sayfa numarası
    metin: str

    @property
    def baslik(self) -> str:
        return f"{self.kaynak} (s. {self.sayfa})" if self.sayfa else self.kaynak


def _kucult(metin: str) -> str:
    # Python'un lower() fonksiyonu "I" ve "İ" harflerini Türkçe kurala göre çevirmez
    return metin.replace("I", "ı").replace("İ", "i").lower()


def _kelimeler(metin: str) -> list[str]:
    kelimeler = re.findall(r"\w+", _kucult(metin))
    return [k for k in kelimeler if len(k) > 1 and k not in DURAK_KELIMELER]


def _govde(kelime: str) -> str:
    # Türkçe sondan eklemeli bir dil; ilk 5 harf kaba ama etkili bir kök yaklaşımı
    # ("tansiyonum", "tansiyonun" ve "tansiyon" hepsi "tansi" ile eşleşir).
    return kelime[:5]


def _parcala(metin: str) -> list[str]:
    metin = re.sub(r"[ \t]+", " ", metin).strip()
    if len(metin) <= PARCA_BOYUTU:
        return [metin] if metin else []
    parcalar = []
    bas = 0
    while bas < len(metin):
        son = min(bas + PARCA_BOYUTU, len(metin))
        if son < len(metin):
            # Mümkünse paragraf veya cümle sonunda kes
            kesim = max(metin.rfind("\n\n", bas, son), metin.rfind(". ", bas, son))
            if kesim > bas + PARCA_BOYUTU // 2:
                son = kesim + 1
        parcalar.append(metin[bas:son].strip())
        if son >= len(metin):
            break
        bas = son - PARCA_ORTUSMESI
    return [p for p in parcalar if p]


def _dosyayi_oku(yol: Path) -> list[Parca]:
    if yol.suffix.lower() == ".pdf":
        parcalar = []
        for no, sayfa in enumerate(PdfReader(yol).pages, start=1):
            for p in _parcala(sayfa.extract_text() or ""):
                parcalar.append(Parca(yol.name, no, p))
        return parcalar
    metin = yol.read_text(encoding="utf-8", errors="replace")
    return [Parca(yol.name, None, p) for p in _parcala(metin)]


class BilgiBankasi:
    def __init__(self, klasor: Path):
        self.klasor = klasor
        self.parcalar: list[Parca] = []
        self.hatalar: dict[str, str] = {}
        self._terimler: list[Counter] = []
        self._df: Counter = Counter()
        self._ort_uzunluk = 0.0
        self.yukle()

    @property
    def dosyalar(self) -> list[str]:
        return sorted({p.kaynak for p in self.parcalar})

    def yukle(self) -> None:
        self.parcalar, self.hatalar = [], {}
        for yol in sorted(self.klasor.glob("*")):
            if yol.suffix.lower() not in DESTEKLENEN_UZANTILAR:
                continue
            try:
                self.parcalar.extend(_dosyayi_oku(yol))
            except Exception as e:  # bozuk / şifreli PDF vb.
                self.hatalar[yol.name] = str(e)

        self._terimler = [Counter(map(_govde, _kelimeler(p.metin))) for p in self.parcalar]
        self._df = Counter()
        for t in self._terimler:
            self._df.update(t.keys())
        toplam = sum(sum(t.values()) for t in self._terimler)
        self._ort_uzunluk = toplam / len(self._terimler) if self._terimler else 0.0

    def ara(self, sorgu: str, k: int = 5) -> list[Parca]:
        """BM25 ile sorguya en uygun `k` parçayı döndürür."""
        if not self.parcalar:
            return []
        k1, b = 1.5, 0.75
        n = len(self.parcalar)
        sorgu_terimleri = set(map(_govde, _kelimeler(sorgu)))
        puanlar = []
        for i, terimler in enumerate(self._terimler):
            uzunluk = sum(terimler.values())
            puan = 0.0
            for t in sorgu_terimleri:
                f = terimler.get(t, 0)
                if not f:
                    continue
                idf = math.log(1 + (n - self._df[t] + 0.5) / (self._df[t] + 0.5))
                puan += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * uzunluk / self._ort_uzunluk))
            if puan > 0:
                puanlar.append((puan, i))
        puanlar.sort(reverse=True)
        return [self.parcalar[i] for _, i in puanlar[:k]]

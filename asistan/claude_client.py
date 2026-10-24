"""Claude API ile konuşan katman: istek içeriğini hazırlar ve cevabı akış halinde döndürür."""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass, field
from typing import Iterator

import anthropic

from .bilgi_bankasi import Parca
from .prompts import SISTEM_TALIMATI

MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5")
MAKS_TOKEN = 64000
MAKS_DOSYA_MB = 30  # API istek sınırı 32 MB; base64 şişmesi için pay bırakıyoruz

# Canlı web aramasının bakacağı güvenilir kaynaklar (alt alan adları da dahildir)
GUVENILIR_ALANLAR = [
    # Resmi kurumlar
    "saglik.gov.tr",
    "titck.gov.tr",
    "who.int",
    # Üniversite hastaneleri
    "hacettepe.edu.tr",
    "ankara.edu.tr",
    "istanbul.edu.tr",
    "iuc.edu.tr",
    "ege.edu.tr",
    "gazi.edu.tr",
    # Özel hastaneler
    "acibadem.com.tr",
    "memorial.com.tr",
    "medicalpark.com.tr",
    "florence.com.tr",
    "amerikanhastanesi.org",
    # Uluslararası
    "medlineplus.gov",
    "nih.gov",
    "cdc.gov",
    "fda.gov",
    "ema.europa.eu",
    "nhs.uk",
    "mayoclinic.org",
]

RESIM_TURLERI = {"image/png", "image/jpeg", "image/webp", "image/gif"}


@dataclass
class Kaynak:
    baslik: str
    alinti: str
    url: str | None = None


@dataclass
class Sonuc:
    metin: str = ""
    dusunce: str = ""
    kaynaklar: list[Kaynak] = field(default_factory=list)
    reddedildi: bool = False
    yedek_model: str | None = None  # cevap, ana model yerine yedek modelden geldiyse
    kesildi: bool = False  # max_tokens sınırına takıldıysa


def dosya_blogu(ad: str, mime: str, veri: bytes) -> dict:
    """Yüklenen tahlil PDF'ini veya görselini Claude içerik bloğuna çevirir."""
    if len(veri) > MAKS_DOSYA_MB * 1024 * 1024:
        raise ValueError(f"{ad} çok büyük (en fazla {MAKS_DOSYA_MB} MB).")
    b64 = base64.standard_b64encode(veri).decode()
    if mime == "application/pdf":
        return {
            "type": "document",
            "source": {"type": "base64", "media_type": "application/pdf", "data": b64},
            "title": ad,
            "citations": {"enabled": True},
        }
    if mime in RESIM_TURLERI:
        return {"type": "image", "source": {"type": "base64", "media_type": mime, "data": b64}}
    raise ValueError(f"{ad}: desteklenmeyen dosya türü ({mime}).")


def bilgi_bankasi_bloklari(parcalar: list[Parca]) -> list[dict]:
    return [
        {
            "type": "document",
            "source": {"type": "text", "media_type": "text/plain", "data": p.metin},
            "title": p.baslik,
            "context": (
                f"Güvenilir kaynak kütüphanesinden özet. Kaynak: {p.url}"
                if p.url
                else "Kullanıcının bilgi bankasına eklediği belgeden bir parça."
            ),
            "citations": {"enabled": True},
        }
        for p in parcalar
    ]


def _kaynaklari_topla(icerik) -> list[Kaynak]:
    kaynaklar, gorulen = [], set()
    for blok in icerik:
        if blok.type != "text" or not blok.citations:
            continue
        for c in blok.citations:
            if c.type == "web_search_result_location":
                k = Kaynak(c.title or c.url, c.cited_text, c.url)
            else:
                k = Kaynak(c.document_title or f"Belge {c.document_index + 1}", c.cited_text)
            anahtar = (k.baslik, k.alinti)
            if anahtar not in gorulen:
                gorulen.add(anahtar)
                kaynaklar.append(k)
    return kaynaklar


def yanit_akisi(
    client: anthropic.Anthropic,
    mesajlar: list[dict],
    web_arama: bool = False,
    efor: str = "high",
) -> Iterator[tuple[str, str] | tuple[str, Sonuc]]:
    """Cevabı parça parça üretir.

    ("dusunce", metin) ve ("metin", metin) parçaları yayar; en sonda
    ("bitti", Sonuc) döner. `mesajlar` değiştirilmez.
    """
    araclar = []
    if web_arama:
        araclar.append(
            {
                "type": "web_search_20260209",
                "name": "web_search",
                "max_uses": 5,
                "allowed_domains": GUVENILIR_ALANLAR,
            }
        )

    sonuc = Sonuc()
    calisma = list(mesajlar)
    tum_icerik = []

    # Web araması uzun sürerse API "pause_turn" ile durup devam etmemizi bekler
    for _ in range(5):
        with client.beta.messages.stream(
            model=MODEL,
            max_tokens=MAKS_TOKEN,
            system=SISTEM_TALIMATI,
            messages=calisma,
            tools=araclar or anthropic.omit,
            thinking={"type": "adaptive", "display": "summarized"},
            output_config={"effort": efor},
            cache_control={"type": "ephemeral"},
            # Güvenlik sınıflandırıcısı isteği reddederse sunucu tarafında
            # uygun bir yedek modelle otomatik olarak yeniden dener.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        ) as akis:
            for olay in akis:
                if olay.type == "content_block_delta":
                    if olay.delta.type == "thinking_delta":
                        sonuc.dusunce += olay.delta.thinking
                        yield ("dusunce", olay.delta.thinking)
                    elif olay.delta.type == "text_delta":
                        sonuc.metin += olay.delta.text
                        yield ("metin", olay.delta.text)
            yanit = akis.get_final_message()

        tum_icerik.extend(yanit.content)
        if any(b.type == "fallback" for b in yanit.content) or any(
            u.type == "fallback_message" for u in (yanit.usage.iterations or [])
        ):
            sonuc.yedek_model = yanit.model

        if yanit.stop_reason == "pause_turn":
            calisma = calisma + [
                {"role": "assistant", "content": [b.to_dict() for b in yanit.content]}
            ]
            continue
        sonuc.reddedildi = yanit.stop_reason == "refusal"
        sonuc.kesildi = yanit.stop_reason == "max_tokens"
        break

    sonuc.kaynaklar = _kaynaklari_topla(tum_icerik)
    yield ("bitti", sonuc)

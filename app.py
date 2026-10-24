"""Tıbbi Yapay Zeka Asistanı - Streamlit arayüzü.

Çalıştırmak için:  streamlit run app.py
"""

from pathlib import Path

import anthropic
import streamlit as st
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from asistan.bilgi_bankasi import DESTEKLENEN_UZANTILAR, BilgiBankasi  # noqa: E402
from asistan.claude_client import (  # noqa: E402
    MODEL,
    bilgi_bankasi_bloklari,
    dosya_blogu,
    yanit_akisi,
)

BELGE_KLASORU = Path(__file__).parent / "belgeler"
BELGE_KLASORU.mkdir(exist_ok=True)

st.set_page_config(page_title="Tıbbi Yapay Zeka Asistanı", page_icon="🩺", layout="centered")


@st.cache_resource
def istemci() -> anthropic.Anthropic:
    return anthropic.Anthropic()


@st.cache_resource
def bilgi_bankasi() -> BilgiBankasi:
    return BilgiBankasi(BELGE_KLASORU)


if "mesajlar" not in st.session_state:
    # Her öğe: {"rol", "api_icerik", "metin", "ekler", "dusunce", "kaynaklar", "uyari"}
    st.session_state.mesajlar = []

bb = bilgi_bankasi()

# ---------------------------------------------------------------- Kenar çubuğu
with st.sidebar:
    st.header("⚙️ Ayarlar")
    rag_acik = st.toggle(
        "Bilgi bankasını kullan",
        value=bool(bb.parcalar),
        disabled=not bb.parcalar,
        help="Sorunuzla ilgili parçalar 'belgeler' klasöründeki dosyalardan bulunup Claude'a verilir.",
    )
    web_acik = st.toggle(
        "Güvenilir sitelerde doğrula",
        value=False,
        help="WHO, NIH, MedlinePlus, FDA, TİTCK gibi kaynaklarda web araması yapar. Daha yavaştır.",
    )
    dusunce_goster = st.toggle("Düşünme sürecini göster", value=False)
    efor = st.select_slider(
        "Düşünme derinliği",
        options=["low", "medium", "high", "xhigh"],
        value="high",
        format_func={"low": "Hızlı", "medium": "Dengeli", "high": "Derin", "xhigh": "Çok derin"}.get,
    )

    st.divider()
    st.subheader("📚 Bilgi bankası")
    if bb.dosyalar:
        st.caption(f"{len(bb.dosyalar)} belge, {len(bb.parcalar)} parça")
        for ad in bb.dosyalar:
            st.markdown(f"- {ad}")
    else:
        st.caption("Henüz belge yok. PDF, TXT veya MD dosyası ekleyin.")
    for ad, hata in bb.hatalar.items():
        st.warning(f"{ad} okunamadı: {hata}")

    yeni = st.file_uploader(
        "Belge ekle",
        type=[u.lstrip(".") for u in DESTEKLENEN_UZANTILAR],
        accept_multiple_files=True,
    )
    if yeni and st.button("Bilgi bankasına ekle", use_container_width=True):
        for f in yeni:
            (BELGE_KLASORU / Path(f.name).name).write_bytes(f.getvalue())
        bb.yukle()
        st.rerun()

    st.divider()
    if st.button("🗑️ Sohbeti temizle", use_container_width=True):
        st.session_state.mesajlar = []
        st.rerun()
    st.caption(f"Model: `{MODEL}`")

# ---------------------------------------------------------------- Ana ekran
st.title("🩺 Tıbbi Yapay Zeka Asistanı")
st.warning(
    "Bu asistan bilgilendirme amaçlıdır; doktor muayenesinin yerini tutmaz. "
    "**Acil bir durumda hemen 112'yi arayın.**",
    icon="⚠️",
)


def mesaji_ciz(m: dict) -> None:
    with st.chat_message("user" if m["rol"] == "user" else "assistant"):
        if m.get("dusunce") and dusunce_goster:
            with st.expander("💭 Düşünme süreci"):
                st.markdown(m["dusunce"])
        st.markdown(m["metin"])
        for ek in m.get("ekler", []):
            st.caption(f"📎 {ek}")
        if m.get("uyari"):
            st.info(m["uyari"])
        if m.get("kaynaklar"):
            with st.expander(f"📖 Kaynaklar ({len(m['kaynaklar'])})"):
                for k in m["kaynaklar"]:
                    baslik = f"[{k.baslik}]({k.url})" if k.url else f"**{k.baslik}**"
                    st.markdown(f"{baslik}\n> {k.alinti.strip()}")


if not st.session_state.mesajlar:
    st.markdown(
        "Merhaba! Size şu konularda yardımcı olabilirim:\n"
        "- **Şikayetleriniz:** olası nedenler ve ne kadar acil olduğu\n"
        "- **İlaçlar:** kullanım, yan etkiler, etkileşimler\n"
        "- **Tahlil sonuçları:** PDF veya fotoğrafını ekleyin, değerleri açıklayayım\n"
        "- **Bilgi bankası:** eklediğiniz tıbbi belgelerden kaynaklı cevaplar"
    )

for m in st.session_state.mesajlar:
    mesaji_ciz(m)

girdi = st.chat_input(
    "Sorunuzu yazın veya tahlil sonucunuzu ekleyin…",
    accept_file="multiple",
    file_type=["pdf", "png", "jpg", "jpeg", "webp"],
)

if girdi:
    soru = (girdi.text or "").strip()
    dosyalar = girdi.files or []
    if not soru and dosyalar:
        soru = "Ekteki tahlil sonuçlarımı yorumlar mısın?"

    # Kullanıcı mesajının API içeriği: belgeler önce, soru en sonda
    icerik, ekler = [], []
    try:
        for f in dosyalar:
            icerik.append(dosya_blogu(f.name, f.type, f.getvalue()))
            ekler.append(f.name)
    except ValueError as e:
        st.error(str(e))
        st.stop()

    if rag_acik:
        icerik.extend(bilgi_bankasi_bloklari(bb.ara(soru)))
    icerik.append({"type": "text", "text": soru})

    kullanici = {"rol": "user", "api_icerik": icerik, "metin": soru, "ekler": ekler}
    st.session_state.mesajlar.append(kullanici)
    mesaji_ciz(kullanici)

    api_mesajlari = [
        {"role": m["rol"], "content": m["api_icerik"]} for m in st.session_state.mesajlar
    ]

    with st.chat_message("assistant"):
        dusunce_alani = st.empty()
        metin_alani = st.empty()
        metin_alani.markdown("⏳ _Düşünüyorum…_")
        metin, dusunce, sonuc = "", "", None
        try:
            for tur, parca in yanit_akisi(istemci(), api_mesajlari, web_acik, efor):
                if tur == "dusunce":
                    dusunce += parca
                    if dusunce_goster:
                        dusunce_alani.caption(f"💭 {dusunce[-600:]}")
                elif tur == "metin":
                    metin += parca
                    metin_alani.markdown(metin + "▌")
                else:
                    sonuc = parca
        except anthropic.AuthenticationError:
            metin_alani.error("API anahtarı geçersiz. `.env` dosyasındaki ANTHROPIC_API_KEY değerini kontrol edin.")
        except anthropic.RateLimitError:
            metin_alani.error("İstek sınırına ulaşıldı. Biraz bekleyip tekrar deneyin.")
        except anthropic.BadRequestError as e:
            metin_alani.error(f"İstek reddedildi: {e.message}")
        except anthropic.APIStatusError as e:
            metin_alani.error(f"API hatası ({e.status_code}): {e.message}")
        except anthropic.APIConnectionError:
            metin_alani.error("Bağlantı hatası. İnternet bağlantınızı kontrol edin.")
        except TypeError as e:
            if "api_key" in str(e) or "authentication" in str(e).lower():
                metin_alani.error("API anahtarı bulunamadı. `.env` dosyası oluşturup ANTHROPIC_API_KEY ekleyin.")
            else:
                raise

        if sonuc is None:
            # Hata oluştu: cevapsız kalan kullanıcı mesajını geri al ki sohbet bozulmasın
            st.session_state.mesajlar.pop()
            st.stop()

        dusunce_alani.empty()
        uyari = None
        if sonuc.reddedildi:
            # Yarıda kesilen kısmi cevabı göstermiyoruz
            sonuc.metin = "Bu isteğe yanıt veremiyorum. Lütfen sorunuzu farklı biçimde ifade edin."
            uyari = "Model bu isteği güvenlik nedeniyle yanıtlamadı."
        elif sonuc.kesildi:
            uyari = "Cevap uzunluk sınırına takıldı; devamı için 'devam et' yazabilirsiniz."
        elif sonuc.yedek_model:
            uyari = f"Bu cevap yedek model ({sonuc.yedek_model}) tarafından verildi."
        if not sonuc.metin.strip():
            sonuc.metin = "_(Boş cevap döndü, lütfen tekrar deneyin.)_"

        asistan = {
            "rol": "assistant",
            "api_icerik": [{"type": "text", "text": sonuc.metin}],
            "metin": sonuc.metin,
            "dusunce": sonuc.dusunce,
            "kaynaklar": sonuc.kaynaklar,
            "uyari": uyari,
        }
        st.session_state.mesajlar.append(asistan)
        st.rerun()

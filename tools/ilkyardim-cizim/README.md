# İlk yardım çizimleri

`artifact/nabiz.html` içindeki `AID_ILL` sabitini üretir (düz tarz SVG, kendi çizimimiz).

- `lib.mjs`: eklem noktalarından insan figürü (`person`), yazı, ok, "yapmayın" işareti.
- `scenes.mjs`: 18 kartın sahneleri (anahtar = `FIRST_AID` id).
- `node preview.mjs onizleme.html`: hepsini bir sayfada gösterir.
- `node emit.mjs > ill.js`: sayfaya yapıştırılacak `const AID_ILL = {...}` bloğunu yazar (sayfadaki eski bloğun yerine).

Çizimler yalnızca karttaki adımları gösterir; yeni bilgi eklenmez.

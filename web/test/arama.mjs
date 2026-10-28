// Kaynak aramasının kritik şikayetleri doğru konuya götürdüğünü denetler (tarayıcı gerekmez).
// Sayfadaki arama kodu (terms/stem/search) olduğu gibi çalıştırılır; vücut haritası formunun ürettiği soru biçimi de denenir.
// Kullanım: node web/test/arama.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const html = readFileSync(process.env.HTML || join(root, "artifact/nabiz.html"), "utf8");
const code = "const docs=[];let library;" + html.match(/  const STOP =[\s\S]*?\n  const terms = [^\n]*\n/)[0]
  + html.match(/  const POPULATIONS[\s\S]*?\n  function search\([\s\S]*?\n  }\n/)[0] + ";return {search,setLib:(l)=>{library=l}};";
const A = new Function(code)();
const lib = JSON.parse(readFileSync(join(root, "kaynaklar/kaynaklar.json"), "utf8")).kaynaklar;
A.setLib(lib.map((k) => ({ title: k.baslik, text: k.ozet, kw: [k.konu, ...k.anahtar_kelimeler].join(" "), phrases: [k.konu, ...k.anahtar_kelimeler], topic: k.konu, konu: k.konu })));
const konuOf = new Map(lib.map((k) => [k.baslik, k.konu]));
const form = (sikayet, bolge) => `${sikayet} şikayetim var (${bolge} bölgesi). Süre: birkaç gündür. Şiddet: 5/10.`;

// [soru, ilk sonucun konusu için beklenen desen]
const CASES = [
  [form("Kolda ani güçsüzlük", "omuz ve kollar"), /İnme/],
  [form("Konuşma bozukluğu", "baş ve beyin"), /İnme/],
  [form("Göğüs ağrısı", "kalp"), /Kalp krizi/],
  [form("Göğüste sıkışma", "kalp"), /Kalp krizi/],
  [form("Ense sertliği", "boğaz ve boyun"), /Menenjit/],
  [form("Nefes darlığı", "akciğerler"), /emboli|Astım|KOAH|Kalp/],
  [form("Tek bacakta şişlik", "bacaklar"), /ven trombozu/],
  [form("Siyah dışkı", "mide"), /kanama|ülser|Gastrit/],
  [form("Kendine zarar verme düşüncesi", "ruh sağlığı"), /Depresyon/],
  [form("Baş ağrısı", "baş ve beyin"), /baş ağrısı|Migren/],
  [form("Göz kızarıklığı", "göz, kulak, burun"), /Konjonktivit/],
  [form("Kulak ağrısı", "göz, kulak, burun"), /kulak/i],
  [form("Boğaz ağrısı", "boğaz ve boyun"), /tonsillit/],
  [form("Mide yanması", "mide"), /Reflü|Gastrit/],
  [form("Bulantı ve kusma", "mide"), /İshal|Gastrit|zehirlenme/],
  [form("İdrarda kan", "böbrekler"), /hematüri|taşı/],
  [form("İdrarda yanma", "mesane ve kasık"), /İdrar yolu/],
  [form("Çarpıntı", "kalp"), /Çarpıntı/],
  [form("Sürekli susama", "genel belirtiler"), /diyabet/],
  [form("Kaşıntı", "cilt"), /Egzama|Kurdeşen/],
  ["kolumu kaldıramıyorum konuşmam bozuldu", /İnme/],
  ["Başım ağrıyor, ışıktan rahatsız oluyorum", /Migren|baş ağrısı/],
  ["kusuyorum", /İshal|Gastrit|zehirlenme/],
  ["hamileyim sürekli kusuyorum", /Gebelik/],
  ["bebeğim ateşlendi", /ateş/],
  ["inr değerim yüksek", /INR/],
  ["hepatit C bulaşır mı", /Hepatit C/],
  ["paslı çivi battı", /Tetanoz/],
  ["köy peyniri yedim ateşim var", /bruselloz/],
];

let fail = 0;
for (const [q, re] of CASES) {
  const top = A.search(q, { useDocs: false })[0];
  const konu = top ? konuOf.get(top.title) : "—";
  const ok = Boolean(top) && re.test(konu);
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${q.slice(0, 60)} → ${konu}`);
}
console.log(fail ? `\n${fail} arama kontrolü BAŞARISIZ` : `\nArama kontrolleri geçti (${CASES.length})`);
process.exit(fail ? 1 : 0);

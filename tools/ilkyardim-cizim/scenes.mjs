import { person, svg, floor, SKIN, T, arrow, line, NO, dark } from "./lib.mjs";
const S = {};
const RED = "#e85d5d", BLUE = "#4a90d9", GREEN = "#5bb98c", ORANGE = "#e9a23b", NAVY = "#2f4858", JEANS = "#3d5a80";
const eyes2 = (x, y, d = 4) => `<circle cx="${x - d}" cy="${y}" r="1.5" fill="#2b2b2b"/><circle cx="${x + d}" cy="${y}" r="1.5" fill="#2b2b2b"/>`;
const sweat = (x, y) => `<path d="M${x},${y} q-3,5 0,7 q3,-2 0,-7z" fill="#7cc4f0"/>`;
const phone = (x, y, n) => `<rect x="${x}" y="${y}" width="34" height="56" rx="6" fill="#2f3542"/><rect x="${x + 3}" y="${y + 6}" width="28" height="40" rx="2" fill="#eaf4ff"/>` + T(x + 17, y + 31, n, { size: 13, bold: true, c: "#c4302b", anchor: "middle" });
const chair = (x, y) => `<rect x="${x}" y="${y}" width="56" height="8" rx="3" fill="#b07d52"/><rect x="${x + 4}" y="${y + 8}" width="6" height="${180 - y - 8}" fill="#96683f"/><rect x="${x + 46}" y="${y + 8}" width="6" height="${180 - y - 8}" fill="#96683f"/><rect x="${x}" y="${y - 52}" width="7" height="52" rx="3" fill="#96683f"/>`;

// 1 Kalp masajı: hasta sırtüstü; kurtarıcı hastanın öbür yanında diz çökmüş (önden görünür), kollar dik
{
  const patient = { head: [58, 162], neck: [76, 164], hip: [168, 166], lk: [212, 167], lf: [262, 170], rk: [210, 171], rf: [258, 174], r: { el: [100, 173], ha: [126, 175] }, skin: SKIN[0], hair: "#7a4b2a", shirt: ORANGE, pants: JEANS, hairAng: 180, closed: [54, 158] };
  const resc = { head: [108, 62], neck: [108, 80], hip: [108, 150], skin: SKIN[1], hair: "#2a1d14", shirt: RED, part: "body", hairAng: -90, hairSpan: 70 };
  S.tyd = svg(floor(182) + person(resc) + eyes2(108, 62) + `<path d="M104 69 q4 2 8 0" stroke="#7a3a2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
    person(patient) +
    line([[98, 86], [101, 124], [106, 160]], 9.5, RED) + line([[118, 86], [114, 124], [110, 160]], 9.5, RED) + `<ellipse cx="108" cy="161" rx="11" ry="6" fill="${SKIN[1]}"/>` +
    arrow("M150 70 v40", "M143 104 l7 11 l7 -11 z") + T(166, 84, "30 bası", { size: 16, bold: true, c: "#c4302b" }) + T(166, 102, "dakikada 100-120") + T(166, 120, "göğüs 5 cm çöker") +
    T(20, 30, "Kollar dik, eller göğsün ortasında", { size: 12.5, bold: true }),
    "Kalp masajı: kurtarıcı sırtüstü yatan kişinin yanında diz çöker, kollarını bükmeden iki elini göğsün ortasına koyup dakikada 100-120 kez bastırır");
}
// 2 Heimlich: kurtarıcı arkada, kolları kişinin beline sarılı
{
  const victim = { head: [206, 50], neck: [197, 66], hip: [182, 124], lk: [190, 154], lf: [196, 184], rk: [176, 154], rf: [172, 184], l: { el: [216, 88], ha: [205, 68] }, r: { el: [210, 92], ha: [200, 72] }, skin: SKIN[0], hair: "#c98b3c", shirt: GREEN, pants: JEANS, longHair: true, hairAng: -110, eye: [212, 47], mouth: "M213 56 q2 1 4 0" };
  const resc = { head: [166, 40], neck: [162, 58], hip: [154, 124], sh: [164, 64], lk: [160, 154], lf: [164, 184], rk: [148, 154], rf: [142, 184], l: { el: [184, 104], ha: [201, 104] }, r: { el: [180, 98], ha: [199, 100] }, skin: SKIN[2], hair: "#1d1d1d", shirt: RED, pants: NAVY, hairAng: -100, eye: [173, 38] };
  S.bogulma = svg(floor(186) + person({ ...resc, part: "body" }) + person({ ...resc, l: null, part: "arms" }) + person(victim) + person({ ...resc, r: null, part: "arms" }) +
    `<circle cx="203" cy="104" r="6" fill="${SKIN[2]}"/>` +
    arrow("M240 120 q-10 -4 -18 -16", "M216 98 l2 -12 l10 7 z") + T(244, 116, "içe ve", { bold: true, c: "#c4302b" }) + T(244, 132, "yukarı", { bold: true, c: "#c4302b" }) +
    T(14, 30, "Arkasına geçin,", { bold: true }) + T(14, 47, "yumruk göbeğin") + T(14, 63, "hemen üstünde"),
    "Heimlich: yardım eden kişi boğulan kişinin arkasına geçer, kollarını beline sarar ve yumruğuyla göbeğin üstünden içe ve yukarı ani baskı yapar");
}
// 3 Kalp krizi
S.kalpkrizi = svg(floor(186) +
  person({ head: [130, 74], neck: [130, 92], hip: [132, 146], lk: [138, 166], lf: [142, 184], rk: [126, 166], rf: [120, 184], r: { el: [150, 124], ha: [140, 112] }, l: { el: [114, 124], ha: [134, 112] }, skin: SKIN[1], hair: "#5a5a5a", shirt: BLUE, pants: NAVY, hairSpan: 70, eye: [136, 71], mouth: "M134 81 q3 -2 6 0" }) +
  sweat(114, 64) + sweat(148, 58) + `<path d="M150 102 l10 -6 M152 112 l12 0 M150 122 l10 6" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>` +
  phone(230, 70, "112") + T(210, 150, "Beklemeden", { bold: true, c: "#c4302b" }) + T(210, 166, "112'yi arayın", { bold: true, c: "#c4302b" }) +
  T(20, 30, "Göğüste baskı, sıkışma,", { bold: true }) + T(20, 47, "kola-çeneye yayılan ağrı"),
  "Kalp krizi: göğsünü tutan, terleyen kişi; beklemeden 112 aranır");
// 4 İnme: yüz, kol, konuşma
S.inme = svg(floor(186) +
  `<circle cx="62" cy="88" r="34" fill="${SKIN[0]}"/><path d="M28,84 A35,35 0 0 1 96,84 Z" fill="#6b4a2b"/>` + eyes2(62, 90, 11) + `<path d="M48 108 q8 3 14 2 q8 2 12 10" stroke="#7a3a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
  T(62, 146, "Yüz kayması", { bold: true, anchor: "middle", size: 12 }) +
  person({ head: [158, 56], neck: [158, 74], hip: [158, 132], lk: [164, 160], lf: [166, 184], rk: [152, 160], rf: [148, 184], r: { el: [182, 100], ha: [200, 116] }, l: { el: [184, 84], ha: [208, 82] }, skin: SKIN[1], hair: "#2a1d14", shirt: GREEN, pants: JEANS, hairSpan: 70, eye: [164, 53] }) +
  arrow("M214 100 v16", "M208 112 l6 9 l6 -9 z") + T(160, 202, "Kolda güçsüzlük", { bold: true, anchor: "middle", size: 12 }) +
  `<path d="M236 40 h62 q8 0 8 8 v26 q0 8 -8 8 h-40 l-12 10 v-10 h-10 q-8 0 -8 -8 v-26 q0 -8 8 -8 z" fill="#fff" stroke="#c9d4da"/>` + T(267, 66, "a.. bı..", { anchor: "middle" }) +
  T(267, 104, "Konuşma", { bold: true, anchor: "middle", size: 12 }) + T(267, 119, "bozukluğu", { bold: true, anchor: "middle", size: 12 }) + T(267, 152, "Biri bile varsa", { bold: true, c: "#c4302b", anchor: "middle" }) + T(267, 168, "→ 112", { bold: true, c: "#c4302b", anchor: "middle", size: 16 }).replace("y=\"168\"", "y=\"170\""),
  "İnme belirtileri: yüzde kayma, bir kolun düşmesi, konuşma bozukluğu; biri bile varsa 112");
// 5 Yan yatırma (nöbet sonrası)
S.nobet = svg(floor(180) +
  person({ head: [62, 160], neck: [82, 160], hip: [168, 158], rk: [222, 166], rf: [276, 170], lk: [204, 176], lf: [240, 166], r: { el: [92, 176], ha: [118, 178] }, l: { el: [84, 178], ha: [64, 174] }, skin: SKIN[1], hair: "#3a2a1a", shirt: BLUE, pants: "#555b6e", hairAng: 175, closed: [60, 162] }) +
  T(20, 34, "Kasılmalar bitince yan yatırın", { bold: true }) + T(20, 52, "üstteki diz bükülü · el yanağın altında") + T(20, 70, "ağız yere doğru · yanında kalın") +
  NO(150, 104, "Ağzına bir şey koymayın") + NO(150, 124, "Zorla tutmayın"),
  "Nöbet bitince kişi yan yatırılır: üstteki bacak dizden bükülür, el yanağın altında, ağız yere doğru");
// 6 Alerjik şok: adrenalin kalemi uyluğun dış yanına
S.anafilaksi = svg(floor(184) + chair(108, 128) +
  person({ head: [134, 64], neck: [132, 82], hip: [134, 130], lk: [186, 130], lf: [190, 180], rk: [182, 136], rf: [184, 180], r: { el: [150, 112], ha: [166, 120] }, l: { el: [150, 116], ha: [170, 112] }, skin: SKIN[0], hair: "#8a5a2b", shirt: "#9b59b6", pants: JEANS, longHair: true, hairAng: -80, eye: [140, 62], mouth: "M138 72 q4 3 8 0" }) +
  `<rect x="163" y="96" width="12" height="34" rx="4" fill="${ORANGE}" transform="rotate(8 169 113)"/><rect x="164" y="122" width="10" height="9" rx="2" fill="${BLUE}" transform="rotate(8 169 113)"/>` +
  `<circle cx="170" cy="112" r="6" fill="${SKIN[0]}"/>` +
  T(214, 92, "Uyluğun dış", { bold: true }) + T(214, 108, "yanına bastırın", { bold: true }) + T(214, 130, "sonra 112", { bold: true, c: "#c4302b" }) +
  T(20, 30, "Dudak-dil şişmesi, nefes darlığı:", { bold: true }) + T(20, 47, "adrenalin kalemi varsa hemen"),
  "Alerjik şokta kişinin adrenalin kalemi varsa uyluğun dış yan yüzüne uygulanır ve 112 aranır");
// 7 Kesik ve kanama: doğrudan bastırma
S.kanama = svg(`<rect x="0" y="150" width="320" height="60" fill="#e3eaee"/>` +
  line([[20, 160], [200, 132]], 34, SKIN[0]) + `<ellipse cx="214" cy="130" rx="22" ry="17" fill="${SKIN[0]}"/>` + line([[0, 164], [40, 157]], 36, BLUE) +
  `<path d="M96 156 q6 7 0 15 q-6 -8 0 -15 z" fill="${RED}"/>` +
  `<rect x="72" y="126" width="56" height="20" rx="5" fill="#fff" stroke="#c9d4da" transform="rotate(-9 100 136)"/>` +
  `<rect x="74" y="98" width="54" height="30" rx="13" fill="${SKIN[1]}" transform="rotate(-9 101 113)"/>` + line([[112, 100], [146, 26]], 20, ORANGE) +
  arrow("M50 40 v52", "M43 86 l7 11 l7 -11 z") +
  T(160, 70, "Temiz bezle doğrudan,", { bold: true }) + T(160, 86, "sürekli bastırın", { bold: true }) + T(160, 104, "kolu yukarı kaldırın") +
  T(20, 200, "10 dakikada durmazsa → 112", { bold: true, c: "#c4302b", size: 14 }),
  "Kanayan yaraya temiz bir bezle doğrudan ve sürekli bastırılır, kol kalp seviyesinden yukarı kaldırılır; 10 dakikada durmazsa 112");
// 8 Yanık: serin akan su
S.yanik = svg(`<rect x="0" y="168" width="320" height="42" fill="#d9e6ec"/>` +
  `<path d="M40 30 h80 v18 h-26 v16 h-24 v-16 h-30 z" fill="#9aa7b0"/><rect x="62" y="22" width="18" height="10" rx="3" fill="#7d8a93"/>` +
  `<path d="M82 66 q-4 34 0 62 M74 68 q-4 32 0 58 M90 68 q4 32 0 58" stroke="#5fb3ec" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>` +
  line([[10, 142], [150, 134]], 30, SKIN[0]) + `<ellipse cx="164" cy="134" rx="20" ry="15" fill="${SKIN[0]}"/>` + line([[0, 144], [24, 142]], 32, RED) +
  `<ellipse cx="86" cy="134" rx="16" ry="8" fill="#e98a7a"/>` + `<circle cx="70" cy="150" r="3" fill="#5fb3ec"/><circle cx="104" cy="152" r="3" fill="#5fb3ec"/>` +
  T(196, 70, "Serin akan su", { bold: true, size: 15 }) + T(196, 90, "10-15 dakika", { bold: true, size: 15, c: BLUE }) +
  T(196, 118, "Yapmayın:", { bold: true, size: 12 }) + NO(196, 136, "Buz") + NO(196, 154, "Diş macunu") + NO(196, 172, "Kabarcık patlatma"),
  "Yanık bölge 10-15 dakika serin akan suyun altında tutulur; buz, diş macunu, yoğurt sürülmez, kabarcıklar patlatılmaz");
// 9 Zehirlenme
S.zehirlenme = svg(floor(176) +
  `<rect x="52" y="70" width="64" height="106" rx="12" fill="#7ac17a"/><rect x="70" y="46" width="28" height="26" rx="4" fill="#4f8f4f"/><rect x="64" y="96" width="40" height="44" rx="6" fill="#fff"/>` +
  `<circle cx="84" cy="114" r="9" fill="#333"/><rect x="79" y="120" width="10" height="6" rx="2" fill="#333"/><circle cx="80.5" cy="113" r="2.5" fill="#fff"/><circle cx="87.5" cy="113" r="2.5" fill="#fff"/>` +
  `<rect x="126" y="112" width="42" height="64" rx="8" fill="#5aa9e6"/><rect x="138" y="96" width="18" height="18" rx="3" fill="#3d7fb8"/>` +
  phone(196, 58, "114") + T(240, 76, "Zehir", { bold: true }) + T(240, 92, "Danışma", { bold: true }) + T(240, 108, "acilde 112", { size: 12 }) +
  NO(178, 148, "Yakıcı madde içtiyse") + T(197, 164, "kusturmayın", { size: 12, c: "#c4302b", bold: true }) +
  T(20, 30, "İlaç, temizlik ürünü, mantar, gaz", { bold: true }),
  "Zehirlenme şüphesinde 114 Ulusal Zehir Danışma Merkezi veya 112 aranır; yakıcı madde içildiyse kusturulmaz");
// 10 Şeker düşmesi
S.hipoglisemi = svg(floor(184) + chair(96, 126) +
  person({ head: [122, 62], neck: [120, 80], hip: [122, 128], lk: [172, 128], lf: [176, 180], rk: [168, 134], rf: [170, 180], r: { el: [138, 112], ha: [152, 116] }, l: { el: [146, 102], ha: [138, 84] }, skin: SKIN[2], hair: "#1d1d1d", shirt: ORANGE, pants: NAVY, eye: [128, 60] }) +
  `<path d="M134 70 l12 0 l-2 20 h-8 z" fill="#ffd27a" stroke="#e0a83a"/>` + sweat(110, 50) +
  `<rect x="214" y="64" width="62" height="86" rx="12" fill="#3b4b5a"/><rect x="222" y="74" width="46" height="30" rx="4" fill="#d7f0e3"/>` + T(245, 96, "65", { bold: true, size: 18, anchor: "middle", c: "#c4302b" }) + T(245, 122, "mg/dL", { anchor: "middle", c: "#fff", size: 11 }) +
  T(20, 30, "Bilinci açıksa 15-20 g hızlı şeker:", { bold: true }) + T(20, 47, "meyve suyu, kesme şeker · 15 dk sonra ölçün"),
  "Şeker düşmesinde bilinci açık kişiye meyve suyu veya kesme şeker verilir, 15 dakika sonra şeker yeniden ölçülür");
// 11 Sıcak çarpması
S.sicak = svg(floor(178) +
  `<circle cx="282" cy="34" r="16" fill="#f7c948"/><path d="M282 8 v-6 M282 66 v6 M256 34 h-6 M308 34 h6 M264 16 l-4 -4 M300 52 l4 4 M300 16 l4 -4 M264 52 l-4 4" stroke="#f7c948" stroke-width="3" stroke-linecap="round"/>` +
  `<rect x="96" y="40" width="8" height="140" fill="#8a6a4a"/><path d="M20 58 q80 -50 160 0 z" fill="${GREEN}"/>` +
  `<rect x="0" y="152" width="200" height="28" fill="#cfdfe6" opacity=".6"/>` +
  person({ head: [44, 160], neck: [62, 162], hip: [146, 164], lk: [186, 165], lf: [228, 168], rk: [184, 169], rf: [224, 172], r: { el: [82, 172], ha: [104, 174] }, skin: SKIN[0], hair: "#c98b3c", shirt: "#ffffff", pants: JEANS, hairAng: 180, closed: [40, 156] }) +
  `<rect x="56" y="148" width="22" height="12" rx="4" fill="#7cc4f0"/>` + sweat(150, 132) + sweat(164, 138) +
  T(200, 100, "Gölgeye alın,", { bold: true }) + T(200, 116, "ıslak bezle", { bold: true }) + T(200, 132, "serinletin", { bold: true }) + T(200, 150, "112'yi arayın", { bold: true, c: "#c4302b" }),
  "Sıcak çarpmasında kişi gölgeye alınır, ıslak bezlerle özellikle baş, boyun, koltuk altı ve kasıktan serinletilir ve 112 aranır");
// 12 Kırık: kol askısı
S.kirik = svg(floor(188) +
  person({ head: [140, 44], neck: [140, 62], hip: [140, 124], lk: [146, 156], lf: [150, 186], rk: [134, 156], rf: [128, 186], r: { el: [124, 100], ha: [124, 128] }, l: { el: [124, 104], ha: [160, 100] }, skin: SKIN[0], hair: "#5a3a22", shirt: "#e67e22", pants: JEANS, hairSpan: 70, eye: [136, 43] }) + `<circle cx="146" cy="43" r="1.5" fill="#2b2b2b"/>` +
  `<path d="M130 62 L168 92 L118 114 Z" fill="#fff" stroke="#c9d4da" opacity=".95"/><path d="M130 62 L150 62" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
  T(192, 70, "Bulunduğu", { bold: true }) + T(192, 86, "konumda sabitleyin,", { bold: true }) + T(192, 102, "askıya alın") +
  NO(192, 136, "Yerine oturtmayın") + NO(192, 156, "Oynatmayın"),
  "Kırık şüphesinde kol bulunduğu konumda sabitlenir ve üçgen sargıyla askıya alınır; kemik yerine oturtulmaya çalışılmaz");
// 13 Kafa çarpması
S.kafa = svg(floor(184) + chair(92, 124) +
  person({ head: [118, 58], neck: [116, 76], hip: [118, 126], lk: [168, 126], lf: [172, 178], rk: [164, 132], rf: [166, 178], l: { el: [102, 70], ha: [116, 42] }, r: { el: [134, 110], ha: [150, 114] }, skin: SKIN[1], hair: "#2a1d14", shirt: BLUE, pants: NAVY, hairAng: -110, hairSpan: 80, eye: [124, 57] }) +
  `<rect x="100" y="30" width="30" height="16" rx="5" fill="#9ad7f7" stroke="#5fb3ec" transform="rotate(-12 115 38)"/>` +
  T(196, 54, "Beze sarılı buz", { bold: true }) + T(196, 72, "İlk 24 saat", { bold: true }) + T(196, 88, "yalnız bırakmayın") +
  T(196, 120, "Kusma, uyku hali,", { bold: true, c: "#c4302b", size: 12 }) + T(196, 136, "şiddetli baş ağrısı:", { bold: true, c: "#c4302b", size: 12 }) + T(196, 154, "→ 112", { bold: true, c: "#c4302b", size: 15 }),
  "Kafa çarpmasında şişliğe beze sarılı buz konur, kişi ilk 24 saat yalnız bırakılmaz; kusma, artan uyku hali veya şiddetli baş ağrısında 112");
// 14 Burun kanaması
S.burun = svg(floor(184) + chair(84, 124) +
  person({ head: [128, 64], neck: [116, 80], hip: [110, 126], lk: [160, 128], lf: [164, 178], rk: [156, 134], rf: [158, 178], l: { el: [146, 98], ha: [140, 70] }, r: { el: [140, 106], ha: [152, 118] }, skin: SKIN[0], hair: "#7a4b2a", shirt: "#e85d8a", pants: JEANS, longHair: true, hairAng: -60, eye: [134, 60] }) +
  `<path d="M140 72 q2 5 0 9" stroke="${RED}" stroke-width="2" fill="none"/>` +
  arrow("M104 40 q22 -12 40 4", "M140 36 l10 9 l-12 3 z") +
  T(196, 54, "Hafif öne eğilin", { bold: true }) + T(196, 76, "Burnun yumuşak", { bold: true }) + T(196, 92, "kısmını sıkın", { bold: true }) + T(196, 110, "10-15 dakika", { c: BLUE, bold: true }) +
  NO(180, 146, "Başı geriye atmayın"),
  "Burun kanamasında dik oturulur, baş hafif öne eğilir, burnun yumuşak kısmı 10-15 dakika sıkılır; baş geriye atılmaz");
// 15 Yılan ve akrep
S.yilan = svg(floor(176) +
  `<rect x="20" y="140" width="176" height="10" rx="3" fill="#c49a6c"/>` + line([[24, 124], [176, 124]], 28, SKIN[1]) + `<ellipse cx="190" cy="124" rx="19" ry="15" fill="${SKIN[1]}"/>` +
  `<path d="M50 108 v34 M80 108 v34 M150 108 v34 M176 108 v34" stroke="#fff" stroke-width="5"/>` +
  `<circle cx="110" cy="120" r="3.2" fill="${RED}"/><circle cx="122" cy="120" r="3.2" fill="${RED}"/><ellipse cx="116" cy="120" rx="16" ry="8" fill="${RED}" opacity=".15"/>` +
  `<path d="M30 196 q20 -14 40 0 t40 0 t36 -4" stroke="#6b8e23" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="148" cy="191" r="6" fill="#6b8e23"/>` +
  T(20, 34, "Sakin ve hareketsiz tutun", { bold: true }) + T(20, 52, "gevşek atel · yüzük, saat çıkarın") + T(20, 70, "hızla hastaneye · 112 / 114", { bold: true, c: "#c4302b" }) +
  NO(222, 100, "Turnike") + NO(222, 120, "Kesme") + NO(222, 140, "Ağızla emme") + NO(222, 160, "Buz"),
  "Yılan veya akrep sokmasında kişi sakin ve hareketsiz tutulur, uzuv gevşekçe sabitlenir, hızla hastaneye gidilir; turnike, kesme, emme, buz yapılmaz");
// 16 Arı sokması: kartla kazıma
S.bocek = svg(`<rect x="0" y="120" width="320" height="90" fill="${SKIN[0]}"/><path d="M0 120 q160 -8 320 0" fill="none" stroke="${dark(SKIN[0])}" stroke-width="2"/>` +
  `<circle cx="120" cy="124" r="14" fill="#f0a08a" opacity=".6"/><path d="M120 121 l3 -22" stroke="#333" stroke-width="2.6"/><ellipse cx="124" cy="97" rx="4" ry="5" fill="#6b4a2b"/>` +
  `<rect x="150" y="62" width="88" height="54" rx="7" fill="${BLUE}" transform="rotate(-14 194 89)"/><rect x="160" y="74" width="30" height="20" rx="3" fill="#f7c948" transform="rotate(-14 194 89)"/>` +
  arrow("M206 140 h-64", "M148 133 l-11 7 l11 7 z", NAVY) +
  `<g transform="translate(250 40)"><ellipse cx="0" cy="0" rx="16" ry="11" fill="#f7c948"/><path d="M-6 -10 v20 M4 -10 v20" stroke="#333" stroke-width="4"/><ellipse cx="-4" cy="-14" rx="9" ry="6" fill="#d6ecff" opacity=".9"/><ellipse cx="6" cy="-14" rx="8" ry="5" fill="#d6ecff" opacity=".9"/><circle cx="16" cy="0" r="5" fill="#333"/></g>` +
  T(20, 34, "İğneyi kartın kenarıyla", { bold: true }) + T(20, 51, "yana doğru kazıyın", { bold: true }) + NO(20, 76, "Cımbızla sıkmayın") +
  T(20, 182, "Yıkayın · beze sarılı buz 10-20 dk", { bold: true, c: NAVY }) + T(20, 200, "Dudak-dil şişerse → 112", { bold: true, c: "#c4302b" }),
  "Arı iğnesi kredi kartı gibi düz kenarlı bir şeyle yana doğru kazınarak çıkarılır, cımbızla sıkılmaz; dudak veya dil şişerse 112");
// 17 Hayvan ısırığı: su ve sabun
S.isirik = svg(`<rect x="0" y="168" width="320" height="42" fill="#d9e6ec"/>` +
  `<path d="M60 26 h70 v18 h-22 v14 h-22 v-14 h-26 z" fill="#9aa7b0"/>` +
  `<path d="M97 60 q-4 30 0 52 M90 62 q-4 28 0 48 M104 62 q4 28 0 48" stroke="#5fb3ec" stroke-width="4" fill="none" stroke-linecap="round"/>` +
  line([[14, 140], [140, 130]], 28, SKIN[2]) + `<ellipse cx="152" cy="130" rx="18" ry="14" fill="${SKIN[2]}"/>` + line([[0, 142], [22, 140]], 30, GREEN) +
  `<circle cx="92" cy="128" r="3" fill="${RED}"/><circle cx="102" cy="132" r="3" fill="${RED}"/>` +
  `<circle cx="80" cy="118" r="6" fill="#fff" stroke="#cde"/><circle cx="114" cy="116" r="5" fill="#fff" stroke="#cde"/><circle cx="124" cy="124" r="4" fill="#fff" stroke="#cde"/>` +
  `<g transform="translate(250 128) scale(.85)" fill="#8a6a4a"><ellipse cx="0" cy="20" rx="30" ry="16"/><circle cx="30" cy="0" r="14"/><path d="M36 -12 l10 -8 l-2 14 z"/><rect x="-24" y="28" width="7" height="20" rx="3"/><rect x="12" y="28" width="7" height="20" rx="3"/><path d="M-30 16 q-14 -8 -10 -20" stroke="#8a6a4a" stroke-width="6" fill="none" stroke-linecap="round"/></g>` +
  T(196, 50, "Bol su ve sabunla", { bold: true }) + T(196, 66, "iyice yıkayın", { bold: true }) + T(196, 90, "Aynı gün sağlık", { bold: true, c: "#c4302b" }) + T(196, 106, "kuruluşuna gidin", { bold: true, c: "#c4302b" }),
  "Hayvan ısırığında yara hemen bol su ve sabunla yıkanır ve aynı gün sağlık kuruluşuna gidilir");
// 18 Kene
S.kene = svg(`<rect x="0" y="132" width="320" height="78" fill="${SKIN[0]}"/><path d="M0 132 q160 -8 320 0" fill="none" stroke="${dark(SKIN[0])}" stroke-width="2"/>` +
  `<ellipse cx="120" cy="124" rx="14" ry="10" fill="#6b3f26"/><circle cx="120" cy="134" r="3" fill="#3a2416"/><path d="M108 128 l-9 8 M112 131 l-4 9 M128 131 l4 9 M132 128 l9 8" stroke="#3a2416" stroke-width="2"/>` +
  `<path d="M114 128 l-22 -104 M126 128 l22 -104" stroke="#9aa7b0" stroke-width="5" stroke-linecap="round"/><path d="M92 24 q28 -10 56 0" stroke="#9aa7b0" stroke-width="5" fill="none"/>` +
  arrow("M178 120 v-74", "M171 52 l7 -11 l7 11 z", NAVY) +
  T(196, 56, "Deriye en yakın", { bold: true }) + T(196, 72, "yerden tutun,", { bold: true }) + T(196, 92, "döndürmeden", { bold: true }) + T(196, 108, "düz yukarı çekin", { bold: true }) +
  NO(20, 172, "Sigara, kolonya, yağ dökmeyin") + T(20, 196, "10 gün içinde ateş olursa hekime", { size: 12, bold: true, c: "#c4302b" }),
  "Kene ince uçlu cımbızla deriye en yakın yerinden tutulur ve döndürmeden düz yukarı çekilir; üzerine sigara, kolonya, yağ dökülmez");
export default S;

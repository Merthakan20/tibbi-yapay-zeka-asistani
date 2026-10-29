// Vücut haritasındaki şikayetleri şikayet formunun ürettiği soru biçimine çevirir: node tools/arama-karsilastir/bolge.js > bolge.json
const fs = require("fs");
const s = fs.readFileSync("artifact/nabiz.html", "utf8");
const regions = eval(s.match(/const REGIONS = (\[[\s\S]*?\n  \]);/)[1]);
const qs = [];
for (const r of regions) for (const c of r.items) qs.push(`${c} şikayetim var (${r.ad.toLocaleLowerCase("tr-TR")} bölgesi). Süre: birkaç gündür. Şiddet: 5/10.`);
process.stdout.write(JSON.stringify(qs));

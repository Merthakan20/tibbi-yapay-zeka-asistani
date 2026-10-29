const fs=require("fs");const s=fs.readFileSync("artifact/nabiz.html","utf8");
const code='const docs=[];let library;'+s.match(/  const STOP =[\s\S]*?\n  const terms = [^\n]*\n/)[0]+s.match(/  const POPULATIONS[\s\S]*?\n  function search\([\s\S]*?\n  }\n/)[0]+';return {search,terms,setLib:(l)=>{library=l}};';
const A=new Function(code)();const d=JSON.parse(fs.readFileSync("kaynaklar/kaynaklar.json","utf8"));
A.setLib(d.kaynaklar.map(k=>({title:k.baslik,text:k.ozet,kw:[k.konu,...(k.anahtar_kelimeler||[])].join(" "),phrases:[k.konu,...(k.anahtar_kelimeler||[])],topic:k.konu})));
for(const q of process.argv.slice(2)){console.log("#",q,"→",A.terms(q).join(","));A.search(q,{useDocs:false}).forEach(h=>console.log("    ",h.title.slice(0,60)))}

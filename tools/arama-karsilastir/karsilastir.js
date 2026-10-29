const fs=require("fs");
function mk(h,l){const s=fs.readFileSync(h,"utf8");const code='const docs=[];let library;'+s.match(/  const STOP =[\s\S]*?\n  const terms = [^\n]*\n/)[0]+s.match(/  const POPULATIONS[\s\S]*?\n  function search\([\s\S]*?\n  }\n/)[0]+';return {search,setLib:(l)=>{library=l}};';
const A=new Function(code)();const d=JSON.parse(fs.readFileSync(l,"utf8")).kaynaklar;A.setLib(d.map(k=>({title:k.baslik,text:k.ozet,kw:[k.konu,...k.anahtar_kelimeler].join(" "),phrases:[k.konu,...k.anahtar_kelimeler],topic:k.konu,id:k.id})));
const m=new Map(d.map(k=>[k.baslik,k.konu]));return q=>{const r=A.search(q,{useDocs:false});return r.length?m.get(r[0].title):"—"}}
const [oh,ol,nh,nl,qf]=process.argv.slice(2);const O=mk(oh,ol),N=mk(nh,nl);
const raw=JSON.parse(fs.readFileSync(qf,"utf8"));const qs=raw.map(x=>typeof x=="string"?x:(x.soru||x.q||x[0]));
let c=0;for(const q of qs){const a=O(q),b=N(q);if(a!==b){c++;console.log(q.slice(0,70),"|",a,"→",b)}}console.log("değişen:",c,"/",qs.length);

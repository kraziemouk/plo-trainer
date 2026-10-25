import fs from 'fs';import {webcrypto} from 'crypto';
import * as C from '/workspace/plo-trainer/supabase/functions/live/core.js';
const src=fs.readFileSync('/workspace/plo-trainer/index.html','utf8').split('<script>')[1].split('</script>')[0];
let st=null,t=Date.now();const A=(c,m)=>{if(!c)throw new Error("ASSERT "+m)};
function run(fn){const E=C.makeEngine(src,webcrypto);E.setBudget(500);const live=C.load(E,st);const r=fn(E,live);C.step(E,live,t);st=C.save(E,live);st._E=null;return {E,live,r};}
let x=run((E,l)=>C.apply(E,l,{type:'beat'},t));A(x.live.status==='paused','paused empty');
x=run((E,l)=>C.apply(E,l,{type:'join',uid:'a',name:'Al',granted:5000},t));A(x.live.status==='countdown',"countdown "+x.live.status);
x=run((E,l)=>C.apply(E,l,{type:'join',uid:'b',name:'Bo',granted:300},t));t+=6000;
let acts=0,hands=0;for(let k=0;k<150;k++){x=run((E,l)=>{const G=E.G;for(const u of ['a','b']){C.apply(E,l,{type:'beat',uid:u},t);const p=C.privateState(E,l,u,50);if(p.legal){acts++;C.apply(E,l,{type:'act',uid:u,act:p.legal.toCall>0?'call':'check'},t);}}return G.handNo;});t+=2000;hands=x.r;}
const pub=C.publicState(x.E,x.live,'main','Main');A(pub.seats.filter(s=>s.human).length===2,'two humans');A(hands>3,'hands '+hands);
A(!JSON.stringify(pub).includes(JSON.stringify(x.E.G.seats[pub.seats.findIndex(s=>s.uid==='a')].hand))||pub.over,'no leak');
console.log('hands',hands,'acts',acts,'size',JSON.stringify(st).length,pub.status);
// b closes browser: stop beating b
for(let k=0;k<120;k++){x=run((E,l)=>{C.apply(E,l,{type:"beat",uid:"a"},t);const p=C.privateState(E,l,'a',50);if(p.legal)C.apply(E,l,{type:'act',uid:'a',act:p.legal.toCall>0?'call':'check'},t);return E.G.handNo;});t+=2000;}
const p2=C.publicState(x.E,x.live,'main','Main');console.log('after b gone: hands',x.r,'humans',p2.humans,p2.seats.map(s=>s.name).join(','));A(p2.humans===1&&x.r>hands,'continues');
for(let k=0;k<60;k++){x=run(()=>0);t+=2000;}const p3=C.publicState(x.E,x.live,'main','Main');A(p3.status==='paused'&&p3.humans===0,'paused '+p3.status);
x=run((E,l)=>C.apply(E,l,{type:'join',uid:'c',name:'Cy',granted:200},t));t+=6000;x=run(()=>0);A(C.publicState(x.E,x.live).status!=='paused','resumed');
// muck/show: run until a showdown hand ends, check only winners' cards public, then show
let sdChecked=0,showChecked=0;for(let k=0;k<200&&!(sdChecked&&showChecked);k++){x=run((E,l)=>{const G=E.G;C.apply(E,l,{type:'beat',uid:'c'},t);const p=C.privateState(E,l,'c',20);if(p.legal)C.apply(E,l,{type:'act',uid:'c',act:p.legal.toCall>0?'call':'check'},t);
  if(G.handOver&&G.handNo){const pub=C.publicState(E,l,'main','Main');const live=G.seats.filter(s=>!s.folded).length;const ws=new Set((pub.winInfo||[]).map(w=>w.seat));
    if(live>1){A(pub.winCards&&pub.winCards.length>=5,'win cards');pub.seats.forEach((s,i)=>{if(!ws.has(i))A(s.shown===null||(l.shows||{})[i]===G.handNo,'loser mucked '+i);else A(s.shown,'winner shown');});
      const lines=pub.log.filter(x=>/: (?:[2-9TJQKA][shdc] ){4}[2-9TJQKA][shdc] — /.test(x));A(lines.every(x=>pub.seats.some(s=>s.shown&&x.startsWith(s.name+':'))),'no mucked cards in log');sdChecked++;}
    else{A(!pub.winCards&&pub.winInfo[0].unc,'uncontested no cards');}
    const ci=G.seats.findIndex(s=>s.remote&&s.remote.uid==='c');if(ci>0&&!ws.has(ci)&&!showChecked){C.apply(E,l,{type:'show',uid:'c'},t);const p2=C.publicState(E,l,'main','Main');A(JSON.stringify(p2.seats[ci].shown)===JSON.stringify(G.seats[ci].hand),'show reveals');showChecked++;}}
  return 0;});t+=2000;}
A(sdChecked&&showChecked,'muck/show exercised '+sdChecked+' '+showChecked);
console.log('CORE OK (muck/show checked)');

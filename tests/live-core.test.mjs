import fs from 'fs';import {webcrypto} from 'crypto';
import * as C from '../supabase/functions/live/core.js';
const src=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').split('<script>')[1].split('</script>')[0];
let st=null,t=Date.now();const A=(c,m)=>{if(!c)throw new Error("ASSERT "+m)};
function run(fn){const E=C.makeEngine(src,webcrypto);E.setBudget(500);const live=C.load(E,st);const r=fn(E,live);C.step(E,live,t);st=C.save(E,live);return {E,live,r};}
const pub=x=>C.publicState(x.E,x.live,'main','Main');
const playAll=(uids)=>(E,l)=>{for(const u of uids){C.apply(E,l,{type:'beat',uid:u},t);const p=C.privateState(E,l,u,30);if(p.legal)C.apply(E,l,{type:'act',uid:u,act:p.legal.toCall>0?'call':'check'},t);}return E.G.handNo;};
let x=run(()=>0);A(x.live.status==='paused','paused empty');A(pub(x).seats.every(s=>s.name==='Empty'),'no bots on empty table');
x=run((E,l)=>C.apply(E,l,{type:'join',uid:'a',name:'Al',granted:5000,seat:3},t));t+=6000;x=run(playAll(['a']));t+=6000;x=run(playAll(['a']));
let p=pub(x);A(p.status==='waiting'&&p.seated===1&&p.open===7&&!p.handNo,'one human waits '+p.status+' '+p.seated);A(p.seats[3].name==='Al','preferred seat');
x=run((E,l)=>C.apply(E,l,{type:'join',uid:'b',name:'Bo',granted:300},t));t+=6000;
let hands=0;for(let k=0;k<150;k++){x=run(playAll(['a','b']));t+=2000;hands=x.r;}
p=pub(x);A(hands>3,'hands '+hands);A(p.seated===2&&p.open===6,'counts '+p.seated+'/'+p.open+' '+JSON.stringify(x.E.G.log.slice(-25)));A(p.seats.filter(s=>!s.human).every(s=>s.name==='Empty'),'empty seats stay empty');
A(x.E.G.log.every(l=>!/^(Mouk|Rich|Todd|Milton|Yum|Willy|Rickey|Ram|Jamal|Ben|L|David N) (calls|bets|raises|checks|folds)/.test(l)),'no bot actions');
let sdChecked=0,showChecked=0;for(let k=0;k<200&&!(sdChecked&&showChecked);k++){x=run((E,l)=>{const G=E.G;playAll(['a','b'])(E,l);
  if(G.handOver&&G.handNo){const q=C.publicState(E,l,'main','Main');const ws=new Set((q.winInfo||[]).map(w=>w.seat));const live=G.seats.filter(s=>!s.folded).length;
    if(live>1){A(q.winCards&&q.winCards.length>=5,'win cards');q.seats.forEach((s,i)=>{if(!ws.has(i))A(s.shown===null||(l.shows||{})[i]===G.handNo,'loser mucked');else A(s.shown,'winner shown');});sdChecked++;}
    for(const u of ['a','b']){const ci=G.seats.findIndex(s=>s.remote&&s.remote.uid===u);if(ci>=0&&!ws.has(ci)&&!showChecked){C.apply(E,l,{type:'show',uid:u},t);const q2=C.publicState(E,l,'main','Main');A(JSON.stringify(q2.seats[ci].shown)===JSON.stringify(G.seats[ci].hand),'show reveals');showChecked++;}}}
  return 0;});t+=2000;}
A(sdChecked&&showChecked,'muck/show exercised');
const h0=x.E.G.handNo;for(let k=0;k<80;k++){x=run(playAll(['a']));t+=2000;}
p=pub(x);A(p.seated===1&&p.status==='waiting'&&p.over,'waits after drop: '+p.status+' seated '+p.seated);A(x.E.G.handNo<=h0+2,'no new hands while waiting');A(p.seats.filter(s=>s.name==='Bo').length===0,'Bo seat open');
x=run((E,l)=>C.apply(E,l,{type:'join',uid:'c',name:'Cy',granted:200},t));t+=6000;x=run(playAll(['a','c']));t+=6000;x=run(playAll(['a','c']));A(x.E.G.handNo>p.handNo,'resumed with 2');
console.log('LIVE CORE OK (no bots): hands',hands,'showdowns',sdChecked);

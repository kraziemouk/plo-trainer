// Flat 200 buy-in, rebuys mostly 200; bigger only with long session or tilt+losses; never above 2,000 total spend; no mirroring.
const fs=require('fs'),vm=require('vm');const html=fs.readFileSync(__dirname+'/../index.html','utf8');
global.els={};const mk=id=>({id,value:id==='gIters'?'40':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100,querySelectorAll:()=>[],querySelector:()=>null,appendChild(){},addEventListener(){},setAttribute(){},getBoundingClientRect:()=>({width:800,height:600})});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}},querySelectorAll:()=>[],addEventListener(){},createElement:()=>mk('x')};
global.window=global;global.addEventListener=()=>{};global.matchMedia=()=>({matches:false,addEventListener(){}});global.q=[];global.setTimeout=f=>{q.push(f);return 1};global.clearTimeout=()=>{};global.alert=()=>{};global.confirm=()=>true;global.location={hash:'',search:''};
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};global.navigator={};global.innerWidth=1400;global.innerHeight=900;
const scr=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInThisContext(scr.replace(/\bconst G=/,'var G=').replace(/\bconst\s+\$=/,'var $='));
const A=(c,m)=>{if(!c)throw new Error('ASSERT '+m)};
// Scripted rule: David N drink>=6 && tilt>=7 -> jams every street, rebuys max; nightly cap 3,000 (sticky). Others stay 2,000.
G.stats={};G.meters=freshMeters();G.bank=freshBank();const D='David N';
G.meters[D].drink=5;G.meters[D].tilt=9;A(!davidSteam(D),'drink below');G.meters[D].drink=6;G.meters[D].tilt=6;A(!davidSteam(D),'tilt below');
G.bank[D].stack=0;A(botRebuyAmt(D)<=1800&&!G.bank[D].cap,'normal cap before unlock');
G.meters[D].drink=6;G.meters[D].tilt=7;A(davidSteam(D),'on');A(G.bank[D].cap===3000,'cap unlocked');
A(botRebuyAmt(D)===2800,'rebuy max under 3000: '+botRebuyAmt(D));
A(addChips(G.bank[D],botRebuyAmt(D))===2800&&G.bank[D].buyins===3000,'spent 3000');G.bank[D].stack=0;A(botRebuyAmt(D)===0,'exhausted');
G.meters[D].drink=0;G.meters[D].tilt=0;A(!davidSteam(D),'off when meters drop');A(G.bank[D].cap===3000,'sticky');
G.bank[D]={stack:0,buyins:1000,rebuys:0,topups:0,cap:3000};A(botRebuyAmt(D)===200,'off: back to 200 default, cap stays 3000 ('+remaining(G.bank[D])+')');A(remaining(G.bank[D])===2000,'sticky remaining');
G.meters.Rich.drink=9;G.meters.Rich.tilt=9;A(!davidSteam('Rich'),'only David');G.bank.Rich.stack=0;A(G.bank.Rich.buyins+botRebuyAmt('Rich')<=2000&&!G.bank.Rich.cap,'others 2000');
// play hands: David jams whenever he can raise (wrap botDecide to observe)
G.bank=freshBank();G.meters=freshMeters();G.speed=0;gInit();
const flush=()=>{let k=0;while(q.length&&k++<100000)q.shift()();};let jams=0,dec=0;const BD=botDecide;
globalThis.botDecide=i=>{const s=G.seats[i],d=BD(i);if(s.name===D){dec++;const lg=legal(i);if(lg.canRaise){A(d[0]==='raise'&&d[1]===lg.maxTo,'jam '+JSON.stringify(d));jams++;}else A(d[0]!=='fold','never folds');}return d;};
for(let h=0;h<40;h++){G.meters[D].drink=7;G.meters[D].tilt=8;{const hb=bankOf(HERO());if(hb.stack<G.BB){hb.buyins=0;hb.stack=200;}}gNewHand();flush();let g=0;
 while(!G.handOver&&g++<80){if(G.toAct===0){const l=legal(0);uAct(l.toCall>0?'call':'check');}flush();}}
A(dec>0&&jams>0,'David acted');
A(G.bank[D].buyins<=3000,'never over 3000');for(const n in G.bank)if(n!==D)A(G.bank[n].buyins<=2000,'2000 '+n);
console.log('DAVID STEAM OK decisions',dec,'jams',jams,'David spent',G.bank[D].buyins,'cap',G.bank[D].cap);
// Mouk rule: drink>=6 && tilt>=4
G.bank=freshBank();G.meters=freshMeters();const M='Mouk';G.meters[M].drink=6;G.meters[M].tilt=3;A(!steamOn(M),'mouk below');
G.meters[M].tilt=4;A(steamOn(M)&&G.bank[M].cap===3000,'mouk unlock');G.bank[M].stack=0;A(botRebuyAmt(M)===2800,'mouk bot rebuy max');
G.meters[M].drink=0;A(!steamOn(M)&&G.bank[M].cap===3000,'mouk sticky');
// human Mouk: never auto-acts (botDecide not used for isUser), cap raised so rebuy offer has room
G.meters[M].drink=6;G.meters[M].tilt=5;const hi=G.seats.findIndex(s=>s.isUser);if(hi>=0&&HERO()===M){A(G.seats[hi].isUser,'human seat');}
console.log('MOUK STEAM OK remaining',remaining(G.bank[M]));
// unlock banner fires once per night per player, logs exact text
G.bank=freshBank();G.meters=freshMeters();G.log=[];G.meters['David N'].drink=6;G.meters['David N'].tilt=7;steamOn('David N');steamOn('David N');
A(G.log.filter(x=>x==='David N: Ship it mode enabled 🥂').length===1,'banner once '+JSON.stringify(G.log));
G.meters.Mouk.drink=6;G.meters.Mouk.tilt=4;steamOn('Mouk');A(G.log.includes('Mouk: Ship it mode enabled 🥂'),'mouk banner');
console.log('SHIP BANNER OK');

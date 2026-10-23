// Flat 200 buy-in, rebuys mostly 200; bigger only with long session or tilt+losses; never above 2,000 total spend; no mirroring.
const fs=require('fs'),vm=require('vm');const html=fs.readFileSync(__dirname+'/../index.html','utf8');
global.els={};const mk=id=>({id,value:id==='gIters'?'40':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100,querySelectorAll:()=>[],querySelector:()=>null,appendChild(){},addEventListener(){},setAttribute(){},getBoundingClientRect:()=>({width:800,height:600})});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}},querySelectorAll:()=>[],addEventListener(){},createElement:()=>mk('x')};
global.window=global;global.addEventListener=()=>{};global.matchMedia=()=>({matches:false,addEventListener(){}});global.q=[];global.setTimeout=f=>{q.push(f);return 1};global.clearTimeout=()=>{};global.alert=()=>{};global.confirm=()=>true;global.location={hash:'',search:''};
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};global.navigator={};global.innerWidth=1400;global.innerHeight=900;
const scr=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInThisContext(scr.replace(/\bconst G=/,'var G=').replace(/\bconst\s+\$=/,'var $='));
const A=(c,m)=>{if(!c)throw new Error('ASSERT '+m)};
A(G.START===200,'start 200');
const fb=freshBank();for(const n in fb)A(fb[n].stack===200&&fb[n].buyins===200,'flat buy-in '+n);
// distribution over realistic states: hands 0..400, tilt 0..9
let r={},n=0;G.stats={};G.meters=freshMeters();G.bank=freshBank();
for(let k=0;k<4000;k++){const name='David N';G.stats[name]={hands:Math.floor(Math.random()*Math.random()*400)};G.meters[name].tilt=Math.random()<0.75?Math.floor(Math.random()*3):Math.floor(Math.random()*10);
 G.bank[name]={stack:0,buyins:200+200*Math.floor(Math.random()*5),rebuys:0,topups:0};const a=botRebuyAmt(name);A(a%200===0||a===remaining(G.bank[name]),'multiple of 200');A(G.bank[name].buyins+a<=2000,'cap');r[a]=(r[a]||0)+1;n++;}
const p200=(r[200]||0)/n;console.log('rebuy amount distribution',JSON.stringify(r),'share 200 =',(p200*100).toFixed(1)+'%');A(p200>0.6,'most rebuys are 200');
// fresh player, no tilt: exactly 200
G.stats={};G.meters=freshMeters();G.bank=freshBank();G.bank.Rich.stack=0;A(botRebuyAmt('Rich')===200,'default 200');
// no mirroring: hero wins huge; bot rebuy unaffected
G.bank[HERO()].stack=12000;A(botRebuyAmt('Rich')===200,'no mirror');
// cap reached
G.bank.Rich.buyins=2000;A(botRebuyAmt('Rich')===0,'zero remaining');
// human default rebuy 200
G.bank[HERO()]={stack:0,buyins:200,rebuys:0,topups:0};A(mookRebuy()===200,'human default 200');
console.log('REBUY RULES OK');
// Mouk bot style: chase tendency 0.6 early -> 0.85 late
{G.sessionStart=Date.now();const RD=Date;const at=h=>{global.Date=class extends RD{constructor(...a){if(a.length)super(...a);else{super();this.setHours(h,0,0,0);}}static now(){return RD.now();}};};
 at(14);const e=moukShift({...MOUK_PROF});at(1);const l=moukShift({...MOUK_PROF});global.Date=RD;
 A(Math.abs(e.chaseTend-0.6)<1e-3&&Math.abs(l.chaseTend-0.85)<0.07&&l.tight<e.tight,'mouk late shift '+e.chaseTend+' '+l.chaseTend);console.log('MOUK STYLE OK early',e.chaseTend,'late',l.chaseTend.toFixed(2));}

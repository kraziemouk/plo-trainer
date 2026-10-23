// Flat 200 buy-in, rebuys mostly 200; bigger only with long session or tilt+losses; never above 2,000 total spend; no mirroring.
const fs=require('fs'),vm=require('vm');const html=fs.readFileSync(__dirname+'/../index.html','utf8');
global.els={};const mk=id=>({id,value:id==='gIters'?'40':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100,querySelectorAll:()=>[],querySelector:()=>null,appendChild(){},addEventListener(){},setAttribute(){},getBoundingClientRect:()=>({width:800,height:600})});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}},querySelectorAll:()=>[],addEventListener(){},createElement:()=>mk('x')};
global.window=global;global.addEventListener=()=>{};global.matchMedia=()=>({matches:false,addEventListener(){}});global.q=[];global.setTimeout=f=>{q.push(f);return 1};global.clearTimeout=()=>{};global.alert=()=>{};global.confirm=()=>true;global.location={hash:'',search:''};
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};global.navigator={};global.innerWidth=1400;global.innerHeight=900;
const scr=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInThisContext(scr.replace(/\bconst G=/,'var G=').replace(/\bconst\s+\$=/,'var $='));
const A=(c,m)=>{if(!c)throw new Error('ASSERT '+m)};
G.meters=freshMeters();G.bank=freshBank();G.brBase={};
const set=(n,net,drink)=>{G.brBase[n]=net;G.bank[n].stack=200;G.bank[n].buyins=200;G.meters[n].drink=drink;return brMods(n);};
// winning sober: small capped gain
let m=set('Rickey',1000,0);A(m.q==='winning/sober'&&m.loose>1&&m.loose<=1+0.05*1.4+1e-9&&m.chase===0,'win sober '+JSON.stringify(m));
// winning drunk: loosest
const wd=set('Rickey',1000,9);A(wd.q==='winning/drunk'&&wd.loose>m.loose&&Math.abs(wd.loose-(1+0.4*1.4))<1e-9,'win drunk '+JSON.stringify(wd));
// losing sober: tighten
m=set('Willy',-1000,0);A(m.q==='losing/sober'&&Math.abs(m.loose-(1-0.25*0.6))<1e-9&&m.chase===0,'lose sober '+JSON.stringify(m));
// losing drunk: chase not tighten
m=set('David N',-1000,9);A(m.q==='losing/drunk'&&m.loose===1&&Math.abs(m.chase-0.3*1.3*1.4)<1e-9,'lose drunk '+JSON.stringify(m));
m=set('Willy',-1000,9);A(Math.abs(m.chase-0.3)<1e-9,'disciplined drunk swing 1.0');
// clamp and persistence across sessions
G.brBase={};G.bank=freshBank();G.bank.Todd.stack=1700;G.bank.Todd.buyins=200;A(brMods('Todd').br===1,'clamp');
newSession();A(JSON.parse(localStorage.getItem('plo5br')).Todd===1500,'persisted');G.brBase=null;A(brNet('Todd')===1500,'reload');
// migration: old names
localStorage.setItem('plo5br',JSON.stringify({Ricky:300}));G.brBase=null;A(brNet('Rickey')===300+ (G.bank.Rickey.stack-G.bank.Rickey.buyins),'migrate');
console.log('BANKROLL QUADRANTS OK');

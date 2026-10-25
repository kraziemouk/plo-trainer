// Server-authoritative live table engine. Runs the same game/bot code as index.html (engine source injected),
// with a cryptographically secure RNG. Pure: load(state) -> apply(action) -> step(now) -> save().
export const DAY_CAP=10000, TURN_MS=30000, AWAY_TURN_MS=3000, AWAY_AFTER_MS=20000, DROP_AFTER_MS=60000, COUNTDOWN_MS=5000, SERVER_HERO="Mouk";
function stubs(){const els={};const mk=id=>({id,value:undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100,querySelector(){return null},querySelectorAll(){return []}});
  const store=new Map();const q=[];
  return {q,document:{getElementById:id=>els[id]||(els[id]=mk(id)),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>mk('x'),body:{classList:{toggle(){},add(){},remove(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}}},
    localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),key:()=>null,length:0},
    setTimeout:(f)=>{q.push(f);return q.length},clearTimeout:()=>{}};}
export const YIELD={yield:true};
export function safe(f){try{f()}catch(e){if(e!==YIELD)throw e;}}
export function makeEngine(src,cryptoObj){const S=stubs();const win={};
  const body='with(window){'+src+`
;mpAwait=function(i){G.turnAt=__now();};
nextIdx=function(i){for(let k=1;k<=8;k++){const j=(i+k)%8,s=G.seats[j];if(s&&s.remote&&!s.sitout)return j;}return (i+1)%8;};
seatTable=function(){for(const s of G.seats){if(s.remote){s.name=s.remote.name;s.prof=null;}else{s.name="Empty";s.prof=null;s.stack=0;}}};
{const _ls=loadStacks;loadStacks=function(){_ls();for(const s of G.seats)if(!s.remote){s.stack=0;s.folded=true;}};}
trackEq=function(){};{const _q=quickOuts,M=new Map();quickOuts=function(h,b){const k=h.join(',')+'|'+b.join(',');if(M.has(k))return M.get(k);const v=_q(h,b);if(M.size>5000)M.clear();M.set(k,v);return v;};}{const _bd=botDecide;botDecide=function(i){if(__budget())throw __YIELD;return _bd(i);};}mpNewHandHook=function(){};mpAfterDeal=function(){};mpTick=function(){};try{sfx=function(){};}catch(e){}
G.rngNext=function(){return __rand();};
return {G,gInit,gNewHand,gAdvance,gAct,legal,canAct,mookRebuy,newSession,bankOf,equity,potTotal,saveStacks,loadStacks,tableInit,HERO,PROFILES,cardStr,bankNets};}`;
  const rand=()=>{const a=new Uint32Array(2);cryptoObj.getRandomValues(a);return (a[0]*2**21+(a[1]>>>11))/2**53;};
  let E_now=Date.now(),E_dead=0;const E=new Function('document','localStorage','window','setTimeout','clearTimeout','navigator','__rand','__now','__budget','__YIELD',body)(S.document,S.localStorage,win,S.setTimeout,S.clearTimeout,{userAgent:'server'},rand,()=>E_now,()=>E_dead&&Date.now()>E_dead,YIELD);
  E.setBudget=ms=>{E_dead=ms?Date.now()+ms:0;};E.setNow=t=>{E_now=t;};E.flush=()=>{let n=0;while(S.q.length&&n++<100000){try{S.q.shift()()}catch(e){}}};E.rand=rand;return E;}
const DROP_KEYS=new Set(["ui","frames","hands","lastRec","snap","stats","lb","lbStats","outStats","sizeStats","session","history","rngNext"]);
export function save(E,live){const G=E.G,o={};for(const k in G){if(DROP_KEYS.has(k)||typeof G[k]==="function")continue;o[k]=G[k];}o.need=[...(G.need||[])];o.log=(G.log||[]).slice(-60);return {G:o,live};}
export function load(E,st){const G=E.G;if(!st||!st.G){G.hero=SERVER_HERO;G.speed=0;G.fastBots=true;G.ui=null;E.gInit();G.seats[0].isUser=false;for(const s of G.seats){s.name="Empty";s.prof=null;s.stack=0;}G.handOver=true;G.handNo=0;G.log=[];return {humans:{},pending:[],nextAt:0,status:"paused",lastStep:0};}
  Object.assign(G,st.G);G.need=new Set(st.G.need||[]);G.ui=null;G.speed=0;G.fastBots=true;G.frames=[];G.session=[];G.history=[];G.seats[0].isUser=false;
  for(const s of G.seats){if(!s.remote&&(G.handOver||s.name==="Empty")){s.name="Empty";s.prof=null;if(G.handOver)s.stack=0;}}
  return st.live;}
const seatOf=(G,uid)=>G.seats.findIndex(s=>s.remote&&s.remote.uid===uid);
// actions: {type:'join',uid,name,granted,used} {type:'act',uid,act,to} {type:'rebuy',uid,granted,used} {type:'leave',uid} {type:'beat',uid}
export function apply(E,live,a,now){const G=E.G;E.setNow(now);const i=a.uid?seatOf(G,a.uid):-1;
  if(a.uid&&i>=0)G.seats[i].remote.seenAt=now;
  if(a.type==="join"){if(i>=0){const r=G.seats[i].remote;r.leaving=false;if(a.granted>0){r.pending=(r.pending||0)+a.granted;r.buyins+=a.granted;}return {ok:true,seat:i};}
    if(live.pending.find(p=>p.uid===a.uid)){return {ok:true,queued:true};}
    live.pending.push({uid:a.uid,name:a.name,granted:a.granted,at:now,seat:Number.isInteger(a.seat)?a.seat:null});E.G.log.push(`${a.name} will sit down at the next hand.`);return {ok:true,queued:true};}
  if(a.type==="rebuy"){if(i<0){const p=live.pending.find(p=>p.uid===a.uid);if(p){p.granted+=a.granted;return {ok:true};}return {ok:false,error:"not seated"};}const r=G.seats[i].remote;
    if(a.granted>0){r.pending=(r.pending||0)+a.granted;r.buyins+=a.granted;G.log.push(`${r.name} rebuys ${a.granted} (today ${a.used}/${DAY_CAP}).`);}return {ok:true};}
  if(a.type==="show"){if(i<0||!G.handOver||!G.handNo)return {ok:false,error:"nothing to show"};(live.shows=live.shows||{})[i]=G.handNo;G.log.push(`${G.seats[i].remote.name} shows ${G.seats[i].hand.map(E.cardStr).join(" ")}.`);return {ok:true};}
  if(a.type==="leave"){live.pending=live.pending.filter(p=>p.uid!==a.uid);if(i<0)return {ok:true};const r=G.seats[i].remote;r.leaving=true;G.log.push(`${r.name} is leaving after this hand.`);
    if(!G.handOver&&G.toAct===i){const lg=E.legal(i);E.gAct(i,lg.toCall>0?"fold":"check");safe(()=>E.gAdvance());E.flush();}return {ok:true};}
  if(a.type==="act"){if(i<0)return {ok:false,error:"not seated"};if(G.handOver||G.toAct!==i)return {ok:false,error:"not your turn"};
    const ok=["fold","check","call","raise","allin"];if(!ok.includes(a.act))return {ok:false,error:"bad action"};const lg=E.legal(i);
    if(a.act==="check"&&lg.toCall>0)return {ok:false,error:"can't check"};
    if(a.act==="allin")E.gAct(i,"raise",lg.maxTo);else if(a.act==="raise"){if(!lg.canRaise)return {ok:false,error:"can't raise"};E.gAct(i,"raise",Math.max(lg.minTo,Math.min(lg.maxTo,Math.round(+a.to||0))));}else E.gAct(i,a.act);
    safe(()=>E.gAdvance());E.flush();return {ok:true};}
  return {ok:true};}
export function humansSeated(G){return G.seats.filter(s=>s.remote).length;}
// time-driven progress: turn timers, away/drop, auto-deal with countdown, pause when empty
export function step(E,live,now){const G=E.G;E.setNow(now);
  for(let i=0;i<8;i++){const r=G.seats[i].remote;if(!r)continue;r.away=now-(r.seenAt||0)>AWAY_AFTER_MS;if(now-(r.seenAt||0)>DROP_AFTER_MS)r.leaving=true;}
  if(!G.handOver&&G.seats[G.toAct]&&G.seats[G.toAct].remote){const r=G.seats[G.toAct].remote,lim=r.away||r.leaving?AWAY_TURN_MS:TURN_MS;
    if(now-(G.turnAt||now)>=lim){const i=G.toAct,lg=E.legal(i);G.log.push(`${r.name} timed out.`);E.gAct(i,lg.toCall>0?"fold":"check");safe(()=>E.gAdvance());E.flush();}}
  if(!G.handOver&&G.seats[G.toAct]&&!G.seats[G.toAct].remote){safe(()=>E.gAdvance());E.flush();}
  if(!G.handOver){live.status="live";return;}
  // between hands: drop leavers, seat pending joiners
  for(let i=0;i<8;i++){const s=G.seats[i],r=s.remote;if(r&&r.leaving){G.log.push(`${r.name} left — the seat is open.`);(live.left=live.left||{})[r.uid]={net:r.stack-r.buyins,at:now};delete s.remote;s.name="Empty";s.prof=null;s.stack=0;}}
  for(const p of live.pending.slice()){const free=[0,1,2,3,4,5,6,7].filter(i=>!G.seats[i].remote);if(!free.length)break;const i=free.includes(p.seat)?p.seat:free[0];G.seats[i].name=p.name;
    G.seats[i].remote={uid:p.uid,name:p.name,stack:0,pending:p.granted,buyins:p.granted,seenAt:now};live.pending=live.pending.filter(x=>x!==p);G.log.push(`${p.name} sits in seat ${i}.`);}
  const ready=G.seats.filter(s=>s.remote&&(s.remote.stack||0)+(s.remote.pending||0)>=G.BB).length;
  if(!humansSeated(G)){live.status="paused";live.nextAt=0;return;}
  if(ready<2){live.status="waiting";live.nextAt=0;return;}
  if(!live.nextAt||live.status==="waiting"){live.nextAt=now+COUNTDOWN_MS;live.status="countdown";return;}
  if(now<live.nextAt){live.status="countdown";return;}
  live.nextAt=0;live.status="live";live.start={};live.shows={};
  E.bankOf(E.HERO()).stack=200;let r;safe(()=>{r=E.gNewHand();});E.flush();
  for(const s of G.seats)live.start[s.name]=(s.stack||0)+(s.total||0);
  if(G.handOver)live.nextAt=now+COUNTDOWN_MS;}
const CARDLINE=/^(.+): (?:[2-9TJQKA][shdc] ){4}[2-9TJQKA][shdc] — /;
export function publicState(E,live,id,name){const G=E.G;const over=!!(G.handOver&&G.handNo);const sd=over&&G.seats.filter(x=>!x.folded).length>1;
  const wi=over?(G.winInfo||[]):[];const winSeats=new Set(sd?wi.map(w=>w.seat):[]);const shows=live.shows||{};
  const revealed=i=>over&&(winSeats.has(i)||shows[i]===G.handNo);const revNames=new Set(G.seats.filter((s,i)=>revealed(i)).map(s=>s.name));
  const log=(G.log||[]).filter(l=>{if(/^Empty\b|Waitlist:|Seat \d opens/.test(l))return false;const m=CARDLINE.exec(l);return !m||revNames.has(m[1]);}).slice(-14);
  return {id,name,status:live.status,nextAt:live.nextAt||0,handNo:G.handNo||0,button:G.button,board:G.board||[],street:G.street||0,pot:G.handNo?E.potTotal():0,toAct:G.handOver?-1:G.toAct,turnAt:G.turnAt||0,over:!!G.handOver,
    log,winInfo:over?wi:null,winCards:sd?(G.winCards||null):null,meters:G.meters,humans:humansSeated(G),seated:humansSeated(G),open:8-humansSeated(G),pending:live.pending.map(p=>p.name),
    seats:G.seats.map((s,i)=>({name:s.name,stack:s.stack,bet:s.bet,total:s.total,folded:s.folded,allin:s.allin,human:!!s.remote,uid:s.remote?s.remote.uid:null,away:!!(s.remote&&s.remote.away),sitout:!!s.sitout,
      delta:G.handOver&&live.start&&live.start[s.name]!==undefined?s.stack-live.start[s.name]:null,shown:revealed(i)?s.hand:null}))};}
export function privateState(E,live,uid,iters){const G=E.G;const i=seatOf(G,uid);const pend=live.pending.find(p=>p.uid===uid);if(i<0)return {seat:null,queued:!!pend};
  const s=G.seats[i];const out={seat:i,hand:G.handNo?s.hand:null,handNo:G.handNo,legal:(!G.handOver&&G.toAct===i)?E.legal(i):null,buyins:s.remote.buyins,pendingChips:s.remote.pending||0};
  if(G.handNo&&!s.folded&&!G.handOver){const n=G.seats.filter((x,j)=>j!==i&&!x.folded).length;try{out.equity=n?E.equity(s.hand,G.board,n,iters||600):1;out.vs=n;}catch(e){}}
  return out;}

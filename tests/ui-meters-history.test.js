const fs=require('fs');const src=fs.readFileSync(''+require('path').join(__dirname,'..','index.html')+'','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const defs={hIn:'AhKh7c8d2s',bIn:'Qh5h3c',tgt:'4',eqN:'100',cmpN:'2000',tblN:'20',gIters:'200',gSpeed:'0'};
const mk=id=>({id,value:defs[id],checked:id==='gWeighted',innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
const store=new Map();global.quota=Infinity;global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{if(v.length>global.quota){const e=new Error('q');e.name='QuotaExceededError';throw e;}store.set(k,String(v))},removeItem:k=>store.delete(k)};
global.q=[];global.setTimeout=f=>q.push(f);global.confirm=()=>true;global.alert=()=>{};
require('vm').runInThisContext(src+'\n'+`
const flush=()=>{let n=0;while(q.length&&n++<100000)q.shift()();};
const A=(c,m)=>{if(!c)throw new Error("ASSERT "+m);};
// meter unit tests
G.meters=freshMeters();const m=G.meters["David N"];
for(let i=0;i<12;i++)bump("David N","drink");A(m.drink===2,"wrap 9->0 then +2: "+m.drink);
m.drink=1;A(drinkLvl("David N")===0,"lvl0");m.drink=2;A(drinkLvl("David N")===1,"L1");m.drink=4;A(drinkLvl("David N")===2,"L2");m.drink=7;A(drinkLvl("David N")===3,"L3");
m.tilt=3;A(tiltLvl("David N")===1,"t1");m.tilt=6;A(tiltLvl("David N")===2,"t2");m.tilt=9;A(tiltLvl("David N")===3,"t3");
const e3=effProf({name:"David N",prof:PROFILES[2]});A(e3.rand===0.2&&e3.over&&e3.think>PROFILES[2].think,"L3 effects");
G.meters=freshMeters();
// play hands at instant speed
G.speed=0;gInit();let acts=0;
for(let h=0;h<60;h++){gNewHand();flush();let g=0;while(!G.handOver&&g++<60){const lg=legal(0);if(lg.canRaise)els.gAmt={value:String(lg.maxTo)};else els.gAmt=undefined;uAct(['call','check','fold','raise'][acts++%4]);flush();}A(G.handOver,"hand over");
  for(const n of METERED){const x=G.meters[n];A(x.drink>=0&&x.drink<=9&&x.tilt>=0&&x.tilt<=9,"cap");}}
// sit-out water break
G.sitOutSetting=2;const before=G.meters["David N"].drink;gNewHand();flush();A(G.meters["David N"].drink===Math.max(0,before-1),"water break");while(!G.handOver){uAct('fold');flush();}G.sitOutSetting=-1;
console.log("meters after 61 hands",JSON.stringify(G.meters));
// history
const H=histAll();A(H.length===61,"hist len "+H.length);A(H[60].gno===61,"gno");A(H.every(r=>r.board.length===10||r.winners.length),"records");
const T=histTotals(H);console.log("hist totals",T);A(T.net===G.seats[0].net,"net matches session "+T.net+" vs "+G.seats[0].net);
A(leaksAll().length===G.session.length,"leaks persisted "+leaksAll().length+" vs "+G.session.length);
const save=exportSave();clearHist();A(histAll().length===0,"cleared");const n=mergeSave(JSON.parse(save));A(n===61,"import");A(mergeSave(JSON.parse(save))===61,"merge dedupe");
renderHist(0);renderSession();A(els.histTbl.innerHTML.includes("Older"),"paging");
// retry replaces record rather than duplicating
const k=G.session.findIndex(r=>r.snap);if(k>=0){retry(k);flush();while(!G.handOver){uAct('call');flush();}A(histAll().length===61,"retry dedupe "+histAll().length);}
quota=10;gNewHand();flush();while(!G.handOver){uAct('fold');flush();}console.log("warn:",JSON.stringify(PH.warn),G.handOver,histAll().length);A(PH.warn.includes("full"),"quota warn");
console.log("ALL TESTS PASSED; acts",acts);
`);

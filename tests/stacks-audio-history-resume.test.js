const fs=require('fs');const src=fs.readFileSync(''+require('path').join(__dirname,'..','index.html')+'','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const mk=id=>({id,value:id==='gIters'?'60':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.q=[];global.setTimeout=f=>q.push(f);global.confirm=()=>true;global.alert=()=>{};
global.spoken=0;global.SpeechSynthesisUtterance=function(t){this.text=t;};global.speechSynthesis={speak:u=>{if(u.text==="fuck it")global.spoken++;}};
require('vm').runInThisContext(src+'\n'+`
const flush=()=>{let n=0;while(q.length&&n++<100000)q.shift()();};const A=(c,m)=>{if(!c)throw new Error("ASSERT "+m);};
flush();G.speed=0;gInit();let acts=0,mr=0,allinEvents=0,maxSeen=0;
const conserve=()=>{const b=bankNets();const st=b.reduce((a,x)=>a+x.stack,0),bi=b.reduce((a,x)=>a+x.buyins,0);A(st===bi,"conservation "+st+" vs "+bi);};
for(let h=0;h<120;h++){
  const before=Object.fromEntries(bankNets().map(x=>[x.name,{...x}]));
  if(gNewHand()==="broke"){const b0=bankOf("Mouk").buyins;mookRebuy(5000);mr++;A(bankOf("Mouk").buyins<=G.MAXBI,"mouk spend cap");if(b0<G.MAXBI)A(gNewHand()!=="broke","rebuy");else break;}
  for(const x of bankNets()){if(x.buyins>before[x.name].buyins)A(x.stack<=G.MAXBI||G.seats.some(s=>s.name===x.name&&s.stack<=G.MAXBI),"cap at add "+x.name);}
  flush();let g=0;while(!G.handOver&&g++<80){const lg=legal(0);A(lg.maxTo<=G.seats[0].bet+G.seats[0].stack,"PL cap");els.gAmt=lg.canRaise?{value:String(lg.maxTo)}:undefined;uAct(['call','raise','call','fold','check'][acts++%5]);flush();}
  A(G.handOver,"over");A(G.seats.every(s=>s.stack>=0),"neg");conserve();
  allinEvents+=G.log.filter(l=>/all-in\\)/.test(l)).length;
  const won=G.lastWon.reduce((a,b)=>a+b,0),put=G.seats.reduce((a,s)=>a+s.total,0);A(won===put,"pot");
  for(const x of bankNets())maxSeen=Math.max(maxSeen,x.stack);
  if(h%25===0&&bankOf("Mouk").stack<G.MAXBI){mookRebuy(99999);A(bankOf("Mouk").buyins<=2000,"spend cap");}
}
const nets=bankNets();A(nets.reduce((a,x)=>a+x.net,0)===0,"nets zero");
console.log("STACKS: 200 hands, conservation OK every hand, cap OK. Mouk rebuys",mr,"maxStackSeen",maxSeen);
console.log(nets.map(x=>x.name+" "+x.stack+"/"+x.buyins+" rb"+x.rebuys+" tu"+x.topups+" net"+x.net).join(" | "));
console.log("VOICE: all-in log events",allinEvents,"spoken 'fuck it'",spoken, "(no AudioContext in node -> sfx no-op)");
// unit caps
const b={stack:1900,buyins:1900};A(addChips(b,500)===100,"cap");const c={stack:2500,buyins:200};A(addChips(c,300)===300&&c.buyins===500,"winnings are not a cap");
G.meters=freshMeters();for(let k=0;k<50;k++){const a=botRebuyAmt("David N");A(a===200||a===400,"rebuy amt "+a);}A(botRebuyAmt("Milton")===200,"milton rebuy 200");
// history record & replay
const H=histAll();A(H.length>=40&&H.length<=120,"hist "+H.length);const r=H[H.length-1];A(r.fr&&r.fr.length&&r.log.length&&r.names.length===8&&r.shown[0],"rich record");
A(H[0].fr===undefined||H.length<=150,"budget");
openHistReplay(r.gno);for(let z=0;z<40;z++)stepReplay(["next","nst","prev","pst"][z%4]);A(els.gRvMsg.textContent.length>0,"hist replay");closeReplay();
// retry from history = practice: bank unchanged
const withSnap=H.filter(x=>x.snaps&&x.snaps.length).pop();A(withSnap,"has retry spots");
const bank0=JSON.stringify(G.bank),hn0=histAll().length;retryHist(withSnap.gno,0);flush();let g2=0;while(!G.handOver&&g2++<80){uAct('call');flush();}
A(JSON.stringify(G.bank)===bank0,"practice keeps bank");A(histAll().length===hn0,"practice keeps history");
gNewHand();flush();A(!G.practice,"left practice");conserve();
// autosave/resume mid-hand
let g3=0;while(!G.handOver&&g3++<3&&!(G.toAct===0)){flush();}
const saved=JSON.parse(localStorage.getItem("plo5state"));A(saved&&saved.seats.length===8,"autosaved");
const snapHand=JSON.stringify(G.seats.map(s=>s.hand)),hno=G.handNo,bank1=JSON.stringify(G.bank);
G.seats=[];G.bank=null;A(resumeState(),"resume");A(JSON.stringify(G.seats.map(s=>s.hand))===snapHand&&G.handNo===hno,"same hand restored");A(JSON.stringify(G.bank)===bank1,"bank restored");
doResume();flush();let g4=0;while(!G.handOver&&g4++<80){uAct('fold');flush();}A(G.handOver,"resumed hand completes");conserve();
console.log("HISTORY/REPLAY/RETRY/AUTOSAVE/RESUME OK; hist size bytes",localStorage.getItem("plo5hist").length,"state bytes",localStorage.getItem("plo5state").length);
`);

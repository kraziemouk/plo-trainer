// multiplayer mock test + meters for all
const fs=require('fs');const src=fs.readFileSync(''+require('path').join(__dirname,'..','index.html')+'','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const mk=id=>({id,value:id==='gIters'?'40':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.q=[];global.setTimeout=(f,ms)=>{q.push(f);return q.length};global.clearTimeout=()=>{};global.confirm=()=>true;global.alert=()=>{};
require('vm').runInThisContext(src+'\n'+`
const flush=()=>{let n=0;while(q.length&&n++<200000)q.shift()();};const A=(c,m)=>{if(!c)throw new Error("ASSERT "+m);};
// in-memory transport
function MockBus(){const subs={},pres={};let id=0;return {tr(){const me=++id;return {channel(name,pk){const ch={name,h:{},ph:[],me,
  on(ev,cb){(this.h[ev]=this.h[ev]||[]).push(cb);return this;},onPresence(cb){this.ph.push(cb);return this;},
  send(ev,p){const data=JSON.parse(JSON.stringify(p));for(const c of subs[name]||[])if(c!==this&&c.h[ev])for(const f of c.h[ev])setTimeout(()=>f(data));global.sent=(global.sent||0)+1;return Promise.resolve();},
  track(o){pres[name]=pres[name]||{};pres[name][o.token||o.role]=[o];for(const c of subs[name]||[])for(const f of c.ph)setTimeout(()=>f(pres[name]));return Promise.resolve();},
  untrack(k){delete pres[name][k];for(const c of subs[name]||[])for(const f of c.ph)setTimeout(()=>f(pres[name]));},
  subscribe(){(subs[name]=subs[name]||[]).push(this);return Promise.resolve();},close(){subs[name]=(subs[name]||[]).filter(c=>c!==this);}};return ch;}};},subs,pres};}
(async()=>{
 const bus=MockBus();MP.mock=bus.tr();G.speed=0;gInit();
 // mock server: same rules as the SQL functions (login required, host-only claim, 10,000/day ledger per user)
 const DB={rooms:{},tickets:{},ledger:{}};let who=null;const day="2026-10-24";
 const api=u=>({async createRoom(c){if(!u)throw new Error("login required");DB.rooms[c]=u;},
   async ticket(room,kind,name,amount){if(!u)throw new Error("login required");const id="t"+Object.keys(DB.tickets).length;DB.tickets[id]={u,room,kind,name,amount:Math.min(10000,amount),claimed:false};return id;},
   async claim(id){const t=DB.tickets[id];if(!t||t.claimed)throw new Error("invalid ticket");if(DB.rooms[t.room]!==u)throw new Error("not host");t.claimed=true;const k=t.u+day,used=DB.ledger[k]||0,g=Math.max(0,Math.min(t.amount,10000-used));DB.ledger[k]=used+g;return {user_id:t.u,name:t.name,kind:t.kind,granted:g,used_today:used+g};}});
 MP.mockUser={id:"host-uid"};MP.mockApi=api("host-uid");
 const info=await mpHost();A(/^[A-Z0-9]{6}$/.test(info.code),"code");
 const run=async p=>{for(let k=0;k<50;k++){flush();await Promise.resolve();await new Promise(r=>setImmediate(r));}};
 const log={a:[],b:[]};
 const actor=key=>C=>{const s=C.state;if(s&&C.seat&&s.toAct===C.seat&&s.legal&&!s.over&&C.lastActed!==JSON.stringify([s.handNo,s.street,s.pot,s.toAct])){C.lastActed=JSON.stringify([s.handNo,s.street,s.pot,s.toAct]);log[key].push(s.handNo);C.act(s.legal.toCall>0?(Math.random()<0.2?"fold":"call"):"check");}};
 const mkC=(nm,key,uid,buyin)=>mpClient(bus.tr(),info.code,nm,actor(key),null,{uid,api:api(uid),buyin});
 // guests can't claim a seat: ticket creation fails without a user
 let guestBlocked=false;try{await api(null).ticket(info.code,"join","Guest",200);}catch(e){guestBlocked=true;}A(guestBlocked,"guest blocked");
 const spec=mpClient(bus.tr(),info.code,"",null,null,{watch:true});
 const a=mkC("Alice","a","uid-alice",8000),b=mkC("Bob","b","uid-bob",12000);await run();await a.ready;await b.ready;
 A(a.seat===1&&b.seat===2,"seats "+a.seat+","+b.seat);A(a.granted===8000&&b.granted===10000,"buy-in cap "+a.granted+" "+b.granted);
 let hands=0;
 for(let h=0;h<25;h++){if(gNewHand()==="broke"){mookRebuy();gNewHand();}await run();let g=0;
   while(!G.handOver&&g++<200){if(G.toAct===0&&canAct(G.seats[0])){gAct(0,"call");gAdvance();}await run();}
   A(G.handOver,"hand "+h+" over");hands++;
   A(G.seats[1].name==="Alice"&&G.seats[2].name==="Bob"&&!G.seats[1].prof,"humans seated");
   A(a.hand&&a.handNo===G.handNo&&JSON.stringify(a.hand)===JSON.stringify(G.seats[1].hand),"alice got own cards");
   A(JSON.stringify(b.hand)===JSON.stringify(G.seats[2].hand),"bob got own cards");
   A(spec.hand===null,"spectator has no cards");
   const b2=bankNets();A(b2.reduce((x,y)=>x+y.stack,0)===b2.reduce((x,y)=>x+y.buyins,0),"conservation");}
 A(G.seats.slice(3).every(s=>s.prof),"bots fill the rest");
 // daily cap on rebuys: Alice has 2000 left today
 const before=G.seats[1].remote.buyins;await a.rebuy(5000);await run();A(G.seats[1].remote.buyins-before===2000,"rebuy capped to daily remainder "+(G.seats[1].remote.buyins-before));
 await b.rebuy(500);await run();A(G.seats[2].remote.buyins===10000,"bob over daily cap gets 0");
 // replayed ticket rejected
 let replay=false;try{await MP.mockApi.claim("t0")}catch(e){replay=true;}A(replay,"ticket replay blocked");
 // uncapped stacks during play
 while(!G.handOver){if(G.toAct===0){gAct(0,"call");gAdvance();}await run();}G.seats[1].remote.stack=25000;G.seats[1].remote.buyins+=25000-G.seats[1].stack;G.seats[1].stack=25000;gNewHand();await run();A(G.seats[1].stack>=10000,"stack above 10k allowed");
 while(!G.handOver){if(G.toAct===0){gAct(0,"call");gAdvance();}await run();}
 // privacy mid-hand
 if(gNewHand()==="broke"){mookRebuy();gNewHand();}await run();const mid=publicState();A(mid.over||mid.seats.every(s=>s.shown===null),"no cards leak mid-hand");
 A(!JSON.stringify(mid).includes(JSON.stringify(G.seats[1].hand)),"alice cards not in public state");
 while(!G.handOver){if(G.toAct===0){gAct(0,"call");gAdvance();}await run();}
 // disconnect -> away -> seat back to bot
 const pr=bus.pres["room-"+info.code];delete pr["uid-bob"];for(const c of bus.subs["room-"+info.code])for(const f of c.ph)f(pr);
 A(G.seats[2].remote.away,"bob away");MP.AWAY_MS=-1;if(gNewHand()==="broke"){mookRebuy();gNewHand();}await run();A(!G.seats[2].remote&&G.seats[2].prof,"bob seat back to bot: "+G.seats[2].name);
 while(!G.handOver){if(G.toAct===0){gAct(0,"call");gAdvance();}await run();}
 // leave button -> bot
 a.leave();await run();A(!G.seats[1].remote&&G.seats[1].prof,"alice left, bot back");
 // meters on everyone
 A(METERED.length>=10&&G.meters.Milton&&G.meters.Mouk,"all meters");G.meters.Milton.tilt=9;G.meters.Rickey.tilt=9;A(tiltLvl("Milton")===1&&tiltLvl("Rickey")===3,"sensitivity "+tiltLvl("Milton")+" "+tiltLvl("Rickey"));
 G.meters.Mouk.tilt=0;bump("Mouk","tilt");A(G.meters.Mouk.tilt===1,"mouk bump");
 console.log("MULTIPLAYER MOCK OK: hands",hands,"alice acted",log.a.length,"bob acted",log.b.length,"messages",global.sent);
})().catch(e=>{console.log("FAIL",e.message);process.exitCode=1;});
`);

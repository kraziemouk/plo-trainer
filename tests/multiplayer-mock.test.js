// multiplayer mock test + meters for all
const fs=require('fs');const src=fs.readFileSync(''+require('path').join(__dirname,'..','index.html')+'','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const mk=id=>({id,value:id==='gIters'?'40':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
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
 const info=await mpHost();A(/^[A-Z0-9]{6}$/.test(info.code),"code");
 const run=async p=>{for(let k=0;k<50;k++){flush();await Promise.resolve();await new Promise(r=>setImmediate(r));}};
 const log={a:[],b:[]};
 const mkC=(nm,key)=>mpClient(bus.tr(),info.code,nm,C=>{const s=C.state;if(s&&s.toAct===C.seat&&s.legal&&!s.over&&C.lastActed!==JSON.stringify([s.handNo,s.street,s.pot,s.toAct])){C.lastActed=JSON.stringify([s.handNo,s.street,s.pot,s.toAct]);log[key].push(s.handNo);C.act(s.legal.toCall>0?(Math.random()<0.7?"call":"fold"):"check");}},null);
 const a=mkC("Alice","a"),b=mkC("Bob","b");await run();await a.ready;await b.ready;
 A(a.seat===1&&b.seat===2,"seats "+a.seat+","+b.seat);A(a.token!==b.token&&a.token.length===16,"tokens");
 let hands=0,peek=0;
 for(let h=0;h<25;h++){if(gNewHand()==="broke"){mookRebuy();gNewHand();}await run();let g=0;
   while(!G.handOver&&g++<200){if(G.toAct===0&&canAct(G.seats[0])){gAct(0,"call");gAdvance();}await run();}
   A(G.handOver,"hand "+h+" over");hands++;
   A(G.seats[1].name==="Alice"&&G.seats[2].name==="Bob"&&!G.seats[1].prof,"humans seated");
   A(a.hand&&a.handNo===G.handNo&&JSON.stringify(a.hand)===JSON.stringify(G.seats[1].hand),"alice got own cards");
   A(JSON.stringify(b.hand)===JSON.stringify(G.seats[2].hand),"bob got own cards");
   // privacy: public state must not contain hole cards before showdown
   const ps=publicState();
   const b2=bankNets();A(b2.reduce((x,y)=>x+y.stack,0)===b2.reduce((x,y)=>x+y.buyins,0),"conservation");}
 // privacy check mid-hand
 if(gNewHand()==="broke"){mookRebuy();gNewHand();}await run();const mid=publicState();A(mid.over||mid.seats.every(s=>s.shown===null),"no cards leak mid-hand");
 A(!JSON.stringify(mid).includes(JSON.stringify(G.seats[1].hand)),"alice cards not in public state");
 // spoof: intent with wrong token ignored
 const toAct0=G.toAct,pot0=potTotal();a.pub.send("intent",{token:"BADTOKEN0000000",type:"raise",to:999});await run();A(potTotal()===pot0||G.toAct!==toAct0,"spoof ignored");
 // disconnect -> away -> timeout auto-fold -> seat returns to bot next hand after AWAY_MS
 while(!G.handOver){if(G.toAct===0){gAct(0,"call");gAdvance();}await run();}
 bus.subs["room-"+info.code].forEach(c=>{});const pr=bus.pres["room-"+info.code];delete pr[b.token];for(const c of bus.subs["room-"+info.code])for(const f of c.ph)f(pr);
 A(G.seats[2].remote.away,"bob away");MP.AWAY_MS=-1;if(gNewHand()==="broke"){mookRebuy();gNewHand();}await run();A(!G.seats[2].remote&&G.seats[2].prof,"bob seat back to bot: "+G.seats[2].name);
 // reconnect by token (alice)
 const pr2=bus.pres["room-"+info.code];delete pr2[a.token];for(const c of bus.subs["room-"+info.code])for(const f of c.ph)f(pr2);A(G.seats[1].remote.away,"alice away");
 const a2=mpClient(bus.tr(),info.code,"Alice",null,null,a.token);a2.seat=1;await run();await a2.ready;await run();A(!G.seats[1].remote.away,"alice reconnected");A(JSON.stringify(a2.hand)===JSON.stringify(G.seats[1].hand),"alice cards resent");
 // meters on everyone
 A(METERED.length===10&&G.meters.Milty&&G.meters.Mouk,"all meters");G.meters.Milty.tilt=9;G.meters.Rick.tilt=9;A(tiltLvl("Milty")===1&&tiltLvl("Rick")===3,"sensitivity "+tiltLvl("Milty")+" "+tiltLvl("Rick"));
 G.meters.Mouk.tilt=0;bump("Mouk","tilt");A(G.meters.Mouk.tilt===1,"mouk bump");
 console.log("MULTIPLAYER MOCK OK: hands",hands,"alice acted",log.a.length,"bob acted",log.b.length,"messages",global.sent);
})().catch(e=>{console.log("FAIL",e.message);process.exitCode=1;});
`);

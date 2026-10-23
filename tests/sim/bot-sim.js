const fs=require('fs');const src=fs.readFileSync(process.argv[2]||'/workspace/plo-trainer/index.html','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const mk=id=>({id,value:undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.q=[];global.setTimeout=f=>{q.push(f);return 1};global.clearTimeout=()=>{};
require('vm').runInThisContext(src+'\n'+`
G.ui=null;G.speed=0;G.fastBots=true;gInit();const M={name:"Mouk",tight:0.3,agg:0.5,bluff:0.08,chase:1,nutReq:0,think:0};
const st={};const S=n=>st[n]=st[n]||{hands:0,vpip:0,pfr:0};let allinHands=0,sd=0,nosd=0,N=+(process.env.N||500);
const _gc=gActCore;let cur={};gActCore=function(i,t,to){const s=G.seats[i],before=s.bet;_gc(i,t,to);if(G.street===0){const last=G.log[G.log.length-1]||"";if(/calls|raises|bets/.test(last))(cur[s.name]=cur[s.name]||{v:0,r:0}).v=1;if(/raises|bets/.test(last))(cur[s.name]=cur[s.name]||{v:0,r:0}).r=1;}};
const hist=[];let maxGrowth={v:0};const PS={small:{f:0,c:0},large:{f:0,c:0}};const _bd=botDecide;botDecide=function(i){const lg=legal(i),d=_bd(i);if(lg.toCall>0){const k=lg.pot<=20?'small':'large';PS[k].f++;if(d[0]!=='fold')PS[k].c++;}return d;};
for(let h=0;h<N;h++){cur={};G.seats[0].isUser=false;G.seats[0].prof=M;{const MM=process.env.METERS||'slow';if(G.meters)for(const n in G.meters){const m=G.meters[n];if(MM==='zero'){m.drink=0;m.tilt=0;}else{global.PM=global.PM||{};const p=PM[n]||{drink:0,tilt:0};for(const k of ['drink','tilt']){if(m[k]>p[k]&&Math.random()<0.9)m[k]=p[k];}PM[n]={drink:m.drink,tilt:m.tilt};}}}if(gNewHand()==="broke"){mookRebuy(200);if(gNewHand()==="broke"){newSession();gNewHand();global.sess=(global.sess||0)+1;}}
  G.seats[0].prof=M;for(const s of G.seats)cur[s.name]=cur[s.name]||{v:0,r:0};const sb0={},q0={};for(const s of G.seats){sb0[s.name]=s.stack+s.bet;try{q0[s.name]=brMods(s.name).q}catch(e){}}
  let g=0;while(!G.handOver&&g++<50){gAdvance();while(q.length)q.shift()();}
  for(const s of G.seats){const st0=sb0[s.name]||0,bk=st0<=100?"<=100":st0<=250?"101-250":st0<=500?"251-500":">500";if(q0[s.name]){const z=(global.QB=global.QB||{})[q0[s.name]]=(global.QB[q0[s.name]]||{h:0,v:0});z.h++;z.v+=cur[s.name].v;}if(!(bk==="<=100"&&typeof steamOn==="function"&&steamOn(s.name))){const y0=1;}const y=(bk==="<=100"&&typeof steamOn==="function"&&steamOn(s.name))?{h:0,v:0}:(global.SB=global.SB||{})[bk]=(global.SB[bk]||{h:0,v:0});y.h++;y.v+=cur[s.name].v;const x=S(s.name);x.hands++;x.vpip+=cur[s.name].v;x.pfr+=cur[s.name].r;}
  if(G.seats.some(s=>s.allin))allinHands++;
  const live=G.seats.filter(s=>!s.folded).length;if(live>1)sd++;else nosd++;
  hist.push(Object.fromEntries(bankNets().map(b=>[b.name,b.stack])));
  if(h>=50){const a=hist[h-50],b=hist[h];for(const n in b){const gr=b[n]-(a[n]??200);if(gr>maxGrowth.v)maxGrowth={v:gr,n,from:a[n],to:b[n],at:h};}}
}
const pc=x=>(100*x).toFixed(1)+"%";
console.log("sessions reset (Mouk out of 2000):",global.sess||0);console.log("hands",N,"| all-in in",pc(allinHands/N),"of hands | reach showdown",pc(sd/N),"| won without showdown",pc(nosd/N));
for(const n in st){const x=st[n];console.log(n.padEnd(8),"hands",String(x.hands).padStart(3),"VPIP",pc(x.vpip/x.hands).padStart(6),"PFR",pc(x.pfr/x.hands).padStart(6));}
console.log("facing a bet: small-pot (<=20) continue",pc(PS.small.c/Math.max(1,PS.small.f)),"of",PS.small.f,"| large-pot continue",pc(PS.large.c/Math.max(1,PS.large.f)),"of",PS.large.f);console.log("loop-break rates by players in:",JSON.stringify(Object.fromEntries(Object.entries(G.lbStats||{}).map(([k,v])=>[k,pc(v.breaks/v.rolls)+" of "+v.rolls]))));console.log("VPIP by starting stack:",JSON.stringify(Object.fromEntries(Object.entries(global.SB||{}).map(([k,v])=>[k,pc(v.v/v.h)+" of "+v.h]))));console.log("outlier hands:",G.outStats?pc(G.outStats.out/G.outStats.hands)+" of "+G.outStats.hands+" bot-hands that acted":"n/a");console.log("avg bet/raise size (fraction of pot) by stack:",JSON.stringify(Object.fromEntries(Object.entries(G.sizeStats||{}).map(([k,v])=>[k,(v.sum/v.n).toFixed(2)+" x"+v.n]))));console.log("VPIP by bankroll quadrant:",JSON.stringify(Object.fromEntries(Object.entries(global.QB||{}).map(([k,v])=>[k,pc(v.v/v.h)+" of "+v.h]))));console.log("biggest 50-hand stack growth:",JSON.stringify(maxGrowth));
console.log("range reads:",["Ricky","Milty","David N","Rich","Yum Yum"].map(n=>rangeDesc(n)).join(" | "));console.log("final stacks:",bankNets().map(b=>b.name+":"+b.stack+"(in "+b.buyins+")").join(" "));
`);

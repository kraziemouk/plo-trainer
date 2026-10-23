const fs=require('fs');const src=fs.readFileSync(''+require('path').join(__dirname,'..','index.html')+'','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const mk=id=>({id,value:id==='gIters'?'40':undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.q=[];global.setTimeout=f=>{q.push(f);return 1};global.clearTimeout=()=>{};global.confirm=()=>true;global.alert=()=>{};
require('vm').runInThisContext(src+'\n'+`
const flush=()=>{let n=0;while(q.length&&n++<100000)q.shift()();};const A=(c,m)=>{if(!c)throw new Error("ASSERT "+m);};
G.speed=0;gInit();const lastEnd={};let checks=0,swaps=0,returns=0,adds=0;
for(let h=0;h<50;h++){
  const bi0=Object.fromEntries(bankNets().map(x=>[x.name,x.buyins]));
  if(gNewHand()==="broke"){mookRebuy();gNewHand();}flush();
  for(const s of G.seats){const start=s.stack+s.total;const added=(bankOf(s.name).buyins!==(bi0[s.name]??-1));
    if(added){adds++;continue;}
    if(lastEnd[s.name]!==undefined){A(start===lastEnd[s.name],"hand "+G.handNo+" "+s.name+" start "+start+" != last end "+lastEnd[s.name]);checks++;if(!G.seats.some(x=>x.name===s.name&&x===s))0;}}
  let g=0;while(!G.handOver&&g++<80){const lg=legal(0);els.gAmt=lg.canRaise?{value:String(lg.maxTo)}:undefined;uAct(['call','check','fold','fold'][(h+g)%4]);flush();}
  A(G.handOver,"over");
  for(const s of G.seats){lastEnd[s.name]=s.stack;A(bankOf(s.name).stack===s.stack,"bank saved at hand end for "+s.name);}
  // roster swaps between hands
  if(h%3===0){const bots=G.table.filter(Boolean);const n=bots[(h*7)%bots.length];leaveSeat(n);swaps++;}
  if(h%5===1&&G.wait.length>1){callUp(G.wait[G.wait.length-1]);}
}
const ret=Object.keys(lastEnd).length;
console.log("STACK CONTINUITY OK: checks",checks,"swaps",swaps,"rebuy/topup exemptions",adds,"distinct players seen",ret,"waitlist now",G.wait.join(","));
`);

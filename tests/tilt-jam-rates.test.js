const fs=require('fs');const src=fs.readFileSync(''+require('path').join(__dirname,'..','index.html')+'','utf8').split('<script>')[1].split('</script>')[0];
global.els={};const mk=id=>({id,value:undefined,checked:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},offsetHeight:100});
global.document={getElementById:id=>els[id]||(els[id]=mk(id)),body:{classList:{toggle(){},add(){},contains(){return false}},appendChild(){}},documentElement:{style:{setProperty(){}}}};global.window=global;
global.q=[];global.setTimeout=f=>q.push(f);
require('vm').runInThisContext(src+'\n'+`
G.speed=0;G.ui=null;gInit();G.sitOutSetting=0;
function spot(name,facing){gNewHand();const di=G.seats.findIndex(s=>s.name===name);let ai=(di%7)+1;if(ai===di)ai=(ai%7)+1;
  for(const s of G.seats){s.bet=0;s.total=20;s.stack=180;s.folded=false;s.allin=false;}
  G.street=1;G.board=G.deck.slice(45,48);G.deckPos=48;G.aggressor=-1;G.curBet=0;G.minRaise=2;
  if(facing){G.seats[ai].bet=25;G.seats[ai].total=45;G.seats[ai].stack=155;G.curBet=25;G.minRaise=25;G.aggressor=ai;}
  return di;}
function rates(name,tilt,N){let weak=0,wj=0,strong=0,sj=0;
  for(let k=0;k<N;k++){const di=spot(name,k%2===0);G.meters=freshMeters();G.meters[name].tilt=tilt;const s=G.seats[di],lg=legal(di);
    const cat=catOf(evalOmaha(s.hand,G.board)),outs=quickOuts(s.hand,G.board);const isWeak=cat<=1&&outs<8,isStrong=jamJustified(s,lg);
    const [t,to]=botDecide(di);const jam=t==="raise"&&commits(s,Math.min(to,lg.maxTo),lg.pot);
    if(isWeak){weak++;if(jam)wj++;} if(isStrong){strong++;if(jam)sj++;}}
  return \`tilt \${tilt} (L\${tiltLvl(name)}): weak-hand jam \${(100*wj/weak).toFixed(1)}% of \${weak} · strong/justified jam \${(100*sj/strong).toFixed(1)}% of \${strong}\`;}
for(const n of ["David N","Yum"]){console.log(n);for(const t of [0,3,6,9])console.log("  "+rates(n,t,12000));}
// hint note
let di=spot("David N",true);const s=G.seats[di];G.aggressor=di;s.bet=180;s.stack=0;s.allin=true;G.curBet=180;G.meters=freshMeters();
console.log("hint t0:",gHint(0,40).why.match(/David N[^.]*\\./g));G.meters["David N"].tilt=6;console.log("hint t6:",gHint(0,40).why.match(/David N is tilted[^—]*/g));
`);

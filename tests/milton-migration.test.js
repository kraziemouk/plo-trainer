// Saved data mentioning "Milty" is migrated to "Milton" on load.
const fs=require('fs'),vm=require('vm');const h=fs.readFileSync(__dirname+'/../index.html','utf8');
const src=h.slice(h.indexOf('// ==== migration'),h.indexOf('// ==== CORE (shared) ===='));
const store=new Map([["plo5session",JSON.stringify({table:["Milty","Rich","Ricky","Yum Yum"],bank:{Milty:{stack:812}}})],["plo5hero","Milty"],["other","x"]]);
global.localStorage={get length(){return store.size},key:i=>[...store.keys()][i],getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
vm.runInThisContext(src);
const s=JSON.parse(store.get("plo5session"));
if(s.table[3]!=="Yum"||s.table[2]!=="Rickey"||s.table[0]!=="Milton"||s.bank.Milton.stack!==812||s.bank.Milty||store.get("plo5hero")!=="Milton")throw new Error("FAIL migration");
if(PROFILES_CHECK=!/name:"Milton"/.test(h))throw new Error("FAIL profile");
console.log("MILTON/RICKEY/YUM MIGRATION OK");

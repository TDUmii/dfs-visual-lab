const fs=require("node:fs"), vm=require("node:vm"),os=require("node:os"),path=require("node:path"),assert=require("node:assert/strict"),{execFileSync}=require("node:child_process");
const src=fs.readFileSync("code-languages.js","utf8");
const ctx={window:{},document:{getElementById:()=>({value:"right,down,left,up"})}};
vm.runInNewContext(src,ctx);
const codeLines=ctx.window.DFSCode.codeLines;
const cases=[
 {name:"starter",map:["....###",".#####.","...##..","##..#..","......."],result:"Tim thay duong di"},
 {name:"blocked",map:[".#.","###","..#"],result:"Khong co duong di"}
];
const dest=path.join(os.tmpdir(),"dfs-v5-compiled");
fs.mkdirSync(dest,{recursive:true});
for(const testcase of cases){
 const state={grid:testcase.map.map(row=>row.split("")),start:{r:0,c:0},goal:{r:testcase.map.length-1,c:testcase.map[0].length-1}};
 const directs=[[0,1],[1,0],[0,-1],[-1,0]];
 for(const lang of ["python","cpp"]){
  const contents=codeLines(lang,state,true,directs).map(line=>line.source).join("\n")+"\n";
  const filename=path.join(dest,testcase.name+(lang==="python"?".py":".cpp"));
  fs.writeFileSync(filename,contents,"utf8");
  let output;
  if(lang==="python")output=execFileSync("python",[filename],{encoding:"utf8",timeout:15000});
  else{
   const binary=path.join(dest,testcase.name+".exe");
   execFileSync("g++",["-std=c++17","-O2","-o",binary,filename],{encoding:"utf8",timeout:35000});
   output=execFileSync(binary,[],{encoding:"utf8",timeout:15000});
  }
  assert(output.includes(testcase.result),lang+" "+testcase.name+" got "+output);
  console.log("PASS executable "+lang+" "+testcase.name);
 }
}
const engine=fs.readFileSync("app.js","utf8");
const root={document:{addEventListener(){},getElementById(){return {value:"right,down,left,up"}}},console};
vm.createContext(root);
vm.runInContext(engine+";globalThis.output={PRESETS,parseMap,createTrace,state};",root);
const o=root.output;
o.state.grid=o.parseMap(o.PRESETS.starter);
o.state.rows=5;o.state.cols=7;o.state.start={r:0,c:0};o.state.goal={r:4,c:6};
const trace=o.createTrace();
assert(trace.found);
assert(trace.steps.some(s=>s.type==="choice"));
assert(trace.steps.some(s=>s.type==="backtrack"));
assert(trace.route.length>0);
console.log("PASS starter demonstrates real choices, backtracking and goal in "+trace.steps.length+" frames");

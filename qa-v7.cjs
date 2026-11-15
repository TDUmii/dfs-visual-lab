const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),assert=require("node:assert/strict"),{spawn}=require("node:child_process");
const profile=path.join(os.tmpdir(),"dfs-v7-cdp-"+process.pid);
const chrome=spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",["--headless=new","--no-first-run","--disable-gpu","--disable-extensions","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{windowsHide:true,stdio:"ignore"});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
async function main(){
 const f=path.join(profile,"DevToolsActivePort");
 for(let i=0;i<90&&!fs.existsSync(f);i++) await wait(80);
 assert(fs.existsSync(f));
 const port=fs.readFileSync(f,"utf8").split("\n")[0];
 const targets=await(await fetch("http://127.0.0.1:"+port+"/json/list")).json();
 socket=new WebSocket(targets.find(t=>t.type==="page").webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
 let serial=0;const pending=new Map();const exceptions=[];
 socket.onmessage=e=>{
  const msg=JSON.parse(e.data);
  if(msg.method==="Runtime.exceptionThrown")exceptions.push(msg.params.exceptionDetails.text);
  if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(Error(msg.error.message)):resolve(msg.result)}
 };
 const command=(method,params={})=>{
  const id=++serial;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 };
 async function evaluate(expression){
  const result=await command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
  return result.result.value;
 }
 await command("Page.enable");await command("Runtime.enable");
 let pass=0;
 for(const [width,height] of [[1440,900],[1366,768],[1024,768],[768,844],[390,844],[360,740],[320,640]]){
  await command("Emulation.setDeviceMetricsOverride",{width,height,mobile:width<900,deviceScaleFactor:1});
  await command("Page.navigate",{url:"file:///D:/Code/dfs-visual-lab/index.html?lesson="+width+"x"+height+"#learn"});
  await wait(520);
  const initial=await evaluate("(()=>{const q=x=>document.querySelector(x);const a=q('.foundations-section').getBoundingClientRect();const ex=q('.worked-example').getBoundingClientRect();return {pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,activeView:q('.view-tab.active')?.dataset.view,manualExists:!!q('#manualBoard'),footnoteExists:document.body.textContent.includes('Tự trải nghiệm'),mapCells:q('#workedGrid').querySelectorAll('.worked-cell').length,theory:q('.lesson-content').textContent.includes('daTham'),activeCells:q('#workedGrid').querySelectorAll('.is-active').length,exampleVisible:ex.width>0,lessonBoxHeight:a.height,exampleTop:Math.round(ex.top)}})()");
  console.log(width+"x"+height+" "+JSON.stringify(initial));
  assert.equal(initial.pageWidth,width,"horizontal overflow "+width);
  assert(initial.pageHeight<=height+2,"body vertical overflow "+width);
  assert.equal(initial.activeView,"learn");
  assert(!initial.manualExists&&!initial.footnoteExists,"interactive maze/footer not removed");
  assert.equal(initial.mapCells,35);
  assert(initial.theory&&initial.exampleVisible&&initial.activeCells===1);
  pass+=7;
  const phases=await evaluate("(()=>{const q=x=>document.querySelector(x);q('[data-example-phase=\"1\"]').click();const back=q('#workedExplanation').textContent.includes('trở về');const old=q('#workedGrid').querySelectorAll('.is-past').length;q('[data-example-phase=\"2\"]').click();const goal=q('#workedCall').textContent.includes('True');const route=q('#workedGrid').querySelectorAll('.is-success').length;const pressed=q('[data-example-phase=\"2\"]').getAttribute('aria-pressed');q('[data-example-phase=\"0\"]').click();return {back,old,goal,route,pressed}})()");
  assert(phases.back&&phases.old>=3&&phases.goal&&phases.route>=9&&phases.pressed==="true","worked example phases broken "+JSON.stringify(phases));
  pass+=5;
  if(width===1440||width===390||width===320){
   const screenshot=await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   fs.writeFileSync("D:\\Code\\dfs-headless-tmp\\v7-lesson-"+width+".png",Buffer.from(screenshot.data,"base64"));
  }
  const switchCode=await evaluate("(()=>{document.querySelector('#lessonCodeBtn').click();return {view:document.querySelector('.view-tab.active')?.dataset.view,codePane:document.querySelector('#inspectorPanel').classList.contains('code-pane-active'),mode:window.DFSCode.getMode(),map:document.querySelector('#board').children.length}})()");
  assert.equal(switchCode.view,"lab");
  assert(switchCode.codePane&&switchCode.mode==="build"&&switchCode.map===35,"lesson code navigation broken");
  pass+=4;
 }
 assert.equal(exceptions.length,0,"browser exceptions "+exceptions.join(";"));
 console.log("PASS: "+pass+" lesson checks on seven viewports");
}
main().catch(err=>{console.error(err);process.exitCode=2}).finally(async()=>{try{socket?.close()}catch{}chrome.kill();await wait(130)});

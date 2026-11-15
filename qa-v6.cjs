const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),assert=require("node:assert/strict"),{spawn}=require("node:child_process");
const profile=path.join(os.tmpdir(),"dfs-v6-cdp-"+process.pid);
const chrome=spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",["--headless=new","--no-first-run","--disable-gpu","--disable-extensions","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{windowsHide:true,stdio:"ignore"});
const wait=n=>new Promise(r=>setTimeout(r,n));let ws;
async function main(){
 const file=path.join(profile,"DevToolsActivePort");
 for(let i=0;i<100&&!fs.existsSync(file);i++)await wait(80);
 assert(fs.existsSync(file),"Chrome debugging port missing");
 const port=fs.readFileSync(file,"utf8").split("\n")[0];
 const targets=await(await fetch("http://127.0.0.1:"+port+"/json/list")).json();
 const target=targets.find(t=>t.type==="page");assert(target,"No CDP page");
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
 let seq=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{
  const result=JSON.parse(e.data);
  if(result.method==="Runtime.exceptionThrown")errors.push(result.params.exceptionDetails.exception?.description || result.params.exceptionDetails.text);
  if(result.id&&pending.has(result.id)){
   const {resolve,reject}=pending.get(result.id);pending.delete(result.id);
   result.error?reject(Error(result.error.message)):resolve(result.result);
  }
 };
 function cdp(method,params={}){
   const id=++seq;
   return new Promise((resolve,reject)=>{
     pending.set(id,{resolve,reject});
     ws.send(JSON.stringify({id,method,params}));
   });
 }
 async function evalJs(expression){
  const result=await cdp("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
 }
 await cdp("Page.enable");await cdp("Runtime.enable");
 let tests=0;
 for(const [width,height] of [[1440,900],[1366,768],[1024,768],[768,844],[390,844],[360,740],[320,640]]){
   await cdp("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<900});
   await cdp("Page.navigate",{url:"file:///D:/Code/dfs-visual-lab/index.html?size="+width+"x"+height+"#lab"});
   await wait(750);
   const initial=await evalJs("(()=>{const q=s=>document.querySelector(s);return {docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,mode:window.DFSCode?.getMode(),lang:window.DFSCode?.getLanguage(),codeHidden:q('#codeDetails').hidden,boardCells:q('#board').children.length,buttons:q('.mobile-view-switch').children.length,bodyFont:getComputedStyle(document.body).fontFamily}})()");
   assert.equal(initial.docWidth,width,"horizontal overflow "+width);
   assert(initial.docHeight<=height+2,"body overflow "+width);
   assert(initial.codeHidden,"code should start hidden");
   assert.equal(initial.mode,"build");
   assert.equal(initial.lang,"python");
   assert.equal(initial.buttons,3);
   tests+=6;
   await evalJs(width<=1050?
      "document.querySelector('[data-mobile-panel=\"code\"]').click()" :
      "document.querySelector('[data-inspector-tab=\"code\"]').click()");
   const opened=await evalJs("(()=>{const q=s=>document.querySelector(s),r=el=>{const x=el.getBoundingClientRect();return {top:Math.round(x.top),bottom:Math.round(x.bottom),width:Math.round(x.width),height:Math.round(x.height)}};return {panel:q('#inspectorPanel').classList.contains('code-pane-active'),codeVisible:!q('#codeDetails').hidden,mode:window.DFSCode.getMode(),rows:q('#pseudoCode').children.length,stage:q('#codeStageCounter').textContent,codeHeight:r(q('#pseudoCode')),controller:r(q('.playbar')),font:getComputedStyle(q('#pseudoCode')).fontSize,active:q('#pseudoCode .new-line')!==null}})()");
   console.log(width+"x"+height+" "+JSON.stringify({initial,opened}));
   assert(opened.panel && opened.codeVisible);
   assert.equal(opened.rows,1);
   assert.equal(opened.mode,"build");
   assert(opened.active,"stage row not emphasized");
   assert(opened.codeHeight.height>85,"code too short "+width);
   assert(opened.controller.bottom<=height+2,"controller obscured "+width);
   assert(parseFloat(opened.font)>=13,"code font too small "+width);
   tests+=7;
   const buildup=await evalJs("(()=>{const q=s=>document.querySelector(s);for(let i=0;i<5;i++)q('#codeNextStage').click();return {stage:window.DFSCode.getStage(),rows:q('#pseudoCode').children.length,newRows:q('#pseudoCode .new-line')!==null,why:q('#codeStageExplanation').textContent}})()");
   assert.equal(buildup.stage,6);
   assert.equal(buildup.rows,12);
   assert(buildup.why.includes("hướng"));
   tests+=3;
   const runtime=await evalJs("(()=>{const q=s=>document.querySelector(s);q('#codeNextStage').click();const mode=window.DFSCode.getMode();q('#nextBtn').click();q('#nextBtn').click();const current=q('#pseudoCode .current');q('[data-language=\"cpp\"]').click();const cpp=q('#pseudoCode').textContent.includes('bool dfs(');const activeCpp=q('#pseudoCode .current')!==null;q('#codeViewBtn').click();const full=q('#pseudoCode').textContent.includes('int main()');const file=q('#codeFileLabel').textContent;return {mode,current:current?.dataset.coreIndex,cpp,activeCpp,full,file}})()");
   assert.equal(runtime.mode,"run");
   assert(runtime.current!==undefined,"runtime active line missing");
   assert(runtime.cpp && runtime.activeCpp && runtime.full);
   assert.equal(runtime.file,"dfs.cpp");
   tests+=4;
   if(width===1440||width===390||width===320){
     const img=await cdp("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
     const file="D:\\Code\\dfs-headless-tmp\\v6-code-"+width+".png";
     fs.writeFileSync(file,Buffer.from(img.data,"base64"));
   }
   const line=await evalJs("(()=>{const q=s=>document.querySelector(s),row=q('#pseudoCode [data-core-index=\"5\"]');if(!row)return false;row.click();return q('#codeLineNote').textContent.includes('Đánh dấu ô')})()");
   assert(line,"click-to-explain source line failed");tests++;
   const tabs=await evalJs("(()=>{const q=s=>document.querySelector(s);q('[data-view=\"applications\"]').click();const a=!q('#applications').hidden;q('[data-view=\"practice\"]').click();const b=!q('#practice').hidden;q('[data-view=\"learn\"]').click();const c=!q('#learn').hidden;return a&&b&&c})()");
   assert(tabs,"navigation broken");tests++;
 }
 assert.deepEqual(errors,[],"Browser errors: "+errors.join("\n"));
 console.log("UI_QA_PASS="+tests+" across 7 viewport sizes");
}
main().catch(e=>{console.error(e);process.exitCode=2}).finally(async()=>{try{ws?.close()}catch{}chrome.kill();await wait(150)});

const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),http=require("node:http"),assert=require("node:assert/strict"),{spawn}=require("node:child_process");
const profile=path.join(os.tmpdir(),"dfs-v8-cdp-"+process.pid);
const chrome=spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",["--headless=new","--no-first-run","--disable-gpu","--disable-extensions","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});
const sleep=n=>new Promise(r=>setTimeout(r,n));
const httpJson=url=>new Promise((resolve,reject)=>http.get(url,res=>{let data="";res.on("data",x=>data+=x);res.on("end",()=>{try{resolve(JSON.parse(data))}catch(e){reject(e)}})}).on("error",reject));
let ws;
async function main(){
 const portFile=path.join(profile,"DevToolsActivePort");
 for(let i=0;i<100&&!fs.existsSync(portFile);i++)await sleep(80);
 assert(fs.existsSync(portFile));
 const port=fs.readFileSync(portFile,"utf8").split("\n")[0];
 const tabs=await httpJson("http://127.0.0.1:"+port+"/json/list");
 ws=new WebSocket(tabs.find(x=>x.type==="page").webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let seq=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const v=JSON.parse(e.data);
   if(v.method==="Runtime.exceptionThrown")errors.push(v.params.exceptionDetails.exception?.description||v.params.exceptionDetails.text);
   if(v.id&&pending.has(v.id)){const {resolve,reject}=pending.get(v.id);pending.delete(v.id);v.error?reject(Error(v.error.message)):resolve(v.result);}
 };
 function cmd(method,params={}){
   const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 }
 async function ev(expression){
   const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
   if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
   return r.result.value;
 }
 const rectJs="(()=>{const g=id=>document.getElementById(id),r=el=>{const a=el.getBoundingClientRect();return {x:Math.round(a.x),y:Math.round(a.y),width:Math.round(a.width),height:Math.round(a.height),bottom:Math.round(a.bottom)}};const box=g('pseudoCode'),current=box.querySelector('.current');return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,panel:r(g('inspectorPanel')),map:r(document.querySelector('.map-column')),toolbar:r(document.querySelector('.code-toolbar')),stage:r(document.querySelector('.code-teaching-card')),editor:r(box),play:r(document.querySelector('.playbar')),rows:box.children.length,activeRows:box.querySelectorAll('.current').length,activeLine:current?.textContent,activeRelativeTop:current?Math.round(current.getBoundingClientRect().top-box.getBoundingClientRect().top):null,editorScrollTop:box.scrollTop,editorScrollHeight:box.scrollHeight,editorClientHeight:box.clientHeight,expanded:document.querySelector('.workspace').classList.contains('is-code-expanded'),font:getComputedStyle(box).fontSize}})()";
 await cmd("Page.enable");await cmd("Runtime.enable");
 let checks=0;
 for(const [width,height] of [[1440,900],[1366,768],[1280,720],[1024,768],[768,844],[390,844],[320,640]]){
   await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<900});
   await cmd("Page.navigate",{url:"file:///D:/Code/dfs-visual-lab/index.html?v8="+width+"x"+height+"#lab"});
   await sleep(650);
   const select=width<=1050?"document.querySelector('[data-mobile-panel=\"code\"]').click();":"document.querySelector('[data-inspector-tab=\"code\"]').click();";
   const setup=await ev("(()=>{"+select+"window.DFSCode.setMode('run');document.querySelector('#codeViewBtn').click();const s=document.getElementById('stepSlider');s.value=s.max;s.dispatchEvent(new Event('input',{bubbles:true}));return {mode:window.DFSCode.getMode(),codeVisible:!document.getElementById('codeDetails').hidden,full:document.getElementById('pseudoCode').textContent.includes('print('),lastStep:document.getElementById('stepLabel').textContent}})()");
   assert(setup.codeVisible);assert.equal(setup.mode,"run");
   const value=await ev(rectJs);
   console.log(width+"x"+height+" RUN "+JSON.stringify(value));
   assert.equal(value.scrollWidth,width,"horizontal page overflow");
   assert(value.scrollHeight<=height+2,"vertical page overflow");
   assert(value.editor.bottom<=height+2,"code editor offscreen");
   assert(value.editor.height >= (width>=1280?220:width<=390?100:150),"code editor too short "+width+"x"+height);
   assert(value.activeRows===1,"current line not uniquely highlighted");
   assert(value.activeRelativeTop>=0&&value.activeRelativeTop<value.editor.height,"current line scrolled off viewport");
   assert(value.play.bottom<=height+2,"play controls missing");
   if(width>1050)assert(value.panel.width>value.map.width,"code not majority width");
   checks+=8;
   if(width===1366||width===390||width===320){
     const shot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
     fs.writeFileSync("D:\\Code\\dfs-headless-tmp\\v8-code-"+width+".png",Buffer.from(shot.data,"base64"));
   }
   if(width>1050){
      await ev("document.getElementById('expandCodeBtn').click()");
      const expanded=await ev(rectJs);
      assert(expanded.expanded);assert(expanded.editor.width>value.editor.width*1.45,"expand gain too small");
      await ev("document.getElementById('expandCodeBtn').click()");
      checks+=2;
   }
   await ev("window.DFSCode.setMode('build')");
   const build=await ev(rectJs);
   assert(build.editor.height >= (width>=1280?140:width<400?75:115),"build editor too short");
   checks++;
 }
 assert.equal(errors.length,0,errors.join("\n"));
 console.log("PASS "+checks+" editor layout + visible highlight checks");
}
main().catch(e=>{console.error(e);process.exitCode=2}).finally(async()=>{try{ws?.close()}catch{}chrome.kill();await sleep(150);});

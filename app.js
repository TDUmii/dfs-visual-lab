"use strict";

const PRESETS = {
  classic: [
    ".........",
    ".###.##..",
    "...#.....",
    "###..###.",
    ".#.#.....",
    "...#.##..",
    "........."
  ],
  deadend: [
    ".........",
    ".#######.",
    ".#.......",
    ".#.#####.",
    "...#.....",
    "##.#.###.",
    "...#...#.",
    ".#####.#.",
    "........."
  ],
  maze: [
    ".........",
    ".#######.",
    ".#.......",
    ".#.#####.",
    "...#.....",
    "##.#.###.",
    "...#...#.",
    ".#####.#.",
    "........."
  ],
  islands: [
    "..##..##.",
    "..##..##.",
    "#########",
    "...###...",
    "...###...",
    "##.######",
    "##...##.."
  ],
  blank: Array.from({ length: 7 }, () => ".........")
};

const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
const $ = (id) => document.getElementById(id);

const state = {
  grid: [], initialGrid: [], rows: 0, cols: 0,
  start: {r: 0, c: 0}, goal: {r: 6, c: 8},
  preset: "classic", tool: "wall",
  trace: null, stepIndex: 0, timer: null, isPlaying: false,
  challenge: null, challengeGuess: null, challengeTarget: -1,
  components: null
};

function parseMap(lines) { return lines.map((line) => line.split("")); }
function inside(r, c) { return r >= 0 && r < state.rows && c >= 0 && c < state.cols; }
function isOpen(r, c) { return inside(r,c) && state.grid[r][c] === "."; }
function gridKey(r, c) { return r * state.cols + c; }
function toCoord(key) { return {r: Math.floor(key / state.cols), c: key % state.cols}; }
function coordText(r,c) { return "(" + r + ", " + c + ")"; }
function getOrder() {
  const select = $("directionSelect");
  const raw = select ? select.value : "down,right,up,left";
  return raw.split(",").map((direction) => DIRS[direction]).filter(Boolean);
}
function randomMap() {
  return Array.from({length:7}, (_, r) =>
    Array.from({length:9}, (_,c) =>
      (r === 0 && c === 0) || (r === 6 && c === 8) || Math.random() > .28 ? "." : "#"));
}

function shortestPath() {
  const first = gridKey(state.start.r, state.start.c);
  const target = gridKey(state.goal.r, state.goal.c);
  const seen = new Uint8Array(state.rows*state.cols);
  const parent = new Int32Array(state.rows*state.cols).fill(-1);
  const queue = [first];
  let head = 0;
  seen[first] = 1;
  while (head < queue.length) {
    const key = queue[head++];
    if (key === target) {
      const path = [];
      for (let at=key;at!==-1;at=parent[at]) path.push(at);
      return path.reverse();
    }
    const {r,c} = toCoord(key);
    for (const [dr,dc] of Object.values(DIRS)) {
      const nr = r+dr, nc = c+dc;
      if (!isOpen(nr,nc)) continue;
      const next = gridKey(nr,nc);
      if (seen[next]) continue;
      seen[next] = 1; parent[next] = key; queue.push(next);
    }
  }
  return [];
}

function createTrace() {
  const size = state.rows*state.cols;
  const visited = new Uint8Array(size);
  const order = new Uint16Array(size);
  const backtracked = new Uint8Array(size);
  const trail = [];
  const stack = [];
  const steps = [];
  let count = 0, backtracks = 0, path = [];
  const goal = gridKey(state.goal.r,state.goal.c);
  const directions = getOrder();
  function record(type, r, c, line, title, description) {
    steps.push({
      type, r, c, line, title, description,
      visited:visited.slice(), order:order.slice(), backtracked:backtracked.slice(),
      stack:stack.slice(), trail:trail.map((edge)=>edge.slice()), path:path.slice(),
      counter:count, backtracks
    });
  }
  record("ready",-1,-1,0,"Bắt đầu tại S","DFS sẽ đi vào ô đầu tiên và đánh dấu đã thăm.");
  function dfs(r,c) {
    if (!isOpen(r,c)) return false;
    const key = gridKey(r,c);
    if (visited[key]) return false;
    visited[key]=1; order[key]=++count;
    if (stack.length) trail.push([stack[stack.length-1],key]);
    stack.push(key);
    record("visit",r,c,3,"Thăm ô " + coordText(r,c),
      "Đánh dấu ô rồi đi tiếp theo hướng ưu tiên. Ô tím là lời gọi đang xét.");
    if (key === goal) {
      path = stack.slice();
      record("found",r,c,4,"Đã tới E!","Đường xanh là đường DFS vừa tìm được.");
      return true;
    }
    for (const [dr,dc] of directions) {
      if (dfs(r+dr,c+dc)) return true;
    }
    stack.pop();
    backtracked[key]=1; backtracks++;
    const parent = stack.length ? toCoord(stack[stack.length-1]) : null;
    record("backtrack",r,c,7,"Quay lui từ " + coordText(r,c),
      parent ? "Hết lối đi, trở lại " + coordText(parent.r,parent.c) + " để thử nhánh khác." :
      "Đã thử hết vùng có thể đi từ S.");
    return false;
  }
  const found = dfs(state.start.r,state.start.c);
  if (!found) record("failed",-1,-1,0,"Không có đường tới E",
    "DFS đã thăm mọi ô đi được từ S, nhưng không tới được E.");
  return {steps,found,route:path,shortest:shortestPath(),visitedCount:count,backtracks};
}

function clearTimer() {
  if (state.timer!==null) clearInterval(state.timer);
  state.timer=null;state.isPlaying=false;
}
function calculateTrace() {
  clearTimer();
  state.stepIndex=0;
  state.trace=createTrace();
  const slider=$("stepSlider");
  if(slider){slider.max=state.trace.steps.length-1;slider.value=0;}
  render();
}
function loadPreset(name, preserveChallenge=false) {
  clearTimer();
  const grid=name==="random"?randomMap():parseMap(PRESETS[name]||PRESETS.classic);
  state.preset=name;state.grid=grid;state.rows=grid.length;state.cols=grid[0].length;
  state.start={r:0,c:0};state.goal={r:state.rows-1,c:state.cols-1};
  state.grid[0][0]=".";state.grid[state.goal.r][state.goal.c]=".";
  state.initialGrid=state.grid.map((row)=>row.slice());
  state.components=null;
  if(!preserveChallenge) {
    state.challenge=null;state.challengeGuess=null;state.challengeTarget=-1;
    $("challengePanel").hidden=true;
  }
  document.querySelectorAll("[data-preset]").forEach((button)=>
    button.classList.toggle("active",button.dataset.preset===name));
  calculateTrace();
}

function resetMap() {
  clearTimer();
  state.grid=state.initialGrid.map((row)=>row.slice());
  state.start={r:0,c:0};state.goal={r:state.rows-1,c:state.cols-1};
  state.components=null;
  state.challengeGuess=null;
  if(state.challenge==="predict") {
    loadChallenge("predict"); return;
  }
  calculateTrace();
}

function currentKey(frame) {
  return frame.stack.length ? frame.stack[frame.stack.length-1] : -1;
}
function renderBoard(frame) {
  const board=$("board"), col=$("columnAxis"), row=$("rowAxis");
  board.style.setProperty("--cols",state.cols);
  col.style.setProperty("--cols",state.cols);
  row.style.setProperty("--rows",state.rows);
  col.replaceChildren();row.replaceChildren();
  for(let c=0;c<state.cols;c++){
    const tag=document.createElement("span");tag.textContent=c;col.appendChild(tag);
  }
  for(let r=0;r<state.rows;r++){
    const tag=document.createElement("span");tag.textContent=r;row.appendChild(tag);
  }
  const route=new Set(frame.path), active=currentKey(frame);
  const cells=document.createDocumentFragment();
  for(let r=0;r<state.rows;r++)for(let c=0;c<state.cols;c++){
    const key=gridKey(r,c), wall=state.grid[r][c]==="#";
    const start=state.start.r===r&&state.start.c===c;
    const goal=state.goal.r===r&&state.goal.c===c;
    const cell=document.createElement("button");
    cell.type="button";cell.className="cell";cell.setAttribute("role","gridcell");
    cell.dataset.r=r;cell.dataset.c=c;
    if(wall)cell.classList.add("is-wall");
    if(frame.visited[key])cell.classList.add("is-visited");
    if(frame.backtracked[key])cell.classList.add("is-backtracked");
    if(route.has(key))cell.classList.add("is-path");
    if(state.components!==null && !wall && !frame.visited[key] && state.components[key]>=0)
      cell.classList.add("is-component-"+state.components[key]%5);
    if(start)cell.classList.add("is-start");
    if(goal)cell.classList.add("is-goal");
    if(key===active)cell.classList.add("is-current");
    if(key===state.challengeGuess && state.challenge==="predict")cell.classList.add("is-guessed");
    cell.setAttribute("aria-label","Hàng "+r+", cột "+c+", "+(wall?"tường":"ô trống")+
      (start?", bắt đầu":"")+(goal?", đích":"")+
      (frame.visited[key]?", thứ tự thăm "+frame.order[key]:""));
    cell.title=coordText(r,c);
    const label=document.createElement("span");
    label.className="cell-label";
    if(start)label.textContent="S";
    else if(goal)label.textContent="E";
    else if(frame.visited[key]){label.textContent=frame.order[key];label.classList.add("cell-number");}
    cell.appendChild(label);cells.appendChild(cell);
  }
  board.replaceChildren(cells);
  drawRoutes(frame);
}

function drawRoutes(frame) {
  const svg=$("routeSvg"), board=$("board");
  if(!svg||!board)return;
  const rect=board.getBoundingClientRect();
  svg.setAttribute("viewBox","0 0 "+Math.max(rect.width,1)+" "+Math.max(rect.height,1));
  const buttons=[...board.querySelectorAll(".cell")];
  function center(key) {
    const el=buttons[key];if(!el)return null;
    const r=el.getBoundingClientRect();
    return [r.left-rect.left+r.width/2,r.top-rect.top+r.height/2];
  }
  function pairsPath(edges) {
    let result="";
    for(const [a,b] of edges) {
      const p=center(a),q=center(b);
      if(!p||!q)continue;
      const dx=q[0]-p[0],dy=q[1]-p[1];
      const length=Math.hypot(dx,dy)||1;
      const offset=Math.min(14,length*.3);
      result+="M"+(p[0]+dx*offset/length)+" "+(p[1]+dy*offset/length)+
        " L"+(q[0]-dx*offset/length)+" "+(q[1]-dy*offset/length)+" ";
    }
    return result;
  }
  function walkPath(keys) {
    const edges=[];
    for(let i=1;i<keys.length;i++)edges.push([keys[i-1],keys[i]]);
    return pairsPath(edges);
  }
  $("trailPath").setAttribute("d",pairsPath(frame.trail));
  $("activePath").setAttribute("d",walkPath(frame.stack));
  $("solutionPath").setAttribute("d",walkPath(frame.path));
}

function renderInspector(frame) {
  $("visitedCount").textContent=frame.counter;
  $("depthCount").textContent=frame.stack.length;
  $("backtrackCount").textContent=frame.backtracks;
  $("eventTitle").textContent=frame.title;
  $("eventText").textContent=frame.description;
  $("eventIcon").textContent=frame.type==="backtrack"?"↶":
    frame.type==="found"?"✓":frame.type==="failed"?"×":"↳";
  const stack=$("stackVisual");stack.replaceChildren();
  if(frame.stack.length===0){const empty=document.createElement("span");empty.textContent="Chưa có ô nào";stack.appendChild(empty);}
  else frame.stack.forEach((key,i)=>{
    if(i){const arrow=document.createElement("span");arrow.className="stack-arrow";arrow.textContent="→";stack.appendChild(arrow);}
    const tag=document.createElement("span");tag.className="stack-item";
    const {r,c}=toCoord(key);tag.textContent=coordText(r,c);stack.appendChild(tag);
  });
  $("stackCount").textContent=frame.stack.length+" ô";
  document.querySelectorAll("#pseudoCode [data-line]").forEach((line)=>
    line.classList.toggle("current",Number(line.dataset.line)===frame.line));
  const status=$("runStatus");
  const final=state.stepIndex===state.trace.steps.length-1;
  status.className="run-status";
  if(state.isPlaying){status.textContent="Đang chạy";status.classList.add("busy");}
  else if(final){status.textContent=state.trace.found?"Đã tới E":"Hết đường";status.classList.add(state.trace.found?"good":"bad");}
  else if(state.stepIndex){status.textContent="Đang khám phá";status.classList.add("busy");}
  else status.textContent="Sẵn sàng";
  $("playLabel").textContent=state.isPlaying?"Tạm dừng":final?"Chạy lại":state.stepIndex?"Tiếp tục":"Chạy DFS";
  $("playIcon").textContent=state.isPlaying?"Ⅱ":"▶";
  $("prevBtn").disabled=state.stepIndex===0;
  $("nextBtn").disabled=final;
  const result=$("resultBox");
  result.hidden=!final;
  result.className="result";
  if(final) {
    if(state.trace.found){
      const d=state.trace.route.length-1;
      const bfs=state.trace.shortest.length-1;
      result.textContent="Tới đích sau "+d+" bước. Đường ngắn nhất có "+bfs+
        " bước. DFS không luôn chọn đường ngắn nhất.";
    } else {
      result.classList.add("no-path");
      result.textContent="Không tìm được đường từ S tới E.";
    }
  }
}
function render() {
  if(!state.trace)return;
  const frame=state.trace.steps[state.stepIndex];
  $("mapSize").textContent=state.rows+" × "+state.cols;
  renderBoard(frame);renderInspector(frame);
  $("stepLabel").textContent="Bước "+state.stepIndex+" / "+(state.trace.steps.length-1);
  $("stepSlider").value=state.stepIndex;
}
function changeStep(delta) {
  clearTimer();
  state.components=null;
  state.stepIndex=Math.max(0,Math.min(state.trace.steps.length-1,state.stepIndex+delta));
  render();
}
function stepDelay() {
  return ({1:1000,2:690,3:470,4:270,5:140})[Number($("speedSlider").value)]||470;
}
function startPlayback() {
  if(state.isPlaying){clearTimer();render();return;}
  if(state.stepIndex>=state.trace.steps.length-1)state.stepIndex=0;
  state.components=null;state.isPlaying=true;render();
  state.timer=setInterval(()=>{
    if(state.stepIndex<state.trace.steps.length-1)state.stepIndex++;
    if(state.stepIndex>=state.trace.steps.length-1)clearTimer();
    render();
  },stepDelay());
}
function editCell(r,c){
  if(!inside(r,c))return;
  const start=state.start.r===r&&state.start.c===c;
  const goal=state.goal.r===r&&state.goal.c===c;
  if(state.tool==="start"){
    if(goal)return;
    state.start={r,c};state.grid[r][c]=".";
  } else if(state.tool==="goal"){
    if(start)return;
    state.goal={r,c};state.grid[r][c]=".";
  } else if(state.tool==="wall"){
    if(start||goal)return;state.grid[r][c]="#";
  } else if(state.tool==="erase"){
    state.grid[r][c]=".";
  }
  state.components=null;
  calculateTrace();
}

function countComponents(){
  const total=state.rows*state.cols;
  const seen=new Uint8Array(total);
  const components=new Int16Array(total).fill(-1);
  let count=0;
  for(let r=0;r<state.rows;r++)for(let c=0;c<state.cols;c++){
    const key=gridKey(r,c);
    if(!isOpen(r,c)||seen[key])continue;
    const stack=[key];seen[key]=1;components[key]=count;
    while(stack.length){
      const at=stack.pop();
      const pos=toCoord(at);
      for(const [dr,dc] of Object.values(DIRS)){
        const nr=pos.r+dr,nc=pos.c+dc;
        if(!isOpen(nr,nc))continue;
        const next=gridKey(nr,nc);
        if(seen[next])continue;
        seen[next]=1;components[next]=count;stack.push(next);
      }
    }
    count++;
  }
  return {count,components};
}

function loadChallenge(name){
  state.challenge=name;
  state.challengeGuess=null;
  state.challengeTarget=-1;
  loadPreset(name==="predict"?"classic":name==="block"?"deadend":"islands",true);
  state.challenge=name;
  const title={predict:"Bài 1. Đoán bước tiếp theo",block:"Bài 2. Chặn đường",islands:"Bài 3. Đếm vùng"};
  const instructions={
    predict:"DFS đã thăm S. Hãy chạm vào ô bạn nghĩ DFS sẽ thăm tiếp, rồi kiểm tra.",
    block:"Chọn công cụ Tường, chặn mọi lối từ S tới E, rồi nhấn Kiểm tra.",
    islands:"Nhìn bản đồ ở trên. Đếm số nhóm ô trống nối nhau theo 4 hướng."
  };
  $("challengeTitle").textContent=title[name];
  $("challengeInstructions").textContent=instructions[name];
  $("challengePanel").hidden=false;
  $("guessLabel").hidden=name!=="islands";
  $("checkChallengeBtn").textContent="Kiểm tra";
  $("islandGuess").value="";
  setFeedback("","");
  if(name==="predict"){
    state.stepIndex=1;
    state.challengeTarget=state.trace.steps.findIndex((frame,index)=>index>1&&frame.type==="visit");
    render();
  }
  $("lab").scrollIntoView({behavior:"smooth",block:"start"});
}
function setFeedback(text,kind){
  const box=$("challengeFeedback");
  box.textContent=text;box.className="feedback"+(kind?" "+kind:"");
}
function checkChallenge(){
  const name=state.challenge;
  if(name==="predict"){
    if(state.challengeGuess===null){setFeedback("Hãy chọn một ô trên bản đồ trước.","bad");return;}
    const frame=state.trace.steps[state.challengeTarget];
    const correct=frame&&gridKey(frame.r,frame.c)===state.challengeGuess;
    if(correct){
      state.stepIndex=state.challengeTarget;state.challengeGuess=null;render();
      setFeedback("Đúng rồi. DFS chọn ô hợp lệ đầu tiên theo thứ tự ưu tiên.","good");
    }else setFeedback("Chưa đúng. Xem hướng ưu tiên bên dưới rồi thử lại.","bad");
  }else if(name==="block"){
    const correct=!state.trace.found;
    setFeedback(correct?"Chính xác. S và E đã bị tách khỏi nhau.":"Vẫn còn đường tới E. Thử thêm tường.",""+(correct?"good":"bad"));
  }else if(name==="islands"){
    const input=$("islandGuess").value.trim();
    if(input===""){setFeedback("Nhập số vùng bạn dự đoán.","bad");return;}
    const result=countComponents();
    const correct=Number(input)===result.count;
    clearTimer();state.components=result.components;state.stepIndex=0;render();
    setFeedback((correct?"Chính xác. ":"Chưa đúng. ")+"Có "+result.count+" vùng. Mỗi màu là một nhóm ô nối nhau.",correct?"good":"bad");
  }
}

const PALETTE=["#eeb180","#8bc1d7","#94bd94","#c4a4d6","#ead47e"];
const PAINT_ORIGINAL=[
  "001112222",
  "001112222",
  "000112222",
  "333311222",
  "333311444",
  "333334444",
  "333334444"
];
let paintGrid=[],paintTimer=null;
function resetPaint(){
  if(paintTimer!==null)clearInterval(paintTimer);
  paintTimer=null;paintGrid=PAINT_ORIGINAL.map((row)=>row.split("").map(Number));
  $("paintResult").textContent="Chọn một ô để tô";
  drawPaint();
}
function drawPaint(active=-1){
  const board=$("paintBoard"),frag=document.createDocumentFragment();
  for(let r=0;r<paintGrid.length;r++)for(let c=0;c<paintGrid[0].length;c++){
    const cell=document.createElement("button");cell.type="button";
    cell.dataset.r=r;cell.dataset.c=c;cell.style.background=PALETTE[paintGrid[r][c]];
    cell.title="Tô từ ô "+coordText(r,c);
    cell.setAttribute("aria-label","Tô màu từ hàng "+r+", cột "+c);
    if(active===r*9+c)cell.classList.add("paint-active");
    frag.appendChild(cell);
  }
  board.replaceChildren(frag);
}
function floodFill(r,c){
  if(paintTimer!==null)clearInterval(paintTimer);
  paintTimer=null;
  const original=paintGrid[r][c],next=(original+2)%PALETTE.length;
  const stack=[[r,c]],seen=new Set([r*9+c]),region=[];
  while(stack.length){
    const [cr,cc]=stack.pop();region.push([cr,cc]);
    for(const [dr,dc] of Object.values(DIRS)){
      const nr=cr+dr,nc=cc+dc;
      if(nr<0||nr>=7||nc<0||nc>=9)continue;
      if(paintGrid[nr][nc]!==original||seen.has(nr*9+nc))continue;
      seen.add(nr*9+nc);stack.push([nr,nc]);
    }
  }
  let at=0;
  $("paintResult").textContent="Đang loang màu...";
  paintTimer=setInterval(()=>{
    const [cr,cc]=region[at++];
    paintGrid[cr][cc]=next;drawPaint(cr*9+cc);
    if(at>=region.length){
      clearInterval(paintTimer);paintTimer=null;drawPaint();
      $("paintResult").textContent="Đã tô "+region.length+" ô";
    }
  },85);
}

function makeMazePreview(){
  const board=$("mazePreview"),map=parseMap(PRESETS.classic);
  const seen=new Uint8Array(map.length*map[0].length);
  const parent=new Int32Array(map.length*map[0].length).fill(-1);
  const queue=[0];seen[0]=1;let head=0;
  while(head<queue.length){
    const key=queue[head++],r=Math.floor(key/9),c=key%9;
    for(const [dr,dc] of Object.values(DIRS)){
      const nr=r+dr,nc=c+dc,next=nr*9+nc;
      if(nr<0||nr>=7||nc<0||nc>=9||map[nr][nc]==="#"||seen[next])continue;
      seen[next]=1;parent[next]=key;queue.push(next);
    }
  }
  const route=new Set();let at=62;
  while(at>=0&&!route.has(at)){route.add(at);at=parent[at];}
  const frag=document.createDocumentFragment();
  for(let r=0;r<7;r++)for(let c=0;c<9;c++){
    const key=r*9+c,el=document.createElement("span");
    if(map[r][c]==="#")el.classList.add("m-wall");
    if(route.has(key))el.classList.add("m-route");
    if(key===0){el.classList.add("m-start");el.textContent="S";}
    if(key===62){el.classList.add("m-goal");el.textContent="E";}
    frag.appendChild(el);
  }
  board.replaceChildren(frag);
}

const islandPreviewMap=parseMap(PRESETS.islands);
function previewIslandGroups(){
  const component=new Int16Array(63).fill(-1),seen=new Uint8Array(63);
  let count=0;
  for(let r=0;r<7;r++)for(let c=0;c<9;c++){
    const key=r*9+c;
    if(islandPreviewMap[r][c]==="#"||seen[key])continue;
    const stack=[key];seen[key]=1;component[key]=count;
    while(stack.length){
      const at=stack.pop(),cr=Math.floor(at/9),cc=at%9;
      for(const [dr,dc] of Object.values(DIRS)){
        const nr=cr+dr,nc=cc+dc,next=nr*9+nc;
        if(nr<0||nr>=7||nc<0||nc>=9||islandPreviewMap[nr][nc]==="#"||seen[next])continue;
        seen[next]=1;component[next]=count;stack.push(next);
      }
    }
    count++;
  }
  return {count,component};
}
function renderIslandPreview(showGroups=false){
  const board=$("islandBoard"),frag=document.createDocumentFragment();
  const {count,component}=previewIslandGroups();
  for(let r=0;r<7;r++)for(let c=0;c<9;c++){
    const key=r*9+c,el=document.createElement("span");
    if(islandPreviewMap[r][c]==="."){
      el.classList.add("land");
      if(showGroups)el.classList.add("group-"+component[key]%6);
    }
    frag.appendChild(el);
  }
  board.replaceChildren(frag);
  $("islandResult").textContent=showGroups?count+" đảo":"? đảo";
  $("countIslandsBtn").textContent=showGroups?"Ẩn màu ↺":"Đếm bằng DFS →";
  return count;
}

function bindEvents(){
  $("board").addEventListener("click",(event)=>{
    const el=event.target.closest(".cell");if(!el)return;
    const r=Number(el.dataset.r),c=Number(el.dataset.c);
    if(state.challenge==="predict"){
      state.challengeGuess=gridKey(r,c);
      render();
      setFeedback("Đã chọn ô "+coordText(r,c)+". Nhấn Kiểm tra.","");
      return;
    }
    editCell(r,c);
  });
  document.querySelectorAll("[data-preset]").forEach((button)=>
    button.addEventListener("click",()=>loadPreset(button.dataset.preset)));
  $("randomBtn").addEventListener("click",()=>loadPreset("random"));
  $("resetMapBtn").addEventListener("click",resetMap);
  $("editorTools").addEventListener("click",(event)=>{
    const button=event.target.closest("[data-tool]");if(!button)return;
    state.tool=button.dataset.tool;
    document.querySelectorAll("[data-tool]").forEach((el)=>{
      el.classList.toggle("active",el===button);
      el.setAttribute("aria-pressed",String(el===button));
    });
    if(state.challenge==="predict"){state.challenge=null;$("challengePanel").hidden=true;}
  });
  $("directionSelect").addEventListener("change",calculateTrace);
  $("playBtn").addEventListener("click",startPlayback);
  $("prevBtn").addEventListener("click",()=>changeStep(-1));
  $("nextBtn").addEventListener("click",()=>changeStep(1));
  $("resetTraceBtn").addEventListener("click",()=>{
    clearTimer();state.stepIndex=0;state.components=null;render();
  });
  $("stepSlider").addEventListener("input",(event)=>{
    clearTimer();state.stepIndex=Number(event.target.value);state.components=null;render();
  });
  $("speedSlider").addEventListener("input",()=>{
    if(state.isPlaying){clearTimer();startPlayback();}
  });
  $("openMazeBtn").addEventListener("click",()=>{
    loadPreset("classic");$("lab").scrollIntoView({behavior:"smooth"});
  });
  $("paintBoard").addEventListener("click",(event)=>{
    const button=event.target.closest("button");if(button)floodFill(Number(button.dataset.r),Number(button.dataset.c));
  });
  $("paintResetBtn").addEventListener("click",resetPaint);
  let islandColored=false;
  $("countIslandsBtn").addEventListener("click",()=>{
    islandColored=!islandColored;renderIslandPreview(islandColored);
  });
  document.querySelectorAll("[data-challenge]").forEach((button)=>
    button.addEventListener("click",()=>loadChallenge(button.dataset.challenge)));
  $("checkChallengeBtn").addEventListener("click",checkChallenge);
  $("islandGuess").addEventListener("keydown",(event)=>{if(event.key==="Enter")checkChallenge();});
  window.addEventListener("resize",()=>{
    if(state.trace)drawRoutes(state.trace.steps[state.stepIndex]);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  bindEvents();
  loadPreset("classic");
  resetPaint();
  makeMazePreview();
  renderIslandPreview(false);
});
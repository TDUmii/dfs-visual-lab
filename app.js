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
  blank: Array.from({ length: 7 }, () => "........."),
  block: [
    ".........",
    ".#######.",
    ".#.....#.",
    ".#.###.#.",
    ".#...#.#.",
    ".###.#.#.",
    "........."
  ]
};

const DIRS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1]
};

const ANSWERS = [1, 0, 2];
const EXPLANATIONS = [
  "DFS quay lui về lời gọi trước để tiếp tục thử các hướng chưa đi.",
  "Nếu không đánh dấu đã thăm, DFS có thể chạy qua lại giữa hai ô mãi mãi.",
  "Có tối đa n × m ô, mỗi ô được thăm một lần; xét tối đa 4 ô kề."
];

const $ = (id) => document.getElementById(id);
const state = {
  grid: [],
  initialGrid: [],
  rows: 0,
  cols: 0,
  start: { r: 0, c: 0 },
  goal: { r: 6, c: 8 },
  preset: "classic",
  tool: "wall",
  trace: null,
  stepIndex: 0,
  timer: null,
  isPlaying: false,
  challenge: null,
  components: null,
  quizAnswers: [null, null, null]
};

function coordinate(r, c) {
  return "(" + r + ", " + c + ")";
}

function inside(r, c) {
  return r >= 0 && r < state.rows && c >= 0 && c < state.cols;
}

function isOpen(r, c) {
  return inside(r, c) && state.grid[r][c] === ".";
}

function indexOfCell(r, c) {
  return r * state.cols + c;
}

function keyToCoordinate(key) {
  return { r: Math.floor(key / state.cols), c: key % state.cols };
}

function parseMap(map) {
  return map.map((line) => line.split(""));
}

function randomMap() {
  const rows = 7, cols = 9;
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      if ((r === 0 && c === 0) || (r === rows - 1 && c === cols - 1)) return ".";
      return Math.random() < 0.29 ? "#" : ".";
    })
  );
}

function loadPreset(name, preserveChallenge = false) {
  stopPlayback();
  const data = name === "random" ? randomMap() : parseMap(PRESETS[name] || PRESETS.classic);
  state.preset = name;
  state.grid = data;
  state.initialGrid = data.map((row) => row.slice());
  state.rows = data.length;
  state.cols = data[0].length;
  state.start = { r: 0, c: 0 };
  state.goal = { r: state.rows - 1, c: state.cols - 1 };
  state.grid[0][0] = ".";
  state.grid[state.goal.r][state.goal.c] = ".";
  state.initialGrid[0][0] = ".";
  state.initialGrid[state.goal.r][state.goal.c] = ".";
  state.components = null;
  if (!preserveChallenge) {
    state.challenge = null;
    $("challengeWorkspace").hidden = true;
  }
  $("presetSelect").value = ["classic", "maze", "islands", "blank", "random"].includes(name) ? name : "classic";
  calculateTrace();
}

function getOrder() {
  return $("directionSelect").value.split(",").map((name) => DIRS[name]).filter(Boolean);
}

function shortestPath() {
  const queue = [indexOfCell(state.start.r, state.start.c)];
  const parent = new Int32Array(state.rows * state.cols).fill(-1);
  const seen = new Uint8Array(state.rows * state.cols);
  seen[queue[0]] = 1;
  let head = 0;
  const target = indexOfCell(state.goal.r, state.goal.c);
  while (head < queue.length) {
    const key = queue[head++];
    if (key === target) {
      const route = [];
      let at = key;
      while (at !== -1) {
        route.push(at);
        at = parent[at];
      }
      return route.reverse();
    }
    const { r, c } = keyToCoordinate(key);
    for (const [dr, dc] of Object.values(DIRS)) {
      const nr = r + dr, nc = c + dc;
      if (!isOpen(nr, nc)) continue;
      const nk = indexOfCell(nr, nc);
      if (seen[nk]) continue;
      seen[nk] = 1;
      parent[nk] = key;
      queue.push(nk);
    }
  }
  return [];
}

function createTrace() {
  const visited = new Uint8Array(state.rows * state.cols);
  const order = new Uint16Array(state.rows * state.cols);
  const stack = [];
  const steps = [];
  let counter = 0, backtracks = 0, route = [];
  const end = indexOfCell(state.goal.r, state.goal.c);
  const directions = getOrder();

  function emit(type, r, c, line, title, description) {
    steps.push({
      type, r, c, line, title, description,
      visited: visited.slice(), order: order.slice(),
      stack: stack.slice(), counter, backtracks,
      path: route.slice()
    });
  }

  emit("ready", -1, -1, 0, "Sẵn sàng khám phá",
    "DFS bắt đầu tại S. Mỗi ô được thăm đúng một lần và được đánh dấu trong ma trận.");

  function dfs(r, c) {
    if (!isOpen(r, c)) return false;
    const key = indexOfCell(r, c);
    if (visited[key]) return false;

    visited[key] = 1;
    order[key] = ++counter;
    stack.push(key);
    emit("visit", r, c, 3, "Đang đi vào ô " + coordinate(r, c),
      "Đánh dấu đã thăm, đẩy ô vào ngăn xếp và thử lần lượt các hướng ưu tiên.");

    if (key === end) {
      route = stack.slice();
      emit("found", r, c, 5, "Đã tìm thấy đích!",
        "DFS tới E. Các ô xanh lá tạo thành đường đi tìm được từ S tới E.");
      return true;
    }

    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc;
      if (dfs(nr, nc)) return true;
    }

    stack.pop();
    backtracks++;
    emit("backtrack", r, c, 9, "Quay lui từ ô " + coordinate(r, c),
      "Không còn ô kề nào chưa thăm và hợp lệ. Hàm hiện tại kết thúc, quay về lời gọi trước.");
    return false;
  }

  const found = dfs(state.start.r, state.start.c);
  if (!found) {
    emit("failed", -1, -1, 0, "Không có đường tới đích",
      "DFS đã khám phá toàn bộ vùng có thể đi từ S nhưng không thể tới E.");
  }

  return { steps, found, route, shortest: shortestPath(), visitedCount: counter, backtracks };
}

function calculateTrace() {
  stopPlayback();
  state.stepIndex = 0;
  state.trace = createTrace();
  $("stepSlider").max = state.trace.steps.length - 1;
  $("gridSize").textContent = state.rows + " × " + state.cols;
  render();
}

function renderBoard(frame) {
  const board = $("board");
  const axisTop = $("columnAxis");
  const axisLeft = $("rowAxis");
  board.style.setProperty("--cols", state.cols);
  axisTop.style.setProperty("--cols", state.cols);
  axisLeft.style.setProperty("--rows", state.rows);
  axisTop.replaceChildren();
  axisLeft.replaceChildren();
  for (let c = 0; c < state.cols; c++) {
    const el = document.createElement("span");
    el.textContent = c;
    axisTop.appendChild(el);
  }
  for (let r = 0; r < state.rows; r++) {
    const el = document.createElement("span");
    el.textContent = r;
    axisLeft.appendChild(el);
  }
  const path = new Set(frame.path);
  const currentKey = inside(frame.r, frame.c) ? indexOfCell(frame.r, frame.c) : -1;
  const fragment = document.createDocumentFragment();
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const key = indexOfCell(r, c);
      const wall = state.grid[r][c] === "#";
      const start = r === state.start.r && c === state.start.c;
      const goal = r === state.goal.r && c === state.goal.c;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.setAttribute("role", "gridcell");
      if (wall) cell.classList.add("is-wall");
      if (frame.visited[key]) cell.classList.add("is-visited");
      if (path.has(key)) cell.classList.add("is-path");
      if (state.components !== null && !wall && !frame.visited[key]) {
        const component = state.components[key];
        if (component >= 0) cell.classList.add("is-component-" + component % 5);
      }
      if (start) cell.classList.add("is-start");
      if (goal) cell.classList.add("is-goal");
      if (currentKey === key) cell.classList.add("is-current");
      const label = wall ? "tường" : "ô trống";
      cell.setAttribute("aria-label", "Hàng " + r + ", cột " + c + ", " + label +
        (start ? ", điểm bắt đầu" : "") + (goal ? ", đích" : "") +
        (frame.visited[key] ? ", lượt thăm " + frame.order[key] : ""));
      cell.title = coordinate(r, c) + " — " + (start ? "Bắt đầu" : goal ? "Đích" : wall ? "Tường" : "Ô trống");
      if (start || goal) {
        const marker = document.createElement("span");
        marker.className = "cell-badge";
        marker.textContent = start ? "S" : "E";
        cell.appendChild(marker);
      } else if (frame.visited[key]) {
        const orderSpan = document.createElement("span");
        orderSpan.className = "visit-order";
        orderSpan.textContent = frame.order[key];
        cell.appendChild(orderSpan);
      }
      fragment.appendChild(cell);
    }
  }
  board.replaceChildren(fragment);
}

function renderStatus(frame) {
  const finalStep = state.stepIndex === state.trace.steps.length - 1;
  const status = $("runStatus");
  status.className = "status-pill";
  if (state.isPlaying) {
    status.classList.add("running");
    status.innerHTML = '<span class="status-dot"></span> Đang chạy';
  } else if (finalStep && state.trace.found) {
    status.classList.add("success");
    status.innerHTML = '<span class="status-dot"></span> Tìm thấy đích';
  } else if (finalStep) {
    status.classList.add("fail");
    status.innerHTML = '<span class="status-dot"></span> Hết đường đi';
  } else if (state.stepIndex > 0) {
    status.classList.add("running");
    status.innerHTML = '<span class="status-dot"></span> Đang khám phá';
  } else {
    status.innerHTML = '<span class="status-dot"></span> Sẵn sàng';
  }
  $("playText").textContent = state.isPlaying ? "Tạm dừng" : finalStep ? "Chạy lại" : state.stepIndex > 0 ? "Tiếp tục" : "Chạy DFS";
  $("playIcon").textContent = state.isPlaying ? "❚❚" : "▶";
  $("prevBtn").disabled = state.stepIndex <= 0;
  $("nextBtn").disabled = finalStep;
}

function renderInspector(frame) {
  $("explanationTitle").textContent = frame.title;
  $("explanationText").textContent = frame.description;
  $("explanationIcon").textContent = frame.type === "found" ? "✓" :
    frame.type === "backtrack" ? "↶" : frame.type === "visit" ? "↳" :
    frame.type === "failed" ? "×" : "◎";
  $("visitedCount").textContent = frame.counter;
  $("depthCount").textContent = frame.stack.length;
  $("backtrackCount").textContent = frame.backtracks;
  $("stackDepthLabel").textContent = frame.stack.length + " hàm";
  const stackBox = $("stackVisual");
  stackBox.replaceChildren();
  if (frame.stack.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-copy";
    empty.textContent = "Ngăn xếp trống";
    stackBox.appendChild(empty);
  } else {
    frame.stack.forEach((key, i) => {
      if (i !== 0) {
        const arrow = document.createElement("span");
        arrow.className = "stack-arrow";
        arrow.textContent = "→";
        stackBox.appendChild(arrow);
      }
      const coord = keyToCoordinate(key);
      const chip = document.createElement("span");
      chip.className = "stack-frame" + (i === frame.stack.length - 1 ? " latest" : "");
      chip.textContent = "dfs" + coordinate(coord.r, coord.c);
      stackBox.appendChild(chip);
    });
    stackBox.scrollTop = stackBox.scrollHeight;
  }
  document.querySelectorAll("#pseudoCode [data-line]").forEach((line) => {
    line.classList.toggle("active-line", Number(line.dataset.line) === frame.line);
  });
  const box = $("resultBox");
  const finished = state.stepIndex === state.trace.steps.length - 1;
  box.hidden = !finished;
  if (finished) {
    if (state.trace.found) {
      box.className = "result-box";
      const dfsDistance = state.trace.route.length - 1;
      const bfsDistance = state.trace.shortest.length - 1;
      box.innerHTML = "<strong>✓ Đã tìm được đường đi</strong>DFS: " +
        dfsDistance + " bước đi · " + frame.counter + " ô đã thăm. " +
        "BFS ngắn nhất: " + bfsDistance + " bước đi." +
        (dfsDistance > bfsDistance ? "<br>DFS tìm được đường dài hơn đường ngắn nhất — hoàn toàn bình thường." : "");
    } else {
      box.className = "result-box no-path";
      box.innerHTML = "<strong>✕ Không thể tới đích</strong>DFS đã thăm " + frame.counter +
        " ô nhưng E không nằm trong vùng liên thông với S.";
    }
  }
}

function render() {
  if (!state.trace) return;
  const frame = state.trace.steps[state.stepIndex];
  renderBoard(frame);
  renderStatus(frame);
  renderInspector(frame);
  $("stepLabel").textContent = "Bước " + state.stepIndex + " / " + (state.trace.steps.length - 1);
  $("stepSlider").value = state.stepIndex;
}

function stopPlayback() {
  if (state.timer !== null) clearInterval(state.timer);
  state.timer = null;
  state.isPlaying = false;
}

function changeStep(delta) {
  stopPlayback();
  state.stepIndex = Math.min(Math.max(state.stepIndex + delta, 0), state.trace.steps.length - 1);
  render();
}

function getInterval() {
  const settings = { 1: 1050, 2: 730, 3: 480, 4: 270, 5: 125 };
  return settings[Number($("speedSlider").value)] || 480;
}

function startPlayback() {
  if (state.isPlaying) {
    stopPlayback();
    render();
    return;
  }
  if (state.stepIndex >= state.trace.steps.length - 1) state.stepIndex = 0;
  state.components = null;
  state.isPlaying = true;
  render();
  state.timer = setInterval(() => {
    if (state.stepIndex < state.trace.steps.length - 1) {
      state.stepIndex++;
      if (state.stepIndex >= state.trace.steps.length - 1) stopPlayback();
      render();
    } else {
      stopPlayback();
      render();
    }
  }, getInterval());
}

function editCell(r, c) {
  if (!inside(r, c)) return;
  const isStart = r === state.start.r && c === state.start.c;
  const isGoal = r === state.goal.r && c === state.goal.c;
  if (state.tool === "start") {
    if (isGoal) return;
    state.start = { r, c };
    state.grid[r][c] = ".";
  } else if (state.tool === "goal") {
    if (isStart) return;
    state.goal = { r, c };
    state.grid[r][c] = ".";
  } else if (state.tool === "wall") {
    if (isStart || isGoal) return;
    state.grid[r][c] = "#";
  } else if (state.tool === "erase") {
    state.grid[r][c] = ".";
  }
  state.components = null;
  calculateTrace();
}

function countComponents() {
  const visited = new Uint8Array(state.rows * state.cols);
  const components = new Int16Array(state.rows * state.cols).fill(-1);
  let count = 0;
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const first = indexOfCell(r, c);
      if (!isOpen(r, c) || visited[first]) continue;
      const stack = [first];
      visited[first] = 1;
      components[first] = count;
      while (stack.length) {
        const key = stack.pop();
        const pos = keyToCoordinate(key);
        for (const [dr, dc] of Object.values(DIRS)) {
          const nr = pos.r + dr, nc = pos.c + dc;
          if (!isOpen(nr, nc)) continue;
          const next = indexOfCell(nr, nc);
          if (visited[next]) continue;
          visited[next] = 1;
          components[next] = count;
          stack.push(next);
        }
      }
      count++;
    }
  }
  return { count, components };
}

function loadChallenge(name) {
  state.challenge = name;
  loadPreset(name === "find" ? "maze" : name === "block" ? "block" : "islands", true);
  const heading = {
    find: "Thử thách 01 · Tìm đường",
    block: "Thử thách 02 · Chặn đường",
    islands: "Thử thách 03 · Đếm đảo"
  };
  const instruction = {
    find: "Nhấn Chạy DFS và quan sát cho tới khi thuật toán tìm được E, sau đó quay lại kiểm tra.",
    block: "Chọn Tường và sửa bản đồ để cắt mọi đường từ S đến E, rồi kiểm tra.",
    islands: "Hãy đếm có bao nhiêu nhóm ô trống liên thông theo 4 hướng, nhập số dự đoán và kiểm tra."
  };
  $("challengeWorkspace").hidden = false;
  $("challengeHeading").textContent = heading[name];
  $("challengeInstruction").textContent = instruction[name];
  $("guessLabel").hidden = name !== "islands";
  $("challengeFeedback").textContent = "";
  $("challengeFeedback").className = "challenge-feedback";
  $("islandGuess").value = "";
  document.getElementById("lab").scrollIntoView({ behavior: "smooth", block: "start" });
}

function checkChallenge() {
  const feedback = $("challengeFeedback");
  let correct = false, message = "";
  if (state.challenge === "find") {
    correct = state.stepIndex === state.trace.steps.length - 1 && state.trace.found;
    message = correct ? "Chính xác! DFS đã tìm được E. Hãy thử đổi thứ tự hướng và quan sát đường đi." :
      "Hãy chạy mô phỏng tới khi tìm thấy đích E rồi kiểm tra lại.";
  } else if (state.challenge === "block") {
    correct = !state.trace.found;
    message = correct ? "Xuất sắc! DFS không còn đường tới E. Bạn đã tách S và E thành hai vùng." :
      "E vẫn đi tới được từ S. Hãy đặt thêm tường để chặn mọi lối đi.";
  } else if (state.challenge === "islands") {
    const result = countComponents();
    const raw = $("islandGuess").value.trim();
    if (raw === "") {
      feedback.textContent = "Nhập số đảo bạn dự đoán trước khi kiểm tra.";
      feedback.className = "challenge-feedback error";
      return;
    }
    const guess = Number(raw);
    correct = guess === result.count;
    message = correct ? "Đúng rồi! Có " + result.count + " đảo. Mỗi màu là một vùng liên thông." :
      "Chưa chính xác. Có " + result.count + " đảo. Các nhóm màu giúp bạn xem lại.";
    stopPlayback();
    state.stepIndex = 0;
    state.components = result.components;
    render();
  }
  feedback.textContent = message;
  feedback.className = "challenge-feedback " + (correct ? "success" : "error");
}

function updateQuizScore() {
  const answered = state.quizAnswers.filter((x) => x !== null).length;
  const score = state.quizAnswers.reduce((sum, value, i) => sum + (value === ANSWERS[i] ? 1 : 0), 0);
  $("quizScore").textContent = score + "/3";
  $("quizMessage").textContent = answered === 3 ?
    (score === 3 ? "Hoàn hảo! Bạn đã nắm được nguyên lý DFS." : "Hoàn thành " + score + "/3 câu. Đọc giải thích và thử lại nhé.") :
    "Đã trả lời " + answered + "/3 câu.";
}

function answerQuiz(card, value) {
  const index = Number(card.dataset.question);
  if (state.quizAnswers[index] !== null) return;
  state.quizAnswers[index] = value;
  card.querySelectorAll("[data-answer]").forEach((button) => {
    const selected = Number(button.dataset.answer);
    button.disabled = true;
    if (selected === ANSWERS[index]) button.classList.add("correct");
    if (selected === value && value !== ANSWERS[index]) button.classList.add("wrong");
  });
  const feedback = card.querySelector(".quiz-feedback");
  feedback.textContent = (value === ANSWERS[index] ? "✓ Đúng! " : "✕ Chưa đúng. ") + EXPLANATIONS[index];
  updateQuizScore();
}

function resetQuiz() {
  state.quizAnswers = [null, null, null];
  document.querySelectorAll(".quiz-card").forEach((card) => {
    card.querySelectorAll("[data-answer]").forEach((button) => {
      button.disabled = false;
      button.classList.remove("correct", "wrong");
    });
    card.querySelector(".quiz-feedback").textContent = "";
  });
  updateQuizScore();
}

function bindEvents() {
  $("board").addEventListener("click", (event) => {
    const cell = event.target.closest(".cell");
    if (cell) editCell(Number(cell.dataset.r), Number(cell.dataset.c));
  });

  $("editorTools").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tool]");
    if (!button) return;
    state.tool = button.dataset.tool;
    document.querySelectorAll("[data-tool]").forEach((el) => {
      const active = el === button;
      el.classList.toggle("active", active);
      el.setAttribute("aria-pressed", String(active));
    });
  });

  $("presetSelect").addEventListener("change", (event) => loadPreset(event.target.value));
  $("directionSelect").addEventListener("change", () => calculateTrace());
  $("randomBtn").addEventListener("click", () => loadPreset("random"));
  $("resetMapBtn").addEventListener("click", () => loadPreset(state.preset));
  $("playBtn").addEventListener("click", startPlayback);
  $("prevBtn").addEventListener("click", () => changeStep(-1));
  $("nextBtn").addEventListener("click", () => changeStep(1));
  $("resetTraceBtn").addEventListener("click", () => {
    stopPlayback();
    state.stepIndex = 0;
    state.components = null;
    render();
  });
  $("stepSlider").addEventListener("input", (event) => {
    stopPlayback();
    state.stepIndex = Number(event.target.value);
    state.components = null;
    render();
  });
  $("speedSlider").addEventListener("input", () => {
    if (state.isPlaying) {
      stopPlayback();
      startPlayback();
    }
  });
  document.querySelectorAll("[data-challenge]").forEach((button) => {
    button.addEventListener("click", () => loadChallenge(button.dataset.challenge));
  });
  $("checkChallengeBtn").addEventListener("click", checkChallenge);
  $("islandGuess").addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkChallenge();
  });
  document.querySelectorAll(".quiz-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const option = event.target.closest("[data-answer]");
      if (option) answerQuiz(card, Number(option.dataset.answer));
    });
  });
  $("resetQuizBtn").addEventListener("click", resetQuiz);
  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "BUTTON" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight") changeStep(1);
    if (event.key === "ArrowLeft") changeStep(-1);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("currentYear").textContent = new Date().getFullYear();
  bindEvents();
  loadPreset("classic");
  updateQuizScore();
});

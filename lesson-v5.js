"use strict";

(function () {
  const MAP = [
    "....###",
    ".#####.",
    "...##..",
    "##..#..",
    "......."
  ];
  const DIRECTIONS = {
    left: [0, -1],
    right: [0, 1],
    up: [-1, 0],
    down: [1, 0]
  };
  const $ = (id) => document.getElementById(id);
  let path = [[0, 0]];
  let everVisited = new Set(["0:0"]);
  let tries = 0;
  let openedCode = false;

  function neighbors(r, c) {
    return Object.values(DIRECTIONS)
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < MAP.length &&
         nc >= 0 && nc < MAP[0].length && MAP[nr][nc] === ".");
  }

  function setStatus(message, type = "") {
    const box = $("manualMessage");
    box.textContent = message;
    box.className = "try-message" + (type ? " status-" + type : "");
  }

  function renderManual() {
    const board = $("manualBoard");
    const fragment = document.createDocumentFragment();
    const current = path[path.length - 1];
    const visited = everVisited;
    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < MAP[r].length; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "manual-cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute("role", "gridcell");
        const wall = MAP[r][c] === "#";
        const start = r === 0 && c === 0;
        const goal = r === 4 && c === 6;
        const standing = current[0] === r && current[1] === c;
        const used = visited.has(r + ":" + c);
        if (wall) cell.classList.add("is-wall");
        if (used) cell.classList.add("is-visited");
        if (start) cell.classList.add("is-start");
        if (goal) cell.classList.add("is-goal");
        if (standing) cell.classList.add("is-player");
        cell.setAttribute("aria-label",
          "Hàng " + r + ", cột " + c + ": " +
          (wall ? "tường" : goal ? "đích" : start ? "bắt đầu" : "ô trống") +
          (standing ? ", bạn đang đứng ở đây" : ""));
        if (goal) cell.textContent = "E";
        else if (standing) cell.textContent = "●";
        else if (start) cell.textContent = "S";
        fragment.appendChild(cell);
      }
    }
    board.replaceChildren(fragment);
    $("manualBackBtn").disabled = path.length <= 1;
  }

  function step(r, c) {
    const [currentR, currentC] = path[path.length - 1];
    if (Math.abs(currentR - r) + Math.abs(currentC - c) !== 1) {
      setStatus("Bạn chỉ được đi sang một ô ngay bên cạnh.", "warning");
      return;
    }
    if (!(r >= 0 && r < MAP.length && c >= 0 && c < MAP[0].length) ||
        MAP[r][c] === "#") {
      setStatus("Đường bị chặn! Hãy chọn lối khác.", "warning");
      return;
    }
    if (path.length > 1) {
      const previous = path[path.length - 2];
      if (previous[0] === r && previous[1] === c) {
        goBack();
        return;
      }
    }
    if (everVisited.has(r + ":" + c)) {
      setStatus("Bạn đã qua ô này. Hãy thử hướng khác để khỏi đi vòng.", "warning");
      return;
    }
    path.push([r, c]);
    everVisited.add(r + ":" + c);
    tries++;
    renderManual();
    if (r === 4 && c === 6) {
      setStatus("Bạn đã tới E! Với mê cung nhiều nhánh, máy cũng cần cách thử có hệ thống.", "success");
      return;
    }
    const available = neighbors(r, c).filter(([nr, nc]) =>
      !everVisited.has(nr + ":" + nc));
    if (!available.length) {
      setStatus("Bạn gặp ngõ cụt rồi! Nhấn Quay lại. DFS cũng làm đúng như vậy.", "deadend");
    } else {
      setStatus("Bạn đi được " + tries + " bước. Nếu đi hết đường, hãy quay về và thử nhánh khác.");
    }
  }

  function goBack() {
    if (path.length <= 1) {
      setStatus("Bạn đang ở S. Hãy thử một lối mới.");
      return;
    }
    path.pop();
    renderManual();
    setStatus("Đã quay lại! Ô cũ vẫn được đánh dấu để không đi vòng. DFS cũng ghi nhớ như thế.", "backtracked");
  }

  function reset() {
    path = [[0, 0]];
    everVisited = new Set(["0:0"]);
    tries = 0;
    renderManual();
    setStatus("Hãy thử đi sang phải. Điều gì xảy ra nếu gặp ngõ cụt?");
  }

  function directionPress(name) {
    const [dr, dc] = DIRECTIONS[name];
    const [r, c] = path[path.length - 1];
    step(r + dr, c + dc);
  }

  function goToDemo() {
    document.getElementById("directionSelect").value = "right,down,left,up";
    loadPreset("starter");
    showView("lab", true);
    setMobilePanel("map");
    const speed = $("speedSlider");
    if (speed) speed.value = "2";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!state.isPlaying) startPlayback();
    }));
  }

  function toggleCode() {
    openedCode = !openedCode;
    const details = $("codeDetails");
    const btn = $("showCodePanelBtn");
    details.hidden = !openedCode;
    btn.textContent = openedCode ? "Ẩn code" : "Mở code";
    btn.setAttribute("aria-expanded", String(openedCode));
    const panel = $("inspectorPanel");
    panel.classList.toggle("has-code", openedCode);
    if (openedCode && window.DFSCode) {
      window.DFSCode.highlight(state.trace.steps[state.stepIndex]);
    }
  }

  function init() {
    reset();
    $("presetMobile").addEventListener("change", (event) => {
      loadPreset(event.target.value);
    });
    $("manualBoard").addEventListener("click", (e) => {
      const cell = e.target.closest(".manual-cell");
      if (cell) step(Number(cell.dataset.r), Number(cell.dataset.c));
    });
    document.querySelectorAll("[data-manual-dir]").forEach(button => {
      button.addEventListener("click", () => directionPress(button.dataset.manualDir));
    });
    $("manualBackBtn").addEventListener("click", goBack);
    $("manualResetBtn").addEventListener("click", reset);
    $("watchDfsBtn").addEventListener("click", goToDemo);
    $("watchDfsQuickBtn").addEventListener("click", goToDemo);
    $("showCodePanelBtn").addEventListener("click", toggleCode);
    document.addEventListener("keydown", (event) => {
      if (activeView !== "learn" || event.altKey || event.ctrlKey || event.metaKey) return;
      const activeTag = document.activeElement?.tagName || "";
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
      const names = {ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
      if (names[event.key]) {
        event.preventDefault();
        directionPress(names[event.key]);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();

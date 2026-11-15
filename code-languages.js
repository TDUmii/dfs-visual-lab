"use strict";

(function () {
  let labState = null;
  let getDirections = null;
  let language = "python";
  let showFull = false;
  let lastSignature = "";
  let lastFrame = null;
  const $ = (id) => document.getElementById(id);

  function directions() {
    const names = (document.getElementById("directionSelect")?.value || "down,right,up,left").split(",");
    const directionsByName = {
      down: [1, 0], right: [0, 1], up: [-1, 0], left: [0, -1]
    };
    return names.map((name) => directionsByName[name]).filter(Boolean);
  }

  function codeLines(lang, state, full = false, order = directions()) {
    const add = (source, phase = "") => ({ source, phase });
    const gridRows = state.grid.map((row) => row.join(""));
    const start = state.start;
    const goal = state.goal;
    if (lang === "python") {
      const core = [
        add("def dfs(hang, cot):", "start"),
        add("    if hang < 0 or hang >= soHang or cot < 0 or cot >= soCot:", "check"),
        add("        return False", "check"),
        add("    if banDo[hang][cot] == '#' or daTham[hang][cot]:", "check"),
        add("        return False", "check"),
        add("    daTham[hang][cot] = True", "visit"),
        add("    if (hang, cot) == dich:", "found"),
        add("        return True", "found"),
        add("    for dh, dc in huong:", "explore"),
        add("        if dfs(hang + dh, cot + dc):", "explore"),
        add("            return True", "explore"),
        add("    return False", "backtrack")
      ];
      if (!full) return core;
      return [
        add("# Dau . la o trong, dau # la tuong"),
        add("banDo = ["),
        ...gridRows.map((row) => add("    " + JSON.stringify(row) + ",")),
        add("]"),
        add("soHang = len(banDo)"),
        add("soCot = len(banDo[0])"),
        add("daTham = [[False] * soCot for _ in range(soHang)]"),
        add("huong = [" + order.map(([dr, dc]) => "(" + dr + ", " + dc + ")").join(", ") + "]"),
        add("dich = (" + goal.r + ", " + goal.c + ")"),
        add(""),
        ...core,
        add(""),
        add("if dfs(" + start.r + ", " + start.c + "):"),
        add("    print('Tim thay duong di')"),
        add("else:"),
        add("    print('Khong co duong di')")
      ];
    }

    const core = [
      add("bool dfs(int hang, int cot) {", "start"),
      add("    if (hang < 0 || hang >= soHang || cot < 0 || cot >= soCot)", "check"),
      add("        return false;", "check"),
      add("    if (banDo[hang][cot] == '#' || daTham[hang][cot])", "check"),
      add("        return false;", "check"),
      add("    daTham[hang][cot] = true;", "visit"),
      add("    if (hang == dichHang && cot == dichCot)", "found"),
      add("        return true;", "found"),
      add("    for (auto [dh, dc] : huong) {", "explore"),
      add("        if (dfs(hang + dh, cot + dc)) return true;", "explore"),
      add("    }"),
      add("    return false;", "backtrack"),
      add("}")
    ];
    if (!full) return core;
    return [
      add("#include <iostream>"),
      add("#include <vector>"),
      add("#include <string>"),
      add("#include <utility>"),
      add("using namespace std;"),
      add(""),
      add("vector<string> banDo = {"),
      ...gridRows.map((row) => add("    " + JSON.stringify(row) + ",")),
      add("};"),
      add("int soHang = (int)banDo.size();"),
      add("int soCot = (int)banDo[0].size();"),
      add("vector<vector<bool>> daTham(soHang, vector<bool>(soCot, false));"),
      add("vector<pair<int, int>> huong = { " + order.map(([dr, dc]) => "{" + dr + ", " + dc + "}").join(", ") + " };"),
      add("int dichHang = " + goal.r + ", dichCot = " + goal.c + ";"),
      add(""),
      ...core,
      add(""),
      add("int main() {"),
      add("    cout << (dfs(" + start.r + ", " + start.c + ") ? \"Tim thay duong di\" : \"Khong co duong di\") << '\\n';"),
      add("    return 0;"),
      add("}")
    ];
  }

  const tokenPattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#(?!include)[^\n]*$|\/\/[^\n]*$|\b(?:def|if|else|for|in|return|not|or|and|False|True|bool|int|auto|void|vector|string|using|namespace|include|false|true|print|len|range|cout)\b)/gm;
  function appendHighlightedCode(target, source) {
    const tokens = source.split(tokenPattern);
    for (const token of tokens) {
      if (!token) continue;
      const span = document.createElement("span");
      if (/^(#(?!include)|\/\/)/.test(token)) span.className = "token-comment";
      else if (/^["']/.test(token)) span.className = "token-string";
      else if (/^(def|if|else|for|in|return|not|or|and|False|True|bool|int|auto|void|vector|string|using|namespace|include|false|true|print|len|range|cout)$/.test(token)) span.className = "token-keyword";
      span.textContent = token;
      target.appendChild(span);
    }
  }

  function refreshSnippet(force = false) {
    if (!labState) return;
    const box = $("pseudoCode");
    if (!box) return;
    const signature = JSON.stringify({
      lang: language, full: showFull, grid: labState.grid,
      start: labState.start, goal: labState.goal,
      directions: document.getElementById("directionSelect")?.value
    });
    if (!force && signature === lastSignature) return;
    lastSignature = signature;
    const lines = codeLines(language, labState, showFull);
    const fragment = document.createDocumentFragment();
    lines.forEach((line, index) => {
      const lineElement = document.createElement("div");
      if (line.phase) lineElement.dataset.phase = line.phase;
      lineElement.dataset.number = String(index + 1);
      const number = document.createElement("em");
      number.textContent = String(index + 1);
      const code = document.createElement("code");
      appendHighlightedCode(code, line.source || " ");
      lineElement.append(number, code);
      fragment.appendChild(lineElement);
    });
    box.replaceChildren(fragment);
    box.scrollTop = 0;
    $("codeViewBtn").textContent = showFull ? "Thu gọn" : "Toàn bộ";
    $("codeViewBtn").setAttribute("aria-expanded", String(showFull));
    $("codeHint").textContent = showFull ? "Mã chạy được, đúng bản đồ đang vẽ" : "Dòng sáng ứng với bước DFS";
    highlight(lastFrame);
  }

  function highlight(frame) {
    lastFrame = frame;
    if (!frame) return;
    refreshSnippet();
    const type = frame.type;
    const kind = type === "visit" ? "visit" : type === "choice" ? "explore" : type === "found" ? "found" :
      type === "backtrack" || type === "failed" ? "backtrack" : "";
    let active = null;
    document.querySelectorAll("#pseudoCode [data-phase]").forEach((line) => {
      const selected = kind && line.dataset.phase === kind;
      line.classList.toggle("current", !!selected);
      if (selected && !active) active = line;
    });
    if (active && $("pseudoCode") && showFull) {
      const scroll = $("pseudoCode");
      const lineTop = active.offsetTop - scroll.offsetTop;
      if (lineTop < scroll.scrollTop || lineTop > scroll.scrollTop + scroll.clientHeight - 42) {
        scroll.scrollTop = Math.max(0, lineTop - scroll.clientHeight * 0.35);
      }
    }
  }

  function setLanguage(lang) {
    language = lang === "cpp" ? "cpp" : "python";
    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    refreshSnippet(true);
  }

  async function copyCode() {
    if (!labState) return;
    const text = codeLines(language, labState, true).map((line) => line.source).join("\n") + "\n";
    const button = $("copyCodeBtn");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        const success = document.execCommand("copy");
        input.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      button.textContent = "Đã chép ✓";
    } catch {
      showFull = true;
      refreshSnippet(true);
      button.textContent = "Chọn và chép code";
    }
    setTimeout(() => { if (button) button.textContent = "Sao chép"; }, 1700);
  }

  function init(state) {
    labState = state;
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });
    $("codeViewBtn")?.addEventListener("click", () => {
      showFull = !showFull;
      refreshSnippet(true);
    });
    $("copyCodeBtn")?.addEventListener("click", copyCode);
    setLanguage("python");
  }

  window.DFSCode = { init, highlight, codeLines, setLanguage };
})();
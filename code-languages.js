"use strict";

(function () {
  let labState = null;
  let getDirections = null;
  let language = "python";
  let showFull = false;
  let lastSignature = "";
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

  const tokenPattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#(?!include)[^\n]*$|\/\/[^\n]*$|\b(?:def|if|else|for|in|return|not|or|and|False|True|bool|int|auto|void|vector|string|using|namespace|include|false|true|print|len|range|cout|pass)\b)/gm;

  const STAGES = [
    {
      title: "1. Đặt tên cho hành động đi vào một ô",
      why: "Mỗi lần di chuyển, máy phải biết ô đang xét nằm ở hàng nào, cột nào. Vì thế hàm dfs nhận hai giá trị hang và cot.",
      example: "Đứng ở hàng 2, cột 1 thì gọi dfs(2, 1).",
      focus: 0
    },
    {
      title: "2. Chặn những bước không hợp lệ",
      why: "Nếu đi ra ngoài bảng, gặp tường hoặc ô đã thăm, nhánh này phải dừng ngay. Nhờ vậy ta không đi xuyên tường và không chạy vòng lặp.",
      example: "Ô là tường (#) hoặc đã thăm thì trả về False/false.",
      focus: 3
    },
    {
      title: "3. Đánh dấu ô vừa đặt chân tới",
      why: "Khi đã bước vào ô hợp lệ, đánh dấu ngay. Nếu không, hai ô đứng cạnh nhau có thể gọi qua gọi lại mãi.",
      example: "daTham[hang][cot] = True (Python) hoặc true (C++).",
      focus: 5
    },
    {
      title: "4. Kiểm tra xem đã đến đích chưa",
      why: "Sau khi thăm ô, kiểm tra E. Nếu trùng đích, trả về True/true để các lời gọi trước cùng báo thành công.",
      example: "Gặp E thì không cần đi thêm nữa.",
      focus: 6
    },
    {
      title: "5. Thử ô kề và tiếp tục đi sâu",
      why: "Từ ô hiện tại, thử từng hướng đã chọn. Gọi lại dfs với tọa độ ô kề, nên máy sẽ đi sâu hết một nhánh trước khi đổi nhánh.",
      example: "Đang ở (1, 2), đi xuống sẽ gọi dfs(2, 2).",
      focus: 9
    },
    {
      title: "6. Hết lối thì báo thất bại, quay lui",
      why: "Nếu đã thử đủ bốn hướng mà không thấy E, trả về False/false. Hàm kết thúc và quay về lời gọi trước, nơi có thể còn hướng chưa thử.",
      example: "Đây là lý do DFS tự quay lại ngã rẽ cũ.",
      focus: 11
    }
  ];

  let codeMode = "build";
  let buildStage = 1;
  let currentLines = [];
  let lastFrame = null;
  let signature = "";
  const codeBox = () => $("pseudoCode");

  function groupIndex(index, lang) {
    if (index === 0) return 1;
    if (index >= 1 && index <= 4) return 2;
    if (index === 5) return 3;
    if (index >= 6 && index <= 7) return 4;
    if (index >= 8 && index <= 10) return 5;
    return 6;
  }

  function explainLine(source, index, lang) {
    const isPython = lang === "python";
    if (index === 0) return "Định nghĩa hàm nhận vị trí hiện tại: hàng và cột. Mỗi lần đi sang ô khác, hàm sẽ được gọi lại.";
    if (index === 1) return "Kiểm tra hàng hoặc cột có nằm ngoài ma trận không. Chỉ số hợp lệ bắt đầu từ 0.";
    if (index === 2) return "Nếu vượt biên thì dừng nhánh này. Không được đọc ô ngoài mảng.";
    if (index === 3) return "Ô tường không thể đi qua; ô đã thăm không cần thử lại vì có thể tạo vòng lặp.";
    if (index === 4) return "Gặp tường hoặc ô cũ thì dừng lời gọi hiện tại.";
    if (index === 5) return "Đánh dấu ô ngay lần đến đầu tiên, trước khi đi tìm ô tiếp theo.";
    if (index === 6) return "So sánh tọa độ đang xét với tọa độ E. Nếu trùng, ta tìm thấy đường.";
    if (index === 7) return "Báo tìm thấy E để các lời gọi trước trả kết quả thành công.";
    if (index === 8) return "Duyệt từng hướng trong danh sách, ví dụ phải, xuống, trái, lên.";
    if (index === 9) return "Gọi đệ quy dfs cho ô kế bên. Đây là bước đi sâu vào một nhánh.";
    if (index === 10) return isPython ? "Nếu nhánh này tìm được E thì dừng, không thử thêm hướng khác." : "Đóng vòng lặp thử các hướng.";
    if (index === 11) return "Đã thử các hướng nhưng chưa tìm thấy E. Trả thất bại để quay về ngã rẽ trước.";
    return "Đóng hàm dfs.";
  }

  function appendTokens(target, source) {
    for (const token of source.split(tokenPattern)) {
      if (!token) continue;
      const span = document.createElement("span");
      if (/^(#(?!include)|\/\/)/.test(token)) span.className = "token-comment";
      else if (/^["']/.test(token)) span.className = "token-string";
      else if (/^(def|if|else|for|in|return|not|or|and|False|True|bool|int|auto|void|vector|string|using|namespace|include|false|true|print|len|range|cout|pass)$/.test(token)) span.className = "token-keyword";
      span.textContent = token;
      target.appendChild(span);
    }
  }

  function currentIndex(frame) {
    if (!frame) return 0;
    if (frame.type === "visit") return 5;
    if (frame.type === "choice") return 9;
    if (frame.type === "found") return 6;
    if (frame.type === "backtrack" || frame.type === "failed") return 11;
    return 0;
  }

  function currentSourceLines() {
    const core = codeLines(language, labState, false);
    if (codeMode === "build") return core
      .map((line, index) => ({ ...line, coreIndex: index }))
      .filter(({coreIndex}) => groupIndex(coreIndex, language) <= buildStage);
    const all = codeLines(language, labState, showFull);
    if (!showFull) return all.map((line, index) => ({ ...line, coreIndex: index }));
    const coreStart = all.findIndex(item => item.phase === "start");
    return all.map((line, index) => ({
      ...line,
      coreIndex: index >= coreStart && index < coreStart + core.length ? index - coreStart : -1
    }));
  }

  function stageDetail() {
    if (codeMode === "build") {
      const stage = STAGES[buildStage - 1];
      $("codeStageCounter").textContent = "XÂY CODE · " + buildStage + " / " + STAGES.length;
      $("codeStageTitle").textContent = stage.title;
      $("codeStageExplanation").textContent = stage.why;
      $("codeCurrentContext").textContent = stage.example;
      $("codePrevStage").disabled = buildStage === 1;
      $("codeNextStage").innerHTML = buildStage === STAGES.length ?
        'Chạy thử trên mê cung <svg class="ui-icon"><use href="#ic-arrow"></use></svg>' :
        'Thêm phần tiếp <svg class="ui-icon"><use href="#ic-arrow"></use></svg>';
      $("codeWorkbenchLabel").textContent = "Các dòng đã xây";
      $("codeLineNote").textContent = buildStage < 6 ? "Đang xây hàm từng phần. Chưa phải chương trình hoàn chỉnh. Bấm từng dòng để hiểu lý do cần dòng đó." : "Đã có đủ các phần của hàm DFS. Bấm dòng bất kỳ để xem giải thích.";
    } else {
      const frame = lastFrame;
      const count = labState?.trace?.steps?.length || 0;
      $("codeStageCounter").textContent = "CHẠY DFS · " + (labState?.stepIndex || 0) + " / " + Math.max(count - 1, 0);
      $("codeStageTitle").textContent = frame?.title || "Máy chuẩn bị chạy DFS";
      $("codeStageExplanation").textContent = frame?.description || "Bấm Bước tiếp theo để xem lệnh và ma trận thay đổi cùng lúc.";
      $("codeCurrentContext").textContent = frame && frame.r >= 0 ? "Ô (" + frame.r + ", " + frame.c + ")" : "Từ điểm S tới E";
      $("codePrevStage").disabled = !labState || labState.stepIndex === 0;
      $("codeNextStage").disabled = !labState || labState.stepIndex >= (labState.trace?.steps.length || 1) - 1;
      $("codeNextStage").innerHTML = 'Bước DFS kế <svg class="ui-icon"><use href="#ic-arrow"></use></svg>';
      $("codeWorkbenchLabel").textContent = "Dòng sáng đang thực hiện";
      $("codeLineNote").textContent = explainLine("", currentIndex(frame), language);
    }
    $("codeFileLabel").textContent = language === "python" ? "dfs.py" : "dfs.cpp";
    $("codeViewBtn").textContent = showFull && codeMode === "run" ? "Hàm DFS" : "Code đầy đủ";
    $("codeViewBtn").setAttribute("aria-expanded",String(showFull && codeMode === "run"));
  }

  function setLineNote(index) {
    const reason = explainLine("", index, language);
    $("codeLineNote").textContent = reason;
    $("codeStageTitle").textContent = "Vì sao cần dòng này?";
    $("codeStageExplanation").textContent = reason;
  }

  function render(force = false) {
    if (!labState) return;
    const box = codeBox();
    if (!box) return;
    const sig = JSON.stringify({
      codeMode, buildStage, language, showFull,
      grid:labState.grid, start:labState.start, goal:labState.goal,
      direction: $("directionSelect")?.value
    });
    const rebuild = force || sig !== signature;
    if (rebuild) {
      signature = sig;
      const lines = currentSourceLines();
      currentLines = lines;
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const row = document.createElement("div");
        row.className = "code-row";
        row.dataset.coreIndex = String(line.coreIndex);
        if (line.phase) row.dataset.phase = line.phase;
        if (codeMode === "build" && line.coreIndex >= 0 && groupIndex(line.coreIndex, language) === buildStage) row.classList.add("new-line");
        const number = document.createElement("em");
        number.textContent = String(index + 1);
        const content = document.createElement("code");
        appendTokens(content,line.source || " ");
        row.append(number, content);
        if (line.coreIndex >= 0) {
          row.tabIndex = 0;
          row.title = "Nhấn để giải thích dòng này";
          row.setAttribute("aria-label", "Dòng " + (index + 1) + ". " + explainLine(line.source, line.coreIndex, language));
          row.addEventListener("click",()=>setLineNote(line.coreIndex));
          row.addEventListener("keydown",(event)=>{
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setLineNote(line.coreIndex);
            }
          });
        }
        fragment.appendChild(row);
      }
      box.replaceChildren(fragment);
      if (codeMode === "build") box.scrollTop = Math.max(0, box.scrollHeight - box.clientHeight);
    }
    const index = currentIndex(lastFrame);
    let active = null;
    box.querySelectorAll("[data-core-index]").forEach(row=>{
      const at = Number(row.dataset.coreIndex);
      const selected = codeMode === "run" && at === index;
      row.classList.toggle("current",selected);
      if (selected && !active) active = row;
    });
    stageDetail();
    if (active && codeMode === "run") {
      const scrollTop = active.offsetTop;
      if (scrollTop < box.scrollTop + 8 || scrollTop + active.offsetHeight > box.scrollTop + box.clientHeight - 8) {
        box.scrollTop = Math.max(0,scrollTop - box.clientHeight * 0.32);
      }
    }
  }

  function highlight(frame) {
    lastFrame = frame;
    render();
  }

  function setLanguage(lang) {
    language = lang === "cpp" ? "cpp" : "python";
    document.querySelectorAll("[data-language]").forEach(btn=>{
      const on = btn.dataset.language === language;
      btn.classList.toggle("active",on);
      btn.setAttribute("aria-pressed",String(on));
    });
    render(true);
  }

  function setMode(mode) {
    codeMode = mode === "run" ? "run" : "build";
    document.querySelectorAll("[data-code-mode]").forEach(btn=>{
      const on = btn.dataset.codeMode === codeMode;
      btn.classList.toggle("active",on);
      btn.setAttribute("aria-pressed",String(on));
    });
    $("codePrevStage").disabled = false;
    $("codeNextStage").disabled = false;
    render(true);
  }

  function navigate(delta) {
    if (codeMode === "run") {
      const btn = delta < 0 ? $("prevBtn") : $("nextBtn");
      if (btn && !btn.disabled) btn.click();
      return;
    }
    if (delta < 0) {
      buildStage = Math.max(1,buildStage - 1);
      render(true);
    } else if (buildStage < STAGES.length) {
      buildStage++;
      render(true);
    } else {
      setMode("run");
      if (labState.stepIndex === 0) $("nextBtn")?.click();
    }
  }

  async function copyCode() {
    if (!labState) return;
    const source = codeLines(language,labState,true).map(x=>x.source).join("\n") + "\n";
    const btn = $("copyCodeBtn");
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(source);
      else {
        const ta = document.createElement("textarea");
        ta.value = source;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw Error("Copy not supported");
      }
      btn.textContent = "Đã chép";
    } catch (error) {
      setMode("run"); showFull = true; render(true);
      btn.textContent = "Chọn code để chép";
    }
  }

  function init(state) {
    labState = state;
    document.querySelectorAll("[data-language]").forEach(btn =>
      btn.addEventListener("click",()=>setLanguage(btn.dataset.language)));
    document.querySelectorAll("[data-code-mode]").forEach(btn =>
      btn.addEventListener("click",()=>setMode(btn.dataset.codeMode)));
    $("codePrevStage")?.addEventListener("click",()=>navigate(-1));
    $("codeNextStage")?.addEventListener("click",()=>navigate(1));
    $("codeViewBtn")?.addEventListener("click",()=>{
      if (codeMode !== "run") {
        codeMode = "run"; showFull = true;
        setMode("run");
      } else {
        showFull = !showFull;
        render(true);
      }
    });
    $("copyCodeBtn")?.addEventListener("click",copyCode);
    setLanguage("python");
    setMode("build");
  }

  window.DFSCode = {
    init, highlight, codeLines, setLanguage, setMode, refresh:()=>render(true),
    getMode:()=>codeMode, getStage:()=>buildStage, getLanguage:()=>language
  };
})();

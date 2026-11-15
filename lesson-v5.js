"use strict";

(() => {
  const MAP = [
    "....###",
    ".#####.",
    "...##..",
    "##..#..",
    "......."
  ];

  const wrongBranch = [[0,0],[0,1],[0,2],[0,3]];
  const correctRoute = [
    [0,0],[1,0],[2,0],[2,1],[2,2],[3,2],
    [3,3],[4,3],[4,4],[4,5],[4,6]
  ];
  const PHASES = [
    {
      heading: "Nhánh đi sang phải bị chặn",
      text: "DFS lần lượt đi đến (0,3). Ô này không còn đường hợp lệ: bên phải và bên dưới là tường, bên trên ra ngoài bảng, bên trái đã thăm.",
      call: "dfs(0,3) → return False",
      active: [0,3]
    },
    {
      heading: "Quay về S để thử hướng còn lại",
      text: "Từ (0,3), hàm trả False và trở về (0,2), rồi (0,1), rồi (0,0). Các ô cũ vẫn được đánh dấu. Tại S còn hướng xuống chưa thử.",
      call: "dfs(0,2) → False  ·  dfs(0,1) → False",
      active: [0,0]
    },
    {
      heading: "Nhánh đi xuống tìm thấy E",
      text: "DFS thử (1,0), (2,0), (2,1), (2,2), (3,2), (3,3) rồi theo hàng cuối tới E. Hàm tại E trả True và kết quả truyền ngược về S.",
      call: "dfs(4,6) → True  ·  dfs(0,0) → True",
      active: [4,6]
    }
  ];
  const key = ([r,c]) => r + ":" + c;
  const branch = new Set(wrongBranch.map(key));
  const success = new Set(correctRoute.map(key));
  const $ = id => document.getElementById(id);

  function renderPhase(index) {
    const phase = PHASES[index] || PHASES[0];
    const root = $("workedGrid");
    const fragment = document.createDocumentFragment();
    const corner = document.createElement("span");
    corner.className = "worked-axis";
    corner.setAttribute("aria-hidden","true");
    fragment.appendChild(corner);

    for (let c=0;c<7;c++) {
      const col=document.createElement("span");
      col.className="worked-axis";
      col.textContent=c;
      col.setAttribute("aria-hidden","true");
      fragment.appendChild(col);
    }
    for (let r=0;r<5;r++) {
      const row=document.createElement("span");
      row.className="worked-axis";
      row.textContent=r;
      row.setAttribute("aria-hidden","true");
      fragment.appendChild(row);
      for (let c=0;c<7;c++) {
        const cell=document.createElement("span");
        const at=r+":"+c;
        cell.className="worked-cell";
        if (MAP[r][c]==="#") cell.classList.add("is-wall");
        if (index<2 && branch.has(at)) cell.classList.add(index===0?"is-branch":"is-past");
        if (index===2 && branch.has(at) && !success.has(at)) cell.classList.add("is-past");
        if (index===2 && success.has(at)) cell.classList.add("is-success");
        if (r===phase.active[0]&&c===phase.active[1]) cell.classList.add("is-active");
        if (r===0&&c===0){cell.classList.add("is-start");cell.textContent="S";}
        if (r===4&&c===6){cell.classList.add("is-goal");cell.textContent="E";}
        fragment.appendChild(cell);
      }
    }
    root.replaceChildren(fragment);
    root.setAttribute("aria-label",phase.heading+". "+phase.text);
    $("workedStepCount").textContent="TRẠNG THÁI "+(index+1)+" / 3";
    $("workedHeading").textContent=phase.heading;
    $("workedExplanation").textContent=phase.text;
    $("workedCall").textContent=phase.call;
    document.querySelectorAll("[data-example-phase]").forEach(button=>{
      const on=Number(button.dataset.examplePhase)===index;
      button.classList.toggle("active",on);
      button.setAttribute("aria-pressed",String(on));
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    renderPhase(0);
    document.querySelectorAll("[data-example-phase]").forEach(button=>
      button.addEventListener("click",()=>renderPhase(Number(button.dataset.examplePhase))));

    $("presetMobile")?.addEventListener("change",event=>loadPreset(event.target.value));

    $("lessonCodeBtn")?.addEventListener("click",()=>{
      loadPreset("starter");
      showView("lab",true);
      window.DFSCode?.setMode("build");
      if (window.innerWidth<=1050) setMobilePanel("code");
      else window.DFSInspector?.select("code");
    });
  });
})();

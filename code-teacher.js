"use strict";

(function () {
  const $ = id => document.getElementById(id);
  let inspectorMode = "explain";

  function select(mode) {
    inspectorMode = mode === "code" ? "code" : "explain";
    const showCode = inspectorMode === "code";
    const panel = $("inspectorPanel");
    if (!panel) return;
    panel.classList.toggle("code-pane-active", showCode);
    panel.classList.toggle("has-code", showCode);
    const workspace = document.querySelector(".workspace");
    if (workspace) {
      workspace.classList.toggle("code-focus", showCode);
      if (!showCode) workspace.classList.remove("is-code-expanded");
    }
    const expandBtn = $("expandCodeBtn");
    if (expandBtn && !showCode) {
      expandBtn.setAttribute("aria-pressed", "false");
      expandBtn.querySelector("span").textContent = "Mở rộng";
    }
    const details = $("codeDetails");
    if (details) details.hidden = !showCode;
    const oldButton = $("showCodePanelBtn");
    if (oldButton) oldButton.setAttribute("aria-expanded", String(showCode));
    document.querySelectorAll("[data-inspector-tab]").forEach(btn => {
      const on = btn.dataset.inspectorTab === inspectorMode;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    if (window.innerWidth <= 1050) {
      const workspace = document.querySelector(".workspace");
      if (workspace && workspace.dataset.activePanel !== "map") {
        workspace.dataset.activePanel = showCode ? "code" : "explain";
        document.querySelectorAll("[data-mobile-panel]").forEach(button => {
          const on = button.dataset.mobilePanel === (showCode ? "code" : "explain");
          button.classList.toggle("active", on);
          button.setAttribute("aria-pressed", String(on));
        });
      }
    }
    if (showCode) {
      window.DFSCode?.refresh();
    }
  }

  function init() {
    document.querySelectorAll("[data-inspector-tab]").forEach(btn => {
      btn.addEventListener("click", () => select(btn.dataset.inspectorTab));
    });
    $("showCodePanelBtn")?.addEventListener("click", () => select("code"));
    $("expandCodeBtn")?.addEventListener("click", () => {
      const workspace = document.querySelector(".workspace");
      if (!workspace) return;
      const expanded = workspace.classList.toggle("is-code-expanded");
      $("expandCodeBtn").setAttribute("aria-pressed", String(expanded));
      $("expandCodeBtn").setAttribute("aria-label", expanded ? "Thu gọn vùng code" : "Mở rộng vùng code");
      $("expandCodeBtn").querySelector("span").textContent = expanded ? "Thu gọn" : "Mở rộng";
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    });
    window.DFSInspector = {select, getMode: () => inspectorMode};
    select("explain");
  }
  document.addEventListener("DOMContentLoaded", init);
})();

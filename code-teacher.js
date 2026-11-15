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
    window.DFSInspector = {select, getMode: () => inspectorMode};
    select("explain");
  }
  document.addEventListener("DOMContentLoaded", init);
})();

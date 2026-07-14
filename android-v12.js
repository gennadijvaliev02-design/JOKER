(() => {
  "use strict";

  const PANEL_CLASSES = [
    "is-v12-order-panel",
    "is-v12-trump-panel",
    "is-v12-joker-suit-panel",
    "is-v12-joker-command-panel",
    "is-v12-joker-mode-panel",
  ];

  let installed = false;

  function clearV12PanelClasses() {
    elements?.bidPanel?.classList.remove(...PANEL_CLASSES);
  }

  function markPanel(kind) {
    if (!elements?.bidPanel) return;

    clearV12PanelClasses();
    elements.bidPanel.classList.add(`is-v12-${kind}-panel`);

    const cancel = elements.bidPanel.querySelector("[data-joker-cancel]");
    if (cancel) {
      cancel.hidden = kind === "order" || kind === "trump";
    }
  }

  function installPanelOverrides() {
    const originalTrumpSelection = renderTrumpSelection;
    const originalJokerSuitSelection = renderLeadJokerSuitSelection;
    const originalJokerCommandSelection = renderLeadJokerCommandSelection;
    const originalJokerModeSelection = renderJokerModeSelection;
    const originalRenderBidding = renderBidding;

    renderTrumpSelection = function renderV12TrumpSelection(...args) {
      const result = originalTrumpSelection.apply(this, args);
      markPanel("trump");
      return result;
    };

    renderLeadJokerSuitSelection = function renderV12JokerSuitSelection(...args) {
      const result = originalJokerSuitSelection.apply(this, args);

      elements.bidTitle.textContent = state.pendingJokerCommand === "take" ? "Берёт" : "Высший";
      elements.bidOptions.querySelectorAll(".android-joker-suit-option").forEach((button) => {
        button.querySelector(".android-joker-suit-name")?.remove();
      });

      markPanel("joker-suit");
      return result;
    };

    renderLeadJokerCommandSelection = function renderV12JokerCommandSelection(...args) {
      const result = originalJokerCommandSelection.apply(this, args);
      markPanel("joker-command");
      return result;
    };

    renderJokerModeSelection = function renderV12JokerModeSelection(...args) {
      const result = originalJokerModeSelection.apply(this, args);
      markPanel("joker-mode");
      return result;
    };

    renderBidding = function renderV12Bidding(...args) {
      const result = originalRenderBidding.apply(this, args);

      if (!elements.bidPanel || elements.bidPanel.hidden) {
        clearV12PanelClasses();
        return result;
      }

      if (state.phase === "bidding") {
        markPanel("order");
      } else if (state.phase === "trump-select") {
        markPanel("trump");
      } else if (state.phase === "joker-lead-suit") {
        markPanel("joker-suit");
      } else if (state.phase === "joker-lead-command") {
        markPanel("joker-command");
      } else if (state.phase === "joker-mode") {
        markPanel("joker-mode");
      }

      return result;
    };
  }

  function install() {
    if (installed) return;
    installed = true;
    installPanelOverrides();
  }

  window.addEventListener("joker-rules-adapters-ready", install, { once: true });

  if (document.documentElement.dataset.rulesReady === "true") {
    install();
  }
})();

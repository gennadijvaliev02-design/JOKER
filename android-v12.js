(() => {
  "use strict";

  const PANEL_CLASSES = [
    "is-v12-order-panel",
    "is-v12-trump-panel",
    "is-v12-joker-suit-panel",
    "is-v12-joker-command-panel",
    "is-v12-joker-mode-panel",
  ];

  const SILVER_BUTTON_SELECTOR = [
    '.bid-option[data-trump="clubs"]',
    '.bid-option[data-trump="spades"]',
    '.bid-option[data-joker-lead-suit="clubs"]',
    '.bid-option[data-joker-lead-suit="spades"]',
    '.android-joker-suit-option[data-joker-lead-suit="clubs"]',
    '.android-joker-suit-option[data-joker-lead-suit="spades"]',
  ].join(",");

  let installed = false;

  function clearV12PanelClasses() {
    elements?.bidPanel?.classList.remove(...PANEL_CLASSES);
  }

  function cleanSuitGlyph(value) {
    return String(value || "")
      .replace(/\uFE0F/g, "")
      .replace(/❤️/g, "♥")
      .replace(/♦️/g, "♦")
      .replace(/♣️/g, "♣")
      .replace(/♠️/g, "♠");
  }

  function normalizeSuitGlyphs(panel) {
    panel
      ?.querySelectorAll(
        '.bid-option[data-trump]:not([data-trump="no-trump"]), .android-joker-suit-symbol',
      )
      .forEach((node) => {
        const next = cleanSuitGlyph(node.textContent);
        if (node.textContent !== next) node.textContent = next;
      });
  }

  function paintSilverSuits(panel) {
    panel?.querySelectorAll(SILVER_BUTTON_SELECTOR).forEach((button) => {
      button.classList.add("android-silver-suit");
      button.style.setProperty("color", "#cbd3d0", "important");
      button.style.setProperty(
        "text-shadow",
        "0 1px 0 rgba(255,255,255,.28), 0 2px 4px rgba(0,0,0,.84)",
        "important",
      );
      button.style.setProperty("filter", "none", "important");
      button.style.setProperty("border-color", "rgba(198,211,207,.58)", "important");
      button.style.setProperty(
        "box-shadow",
        "0 11px 23px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.16), inset 0 -11px 18px rgba(0,0,0,.34)",
        "important",
      );

      button.querySelectorAll(".android-joker-suit-symbol").forEach((symbol) => {
        symbol.style.setProperty("color", "#cbd3d0", "important");
        symbol.style.setProperty(
          "text-shadow",
          "0 1px 0 rgba(255,255,255,.28), 0 2px 4px rgba(0,0,0,.84)",
          "important",
        );
        symbol.style.setProperty("filter", "none", "important");
      });
    });
  }

  function decoratePanel(kind) {
    const panel = elements?.bidPanel;
    if (!panel) return;

    clearV12PanelClasses();
    panel.classList.add(`is-v12-${kind}-panel`);

    const cancel = panel.querySelector("[data-joker-cancel]");
    if (cancel) cancel.hidden = kind === "order" || kind === "trump";

    if (kind === "trump" || kind === "joker-suit") {
      normalizeSuitGlyphs(panel);
      paintSilverSuits(panel);
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
      decoratePanel("trump");
      return result;
    };

    renderLeadJokerSuitSelection = function renderV12JokerSuitSelection(...args) {
      const result = originalJokerSuitSelection.apply(this, args);

      elements.bidTitle.textContent = state.pendingJokerCommand === "take" ? "Берёт" : "Высший";
      elements.bidOptions.querySelectorAll(".android-joker-suit-option").forEach((button) => {
        button.querySelector(".android-joker-suit-name")?.remove();
      });

      decoratePanel("joker-suit");
      return result;
    };

    renderLeadJokerCommandSelection = function renderV12JokerCommandSelection(...args) {
      const result = originalJokerCommandSelection.apply(this, args);
      decoratePanel("joker-command");
      return result;
    };

    renderJokerModeSelection = function renderV12JokerModeSelection(...args) {
      const result = originalJokerModeSelection.apply(this, args);
      decoratePanel("joker-mode");
      return result;
    };

    renderBidding = function renderV12Bidding(...args) {
      const result = originalRenderBidding.apply(this, args);

      if (!elements.bidPanel || elements.bidPanel.hidden) {
        clearV12PanelClasses();
        return result;
      }

      if (state.phase === "bidding") {
        decoratePanel("order");
      } else if (state.phase === "trump-select") {
        decoratePanel("trump");
      } else if (state.phase === "joker-lead-suit") {
        decoratePanel("joker-suit");
      } else if (state.phase === "joker-lead-command") {
        decoratePanel("joker-command");
      } else if (state.phase === "joker-mode") {
        decoratePanel("joker-mode");
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

  if (document.documentElement.dataset.rulesReady === "true") install();
})();

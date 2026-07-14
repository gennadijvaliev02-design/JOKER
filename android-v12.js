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
  let lastPanelKey = null;

  function clearV12PanelClasses() {
    elements?.bidPanel?.classList.remove(...PANEL_CLASSES);
  }

  function clearLegacyJokerPanel() {
    window.AndroidJokerPanel?.clearClasses?.();
    window.AndroidJokerPanel?.hideCancel?.();
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

  function markSilverSuits(panel) {
    panel?.querySelectorAll(SILVER_BUTTON_SELECTOR).forEach((button) => {
      button.classList.add("android-silver-suit");
    });
  }

  function getPanelKind() {
    if (state.phase === "joker-lead-command" && state.activePlayerId === "human") return "joker-command";
    if (state.phase === "joker-lead-suit" && state.activePlayerId === "human") return "joker-suit";
    if (state.phase === "joker-mode" && state.activePlayerId === "human") return "joker-mode";
    if (state.phase === "trump-select" && state.trumpChooserId === "human") return "trump";
    if (state.phase === "bidding" && getCurrentBidderId?.() === "human") return "order";
    return null;
  }

  function getPanelKey(kind) {
    if (kind === "order") {
      return `order:${state.biddingIndex}:${state.biddingOrder.length}:${getOrderedBidTotal?.() ?? ""}`;
    }
    if (kind === "trump") return `trump:${state.trumpChooserId || ""}`;
    if (kind === "joker-suit") {
      return `joker-suit:${state.pendingJokerCardId || ""}:${state.pendingJokerCommand || ""}`;
    }
    if (kind === "joker-command") return `joker-command:${state.pendingJokerCardId || ""}`;
    if (kind === "joker-mode") return `joker-mode:${state.pendingJokerCardId || ""}`;
    return `hidden:${state.phase}:${state.activePlayerId || ""}:${state.trumpChooserId || ""}`;
  }

  function decoratePanel(kind) {
    const panel = elements?.bidPanel;
    if (!panel || !kind) return;

    clearV12PanelClasses();
    panel.classList.add(`is-v12-${kind}-panel`);

    const cancel = panel.querySelector("[data-joker-cancel]");
    if (cancel) cancel.hidden = kind === "order" || kind === "trump";

    if (kind === "order" || kind === "trump") {
      window.AndroidJokerPanel?.clearClasses?.();
    }

    if (kind === "joker-suit") {
      elements.bidTitle.textContent = state.pendingJokerCommand === "take" ? "Берёт" : "Высший";
      elements.bidOptions.querySelectorAll(".android-joker-suit-name").forEach((name) => name.remove());
    }

    if (kind === "trump" || kind === "joker-suit") {
      normalizeSuitGlyphs(panel);
      markSilverSuits(panel);
    }
  }

  function installPanelOverride() {
    const originalRenderBidding = renderBidding;

    renderBidding = function renderCachedV12Bidding(...args) {
      const panel = elements?.bidPanel;
      const kind = getPanelKind();
      const key = getPanelKey(kind);
      const currentDomIsUsable = kind
        ? Boolean(panel && !panel.hidden && elements.bidOptions?.childElementCount)
        : Boolean(panel?.hidden && !elements.bidOptions?.childElementCount);

      if (key === lastPanelKey && currentDomIsUsable) return;

      const result = originalRenderBidding.apply(this, args);
      lastPanelKey = key;

      if (!panel || panel.hidden || !kind) {
        clearV12PanelClasses();
        clearLegacyJokerPanel();
        return result;
      }

      decoratePanel(kind);
      return result;
    };
  }

  function install() {
    if (installed) return;
    installed = true;
    installPanelOverride();
  }

  window.addEventListener("joker-rules-adapters-ready", install, { once: true });
  window.addEventListener("joker-language-change", () => {
    lastPanelKey = null;
  });

  if (document.documentElement.dataset.rulesReady === "true") install();
})();
(function () {
  "use strict";

  const bridge = window.JokerBotActionBridge;
  if (!bridge?.eventName) {
    console.warn("Joker bot action UI adapter: action bridge is unavailable.");
    return;
  }

  const root = document.documentElement;
  const TERMINAL_STAGES = new Set(["committed", "rejected", "error"]);
  const PLAYER_SELECTORS = [
    "[data-player-id]",
    "[data-player]",
    "[data-seat-player-id]",
  ];
  let currentActionId = null;
  let clearTimer = null;

  function matchingPlayerNodes(playerId) {
    if (!playerId) return [];
    const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(String(playerId))
      : String(playerId).replace(/["\\]/g, "\\$&");

    return PLAYER_SELECTORS.flatMap((selector) => {
      const attribute = selector.slice(1, -1);
      return Array.from(document.querySelectorAll(`[${attribute}="${escaped}"]`));
    });
  }

  function resetPlayerNodes() {
    document.querySelectorAll(".is-bot-thinking, .is-bot-action-success, .is-bot-action-rejected, .is-bot-action-error")
      .forEach((node) => {
        node.classList.remove(
          "is-bot-thinking",
          "is-bot-action-success",
          "is-bot-action-rejected",
          "is-bot-action-error",
        );
        node.removeAttribute("aria-busy");
        delete node.dataset.botActionStage;
      });
  }

  function clearUiState(actionId) {
    if (actionId != null && currentActionId !== actionId) return;
    currentActionId = null;
    resetPlayerNodes();
    delete root.dataset.botActionId;
    delete root.dataset.botActionKind;
    delete root.dataset.botActionPlayer;
    delete root.dataset.botActionStage;
    root.classList.remove("is-bot-action-active");
    window.dispatchEvent(new CustomEvent("joker-bot-ui-state", {
      detail: { stage: "clear", actionId },
    }));
  }

  function applyUiState(detail) {
    if (!detail || !detail.actionId || !detail.stage) return;

    if (clearTimer) {
      window.clearTimeout(clearTimer);
      clearTimer = null;
    }

    currentActionId = detail.actionId;
    resetPlayerNodes();
    root.dataset.botActionId = String(detail.actionId);
    root.dataset.botActionKind = detail.kind || "unknown";
    root.dataset.botActionPlayer = detail.playerId || "unknown";
    root.dataset.botActionStage = detail.stage;
    root.classList.toggle("is-bot-action-active", detail.stage === "before");

    const stageClass = detail.stage === "before"
      ? "is-bot-thinking"
      : `is-bot-action-${detail.stage}`;

    matchingPlayerNodes(detail.playerId).forEach((node) => {
      node.classList.add(stageClass);
      node.dataset.botActionStage = detail.stage;
      if (detail.stage === "before") node.setAttribute("aria-busy", "true");
    });

    window.dispatchEvent(new CustomEvent("joker-bot-ui-state", {
      detail: { ...detail },
    }));

    if (TERMINAL_STAGES.has(detail.stage)) {
      const actionId = detail.actionId;
      clearTimer = window.setTimeout(() => clearUiState(actionId), 450);
    }
  }

  window.addEventListener(bridge.eventName, (event) => applyUiState(event.detail));

  window.JokerBotActionUi = Object.freeze({
    clear: clearUiState,
    getCurrentActionId() {
      return currentActionId;
    },
  });
})();

(function () {
  const profiles = window.JokerRuleProfiles || {};
  const params = new URLSearchParams(window.location.search);
  const storedId = (() => {
    try {
      return window.localStorage.getItem("joker-rules-mode");
    } catch {
      return null;
    }
  })();
  const fallbackId = "aggression";
  const requestedId = params.get("rules");
  let selectedId = profiles[requestedId]
    ? requestedId
    : profiles[storedId]
      ? storedId
      : fallbackId;

  function getActiveRules() {
    return profiles[selectedId] || profiles[fallbackId];
  }

  function syncRuleSelection() {
    document.documentElement.dataset.rules = selectedId;

    try {
      window.localStorage.setItem("joker-rules-mode", selectedId);
    } catch {
      // The in-memory selection still works for the current session.
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("rules", selectedId);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // URL synchronization is optional; the selected profile still works.
    }
  }

  function emitRulesEvent(name) {
    window.dispatchEvent(new CustomEvent(name, {
      detail: { id: selectedId, rules: getActiveRules() },
    }));
  }

  const rulesApi = {
    get activeId() {
      return selectedId;
    },
    get active() {
      return getActiveRules();
    },
    profiles: Object.freeze({ ...profiles }),
    getProfile(id) {
      return profiles[id] || null;
    },
    selectProfile(id) {
      if (!profiles[id] || window.jokerState?.started) {
        return false;
      }

      if (id === selectedId) {
        return true;
      }

      selectedId = id;
      syncRuleSelection();
      emitRulesEvent("joker-rules-change");
      return true;
    },
    getHandSize(pulkaNumber, gameNumber) {
      const pulka = getActiveRules()?.pulkas?.find((item) => item.id === pulkaNumber);
      return pulka?.handSizes?.[gameNumber - 1] ?? 9;
    },
    getPulka(pulkaNumber) {
      return getActiveRules()?.pulkas?.find((item) => item.id === pulkaNumber) || null;
    },
    isPopular() {
      return selectedId === "popular";
    },
    isAggression() {
      return selectedId === "aggression";
    },
  };

  window.JokerRules = Object.freeze(rulesApi);
  syncRuleSelection();
  emitRulesEvent("joker-rules-ready");

  function loadAdapter(src, name) {
    return new Promise((resolve, reject) => {
      const adapter = document.createElement("script");
      adapter.src = src;
      adapter.dataset.rulesAdapter = name;
      adapter.addEventListener("load", resolve, { once: true });
      adapter.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      document.body.append(adapter);
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    const startButton = document.querySelector("#start-game");
    if (startButton) {
      startButton.disabled = true;
      startButton.dataset.rulesLoading = "true";
    }

    loadAdapter("rules/rules-hand-size-adapter.js?v=3", "hand-size")
      .then(() => loadAdapter("rules/rules-progression-adapter.js?v=2", "progression"))
      .then(() => loadAdapter("rules/rules-scoring-adapter.js?v=1", "scoring"))
      .then(() => loadAdapter("rules/core-logic-fixes.js?v=1", "core-fixes"))
      .then(() => loadAdapter("rules/deal-animation-adapter.js?v=2", "deal-animation"))
      .then(() => loadAdapter("rules/bot-survival-priority.js?v=1", "bot-survival"))
      .then(() => loadAdapter("rules/strategic-bot-brain.js?v=1", "strategic-brain"))
      .then(() => loadAdapter("rules/short-deal-tactics.js?v=1", "short-deal-tactics"))
      .then(() => loadAdapter("rules/rules-select.js?v=3", "selector"))
      .then(() => loadAdapter("rules/rules-book.js?v=1", "rules-book"))
      .then(() => {
        document.documentElement.dataset.rulesReady = "true";
        emitRulesEvent("joker-rules-adapters-ready");
      })
      .catch((error) => console.error("Joker rules adapters failed", error))
      .finally(() => {
        if (startButton) {
          startButton.disabled = false;
          delete startButton.dataset.rulesLoading;
        }
      });
  }, { once: true });
})();

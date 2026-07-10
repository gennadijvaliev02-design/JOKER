(function () {
  const profiles = window.JokerRuleProfiles || {};
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("rules");
  const fallbackId = "aggression";
  const selectedId = profiles[requestedId] ? requestedId : fallbackId;
  const activeRules = profiles[selectedId];

  window.JokerRules = Object.freeze({
    activeId: selectedId,
    active: activeRules,
    profiles: Object.freeze({ ...profiles }),
    getProfile(id) {
      return profiles[id] || null;
    },
    getHandSize(pulkaNumber, gameNumber) {
      const pulka = activeRules?.pulkas?.find((item) => item.id === pulkaNumber);
      return pulka?.handSizes?.[gameNumber - 1] ?? 9;
    },
    getPulka(pulkaNumber) {
      return activeRules?.pulkas?.find((item) => item.id === pulkaNumber) || null;
    },
    isPopular() {
      return selectedId === "popular";
    },
    isAggression() {
      return selectedId === "aggression";
    },
  });

  document.documentElement.dataset.rules = selectedId;
  window.dispatchEvent(new CustomEvent("joker-rules-ready", {
    detail: { id: selectedId, rules: activeRules },
  }));

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

    loadAdapter("rules/rules-hand-size-adapter.js?v=2", "hand-size")
      .then(() => loadAdapter("rules/rules-progression-adapter.js?v=2", "progression"))
      .then(() => {
        document.documentElement.dataset.rulesReady = "true";
        window.dispatchEvent(new CustomEvent("joker-rules-adapters-ready", {
          detail: { id: selectedId, rules: activeRules },
        }));
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

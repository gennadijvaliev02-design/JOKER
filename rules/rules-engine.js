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
})();

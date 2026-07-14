(() => {
  "use strict";

  /* Android render caches — no sound or panel-style ownership here. */
  if (typeof renderScoreSheet === "function" && typeof elements !== "undefined" && elements.scoreSheet) {
    const fullRenderScoreSheet = renderScoreSheet;

    renderScoreSheet = function androidV16RenderScoreSheet() {
      if (elements.scoreSheet.hidden) return;
      return fullRenderScoreSheet();
    };

    elements.scoreButton?.addEventListener("click", () => {
      requestAnimationFrame(() => {
        if (!elements.scoreSheet.hidden) fullRenderScoreSheet();
      });
    });
  }

  let handCacheInstalled = false;

  function installHandRenderCache() {
    if (handCacheInstalled || typeof renderHand !== "function" || !elements?.playerHand) return;
    handCacheInstalled = true;
    const fullRenderHand = renderHand;

    renderHand = function androidV16CachedHand(...args) {
      const hand = state.hands?.human || [];
      const nodes = Array.from(elements.playerHand.children);
      const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;
      const domMatches = nodes.length === hand.length
        && nodes.every((node, index) => node.classList.contains("card") && node.dataset.card === hand[index]?.id);

      if (!domMatches || shouldAnimateDeal) {
        return fullRenderHand.apply(this, args);
      }

      const middle = (hand.length - 1) / 2;
      nodes.forEach((node, index) => {
        const card = hand[index];
        const playable = typeof canHumanPlay === "function" ? canHumanPlay(card) : true;
        const disabled = !playable;
        const offset = index - middle;
        const rotate = `${offset * 1.8}deg`;
        const lift = `${Math.round(Math.abs(offset) * 2.2)}px`;

        if (node.disabled !== disabled) node.disabled = disabled;
        node.classList.toggle("is-disabled", disabled);
        if (node.classList.contains("is-dealt")) node.classList.remove("is-dealt");
        if (node.style.getPropertyValue("--deal-delay")) node.style.removeProperty("--deal-delay");
        if (node.style.getPropertyValue("--hand-rotate") !== rotate) node.style.setProperty("--hand-rotate", rotate);
        if (node.style.getPropertyValue("--hand-lift") !== lift) node.style.setProperty("--hand-lift", lift);
      });
    };
  }

  installHandRenderCache();
  window.addEventListener("load", installHandRenderCache, { once: true });
})();

(() => {
  "use strict";

  /* Deal 2026 duplicate guard: hide whole real-hand containers, not replaceable children. */
  if (document.getElementById("android-deal-container-mask-style")) return;

  const style = document.createElement("style");
  style.id = "android-deal-container-mask-style";
  style.textContent = `
    .table.is-deal-2026-staging > .hand,
    .table.is-deal-2026-staging > .hidden-cards {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      animation: none !important;
      transition: none !important;
    }

    .table.is-deal-2026-staging > .hand *,
    .table.is-deal-2026-staging > .hidden-cards * {
      opacity: 0 !important;
      visibility: hidden !important;
      animation: none !important;
      transition: none !important;
    }

    .table.is-deal-2026-revealing > .hand,
    .table.is-deal-2026-revealing > .hidden-cards {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;

  document.head.append(style);
})();

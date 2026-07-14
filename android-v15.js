(() => {
  "use strict";

  const V15_CSS = String.raw`
    /* Android V15 — final glow owner and low-cost panel rendering. */

    .trump-pill.v13-trump-ready .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.36),
        0 0 8px rgba(255,216,102,.14),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 10px rgba(255,255,255,.30) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="red"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.38),
        0 0 6px rgba(255,255,255,.16),
        0 0 11px rgba(255,73,96,.18),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 11px rgba(255,255,255,.32) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="black"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(226,234,231,.52),
        0 0 5px rgba(226,234,231,.15),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 10px rgba(255,255,255,.30) !important;
    }

    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel,
    .bid-panel.is-v12-joker-command-panel,
    .bid-panel.is-v12-joker-mode-panel,
    .bid-panel.is-v12-order-panel {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel {
      box-shadow:
        0 24px 54px rgba(0,0,0,.62),
        0 0 0 1px rgba(255,255,255,.065),
        0 0 11px rgba(226,185,83,.05),
        inset 0 1px 0 rgba(255,255,255,.16),
        inset 0 -22px 36px rgba(0,0,0,.34) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option,
    .bid-panel.is-v12-joker-suit-panel .bid-option[data-joker-lead-suit] {
      box-shadow:
        0 11px 23px rgba(0,0,0,.43),
        inset 0 1px 0 rgba(255,255,255,.17),
        inset 0 -11px 18px rgba(0,0,0,.31) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="hearts"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="diamonds"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="hearts"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="diamonds"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .bid-option[data-joker-lead-suit="hearts"],
    .bid-panel.is-v12-joker-suit-panel .bid-option[data-joker-lead-suit="diamonds"] {
      text-shadow:
        0 1px 0 rgba(255,255,255,.30),
        0 0 5px rgba(255,72,95,.18),
        0 3px 5px rgba(0,0,0,.68) !important;
      filter: none !important;
    }

    .bid-panel .android-silver-suit {
      color: #cbd3d0 !important;
      border-color: rgba(198,211,207,.58) !important;
      background:
        linear-gradient(180deg, rgba(255,255,255,.085), transparent 32%),
        linear-gradient(180deg, rgba(43,57,55,.97), rgba(10,18,20,.995)) !important;
      text-shadow:
        0 1px 0 rgba(255,255,255,.28),
        0 2px 4px rgba(0,0,0,.84) !important;
      filter: none !important;
      box-shadow:
        0 11px 23px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.16),
        inset 0 -11px 18px rgba(0,0,0,.34) !important;
    }

    .bid-panel .android-silver-suit::before {
      background: linear-gradient(180deg, rgba(255,255,255,.085), transparent) !important;
      filter: none !important;
    }

    .bid-panel .android-silver-suit .android-joker-suit-symbol {
      color: #cbd3d0 !important;
      text-shadow:
        0 1px 0 rgba(255,255,255,.28),
        0 2px 4px rgba(0,0,0,.84) !important;
      filter: none !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="no-trump"] {
      text-shadow: 0 2px 4px rgba(0,0,0,.74), 0 0 7px rgba(238,199,100,.06) !important;
      box-shadow:
        0 11px 23px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.16),
        inset 0 -11px 18px rgba(0,0,0,.33) !important;
    }
  `;

  if (!document.getElementById("android-v15-style")) {
    const style = document.createElement("style");
    style.id = "android-v15-style";
    style.textContent = V15_CSS;
    document.head.append(style);
  }
})();

(() => {
  "use strict";

  /* Android render caches — no sound ownership here. */
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

  window.setTimeout(installHandRenderCache, 520);
  window.addEventListener("load", () => window.setTimeout(installHandRenderCache, 520), { once: true });
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

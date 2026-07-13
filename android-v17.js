(() => {
  /* Android V17 deal correction: keep the deck beside the emotion button and make human cards visibly arrive. */
  if (
    typeof playCardDealAnimation !== "function"
    || typeof renderHand !== "function"
    || typeof elements === "undefined"
    || !elements.table
    || !elements.playerHand
  ) {
    return;
  }

  const CARD_INTERVAL = 213;
  const FLIGHT_DURATION = 495;
  const REVEAL_PAUSE = 300;
  const REVEAL_DURATION = 470;

  const style = document.createElement("style");
  style.id = "android-v17-deal-style";
  style.textContent = `
    .v14-deal-deck {
      left: var(--v17-deck-left, 50%) !important;
      top: var(--v17-deck-top, 44%) !important;
    }

    .hand .card.is-v17-human-pending {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      animation: none !important;
    }

    .game-summary:not([hidden]),
    .table-notice:not([hidden]) {
      z-index: 90 !important;
    }
  `;
  document.head.append(style);

  const baseDealAnimation = playCardDealAnimation;
  const baseRenderHand = renderHand;
  const pendingHumanIds = new Set();
  const revealedHumanIds = new Set();

  let signature = "";
  let previousTotal = 0;
  let forceFallbackTargets = false;
  let revealToken = 0;

  function currentSignature() {
    return `${window.JokerRules?.activeId || "rules"}:${state.currentPulka}:${state.currentGame}`;
  }

  function humanCards() {
    return [...elements.playerHand.querySelectorAll(":scope > .card")];
  }

  function applyHumanVisibility() {
    humanCards().forEach((card) => {
      card.classList.toggle("is-v17-human-pending", pendingHumanIds.has(card.dataset.card));
    });
  }

  function suppressHumanTargets() {
    humanCards().forEach((card) => {
      card.classList.remove("card");
      card.classList.add("v17-suppressed-card-target");
    });
  }

  function restoreHumanTargets() {
    elements.playerHand
      .querySelectorAll(":scope > .v17-suppressed-card-target")
      .forEach((card) => {
        card.classList.remove("v17-suppressed-card-target");
        card.classList.add("card");
      });
    applyHumanVisibility();
  }

  renderHand = function androidV17RenderHand(...args) {
    const result = baseRenderHand.apply(this, args);
    applyHumanVisibility();
    if (forceFallbackTargets) suppressHumanTargets();
    return result;
  };

  function localRect(element, tableRect) {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - tableRect.left,
      top: rect.top - tableRect.top,
      right: rect.right - tableRect.left,
      bottom: rect.bottom - tableRect.top,
    };
  }

  function intersects(candidate, blocker, margin = 8) {
    return !(
      candidate.right + margin <= blocker.left
      || candidate.left - margin >= blocker.right
      || candidate.bottom + margin <= blocker.top
      || candidate.top - margin >= blocker.bottom
    );
  }

  function positionDeckNearEmotion() {
    const emotion = elements.emotionButton || document.querySelector("#emotion-button");
    if (!emotion) return;

    const tableRect = elements.table.getBoundingClientRect();
    const emotionRect = emotion.getBoundingClientRect();
    if (!tableRect.width || !tableRect.height || !emotionRect.width || !emotionRect.height) return;

    const compact = tableRect.height <= 430;
    const deckWidth = compact ? 45 : 50;
    const deckHeight = compact ? 63 : 70;
    const padding = 12;
    const gap = 18;
    const smileX = emotionRect.left - tableRect.left + emotionRect.width / 2;
    const smileY = emotionRect.top - tableRect.top + emotionRect.height / 2;
    const inwardX = smileX >= tableRect.width / 2 ? -1 : 1;
    const inwardY = smileY >= tableRect.height / 2 ? -1 : 1;
    const horizontalOffset = emotionRect.width / 2 + deckWidth / 2 + gap;
    const verticalOffset = emotionRect.height / 2 + deckHeight / 2 + gap;

    const clampX = (value) => Math.min(
      tableRect.width - deckWidth / 2 - padding,
      Math.max(deckWidth / 2 + padding, value),
    );
    const clampY = (value) => Math.min(
      tableRect.height - deckHeight / 2 - padding,
      Math.max(deckHeight / 2 + padding, value),
    );

    const candidates = [
      [smileX + inwardX * horizontalOffset, smileY],
      [smileX + inwardX * horizontalOffset, smileY + inwardY * deckHeight * 0.62],
      [smileX, smileY + inwardY * verticalOffset],
      [smileX + inwardX * (horizontalOffset + deckWidth * 0.66), smileY + inwardY * deckHeight * 0.45],
    ].map(([x, y]) => [clampX(x), clampY(y)]);

    const blockers = [
      ...document.querySelectorAll(
        ".player, .game-hud, #table-menu, #score-button, .hand, .game-summary:not([hidden]), .table-notice:not([hidden])",
      ),
    ].filter((element) => element !== emotion && element.getClientRects().length > 0);

    const chosen = candidates.find(([centerX, centerY]) => {
      const candidate = {
        left: centerX - deckWidth / 2,
        top: centerY - deckHeight / 2,
        right: centerX + deckWidth / 2,
        bottom: centerY + deckHeight / 2,
      };
      return blockers.every((blocker) => !intersects(candidate, localRect(blocker, tableRect)));
    }) || candidates[0];

    elements.table.style.setProperty("--v17-deck-left", `${chosen[0]}px`);
    elements.table.style.setProperty("--v17-deck-top", `${chosen[1]}px`);
  }

  function getBatch(total) {
    const nextSignature = currentSignature();
    if (nextSignature !== signature || total <= previousTotal) {
      signature = nextSignature;
      previousTotal = 0;
      pendingHumanIds.clear();
      revealedHumanIds.clear();
    }

    const from = previousTotal;
    const count = Math.max(0, total - from);
    previousTotal = total;
    return { from, count };
  }

  function collectNewHumanIds(count) {
    const hand = Array.isArray(state.hands?.human) ? state.hands.human : [];
    let ids = hand
      .map((card) => card?.id)
      .filter((id) => id && !revealedHumanIds.has(id));

    if (ids.length > count) ids = ids.slice(-count);
    return ids;
  }

  function revealHumanCards(ids, token) {
    if (token !== revealToken) return;

    ids.forEach((id) => {
      pendingHumanIds.delete(id);
      revealedHumanIds.add(id);
    });

    renderHand();
    const idSet = new Set(ids);
    humanCards().forEach((card) => {
      if (!idSet.has(card.dataset.card)) return;
      card.classList.remove("is-v14-revealing");
      void card.offsetWidth;
      card.classList.add("is-v14-revealing");
      window.setTimeout(() => card.classList.remove("is-v14-revealing"), REVEAL_DURATION + 45);
    });
  }

  playCardDealAnimation = function androidV17DealAnimation(handCount) {
    if (state.autoPlay) return baseDealAnimation(handCount);

    const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
    const batch = getBatch(total);
    if (!batch.count) return baseDealAnimation(handCount);

    const newIds = collectNewHumanIds(batch.count);
    newIds.forEach((id) => pendingHumanIds.add(id));
    applyHumanVisibility();
    positionDeckNearEmotion();

    revealToken += 1;
    const token = revealToken;
    forceFallbackTargets = true;

    let result;
    try {
      result = baseDealAnimation(handCount);
    } finally {
      forceFallbackTargets = false;
      restoreHumanTargets();
    }

    const plannedFlights = batch.count * Math.max(1, state.players?.length || 4);
    const flightEnd = Math.max(0, plannedFlights - 1) * CARD_INTERVAL + FLIGHT_DURATION;
    window.setTimeout(
      () => revealHumanCards(newIds, token),
      flightEnd + REVEAL_PAUSE,
    );

    return result;
  };
})();

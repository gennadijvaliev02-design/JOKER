(() => {
  const DEAL_INTERVAL = 96;
  const DEAL_FLIGHT_TIME = 520;
  let previousHandCount = 0;
  let visibleHumanCardIds = new Set();

  function safeDelay(value) {
    return typeof getDelay === "function" ? getDelay(value) : value;
  }

  function scheduleDealSound(delay, strong = false) {
    if (typeof playSound !== "function") return;
    window.setTimeout(() => playSound(strong ? "trump" : "deal"), safeDelay(delay));
  }

  function getDealerForGame() {
    const dealerOrder = state.currentGame === 1 ? 4 : state.currentGame - 1;
    return state.players.find((player) => player.order === dealerOrder)
      || (typeof getGameLeaderId === "function" && typeof getPlayerById === "function"
        ? getPlayerById(getGameLeaderId())
        : null)
      || state.players[0];
  }

  function getDealOrder(dealerId) {
    if (typeof getPlayerOrderFrom !== "function") {
      return state.players.map((player) => player.id);
    }

    const order = [...getPlayerOrderFrom(dealerId)];
    if (order[0] === dealerId && order.length > 1) {
      order.push(order.shift());
    }
    return order;
  }

  function getTarget(seat) {
    if (typeof getSeatDealTarget === "function") {
      return getSeatDealTarget(seat);
    }

    const fallback = {
      left: { x: -270, y: 0, rotate: -7 },
      top: { x: 0, y: -150, rotate: 2 },
      right: { x: 270, y: 0, rotate: 7 },
      bottom: { x: 0, y: 150, rotate: 0 },
    };
    return fallback[seat] || fallback.bottom;
  }

  function getDeckOrigin(seat) {
    const target = getTarget(seat);
    const inward = {
      left: { x: 58, y: 4, rotate: -7 },
      top: { x: 0, y: 52, rotate: 2 },
      right: { x: -58, y: 4, rotate: 7 },
      bottom: { x: 0, y: -54, rotate: 0 },
    }[seat] || { x: 0, y: -54, rotate: 0 };

    return {
      x: target.x + inward.x,
      y: target.y + inward.y,
      rotate: inward.rotate,
    };
  }

  function createDealerDeck(origin) {
    const deck = document.createElement("div");
    deck.className = "android-dealer-deck";
    deck.setAttribute("aria-hidden", "true");
    deck.style.setProperty("--deck-x", `${origin.x}px`);
    deck.style.setProperty("--deck-y", `${origin.y}px`);
    deck.style.setProperty("--deck-r", `${origin.rotate || 0}deg`);
    return deck;
  }

  function getArcForSeat(seat, cardIndex) {
    const alternating = cardIndex % 2 === 0 ? 1 : -1;
    if (seat === "top") return { arcY: -24, turn: 5 * alternating };
    if (seat === "bottom") return { arcY: 17, turn: 4 * alternating };
    if (seat === "left") return { arcY: -13, turn: -7 + alternating * 2 };
    return { arcY: -13, turn: 7 + alternating * 2 };
  }

  function getSeatNodes(seat) {
    if (seat === "bottom") {
      return [...(elements.playerHand?.querySelectorAll(":scope > .card") || [])];
    }

    return [...(document.querySelector(`.${seat}-stack`)?.children || [])];
  }

  function beginActualCardReveal(totalCount, previousCount, isNewDeal) {
    if (isNewDeal) {
      visibleHumanCardIds = new Set();
    }

    for (const seat of ["left", "top", "right", "bottom"]) {
      const nodes = getSeatNodes(seat);

      nodes.forEach((node, index) => {
        node.classList.remove("is-deal-arrived");

        const shouldRemainVisible = seat === "bottom"
          ? visibleHumanCardIds.has(node.dataset.card)
          : index < previousCount;

        node.classList.toggle("is-deal-pending", !shouldRemainVisible && index < totalCount);
      });
    }
  }

  function revealActualCard(seat) {
    const node = getSeatNodes(seat).find((candidate) => candidate.classList.contains("is-deal-pending"));
    if (!node) return;

    node.classList.remove("is-deal-pending");
    node.classList.add("is-deal-arrived");

    if (seat === "bottom" && node.dataset.card) {
      visibleHumanCardIds.add(node.dataset.card);
    }

    window.setTimeout(() => node.classList.remove("is-deal-arrived"), 330);
  }

  function calculateBatch(handCount) {
    const totalCount = Math.max(0, Math.min(Number(handCount) || 0, 9));
    const isNewDeal = totalCount <= previousHandCount;
    const previousCount = isNewDeal ? 0 : previousHandCount;
    const batchCount = Math.max(0, totalCount - previousCount);

    previousHandCount = totalCount;
    return { totalCount, previousCount, batchCount, isNewDeal };
  }

  playCardDealAnimation = function synchronizedTwoStageDeal(handCount) {
    if (state.autoPlay || !elements?.table) return;

    if (
      typeof createDealLayer !== "function"
      || typeof createFlyingBack !== "function"
      || typeof getPlayerById !== "function"
    ) {
      return;
    }

    const batch = calculateBatch(handCount);
    if (!batch.batchCount) return;

    beginActualCardReveal(batch.totalCount, batch.previousCount, batch.isNewDeal);

    const layer = createDealLayer("is-hand-deal is-dealer-seat-deal is-premium-deal is-synced-deal");
    if (!layer) return;

    const dealer = getDealerForGame();
    const dealerSeat = dealer?.seat || "bottom";
    const origin = getDeckOrigin(dealerSeat);
    const deck = createDealerDeck(origin);
    const dealOrder = getDealOrder(dealer?.id);
    const cards = [];
    let dealStep = 0;

    for (let cardIndex = 0; cardIndex < batch.batchCount; cardIndex += 1) {
      for (const playerId of dealOrder) {
        const player = getPlayerById(playerId);
        if (!player) continue;

        const target = getTarget(player.seat);
        const horizontalSeat = player.seat === "top" || player.seat === "bottom";
        const finalIndex = batch.previousCount + cardIndex;
        const finalMiddle = (batch.totalCount - 1) / 2;
        const spread = finalIndex - finalMiddle;
        const arc = getArcForSeat(player.seat, finalIndex);
        const targetWithSpread = {
          ...target,
          x: target.x + spread * (horizontalSeat ? 8.5 : 2.2),
          y: target.y + spread * (horizontalSeat ? 1 : 4.7),
        };

        const delay = dealStep * DEAL_INTERVAL;
        const card = createFlyingBack(targetWithSpread, delay, dealStep);
        card.style.setProperty("--flight-start-x", `${origin.x}px`);
        card.style.setProperty("--flight-start-y", `${origin.y}px`);
        card.style.setProperty("--flight-start-r", `${origin.rotate || 0}deg`);
        card.style.setProperty("--deal-arc-y", `${arc.arcY}px`);
        card.style.setProperty("--deal-turn", `${arc.turn}deg`);
        cards.push(card);

        window.setTimeout(() => {
          card.remove();
          revealActualCard(player.seat);
        }, safeDelay(delay + DEAL_FLIGHT_TIME));

        scheduleDealSound(delay + 26);
        dealStep += 1;
      }
    }

    layer.replaceChildren(deck, ...cards);

    const totalDuration = Math.max(1200, (dealStep - 1) * DEAL_INTERVAL + DEAL_FLIGHT_TIME);
    window.setTimeout(() => deck.classList.add("is-finishing"), safeDelay(totalDuration - 210));
    window.setTimeout(() => {
      for (const seat of ["left", "top", "right", "bottom"]) {
        getSeatNodes(seat).forEach((node) => node.classList.remove("is-deal-pending"));
      }
      layer.remove();
    }, safeDelay(totalDuration + 280));
  };
})();

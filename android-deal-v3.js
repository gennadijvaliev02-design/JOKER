(() => {
  const DEAL_INTERVAL = 92;
  const DEAL_FLIGHT_TIME = 520;

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

  function removeFlightCardAfterLanding(card, delay) {
    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      card.remove();
    };

    card.addEventListener("animationend", (event) => {
      if (event.target === card) remove();
    }, { once: true });

    // Fallback for WebViews that suppress animationend while frames are skipped.
    window.setTimeout(remove, safeDelay(delay + DEAL_FLIGHT_TIME + 90));
  }

  function getArcForSeat(seat, cardIndex) {
    const alternating = cardIndex % 2 === 0 ? 1 : -1;
    if (seat === "top") return { arcY: -24, turn: 5 * alternating };
    if (seat === "bottom") return { arcY: 17, turn: 4 * alternating };
    if (seat === "left") return { arcY: -13, turn: -7 + alternating * 2 };
    return { arcY: -13, turn: 7 + alternating * 2 };
  }

  const previousDealAnimation = typeof playCardDealAnimation === "function"
    ? playCardDealAnimation
    : null;

  playCardDealAnimation = function androidDealerStyleDeal(handCount) {
    if (state.autoPlay || !elements?.table) return;

    if (
      typeof createDealLayer !== "function"
      || typeof createFlyingBack !== "function"
      || typeof getPlayerById !== "function"
    ) {
      previousDealAnimation?.(handCount);
      return;
    }

    const layer = createDealLayer("is-hand-deal is-dealer-seat-deal is-premium-deal");
    if (!layer) {
      previousDealAnimation?.(handCount);
      return;
    }

    const dealer = getDealerForGame();
    const dealerSeat = dealer?.seat || "bottom";
    const origin = getDeckOrigin(dealerSeat);
    const deck = createDealerDeck(origin);
    const cardsPerPlayer = Math.max(3, Math.min(handCount || 9, 9));
    const dealOrder = getDealOrder(dealer?.id);
    const cards = [];
    let dealStep = 0;

    for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex += 1) {
      for (const playerId of dealOrder) {
        const player = getPlayerById(playerId);
        if (!player) continue;

        const target = getTarget(player.seat);
        const horizontalSeat = player.seat === "top" || player.seat === "bottom";
        const spread = cardIndex - (cardsPerPlayer - 1) / 2;
        const arc = getArcForSeat(player.seat, cardIndex);
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
        removeFlightCardAfterLanding(card, delay);
        scheduleDealSound(delay + 26);
        dealStep += 1;
      }
    }

    layer.replaceChildren(deck, ...cards);

    const totalDuration = Math.max(1800, (dealStep - 1) * DEAL_INTERVAL + DEAL_FLIGHT_TIME);
    window.setTimeout(() => deck.classList.add("is-finishing"), safeDelay(totalDuration - 210));
    window.setTimeout(() => layer.remove(), safeDelay(totalDuration + 260));
  };

  if (typeof playAceDealAnimation === "function") {
    const originalAceDealAnimation = playAceDealAnimation;

    playAceDealAnimation = function androidPremiumAceDeal(aceDeal) {
      elements?.table?.classList.add("is-android-ace-deal");
      const result = originalAceDealAnimation(aceDeal);
      const cardCount = Math.max(1, aceDeal?.revealedCards?.length || 1);
      const duration = Math.max(3900, cardCount * 440 + 2200);

      window.setTimeout(() => {
        elements?.table?.classList.remove("is-android-ace-deal");
      }, safeDelay(duration));

      return result;
    };
  }
})();

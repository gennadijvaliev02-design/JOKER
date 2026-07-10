(function () {
  if (typeof state === "undefined" || !elements?.playerHand) {
    console.warn("Joker deal animation adapter: game UI is unavailable.");
    return;
  }

  const CARD_STEP_MS = 145;
  const FLIGHT_REVEAL_MS = 720;
  const FLIGHT_DURATION_MS = 980;
  const END_PAUSE_MS = 260;
  let activeReveal = null;
  let visibleCardIds = new Set();
  let lastGameSignature = "";
  let lastDealKey = -1;
  let currentAnimationDuration = 1400;

  const style = document.createElement("style");
  style.textContent = `
    .hand .card.is-sequential-deal-pending {
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      animation: none !important;
    }
    .hand .card.is-sequential-deal-arrived {
      animation: sequential-hand-card-arrival 360ms cubic-bezier(.16,.84,.2,1) both !important;
    }
    @keyframes sequential-hand-card-arrival {
      0% { opacity: 0; filter: brightness(.88); }
      72% { opacity: 1; filter: brightness(1.08); }
      100% { opacity: 1; filter: brightness(1); }
    }
  `;
  document.head.append(style);

  function getCurrentHandSize() {
    return Math.max(
      1,
      Math.min(
        9,
        Number(state.currentHandSize || window.JokerRulesHandSize?.getCurrentHandSize?.() || 9),
      ),
    );
  }

  function getGameSignature() {
    return `${state.currentPulka}:${state.currentGame}`;
  }

  function getDealerForCurrentGame() {
    const dealerOrder = state.currentGame === 1 ? 4 : state.currentGame - 1;
    return state.players.find((player) => player.order === dealerOrder)
      || getPlayerById(getGameLeaderId())
      || state.players[0];
  }

  function getDealerFlightStart(seat) {
    const target = getSeatDealTarget(seat);

    if (seat === "top") {
      return { x: -108, y: -128, rotate: 4 };
    }

    return target;
  }

  function getDurationForCards(cardsPerPlayer) {
    const totalCards = Math.max(1, cardsPerPlayer * Math.max(1, state.players.length));
    return (totalCards - 1) * CARD_STEP_MS + FLIGHT_DURATION_MS + END_PAUSE_MS;
  }

  function resetRevealMemoryIfNeeded(hand) {
    const signature = getGameSignature();
    const currentIds = new Set((hand || []).map((card) => card.id));
    const lostAllRememberedCards = visibleCardIds.size > 0
      && ![...visibleCardIds].some((cardId) => currentIds.has(cardId));
    const dealKeyRestarted = state.dealAnimationKey <= lastDealKey;

    if (signature !== lastGameSignature || dealKeyRestarted || lostAllRememberedCards) {
      visibleCardIds = new Set();
      activeReveal = null;
    }

    lastGameSignature = signature;
    lastDealKey = state.dealAnimationKey;
  }

  function applyRevealState() {
    const cards = [...elements.playerHand.querySelectorAll(".card")];

    cards.forEach((card) => {
      const cardId = card.dataset.card;
      const isVisible = !activeReveal || visibleCardIds.has(cardId);
      card.classList.toggle("is-sequential-deal-pending", !isVisible);
    });
  }

  function revealCard(cardId) {
    if (!activeReveal || activeReveal.key !== state.dealAnimationKey) {
      return;
    }

    visibleCardIds.add(cardId);
    const card = elements.playerHand.querySelector(`[data-card="${CSS.escape(cardId)}"]`);

    if (card) {
      card.classList.remove("is-sequential-deal-pending");
      card.classList.remove("is-sequential-deal-arrived");
      void card.offsetWidth;
      card.classList.add("is-sequential-deal-arrived");
    }
  }

  function startSequentialReveal(hand, newCardIds, playersInDealOrder) {
    const humanPosition = Math.max(0, playersInDealOrder.indexOf("human"));
    activeReveal = {
      key: state.dealAnimationKey,
      pendingIds: new Set(newCardIds),
    };
    applyRevealState();

    newCardIds.forEach((cardId, index) => {
      const dealStep = index * state.players.length + humanPosition;
      scheduleGameTask(() => revealCard(cardId), dealStep * CARD_STEP_MS + FLIGHT_REVEAL_MS);
    });

    scheduleGameTask(() => {
      if (activeReveal?.key === state.dealAnimationKey) {
        hand.forEach((card) => visibleCardIds.add(card.id));
        activeReveal = null;
        applyRevealState();
      }
    }, currentAnimationDuration);
  }

  const originalRenderHand = renderHand;
  renderHand = function renderHandWithSequentialDeal(...args) {
    const result = originalRenderHand.apply(this, args);
    applyRevealState();
    return result;
  };

  playCardDealAnimation = function slowerSequentialCardDealAnimation(handCount) {
    if (state.autoPlay || !elements.table) {
      return;
    }

    const hand = state.hands.human || [];
    resetRevealMemoryIfNeeded(hand);

    const handSize = Math.max(1, Math.min(Number(handCount) || getCurrentHandSize(), 9));
    const newCardIds = hand
      .map((card) => card.id)
      .filter((cardId) => !visibleCardIds.has(cardId));
    const cardsToDeal = Math.max(1, newCardIds.length);
    currentAnimationDuration = getDurationForCards(cardsToDeal);

    const layer = createDealLayer("is-hand-deal is-dealer-seat-deal");
    if (!layer) {
      hand.forEach((card) => visibleCardIds.add(card.id));
      activeReveal = null;
      applyRevealState();
      return;
    }

    const dealer = getDealerForCurrentGame();
    const dealerTarget = getDealerFlightStart(dealer?.seat || "bottom");
    const playersInDealOrder = getPlayerOrderFrom(dealer?.id || getGameLeaderId());
    const cards = [];
    let dealStep = 0;

    startSequentialReveal(hand, newCardIds, playersInDealOrder);

    for (let newCardIndex = 0; newCardIndex < cardsToDeal; newCardIndex += 1) {
      const absoluteCardIndex = Math.max(0, handSize - cardsToDeal + newCardIndex);

      for (const playerId of playersInDealOrder) {
        const player = getPlayerById(playerId);
        if (!player) {
          continue;
        }

        const target = getSeatDealTarget(player.seat);
        const targetWithSpread = {
          ...target,
          x: target.x + (absoluteCardIndex - (handSize - 1) / 2) * (player.seat === "top" || player.seat === "bottom" ? 9 : 2),
          y: target.y + (absoluteCardIndex - (handSize - 1) / 2) * (player.seat === "left" || player.seat === "right" ? 5 : 1),
        };
        const delay = dealStep * CARD_STEP_MS;
        const flyingCard = createFlyingBack(targetWithSpread, delay, dealStep);
        flyingCard.style.setProperty("--flight-start-x", `${dealerTarget.x}px`);
        flyingCard.style.setProperty("--flight-start-y", `${dealerTarget.y}px`);
        flyingCard.style.setProperty("--flight-start-r", `${dealerTarget.rotate || 0}deg`);
        cards.push(flyingCard);
        scheduleGameTask(() => playSound("deal"), delay + 35);
        dealStep += 1;
      }
    }

    layer.replaceChildren(...cards);
    scheduleGameTask(() => layer.remove(), currentAnimationDuration);
  };

  runAfterDealAnimation = function runAfterProfileDealAnimation(callback) {
    if (state.autoPlay) {
      callback();
      return;
    }

    scheduleGameTask(callback, currentAnimationDuration);
  };

  window.JokerDealAnimation = Object.freeze({
    getDuration() {
      return currentAnimationDuration;
    },
    get revealedCards() {
      return visibleCardIds.size;
    },
  });
})();

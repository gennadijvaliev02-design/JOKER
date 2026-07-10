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
      0% { opacity: 0; transform: translate3d(0,-18px,0) scale(.9) !important; }
      72% { opacity: 1; transform: translate3d(0,-3px,0) scale(1.035) !important; }
      100% { opacity: 1; transform: translate3d(0,0,0) scale(1) !important; }
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

  function getDealDuration(handSize = getCurrentHandSize()) {
    const totalCards = Math.max(1, handSize * Math.max(1, state.players.length));
    return (totalCards - 1) * CARD_STEP_MS + FLIGHT_DURATION_MS + END_PAUSE_MS;
  }

  function applyRevealState() {
    if (!activeReveal || activeReveal.key !== state.dealAnimationKey) {
      return;
    }

    const cards = [...elements.playerHand.querySelectorAll(".card")];
    cards.forEach((card, index) => {
      const isVisible = index < activeReveal.revealed;
      card.classList.toggle("is-sequential-deal-pending", !isVisible);

      if (isVisible && index === activeReveal.revealed - 1) {
        card.classList.add("is-sequential-deal-arrived");
      }
    });
  }

  function revealNextCard(index) {
    if (!activeReveal || activeReveal.key !== state.dealAnimationKey) {
      return;
    }

    activeReveal.revealed = Math.max(activeReveal.revealed, index + 1);
    applyRevealState();
  }

  function startSequentialReveal(handSize, playersInDealOrder) {
    const humanPosition = Math.max(0, playersInDealOrder.indexOf("human"));
    activeReveal = {
      key: state.dealAnimationKey,
      total: handSize,
      revealed: 0,
    };
    applyRevealState();

    for (let cardIndex = 0; cardIndex < handSize; cardIndex += 1) {
      const dealStep = cardIndex * state.players.length + humanPosition;
      scheduleGameTask(() => revealNextCard(cardIndex), dealStep * CARD_STEP_MS + FLIGHT_REVEAL_MS);
    }

    scheduleGameTask(() => {
      if (activeReveal?.key === state.dealAnimationKey) {
        activeReveal.revealed = handSize;
        applyRevealState();
        activeReveal = null;
      }
    }, getDealDuration(handSize));
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

    const handSize = Math.max(1, Math.min(Number(handCount) || getCurrentHandSize(), 9));
    const layer = createDealLayer("is-hand-deal is-dealer-seat-deal");
    if (!layer) {
      return;
    }

    const dealer = getDealerForCurrentGame();
    const dealerTarget = getDealerFlightStart(dealer?.seat || "bottom");
    const playersInDealOrder = getPlayerOrderFrom(dealer?.id || getGameLeaderId());
    const cards = [];
    let dealStep = 0;

    startSequentialReveal(handSize, playersInDealOrder);

    for (let cardIndex = 0; cardIndex < handSize; cardIndex += 1) {
      for (const playerId of playersInDealOrder) {
        const player = getPlayerById(playerId);
        if (!player) {
          continue;
        }

        const target = getSeatDealTarget(player.seat);
        const targetWithSpread = {
          ...target,
          x: target.x + (cardIndex - (handSize - 1) / 2) * (player.seat === "top" || player.seat === "bottom" ? 9 : 2),
          y: target.y + (cardIndex - (handSize - 1) / 2) * (player.seat === "left" || player.seat === "right" ? 5 : 1),
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
    scheduleGameTask(() => layer.remove(), getDealDuration(handSize));
  };

  runAfterDealAnimation = function runAfterProfileDealAnimation(callback) {
    if (state.autoPlay) {
      callback();
      return;
    }

    scheduleGameTask(callback, getDealDuration());
  };

  window.JokerDealAnimation = Object.freeze({
    getDuration: getDealDuration,
    get revealedCards() {
      return activeReveal?.revealed ?? getCurrentHandSize();
    },
  });
})();

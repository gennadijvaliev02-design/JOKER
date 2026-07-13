(() => {
  const CARD_INTERVAL = 260;
  const FLIGHT_DURATION = 300;
  const CLEANUP_PAD = 180;

  let previousTotal = 0;
  let visibleBottomCardIds = new Set();
  let activeDealToken = 0;
  let lastDealDuration = 0;

  function safeDelay(value) {
    return typeof getDelay === "function" ? getDelay(value) : value;
  }

  function getSeatNodes(seat) {
    if (seat === "bottom") {
      return [...(elements?.playerHand?.querySelectorAll(":scope > .card") || [])];
    }

    return [...(document.querySelector(`.${seat}-stack`)?.children || [])];
  }

  function clearOldDealArtifacts() {
    document
      .querySelectorAll(".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .deal-flight-layer.v11-deal-layer, .android-dealer-deck")
      .forEach((node) => node.remove());

    for (const seat of ["left", "top", "right", "bottom"]) {
      getSeatNodes(seat).forEach((node) => {
        node.classList.remove(
          "is-deal-pending",
          "is-deal-arrived",
          "is-v11-deal-pending",
          "is-v11-deal-arrived",
        );
      });
    }

    elements?.table?.classList.remove("is-dealing", "is-v11-dealing");
  }

  function calculateBatch(handCount) {
    const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
    const isNewDeal = total <= previousTotal;
    const previous = isNewDeal ? 0 : previousTotal;
    const batch = Math.max(0, total - previous);

    previousTotal = total;
    if (isNewDeal) {
      visibleBottomCardIds = new Set();
    }

    return { total, previous, batch, isNewDeal };
  }

  function prepareTargetQueues(batch) {
    const queues = { left: [], top: [], right: [], bottom: [] };

    for (const seat of Object.keys(queues)) {
      const nodes = getSeatNodes(seat);

      nodes.forEach((node, index) => {
        node.classList.remove("is-deal-pending", "is-deal-arrived", "is-v11-deal-arrived");

        const alreadyVisible = seat === "bottom"
          ? visibleBottomCardIds.has(node.dataset.card)
          : index < batch.previous;

        const isNewCard = !alreadyVisible && index < batch.total;
        node.classList.toggle("is-v11-deal-pending", isNewCard);

        if (isNewCard) {
          queues[seat].push(node);
        }
      });
    }

    return queues;
  }

  function getDealer() {
    const dealerOrder = state.currentGame === 1 ? 4 : state.currentGame - 1;
    return state.players.find((player) => player.order === dealerOrder)
      || (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"
        ? getPlayerById(getGameLeaderId())
        : null)
      || state.players[0];
  }

  function getRoundRobinOrder(dealerId) {
    if (typeof getPlayerOrderFrom !== "function") {
      return state.players.map((player) => player.id);
    }

    const order = [...getPlayerOrderFrom(dealerId)];
    if (order.length > 1 && order[0] === dealerId) {
      order.push(order.shift());
    }
    return order;
  }

  function createLayer() {
    const layer = document.createElement("div");
    layer.className = "deal-flight-layer v11-deal-layer is-hand-deal";
    layer.setAttribute("aria-hidden", "true");
    elements.table.append(layer);

    const deck = document.createElement("div");
    deck.className = "deal-deck v11-deal-deck";
    deck.setAttribute("aria-hidden", "true");
    layer.append(deck);

    return { layer, deck };
  }

  function revealTarget(target, seat) {
    if (!target?.isConnected) return;

    target.classList.remove("is-v11-deal-pending");
    target.classList.add("is-v11-deal-arrived");

    if (seat === "bottom" && target.dataset.card) {
      visibleBottomCardIds.add(target.dataset.card);
    }

    window.setTimeout(() => {
      target.classList.remove("is-v11-deal-arrived");
    }, 260);
  }

  function createFlyingCard() {
    const card = document.createElement("span");
    card.className = "flying-card-back v11-flying-card";
    card.setAttribute("aria-hidden", "true");
    return card;
  }

  function getCardSize(card) {
    const rect = card.getBoundingClientRect();
    return {
      width: rect.width || 50,
      height: rect.height || 70,
    };
  }

  function playSingleFlight({ layer, deck, target, seat, delay, index, token }) {
    window.setTimeout(() => {
      if (token !== activeDealToken || !layer.isConnected || !target?.isConnected) return;

      const tableRect = elements.table.getBoundingClientRect();
      const deckRect = deck.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const card = createFlyingCard();
      layer.append(card);

      const cardSize = getCardSize(card);
      const startX = deckRect.left - tableRect.left + deckRect.width / 2 - cardSize.width / 2;
      const startY = deckRect.top - tableRect.top + deckRect.height / 2 - cardSize.height / 2;
      const endX = targetRect.left - tableRect.left + targetRect.width / 2 - cardSize.width / 2;
      const endY = targetRect.top - tableRect.top + targetRect.height / 2 - cardSize.height / 2;
      const middleX = startX + (endX - startX) * 0.56;
      const middleY = startY + (endY - startY) * 0.56 - Math.min(30, Math.abs(endY - startY) * 0.08 + 14);
      const finalScale = Math.max(0.48, Math.min(0.96, Math.min(
        targetRect.width / cardSize.width,
        targetRect.height / cardSize.height,
      )));
      const seatRotation = seat === "left" ? -88 : seat === "right" ? 88 : seat === "top" ? 2 : 0;
      const turn = (index % 3 - 1) * 3;

      if (typeof playSound === "function") {
        playSound("deal");
      }

      const animation = card.animate([
        {
          opacity: 0.92,
          filter: "brightness(.92) blur(.4px)",
          transform: `translate3d(${startX}px, ${startY}px, 0) rotate(-2deg) scale(.82)`,
        },
        {
          opacity: 1,
          filter: "brightness(1.06) blur(0)",
          transform: `translate3d(${middleX}px, ${middleY}px, 0) rotate(${seatRotation * 0.45 + turn}deg) scale(1.02)`,
          offset: 0.62,
        },
        {
          opacity: 1,
          filter: "brightness(1) blur(0)",
          transform: `translate3d(${endX}px, ${endY}px, 0) rotate(${seatRotation}deg) scale(${finalScale})`,
        },
      ], {
        duration: safeDelay(FLIGHT_DURATION),
        easing: "cubic-bezier(.18,.76,.22,1)",
        fill: "forwards",
      });

      const finish = () => {
        revealTarget(target, seat);
        card.remove();
      };

      animation.addEventListener?.("finish", finish, { once: true });
      animation.finished?.then(finish).catch(() => {});
      window.setTimeout(finish, safeDelay(FLIGHT_DURATION + 80));
    }, safeDelay(delay));
  }

  playCardDealAnimation = function playV11RealTargetDeal(handCount) {
    if (state.autoPlay || !elements?.table) return;

    activeDealToken += 1;
    const token = activeDealToken;
    clearOldDealArtifacts();

    const batch = calculateBatch(handCount);
    if (!batch.batch) return;

    const queues = prepareTargetQueues(batch);
    const { layer, deck } = createLayer();
    elements.table.classList.add("is-v11-dealing");

    const dealer = getDealer();
    const order = getRoundRobinOrder(dealer?.id);
    const flights = [];

    for (let round = 0; round < batch.batch; round += 1) {
      for (const playerId of order) {
        const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;
        if (!player) continue;

        const target = queues[player.seat]?.shift();
        if (!target) continue;

        flights.push({ target, seat: player.seat });
      }
    }

    flights.forEach((flight, index) => {
      playSingleFlight({
        layer,
        deck,
        target: flight.target,
        seat: flight.seat,
        delay: index * CARD_INTERVAL,
        index,
        token,
      });
    });

    lastDealDuration = Math.max(
      900,
      (Math.max(0, flights.length - 1) * CARD_INTERVAL) + FLIGHT_DURATION + CLEANUP_PAD,
    );

    window.setTimeout(() => {
      if (token !== activeDealToken) return;

      for (const seat of ["left", "top", "right", "bottom"]) {
        getSeatNodes(seat).forEach((node) => {
          node.classList.remove("is-v11-deal-pending", "is-v11-deal-arrived");
        });
      }

      elements.table.classList.remove("is-v11-dealing", "is-dealing");
      layer.remove();
    }, safeDelay(lastDealDuration));
  };

  runAfterDealAnimation = function runAfterV11Deal(callback) {
    if (state.autoPlay) {
      callback();
      return;
    }

    scheduleGameTask(callback, safeDelay(lastDealDuration + 120));
  };
})();

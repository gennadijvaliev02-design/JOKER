(() => {
  const PANEL_CLASSES = [
    "is-v12-order-panel",
    "is-v12-trump-panel",
    "is-v12-joker-suit-panel",
    "is-v12-joker-command-panel",
    "is-v12-joker-mode-panel",
  ];

  let installed = false;

  function clearV12PanelClasses() {
    elements?.bidPanel?.classList.remove(...PANEL_CLASSES);
  }

  function markPanel(kind) {
    if (!elements?.bidPanel) return;

    clearV12PanelClasses();
    elements.bidPanel.classList.add(`is-v12-${kind}-panel`);

    const cancel = elements.bidPanel.querySelector("[data-joker-cancel]");
    if (cancel) {
      cancel.hidden = kind === "order" || kind === "trump";
    }
  }

  function installPanelOverrides() {
    const originalTrumpSelection = renderTrumpSelection;
    const originalJokerSuitSelection = renderLeadJokerSuitSelection;
    const originalJokerCommandSelection = renderLeadJokerCommandSelection;
    const originalJokerModeSelection = renderJokerModeSelection;
    const originalRenderBidding = renderBidding;

    renderTrumpSelection = function renderV12TrumpSelection(...args) {
      const result = originalTrumpSelection.apply(this, args);
      markPanel("trump");
      return result;
    };

    renderLeadJokerSuitSelection = function renderV12JokerSuitSelection(...args) {
      const result = originalJokerSuitSelection.apply(this, args);

      elements.bidTitle.textContent = state.pendingJokerCommand === "take" ? "Берёт" : "Высший";
      elements.bidOptions.querySelectorAll(".android-joker-suit-option").forEach((button) => {
        button.querySelector(".android-joker-suit-name")?.remove();
      });

      markPanel("joker-suit");
      return result;
    };

    renderLeadJokerCommandSelection = function renderV12JokerCommandSelection(...args) {
      const result = originalJokerCommandSelection.apply(this, args);
      markPanel("joker-command");
      return result;
    };

    renderJokerModeSelection = function renderV12JokerModeSelection(...args) {
      const result = originalJokerModeSelection.apply(this, args);
      markPanel("joker-mode");
      return result;
    };

    renderBidding = function renderV12Bidding(...args) {
      const result = originalRenderBidding.apply(this, args);

      if (!elements.bidPanel || elements.bidPanel.hidden) {
        clearV12PanelClasses();
        return result;
      }

      if (state.phase === "bidding") {
        markPanel("order");
      } else if (state.phase === "trump-select") {
        markPanel("trump");
      } else if (state.phase === "joker-lead-suit") {
        markPanel("joker-suit");
      } else if (state.phase === "joker-lead-command") {
        markPanel("joker-command");
      } else if (state.phase === "joker-mode") {
        markPanel("joker-mode");
      }

      return result;
    };
  }

  function installDealOverride() {
    const CARD_INTERVAL = 145;
    const FLIGHT_DURATION = 320;
    const REVEAL_PAUSE = 260;
    const LIFT_DURATION = 430;
    const CLEANUP_PAD = 120;

    let gameSignature = "";
    let previousTotal = 0;
    let activeToken = 0;
    let lastDealDuration = 900;
    const landedHumanIds = new Set();
    const coveredHumanIds = new Set();
    const pendingHumanIds = new Set();

    const originalRenderHand = renderHand;

    function safeDelay(value) {
      return typeof getDelay === "function" ? getDelay(value) : value;
    }

    function getSignature() {
      return `${window.JokerRules?.activeId || "aggression"}:${state.currentPulka}:${state.currentGame}`;
    }

    function getHandNodes() {
      return [...(elements?.playerHand?.querySelectorAll(":scope > .card") || [])];
    }

    function getSeatNodes(seat) {
      if (seat === "bottom") return getHandNodes();
      return [...(document.querySelector(`.${seat}-stack`)?.children || [])];
    }

    function clearLegacyCardClasses(node) {
      node.classList.remove(
        "is-deal-pending",
        "is-deal-arrived",
        "is-v11-deal-pending",
        "is-v11-deal-arrived",
        "is-sequential-deal-pending",
        "is-sequential-deal-arrived",
      );
    }

    function applyHumanCardState() {
      getHandNodes().forEach((card) => {
        clearLegacyCardClasses(card);
        const cardId = card.dataset.card;
        card.classList.toggle("is-v12-deal-pending", pendingHumanIds.has(cardId));
        card.classList.toggle("is-v12-facedown", coveredHumanIds.has(cardId));
      });
    }

    renderHand = function renderHandWithV12Backs(...args) {
      const result = originalRenderHand.apply(this, args);
      applyHumanCardState();
      return result;
    };

    function resetDealMemory() {
      previousTotal = 0;
      landedHumanIds.clear();
      coveredHumanIds.clear();
      pendingHumanIds.clear();

      getHandNodes().forEach((node) => {
        clearLegacyCardClasses(node);
        node.classList.remove("is-v12-deal-pending", "is-v12-facedown", "is-v12-hand-lift");
      });
    }

    function clearOldDealArtifacts() {
      document
        .querySelectorAll(
          ".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .v11-deal-layer, .v12-deal-layer, .android-dealer-deck",
        )
        .forEach((node) => node.remove());

      elements?.table?.classList.remove("is-dealing", "is-v11-dealing", "is-v12-dealing");
    }

    function prepareBatch(total) {
      const signature = getSignature();
      if (signature !== gameSignature || total <= previousTotal) {
        gameSignature = signature;
        resetDealMemory();
      }

      const previous = previousTotal;
      const count = Math.max(0, total - previous);
      previousTotal = total;

      const queues = { left: [], top: [], right: [], bottom: [] };

      for (const seat of Object.keys(queues)) {
        const nodes = getSeatNodes(seat);

        if (seat === "bottom") {
          nodes.forEach((node) => {
            clearLegacyCardClasses(node);
            const cardId = node.dataset.card;
            if (!landedHumanIds.has(cardId)) {
              pendingHumanIds.add(cardId);
              node.classList.add("is-v12-deal-pending");
              queues.bottom.push(node);
            } else if (coveredHumanIds.has(cardId)) {
              node.classList.add("is-v12-facedown");
            }
          });
        } else {
          nodes.forEach((node) => clearLegacyCardClasses(node));
          const newNodes = nodes.slice(previous, total);
          newNodes.forEach((node) => {
            node.classList.add("is-v12-deal-pending");
            queues[seat].push(node);
          });
        }
      }

      return { previous, total, count, queues };
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
      const order = typeof getPlayerOrderFrom === "function"
        ? [...getPlayerOrderFrom(dealerId)]
        : state.players.map((player) => player.id);

      if (order.length > 1 && order[0] === dealerId) {
        order.push(order.shift());
      }

      return order;
    }

    function createDealLayer() {
      const layer = document.createElement("div");
      layer.className = "deal-flight-layer v12-deal-layer is-hand-deal";
      layer.setAttribute("aria-hidden", "true");

      const deck = document.createElement("div");
      deck.className = "deal-deck v12-deal-deck";
      deck.setAttribute("aria-hidden", "true");

      layer.append(deck);
      elements.table.append(layer);
      return { layer, deck };
    }

    function createFlyingBack() {
      const card = document.createElement("span");
      card.className = "flying-card-back v12-flying-card";
      card.setAttribute("aria-hidden", "true");
      return card;
    }

    function revealLandedTarget(target, seat) {
      if (!target?.isConnected) return;

      target.classList.remove("is-v12-deal-pending");

      if (seat === "bottom") {
        const cardId = target.dataset.card;
        pendingHumanIds.delete(cardId);
        landedHumanIds.add(cardId);
        coveredHumanIds.add(cardId);
        target.classList.add("is-v12-facedown");
      }
    }

    function playFlight({ layer, deck, target, seat, delay, index, token }) {
      window.setTimeout(() => {
        if (token !== activeToken || !layer.isConnected || !target?.isConnected) return;

        const tableRect = elements.table.getBoundingClientRect();
        const deckRect = deck.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const card = createFlyingBack();
        layer.append(card);

        const cardRect = card.getBoundingClientRect();
        const cardWidth = cardRect.width || 50;
        const cardHeight = cardRect.height || 70;
        const startX = deckRect.left - tableRect.left + deckRect.width / 2 - cardWidth / 2;
        const startY = deckRect.top - tableRect.top + deckRect.height / 2 - cardHeight / 2;
        const endX = targetRect.left - tableRect.left + targetRect.width / 2 - cardWidth / 2;
        const endY = targetRect.top - tableRect.top + targetRect.height / 2 - cardHeight / 2;
        const middleX = startX + (endX - startX) * 0.56;
        const middleY = startY + (endY - startY) * 0.56 - Math.min(34, Math.abs(endY - startY) * 0.08 + 15);
        const finalScale = Math.max(0.5, Math.min(1.35, Math.min(
          targetRect.width / cardWidth,
          targetRect.height / cardHeight,
        )));
        const seatRotation = seat === "left" ? -88 : seat === "right" ? 88 : seat === "top" ? 2 : 0;
        const turn = (index % 3 - 1) * 3;

        if (typeof playSound === "function") playSound("deal");

        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          revealLandedTarget(target, seat);
          card.remove();
        };

        if (typeof card.animate === "function") {
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

          animation.addEventListener?.("finish", finish, { once: true });
          animation.finished?.then(finish).catch(() => {});
        }

        window.setTimeout(finish, safeDelay(FLIGHT_DURATION + 70));
      }, safeDelay(delay));
    }

    function revealHumanHand() {
      const cardsToLift = getHandNodes().filter((card) => coveredHumanIds.has(card.dataset.card));
      coveredHumanIds.clear();

      cardsToLift.forEach((card) => {
        card.classList.remove("is-v12-facedown");
        card.classList.remove("is-v12-hand-lift");
        void card.offsetWidth;
        card.classList.add("is-v12-hand-lift");
        window.setTimeout(() => card.classList.remove("is-v12-hand-lift"), LIFT_DURATION + 40);
      });
    }

    function shouldRevealAfterBatch(total) {
      const handSize = Math.max(1, Number(state.currentHandSize) || total);
      const chooserPreview = typeof isChooseTrumpPulka === "function"
        && isChooseTrumpPulka()
        && total === Math.min(3, handSize);

      return total >= handSize || chooserPreview;
    }

    playCardDealAnimation = function playV12BackThenLiftDeal(handCount) {
      if (state.autoPlay || !elements?.table) return;

      activeToken += 1;
      const token = activeToken;
      clearOldDealArtifacts();

      const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
      const batch = prepareBatch(total);
      if (!batch.count) {
        lastDealDuration = 320;
        return;
      }

      const { layer, deck } = createDealLayer();
      elements.table.classList.add("is-v12-dealing");

      const dealer = getDealer();
      const playerOrder = getRoundRobinOrder(dealer?.id);
      const flights = [];

      for (let round = 0; round < batch.count; round += 1) {
        for (const playerId of playerOrder) {
          const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;
          if (!player) continue;

          const target = batch.queues[player.seat]?.shift();
          if (target) flights.push({ target, seat: player.seat });
        }
      }

      flights.forEach((flight, index) => {
        playFlight({
          layer,
          deck,
          target: flight.target,
          seat: flight.seat,
          delay: index * CARD_INTERVAL,
          index,
          token,
        });
      });

      const flightEnd = Math.max(0, flights.length - 1) * CARD_INTERVAL + FLIGHT_DURATION;
      const revealNow = shouldRevealAfterBatch(total);
      lastDealDuration = flightEnd + (revealNow ? REVEAL_PAUSE + LIFT_DURATION : CLEANUP_PAD);

      if (revealNow) {
        window.setTimeout(() => {
          if (token === activeToken) revealHumanHand();
        }, safeDelay(flightEnd + REVEAL_PAUSE));
      }

      window.setTimeout(() => {
        if (token !== activeToken) return;

        document.querySelectorAll(".is-v12-deal-pending").forEach((node) => {
          node.classList.remove("is-v12-deal-pending");
        });
        pendingHumanIds.clear();
        applyHumanCardState();
        elements.table.classList.remove("is-v12-dealing", "is-dealing", "is-v11-dealing");
        layer.remove();
      }, safeDelay(lastDealDuration));
    };

    runAfterDealAnimation = function runAfterV12Deal(callback) {
      if (state.autoPlay) {
        callback();
        return;
      }

      scheduleGameTask(callback, safeDelay(lastDealDuration + 60));
    };
  }

  function install() {
    if (installed) return;
    installed = true;
    installPanelOverrides();
    installDealOverride();
  }

  window.addEventListener("joker-rules-adapters-ready", install, { once: true });

  if (document.documentElement.dataset.rulesReady === "true") {
    install();
  }
})();

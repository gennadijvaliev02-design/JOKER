(function () {
  if (!window.JokerRules || typeof state === "undefined") {
    console.warn("Joker rules hand-size adapter: rules engine or game state is unavailable.");
    return;
  }

  function getCurrentHandSize() {
    return Math.max(1, Math.min(9, Number(window.JokerRules.getHandSize(state.currentPulka, state.currentGame)) || 9));
  }

  function getCurrentRulePulka() {
    return window.JokerRules.getPulka(state.currentPulka);
  }

  function usesChooserTrump() {
    return getCurrentRulePulka()?.trumpMode === "chooser-rotation";
  }

  function getInitialDealCount(handSize) {
    return Math.min(3, handSize);
  }

  startDeal = function startDealFromRules() {
    playSound("deal");
    state.players.forEach((player) => {
      player.bid = null;
      player.tricks = 0;
      player.jokersPlayed = 0;
    });

    const handSize = getCurrentHandSize();
    const initialDealCount = getInitialDealCount(handSize);
    const deck = shuffle(createJokerDeck());
    const hands = Object.fromEntries(state.players.map((player) => [player.id, []]));

    for (let cardIndex = 0; cardIndex < initialDealCount; cardIndex += 1) {
      for (const player of state.players) {
        hands[player.id].push(deck.pop());
      }
    }

    state.deck = deck;
    state.hands = sortHands(hands);
    state.currentHandSize = handSize;
    markDealAnimation();
    state.currentTrick = [];
    state.playedCards = [];
    state.leadPlayerId = getGameLeaderId();
    state.activePlayerId = null;
    state.trumpChooserId = null;
    state.busy = false;
    state.biddingOrder = getPlayerOrderFrom(state.leadPlayerId);
    state.biddingIndex = 0;
    state.trickNumber = 1;
    hideNotice();

    if (usesChooserTrump()) {
      render();
      runAfterDealAnimation(startTrumpSelection);
      return;
    }

    state.trump = getTrumpForCurrentGame(state.deck);
    playSound("trump");
    completeDealAfterTrump();
  };

  completeDealAfterTrump = function completeDealAfterTrumpFromRules() {
    state.activePlayerId = null;
    state.trumpChooserId = null;

    const handSize = getCurrentHandSize();
    const alreadyDealt = state.hands[state.players[0]?.id]?.length || 0;
    const remainingPerPlayer = Math.max(0, handSize - alreadyDealt);

    for (let cardIndex = 0; cardIndex < remainingPerPlayer; cardIndex += 1) {
      for (const player of state.players) {
        const card = state.deck.pop();
        if (card) {
          state.hands[player.id].push(card);
        }
      }
    }

    state.hands = sortHands(state.hands);
    markDealAnimation();

    render();
    runAfterDealAnimation(startTurnAfterDeal);
  };

  renderBidding = function renderBiddingFromRules() {
    if (state.phase === "joker-lead-command" && state.activePlayerId === "human") {
      renderLeadJokerCommandSelection();
      return;
    }

    if (state.phase === "joker-lead-suit" && state.activePlayerId === "human") {
      renderLeadJokerSuitSelection();
      return;
    }

    if (state.phase === "joker-mode" && state.activePlayerId === "human") {
      renderJokerModeSelection();
      return;
    }

    if (state.phase === "trump-select" && state.trumpChooserId === "human") {
      renderTrumpSelection();
      return;
    }

    elements.bidPanel.hidden = state.phase !== "bidding" || getCurrentBidderId() !== "human";

    if (elements.bidPanel.hidden) {
      if (elements.bidOptions.childElementCount) elements.bidOptions.replaceChildren();
      return;
    }

    setElementText(elements.bidTitle, "Заказ");
    const handSize = getCurrentHandSize();
    const currentBidTotal = getOrderedBidTotal();
    const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;
    const buttons = getCachedBidPanelNodes(`rules-order:${handSize}`, () => {
      const nodes = [];
      for (const bid of BID_OPTIONS) {
        if (bid === "pass" || bid <= handSize) {
          nodes.push(createBidPanelButton("bid", bid, bid === "pass" ? "Пас" : String(bid)));
        }
      }
      return nodes;
    });

    for (const button of buttons) {
      const bidValue = button.dataset.bid === "pass" ? 0 : Number(button.dataset.bid);
      const isForbidden = isLastBidder && currentBidTotal + bidValue === handSize;
      button.disabled = isForbidden;
      button.classList.toggle("is-forbidden", isForbidden);
    }

    syncBidPanelNodes(buttons);
  };

  isBidAllowedForCurrentTurn = function isBidAllowedForCurrentRules(bid) {
    const handSize = getCurrentHandSize();
    const bidValue = bid === "pass" ? 0 : Number(bid);
    const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;

    if (bid !== "pass" && (!Number.isInteger(bidValue) || bidValue < 1 || bidValue > handSize)) {
      return false;
    }

    return !isLastBidder || getOrderedBidTotal() + bidValue !== handSize;
  };

  hasForbiddenBidTotal = function hasForbiddenBidTotalForCurrentRules() {
    return !isFourHundredPulka()
      && state.players.every((player) => player.bid !== null)
      && getOrderedBidTotal() === getCurrentHandSize();
  };

  getBidBalance = function getBidBalanceForCurrentRules() {
    if (!state.players.length || state.players.some((player) => player.bid === null)) {
      return null;
    }

    const totalBid = state.players.reduce((sum, player) => {
      return sum + (player.bid === "pass" ? 0 : player.bid);
    }, 0);
    const balance = totalBid - getCurrentHandSize();

    if (balance > 0) {
      return { type: "take", text: `отнимается ${balance}` };
    }

    if (balance < 0) {
      return { type: "push", text: `пихается ${Math.abs(balance)}` };
    }

    return null;
  };

  const originalEstimateBidFromHand = estimateBidFromHand;
  estimateBidFromHand = function estimateBidFromCurrentHand(playerId) {
    const handSize = getCurrentHandSize();
    const estimatedBid = originalEstimateBidFromHand(playerId);

    if (estimatedBid === "pass") {
      return "pass";
    }

    return Math.min(handSize, estimatedBid);
  };

  const originalChooseBotBid = chooseBotBid;
  chooseBotBid = function chooseBotBidWithinCurrentHand(playerId) {
    const preferredBid = originalChooseBotBid(playerId);

    if (isBidAllowedForCurrentTurn(preferredBid)) {
      return preferredBid;
    }

    const handSize = getCurrentHandSize();
    const preferredNumber = preferredBid === "pass" ? 0 : Number(preferredBid);
    const target = Number.isFinite(preferredNumber) ? preferredNumber : 0;
    const legalOptions = BID_OPTIONS
      .filter((bid) => bid === "pass" || bid <= handSize)
      .filter((bid) => isBidAllowedForCurrentTurn(bid))
      .sort((firstBid, secondBid) => {
        return Math.abs(getBidNumber(firstBid) - target) - Math.abs(getBidNumber(secondBid) - target);
      });

    const safeBid = legalOptions[0];
    if (safeBid === undefined) {
      console.error("No legal bot bid found", {
        playerId,
        preferredBid,
        handSize,
        currentTotal: getOrderedBidTotal(),
      });
      return "pass";
    }

    return safeBid;
  };

  playCardDealAnimation = function playCardDealAnimationFromRules(handCount) {
    if (state.autoPlay || !elements.table) return;

    const layer = createDealLayer("is-hand-deal");
    if (!layer) return;

    const cardsPerPlayer = Math.max(1, Math.min(handCount || getCurrentHandSize(), 9));
    const playersInDealOrder = getPlayerOrderFrom(getGameLeaderId());
    const cards = [];
    let dealStep = 0;

    for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex += 1) {
      for (const playerId of playersInDealOrder) {
        const player = getPlayerById(playerId);
        if (!player) continue;

        const target = getSeatDealTarget(player.seat);
        const targetWithSpread = {
          ...target,
          x: target.x + (cardIndex - (cardsPerPlayer - 1) / 2) * (player.seat === "top" || player.seat === "bottom" ? 9 : 2),
          y: target.y + (cardIndex - (cardsPerPlayer - 1) / 2) * (player.seat === "left" || player.seat === "right" ? 5 : 1),
        };

        cards.push(createFlyingBack(targetWithSpread, dealStep * 115, dealStep));
        dealStep += 1;
      }
    }

    layer.replaceChildren(...cards);
    window.setTimeout(() => layer.remove(), getDelay(5200));
  };

  window.JokerRulesHandSize = Object.freeze({
    getCurrentHandSize,
  });
})();

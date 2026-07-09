(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalShouldLeadHighTrumpJoker = shouldLeadHighTrumpJoker;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPlayerTarget(player) {
    if (!player) {
      return 0;
    }

    if (isFourHundredPulka()) {
      return 3;
    }

    if (player.bid === "pass") {
      return 0;
    }

    return Number(player.bid || 0);
  }

  function getGoal(playerId) {
    const player = getPlayerById(playerId);
    const target = getPlayerTarget(player);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);
    const shouldAvoid = player?.bid === "pass" || tricks >= target;

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: !shouldAvoid && needed > 0,
      shouldAvoid,
      highOrder: target >= 4,
      strongOrder: target >= 5,
    };
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    return (isTrump(card) ? 34 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  function hasStrongHand(playerId) {
    const hand = state.hands[playerId] || [];
    const goal = getGoal(playerId);
    const jokerCount = getJokerCards(hand).length;
    const trumpCards = getStandardCards(hand).filter(isTrump);
    const highTrumpCount = trumpCards.filter((card) => RANK_POWER[card.rank] >= RANK_POWER.Q).length;
    const aceCount = getStandardCards(hand).filter((card) => card.rank === "A").length;

    return goal.highOrder && (jokerCount >= 1 || highTrumpCount >= 2 || aceCount >= 2 || trumpCards.length >= 4);
  }

  function isControlCard(card) {
    if (card.type === "joker") {
      return true;
    }

    if (isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.Q) {
      return true;
    }

    return card.rank === "A" && getUnseenHigherCardCount(card) === 0;
  }

  function chooseControlLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake || !hasStrongHand(playerId)) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const controlStandards = standards.filter(isControlCard);

    if (controlStandards.length) {
      return sortHigh(controlStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (goal.strongOrder && jokers.length && goal.needed >= 2) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  shouldLeadHighTrumpJoker = function mediumStrongShouldLeadHighTrumpJoker(playerId) {
    if (!isMediumAi() || !isBotId(playerId)) {
      return originalShouldLeadHighTrumpJoker(playerId);
    }

    const goal = getGoal(playerId);

    if (goal.strongOrder && goal.needed >= 2 && hasStrongHand(playerId) && getTrumpSuit()) {
      return true;
    }

    return originalShouldLeadHighTrumpJoker(playerId);
  };

  chooseBotCard = function mediumStrongHandChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || state.currentTrick.length !== 0) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    return chooseControlLead(playerId, legalCards, originalCard);
  };
})();

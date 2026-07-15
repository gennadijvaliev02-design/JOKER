(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalShouldLeadHighTrumpJoker = shouldLeadHighTrumpJoker;
  const {
    isMediumAi,
    isBotId,
    getGoal,
    getLegalCards,
    isTrump,
    getStandardCards,
    getJokerCards,
    createCardOrder,
  } = window.JokerMediumContext;
  const { sortHigh } = createCardOrder({ trumpBonus: 34, jokerPower: 100 });

  function hasStrongHand(playerId) {
    const hand = state.hands[playerId] || [];
    const goal = getGoal(playerId);
    const jokerCount = getJokerCards(hand).length;
    const standardCards = getStandardCards(hand);
    const trumpCards = standardCards.filter(isTrump);
    const highTrumpCount = trumpCards.filter((card) => RANK_POWER[card.rank] >= RANK_POWER.Q).length;
    const aceCount = standardCards.filter((card) => card.rank === "A").length;

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

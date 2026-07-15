(() => {
  const originalChooseBotCard = chooseBotCard;
  const {
    isMediumAi,
    isBotId,
    getGoal,
    getLegalCards,
    isTrump,
    getStandardCards,
    createCardOrder,
  } = window.JokerMediumContext;
  const { sortLow, sortHigh } = createCardOrder({ trumpBonus: 34, jokerPower: 100 });

  function chooseSafeLeadAfterFulfilled(legalCards) {
    const standards = getStandardCards(legalCards);
    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return sortLow(legalCards)[0] || null;
  }

  function chooseSafeFollowAfterFulfilled(playerId, legalCards) {
    const standards = getStandardCards(legalCards);
    const losingCards = standards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));

    if (losingCards.length) {
      return sortHigh(losingCards)[0];
    }

    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return sortLow(legalCards)[0] || null;
  }

  chooseBotCard = function mediumOvereatChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const goal = getGoal(playerId);

    if (!goal.fulfilled) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseSafeLeadAfterFulfilled(legalCards) || originalCard;
    }

    return chooseSafeFollowAfterFulfilled(playerId, legalCards) || originalCard;
  };
})();

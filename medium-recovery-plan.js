(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalShouldSpendJokerNow = shouldSpendJokerNow;
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
  const { sortLow, sortHigh } = createCardOrder({ trumpBonus: 36, jokerPower: 100 });

  function isLikelySafeWinner(card) {
    if (card.type !== "standard") {
      return false;
    }

    if (isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.J) {
      return true;
    }

    return card.rank === "A" || getUnseenHigherCardCount(card) === 0;
  }

  function chooseRecoveryLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.recovery) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const winners = standards.filter(isLikelySafeWinner);

    if (winners.length) {
      return sortHigh(winners)[0];
    }

    const trumpCards = standards.filter(isTrump);

    if (trumpCards.length) {
      return sortHigh(trumpCards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (goal.desperate && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  function chooseRecoveryFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.recovery) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  shouldSpendJokerNow = function mediumRecoveryShouldSpendJokerNow(playerId) {
    if (isMediumAi() && isBotId(playerId) && getGoal(playerId).recovery) {
      return true;
    }

    return originalShouldSpendJokerNow(playerId);
  };

  chooseBotCard = function mediumRecoveryChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseRecoveryLead(playerId, legalCards, originalCard);
    }

    return chooseRecoveryFollow(playerId, legalCards, originalCard);
  };
})();

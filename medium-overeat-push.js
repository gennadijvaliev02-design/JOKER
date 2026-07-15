(() => {
  const originalChooseBotCard = chooseBotCard;
  const {
    isMediumAi,
    isBotId,
    getPlayerTarget,
    getGoal,
    getLegalCards,
    isTrump,
    getStandardCards,
    createCardOrder,
  } = window.JokerMediumContext;
  const { sortLow, sortHigh } = createCardOrder({ trumpBonus: 42, jokerPower: 120 });

  function shouldAvoidMoreTricks(player) {
    if (!player || player.bid === null) {
      return false;
    }

    if (isFourHundredPulka()) {
      return (player.tricks || 0) >= 3;
    }

    if (player.bid === "pass") {
      return true;
    }

    return getGoal(player.id).shouldAvoid;
  }

  function isNearDesperate(playerId) {
    const goal = getGoal(playerId);
    return goal.needsTake && goal.needed >= Math.max(1, goal.cardsLeft - 1);
  }

  function findOvereatPushTarget(botId) {
    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || !shouldAvoidMoreTricks(player)) {
        return false;
      }

      return (state.hands[player.id] || []).length > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstPass = first.bid === "pass" ? 350 : 0;
      const secondPass = second.bid === "pass" ? 350 : 0;
      const firstOver = first.tricks - getPlayerTarget(first);
      const secondOver = second.tricks - getPlayerTarget(second);

      return secondHuman - firstHuman || secondPass - firstPass || secondOver - firstOver;
    })[0];
  }

  function getCurrentWinner() {
    return getCurrentWinningPlay()?.player || null;
  }

  function chooseLeaveTargetWinning(botId, legalCards, target) {
    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== target.id || isNearDesperate(botId)) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const losingStandards = standards.filter((card) => !wouldCardWinCurrentTrick(botId, card));

    if (losingStandards.length) {
      return sortHigh(losingStandards)[0];
    }

    return null;
  }

  function chooseSoftLeadToPush(playerId, legalCards, target) {
    if (isNearDesperate(playerId) || !target || target.id !== "human") {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return null;
  }

  chooseBotCard = function mediumOvereatPushChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const target = findOvereatPushTarget(playerId);

    if (!target) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseSoftLeadToPush(playerId, legalCards, target) || originalCard;
    }

    return chooseLeaveTargetWinning(playerId, legalCards, target) || originalCard;
  };
})();

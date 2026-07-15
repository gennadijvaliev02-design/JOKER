(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
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
  const { sortLow, sortHigh } = createCardOrder({ trumpBonus: 48, jokerPower: 130 });

  function getPulkaOffset() {
    return (state.currentPulka - 1) * 5;
  }

  function getPlayerIndex(playerId) {
    return state.players.findIndex((player) => player.id === playerId);
  }

  function isNearDesperate(playerId) {
    const goal = getGoal(playerId);
    return goal.needsTake && goal.needed >= Math.max(1, goal.cardsLeft - 1);
  }

  function getFulfilledGamesInCurrentPulka(playerId) {
    const playerIndex = getPlayerIndex(playerId);

    if (playerIndex < 0 || state.currentGame <= 1) {
      return 0;
    }

    const rows = state.scoreRows.slice(getPulkaOffset(), getPulkaOffset() + state.currentGame - 1);
    return rows.filter((row) => row.entries?.[playerIndex]?.fulfilled).length;
  }

  function hasFailedInCurrentPulka(playerId) {
    const playerIndex = getPlayerIndex(playerId);

    if (playerIndex < 0 || state.currentGame <= 1) {
      return false;
    }

    const rows = state.scoreRows.slice(getPulkaOffset(), getPulkaOffset() + state.currentGame - 1);
    return rows.some((row) => row.entries?.[playerIndex] && !row.entries[playerIndex].fulfilled);
  }

  function findPremiumThreat(botId) {
    if (state.currentGame < 3 || isFourHundredPulka()) {
      return null;
    }

    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || hasFailedInCurrentPulka(player.id)) {
        return false;
      }

      return getFulfilledGamesInCurrentPulka(player.id) >= 2 && (state.hands[player.id] || []).length > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstFulfilled = getFulfilledGamesInCurrentPulka(first.id) * 120;
      const secondFulfilled = getFulfilledGamesInCurrentPulka(second.id) * 120;
      const firstNeeds = getGoal(first.id).needsTake ? 80 : 0;
      const secondNeeds = getGoal(second.id).needsTake ? 80 : 0;

      return secondHuman + secondFulfilled + secondNeeds - (firstHuman + firstFulfilled + firstNeeds);
    })[0];
  }

  function getCurrentWinner() {
    return getCurrentWinningPlay()?.player || null;
  }

  function chooseBlockThreatFollow(botId, legalCards, threat) {
    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== threat.id) {
      return null;
    }

    const threatGoal = getGoal(threat.id);
    const ownIsNearDesperate = isNearDesperate(botId);

    if (threatGoal.shouldAvoid && !ownIsNearDesperate) {
      const standards = getStandardCards(legalCards);
      const losingStandards = standards.filter((card) => !wouldCardWinCurrentTrick(botId, card));
      return losingStandards.length ? sortHigh(losingStandards)[0] : null;
    }

    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(botId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && !ownIsNearDesperate) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function choosePremiumPressureLead(botId, legalCards, threat) {
    if (isNearDesperate(botId)) {
      return null;
    }

    const threatGoal = getGoal(threat.id);
    const standards = getStandardCards(legalCards);

    if (threatGoal.needsTake) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (threatGoal.shouldAvoid && threat.id === "human") {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumPremiumTrapJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const threat = findPremiumThreat(playerId);

      if (threat && getCurrentWinner()?.id === threat.id && getGoal(threat.id).needsTake && !isNearDesperate(playerId)) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumPremiumTrapChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const threat = findPremiumThreat(playerId);

    if (!threat) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return choosePremiumPressureLead(playerId, legalCards, threat) || originalCard;
    }

    return chooseBlockThreatFollow(playerId, legalCards, threat) || originalCard;
  };
})();

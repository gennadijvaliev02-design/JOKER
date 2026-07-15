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
  const { sortLow, sortHigh } = createCardOrder({ trumpBonus: 46, jokerPower: 120 });

  function canRisk(playerId) {
    const goal = getGoal(playerId);
    return goal.player?.bid === "pass" || goal.fulfilled || goal.target <= 1 || goal.cardsLeft <= 4;
  }

  function getTrapPriority(player) {
    const isHuman = player.id === "human" ? 1000 : 0;
    const forcedOne = player.mediumForcedOneBid ? 700 : 0;
    const cardsLeft = state.hands[player.id]?.length || 0;
    const lateBonus = Math.max(0, 9 - cardsLeft) * 30;

    return isHuman + forcedOne + lateBonus;
  }

  function findZeroTrapTarget(botId) {
    if (isFourHundredPulka()) {
      return null;
    }

    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || player.bid !== 1 || player.tricks !== 0) {
        return false;
      }

      return (state.hands[player.id] || []).length > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const priorityDiff = getTrapPriority(second) - getTrapPriority(first);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const firstCards = state.hands[first.id]?.length || 0;
      const secondCards = state.hands[second.id]?.length || 0;
      return firstCards - secondCards;
    })[0];
  }

  function getCurrentWinnerId() {
    return getCurrentWinningPlay()?.player?.id || null;
  }

  function shouldAttackZeroTarget(botId, target) {
    if (!target) {
      return false;
    }

    if (target.id === "human" || target.mediumForcedOneBid) {
      return true;
    }

    const ownGoal = getGoal(botId);
    return canRisk(botId) || ownGoal.cardsLeft <= 5;
  }

  function chooseTrumpDrainLead(botId, legalCards, target) {
    if (!shouldAttackZeroTarget(botId, target)) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const trumps = standards.filter(isTrump);

    if (trumps.length) {
      return sortHigh(trumps)[0];
    }

    const aces = standards.filter((card) => card.rank === "A");

    if (aces.length) {
      return sortHigh(aces)[0];
    }

    return null;
  }

  function chooseBeatTargetFollow(botId, legalCards, target) {
    if (!target || getCurrentWinnerId() !== target.id || !shouldAttackZeroTarget(botId, target)) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(botId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function chooseBeforeTargetPressure(botId, legalCards, target) {
    if (!target || !shouldAttackZeroTarget(botId, target)) {
      return null;
    }

    const targetAlreadyPlayed = state.currentTrick.some((play) => play.player.id === target.id);

    if (targetAlreadyPlayed) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const strongStandards = standards.filter((card) => card.rank === "A" || isTrump(card));

    if (strongStandards.length) {
      return sortHigh(strongStandards)[0];
    }

    return null;
  }

  chooseJokerMode = function mediumZeroTrapJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const target = findZeroTrapTarget(playerId);

      if (target && getCurrentWinnerId() === target.id && shouldAttackZeroTarget(playerId, target)) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumZeroTrapChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const target = findZeroTrapTarget(playerId);

    if (!target) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseTrumpDrainLead(playerId, legalCards, target) || originalCard;
    }

    return chooseBeatTargetFollow(playerId, legalCards, target) || chooseBeforeTargetPressure(playerId, legalCards, target) || originalCard;
  };
})();

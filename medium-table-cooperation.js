(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  let isCooperationChecking = false;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPlayerTarget(player) {
    if (!player || isFourHundredPulka()) {
      return isFourHundredPulka() ? 3 : 0;
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

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      desperate: player?.bid !== "pass" && tricks < target && target - tricks >= Math.max(1, cardsLeft - 1),
      forcedOneZero: Boolean(player?.mediumForcedOneBid && tricks === 0),
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
      return 150;
    }

    return (isTrump(card) ? 52 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
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

  function getCurrentWinner() {
    try {
      return getCurrentWinningPlay()?.player || null;
    } catch (error) {
      console.warn("medium table cooperation winner check skipped", error);
      return null;
    }
  }

  function safelyWouldWin(playerId, card) {
    if (!card || isCooperationChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isCooperationChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium table cooperation win check skipped", error);
      return false;
    } finally {
      isCooperationChecking = false;
    }
  }

  function getAttackPriority(playerId) {
    const goal = getGoal(playerId);
    const player = goal.player;

    if (!player) {
      return 0;
    }

    let score = 0;
    if (player.id === "human") score += 1000;
    if (goal.forcedOneZero) score += 800;
    if (goal.needsTake) score += 320;
    if (goal.shouldAvoid) score += 260;
    if (goal.target >= 4) score += 220;
    if (player.bid === "pass") score += 180;
    if ((state.hands[playerId] || []).length <= 3) score += 150;

    return score;
  }

  function getTableTarget(botId) {
    const candidates = state.players.filter((player) => player && player.id !== botId && (state.hands[player.id] || []).length > 0);

    if (!candidates.length) {
      return null;
    }

    const sorted = candidates.sort((first, second) => getAttackPriority(second.id) - getAttackPriority(first.id));
    return getAttackPriority(sorted[0].id) > 0 ? sorted[0] : null;
  }

  function chooseCooperativeFollow(botId, legalCards, target) {
    const currentWinner = getCurrentWinner();
    const ownGoal = getGoal(botId);
    const targetGoal = getGoal(target.id);

    if (!currentWinner || ownGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (currentWinner.id === target.id && targetGoal.needsTake) {
      const winners = standards.filter((card) => safelyWouldWin(botId, card));

      if (winners.length) {
        return sortLow(winners)[0];
      }

      const jokers = getJokerCards(legalCards);

      if (jokers.length && (target.id === "human" || targetGoal.forcedOneZero)) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }
    }

    if (currentWinner.id === target.id && targetGoal.shouldAvoid) {
      const losing = standards.filter((card) => !safelyWouldWin(botId, card));

      if (losing.length) {
        return sortHigh(losing)[0];
      }
    }

    if (isBotId(currentWinner.id) && currentWinner.id !== botId && !ownGoal.needsTake) {
      const losing = standards.filter((card) => !safelyWouldWin(botId, card));

      if (losing.length) {
        return sortHigh(losing)[0];
      }
    }

    return null;
  }

  function chooseCooperativeLead(botId, legalCards, target) {
    const ownGoal = getGoal(botId);
    const targetGoal = getGoal(target.id);

    if (ownGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (targetGoal.needsTake) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (targetGoal.shouldAvoid && target.id === "human") {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumTableCooperationJokerMode(playerId, card) {
    if (isCooperationChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const target = getTableTarget(playerId);

      if (target && getCurrentWinner()?.id === target.id && getGoal(target.id).needsTake && !getGoal(playerId).desperate) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumTableCooperationChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || isCooperationChecking) {
      return originalCard;
    }

    try {
      const target = getTableTarget(playerId);

      if (!target) {
        return originalCard;
      }

      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseCooperativeLead(playerId, legalCards, target) || originalCard;
      }

      return chooseCooperativeFollow(playerId, legalCards, target) || originalCard;
    } catch (error) {
      console.warn("medium table cooperation fallback", error);
      return originalCard;
    }
  };
})();

(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  let isHumanPressureChecking = false;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getTarget(player) {
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
    const target = getTarget(player);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      desperate: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft - 1),
    };
  }

  function getHumanThreat() {
    const human = getPlayerById("human");

    if (!human || (state.hands.human || []).length === 0) {
      return 0;
    }

    const goal = getGoal("human");
    let score = 0;

    if (goal.target >= 4) score += 3;
    if (human.mediumForcedOneBid && human.tricks === 0) score += 4;
    if (goal.needsTake) score += 2;
    if (goal.shouldAvoid) score += 2;
    if (goal.cardsLeft <= 4) score += 2;

    if (typeof window.JokerMediumHumanProfile?.threatLevel === "function") {
      score += window.JokerMediumHumanProfile.threatLevel();
    }

    return score;
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
      return 180;
    }

    return (isTrump(card) ? 56 : 0) + (RANK_POWER[card.rank] || 0);
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
      console.warn("medium human pressure winner check skipped", error);
      return null;
    }
  }

  function safelyWouldWin(playerId, card) {
    if (!card || isHumanPressureChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isHumanPressureChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium human pressure win check skipped", error);
      return false;
    } finally {
      isHumanPressureChecking = false;
    }
  }

  function chooseAgainstHumanLead(botId, legalCards, originalCard) {
    const botGoal = getGoal(botId);
    const humanGoal = getGoal("human");

    if (botGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (humanGoal.needsTake) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (humanGoal.shouldAvoid) {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }

      if (standards.length) {
        return sortLow(standards)[0];
      }
    }

    return null;
  }

  function chooseAgainstHumanFollow(botId, legalCards, originalCard) {
    const currentWinner = getCurrentWinner();
    const botGoal = getGoal(botId);
    const humanGoal = getGoal("human");

    if (!currentWinner || botGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (currentWinner.id === "human" && humanGoal.needsTake) {
      const winners = standards.filter((card) => safelyWouldWin(botId, card));

      if (winners.length) {
        return sortLow(winners)[0];
      }

      const jokers = getJokerCards(legalCards);

      if (jokers.length && getHumanThreat() >= 5) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }
    }

    if (currentWinner.id === "human" && humanGoal.shouldAvoid) {
      const losing = standards.filter((card) => !safelyWouldWin(botId, card));

      if (losing.length) {
        return sortHigh(losing)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumHumanPressureJokerMode(playerId, card) {
    if (isHumanPressureChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const humanGoal = getGoal("human");

      if (getHumanThreat() >= 5 && getCurrentWinner()?.id === "human" && humanGoal.needsTake && !getGoal(playerId).desperate) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumHumanPressureChooseCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || isHumanPressureChecking || getHumanThreat() < 3) {
      return originalCard;
    }

    try {
      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseAgainstHumanLead(playerId, legalCards, originalCard) || originalCard;
      }

      return chooseAgainstHumanFollow(playerId, legalCards, originalCard) || originalCard;
    } catch (error) {
      console.warn("medium human pressure fallback", error);
      return originalCard;
    }
  };
})();

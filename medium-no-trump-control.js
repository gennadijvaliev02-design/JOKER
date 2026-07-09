(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;
  let isNoTrumpChecking = false;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function isNoTrumpGame() {
    return !isFourHundredPulka() && getTrumpSuit() === null;
  }

  function getPlayerTarget(player) {
    if (!player) {
      return 0;
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

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      urgent: player?.bid !== "pass" && tricks < target && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
      desperate: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft),
    };
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 130;
    }

    return RANK_POWER[card.rank] || 0;
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

  function safelyWouldWin(playerId, card) {
    if (!card || isNoTrumpChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isNoTrumpChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium no-trump win check skipped", error);
      return false;
    } finally {
      isNoTrumpChecking = false;
    }
  }

  function chooseNoTrumpLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);
    const standards = getStandardCards(legalCards);
    const jokers = getJokerCards(legalCards);

    if (goal.shouldAvoid) {
      return sortLow(standards)[0] || sortLow(legalCards)[0] || originalCard;
    }

    if (!goal.needsTake) {
      return originalCard;
    }

    const safeWinners = standards.filter((card) => card.rank === "A" || getUnseenHigherCardCount(card) === 0);

    if (safeWinners.length) {
      return sortHigh(safeWinners)[0];
    }

    if ((goal.urgent || goal.desperate) && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  function chooseNoTrumpFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);
    const standards = getStandardCards(legalCards);

    if (goal.shouldAvoid) {
      const losing = standards.filter((card) => !safelyWouldWin(playerId, card));

      if (losing.length) {
        return sortHigh(losing)[0];
      }

      return sortLow(standards)[0] || originalCard;
    }

    if (!goal.needsTake) {
      return originalCard;
    }

    const winners = standards.filter((card) => safelyWouldWin(playerId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    const jokers = getJokerCards(legalCards);

    if ((goal.urgent || goal.desperate) && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  chooseLeadJokerAction = function mediumNoTrumpLeadJokerAction(playerId) {
    if (isMediumAi() && isBotId(playerId) && isNoTrumpGame()) {
      const goal = getGoal(playerId);

      if (goal.needsTake) {
        return {
          jokerCommand: goal.urgent || goal.desperate ? "high" : "take",
          jokerSuit: "hearts",
        };
      }
    }

    return originalChooseLeadJokerAction(playerId);
  };

  chooseJokerMode = function mediumNoTrumpJokerMode(playerId, card) {
    if (isNoTrumpChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && isNoTrumpGame() && card?.type === "joker" && state.currentTrick.length > 0) {
      const goal = getGoal(playerId);

      if (goal.needsTake && (goal.urgent || goal.desperate)) {
        return "beat";
      }

      if (goal.shouldAvoid) {
        return "duck";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumNoTrumpChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !isNoTrumpGame() || !originalCard || state.phase !== "playing" || isNoTrumpChecking) {
      return originalCard;
    }

    try {
      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseNoTrumpLead(playerId, legalCards, originalCard) || originalCard;
      }

      return chooseNoTrumpFollow(playerId, legalCards, originalCard) || originalCard;
    } catch (error) {
      console.warn("medium no-trump fallback", error);
      return originalCard;
    }
  };
})();

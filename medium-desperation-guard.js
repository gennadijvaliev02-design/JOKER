(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;
  let isDesperationChecking = false;

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
      mustFightNow: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft - 1),
      deadIfMisses: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft),
      zeroDanger: player?.bid !== "pass" && tricks === 0 && cardsLeft <= Math.max(3, target),
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

  function safelyWouldWin(playerId, card) {
    if (!card || isDesperationChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isDesperationChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium desperation win check skipped", error);
      return false;
    } finally {
      isDesperationChecking = false;
    }
  }

  function chooseDesperateLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.mustFightNow && !goal.zeroDanger) {
      return null;
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && (goal.deadIfMisses || goal.zeroDanger)) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const standards = getStandardCards(legalCards);
    const sureWinners = standards.filter((card) => card.rank === "A" || isTrump(card) || getUnseenHigherCardCount(card) === 0);

    if (sureWinners.length) {
      return sortHigh(sureWinners)[0];
    }

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  function chooseDesperateFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.mustFightNow && !goal.zeroDanger) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const winners = standards.filter((card) => safelyWouldWin(playerId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  chooseLeadJokerAction = function mediumDesperationLeadJokerAction(playerId) {
    if (isMediumAi() && isBotId(playerId)) {
      const goal = getGoal(playerId);

      if (goal.mustFightNow || goal.zeroDanger) {
        return {
          jokerCommand: "high",
          jokerSuit: getTrumpSuit() || "hearts",
        };
      }
    }

    return originalChooseLeadJokerAction(playerId);
  };

  chooseJokerMode = function mediumDesperationJokerMode(playerId, card) {
    if (isDesperationChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && card?.type === "joker") {
      const goal = getGoal(playerId);

      if (goal.mustFightNow || goal.zeroDanger) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumDesperationGuardChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || isDesperationChecking) {
      return originalCard;
    }

    try {
      const goal = getGoal(playerId);

      if (!goal.needsTake || (!goal.mustFightNow && !goal.zeroDanger)) {
        return originalCard;
      }

      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseDesperateLead(playerId, legalCards, originalCard) || originalCard;
      }

      return chooseDesperateFollow(playerId, legalCards, originalCard) || originalCard;
    } catch (error) {
      console.warn("medium desperation fallback", error);
      return originalCard;
    }
  };
})();

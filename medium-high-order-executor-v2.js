(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;
  let isHighOrderChecking = false;

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
      highOrder: target >= 4,
      hugeOrder: target >= 5,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      behind: player?.bid !== "pass" && tricks < Math.max(1, Math.floor(target / 2)) && cardsLeft <= 5,
      mustTakeRun: player?.bid !== "pass" && needed >= Math.max(1, cardsLeft - 1),
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
      return 190;
    }

    return (isTrump(card) ? 58 : 0) + (RANK_POWER[card.rank] || 0);
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

  function getSuitCount(playerId, suitId) {
    return (state.hands[playerId] || []).filter((card) => card.type === "standard" && card.suit === suitId).length;
  }

  function chooseBestJokerSuit(playerId) {
    const trumpSuit = getTrumpSuit();

    if (trumpSuit && getSuitCount(playerId, trumpSuit) > 0) {
      return trumpSuit;
    }

    const best = SUITS.map((suit) => ({
      suit: suit.id,
      count: getSuitCount(playerId, suit.id),
    })).sort((first, second) => second.count - first.count)[0];

    return best?.suit || trumpSuit || "hearts";
  }

  function safelyWouldWin(playerId, card) {
    if (!card || isHighOrderChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isHighOrderChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium high order win check skipped", error);
      return false;
    } finally {
      isHighOrderChecking = false;
    }
  }

  function chooseHighOrderLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake || (!goal.highOrder && !goal.mustTakeRun && !goal.behind)) {
      return null;
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && (goal.hugeOrder || goal.mustTakeRun || goal.behind)) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const standards = getStandardCards(legalCards);
    const strongCards = standards.filter((card) => {
      if (isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.J) return true;
      if (card.rank === "A") return true;
      if (getUnseenHigherCardCount(card) === 0 && RANK_POWER[card.rank] >= RANK_POWER.K) return true;
      return false;
    });

    if (strongCards.length) {
      return sortHigh(strongCards)[0];
    }

    if (jokers.length && goal.mustTakeRun) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  function chooseHighOrderFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake || (!goal.highOrder && !goal.mustTakeRun && !goal.behind)) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const winners = standards.filter((card) => safelyWouldWin(playerId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && (goal.hugeOrder || goal.mustTakeRun || goal.behind)) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  chooseLeadJokerAction = function mediumHighOrderLeadJokerAction(playerId) {
    if (isMediumAi() && isBotId(playerId)) {
      const goal = getGoal(playerId);

      if (goal.needsTake && (goal.highOrder || goal.mustTakeRun || goal.behind)) {
        return {
          jokerCommand: "high",
          jokerSuit: chooseBestJokerSuit(playerId),
        };
      }
    }

    return originalChooseLeadJokerAction(playerId);
  };

  chooseJokerMode = function mediumHighOrderJokerMode(playerId, card) {
    if (isHighOrderChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && card?.type === "joker") {
      const goal = getGoal(playerId);

      if (goal.needsTake && (goal.highOrder || goal.mustTakeRun || goal.behind)) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumHighOrderExecutorChooseCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || isHighOrderChecking) {
      return originalCard;
    }

    try {
      const goal = getGoal(playerId);

      if (!goal.needsTake || (!goal.highOrder && !goal.mustTakeRun && !goal.behind)) {
        return originalCard;
      }

      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseHighOrderLead(playerId, legalCards, originalCard) || originalCard;
      }

      return chooseHighOrderFollow(playerId, legalCards, originalCard) || originalCard;
    } catch (error) {
      console.warn("medium high order executor fallback", error);
      return originalCard;
    }
  };
})();

(() => {
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

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
    const needed = Math.max(0, target - tricks);

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      highOrder: target >= 4,
      desperate: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft - 1),
      brokenOver: player?.bid === "pass" ? tricks > 0 : target > 0 && tricks > target,
    };
  }

  function getSuitCards(playerId, suitId) {
    return (state.hands[playerId] || []).filter((card) => card.type === "standard" && card.suit === suitId);
  }

  function getSuitCommandScore(playerId, suitId) {
    const cards = getSuitCards(playerId, suitId);
    const trumpSuit = getTrumpSuit();
    const highScore = cards.reduce((score, card) => {
      if (card.rank === "A") return score + 42;
      if (card.rank === "K") return score + 30;
      if (card.rank === "Q") return score + 20;
      if (card.rank === "J") return score + 12;
      if (card.rank === "10") return score + 8;
      return score + 2;
    }, 0);
    const lengthScore = cards.length * 26;
    const trumpBonus = trumpSuit && suitId === trumpSuit ? 45 : 0;
    const queenPlan = cards.some((card) => card.rank === "Q") && cards.length >= 2 ? 18 : 0;

    return highScore + lengthScore + trumpBonus + queenPlan;
  }

  function chooseBestCommandSuit(playerId) {
    const trumpSuit = getTrumpSuit();
    const goal = getGoal(playerId);

    if ((goal.needsTake || goal.brokenOver || goal.highOrder) && trumpSuit && getSuitCards(playerId, trumpSuit).length) {
      return trumpSuit;
    }

    const candidates = SUITS.map((suit) => ({
      suit: suit.id,
      score: getSuitCommandScore(playerId, suit.id),
    })).filter((entry) => entry.score > 0);

    if (!candidates.length) {
      return trumpSuit || "hearts";
    }

    return candidates.sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return FIXED_TRUMP_BY_GAME.indexOf(first.suit) - FIXED_TRUMP_BY_GAME.indexOf(second.suit);
    })[0].suit;
  }

  chooseLeadJokerAction = function mediumJokerCommandPlan(playerId) {
    if (!isMediumAi() || !isBotId(playerId)) {
      return originalChooseLeadJokerAction(playerId);
    }

    const goal = getGoal(playerId);

    if (goal.shouldAvoid && !goal.brokenOver) {
      return originalChooseLeadJokerAction(playerId);
    }

    const suit = chooseBestCommandSuit(playerId);
    const shouldClearHigh = goal.needsTake || goal.highOrder || goal.brokenOver || goal.desperate;

    return {
      jokerCommand: shouldClearHigh ? "high" : "take",
      jokerSuit: suit,
    };
  };
})();

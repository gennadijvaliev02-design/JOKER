(() => {
  const originalChooseBotCard = chooseBotCard;

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
      urgent: player?.bid !== "pass" && tricks < target && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
      desperate: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft),
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

  function isExpensiveCard(card) {
    if (card?.type === "joker") {
      return true;
    }

    return isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.Q;
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 160;
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

  function chooseCheaperLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!isExpensiveCard(originalCard) || goal.urgent || goal.desperate || goal.shouldAvoid) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const safeNonTrumps = standards.filter((card) => !isTrump(card) && (card.rank === "A" || getUnseenHigherCardCount(card) === 0));

    if (safeNonTrumps.length) {
      return sortHigh(safeNonTrumps)[0];
    }

    const lowTrumps = standards.filter((card) => isTrump(card) && RANK_POWER[card.rank] < RANK_POWER.Q);

    if (lowTrumps.length && goal.needsTake) {
      return sortHigh(lowTrumps)[0];
    }

    return null;
  }

  function chooseAvoidExpensiveOvereat(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.shouldAvoid || !isExpensiveCard(originalCard)) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    const lowTrumps = standards.filter((card) => isTrump(card) && RANK_POWER[card.rank] < RANK_POWER.Q);

    if (lowTrumps.length) {
      return sortLow(lowTrumps)[0];
    }

    return null;
  }

  chooseBotCard = function mediumTrumpEconomyChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || !getTrumpSuit() || isFourHundredPulka()) {
      return originalCard;
    }

    try {
      const legalCards = getLegalCards(playerId);

      if (!legalCards.length || state.currentTrick.length !== 0) {
        return originalCard;
      }

      return chooseAvoidExpensiveOvereat(playerId, legalCards, originalCard) || chooseCheaperLead(playerId, legalCards, originalCard) || originalCard;
    } catch (error) {
      console.warn("medium trump economy fallback", error);
      return originalCard;
    }
  };
})();

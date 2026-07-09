(() => {
  const originalChooseBotCard = chooseBotCard;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPlayerTarget(player) {
    if (!player) {
      return 0;
    }

    if (isFourHundredPulka()) {
      return 3;
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

    return {
      player,
      target,
      tricks,
      fulfilled: player?.bid === "pass" || tricks >= target,
      over: tricks > target,
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
      return 100;
    }

    const trumpBonus = isTrump(card) ? 34 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
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

  function chooseSafeLeadAfterFulfilled(legalCards) {
    const standards = getStandardCards(legalCards);
    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return sortLow(legalCards)[0] || null;
  }

  function chooseSafeFollowAfterFulfilled(playerId, legalCards) {
    const standards = getStandardCards(legalCards);
    const losingCards = standards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));

    if (losingCards.length) {
      return sortHigh(losingCards)[0];
    }

    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return sortLow(legalCards)[0] || null;
  }

  chooseBotCard = function mediumOvereatChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const goal = getGoal(playerId);

    if (!goal.fulfilled) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseSafeLeadAfterFulfilled(legalCards) || originalCard;
    }

    return chooseSafeFollowAfterFulfilled(playerId, legalCards) || originalCard;
  };
})();

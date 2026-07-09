(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalShouldSpendJokerNow = shouldSpendJokerNow;

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
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);
    const shouldAvoid = player?.bid === "pass" || tricks >= target;

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      shouldAvoid,
      recovery: !shouldAvoid && needed > 0 && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
      desperate: !shouldAvoid && needed >= Math.max(1, cardsLeft),
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

    return (isTrump(card) ? 36 : 0) + (RANK_POWER[card.rank] || 0);
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

  function isLikelySafeWinner(card) {
    if (card.type !== "standard") {
      return false;
    }

    if (isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.J) {
      return true;
    }

    return card.rank === "A" || getUnseenHigherCardCount(card) === 0;
  }

  function chooseRecoveryLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.recovery) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const winners = standards.filter(isLikelySafeWinner);

    if (winners.length) {
      return sortHigh(winners)[0];
    }

    const trumpCards = standards.filter(isTrump);

    if (trumpCards.length) {
      return sortHigh(trumpCards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (goal.desperate && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  function chooseRecoveryFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.recovery) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  shouldSpendJokerNow = function mediumRecoveryShouldSpendJokerNow(playerId) {
    if (isMediumAi() && isBotId(playerId) && getGoal(playerId).recovery) {
      return true;
    }

    return originalShouldSpendJokerNow(playerId);
  };

  chooseBotCard = function mediumRecoveryChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseRecoveryLead(playerId, legalCards, originalCard);
    }

    return chooseRecoveryFollow(playerId, legalCards, originalCard);
  };
})();

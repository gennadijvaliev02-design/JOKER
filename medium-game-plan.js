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
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);
    const shouldAvoid = player?.bid === "pass" || tricks >= target;

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: !shouldAvoid && needed > 0,
      shouldAvoid,
      desperate: !shouldAvoid && needed >= Math.max(1, cardsLeft),
      urgent: !shouldAvoid && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
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

  function getCardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    return (isTrump(card) ? 34 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => getCardPower(first) - getCardPower(second));
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => getCardPower(second) - getCardPower(first));
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  function getSureLeadScore(card) {
    if (card.type !== "standard") {
      return 0;
    }

    const unseenHigher = getUnseenHigherCardCount(card);
    const sureBonus = unseenHigher === 0 ? 34 : unseenHigher === 1 ? 14 : 0;
    const trumpBonus = isTrump(card) ? 20 : 0;
    const aceBonus = card.rank === "A" ? 12 : 0;

    return getCardPower(card) + sureBonus + trumpBonus + aceBonus;
  }

  function choosePlannedLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const jokers = getJokerCards(legalCards);

    if (goal.desperate && jokers.length) {
      const strongStandard = standards.find((card) => card.rank === "A" || isTrump(card));

      if (!strongStandard) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }
    }

    if (!standards.length) {
      return originalCard;
    }

    const scored = standards
      .map((card) => ({ card, score: getSureLeadScore(card) }))
      .sort((first, second) => second.score - first.score);
    const best = scored[0];
    const originalScore = originalCard?.type === "standard" ? getSureLeadScore(originalCard) : 0;
    const threshold = goal.urgent ? 4 : 12;

    return best && best.score > originalScore + threshold ? best.card : originalCard;
  }

  function choosePlannedFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const jokers = getJokerCards(legalCards);
    const winners = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    if ((goal.desperate || goal.urgent) && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  chooseBotCard = function mediumGamePlanChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return choosePlannedLead(playerId, legalCards, originalCard);
    }

    return choosePlannedFollow(playerId, legalCards, originalCard);
  };
})();

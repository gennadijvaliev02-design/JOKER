(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;
  const {
    isMediumAi,
    isBotId,
    getGoal,
    getLegalCards,
    isTrump,
    getStandardCards,
    getJokerCards,
    createCardOrder,
  } = window.JokerMediumContext;
  const { sortHigh, sortLow } = createCardOrder({ trumpBonus: 46, jokerPower: 120 });

  function isBrokenByOvereating(playerId) {
    const goal = getGoal(playerId);

    if (!goal.player || goal.player.bid === null) {
      return false;
    }

    if (goal.player.bid === "pass") {
      return goal.tricks > 0;
    }

    return goal.target > 0 && goal.over;
  }

  function chooseLongSuit(playerId) {
    const hand = state.hands[playerId] || [];
    const trumpSuit = getTrumpSuit();
    const entries = SUITS.map((suit) => {
      const cards = hand.filter((card) => card.type === "standard" && card.suit === suit.id);
      const highPower = cards.reduce((sum, card) => sum + (RANK_POWER[card.rank] || 0), 0);
      const trumpBonus = trumpSuit && suit.id === trumpSuit ? 80 : 0;

      return {
        suit: suit.id,
        cards,
        score: cards.length * 26 + highPower + trumpBonus,
      };
    }).filter((entry) => entry.cards.length > 0);

    if (!entries.length) {
      return trumpSuit || "hearts";
    }

    return entries.sort((first, second) => second.score - first.score)[0].suit;
  }

  function chooseSabotageLead(playerId, legalCards, originalCard) {
    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const standards = getStandardCards(legalCards);
    const trumps = standards.filter(isTrump);

    if (trumps.length) {
      return sortHigh(trumps)[0];
    }

    const aces = standards.filter((card) => card.rank === "A");

    if (aces.length) {
      return sortHigh(aces)[0];
    }

    if (standards.length) {
      return sortHigh(standards)[0];
    }

    return originalCard;
  }

  function chooseSabotageFollow(playerId, legalCards, originalCard) {
    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const highStandards = standards.filter((card) => card.rank === "A" || isTrump(card));

    if (highStandards.length && state.currentTrick.length < state.players.length - 1) {
      return sortHigh(highStandards)[0];
    }

    return originalCard;
  }

  chooseLeadJokerAction = function mediumSabotageLeadJokerAction(playerId) {
    if (isMediumAi() && isBotId(playerId) && isBrokenByOvereating(playerId)) {
      const trumpSuit = getTrumpSuit();
      const hasTrump = trumpSuit && (state.hands[playerId] || []).some((card) => card.type === "standard" && card.suit === trumpSuit);

      return {
        jokerCommand: "high",
        jokerSuit: hasTrump ? trumpSuit : chooseLongSuit(playerId),
      };
    }

    return originalChooseLeadJokerAction(playerId);
  };

  chooseJokerMode = function mediumSabotageJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0 && isBrokenByOvereating(playerId)) {
      return "beat";
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumSabotageChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || !isBrokenByOvereating(playerId)) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseSabotageLead(playerId, legalCards, originalCard);
    }

    return chooseSabotageFollow(playerId, legalCards, originalCard);
  };
})();

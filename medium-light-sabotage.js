(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

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

  function isBrokenByOvereating(playerId) {
    const player = getPlayerById(playerId);

    if (!player) {
      return false;
    }

    const target = getPlayerTarget(player);
    const tricks = player.tricks || 0;

    if (player.bid === "pass") {
      return tricks > 0;
    }

    return target > 0 && tricks > target;
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

    return (isTrump(card) ? 38 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  function chooseLongSuit(playerId) {
    const hand = state.hands[playerId] || [];
    const trumpSuit = getTrumpSuit();
    const entries = SUITS.map((suit) => {
      const cards = hand.filter((card) => card.type === "standard" && card.suit === suit.id);
      const highPower = cards.reduce((sum, card) => sum + (RANK_POWER[card.rank] || 0), 0);
      const trumpBonus = trumpSuit && suit.id === trumpSuit ? 50 : 0;

      return {
        suit: suit.id,
        cards,
        score: cards.length * 20 + highPower + trumpBonus,
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

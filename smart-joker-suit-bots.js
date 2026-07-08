(() => {
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function standardHand(playerId) {
    return (state.hands[playerId] || []).filter((card) => card.type === "standard");
  }

  function suitCards(playerId, suitId) {
    return standardHand(playerId).filter((card) => card.suit === suitId);
  }

  function suitPower(cards) {
    return cards.reduce((sum, card) => sum + (RANK_POWER[card.rank] || 0), 0);
  }

  function playedSuitCount(suitId) {
    return (state.playedCards || []).filter((play) => play.card?.type === "standard" && play.card.suit === suitId).length;
  }

  function suitScore(playerId, suitId, wantsTrick) {
    const trumpSuit = getTrumpSuit();
    const cards = suitCards(playerId, suitId);
    const count = cards.length;
    const isTrump = trumpSuit && suitId === trumpSuit;

    if (!count) {
      return wantsTrick ? -70 : -16;
    }

    let score = count * 10 + suitPower(cards) * 1.1;

    if (isTrump) {
      score += wantsTrick ? 60 : 18;
    }

    if (wantsTrick && trumpSuit && suitId !== trumpSuit) {
      score -= 12 + Math.max(0, playedSuitCount(suitId) - 4) * 2;
    }

    if (count === 1 && !isTrump) {
      score -= wantsTrick ? 8 : 2;
    }

    return score;
  }

  function bestSuitForBotJoker(playerId, wantsTrick) {
    const trumpSuit = getTrumpSuit();
    const ownedSuits = [...new Set(standardHand(playerId).map((card) => card.suit))];

    if (wantsTrick && trumpSuit && suitCards(playerId, trumpSuit).length) {
      return trumpSuit;
    }

    const candidates = ownedSuits.length ? ownedSuits : FIXED_TRUMP_BY_GAME;
    const ranked = [...candidates].sort((a, b) => suitScore(playerId, b, wantsTrick) - suitScore(playerId, a, wantsTrick));
    return ranked[0] || trumpSuit || "hearts";
  }

  chooseLeadJokerAction = function smartBotJokerSuit(playerId) {
    const action = originalChooseLeadJokerAction(playerId);

    if (!isBotId(playerId)) {
      return action;
    }

    const wantsTrick = shouldPlayerTakeTrick(playerId) || shouldSpendJokerNow(playerId);
    const trumpSuit = getTrumpSuit();
    const chosenSuit = bestSuitForBotJoker(playerId, wantsTrick);

    return {
      ...action,
      jokerCommand: wantsTrick || action.jokerCommand === "high" ? "high" : action.jokerCommand,
      jokerSuit: wantsTrick && trumpSuit && suitCards(playerId, trumpSuit).length ? trumpSuit : chosenSuit,
    };
  };
})();

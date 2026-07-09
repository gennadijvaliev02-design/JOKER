(() => {
  const originalChooseBotTrump = chooseBotTrump;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getSuitCards(hand, suitId) {
    return hand.filter((card) => card.type === "standard" && card.suit === suitId);
  }

  function getJokerCount(hand) {
    return hand.filter((card) => card.type === "joker").length;
  }

  function getHighCardScore(cards) {
    return cards.reduce((score, card) => {
      if (card.rank === "A") return score + 38;
      if (card.rank === "K") return score + 26;
      if (card.rank === "Q") return score + 16;
      if (card.rank === "J") return score + 9;
      if (card.rank === "10") return score + 6;
      return score + 1;
    }, 0);
  }

  function getSuitPlanScore(playerId, suitId) {
    const hand = state.hands[playerId] || [];
    const suitCards = getSuitCards(hand, suitId);
    const jokerCount = getJokerCount(hand);
    const highScore = getHighCardScore(suitCards);
    const lengthScore = suitCards.length * 32;
    const aceControl = suitCards.some((card) => card.rank === "A") ? 22 : 0;
    const kingQueenCombo = suitCards.some((card) => card.rank === "K") && suitCards.some((card) => card.rank === "Q") ? 18 : 0;
    const jokerControl = jokerCount * (suitCards.length >= 2 ? 24 : 12);
    const shortDanger = suitCards.length <= 1 ? -18 : 0;

    return lengthScore + highScore + aceControl + kingQueenCombo + jokerControl + shortDanger;
  }

  function shouldChooseNoTrump(playerId) {
    const hand = state.hands[playerId] || [];
    const jokerCount = getJokerCount(hand);
    const aces = hand.filter((card) => card.type === "standard" && card.rank === "A").length;
    const longestSuit = Math.max(...SUITS.map((suit) => getSuitCards(hand, suit.id).length));

    return jokerCount >= 2 && aces >= 1 && longestSuit <= 2;
  }

  chooseBotTrump = function mediumTrumpPlannerChooseBotTrump(playerId) {
    if (!isMediumAi() || !isBotId(playerId)) {
      return originalChooseBotTrump(playerId);
    }

    const hand = state.hands[playerId] || [];

    if (!hand.length) {
      return originalChooseBotTrump(playerId);
    }

    if (shouldChooseNoTrump(playerId)) {
      return { type: "no-trump" };
    }

    const bestSuit = SUITS.map((suit) => ({
      suit: suit.id,
      score: getSuitPlanScore(playerId, suit.id),
    })).sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return FIXED_TRUMP_BY_GAME.indexOf(first.suit) - FIXED_TRUMP_BY_GAME.indexOf(second.suit);
    })[0];

    if (!bestSuit || bestSuit.score <= 0) {
      return originalChooseBotTrump(playerId);
    }

    return createSuitTrump(bestSuit.suit);
  };
})();

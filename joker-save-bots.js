(() => {
  const originalChooseBotCard = chooseBotCard;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getLowStandardCard(cards) {
    return [...cards].sort(compareBotCards)[0] || null;
  }

  function getHighestLosingStandardCard(playerId, cards) {
    const losingCards = cards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));
    return [...losingCards].sort(compareBotCards).at(-1) || null;
  }

  function isEarlyOrMiddleTrick() {
    const humanCardsLeft = state.hands.human?.length || 0;
    return humanCardsLeft >= 4;
  }

  function shouldSaveDuckJoker(playerId, chosenCard, standardCards) {
    if (!isBotId(playerId) || chosenCard?.type !== "joker" || !standardCards.length || !state.currentTrick.length) {
      return false;
    }

    const jokerMode = chooseJokerMode(playerId, chosenCard);

    if (jokerMode !== "duck") {
      return false;
    }

    return isEarlyOrMiddleTrick();
  }

  chooseBotCard = function saveDuckJokerBotCard(playerId) {
    const chosenCard = originalChooseBotCard(playerId);

    if (!chosenCard) {
      return chosenCard;
    }

    const legalCards = getLegalCards(playerId);
    const standardCards = legalCards.filter((card) => card.type !== "joker");

    if (!shouldSaveDuckJoker(playerId, chosenCard, standardCards)) {
      return chosenCard;
    }

    return getHighestLosingStandardCard(playerId, standardCards) || getLowStandardCard(standardCards) || chosenCard;
  };
})();

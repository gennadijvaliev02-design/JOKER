(() => {
  const originalChooseBotCard = chooseBotCard;

  function shouldGuardPlayer(playerId) {
    return typeof playerId === "string" && (playerId.startsWith("bot-") || playerId === "human");
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    return hand.filter((card) => isLegalCard(playerId, card));
  }

  function chooseSafeLegalCard(playerId, legalCards, chosenCard) {
    if (!legalCards.length) {
      return chosenCard;
    }

    const standardCards = legalCards.filter((card) => card.type !== "joker");

    if (standardCards.length) {
      return [...standardCards].sort(compareBotCards)[0];
    }

    return [...legalCards].sort(compareBotCards)[0];
  }

  chooseBotCard = function guardedChooseBotCard(playerId) {
    const chosenCard = originalChooseBotCard(playerId);

    if (!shouldGuardPlayer(playerId) || !chosenCard) {
      return chosenCard;
    }

    const legalCards = getLegalCards(playerId);
    const isChosenLegal = legalCards.some((card) => card.id === chosenCard.id);

    if (isChosenLegal) {
      return chosenCard;
    }

    console.warn("Bot legal guard replaced illegal card", {
      playerId,
      chosenCard: chosenCard.id,
      legalCards: legalCards.map((card) => card.id),
      phase: state.phase,
      trick: state.currentTrick.map((play) => `${play.player.id}:${play.card.id}`),
    });

    return chooseSafeLegalCard(playerId, legalCards, chosenCard);
  };
})();

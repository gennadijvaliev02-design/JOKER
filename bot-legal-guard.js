(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalIsLegalCard = isLegalCard;
  let activeLegalityCache = null;

  function shouldGuardPlayer(playerId) {
    return typeof playerId === "string" && (playerId.startsWith("bot-") || playerId === "human");
  }

  function getLegalityCacheKey(playerId, card) {
    const trumpKey = `${state.trump?.type || ""}:${state.trump?.suit || ""}`;
    const trickKey = state.currentTrick
      .map((play) => `${play.player?.id || ""}:${play.card?.id || ""}:${play.jokerMode || ""}:${play.jokerCommand || ""}:${play.jokerSuit || ""}`)
      .join("|");

    return `${playerId}:${card?.id || ""}:${trumpKey}:${trickKey}`;
  }

  isLegalCard = function cachedBotIsLegalCard(playerId, card) {
    if (!activeLegalityCache) {
      return originalIsLegalCard(playerId, card);
    }

    const key = getLegalityCacheKey(playerId, card);

    if (activeLegalityCache.has(key)) {
      return activeLegalityCache.get(key);
    }

    const result = originalIsLegalCard(playerId, card);
    activeLegalityCache.set(key, result);
    return result;
  };

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    return hand.filter((card) => isLegalCard(playerId, card));
  }

  function chooseSafeLegalCard(playerId, legalCards, chosenCard) {
    if (!legalCards.length) {
      return chosenCard || null;
    }

    const standardCards = legalCards.filter((card) => card.type !== "joker");

    if (standardCards.length) {
      return [...standardCards].sort(compareBotCards)[0];
    }

    return [...legalCards].sort(compareBotCards)[0];
  }

  function chooseGuardedCard(playerId) {
    let chosenCard = null;

    try {
      chosenCard = originalChooseBotCard(playerId);
    } catch (error) {
      console.warn("Bot legal guard caught choose error", {
        playerId,
        error,
        phase: state.phase,
        trick: state.currentTrick.map((play) => `${play.player.id}:${play.card.id}`),
      });
    }

    if (!shouldGuardPlayer(playerId)) {
      return chosenCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!chosenCard) {
      const safeCard = chooseSafeLegalCard(playerId, legalCards, chosenCard);

      if (safeCard) {
        console.warn("Bot legal guard replaced empty card", {
          playerId,
          legalCards: legalCards.map((card) => card.id),
          phase: state.phase,
        });
      }

      return safeCard;
    }

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
  }

  chooseBotCard = function guardedChooseBotCard(playerId) {
    const previousCache = activeLegalityCache;
    activeLegalityCache = new Map();

    try {
      return chooseGuardedCard(playerId);
    } finally {
      activeLegalityCache = previousCache;
    }
  };
})();

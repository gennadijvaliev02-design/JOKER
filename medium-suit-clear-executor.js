(() => {
  const originalChooseBotCard = chooseBotCard;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPlayerTarget(player) {
    if (!player || isFourHundredPulka()) {
      return isFourHundredPulka() ? 3 : 0;
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

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      brokenOver: player?.bid === "pass" ? tricks > 0 : target > 0 && tricks > target,
    };
  }

  function getLastJokerClearPlan(playerId) {
    for (let index = state.playedCards.length - 1; index >= 0; index -= 1) {
      const play = state.playedCards[index];

      if (!play || play.player.id !== playerId) {
        continue;
      }

      if (play.card?.type === "joker" && play.jokerMode === "lead" && play.jokerCommand === "high" && play.jokerSuit) {
        return {
          suit: play.jokerSuit,
          index,
        };
      }

      if (play.order === 0 && play.card?.type !== "joker") {
        return null;
      }
    }

    return null;
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
      return 130;
    }

    return (isTrump(card) ? 48 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function chooseClearedSuitLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (goal.shouldAvoid && !goal.brokenOver) {
      return null;
    }

    const plan = getLastJokerClearPlan(playerId);

    if (!plan) {
      return null;
    }

    const suitCards = legalCards.filter((card) => card.type === "standard" && card.suit === plan.suit);

    if (!suitCards.length) {
      return null;
    }

    return sortHigh(suitCards)[0] || originalCard;
  }

  chooseBotCard = function mediumSuitClearExecutorChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || state.currentTrick.length !== 0) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    return chooseClearedSuitLead(playerId, legalCards, originalCard) || originalCard;
  };
})();

(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;

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

  function getOwnGoal(playerId) {
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
      fulfilled: player?.bid === "pass" || tricks >= target,
      canRisk: player?.bid === "pass" || tricks >= target || target <= 1 || cardsLeft <= 4,
    };
  }

  function findZeroTrapTarget(botId) {
    if (isFourHundredPulka()) {
      return null;
    }

    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || player.bid !== 1 || player.tricks !== 0) {
        return false;
      }

      return (state.hands[player.id] || []).length > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstHuman = first.id === "human" ? 100 : 0;
      const secondHuman = second.id === "human" ? 100 : 0;
      const firstCards = state.hands[first.id]?.length || 0;
      const secondCards = state.hands[second.id]?.length || 0;
      return secondHuman - firstHuman || firstCards - secondCards;
    })[0];
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

    return (isTrump(card) ? 42 : 0) + (RANK_POWER[card.rank] || 0);
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

  function getCurrentWinnerId() {
    return getCurrentWinningPlay()?.player?.id || null;
  }

  function shouldAttackZeroTarget(botId, target) {
    if (!target) {
      return false;
    }

    const own = getOwnGoal(botId);

    if (target.id === "human") {
      return true;
    }

    return own.canRisk || own.cardsLeft <= 4;
  }

  function chooseTrumpDrainLead(botId, legalCards, target) {
    if (!shouldAttackZeroTarget(botId, target)) {
      return null;
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

    return null;
  }

  function chooseBeatTargetFollow(botId, legalCards, target) {
    if (!target || getCurrentWinnerId() !== target.id || !shouldAttackZeroTarget(botId, target)) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(botId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function chooseBeforeTargetPressure(botId, legalCards, target) {
    if (!target || !shouldAttackZeroTarget(botId, target)) {
      return null;
    }

    const targetAlreadyPlayed = state.currentTrick.some((play) => play.player.id === target.id);

    if (targetAlreadyPlayed) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const strongStandards = standards.filter((card) => card.rank === "A" || isTrump(card));

    if (strongStandards.length) {
      return sortHigh(strongStandards)[0];
    }

    return null;
  }

  chooseJokerMode = function mediumZeroTrapJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const target = findZeroTrapTarget(playerId);

      if (target && getCurrentWinnerId() === target.id && shouldAttackZeroTarget(playerId, target)) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumZeroTrapChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const target = findZeroTrapTarget(playerId);

    if (!target) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseTrumpDrainLead(playerId, legalCards, target) || originalCard;
    }

    return chooseBeatTargetFollow(playerId, legalCards, target) || chooseBeforeTargetPressure(playerId, legalCards, target) || originalCard;
  };
})();

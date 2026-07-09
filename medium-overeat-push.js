(() => {
  const originalChooseBotCard = chooseBotCard;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getTargetValue(player) {
    if (!player || isFourHundredPulka()) {
      return isFourHundredPulka() ? 3 : 0;
    }

    if (player.bid === "pass") {
      return 0;
    }

    return Number(player.bid || 0);
  }

  function shouldAvoidMoreTricks(player) {
    if (!player || player.bid === null) {
      return false;
    }

    if (isFourHundredPulka()) {
      return player.tricks >= 3;
    }

    if (player.bid === "pass") {
      return true;
    }

    return player.tricks >= getTargetValue(player);
  }

  function getOwnGoal(playerId) {
    const player = getPlayerById(playerId);
    const target = getTargetValue(player);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;

    return {
      player,
      target,
      tricks,
      cardsLeft,
      desperate: player?.bid !== "pass" && tricks < target && target - tricks >= Math.max(1, cardsLeft - 1),
    };
  }

  function findOvereatPushTarget(botId) {
    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || !shouldAvoidMoreTricks(player)) {
        return false;
      }

      return (state.hands[player.id] || []).length > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstPass = first.bid === "pass" ? 350 : 0;
      const secondPass = second.bid === "pass" ? 350 : 0;
      const firstOver = first.tricks - getTargetValue(first);
      const secondOver = second.tricks - getTargetValue(second);

      return secondHuman - firstHuman || secondPass - firstPass || secondOver - firstOver;
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
      return 120;
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

  function getCurrentWinner() {
    return getCurrentWinningPlay()?.player || null;
  }

  function chooseLeaveTargetWinning(botId, legalCards, target) {
    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== target.id) {
      return null;
    }

    const own = getOwnGoal(botId);

    if (own.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const losingStandards = standards.filter((card) => !wouldCardWinCurrentTrick(botId, card));

    if (losingStandards.length) {
      return sortHigh(losingStandards)[0];
    }

    return null;
  }

  function chooseSoftLeadToPush(playerId, legalCards, target) {
    const own = getOwnGoal(playerId);

    if (own.desperate || !target || target.id !== "human") {
      return null;
    }

    const standards = getStandardCards(legalCards);
    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return null;
  }

  chooseBotCard = function mediumOvereatPushChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const target = findOvereatPushTarget(playerId);

    if (!target) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseSoftLeadToPush(playerId, legalCards, target) || originalCard;
    }

    return chooseLeaveTargetWinning(playerId, legalCards, target) || originalCard;
  };
})();

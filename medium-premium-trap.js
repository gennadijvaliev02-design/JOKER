(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPulkaOffset() {
    return (state.currentPulka - 1) * 5;
  }

  function getPlayerIndex(playerId) {
    return state.players.findIndex((player) => player.id === playerId);
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
      desperate: player?.bid !== "pass" && tricks < target && target - tricks >= Math.max(1, cardsLeft - 1),
    };
  }

  function getFulfilledGamesInCurrentPulka(playerId) {
    const playerIndex = getPlayerIndex(playerId);

    if (playerIndex < 0 || state.currentGame <= 1) {
      return 0;
    }

    const rows = state.scoreRows.slice(getPulkaOffset(), getPulkaOffset() + state.currentGame - 1);
    return rows.filter((row) => row.entries?.[playerIndex]?.fulfilled).length;
  }

  function hasFailedInCurrentPulka(playerId) {
    const playerIndex = getPlayerIndex(playerId);

    if (playerIndex < 0 || state.currentGame <= 1) {
      return false;
    }

    const rows = state.scoreRows.slice(getPulkaOffset(), getPulkaOffset() + state.currentGame - 1);
    return rows.some((row) => row.entries?.[playerIndex] && !row.entries[playerIndex].fulfilled);
  }

  function findPremiumThreat(botId) {
    if (state.currentGame < 3 || isFourHundredPulka()) {
      return null;
    }

    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || hasFailedInCurrentPulka(player.id)) {
        return false;
      }

      return getFulfilledGamesInCurrentPulka(player.id) >= 2 && (state.hands[player.id] || []).length > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstFulfilled = getFulfilledGamesInCurrentPulka(first.id) * 120;
      const secondFulfilled = getFulfilledGamesInCurrentPulka(second.id) * 120;
      const firstNeeds = getGoal(first.id).needsTake ? 80 : 0;
      const secondNeeds = getGoal(second.id).needsTake ? 80 : 0;

      return secondHuman + secondFulfilled + secondNeeds - (firstHuman + firstFulfilled + firstNeeds);
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
      return 130;
    }

    return (isTrump(card) ? 48 : 0) + (RANK_POWER[card.rank] || 0);
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

  function getCurrentWinner() {
    return getCurrentWinningPlay()?.player || null;
  }

  function chooseBlockThreatFollow(botId, legalCards, threat) {
    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== threat.id) {
      return null;
    }

    const ownGoal = getGoal(botId);
    const threatGoal = getGoal(threat.id);

    if (threatGoal.shouldAvoid && !ownGoal.desperate) {
      const standards = getStandardCards(legalCards);
      const losingStandards = standards.filter((card) => !wouldCardWinCurrentTrick(botId, card));
      return losingStandards.length ? sortHigh(losingStandards)[0] : null;
    }

    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(botId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && !ownGoal.desperate) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function choosePremiumPressureLead(botId, legalCards, threat) {
    const ownGoal = getGoal(botId);
    const threatGoal = getGoal(threat.id);

    if (ownGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (threatGoal.needsTake) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (threatGoal.shouldAvoid && threat.id === "human") {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumPremiumTrapJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const threat = findPremiumThreat(playerId);

      if (threat && getCurrentWinner()?.id === threat.id && getGoal(threat.id).needsTake && !getGoal(playerId).desperate) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumPremiumTrapChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const threat = findPremiumThreat(playerId);

    if (!threat) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return choosePremiumPressureLead(playerId, legalCards, threat) || originalCard;
    }

    return chooseBlockThreatFollow(playerId, legalCards, threat) || originalCard;
  };
})();

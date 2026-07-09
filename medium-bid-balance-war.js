(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  let isBidBalanceChecking = false;

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
      desperate: player?.bid !== "pass" && tricks < target && target - tricks >= Math.max(1, cardsLeft - 1),
    };
  }

  function getBalance() {
    const total = state.players.reduce((sum, player) => sum + (typeof player.bid === "number" ? player.bid : 0), 0);
    return total - 9;
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
      return 140;
    }

    return (isTrump(card) ? 50 : 0) + (RANK_POWER[card.rank] || 0);
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
    try {
      return getCurrentWinningPlay()?.player || null;
    } catch (error) {
      console.warn("medium bid balance winner check skipped", error);
      return null;
    }
  }

  function safelyWouldWin(playerId, card) {
    if (!card || isBidBalanceChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isBidBalanceChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium bid balance win check skipped", error);
      return false;
    } finally {
      isBidBalanceChecking = false;
    }
  }

  function findPushTarget(botId) {
    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || (state.hands[player.id] || []).length === 0) {
        return false;
      }

      const goal = getGoal(player.id);
      return goal.shouldAvoid || player.id === "human";
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstGoal = getGoal(first.id);
      const secondGoal = getGoal(second.id);
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstAvoid = firstGoal.shouldAvoid ? 450 : 0;
      const secondAvoid = secondGoal.shouldAvoid ? 450 : 0;
      const firstPass = first.bid === "pass" ? 300 : 0;
      const secondPass = second.bid === "pass" ? 300 : 0;

      return secondHuman + secondAvoid + secondPass - (firstHuman + firstAvoid + firstPass);
    })[0];
  }

  function findTakeAwayTarget(botId) {
    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || (state.hands[player.id] || []).length === 0) {
        return false;
      }

      return getGoal(player.id).needsTake;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstGoal = getGoal(first.id);
      const secondGoal = getGoal(second.id);
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstForced = first.mediumForcedOneBid && first.tricks === 0 ? 650 : 0;
      const secondForced = second.mediumForcedOneBid && second.tricks === 0 ? 650 : 0;
      const firstHigh = firstGoal.target >= 4 ? 250 : 0;
      const secondHigh = secondGoal.target >= 4 ? 250 : 0;

      return secondHuman + secondForced + secondHigh - (firstHuman + firstForced + firstHigh);
    })[0];
  }

  function choosePushFollow(botId, legalCards, target) {
    if (!target) {
      return null;
    }

    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== target.id || getGoal(botId).desperate) {
      return null;
    }

    const losing = getStandardCards(legalCards).filter((card) => !safelyWouldWin(botId, card));
    return losing.length ? sortHigh(losing)[0] : null;
  }

  function chooseTakeAwayFollow(botId, legalCards, target) {
    if (!target) {
      return null;
    }

    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== target.id) {
      return null;
    }

    const winners = getStandardCards(legalCards).filter((card) => safelyWouldWin(botId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && !getGoal(botId).desperate) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function chooseBalanceLead(botId, legalCards, balance) {
    const ownGoal = getGoal(botId);

    if (ownGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (balance > 0) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (balance < 0) {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }

      if (standards.length) {
        return sortLow(standards)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumBidBalanceWarJokerMode(playerId, card) {
    if (isBidBalanceChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0 && getBalance() > 0) {
      const target = findTakeAwayTarget(playerId);

      if (target && getCurrentWinner()?.id === target.id && !getGoal(playerId).desperate) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumBidBalanceWarChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing" || isBidBalanceChecking) {
      return originalCard;
    }

    try {
      const balance = getBalance();

      if (!balance) {
        return originalCard;
      }

      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseBalanceLead(playerId, legalCards, balance) || originalCard;
      }

      if (balance > 0) {
        const target = findTakeAwayTarget(playerId);
        return chooseTakeAwayFollow(playerId, legalCards, target) || originalCard;
      }

      const target = findPushTarget(playerId);
      return choosePushFollow(playerId, legalCards, target) || originalCard;
    } catch (error) {
      console.warn("medium bid balance fallback", error);
      return originalCard;
    }
  };
})();

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

  function getPlayerTarget(player) {
    if (!player) {
      return 0;
    }

    if (isFourHundredPulka()) {
      return 3;
    }

    if (player.bid === "pass") {
      return 0;
    }

    return Number(player.bid || 0);
  }

  function getGoal(playerId) {
    const player = getPlayerById(playerId);
    const cardsLeft = state.hands[playerId]?.length || 0;
    const target = getPlayerTarget(player);
    const tricks = player?.tricks || 0;
    const needed = Math.max(0, target - tricks);
    const shouldAvoid = player?.bid === "pass" || tricks >= target;
    const desperate = !shouldAvoid && needed >= Math.max(1, cardsLeft);

    return {
      player,
      target,
      tricks,
      needed,
      cardsLeft,
      shouldAvoid,
      needsTake: !shouldAvoid && needed > 0,
      desperate,
      over: tricks > target,
    };
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    const trumpSuit = getTrumpSuit();
    const trumpBonus = trumpSuit && card.suit === trumpSuit ? 34 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function standardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getWinningStandardCards(playerId, cards) {
    return standardCards(cards).filter((card) => wouldCardWinCurrentTrick(playerId, card));
  }

  function getLosingStandardCards(playerId, cards) {
    return standardCards(cards).filter((card) => !wouldCardWinCurrentTrick(playerId, card));
  }

  function currentWinnerGoal() {
    const winner = getCurrentWinningPlay()?.player;
    return winner ? getGoal(winner.id) : null;
  }

  function shouldBlockWinner(playerId, winnerGoal) {
    if (!winnerGoal?.player || winnerGoal.player.id === playerId) {
      return false;
    }

    if (winnerGoal.needsTake) {
      return true;
    }

    return winnerGoal.desperate;
  }

  function shouldFeedWinner(playerId, winnerGoal) {
    if (!winnerGoal?.player || winnerGoal.player.id === playerId) {
      return false;
    }

    return winnerGoal.shouldAvoid;
  }

  function chooseGoalFollowCard(playerId, legalCards, originalCard) {
    const selfGoal = getGoal(playerId);
    const winnerGoal = currentWinnerGoal();
    const winningCards = getWinningStandardCards(playerId, legalCards);
    const losingCards = getLosingStandardCards(playerId, legalCards);
    const standards = standardCards(legalCards);

    if (shouldBlockWinner(playerId, winnerGoal) && winningCards.length) {
      if (selfGoal.shouldAvoid && !winnerGoal.desperate) {
        return originalCard;
      }

      return sortLow(winningCards)[0];
    }

    if (shouldFeedWinner(playerId, winnerGoal)) {
      if (losingCards.length) {
        return sortHigh(losingCards)[0];
      }

      if (standards.length && selfGoal.shouldAvoid) {
        return sortLow(standards)[0];
      }
    }

    if (selfGoal.shouldAvoid && winningCards.some((card) => card.id === originalCard?.id) && losingCards.length) {
      return sortHigh(losingCards)[0];
    }

    if (selfGoal.desperate && winningCards.length) {
      return sortLow(winningCards)[0];
    }

    return originalCard;
  }

  function chooseGoalLeadCard(playerId, legalCards, originalCard) {
    const selfGoal = getGoal(playerId);
    const standards = standardCards(legalCards);

    if (!standards.length) {
      return originalCard;
    }

    const dangerousOpponents = state.players
      .filter((player) => player.id !== playerId)
      .map((player) => getGoal(player.id))
      .filter((goal) => goal.needsTake && !goal.over);

    const vulnerableOpponents = state.players
      .filter((player) => player.id !== playerId)
      .map((player) => getGoal(player.id))
      .filter((goal) => goal.shouldAvoid && !goal.over);

    if (selfGoal.desperate) {
      return sortHigh(standards)[0];
    }

    if (selfGoal.shouldAvoid) {
      return sortLow(standards)[0];
    }

    if (dangerousOpponents.some((goal) => goal.desperate)) {
      const trumpSuit = getTrumpSuit();
      const trumpCards = standards.filter((card) => trumpSuit && card.suit === trumpSuit);

      if (trumpCards.length) {
        return sortHigh(trumpCards)[0];
      }

      return sortHigh(standards)[0];
    }

    if (vulnerableOpponents.length && !selfGoal.desperate) {
      const nonTrumpCards = standards.filter((card) => !(getTrumpSuit() && card.suit === getTrumpSuit()));
      return sortLow(nonTrumpCards.length ? nonTrumpCards : standards)[0];
    }

    return originalCard;
  }

  chooseBotCard = function playerGoalChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    if (originalCard.type === "joker") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseGoalLeadCard(playerId, legalCards, originalCard);
    }

    return chooseGoalFollowCard(playerId, legalCards, originalCard);
  };
})();

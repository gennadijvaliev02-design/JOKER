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

  function findEndgameTarget(botId) {
    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId) {
        return false;
      }

      const cardsLeft = state.hands[player.id]?.length || 0;
      return cardsLeft > 0 && cardsLeft <= 3;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => {
      const firstGoal = getGoal(first.id);
      const secondGoal = getGoal(second.id);
      const firstHuman = first.id === "human" ? 1000 : 0;
      const secondHuman = second.id === "human" ? 1000 : 0;
      const firstForced = first.mediumForcedOneBid && first.tricks === 0 ? 500 : 0;
      const secondForced = second.mediumForcedOneBid && second.tricks === 0 ? 500 : 0;
      const firstUrgent = firstGoal.needsTake || firstGoal.shouldAvoid ? 150 : 0;
      const secondUrgent = secondGoal.needsTake || secondGoal.shouldAvoid ? 150 : 0;

      return secondHuman + secondForced + secondUrgent - (firstHuman + firstForced + firstUrgent);
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
    return getCurrentWinningPlay()?.player || null;
  }

  function chooseEndgameFollow(botId, legalCards, target) {
    const targetGoal = getGoal(target.id);
    const ownGoal = getGoal(botId);
    const currentWinner = getCurrentWinner();
    const standards = getStandardCards(legalCards);

    if (currentWinner?.id === target.id && targetGoal.needsTake) {
      const winners = standards.filter((card) => wouldCardWinCurrentTrick(botId, card));

      if (winners.length) {
        return sortLow(winners)[0];
      }

      const jokers = getJokerCards(legalCards);

      if (jokers.length && !ownGoal.desperate) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }
    }

    if (currentWinner?.id === target.id && targetGoal.shouldAvoid && !ownGoal.desperate) {
      const losing = standards.filter((card) => !wouldCardWinCurrentTrick(botId, card));

      if (losing.length) {
        return sortHigh(losing)[0];
      }
    }

    return null;
  }

  function chooseEndgameLead(botId, legalCards, target) {
    const targetGoal = getGoal(target.id);
    const ownGoal = getGoal(botId);

    if (ownGoal.desperate) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (targetGoal.needsTake) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (targetGoal.shouldAvoid) {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumEndgameWarJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const target = findEndgameTarget(playerId);

      if (target && getCurrentWinner()?.id === target.id && getGoal(target.id).needsTake && !getGoal(playerId).desperate) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumEndgameWarChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const ownCardsLeft = state.hands[playerId]?.length || 0;

    if (ownCardsLeft > 3) {
      return originalCard;
    }

    const target = findEndgameTarget(playerId);

    if (!target) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseEndgameLead(playerId, legalCards, target) || originalCard;
    }

    return chooseEndgameFollow(playerId, legalCards, target) || originalCard;
  };
})();

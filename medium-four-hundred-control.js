(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getGoal400(playerId) {
    const player = getPlayerById(playerId);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, 3 - tricks);

    return {
      player,
      tricks,
      cardsLeft,
      needed,
      needsTake: tricks < 3,
      hasZeroRisk: tricks === 0,
      urgent: tricks < 3 && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 4),
      desperate: tricks < 3 && needed >= Math.max(1, cardsLeft),
      shouldAvoid: tricks >= 3,
    };
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
      return 160;
    }

    return (isTrump(card) ? 54 : 0) + (RANK_POWER[card.rank] || 0);
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

  function estimateTakeCapacity400(playerId) {
    const hand = state.hands[playerId] || [];
    const standards = getStandardCards(hand);
    const jokers = getJokerCards(hand).length;
    const trumps = standards.filter(isTrump);
    const highTrumps = trumps.filter((card) => RANK_POWER[card.rank] >= RANK_POWER.J).length;
    const aces = standards.filter((card) => card.rank === "A").length;
    const protectedKings = standards.filter((card) => card.rank === "K" && getUnseenHigherCardCount(card) <= 1).length;
    const safeQueens = standards.filter((card) => card.rank === "Q" && isTrump(card)).length;
    const longTrumpBonus = trumps.length >= 4 ? 1 : 0;

    return jokers + highTrumps + aces + protectedKings + safeQueens + longTrumpBonus;
  }

  function isRunaway400(playerId) {
    const hand = state.hands[playerId] || [];
    const jokerCount = getJokerCards(hand).length;
    return jokerCount >= 2 && estimateTakeCapacity400(playerId) >= 6;
  }

  function chooseBestSuitForJoker400(playerId) {
    const trumpSuit = getTrumpSuit();

    if (trumpSuit && getSuitCards(playerId, trumpSuit).length) {
      return trumpSuit;
    }

    const entries = SUITS.map((suit) => {
      const cards = getSuitCards(playerId, suit.id);
      const highScore = cards.reduce((score, card) => score + (RANK_POWER[card.rank] || 0), 0);
      return {
        suit: suit.id,
        score: cards.length * 30 + highScore,
      };
    }).filter((entry) => entry.score > 0);

    if (!entries.length) {
      return trumpSuit || "hearts";
    }

    return entries.sort((first, second) => second.score - first.score)[0].suit;
  }

  function getCurrentWinnerId() {
    return getCurrentWinningPlay()?.player?.id || null;
  }

  function chooseAvoidExtraLead(legalCards) {
    const standards = getStandardCards(legalCards);
    const nonTrumps = standards.filter((card) => !isTrump(card));

    if (nonTrumps.length) {
      return sortLow(nonTrumps)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return sortLow(legalCards)[0] || null;
  }

  function chooseAvoidExtraFollow(playerId, legalCards) {
    const standards = getStandardCards(legalCards);
    const losing = standards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));

    if (losing.length) {
      return sortHigh(losing)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return sortLow(jokers)[0];
    }

    if (standards.length) {
      return sortLow(standards)[0];
    }

    return sortLow(legalCards)[0] || null;
  }

  function chooseTakeLead400(playerId, legalCards) {
    const goal = getGoal400(playerId);
    const standards = getStandardCards(legalCards);
    const jokers = getJokerCards(legalCards);

    if (isRunaway400(playerId) && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const strongStandards = standards.filter((card) => {
      if (isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.J) return true;
      if (card.rank === "A") return true;
      return getUnseenHigherCardCount(card) === 0 && RANK_POWER[card.rank] >= RANK_POWER.K;
    });

    if (strongStandards.length) {
      return sortHigh(strongStandards)[0];
    }

    if ((goal.urgent || goal.hasZeroRisk) && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const trumps = standards.filter(isTrump);

    if (goal.urgent && trumps.length) {
      return sortHigh(trumps)[0];
    }

    return null;
  }

  function chooseTakeFollow400(playerId, legalCards) {
    const goal = getGoal400(playerId);
    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length && (goal.urgent || goal.hasZeroRisk || isRunaway400(playerId))) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function chooseRunawayFollow400(playerId, legalCards) {
    const standards = getStandardCards(legalCards);
    const winningStandards = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandards.length) {
      return sortLow(winningStandards)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  chooseLeadJokerAction = function mediumFourHundredLeadJokerAction(playerId) {
    if (isMediumAi() && isBotId(playerId) && isFourHundredPulka()) {
      const goal = getGoal400(playerId);

      if (isRunaway400(playerId)) {
        return {
          jokerCommand: "high",
          jokerSuit: chooseBestSuitForJoker400(playerId),
        };
      }

      if (goal.needsTake) {
        return {
          jokerCommand: goal.urgent || goal.hasZeroRisk ? "high" : "take",
          jokerSuit: chooseBestSuitForJoker400(playerId),
        };
      }
    }

    return originalChooseLeadJokerAction(playerId);
  };

  chooseJokerMode = function mediumFourHundredJokerMode(playerId, card) {
    if (isMediumAi() && isBotId(playerId) && isFourHundredPulka() && card?.type === "joker" && state.currentTrick.length > 0) {
      const goal = getGoal400(playerId);

      if (isRunaway400(playerId)) {
        return "beat";
      }

      if (goal.needsTake && (goal.urgent || goal.hasZeroRisk || getCurrentWinnerId() !== playerId)) {
        return "beat";
      }

      if (goal.shouldAvoid) {
        return "duck";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumFourHundredChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !isFourHundredPulka() || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    const goal = getGoal400(playerId);

    if (state.currentTrick.length === 0) {
      if (isRunaway400(playerId)) {
        return chooseTakeLead400(playerId, legalCards) || sortHigh(legalCards)[0] || originalCard;
      }

      if (goal.needsTake) {
        return chooseTakeLead400(playerId, legalCards) || originalCard;
      }

      return chooseAvoidExtraLead(legalCards) || originalCard;
    }

    if (isRunaway400(playerId)) {
      return chooseRunawayFollow400(playerId, legalCards) || originalCard;
    }

    if (goal.needsTake) {
      return chooseTakeFollow400(playerId, legalCards) || originalCard;
    }

    return chooseAvoidExtraFollow(playerId, legalCards) || originalCard;
  };
})();

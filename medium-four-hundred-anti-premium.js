(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;
  let isFourHundredPremiumChecking = false;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPlayerIndex(playerId) {
    return state.players.findIndex((player) => player.id === playerId);
  }

  function getPulkaOffset() {
    return (state.currentPulka - 1) * 5;
  }

  function getFulfilledInCurrentPulka(playerId) {
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

  function getGoal400(playerId) {
    const player = getPlayerById(playerId);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;

    return {
      player,
      tricks,
      cardsLeft,
      needsTake: tricks < 3,
      shouldAvoid: tricks >= 3,
      zeroRisk: tricks === 0,
      selfDeathRisk: tricks === 0 && cardsLeft <= 2,
    };
  }

  function getAntiPremiumPriority(playerId) {
    const goal = getGoal400(playerId);
    const fulfilled = getFulfilledInCurrentPulka(playerId);
    let score = 0;

    if (!goal.player || hasFailedInCurrentPulka(playerId)) {
      return 0;
    }

    if (fulfilled >= 1) score += 350;
    if (fulfilled >= 2) score += 700;
    if (fulfilled >= 3) score += 1400;
    if (playerId === "human") score += 900;
    if (goal.tricks === 2) score += 650;
    if (goal.tricks === 3) score += 900;
    if (goal.cardsLeft <= 4) score += 250;

    return score;
  }

  function findAntiPremiumTarget(botId) {
    if (!isFourHundredPulka()) {
      return null;
    }

    const candidates = state.players.filter((player) => {
      if (!player || player.id === botId || (state.hands[player.id] || []).length === 0) {
        return false;
      }

      return getAntiPremiumPriority(player.id) > 0;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((first, second) => getAntiPremiumPriority(second.id) - getAntiPremiumPriority(first.id))[0];
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
      return 210;
    }

    return (isTrump(card) ? 62 : 0) + (RANK_POWER[card.rank] || 0);
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
      console.warn("medium 400 anti premium winner check skipped", error);
      return null;
    }
  }

  function safelyWouldWin(playerId, card) {
    if (!card || isFourHundredPremiumChecking) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    try {
      isFourHundredPremiumChecking = true;
      return wouldCardWinCurrentTrick(playerId, card);
    } catch (error) {
      console.warn("medium 400 anti premium win check skipped", error);
      return false;
    } finally {
      isFourHundredPremiumChecking = false;
    }
  }

  function chooseBlockTakeFollow(botId, legalCards, target) {
    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== target.id) {
      return null;
    }

    const own = getGoal400(botId);

    if (own.selfDeathRisk) {
      return null;
    }

    const winners = getStandardCards(legalCards).filter((card) => safelyWouldWin(botId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    const jokers = getJokerCards(legalCards);

    if (jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  function choosePushExtraFollow(botId, legalCards, target) {
    const currentWinner = getCurrentWinner();

    if (!currentWinner || currentWinner.id !== target.id) {
      return null;
    }

    const own = getGoal400(botId);

    if (own.selfDeathRisk) {
      return null;
    }

    const losing = getStandardCards(legalCards).filter((card) => !safelyWouldWin(botId, card));

    if (losing.length) {
      return sortHigh(losing)[0];
    }

    return null;
  }

  function chooseAntiPremiumLead(botId, legalCards, target) {
    const targetGoal = getGoal400(target.id);
    const ownGoal = getGoal400(botId);

    if (ownGoal.selfDeathRisk) {
      return null;
    }

    const standards = getStandardCards(legalCards);

    if (targetGoal.needsTake) {
      const jokers = getJokerCards(legalCards);

      if (jokers.length && getAntiPremiumPriority(target.id) >= 1200) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }

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

      if (standards.length) {
        return sortLow(standards)[0];
      }
    }

    return null;
  }

  function chooseBestJokerSuit(botId) {
    const trumpSuit = getTrumpSuit();

    if (trumpSuit) {
      return trumpSuit;
    }

    const best = SUITS.map((suit) => ({
      suit: suit.id,
      count: (state.hands[botId] || []).filter((card) => card.type === "standard" && card.suit === suit.id).length,
    })).sort((first, second) => second.count - first.count)[0];

    return best?.suit || "hearts";
  }

  chooseLeadJokerAction = function mediumFourHundredAntiPremiumLeadJokerAction(playerId) {
    if (isMediumAi() && isBotId(playerId) && isFourHundredPulka()) {
      const target = findAntiPremiumTarget(playerId);

      if (target && !getGoal400(playerId).selfDeathRisk) {
        return {
          jokerCommand: "high",
          jokerSuit: chooseBestJokerSuit(playerId),
        };
      }
    }

    return originalChooseLeadJokerAction(playerId);
  };

  chooseJokerMode = function mediumFourHundredAntiPremiumJokerMode(playerId, card) {
    if (isFourHundredPremiumChecking) {
      return originalChooseJokerMode(playerId, card);
    }

    if (isMediumAi() && isBotId(playerId) && isFourHundredPulka() && card?.type === "joker" && state.currentTrick.length > 0) {
      const target = findAntiPremiumTarget(playerId);

      if (target && getCurrentWinner()?.id === target.id && getGoal400(target.id).needsTake && !getGoal400(playerId).selfDeathRisk) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumFourHundredAntiPremiumChooseCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !isFourHundredPulka() || !originalCard || state.phase !== "playing" || isFourHundredPremiumChecking) {
      return originalCard;
    }

    try {
      const target = findAntiPremiumTarget(playerId);

      if (!target) {
        return originalCard;
      }

      const legalCards = getLegalCards(playerId);

      if (!legalCards.length) {
        return originalCard;
      }

      if (state.currentTrick.length === 0) {
        return chooseAntiPremiumLead(playerId, legalCards, target) || originalCard;
      }

      if (getGoal400(target.id).needsTake) {
        return chooseBlockTakeFollow(playerId, legalCards, target) || originalCard;
      }

      return choosePushExtraFollow(playerId, legalCards, target) || originalCard;
    } catch (error) {
      console.warn("medium 400 anti premium fallback", error);
      return originalCard;
    }
  };
})();

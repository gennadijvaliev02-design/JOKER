(() => {
  const originalChooseBotBid = chooseBotBid;
  const originalChooseBotCard = chooseBotCard;

  const PERSONALITY = {
    "bot-1": {
      name: "Клод",
      bidShift: -0.45,
      savePower: true,
      panicSafety: true,
    },
    "bot-2": {
      name: "GPT",
      bidShift: 0,
      savePower: true,
      panicSafety: true,
    },
    "bot-3": {
      name: "Qwen",
      bidShift: 0.35,
      savePower: false,
      panicSafety: true,
    },
  };

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPersonality(playerId) {
    return PERSONALITY[playerId] || PERSONALITY["bot-2"];
  }

  function getTarget(player) {
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
    const target = getTarget(player);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: player?.bid !== "pass" && tricks < target,
      shouldAvoid: player?.bid === "pass" || tricks >= target,
      danger: player?.bid !== "pass" && tricks < target && needed >= Math.max(1, cardsLeft - 1),
    };
  }

  function getBidNumberSafe(bid) {
    return bid === "pass" ? 0 : Number(bid || 0);
  }

  function getClosestAllowedBid(target) {
    const normalized = clamp(target, 0, 8);
    const sorted = [...BID_OPTIONS].sort((firstBid, secondBid) => {
      return Math.abs(getBidNumber(firstBid) - normalized) - Math.abs(getBidNumber(secondBid) - normalized);
    });

    return sorted.find((bid) => isBidAllowedForCurrentTurn(bid)) ?? "pass";
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 170;
    }

    return (isTrump(card) ? 54 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  chooseBotBid = function mediumPersonalityChooseBid(playerId) {
    const originalBid = originalChooseBotBid(playerId);

    if (!isMediumAi() || !isBotId(playerId) || isFourHundredPulka()) {
      return originalBid;
    }

    const personality = getPersonality(playerId);
    const originalValue = getBidNumberSafe(originalBid);
    const shifted = Math.round(originalValue + personality.bidShift);

    if (originalValue === 0 && shifted <= 0) {
      return originalBid;
    }

    return getClosestAllowedBid(shifted);
  };

  chooseBotCard = function mediumPersonalityChooseCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const personality = getPersonality(playerId);
    const goal = getGoal(playerId);

    if (goal.danger && personality.panicSafety) {
      return originalCard;
    }

    if (!personality.savePower || state.currentTrick.length !== 0 || goal.needsTake || goal.shouldAvoid) {
      return originalCard;
    }

    if (originalCard.type !== "joker" && !isTrump(originalCard)) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);
    const standards = getStandardCards(legalCards);
    const cheapStandards = standards.filter((card) => !isTrump(card));

    if (cheapStandards.length) {
      return sortLow(cheapStandards)[0];
    }

    const lowTrumps = standards.filter((card) => isTrump(card) && RANK_POWER[card.rank] < RANK_POWER.Q);

    if (lowTrumps.length) {
      return sortLow(lowTrumps)[0];
    }

    if (originalCard.type === "joker") {
      const nonJokers = legalCards.filter((card) => card.type !== "joker");

      if (nonJokers.length) {
        return sortLow(nonJokers)[0];
      }
    }

    return originalCard;
  };

  window.JokerMediumPersonalities = PERSONALITY;
})();

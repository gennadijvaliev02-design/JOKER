(() => {
  const originalChooseBotBid = chooseBotBid;
  const originalChooseBotCard = chooseBotCard;

  const personalities = {
    "bot-1": {
      name: "Клод",
      bidShift: -0.35,
      bidNoise: 0.55,
      greedChance: 0.08,
      cautionChance: 0.32,
      chaosChance: 0.07,
      aggressionChance: 0.18,
      spoilerChance: 0.14,
    },
    "bot-2": {
      name: "GPT",
      bidShift: 0.35,
      bidNoise: 0.65,
      greedChance: 0.28,
      cautionChance: 0.12,
      chaosChance: 0.11,
      aggressionChance: 0.42,
      spoilerChance: 0.27,
    },
    "bot-3": {
      name: "Qwen",
      bidShift: 0,
      bidNoise: 0.35,
      greedChance: 0.08,
      cautionChance: 0.04,
      chaosChance: 0.06,
      aggressionChance: 0.72,
      spoilerChance: 0.08,
      noReserveBid: true,
    },
  };

  function getPersonality(playerId) {
    return personalities[playerId] || personalities["bot-2"];
  }

  function randomChance(chance) {
    return Math.random() < chance;
  }

  function numericBid(bid) {
    return bid === "pass" ? 0 : Number(bid || 0);
  }

  function bidFromNumber(value) {
    return value <= 0 ? "pass" : clamp(Math.round(value), 1, 8);
  }

  function estimateNoReserveBid(playerId) {
    const hand = state.hands[playerId] || [];
    const rawScore = hand.reduce((sum, card) => sum + getBidCardValue(card), 0);
    const estimated = clamp(Math.round(rawScore), 0, 8);

    return estimated === 0 ? "pass" : estimated;
  }

  function pickAllowedBidNear(targetBid) {
    const rankedBids = [...BID_OPTIONS].sort((firstBid, secondBid) => {
      return Math.abs(numericBid(firstBid) - numericBid(targetBid)) - Math.abs(numericBid(secondBid) - numericBid(targetBid));
    });

    return rankedBids.find((bid) => isBidAllowedForCurrentTurn(bid)) ?? "pass";
  }

  function getLegalCardsForPersonality(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getForcedHighJokerCard(cards) {
    const highLeadJokerPlay = getHighLeadJokerPlay();

    if (!highLeadJokerPlay?.jokerSuit) {
      return null;
    }

    const requestedSuitCards = cards.filter((card) => card.type === "standard" && card.suit === highLeadJokerPlay.jokerSuit);

    if (!requestedSuitCards.length) {
      return null;
    }

    return [...requestedSuitCards].sort((firstCard, secondCard) => RANK_POWER[secondCard.rank] - RANK_POWER[firstCard.rank])[0];
  }

  function getAggressiveLeadCard(cards, allowJoker = false) {
    const candidates = allowJoker ? cards : cards.filter((card) => card.type !== "joker");

    return [...(candidates.length ? candidates : cards)].sort(compareBotLeadHighCards)[0] || null;
  }

  function getLowDumpCard(cards) {
    return [...cards].sort(compareBotCards)[0] || null;
  }

  function getRandomNearGoodCard(cards, sortFn, spread = 3) {
    const sortedCards = [...cards].sort(sortFn);
    const pool = sortedCards.slice(0, Math.min(spread, sortedCards.length));

    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function getWinningCards(playerId, cards) {
    return cards.filter((card) => wouldCardWinCurrentTrick(playerId, card));
  }

  function getLosingCards(playerId, cards) {
    return cards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));
  }

  function getTargetTricks(player) {
    if (!player || player.bid === "pass") {
      return 0;
    }

    return isFourHundredPulka() ? 3 : Number(player.bid || 0);
  }

  function getTricksStillNeeded(playerId) {
    const player = getPlayerById(playerId);
    const target = getTargetTricks(player);

    return Math.max(0, target - (player?.tricks || 0));
  }

  function getCardsLeft(playerId) {
    return (state.hands[playerId] || []).length;
  }

  function isBehindSchedule(playerId) {
    const needed = getTricksStillNeeded(playerId);
    const cardsLeft = getCardsLeft(playerId);

    if (needed <= 0) {
      return false;
    }

    return needed >= Math.max(1, cardsLeft - 2);
  }

  function shouldUseJokerBeforeTooLate(playerId, jokerCount) {
    const needed = getTricksStillNeeded(playerId);
    const cardsLeft = getCardsLeft(playerId);

    if (!jokerCount || needed <= 0) {
      return false;
    }

    if (jokerCount >= 2 && needed >= 2 && cardsLeft <= 5) {
      return true;
    }

    if (jokerCount >= 1 && needed >= Math.max(1, cardsLeft - 2)) {
      return true;
    }

    return false;
  }

  function getBestJoker(cards) {
    const jokers = cards.filter((card) => card.type === "joker");

    return jokers.find((card) => card.color === "red") || jokers[0] || null;
  }

  function shouldAnnoyTable(playerId, personality) {
    const player = getPlayerById(playerId);

    if (!player || player.bid === "pass") {
      return randomChance(personality.spoilerChance * 0.45);
    }

    const target = isFourHundredPulka() ? 3 : player.bid;
    const alreadyDone = player.tricks >= target;

    return alreadyDone && randomChance(personality.spoilerChance);
  }

  chooseBotBid = function personalityChooseBotBid(playerId) {
    const personality = getPersonality(playerId);
    const baseBid = personality.noReserveBid ? estimateNoReserveBid(playerId) : originalChooseBotBid(playerId);
    let target = numericBid(baseBid) + personality.bidShift;

    if (randomChance(personality.greedChance)) {
      target += 1;
    }

    if (randomChance(personality.cautionChance)) {
      target -= 1;
    }

    if (randomChance(personality.chaosChance)) {
      target += Math.random() < 0.5 ? -personality.bidNoise : personality.bidNoise;
    }

    return pickAllowedBidNear(bidFromNumber(target));
  };

  chooseBotCard = function personalityChooseBotCard(playerId) {
    const personality = getPersonality(playerId);
    const originalCard = originalChooseBotCard(playerId);
    const legalCards = getLegalCardsForPersonality(playerId);
    const forcedHighJokerCard = getForcedHighJokerCard(legalCards);

    if (forcedHighJokerCard) {
      return forcedHighJokerCard;
    }

    if (legalCards.length <= 1) {
      return originalCard;
    }

    const jokerCards = legalCards.filter((card) => card.type === "joker");
    const standardCards = legalCards.filter((card) => card.type !== "joker");
    const wantsTrick = shouldPlayerTakeTrick(playerId);
    const canSpendJoker = jokerCards.length && shouldSpendJokerNow(playerId);
    const shouldSaveOrderNow = wantsTrick && isBehindSchedule(playerId);
    const shouldSpendJokerEarly = wantsTrick && shouldUseJokerBeforeTooLate(playerId, jokerCards.length);

    if (!state.currentTrick.length) {
      if (shouldSaveOrderNow && jokerCards.length && getTricksStillNeeded(playerId) >= getCardsLeft(playerId) - 1) {
        return getBestJoker(jokerCards) || originalCard;
      }

      if (wantsTrick && randomChance(personality.aggressionChance)) {
        return getRandomNearGoodCard(standardCards.length ? standardCards : legalCards, compareBotLeadHighCards, 2) || originalCard;
      }

      if (!wantsTrick && shouldAnnoyTable(playerId, personality)) {
        return getAggressiveLeadCard(legalCards, canSpendJoker && randomChance(0.28)) || originalCard;
      }

      if (randomChance(personality.chaosChance)) {
        return getRandomNearGoodCard(legalCards, Math.random() < 0.5 ? compareBotLeadHighCards : compareBotCards, 4) || originalCard;
      }

      return originalCard;
    }

    const winningCards = getWinningCards(playerId, legalCards);
    const losingCards = getLosingCards(playerId, legalCards);

    if (shouldSpendJokerEarly && winningCards.length) {
      const jokerWinner = getBestJoker(winningCards);

      if (jokerWinner) {
        return jokerWinner;
      }
    }

    if (shouldSaveOrderNow && winningCards.length) {
      const winningStandardCards = winningCards.filter((card) => card.type !== "joker");
      const pool = winningStandardCards.length ? winningStandardCards : winningCards;

      return getRandomNearGoodCard(pool, compareBotCards, 2) || originalCard;
    }

    if (wantsTrick && winningCards.length && randomChance(personality.aggressionChance)) {
      const winningStandardCards = winningCards.filter((card) => card.type !== "joker");
      const pool = winningStandardCards.length ? winningStandardCards : winningCards;

      return getRandomNearGoodCard(pool, compareBotCards, 2) || originalCard;
    }

    if (!wantsTrick && winningCards.length && shouldAnnoyTable(playerId, personality)) {
      const winningStandardCards = winningCards.filter((card) => card.type !== "joker");

      return getRandomNearGoodCard(winningStandardCards.length ? winningStandardCards : winningCards, compareBotCards, 3) || originalCard;
    }

    if (randomChance(personality.chaosChance)) {
      if (losingCards.length && Math.random() < 0.55) {
        return getRandomNearGoodCard(losingCards, compareBotCards, 4) || originalCard;
      }

      if (winningCards.length) {
        return getRandomNearGoodCard(winningCards, compareBotCards, 4) || originalCard;
      }

      return getLowDumpCard(legalCards) || originalCard;
    }

    return originalCard;
  };
})();

(() => {
  const originalShouldSpendJokerNow = shouldSpendJokerNow;
  const originalShouldLeadHighTrumpJoker = shouldLeadHighTrumpJoker;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function getPlayedJokerCount() {
    return state.playedCards.filter((play) => play.card?.type === "joker").length;
  }

  function isOnlyKnownJokerHolder(playerId) {
    const jokerCount = getJokerCount(playerId);

    return jokerCount === 1 && getPlayedJokerCount() >= 1;
  }

  function getNeededTricks(playerId) {
    const player = getPlayerById(playerId);

    if (!player || player.bid === "pass") {
      return 0;
    }

    const target = isFourHundredPulka() ? 3 : player.bid;
    return Math.max(0, target - player.tricks);
  }

  function isJokerUrgent(playerId) {
    const remainingCards = state.hands[playerId]?.length || 0;
    const neededTricks = getNeededTricks(playerId);

    return neededTricks > 0 && neededTricks >= remainingCards;
  }

  function shouldPreserveLastJoker(playerId) {
    if (!isOnlyKnownJokerHolder(playerId)) {
      return false;
    }

    if (!shouldPlayerTakeTrick(playerId)) {
      return false;
    }

    return !isJokerUrgent(playerId);
  }

  shouldSpendJokerNow = function smarterShouldSpendJokerNow(playerId) {
    if (shouldPreserveLastJoker(playerId)) {
      return false;
    }

    return originalShouldSpendJokerNow(playerId);
  };

  shouldLeadHighTrumpJoker = function smarterShouldLeadHighTrumpJoker(playerId) {
    if (shouldPreserveLastJoker(playerId)) {
      return false;
    }

    return originalShouldLeadHighTrumpJoker(playerId);
  };

  function getCardDangerScore(card) {
    if (card.type === "joker") {
      return 100;
    }

    const trumpSuit = getTrumpSuit();
    const trumpDanger = trumpSuit && card.suit === getTrumpSuit() ? 28 : 0;
    const rankDanger = RANK_POWER[card.rank] || 0;
    const memoryDanger = getUnseenHigherCardCount(card) === 0 ? 14 : 0;

    return trumpDanger + rankDanger + memoryDanger;
  }

  function sortBySafeLead(firstCard, secondCard) {
    const trumpSuit = getTrumpSuit();
    const firstIsTrump = trumpSuit && firstCard.suit === trumpSuit;
    const secondIsTrump = trumpSuit && secondCard.suit === trumpSuit;

    if (firstIsTrump !== secondIsTrump) {
      return firstIsTrump ? 1 : -1;
    }

    const firstUnseenHigher = getUnseenHigherCardCount(firstCard);
    const secondUnseenHigher = getUnseenHigherCardCount(secondCard);

    if (secondUnseenHigher !== firstUnseenHigher) {
      return secondUnseenHigher - firstUnseenHigher;
    }

    return getCardDangerScore(firstCard) - getCardDangerScore(secondCard);
  }

  function chooseSafeLeadCard(playerId, standardCards, jokerCards) {
    if (standardCards.length) {
      return [...standardCards].sort(sortBySafeLead)[0];
    }

    return jokerCards[0] || null;
  }

  function chooseSafeFollowCard(playerId, standardCards, jokerCards) {
    const losingStandardCards = standardCards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));

    if (losingStandardCards.length) {
      return [...losingStandardCards].sort((firstCard, secondCard) => {
        return getCardDangerScore(secondCard) - getCardDangerScore(firstCard);
      })[0];
    }

    if (jokerCards.length) {
      return [...jokerCards].sort(compareBotCards)[0];
    }

    return [...standardCards].sort((firstCard, secondCard) => {
      return getCardDangerScore(firstCard) - getCardDangerScore(secondCard);
    })[0] || null;
  }

  function getPlayerJokerLeadsThisGame(playerId) {
    return state.playedCards.filter((play) => {
      return play.player?.id === playerId && play.card?.type === "joker" && play.jokerMode === "lead";
    });
  }

  function getAllJokerLeadSuitsThisGame() {
    return state.playedCards
      .filter((play) => play.card?.type === "joker" && play.jokerMode === "lead" && play.jokerSuit)
      .map((play) => play.jokerSuit);
  }

  function getTotalSuitCards(suit) {
    return suit === "clubs" || suit === "spades" ? 8 : 9;
  }

  function getKnownOwnSuitCount(playerId, suit) {
    return (state.hands[playerId] || []).filter((card) => card?.type === "standard" && card.suit === suit).length;
  }

  function getUnseenSuitCountForPlayer(playerId, suit) {
    const playedCount = getPlayedStandardCards(suit).length;
    const ownCount = getKnownOwnSuitCount(playerId, suit);

    return Math.max(0, getTotalSuitCards(suit) - playedCount - ownCount);
  }

  function getSuitMemoryScore(playerId, suit, previousOwnSuits, previousAllSuits) {
    const trumpSuit = getTrumpSuit();
    const unseenCount = getUnseenSuitCountForPlayer(playerId, suit);
    const playedCount = getPlayedStandardCards(suit).length;
    const ownCount = getKnownOwnSuitCount(playerId, suit);
    const repeatedBySelfPenalty = previousOwnSuits.has(suit) ? 36 : 0;
    const repeatedByTablePenalty = previousAllSuits.includes(suit) ? 12 : 0;
    const trumpPenalty = suit === trumpSuit ? 24 : 0;
    const emptyPenalty = unseenCount <= 0 ? 50 : 0;
    const tooKnownPenalty = ownCount >= 3 ? 8 : 0;

    return unseenCount * 12 + playedCount * 2 - repeatedBySelfPenalty - repeatedByTablePenalty - trumpPenalty - emptyPenalty - tooKnownPenalty;
  }

  function chooseMemoryJokerSuit(playerId) {
    const previousOwnSuits = new Set(
      getPlayerJokerLeadsThisGame(playerId)
        .map((play) => play.jokerSuit)
        .filter(Boolean),
    );
    const previousAllSuits = getAllJokerLeadSuitsThisGame();
    const trumpSuit = getTrumpSuit();
    const allSuits = FIXED_TRUMP_BY_GAME;
    const smartChoice = Math.random() < 0.62;
    const scoredSuits = allSuits
      .map((suit) => ({
        suit,
        score: getSuitMemoryScore(playerId, suit, previousOwnSuits, previousAllSuits),
      }))
      .sort((first, second) => second.score - first.score);

    if (smartChoice) {
      return scoredSuits[0]?.suit || allSuits[0];
    }

    const humanLikePool = scoredSuits
      .filter((item) => !previousOwnSuits.has(item.suit))
      .filter((item) => item.suit !== trumpSuit || Math.random() < 0.28)
      .slice(0, 3);
    const fallbackPool = humanLikePool.length ? humanLikePool : scoredSuits.slice(0, 3);

    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)]?.suit || scoredSuits[0]?.suit || allSuits[0];
  }

  chooseLeadJokerSuit = function smarterChooseLeadJokerSuit(playerId) {
    return chooseMemoryJokerSuit(playerId);
  };

  function chooseDifferentJokerSuit(playerId) {
    return chooseMemoryJokerSuit(playerId);
  }

  chooseLeadJokerAction = function smarterChooseLeadJokerAction(playerId) {
    if (!shouldPlayerTakeTrick(playerId)) {
      return {
        jokerCommand: "take",
        jokerSuit: chooseDifferentJokerSuit(playerId),
      };
    }

    const baseAction = originalChooseLeadJokerAction(playerId);

    if (baseAction.jokerCommand === "high" && shouldLeadHighTrumpJoker(playerId)) {
      return baseAction;
    }

    return {
      ...baseAction,
      jokerSuit: chooseMemoryJokerSuit(playerId),
    };
  };

  chooseBotCard = function smarterChooseBotCard(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    const candidates = legalCards.length ? legalCards : hand;
    const wantsTrick = shouldPlayerTakeTrick(playerId);
    const standardCards = candidates.filter((card) => card.type !== "joker");
    const jokerCards = candidates.filter((card) => card.type === "joker");
    const preserveLastJoker = shouldPreserveLastJoker(playerId);

    if (!state.currentTrick.length) {
      if (!wantsTrick) {
        return chooseSafeLeadCard(playerId, standardCards, jokerCards);
      }

      if (!preserveLastJoker && jokerCards.length && shouldLeadHighTrumpJoker(playerId)) {
        return [...jokerCards].sort(compareBotCards)[0];
      }

      if (!preserveLastJoker && shouldSpendJokerNow(playerId) && jokerCards.length && !hasStrongLeadCard(standardCards)) {
        return [...jokerCards].sort(compareBotCards)[0];
      }

      return [...standardCards, ...jokerCards].sort(compareBotLeadHighCards)[0];
    }

    if (!wantsTrick) {
      return chooseSafeFollowCard(playerId, standardCards, jokerCards);
    }

    const highLeadJokerPlay = getHighLeadJokerPlay();

    if (highLeadJokerPlay?.jokerSuit) {
      const requestedSuitCards = standardCards.filter((card) => card.suit === highLeadJokerPlay.jokerSuit);

      if (requestedSuitCards.length) {
        return [...requestedSuitCards].sort(compareBotLeadHighCards)[0];
      }
    }

    const standardWinningCards = standardCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (standardWinningCards.length) {
      return [...standardWinningCards].sort(compareBotCards)[0];
    }

    const jokerWinningCards = jokerCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (
      jokerWinningCards.length &&
      !preserveLastJoker &&
      (shouldSpendJokerNow(playerId) || shouldBeatStrongTrumpWithJoker(playerId))
    ) {
      return [...jokerWinningCards].sort(compareBotCards)[0];
    }

    return [...standardCards, ...jokerCards].sort(compareBotCards)[0];
  };
})();
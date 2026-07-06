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

  function getUnseenSuitCount(suit) {
    const playedCount = getPlayedStandardCards(suit).length;
    const ownCount = Object.values(state.hands || {})
      .flat()
      .filter((card) => card?.type === "standard" && card.suit === suit).length;

    return Math.max(0, 9 - playedCount - ownCount);
  }

  function chooseDifferentJokerSuit(playerId) {
    const previousSuits = new Set(
      getPlayerJokerLeadsThisGame(playerId)
        .map((play) => play.jokerSuit)
        .filter(Boolean),
    );
    const trumpSuit = getTrumpSuit();

    const suits = SUITS.map((suit) => suit.id)
      .filter((suit) => !previousSuits.has(suit))
      .sort((firstSuit, secondSuit) => {
        if ((firstSuit === trumpSuit) !== (secondSuit === trumpSuit)) {
          return firstSuit === trumpSuit ? 1 : -1;
        }

        return getUnseenSuitCount(secondSuit) - getUnseenSuitCount(firstSuit);
      });

    return suits[0] || SUITS.find((suit) => suit.id !== trumpSuit)?.id || chooseLeadJokerSuit(playerId);
  }

  chooseLeadJokerAction = function smarterChooseLeadJokerAction(playerId) {
    if (!shouldPlayerTakeTrick(playerId)) {
      return {
        jokerCommand: "take",
        jokerSuit: chooseDifferentJokerSuit(playerId),
      };
    }

    return originalChooseLeadJokerAction(playerId);
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

      if (!preserveLastJoker && shouldSpendJokerNow(playerId) && jokerCards.length && !hasStrongLeadCard(playerId, standardCards)) {
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
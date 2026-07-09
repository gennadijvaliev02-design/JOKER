(() => {
  const originalChooseBotCard = chooseBotCard;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getTotalTrumpCount() {
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit) {
      return 0;
    }

    return RANKS.length - (trumpSuit === "spades" || trumpSuit === "clubs" ? 1 : 0);
  }

  function getPlayedTrumpCount() {
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit) {
      return 0;
    }

    return state.playedCards.filter((play) => play.card?.type === "standard" && play.card.suit === trumpSuit).length;
  }

  function getOwnTrumpCards(playerId) {
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit) {
      return [];
    }

    return (state.hands[playerId] || []).filter((card) => card.type === "standard" && card.suit === trumpSuit);
  }

  function getTrumpInfo(playerId) {
    const total = getTotalTrumpCount();
    const played = getPlayedTrumpCount();
    const own = getOwnTrumpCards(playerId).length;
    const remaining = Math.max(0, total - played);
    const unseen = Math.max(0, remaining - own);

    return { total, played, own, remaining, unseen };
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

  function getNeededTricks(playerId) {
    const player = getPlayerById(playerId);
    return Math.max(0, getPlayerTarget(player) - (player?.tricks || 0));
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

  function sortLow(cards) {
    return [...cards].sort(compareBotCards);
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => compareBotCards(second, first));
  }

  function getWinningCards(playerId, cards) {
    return cards.filter((card) => card.type === "standard" && wouldCardWinCurrentTrick(playerId, card));
  }

  function getLosingCards(playerId, cards) {
    return cards.filter((card) => card.type === "standard" && !wouldCardWinCurrentTrick(playerId, card));
  }

  function currentWinnerIsTrump() {
    return isTrump(getCurrentWinningPlay()?.card);
  }

  function currentWinnerIsJoker() {
    return getCurrentWinningPlay()?.card?.type === "joker";
  }

  function shouldSpendTrumpToTake(playerId, trumpInfo, winningTrumps) {
    const remainingCards = state.hands[playerId]?.length || 0;
    const needed = getNeededTricks(playerId);

    if (!winningTrumps.length || needed <= 0 || currentWinnerIsJoker()) {
      return false;
    }

    if (needed >= remainingCards) {
      return true;
    }

    if (!currentWinnerIsTrump()) {
      return true;
    }

    if (remainingCards <= 3) {
      return true;
    }

    return trumpInfo.unseen <= 1 || trumpInfo.own > needed;
  }

  function chooseFollowWithTrumpCounting(playerId, legalCards, originalCard) {
    const wantsTrick = shouldPlayerTakeTrick(playerId);
    const trumpInfo = getTrumpInfo(playerId);
    const standardCards = legalCards.filter((card) => card.type === "standard");
    const trumpCards = standardCards.filter(isTrump);
    const nonTrumpCards = standardCards.filter((card) => !isTrump(card));

    if (!trumpCards.length) {
      return originalCard;
    }

    if (wantsTrick) {
      const winningTrumps = getWinningCards(playerId, trumpCards);

      if (shouldSpendTrumpToTake(playerId, trumpInfo, winningTrumps)) {
        return sortLow(winningTrumps)[0];
      }

      return originalCard;
    }

    if (isTrump(originalCard) && nonTrumpCards.length) {
      const losingNonTrumps = getLosingCards(playerId, nonTrumpCards);

      if (losingNonTrumps.length) {
        return sortHigh(losingNonTrumps)[0];
      }

      return sortLow(nonTrumpCards)[0];
    }

    return originalCard;
  }

  function chooseLeadWithTrumpCounting(playerId, legalCards, originalCard) {
    const wantsTrick = shouldPlayerTakeTrick(playerId);
    const trumpInfo = getTrumpInfo(playerId);
    const needed = getNeededTricks(playerId);
    const standardCards = legalCards.filter((card) => card.type === "standard");
    const trumpCards = standardCards.filter(isTrump);
    const nonTrumpCards = standardCards.filter((card) => !isTrump(card));

    if (!trumpCards.length) {
      return originalCard;
    }

    if (!wantsTrick && isTrump(originalCard) && nonTrumpCards.length) {
      return sortLow(nonTrumpCards)[0];
    }

    if (!wantsTrick) {
      return originalCard;
    }

    const highTrump = sortHigh(trumpCards)[0];
    const controlsTrumps = trumpInfo.own >= Math.max(2, trumpInfo.unseen);
    const needsMultiple = needed >= 2;
    const hasStrongTrump = highTrump && RANK_POWER[highTrump.rank] >= RANK_POWER.Q;

    if ((controlsTrumps && needsMultiple) || (hasStrongTrump && trumpInfo.unseen <= 2)) {
      return highTrump;
    }

    return originalCard;
  }

  chooseBotCard = function trumpCountingChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !originalCard || !getTrumpSuit() || state.phase !== "playing") {
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
      return chooseLeadWithTrumpCounting(playerId, legalCards, originalCard);
    }

    return chooseFollowWithTrumpCounting(playerId, legalCards, originalCard);
  };
})();

(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalShouldSpendJokerNow = shouldSpendJokerNow;
  const originalShouldLeadHighTrumpJoker = shouldLeadHighTrumpJoker;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function getBotTarget(player) {
    if (!player || player.bid === "pass") return 0;
    return isFourHundredPulka() ? 3 : player.bid;
  }

  function getNeededTricks(playerId) {
    const player = getPlayerById(playerId);
    return getBotTarget(player) - player.tricks;
  }

  function isBotBroken(playerId) {
    const player = getPlayerById(playerId);
    if (!player) return false;

    if (player.bid === "pass") {
      return player.tricks > 0;
    }

    return player.tricks > player.bid;
  }

  function hasJoker(cards) {
    return cards.some((card) => card.type === "joker");
  }

  function getLegalCandidates(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getSuitGroupsFromCards(cards) {
    const groups = new Map();

    for (const card of getStandardCards(cards)) {
      const suitCards = groups.get(card.suit) || [];
      suitCards.push(card);
      groups.set(card.suit, suitCards);
    }

    return groups;
  }

  function isStrongNormalCard(card) {
    if (!card || card.type !== "standard") return false;

    const trumpSuit = getTrumpSuit();
    const isTrump = trumpSuit && card.suit === trumpSuit;

    if (card.rank === "A") return true;
    if (isTrump && RANK_POWER[card.rank] >= RANK_POWER.Q) return true;
    if (isLikelyHighCard(card)) return true;

    return false;
  }

  function compareStrongNormalCards(firstCard, secondCard) {
    const firstPower = getBotAttackPower(firstCard);
    const secondPower = getBotAttackPower(secondCard);

    if (firstPower !== secondPower) {
      return secondPower - firstPower;
    }

    return compareBotCards(secondCard, firstCard);
  }

  function chooseStrongNormalBeforeJoker(playerId, standardCards) {
    const strongCards = standardCards.filter(isStrongNormalCard);

    if (strongCards.length) {
      return [...strongCards].sort(compareStrongNormalCards)[0];
    }

    return null;
  }

  function getControlCardCount(playerId, candidates = getLegalCandidates(playerId)) {
    const trumpSuit = getTrumpSuit();

    return candidates.filter((card) => {
      if (card.type === "joker") return true;
      if (card.rank === "A") return true;
      if (trumpSuit && card.suit === trumpSuit && RANK_POWER[card.rank] >= RANK_POWER.J) return true;
      if (isLikelyHighCard(card)) return true;
      return false;
    }).length;
  }

  function canAffordSetupMove(playerId) {
    const player = getPlayerById(playerId);
    if (!player || player.bid === "pass" || isBotBroken(playerId)) return false;

    const target = getBotTarget(player);
    const neededTricks = target - player.tricks;
    const remainingCards = state.hands[playerId]?.length || 0;

    if (neededTricks <= 0) return false;

    // Если нужно брать почти всё подряд, не устраиваем красивые тактики — просто спасаем заказ.
    return remainingCards > neededTricks + 1;
  }

  function chooseSingletonVoidLead(playerId, candidates) {
    const trumpSuit = getTrumpSuit();
    if (!trumpSuit || !canAffordSetupMove(playerId)) return null;

    const player = getPlayerById(playerId);
    const neededTricks = getBotTarget(player) - player.tricks;
    const trumpCards = getSuitCards(playerId, trumpSuit);
    const controlCount = getControlCardCount(playerId, candidates);

    if (neededTricks <= 0 || trumpCards.length < 2 || controlCount < 2) return null;

    const singletons = [...getSuitGroupsFromCards(candidates).entries()]
      .filter(([suit, cards]) => suit !== trumpSuit && cards.length === 1)
      .map(([, cards]) => cards[0])
      .filter((card) => RANK_POWER[card.rank] <= RANK_POWER.Q);

    if (!singletons.length) return null;

    return [...singletons].sort(compareBotCards)[0];
  }

  function chooseTrumpDrainLead(playerId, candidates) {
    const trumpSuit = getTrumpSuit();
    if (!trumpSuit || !canAffordSetupMove(playerId)) return null;

    const player = getPlayerById(playerId);
    const neededTricks = getBotTarget(player) - player.tricks;
    const controlCount = getControlCardCount(playerId, candidates);

    if (neededTricks <= 0 || controlCount < 3) return null;

    const longWeakSuits = [...getSuitGroupsFromCards(candidates).entries()]
      .filter(([suit, cards]) => suit !== trumpSuit && cards.length >= 3)
      .map(([suit, cards]) => ({
        suit,
        cards: [...cards].sort(compareBotCards),
        weakCount: cards.filter((card) => RANK_POWER[card.rank] <= RANK_POWER[10]).length,
      }))
      .filter((group) => group.weakCount >= 2)
      .sort((first, second) => {
        if (second.cards.length !== first.cards.length) return second.cards.length - first.cards.length;
        return second.weakCount - first.weakCount;
      });

    if (!longWeakSuits.length) return null;

    return longWeakSuits[0].cards[0];
  }

  function chooseSetupLeadCard(playerId, candidates) {
    if (state.currentTrick.length) return null;
    if (shouldPreserveJokerForFinalTrick(playerId)) return null;

    const singletonVoidLead = chooseSingletonVoidLead(playerId, candidates);
    if (singletonVoidLead) return singletonVoidLead;

    const trumpDrainLead = chooseTrumpDrainLead(playerId, candidates);
    if (trumpDrainLead) return trumpDrainLead;

    return null;
  }

  function chooseBrokenSpoilerCard(playerId, candidates) {
    const standardCards = candidates.filter((card) => card.type !== "joker");
    const jokerCards = candidates.filter((card) => card.type === "joker");

    if (!state.currentTrick.length) {
      const aggressiveStandard = [...standardCards].sort(compareBotLeadHighCards)[0];
      return aggressiveStandard || [...jokerCards].sort(compareBotCards)[0] || null;
    }

    const winningStandardCards = standardCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandardCards.length) {
      return [...winningStandardCards].sort(compareBotCards)[0];
    }

    const winningJokers = jokerCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningJokers.length) {
      return [...winningJokers].sort(compareBotCards)[0];
    }

    return [...standardCards, ...jokerCards].sort(compareBotCards).at(-1) || null;
  }

  function shouldPreserveJokerForFinalTrick(playerId) {
    const player = getPlayerById(playerId);
    if (!player || player.bid === "pass" || isBotBroken(playerId)) return false;

    const candidates = getLegalCandidates(playerId);
    const neededTricks = getNeededTricks(playerId);

    return neededTricks === 1 && hasJoker(candidates);
  }

  chooseBotCard = function polishedChooseBotCard(playerId) {
    const candidates = getLegalCandidates(playerId);
    const standardCards = candidates.filter((card) => card.type !== "joker");

    if (isBotBroken(playerId)) {
      const spoilerCard = chooseBrokenSpoilerCard(playerId, candidates);
      if (spoilerCard) return spoilerCard;
    }

    if (shouldPreserveJokerForFinalTrick(playerId)) {
      if (!state.currentTrick.length) {
        const strongNormalCard = chooseStrongNormalBeforeJoker(playerId, standardCards);
        if (strongNormalCard) return strongNormalCard;
      } else {
        const winningStandardCards = standardCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));
        if (winningStandardCards.length) {
          return [...winningStandardCards].sort(compareBotCards)[0];
        }
      }
    }

    const setupLeadCard = chooseSetupLeadCard(playerId, candidates);
    if (setupLeadCard) return setupLeadCard;

    return originalChooseBotCard(playerId);
  };

  shouldSpendJokerNow = function polishedShouldSpendJokerNow(playerId) {
    if (shouldPreserveJokerForFinalTrick(playerId)) {
      const candidates = getLegalCandidates(playerId);
      const standardCards = candidates.filter((card) => card.type !== "joker");

      if (!state.currentTrick.length && chooseStrongNormalBeforeJoker(playerId, standardCards)) {
        return false;
      }

      if (state.currentTrick.length && standardCards.some((card) => wouldCardWinCurrentTrick(playerId, card))) {
        return false;
      }
    }

    return originalShouldSpendJokerNow(playerId);
  };

  shouldLeadHighTrumpJoker = function polishedShouldLeadHighTrumpJoker(playerId) {
    if (shouldPreserveJokerForFinalTrick(playerId)) {
      const standardCards = getLegalCandidates(playerId).filter((card) => card.type !== "joker");

      if (chooseStrongNormalBeforeJoker(playerId, standardCards)) {
        return false;
      }
    }

    return originalShouldLeadHighTrumpJoker(playerId);
  };

  chooseLeadJokerAction = function polishedChooseLeadJokerAction(playerId) {
    const player = getPlayerById(playerId);
    const target = getBotTarget(player);

    if (player && target > 0 && player.tricks >= target) {
      return {
        jokerCommand: "take",
        jokerSuit: chooseLeadJokerSuit(playerId),
      };
    }

    return originalChooseLeadJokerAction(playerId);
  };
})();

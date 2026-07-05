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

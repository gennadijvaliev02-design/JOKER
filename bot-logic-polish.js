(() => {
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

  function isSafeExitCard(card, trumpSuit) {
    return card.type === "standard"
      && (!trumpSuit || card.suit !== trumpSuit)
      && RANK_POWER[card.rank] <= RANK_POWER[10]
      && !isLikelyHighCard(card);
  }

  function getSafeExitCardsAfterJoker(playerId) {
    const trumpSuit = getTrumpSuit();
    return (state.hands[playerId] || [])
      .filter((card) => isSafeExitCard(card, trumpSuit))
      .sort(compareBotCards);
  }

  function hasSafeExitAfterJoker(playerId) {
    const trumpSuit = getTrumpSuit();
    return (state.hands[playerId] || []).some((card) => isSafeExitCard(card, trumpSuit));
  }

  function chooseSafeJokerSuit(playerId) {
    return getSafeExitCardsAfterJoker(playerId)[0]?.suit || chooseLeadJokerSuit(playerId);
  }

  function shouldPreserveJokerForFinalTrick(playerId) {
    const player = getPlayerById(playerId);
    if (!player || player.bid === "pass" || isBotBroken(playerId)) return false;

    const candidates = getLegalCandidates(playerId);
    const neededTricks = getNeededTricks(playerId);

    return neededTricks === 1 && hasJoker(candidates);
  }

  /*
   * The old chooseBotCard wrapper from this file was replaced unconditionally
   * by bot-memory-polish.js before a game can start. Keep only the joker policy
   * that remains observable in the current strategy chain.
   */
  shouldSpendJokerNow = function polishedShouldSpendJokerNow(playerId) {
    if (shouldPreserveJokerForFinalTrick(playerId)) {
      const candidates = getLegalCandidates(playerId);
      const standardCards = candidates.filter((card) => card.type !== "joker");
      const remainingCards = state.hands[playerId]?.length || 0;

      if (remainingCards > 2 && !hasSafeExitAfterJoker(playerId)) {
        return false;
      }

      if (!state.currentTrick.length) {
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
      return false;
    }

    return originalShouldLeadHighTrumpJoker(playerId);
  };

  chooseLeadJokerAction = function polishedChooseLeadJokerAction(playerId) {
    const player = getPlayerById(playerId);
    const target = getBotTarget(player);

    if (shouldPreserveJokerForFinalTrick(playerId)) {
      return {
        jokerCommand: "take",
        jokerSuit: chooseSafeJokerSuit(playerId),
      };
    }

    if (player && target > 0 && player.tricks >= target) {
      return {
        jokerCommand: "take",
        jokerSuit: chooseLeadJokerSuit(playerId),
      };
    }

    return originalChooseLeadJokerAction(playerId);
  };
})();

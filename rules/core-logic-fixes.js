(function () {
  if (typeof state === "undefined") {
    console.warn("Joker core logic fixes: game state is unavailable.");
    return;
  }

  function findCardHolderId(card) {
    if (!card?.id) {
      return null;
    }

    for (const [playerId, hand] of Object.entries(state.hands || {})) {
      if ((hand || []).some((handCard) => handCard.id === card.id)) {
        return playerId;
      }
    }

    return null;
  }

  getUnseenHigherCardCount = function getUnseenHigherCardCountWithOwnHand(card, viewerId = null) {
    if (card?.type !== "standard") {
      return 0;
    }

    const resolvedViewerId = viewerId || findCardHolderId(card);
    const ownHigherRanks = new Set(
      (state.hands[resolvedViewerId] || [])
        .filter((handCard) => {
          return handCard.type === "standard"
            && handCard.suit === card.suit
            && RANK_POWER[handCard.rank] > RANK_POWER[card.rank];
        })
        .map((handCard) => handCard.rank),
    );
    const playedHigherRanks = new Set(
      getPlayedStandardCards(card.suit)
        .filter((playedCard) => RANK_POWER[playedCard.rank] > RANK_POWER[card.rank])
        .map((playedCard) => playedCard.rank),
    );

    return RANKS.filter((rank) => {
      return RANK_POWER[rank] > RANK_POWER[card.rank]
        && !ownHigherRanks.has(rank)
        && !playedHigherRanks.has(rank);
    }).length;
  };

  wouldCardWinCurrentTrick = function stableWouldCardWinCurrentTrick(playerId, card) {
    if (!card) {
      return false;
    }

    const isLeadJoker = card.type === "joker" && state.currentTrick.length === 0;
    const leadAction = isLeadJoker ? chooseLeadJokerAction(playerId) : null;
    const jokerMode = card.type === "joker"
      ? (isLeadJoker ? "lead" : chooseJokerMode(playerId, card))
      : null;
    const simulatedPlay = {
      player: getPlayerById(playerId),
      card,
      jokerMode,
      jokerCommand: leadAction?.jokerCommand || null,
      jokerSuit: leadAction?.jokerSuit || null,
      order: state.currentTrick.length,
    };

    state.currentTrick.push(simulatedPlay);

    try {
      const winner = state.currentTrick.length === state.players.length
        ? getTrickWinner()
        : getCurrentWinningPlay();
      return winner?.player?.id === playerId;
    } finally {
      state.currentTrick.pop();
    }
  };

  window.JokerCoreLogicFixes = Object.freeze({
    getUnseenHigherCardCount(card, viewerId) {
      return getUnseenHigherCardCount(card, viewerId);
    },
    findCardHolderId,
  });
})();

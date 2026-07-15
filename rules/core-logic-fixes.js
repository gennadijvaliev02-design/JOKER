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

  function isHigherStandardPlay(candidate, currentHighest) {
    return !currentHighest || RANK_POWER[candidate.card.rank] > RANK_POWER[currentHighest.card.rank];
  }

  getHighestStandardPlay = function getHighestStandardPlayInOnePass(plays) {
    let highestPlay = null;

    for (const play of plays) {
      if (isHigherStandardPlay(play, highestPlay)) {
        highestPlay = play;
      }
    }

    return highestPlay || undefined;
  };

  getTrickWinner = function getTrickWinnerInOnePass() {
    const trumpSuit = state.trump?.type === "standard" ? state.trump.suit : null;
    let firstActivePlay = null;
    let leadSuit = null;
    let lastBeatJokerPlay = null;
    let highestTrumpPlay = null;
    let highestLeadSuitPlay = null;
    let highestJokerSuitPlay = null;

    for (const play of state.currentTrick) {
      if (play.jokerMode === "duck") {
        continue;
      }

      if (!firstActivePlay) {
        firstActivePlay = play;
        if (play.card.type !== "joker") leadSuit = play.card.suit;
      }

      if (play.card.type === "joker") {
        if (play.jokerMode === "beat") lastBeatJokerPlay = play;
        continue;
      }

      if (!leadSuit) leadSuit = play.card.suit;

      if (trumpSuit && play.card.suit === trumpSuit && isHigherStandardPlay(play, highestTrumpPlay)) {
        highestTrumpPlay = play;
      }

      if (
        firstActivePlay?.card.type === "joker"
        && firstActivePlay.jokerMode === "lead"
        && play.card.suit === firstActivePlay.jokerSuit
        && isHigherStandardPlay(play, highestJokerSuitPlay)
      ) {
        highestJokerSuitPlay = play;
      }

      if (play.card.suit === leadSuit && isHigherStandardPlay(play, highestLeadSuitPlay)) {
        highestLeadSuitPlay = play;
      }
    }

    if (lastBeatJokerPlay) {
      return lastBeatJokerPlay;
    }

    const leadJokerPlay = firstActivePlay?.card.type === "joker" && firstActivePlay.jokerMode === "lead"
      ? firstActivePlay
      : null;

    if (leadJokerPlay) {
      if (leadJokerPlay.jokerCommand === "take") {
        return highestTrumpPlay || highestJokerSuitPlay || leadJokerPlay;
      }

      if (leadJokerPlay.jokerSuit === trumpSuit) {
        return leadJokerPlay;
      }

      return highestTrumpPlay || leadJokerPlay;
    }

    return highestTrumpPlay || highestLeadSuitPlay || undefined;
  };

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

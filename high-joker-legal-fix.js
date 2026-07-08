(() => {
  const originalGetIllegalMoveReason = getIllegalMoveReason;

  function getHighLeadJokerPlayForRules() {
    const firstPlay = state.currentTrick?.[0];

    if (
      firstPlay?.card?.type === "joker" &&
      firstPlay.jokerMode === "lead" &&
      firstPlay.jokerCommand === "high" &&
      firstPlay.jokerSuit
    ) {
      return firstPlay;
    }

    return null;
  }

  function getHighestSuitCard(playerId, suit) {
    const suitCards = (state.hands[playerId] || []).filter((card) => card.type !== "joker" && card.suit === suit);

    if (!suitCards.length) {
      return null;
    }

    return [...suitCards].sort((firstCard, secondCard) => RANK_POWER[secondCard.rank] - RANK_POWER[firstCard.rank])[0];
  }

  function getSuitSymbol(suitId) {
    return SUITS.find((suit) => suit.id === suitId)?.symbol || "";
  }

  getIllegalMoveReason = function getIllegalMoveReasonWithHighJokerRule(playerId, card) {
    const highJokerPlay = getHighLeadJokerPlayForRules();

    if (highJokerPlay) {
      const highestSuitCard = getHighestSuitCard(playerId, highJokerPlay.jokerSuit);

      if (highestSuitCard && card.id !== highestSuitCard.id) {
        return `Нужно кинуть высшую ${getSuitSymbol(highJokerPlay.jokerSuit)}`;
      }
    }

    return originalGetIllegalMoveReason(playerId, card);
  };

  function shuffleBotSeats() {
    const seats = ["left", "top", "right"];

    for (let index = seats.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [seats[index], seats[swapIndex]] = [seats[swapIndex], seats[index]];
    }

    return seats;
  }

  applyVisualSeatsFromPlayerOrder = function applyRandomBotSeatsFromPlayerOrder() {
    const botSeats = shuffleBotSeats();
    let botSeatIndex = 0;

    state.players = state.players.map((player) => ({
      ...player,
      seat: player.id === "human" ? "bottom" : botSeats[botSeatIndex++],
    }));
  };

  const originalRender = render;

  render = function renderWithAceOrderBadgeFix(...args) {
    const result = originalRender.apply(this, args);
    const shouldShowOrder = state.phase !== "ace-deal";

    document.querySelectorAll("[data-order-badge]").forEach((badge) => {
      badge.style.visibility = shouldShowOrder ? "visible" : "hidden";
    });

    return result;
  };
})();

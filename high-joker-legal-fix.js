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
      if (card?.type === "joker") {
        return "";
      }

      const highestSuitCard = getHighestSuitCard(playerId, highJokerPlay.jokerSuit);

      if (highestSuitCard && card.id !== highestSuitCard.id) {
        return `Нужно кинуть высшую ${getSuitSymbol(highJokerPlay.jokerSuit)} или джокер`;
      }
    }

    return originalGetIllegalMoveReason(playerId, card);
  };

  const originalBuildPlayers = buildPlayers;

  function shuffleBotNames() {
    const names = ["Клод", "GPT", "Qwen"];

    for (let index = names.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [names[index], names[swapIndex]] = [names[swapIndex], names[index]];
    }

    return names;
  }

  buildPlayers = function buildPlayersWithRandomBotNames(playerName) {
    const players = originalBuildPlayers(playerName);
    const names = shuffleBotNames();
    let botNameIndex = 0;

    return players.map((player) => ({
      ...player,
      name: player.id === "human" ? player.name : names[botNameIndex++],
    }));
  };

})();

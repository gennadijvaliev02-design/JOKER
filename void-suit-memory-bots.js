(() => {
  const originalChooseBotCard = chooseBotCard;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getLeadSuitFromPlays(plays) {
    const firstPlay = plays[0];

    if (firstPlay?.card?.type === "joker" && firstPlay.jokerMode === "lead" && firstPlay.jokerSuit) {
      return firstPlay.jokerSuit;
    }

    return plays.find((play) => play.card?.type === "standard")?.card?.suit || null;
  }

  function getPlayedTricks() {
    const tricks = [];

    for (let index = 0; index < state.playedCards.length; index += state.players.length) {
      const trick = state.playedCards.slice(index, index + state.players.length);

      if (trick.length > 1) {
        tricks.push(trick);
      }
    }

    return tricks;
  }

  function getVoidSuitMap() {
    const map = new Map(state.players.map((player) => [player.id, new Set()]));
    const trumpSuit = getTrumpSuit();

    for (const trick of getPlayedTricks()) {
      const leadSuit = getLeadSuitFromPlays(trick);

      if (!leadSuit) {
        continue;
      }

      for (const play of trick.slice(1)) {
        const playerId = play.player?.id;
        const voids = map.get(playerId);

        if (!voids) {
          continue;
        }

        // A standard off-suit card proves the player has no lead suit.
        // A Joker proves nothing: under the "High" command a player may
        // intentionally answer with a Joker while still holding the suit.
        if (play.card?.type === "standard" && play.card.suit !== leadSuit) {
          voids.add(leadSuit);

          if (trumpSuit && play.card.suit !== trumpSuit) {
            voids.add(trumpSuit);
          }
        }
      }
    }

    return map;
  }

  function getOpponents(playerId) {
    return state.players.filter((player) => player.id !== playerId);
  }

  function getVoidCount(playerId, suit) {
    const voidMap = getVoidSuitMap();
    return getOpponents(playerId).filter((player) => voidMap.get(player.id)?.has(suit)).length;
  }

  function humanIsVoidIn(suit) {
    return getVoidSuitMap().get("human")?.has(suit) || false;
  }

  function getCardPower(card) {
    if (card.type === "joker") {
      return 100;
    }

    const trumpSuit = getTrumpSuit();
    const trumpBonus = trumpSuit && card.suit === trumpSuit ? 34 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
  }

  function scoreLeadForTaking(playerId, card) {
    const trumpSuit = getTrumpSuit();
    const isTrump = trumpSuit && card.suit === trumpSuit;
    const voidCount = getVoidCount(playerId, card.suit);
    const humanVoid = humanIsVoidIn(card.suit) ? 1 : 0;
    const voidPenalty = isTrump ? 0 : voidCount * 34 + humanVoid * 14;
    const aceSafety = card.rank === "A" && !isTrump && voidCount === 0 ? 18 : 0;

    return getCardPower(card) + aceSafety - voidPenalty;
  }

  function scoreLeadForDumping(playerId, card) {
    const trumpSuit = getTrumpSuit();
    const isTrump = trumpSuit && card.suit === trumpSuit;
    const voidCount = getVoidCount(playerId, card.suit);
    const humanVoid = humanIsVoidIn(card.suit) ? 1 : 0;
    const rankPenalty = RANK_POWER[card.rank] || 0;

    return voidCount * 14 + humanVoid * 6 - rankPenalty - (isTrump ? 45 : 0);
  }

  function chooseMemoryLeadCard(playerId, legalCards, wantsTrick) {
    const standardCards = legalCards.filter((card) => card.type === "standard");

    if (!standardCards.length) {
      return null;
    }

    const scored = standardCards
      .map((card) => ({
        card,
        score: wantsTrick ? scoreLeadForTaking(playerId, card) : scoreLeadForDumping(playerId, card),
      }))
      .sort((first, second) => second.score - first.score);

    return scored[0]?.card || null;
  }

  chooseBotCard = function voidSuitMemoryChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !originalCard || state.currentTrick.length > 0) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);
    const memoryCard = chooseMemoryLeadCard(playerId, legalCards, shouldPlayerTakeTrick(playerId));

    if (!memoryCard) {
      return originalCard;
    }

    if (originalCard.type === "joker") {
      return originalCard;
    }

    return memoryCard;
  };
})();

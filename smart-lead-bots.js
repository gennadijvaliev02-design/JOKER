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

  function getGoal(playerId) {
    const player = getPlayerById(playerId);
    const target = getPlayerTarget(player);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);
    const shouldAvoid = player?.bid === "pass" || tricks >= target;

    return {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: !shouldAvoid && needed > 0,
      shouldAvoid,
      desperate: !shouldAvoid && needed >= Math.max(1, cardsLeft),
      needsMultiple: !shouldAvoid && needed >= 2,
    };
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function getCardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    const trumpBonus = isTrump(card) ? 34 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
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

  function getLeadSuitFromTrick(trick) {
    const firstPlay = trick[0];

    if (firstPlay?.card?.type === "joker" && firstPlay.jokerMode === "lead" && firstPlay.jokerSuit) {
      return firstPlay.jokerSuit;
    }

    return trick.find((play) => play.card?.type === "standard")?.card?.suit || null;
  }

  function getVoidMap() {
    const map = new Map(state.players.map((player) => [player.id, new Set()]));
    const trumpSuit = getTrumpSuit();

    for (const trick of getPlayedTricks()) {
      const leadSuit = getLeadSuitFromTrick(trick);

      if (!leadSuit) {
        continue;
      }

      for (const play of trick.slice(1)) {
        const voids = map.get(play.player?.id);

        if (!voids) {
          continue;
        }

        if (play.card?.type === "standard" && play.card.suit !== leadSuit) {
          voids.add(leadSuit);

          if (trumpSuit && play.card.suit !== trumpSuit) {
            voids.add(trumpSuit);
          }
        }

        if (play.card?.type === "joker") {
          voids.add(leadSuit);
        }
      }
    }

    return map;
  }

  function getVoidCount(playerId, suit) {
    const voidMap = getVoidMap();
    return state.players.filter((player) => player.id !== playerId && voidMap.get(player.id)?.has(suit)).length;
  }

  function getOwnSuitCount(playerId, suit) {
    return (state.hands[playerId] || []).filter((card) => card.type === "standard" && card.suit === suit).length;
  }

  function getTrumpInfo(playerId) {
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit) {
      return { own: 0, unseen: 0, played: 0, total: 0 };
    }

    const total = RANKS.length - (trumpSuit === "spades" || trumpSuit === "clubs" ? 1 : 0);
    const played = state.playedCards.filter((play) => play.card?.type === "standard" && play.card.suit === trumpSuit).length;
    const own = getOwnSuitCount(playerId, trumpSuit);
    const unseen = Math.max(0, total - played - own);

    return { own, unseen, played, total };
  }

  function safeUnseenHigherCount(card) {
    if (typeof getUnseenHigherCardCount === "function") {
      return getUnseenHigherCardCount(card);
    }

    return RANKS.filter((rank) => RANK_POWER[rank] > RANK_POWER[card.rank]).length;
  }

  function scoreTakingLead(playerId, card, goal) {
    const trumpInfo = getTrumpInfo(playerId);
    const voidCount = getVoidCount(playerId, card.suit);
    const ownSuitCount = getOwnSuitCount(playerId, card.suit);
    const unseenHigher = safeUnseenHigherCount(card);
    const trump = isTrump(card);
    const highCardBonus = unseenHigher === 0 ? 24 : unseenHigher === 1 ? 10 : 0;
    const aceBonus = card.rank === "A" ? 16 : 0;
    const longSuitBonus = ownSuitCount >= 3 ? 8 : 0;
    const voidPenalty = trump ? 0 : voidCount * 32;
    const trumpControlBonus = trump && goal.needsMultiple && trumpInfo.own >= Math.max(2, trumpInfo.unseen) ? 34 : 0;
    const desperateBonus = goal.desperate && (trump || card.rank === "A") ? 22 : 0;

    return getCardPower(card) + highCardBonus + aceBonus + longSuitBonus + trumpControlBonus + desperateBonus - voidPenalty;
  }

  function scoreDumpLead(playerId, card) {
    const voidCount = getVoidCount(playerId, card.suit);
    const ownSuitCount = getOwnSuitCount(playerId, card.suit);
    const trumpPenalty = isTrump(card) ? 70 : 0;
    const rankPenalty = (RANK_POWER[card.rank] || 0) * 7;
    const safeVoidBonus = voidCount * 18;
    const longSuitDumpBonus = ownSuitCount >= 3 ? 8 : 0;

    return safeVoidBonus + longSuitDumpBonus - trumpPenalty - rankPenalty;
  }

  function chooseBestScored(cards, scoreFn) {
    return cards
      .map((card) => ({ card, score: scoreFn(card) }))
      .sort((first, second) => second.score - first.score)[0] || null;
  }

  function chooseSmartLead(playerId, legalCards) {
    const goal = getGoal(playerId);
    const standardCards = legalCards.filter((card) => card.type === "standard");

    if (!standardCards.length) {
      return null;
    }

    if (goal.shouldAvoid) {
      return chooseBestScored(standardCards, (card) => scoreDumpLead(playerId, card));
    }

    return chooseBestScored(standardCards, (card) => scoreTakingLead(playerId, card, goal));
  }

  function shouldReplaceOriginal(playerId, originalCard, smartChoice) {
    if (!smartChoice || smartChoice.card.id === originalCard.id || originalCard.type !== "standard") {
      return false;
    }

    const goal = getGoal(playerId);
    const originalScore = goal.shouldAvoid ? scoreDumpLead(playerId, originalCard) : scoreTakingLead(playerId, originalCard, goal);
    const threshold = goal.desperate ? 3 : goal.shouldAvoid ? 5 : 10;

    return smartChoice.score > originalScore + threshold;
  }

  chooseBotCard = function smartLeadChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !originalCard || originalCard.type === "joker" || state.phase !== "playing" || state.currentTrick.length !== 0) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);
    const smartChoice = chooseSmartLead(playerId, legalCards);

    if (!shouldReplaceOriginal(playerId, originalCard, smartChoice)) {
      return originalCard;
    }

    return smartChoice.card;
  };
})();

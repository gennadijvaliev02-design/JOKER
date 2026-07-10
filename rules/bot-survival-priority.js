(function () {
  if (typeof state === "undefined") {
    console.warn("Joker bot survival priority: game state is unavailable.");
    return;
  }

  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getTarget(player) {
    if (!player) {
      return 0;
    }

    if (isFourHundredPulka()) {
      return 3;
    }

    return player.bid === "pass" ? 0 : Number(player.bid || 0);
  }

  function getSurvivalState(playerId) {
    const player = getPlayerById(playerId);
    const target = getTarget(player);
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - (player?.tricks || 0));
    const zeroDanger = target > 0 && (player?.tricks || 0) === 0;
    const futureSafeCards = countLikelySafeCards(playerId);
    const mustFightNow = zeroDanger && (
      cardsLeft <= Math.max(3, target + 1)
      || needed >= Math.max(1, cardsLeft - 1)
      || futureSafeCards <= 1
    );
    const lastChance = zeroDanger && cardsLeft <= 1;

    return {
      player,
      target,
      cardsLeft,
      needed,
      zeroDanger,
      mustFightNow,
      lastChance,
      futureSafeCards,
    };
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 1000;
    }

    return (isTrump(card) ? 100 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function isLikelySafeLead(card, playerId) {
    if (card?.type === "joker") {
      return true;
    }

    if (card?.rank === "A") {
      return true;
    }

    if (isTrump(card) && RANK_POWER[card.rank] >= RANK_POWER.J) {
      return true;
    }

    return getUnseenHigherCardCount(card, playerId) === 0;
  }

  function countLikelySafeCards(playerId) {
    return (state.hands[playerId] || []).filter((card) => isLikelySafeLead(card, playerId)).length;
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function chooseLowestPower(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second))[0] || null;
  }

  function chooseSurvivalLead(playerId, legalCards, survival) {
    const standardCards = legalCards.filter((card) => card.type === "standard");
    const safeStandards = standardCards.filter((card) => isLikelySafeLead(card, playerId));

    if (safeStandards.length) {
      return chooseLowestPower(safeStandards);
    }

    const jokers = legalCards.filter((card) => card.type === "joker");
    if (jokers.length && (survival.lastChance || survival.futureSafeCards === 0)) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    const highTrumps = standardCards.filter((card) => isTrump(card));
    if (highTrumps.length && survival.lastChance) {
      return [...highTrumps].sort((first, second) => cardPower(second) - cardPower(first))[0];
    }

    return null;
  }

  function chooseSurvivalFollow(playerId, legalCards, survival) {
    const standardCards = legalCards.filter((card) => card.type === "standard");
    const winningStandards = standardCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winningStandards.length) {
      return chooseLowestPower(winningStandards);
    }

    const jokers = legalCards.filter((card) => card.type === "joker");
    if (jokers.length && (survival.lastChance || survival.mustFightNow)) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return null;
  }

  chooseBotCard = function chooseBotCardWithSurvivalPriority(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || state.phase !== "playing") {
      return originalCard;
    }

    const survival = getSurvivalState(playerId);
    if (!survival.mustFightNow) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);
    if (!legalCards.length) {
      return originalCard;
    }

    const survivalCard = state.currentTrick.length === 0
      ? chooseSurvivalLead(playerId, legalCards, survival)
      : chooseSurvivalFollow(playerId, legalCards, survival);

    if (survivalCard && legalCards.some((card) => card.id === survivalCard.id)) {
      return survivalCard;
    }

    return originalCard && legalCards.some((card) => card.id === originalCard.id)
      ? originalCard
      : chooseLowestPower(legalCards);
  };

  chooseJokerMode = function chooseJokerModeWithSurvivalPriority(playerId, card) {
    if (isBotId(playerId) && card?.type === "joker" && state.currentTrick.length > 0) {
      const survival = getSurvivalState(playerId);
      if (survival.mustFightNow) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseLeadJokerAction = function chooseLeadJokerActionWithSurvivalPriority(playerId) {
    if (isBotId(playerId)) {
      const survival = getSurvivalState(playerId);
      if (survival.mustFightNow) {
        return {
          jokerCommand: "high",
          jokerSuit: getTrumpSuit() || chooseLeadJokerSuit(playerId),
        };
      }
    }

    return originalChooseLeadJokerAction(playerId);
  };

  window.JokerBotSurvival = Object.freeze({
    inspect: getSurvivalState,
  });
})();

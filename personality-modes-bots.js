(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalShouldSpendJokerNow = shouldSpendJokerNow;
  const originalShouldLeadHighTrumpJoker = shouldLeadHighTrumpJoker;

  const PERSONALITIES = {
    "bot-1": {
      name: "Клод",
      style: "cautious",
      jokerAggression: 0.18,
      trumpAceJokerBeatChance: 0.18,
      saveJokerBias: 0.82,
    },
    "bot-2": {
      name: "GPT",
      style: "balanced",
      jokerAggression: 0.46,
      trumpAceJokerBeatChance: 0.42,
      saveJokerBias: 0.48,
    },
    "bot-3": {
      name: "Qwen",
      style: "aggressive",
      jokerAggression: 0.76,
      trumpAceJokerBeatChance: 0.7,
      saveJokerBias: 0.2,
    },
  };

  function getPersonality(playerId) {
    return PERSONALITIES[playerId] || null;
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
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
      urgent: !shouldAvoid && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
    };
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  function isTrumpAcePlay(play) {
    const trumpSuit = getTrumpSuit();
    return Boolean(
      trumpSuit &&
        play?.card?.type === "standard" &&
        play.card.suit === trumpSuit &&
        play.card.rank === "A",
    );
  }

  function currentWinnerIsTrumpAceAgainst(playerId) {
    const winner = getCurrentWinningPlay();
    return Boolean(winner && winner.player?.id !== playerId && isTrumpAcePlay(winner));
  }

  function canBreakTrumpAceWithJoker(playerId) {
    const goal = getGoal(playerId);

    if (!goal.needsTake) {
      return false;
    }

    if (goal.shouldAvoid) {
      return false;
    }

    return goal.urgent || goal.needed >= 2 || goal.cardsLeft <= 5;
  }

  function getTrickKey() {
    return state.currentTrick.map((play) => `${play.player?.id}:${play.card?.id}:${play.jokerMode || ""}`).join("|");
  }

  function setJokerIntent(playerId, card, mode, reason) {
    state.personalityJokerIntent = {
      playerId,
      cardId: card?.id,
      mode,
      reason,
      trickKey: getTrickKey(),
    };
  }

  function consumeJokerIntent(playerId, card) {
    const intent = state.personalityJokerIntent;

    if (!intent || intent.playerId !== playerId || intent.cardId !== card?.id || intent.trickKey !== getTrickKey()) {
      return null;
    }

    return intent;
  }

  function choosePersonalityJokerOnTrumpAce(playerId, legalCards) {
    const personality = getPersonality(playerId);

    if (!personality || !currentWinnerIsTrumpAceAgainst(playerId) || !canBreakTrumpAceWithJoker(playerId)) {
      return null;
    }

    const jokerCards = getJokerCards(legalCards);

    if (!jokerCards.length) {
      return null;
    }

    if (Math.random() > personality.trumpAceJokerBeatChance) {
      return null;
    }

    const joker = jokerCards.find((card) => card.color === "red") || jokerCards[0];
    setJokerIntent(playerId, joker, "beat", `${personality.name} personality beats trump ace`);
    return joker;
  }

  function shouldPersonalitySaveJoker(playerId) {
    const personality = getPersonality(playerId);
    const goal = getGoal(playerId);

    if (!personality || goal.desperate || goal.urgent) {
      return false;
    }

    return Math.random() < personality.saveJokerBias;
  }

  function shouldPersonalitySpendJoker(playerId) {
    const personality = getPersonality(playerId);
    const goal = getGoal(playerId);

    if (!personality || !goal.needsTake) {
      return false;
    }

    if (goal.desperate || goal.urgent) {
      return true;
    }

    return Math.random() < personality.jokerAggression;
  }

  shouldSpendJokerNow = function personalityShouldSpendJokerNow(playerId) {
    if (!isBotId(playerId)) {
      return originalShouldSpendJokerNow(playerId);
    }

    if (shouldPersonalitySaveJoker(playerId)) {
      return false;
    }

    if (shouldPersonalitySpendJoker(playerId)) {
      return true;
    }

    return originalShouldSpendJokerNow(playerId);
  };

  shouldLeadHighTrumpJoker = function personalityShouldLeadHighTrumpJoker(playerId) {
    const personality = getPersonality(playerId);
    const goal = getGoal(playerId);

    if (!personality) {
      return originalShouldLeadHighTrumpJoker(playerId);
    }

    if (goal.desperate || goal.urgent) {
      return originalShouldLeadHighTrumpJoker(playerId) || Math.random() < personality.jokerAggression;
    }

    if (personality.style === "cautious" && Math.random() < 0.65) {
      return false;
    }

    return originalShouldLeadHighTrumpJoker(playerId);
  };

  chooseJokerMode = function personalityChooseJokerMode(playerId, card) {
    if (!isBotId(playerId) || card?.type !== "joker" || !state.currentTrick.length) {
      return originalChooseJokerMode(playerId, card);
    }

    const intent = consumeJokerIntent(playerId, card);

    if (intent?.mode) {
      return intent.mode;
    }

    if (currentWinnerIsTrumpAceAgainst(playerId) && canBreakTrumpAceWithJoker(playerId)) {
      const personality = getPersonality(playerId);

      if (personality && Math.random() <= personality.trumpAceJokerBeatChance) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function personalityChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !state.phase || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length || !state.currentTrick.length) {
      return originalCard;
    }

    const jokerVsTrumpAce = choosePersonalityJokerOnTrumpAce(playerId, legalCards);

    if (jokerVsTrumpAce) {
      return jokerVsTrumpAce;
    }

    return originalCard;
  };
})();

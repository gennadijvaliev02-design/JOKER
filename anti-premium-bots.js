(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function getPlayerIndex(playerId) {
    return state.players.findIndex((player) => player.id === playerId);
  }

  function getCurrentPulkaRows() {
    const pulkaOffset = (state.currentPulka - 1) * 5;
    return state.scoreRows.slice(pulkaOffset, pulkaOffset + 4);
  }

  function getFulfilledGamesInCurrentPulka(playerId) {
    const playerIndex = getPlayerIndex(playerId);

    if (playerIndex < 0) {
      return 0;
    }

    return getCurrentPulkaRows()
      .slice(0, Math.max(0, state.currentGame - 1))
      .filter((row) => row.entries?.[playerIndex]?.fulfilled)
      .length;
  }

  function isPerfectPremiumRun(playerId) {
    const previousGames = Math.max(0, state.currentGame - 1);

    if (previousGames <= 0) {
      return false;
    }

    return getFulfilledGamesInCurrentPulka(playerId) === previousGames;
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

  function getAntiPremiumThreat() {
    const human = getPlayerById("human");

    if (!human || state.phase !== "playing" || human.bid === null) {
      return null;
    }

    const fulfilled = getFulfilledGamesInCurrentPulka("human");
    const perfectRun = isPerfectPremiumRun("human");
    const target = getPlayerTarget(human);
    const tricks = human.tricks || 0;
    const cardsLeft = state.hands.human?.length || 0;
    const gamesLeftAfterThis = Math.max(0, 4 - state.currentGame);
    const needsTricks = Math.max(0, target - tricks);
    const isProtectedRun = fulfilled >= 2 || (state.currentGame >= 3 && perfectRun);

    if (!isProtectedRun) {
      return null;
    }

    const shouldAvoidTaking = human.bid === "pass" || tricks >= target;
    const mustStillTake = !shouldAvoidTaking && needsTricks > 0;
    const danger = fulfilled * 2 + state.currentGame + (perfectRun ? 2 : 0) + (state.currentGame === 4 ? 3 : 0);

    return {
      playerId: "human",
      fulfilled,
      perfectRun,
      target,
      tricks,
      cardsLeft,
      gamesLeftAfterThis,
      needsTricks,
      mustStillTake,
      shouldAvoidTaking,
      danger,
      urgent: danger >= 8 || state.currentGame === 4 || cardsLeft <= 4,
    };
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getAttackPower(card) {
    if (typeof getBotAttackPower === "function") {
      return getBotAttackPower(card);
    }

    if (card.type === "joker") {
      return 100;
    }

    const trumpBonus = getTrumpSuit() && card.suit === getTrumpSuit() ? 30 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => getAttackPower(first) - getAttackPower(second));
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => getAttackPower(second) - getAttackPower(first));
  }

  function getWinningCards(playerId, cards) {
    return cards.filter((card) => wouldCardWinCurrentTrick(playerId, card));
  }

  function getLosingCards(playerId, cards) {
    return cards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));
  }

  function isTargetWinning(threat) {
    return getCurrentWinningPlay()?.player?.id === threat.playerId;
  }

  function isTargetAlreadyInTrick(threat) {
    return state.currentTrick.some((play) => play.player.id === threat.playerId);
  }

  function wouldHelpBreakTarget(playerId, card, threat) {
    if (!state.currentTrick.length) {
      return false;
    }

    const wins = wouldCardWinCurrentTrick(playerId, card);

    if (threat.mustStillTake) {
      return isTargetWinning(threat) && wins;
    }

    if (threat.shouldAvoidTaking) {
      return isTargetWinning(threat) && !wins;
    }

    return false;
  }

  function chooseAntiPremiumFollowCard(playerId, legalCards, threat) {
    const standardCards = legalCards.filter((card) => card.type !== "joker");
    const jokerCards = legalCards.filter((card) => card.type === "joker");
    const winningCards = getWinningCards(playerId, legalCards);
    const losingCards = getLosingCards(playerId, legalCards);

    if (threat.mustStillTake) {
      if (isTargetWinning(threat)) {
        const winningStandard = winningCards.filter((card) => card.type !== "joker");

        if (winningStandard.length) {
          return sortLow(winningStandard)[0];
        }

        if (threat.urgent && jokerCards.some((card) => wouldCardWinCurrentTrick(playerId, card))) {
          return sortLow(jokerCards.filter((card) => wouldCardWinCurrentTrick(playerId, card)))[0];
        }
      }

      if (!isTargetAlreadyInTrick(threat) && threat.urgent) {
        const pressureCards = sortHigh(standardCards.length ? standardCards : legalCards);
        return pressureCards[0] || null;
      }
    }

    if (threat.shouldAvoidTaking) {
      if (isTargetWinning(threat)) {
        const losingStandard = losingCards.filter((card) => card.type !== "joker");

        if (losingStandard.length) {
          return sortHigh(losingStandard)[0];
        }

        if (standardCards.length) {
          return sortLow(standardCards)[0];
        }
      }

      if (!isTargetAlreadyInTrick(threat)) {
        const softCards = sortLow(standardCards.length ? standardCards : legalCards);
        return softCards[0] || null;
      }
    }

    return null;
  }

  function chooseAntiPremiumLeadCard(playerId, legalCards, threat) {
    const standardCards = legalCards.filter((card) => card.type !== "joker");
    const jokerCards = legalCards.filter((card) => card.type === "joker");

    if (threat.mustStillTake) {
      const pressurePool = standardCards.length ? standardCards : legalCards;
      const pressureCard = sortHigh(pressurePool)[0];

      if (pressureCard && (threat.urgent || getAttackPower(pressureCard) >= 30)) {
        return pressureCard;
      }

      return pressureCard || null;
    }

    if (threat.shouldAvoidTaking) {
      const softPool = standardCards.length ? standardCards : legalCards.filter((card) => card.type !== "joker");
      return sortLow(softPool.length ? softPool : legalCards)[0] || null;
    }

    if (threat.urgent && jokerCards.length) {
      return sortHigh(jokerCards)[0];
    }

    return null;
  }

  function shouldSacrificeForAntiPremium(playerId, threat) {
    const bot = getPlayerById(playerId);

    if (!bot || !threat) {
      return false;
    }

    if (threat.urgent) {
      return true;
    }

    if (bot.bid === "pass") {
      return true;
    }

    const botTarget = getPlayerTarget(bot);
    const botTricks = bot.tricks || 0;
    const botSafe = bot.bid !== null && botTricks >= botTarget;

    return botSafe || Math.random() < 0.64;
  }

  chooseBotCard = function antiPremiumChooseBotCard(playerId) {
    const threat = getAntiPremiumThreat();
    const originalCard = originalChooseBotCard(playerId);

    if (!threat || playerId === threat.playerId || !playerId?.startsWith?.("bot-")) {
      return originalCard;
    }

    if (!shouldSacrificeForAntiPremium(playerId, threat)) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (legalCards.length <= 1) {
      return originalCard;
    }

    const antiCard = state.currentTrick.length
      ? chooseAntiPremiumFollowCard(playerId, legalCards, threat)
      : chooseAntiPremiumLeadCard(playerId, legalCards, threat);

    return antiCard || originalCard;
  };

  chooseJokerMode = function antiPremiumChooseJokerMode(playerId, card) {
    const threat = getAntiPremiumThreat();

    if (
      threat &&
      playerId?.startsWith?.("bot-") &&
      card?.type === "joker" &&
      state.currentTrick.length > 0 &&
      threat.mustStillTake &&
      isTargetWinning(threat) &&
      wouldCardWinCurrentTrick(playerId, card)
    ) {
      return "beat";
    }

    if (
      threat &&
      playerId?.startsWith?.("bot-") &&
      card?.type === "joker" &&
      state.currentTrick.length > 0 &&
      threat.shouldAvoidTaking
    ) {
      return "duck";
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseLeadJokerAction = function antiPremiumLeadJokerAction(playerId) {
    const threat = getAntiPremiumThreat();

    if (threat && playerId?.startsWith?.("bot-") && threat.mustStillTake && threat.urgent) {
      return {
        jokerCommand: "high",
        jokerSuit: getTrumpSuit() || chooseLeadJokerSuit(playerId),
      };
    }

    return originalChooseLeadJokerAction(playerId);
  };
})();

(() => {
  const STORAGE_KEY = "joker-medium-human-profile-v1";
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalWriteCurrentGameScore = writeCurrentGameScore;
  let cachedProfile = null;
  let cachedThreatLevel = null;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function defaultProfile() {
    return {
      version: 1,
      games: 0,
      fulfilled: 0,
      highBidGames: 0,
      highBidFulfilled: 0,
      passGames: 0,
      passBroken: 0,
      forcedOneGames: 0,
      forcedOneSurvived: 0,
      zeroSetups: 0,
      premiumThreats: 0,
      premiumLikely: 0,
    };
  }

  function readProfileFromStorage() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");

      if (parsed?.version === 1) {
        return { ...defaultProfile(), ...parsed };
      }
    } catch {
      // ignored
    }

    return defaultProfile();
  }

  function getProfile() {
    if (!cachedProfile) {
      cachedProfile = readProfileFromStorage();
    }

    return cachedProfile;
  }

  function loadProfile() {
    return { ...getProfile() };
  }

  function saveProfile(profile) {
    const snapshot = { ...defaultProfile(), ...profile };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      cachedProfile = snapshot;
      cachedThreatLevel = null;
    } catch {
      // localStorage can be unavailable; keep game safe.
    }
  }

  function getPlayerTarget(player) {
    if (!player || isFourHundredPulka()) {
      return isFourHundredPulka() ? 3 : 0;
    }

    if (player.bid === "pass") {
      return 0;
    }

    return Number(player.bid || 0);
  }

  function getHumanThreatLevel() {
    if (cachedThreatLevel !== null) {
      return cachedThreatLevel;
    }

    const profile = getProfile();

    if (profile.games < 4) {
      cachedThreatLevel = 0;
      return cachedThreatLevel;
    }

    const highBidRate = profile.highBidGames ? profile.highBidFulfilled / profile.highBidGames : 0;
    const passBreakRate = profile.passGames ? profile.passBroken / profile.passGames : 0;
    const forcedOneSurviveRate = profile.forcedOneGames ? profile.forcedOneSurvived / profile.forcedOneGames : 0;
    const premiumRate = profile.premiumThreats ? profile.premiumLikely / profile.premiumThreats : 0;
    let level = 0;

    if (highBidRate >= 0.55 && profile.highBidGames >= 2) level += 1;
    if (forcedOneSurviveRate >= 0.45 && profile.forcedOneGames >= 2) level += 1;
    if (premiumRate >= 0.5 && profile.premiumThreats >= 2) level += 1;
    if (passBreakRate <= 0.28 && profile.passGames >= 3) level += 1;

    cachedThreatLevel = Math.min(3, level);
    return cachedThreatLevel;
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 130;
    }

    return (isTrump(card) ? 48 : 0) + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  function getHumanGoal() {
    const human = getPlayerById("human");
    const target = getPlayerTarget(human);
    const tricks = human?.tricks || 0;
    const cardsLeft = state.hands.human?.length || 0;

    return {
      human,
      target,
      tricks,
      cardsLeft,
      needsTake: human?.bid !== "pass" && tricks < target,
      shouldAvoid: human?.bid === "pass" || tricks >= target,
      dangerousBid: Number(human?.bid || 0) >= 4,
      forcedOne: Boolean(human?.mediumForcedOneBid),
    };
  }

  function shouldPressureHuman() {
    const level = getHumanThreatLevel();
    const goal = getHumanGoal();

    return level > 0 && goal.human && (goal.dangerousBid || goal.forcedOne || goal.shouldAvoid || goal.cardsLeft <= 4);
  }

  function getCurrentWinnerId() {
    return getCurrentWinningPlay()?.player?.id || null;
  }

  function chooseHumanProfileFollow(botId, legalCards, originalCard) {
    if (!shouldPressureHuman()) {
      return null;
    }

    const goal = getHumanGoal();
    const standards = getStandardCards(legalCards);

    if (getCurrentWinnerId() === "human" && goal.needsTake) {
      const winners = standards.filter((card) => wouldCardWinCurrentTrick(botId, card));

      if (winners.length) {
        return sortLow(winners)[0];
      }

      const jokers = getJokerCards(legalCards);

      if (jokers.length && getHumanThreatLevel() >= 2) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }
    }

    if (getCurrentWinnerId() === "human" && goal.shouldAvoid) {
      const losing = standards.filter((card) => !wouldCardWinCurrentTrick(botId, card));

      if (losing.length) {
        return sortHigh(losing)[0];
      }
    }

    return null;
  }

  function chooseHumanProfileLead(botId, legalCards, originalCard) {
    if (!shouldPressureHuman()) {
      return null;
    }

    const goal = getHumanGoal();
    const standards = getStandardCards(legalCards);

    if (goal.needsTake) {
      const trumps = standards.filter(isTrump);

      if (trumps.length) {
        return sortHigh(trumps)[0];
      }

      const aces = standards.filter((card) => card.rank === "A");

      if (aces.length) {
        return sortHigh(aces)[0];
      }
    }

    if (goal.shouldAvoid) {
      const nonTrumps = standards.filter((card) => !isTrump(card));

      if (nonTrumps.length) {
        return sortLow(nonTrumps)[0];
      }
    }

    return null;
  }

  chooseJokerMode = function mediumHumanProfileJokerMode(playerId, card) {
    if (isMediumAi() && playerId?.startsWith?.("bot-") && card?.type === "joker" && state.currentTrick.length > 0) {
      const goal = getHumanGoal();

      if (getHumanThreatLevel() >= 2 && getCurrentWinnerId() === "human" && goal.needsTake) {
        return "beat";
      }
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseBotCard = function mediumHumanProfileChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !playerId?.startsWith?.("bot-") || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseHumanProfileLead(playerId, legalCards, originalCard) || originalCard;
    }

    return chooseHumanProfileFollow(playerId, legalCards, originalCard) || originalCard;
  };

  writeCurrentGameScore = function mediumHumanProfileWriteScore() {
    if (isMediumAi()) {
      const profile = { ...getProfile() };
      const human = getPlayerById("human");

      if (human) {
        const target = getPlayerTarget(human);
        const tricks = human.tricks || 0;
        const fulfilled = human.bid === "pass" ? tricks === 0 : tricks === target;

        profile.games += 1;
        if (fulfilled) profile.fulfilled += 1;

        if (Number(human.bid || 0) >= 4) {
          profile.highBidGames += 1;
          if (fulfilled) profile.highBidFulfilled += 1;
        }

        if (human.bid === "pass") {
          profile.passGames += 1;
          if (tricks > 0) profile.passBroken += 1;
        }

        if (human.mediumForcedOneBid) {
          profile.forcedOneGames += 1;
          if (tricks > 0) profile.forcedOneSurvived += 1;
          if (tricks === 0) profile.zeroSetups += 1;
        }

        if (state.currentGame >= 3) {
          profile.premiumThreats += 1;
          if (fulfilled) profile.premiumLikely += 1;
        }

        saveProfile(profile);
      }
    }

    return originalWriteCurrentGameScore();
  };

  window.JokerMediumHumanProfile = {
    load: loadProfile,
    reset() {
      const fresh = defaultProfile();
      saveProfile(fresh);
      return { ...fresh };
    },
    threatLevel: getHumanThreatLevel,
  };
})();

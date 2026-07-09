(() => {
  const originalChooseBotCard = chooseBotCard;
  const LEADER_GAP_TO_PRESS = 120;
  const BIG_LEADER_GAP = 260;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function safeMatchTotal(playerId) {
    try {
      return typeof calculateMatchTotal === "function" ? Number(calculateMatchTotal(playerId)) || 0 : 0;
    } catch {
      return 0;
    }
  }

  function getLeaderInfo() {
    const totals = state.players
      .map((player) => ({ player, total: safeMatchTotal(player.id) }))
      .sort((first, second) => second.total - first.total);
    const leader = totals[0];
    const second = totals[1];

    if (!leader || !second) {
      return null;
    }

    const tiedLeaders = totals.filter((item) => item.total === leader.total);
    const gap = leader.total - second.total;

    if (tiedLeaders.length > 1 || gap < LEADER_GAP_TO_PRESS) {
      return null;
    }

    return {
      player: leader.player,
      total: leader.total,
      gap,
      isBigLead: gap >= BIG_LEADER_GAP,
    };
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
    };
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    const trumpSuit = getTrumpSuit();
    const trumpBonus = trumpSuit && card.suit === trumpSuit ? 34 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function standardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function winningStandardCards(playerId, cards) {
    return standardCards(cards).filter((card) => wouldCardWinCurrentTrick(playerId, card));
  }

  function losingStandardCards(playerId, cards) {
    return standardCards(cards).filter((card) => !wouldCardWinCurrentTrick(playerId, card));
  }

  function currentWinnerId() {
    return getCurrentWinningPlay()?.player?.id || null;
  }

  function shouldSacrificeAgainstLeader(playerId, leaderInfo, selfGoal) {
    if (leaderInfo.isBigLead) {
      return true;
    }

    if (selfGoal.desperate) {
      return false;
    }

    if (selfGoal.shouldAvoid) {
      return false;
    }

    return Math.random() < 0.72;
  }

  function chooseFollowAgainstLeader(playerId, legalCards, originalCard, leaderInfo) {
    const leaderId = leaderInfo.player.id;
    const selfGoal = getGoal(playerId);
    const leaderGoal = getGoal(leaderId);
    const winnerId = currentWinnerId();

    if (winnerId !== leaderId) {
      return originalCard;
    }

    if (leaderGoal.needsTake) {
      const winners = winningStandardCards(playerId, legalCards);

      if (winners.length && shouldSacrificeAgainstLeader(playerId, leaderInfo, selfGoal)) {
        return sortLow(winners)[0];
      }
    }

    if (leaderGoal.shouldAvoid) {
      const losers = losingStandardCards(playerId, legalCards);

      if (losers.length) {
        return sortHigh(losers)[0];
      }
    }

    return originalCard;
  }

  function chooseLeadAgainstLeader(playerId, legalCards, originalCard, leaderInfo) {
    const leaderGoal = getGoal(leaderInfo.player.id);
    const selfGoal = getGoal(playerId);
    const standards = standardCards(legalCards);

    if (!standards.length) {
      return originalCard;
    }

    if (selfGoal.desperate) {
      return originalCard;
    }

    if (leaderGoal.needsTake) {
      const trumpSuit = getTrumpSuit();
      const trumpCards = standards.filter((card) => trumpSuit && card.suit === trumpSuit);

      if (!selfGoal.shouldAvoid && trumpCards.length && (leaderInfo.isBigLead || leaderGoal.desperate)) {
        return sortHigh(trumpCards)[0];
      }

      if (!selfGoal.shouldAvoid && leaderInfo.isBigLead) {
        return sortHigh(standards)[0];
      }
    }

    if (leaderGoal.shouldAvoid && !selfGoal.desperate) {
      const nonTrumpCards = standards.filter((card) => !(getTrumpSuit() && card.suit === getTrumpSuit()));
      return sortLow(nonTrumpCards.length ? nonTrumpCards : standards)[0];
    }

    return originalCard;
  }

  chooseBotCard = function leaderPressureChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !originalCard || originalCard.type === "joker" || state.phase !== "playing") {
      return originalCard;
    }

    const leaderInfo = getLeaderInfo();

    if (!leaderInfo || leaderInfo.player.id === playerId) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseLeadAgainstLeader(playerId, legalCards, originalCard, leaderInfo);
    }

    return chooseFollowAgainstLeader(playerId, legalCards, originalCard, leaderInfo);
  };
})();

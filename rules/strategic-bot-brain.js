(function () {
  if (typeof state === "undefined") {
    console.warn("Joker strategic bot brain: game state is unavailable.");
    return;
  }

  const originalChooseBotCard = chooseBotCard;
  const DEBUG = new URLSearchParams(window.location.search).get("brainDebug") === "1";

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function"
      && window.isAiDifficultyAtLeast("medium");
  }

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

  function getContext(playerId) {
    const player = getPlayerById(playerId);
    const target = getTarget(player);
    const tricks = player?.tricks || 0;
    const cardsLeft = state.hands[playerId]?.length || 0;
    const needed = Math.max(0, target - tricks);
    const isPass = player?.bid === "pass";
    const fulfilled = isPass ? tricks === 0 : tricks >= target;
    const zeroDanger = target > 0 && tricks === 0;
    const mustTakeEveryRemaining = needed > 0 && needed >= cardsLeft;

    return {
      player,
      playerId,
      target,
      tricks,
      cardsLeft,
      needed,
      isPass,
      fulfilled,
      zeroDanger,
      mustTakeEveryRemaining,
      onPremiumTrack: isPlayerOnPremiumTrack(playerId),
    };
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

  function rawCardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    return (isTrump(card) ? 25 : 0) + (RANK_POWER[card?.rank] || 0);
  }

  function getLeadWinProbability(card, playerId) {
    if (card?.type === "joker") {
      return 0.98;
    }

    const higherCards = getUnseenHigherCardCount(card, playerId);
    const rankPower = RANK_POWER[card?.rank] || 0;

    if (higherCards === 0 && isTrump(card)) {
      return 0.9;
    }

    if (higherCards === 0 && card?.rank === "A") {
      return 0.78;
    }

    if (higherCards === 0) {
      return 0.64;
    }

    if (isTrump(card)) {
      return Math.max(0.18, 0.68 - higherCards * 0.13);
    }

    return Math.max(0.08, 0.5 - higherCards * 0.11 + rankPower * 0.012);
  }

  function getImmediateWinProbability(playerId, card) {
    if (state.currentTrick.length === 0) {
      return getLeadWinProbability(card, playerId);
    }

    return wouldCardWinCurrentTrick(playerId, card) ? 1 : 0;
  }

  function getFutureSafety(card, playerId) {
    if (card?.type === "joker") {
      return 1;
    }

    const unseenHigher = getUnseenHigherCardCount(card, playerId);

    if (unseenHigher === 0 && isTrump(card)) {
      return 0.9;
    }

    if (unseenHigher === 0 && card?.rank === "A") {
      return 0.76;
    }

    if (unseenHigher === 0) {
      return 0.58;
    }

    if (isTrump(card)) {
      return Math.max(0.12, 0.58 - unseenHigher * 0.12);
    }

    return Math.max(0.04, 0.34 - unseenHigher * 0.08);
  }

  function getFutureSafeCount(playerId, excludedCardId) {
    return (state.hands[playerId] || []).reduce((sum, card) => {
      if (card.id === excludedCardId) {
        return sum;
      }

      return sum + getFutureSafety(card, playerId);
    }, 0);
  }

  function isPlayerOnPremiumTrack(playerId) {
    const playerIndex = state.players.findIndex((player) => player.id === playerId);
    if (playerIndex < 0) {
      return false;
    }

    const completedRows = state.scoreRows.filter((row) => {
      return row.type === "game"
        && row.pulka === state.currentPulka
        && row.game < state.currentGame
        && row.entries;
    });

    return completedRows.length > 0
      && completedRows.every((row) => row.entries?.[playerIndex]?.fulfilled);
  }

  function getMatchLeaderId() {
    let leaderId = null;
    let leaderScore = -Infinity;

    for (const player of state.players) {
      let score = 0;

      try {
        score = calculateMatchTotal(player.id);
      } catch {
        score = 0;
      }

      if (score > leaderScore) {
        leaderScore = score;
        leaderId = player.id;
      }
    }

    return leaderId;
  }

  function getCurrentWinnerContext() {
    if (!state.currentTrick.length) {
      return null;
    }

    const winner = getCurrentWinningPlay()?.player;
    return winner ? getContext(winner.id) : null;
  }

  function getOriginalBias(card, originalCard) {
    return card?.id === originalCard?.id ? 12 : 0;
  }

  function scoreOwnOutcome({ context, card, winProbability, futureSafeCount }) {
    const remainingAfter = Math.max(0, context.cardsLeft - 1);
    const expectedTricks = context.tricks + winProbability;
    const neededAfter = Math.max(0, context.target - expectedTricks);
    const reserveAfter = futureSafeCount - neededAfter;
    const power = rawCardPower(card);
    let score = 0;

    if (context.isPass || context.fulfilled) {
      score += (1 - winProbability) * 520;
      score -= winProbability * (context.isPass ? 680 : 460);

      // If the bot can lose this trick, throw away the strongest dangerous card.
      score += (1 - winProbability) * power * 1.7;
      score -= winProbability * power * 1.15;

      if (card.type === "joker") {
        score -= 210;
      }

      return score;
    }

    const urgency = context.mustTakeEveryRemaining
      ? 3.2
      : context.zeroDanger
        ? 2.2
        : 1.25;

    score += winProbability * 245 * urgency;
    score -= (1 - winProbability) * 95 * Math.max(1, context.needed);

    if (remainingAfter < Math.ceil(neededAfter - 0.001)) {
      score -= 900;
    }

    if (reserveAfter < -0.2) {
      score -= 430 + Math.abs(reserveAfter) * 120;
    } else if (reserveAfter < 0.8) {
      score -= 95;
    } else {
      score += Math.min(90, reserveAfter * 28);
    }

    // Take with the cheapest card that still protects the plan.
    score -= winProbability * power * 0.72;

    if (card.type === "joker") {
      const jokerNeededNow = context.mustTakeEveryRemaining
        || (context.zeroDanger && futureSafeCount < Math.max(1, context.needed - 0.25));
      score += jokerNeededNow ? 115 : -135;
    }

    if (context.zeroDanger && context.cardsLeft <= 3) {
      score += winProbability * 360;
    }

    if (context.onPremiumTrack) {
      score += winProbability * 55;
      if (remainingAfter < Math.ceil(neededAfter - 0.001)) {
        score -= 260;
      }
    }

    return score;
  }

  function scoreTablePressure({ context, winProbability, winnerContext, leaderId }) {
    if (!winnerContext || winnerContext.playerId === context.playerId) {
      return 0;
    }

    // War comes only after the bot's own position is reasonably safe.
    const selfSafe = context.fulfilled || context.needed <= 1 || context.cardsLeft >= context.needed + 3;
    if (!selfSafe) {
      return 0;
    }

    let score = 0;
    const stealsTrick = winProbability > 0.5;

    if (winnerContext.needed > 0 && stealsTrick) {
      score += winnerContext.onPremiumTrack ? 58 : 24;
    }

    if (winnerContext.fulfilled && !stealsTrick) {
      score += winnerContext.onPremiumTrack ? 46 : 18;
    }

    if (winnerContext.playerId === leaderId) {
      score += winnerContext.fulfilled && !stealsTrick ? 32 : stealsTrick ? 22 : 0;
    }

    return score;
  }

  function scoreCard(playerId, card, originalCard, context, winnerContext, leaderId) {
    const winProbability = getImmediateWinProbability(playerId, card);
    const futureSafeCount = getFutureSafeCount(playerId, card.id);
    const ownScore = scoreOwnOutcome({ context, card, winProbability, futureSafeCount });
    const pressureScore = scoreTablePressure({ context, winProbability, winnerContext, leaderId });
    const deterministicTieBreak = -rawCardPower(card) * 0.001;

    return {
      card,
      score: ownScore + pressureScore + getOriginalBias(card, originalCard) + deterministicTieBreak,
      winProbability,
      futureSafeCount,
      ownScore,
      pressureScore,
    };
  }

  function chooseStrategicCard(playerId, originalCard) {
    const legalCards = getLegalCards(playerId);
    if (!legalCards.length) {
      return originalCard;
    }

    const survival = window.JokerBotSurvival?.inspect?.(playerId);
    if (survival?.mustFightNow && originalCard && legalCards.some((card) => card.id === originalCard.id)) {
      return originalCard;
    }

    const context = getContext(playerId);
    const winnerContext = getCurrentWinnerContext();
    const leaderId = getMatchLeaderId();
    const evaluated = legalCards
      .map((card) => scoreCard(playerId, card, originalCard, context, winnerContext, leaderId))
      .sort((first, second) => second.score - first.score);

    if (DEBUG) {
      console.groupCollapsed(`Strategic brain: ${context.player?.name || playerId}`);
      console.table(evaluated.map((item) => ({
        card: item.card.id,
        score: Math.round(item.score),
        win: item.winProbability.toFixed(2),
        reserve: item.futureSafeCount.toFixed(2),
        own: Math.round(item.ownScore),
        pressure: Math.round(item.pressureScore),
      })));
      console.groupEnd();
    }

    return evaluated[0]?.card || originalCard || legalCards[0];
  }

  chooseBotCard = function strategicChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || state.phase !== "playing") {
      return originalCard;
    }

    const selectedCard = chooseStrategicCard(playerId, originalCard);
    const legalCards = getLegalCards(playerId);

    return selectedCard && legalCards.some((card) => card.id === selectedCard.id)
      ? selectedCard
      : originalCard && legalCards.some((card) => card.id === originalCard.id)
        ? originalCard
        : legalCards[0];
  };

  window.JokerStrategicBrain = Object.freeze({
    inspect(playerId) {
      const originalCard = originalChooseBotCard(playerId);
      const context = getContext(playerId);
      const winnerContext = getCurrentWinnerContext();
      const leaderId = getMatchLeaderId();
      return getLegalCards(playerId)
        .map((card) => scoreCard(playerId, card, originalCard, context, winnerContext, leaderId))
        .sort((first, second) => second.score - first.score);
    },
  });
})();

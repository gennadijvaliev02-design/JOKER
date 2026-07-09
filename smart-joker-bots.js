(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

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

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function getTrumpInfo(playerId) {
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit) {
      return { own: 0, unseen: 0, played: 0, total: 0 };
    }

    const total = RANKS.length - (trumpSuit === "spades" || trumpSuit === "clubs" ? 1 : 0);
    const played = state.playedCards.filter((play) => play.card?.type === "standard" && play.card.suit === trumpSuit).length;
    const own = (state.hands[playerId] || []).filter((card) => card.type === "standard" && card.suit === trumpSuit).length;
    const unseen = Math.max(0, total - played - own);

    return { own, unseen, played, total };
  }

  function getCurrentWinner() {
    return getCurrentWinningPlay();
  }

  function currentWinnerIsStrong(playerId) {
    const winner = getCurrentWinner();

    if (!winner || winner.player?.id === playerId) {
      return false;
    }

    if (winner.card?.type === "joker") {
      return true;
    }

    if (isTrump(winner.card)) {
      return RANK_POWER[winner.card.rank] >= RANK_POWER.K;
    }

    return winner.card?.rank === "A";
  }

  function shouldBeatWithJokerNow(playerId) {
    const goal = getGoal(playerId);
    const winner = getCurrentWinner();

    if (!goal.needsTake || !winner || winner.player?.id === playerId) {
      return false;
    }

    if (winner.card?.type === "joker") {
      return goal.desperate && getJokerCards(state.hands[playerId] || []).length >= 2;
    }

    if (shouldSpendJokerNow(playerId)) {
      return true;
    }

    if (goal.desperate || goal.urgent) {
      return true;
    }

    if (currentWinnerIsStrong(playerId) && goal.cardsLeft <= 4) {
      return true;
    }

    const winnerGoal = getGoal(winner.player.id);

    if (winnerGoal.needsTake && goal.needed >= 2 && goal.cardsLeft <= 5) {
      return true;
    }

    return false;
  }

  function hasUsefulStandardLead(playerId) {
    const legalCards = getLegalCards(playerId);
    const standardCards = getStandardCards(legalCards);

    if (!standardCards.length) {
      return false;
    }

    const trumpInfo = getTrumpInfo(playerId);
    const strongStandards = standardCards.filter((card) => {
      if (isTrump(card)) {
        return RANK_POWER[card.rank] >= RANK_POWER.Q || trumpInfo.own >= Math.max(2, trumpInfo.unseen);
      }

      return card.rank === "A";
    });

    return strongStandards.length > 0;
  }

  function shouldLeadJokerNow(playerId) {
    const goal = getGoal(playerId);
    const jokerCount = getJokerCards(state.hands[playerId] || []).length;

    if (!goal.needsTake || !jokerCount) {
      return false;
    }

    if (goal.desperate) {
      return true;
    }

    if (jokerCount >= 2 && goal.needed >= 2 && goal.cardsLeft <= 6) {
      return true;
    }

    if (goal.urgent && !hasUsefulStandardLead(playerId)) {
      return true;
    }

    return false;
  }

  function chooseSmartJokerSuit(playerId) {
    const trumpSuit = getTrumpSuit();
    const goal = getGoal(playerId);
    const trumpInfo = getTrumpInfo(playerId);

    if (goal.needsTake && trumpSuit && (trumpInfo.unseen >= 2 || trumpInfo.own >= 2)) {
      return trumpSuit;
    }

    const standardCards = getStandardCards(state.hands[playerId] || []);
    const suitScores = FIXED_TRUMP_BY_GAME.map((suit) => {
      const count = standardCards.filter((card) => card.suit === suit).length;
      const highCount = standardCards.filter((card) => card.suit === suit && RANK_POWER[card.rank] >= RANK_POWER.Q).length;
      const trumpBonus = trumpSuit && suit === trumpSuit ? (goal.needsTake ? 34 : -18) : 0;
      return { suit, score: count * 10 + highCount * 8 + trumpBonus };
    }).sort((first, second) => second.score - first.score);

    return suitScores[0]?.suit || trumpSuit || "hearts";
  }

  chooseJokerMode = function smartJokerMode(playerId, card) {
    if (!isBotId(playerId) || card?.type !== "joker" || !state.currentTrick.length) {
      return originalChooseJokerMode(playerId, card);
    }

    if (!shouldPlayerTakeTrick(playerId)) {
      return "duck";
    }

    return shouldBeatWithJokerNow(playerId) ? "beat" : "duck";
  };

  chooseLeadJokerAction = function smartLeadJokerAction(playerId) {
    const action = originalChooseLeadJokerAction(playerId);

    if (!isBotId(playerId)) {
      return action;
    }

    const goal = getGoal(playerId);

    if (!goal.needsTake) {
      return {
        ...action,
        jokerCommand: "take",
        jokerSuit: chooseSmartJokerSuit(playerId),
      };
    }

    if (shouldLeadJokerNow(playerId) || action.jokerCommand === "high") {
      return {
        ...action,
        jokerCommand: "high",
        jokerSuit: chooseSmartJokerSuit(playerId),
      };
    }

    return {
      ...action,
      jokerSuit: chooseSmartJokerSuit(playerId),
    };
  };

  chooseBotCard = function smartJokerChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !state.phase || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);
    const jokerCards = getJokerCards(legalCards);

    if (!jokerCards.length) {
      return originalCard;
    }

    if (!state.currentTrick.length && shouldLeadJokerNow(playerId)) {
      return jokerCards.find((card) => card.color === "red") || jokerCards[0] || originalCard;
    }

    if (state.currentTrick.length && originalCard?.type !== "joker" && shouldBeatWithJokerNow(playerId)) {
      return jokerCards.find((card) => card.color === "red") || jokerCards[0] || originalCard;
    }

    return originalCard;
  };
})();

(() => {
  "use strict";

  const legalCardsByPlayer = new Map();
  const goalByPlayer = new Map();
  const splitCardsCache = new WeakMap();

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
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
    const hand = state.hands[playerId] || [];
    const target = getPlayerTarget(player);
    const tricks = player?.tricks || 0;
    const rulesId = window.JokerRules?.activeId || "rules";
    const signature = `${rulesId}|${state.currentPulka}|${state.currentGame}|${player?.bid ?? "null"}|${tricks}|${hand.length}`;
    const cached = goalByPlayer.get(playerId);

    if (cached?.player === player && cached.hand === hand && cached.signature === signature) {
      return cached.goal;
    }

    const cardsLeft = hand.length;
    const needed = Math.max(0, target - tricks);
    const shouldAvoid = player?.bid === "pass" || tricks >= target;
    const goal = {
      player,
      target,
      tricks,
      cardsLeft,
      needed,
      needsTake: !shouldAvoid && needed > 0,
      shouldAvoid,
      desperate: !shouldAvoid && needed >= Math.max(1, cardsLeft),
      urgent: !shouldAvoid && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
      recovery: !shouldAvoid && needed > 0 && (needed >= Math.max(1, cardsLeft - 1) || cardsLeft <= 3),
      highOrder: target >= 4,
      strongOrder: target >= 5,
      fulfilled: player?.bid === "pass" || tricks >= target,
      over: tricks > target,
    };

    goalByPlayer.set(playerId, { player, hand, signature, goal });
    return goal;
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const firstPlay = state.currentTrick?.[0] || null;
    const leadSuit = typeof getLeadSuit === "function" ? (getLeadSuit() || "") : "";
    const trumpSuit = state.trump?.type === "standard" ? (state.trump.suit || "") : "";
    const rulesId = window.JokerRules?.activeId || "rules";
    const signature = [
      hand.length,
      state.currentTrick?.length || 0,
      leadSuit,
      trumpSuit,
      rulesId,
      firstPlay?.card?.id || "",
      firstPlay?.jokerMode || "",
      firstPlay?.jokerCommand || "",
      firstPlay?.jokerSuit || "",
    ].join("|");
    const cached = legalCardsByPlayer.get(playerId);

    if (cached?.hand === hand && cached.signature === signature) {
      return cached.cards;
    }

    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    const cards = legalCards.length ? legalCards : hand;
    legalCardsByPlayer.set(playerId, { hand, signature, cards });
    return cards;
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function splitCards(cards) {
    if (!Array.isArray(cards)) {
      return { standardCards: [], jokerCards: [] };
    }

    const cached = splitCardsCache.get(cards);

    if (cached?.length === cards.length) {
      return cached;
    }

    const standardCards = [];
    const jokerCards = [];

    for (const card of cards) {
      if (card.type === "standard") {
        standardCards.push(card);
      } else if (card.type === "joker") {
        jokerCards.push(card);
      }
    }

    const split = { length: cards.length, standardCards, jokerCards };
    splitCardsCache.set(cards, split);
    return split;
  }

  function getStandardCards(cards) {
    return splitCards(cards).standardCards;
  }

  function getJokerCards(cards) {
    return splitCards(cards).jokerCards;
  }

  function createCardOrder({ trumpBonus = 34, jokerPower = 100 } = {}) {
    function cardPower(card) {
      if (card?.type === "joker") {
        return jokerPower;
      }

      return (isTrump(card) ? trumpBonus : 0) + (RANK_POWER[card.rank] || 0);
    }

    function sortLow(cards) {
      return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
    }

    function sortHigh(cards) {
      return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
    }

    return { cardPower, sortLow, sortHigh };
  }

  window.JokerMediumContext = Object.freeze({
    isMediumAi,
    isBotId,
    getPlayerTarget,
    getGoal,
    getLegalCards,
    isTrump,
    getStandardCards,
    getJokerCards,
    createCardOrder,
  });
})();

(() => {
  const originalChooseBotCard = chooseBotCard;
  const {
    isMediumAi,
    isBotId,
    getGoal,
    getLegalCards,
    isTrump,
    getStandardCards,
    getJokerCards,
    createCardOrder,
  } = window.JokerMediumContext;
  const { cardPower: getCardPower, sortLow } = createCardOrder({ trumpBonus: 34, jokerPower: 100 });

  function getSureLeadScore(card) {
    if (card.type !== "standard") {
      return 0;
    }

    const unseenHigher = getUnseenHigherCardCount(card);
    const sureBonus = unseenHigher === 0 ? 34 : unseenHigher === 1 ? 14 : 0;
    const trumpBonus = isTrump(card) ? 20 : 0;
    const aceBonus = card.rank === "A" ? 12 : 0;

    return getCardPower(card) + sureBonus + trumpBonus + aceBonus;
  }

  function choosePlannedLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const jokers = getJokerCards(legalCards);

    if (goal.desperate && jokers.length) {
      const strongStandard = standards.find((card) => card.rank === "A" || isTrump(card));

      if (!strongStandard) {
        return jokers.find((card) => card.color === "red") || jokers[0];
      }
    }

    if (!standards.length) {
      return originalCard;
    }

    const scored = standards
      .map((card) => ({ card, score: getSureLeadScore(card) }))
      .sort((first, second) => second.score - first.score);
    const best = scored[0];
    const originalScore = originalCard?.type === "standard" ? getSureLeadScore(originalCard) : 0;
    const threshold = goal.urgent ? 4 : 12;

    return best && best.score > originalScore + threshold ? best.card : originalCard;
  }

  function choosePlannedFollow(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);

    if (!goal.needsTake) {
      return originalCard;
    }

    const standards = getStandardCards(legalCards);
    const jokers = getJokerCards(legalCards);
    const winners = standards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (winners.length) {
      return sortLow(winners)[0];
    }

    if ((goal.desperate || goal.urgent) && jokers.length) {
      return jokers.find((card) => card.color === "red") || jokers[0];
    }

    return originalCard;
  }

  chooseBotCard = function mediumGamePlanChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !originalCard || state.phase !== "playing") {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return choosePlannedLead(playerId, legalCards, originalCard);
    }

    return choosePlannedFollow(playerId, legalCards, originalCard);
  };
})();

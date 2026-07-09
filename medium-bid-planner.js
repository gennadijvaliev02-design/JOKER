(() => {
  const originalChooseBotBid = chooseBotBid;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getPersonality(playerId) {
    if (playerId === "bot-1") {
      return { name: "Клод", risk: -0.32 };
    }

    if (playerId === "bot-2") {
      return { name: "GPT", risk: 0.02 };
    }

    if (playerId === "bot-3") {
      return { name: "Qwen", risk: 0.28 };
    }

    return { name: "Bot", risk: 0 };
  }

  function cardBidValue(card, hand) {
    if (card.type === "joker") {
      return 1.55;
    }

    const trumpSuit = getTrumpSuit();
    const isTrump = trumpSuit && card.suit === trumpSuit;
    const sameSuitCount = hand.filter((handCard) => handCard.type === "standard" && handCard.suit === card.suit).length;

    if (isTrump) {
      if (card.rank === "A") return 1.18;
      if (card.rank === "K") return 0.96;
      if (card.rank === "Q") return 0.76;
      if (card.rank === "J") return 0.56;
      if (card.rank === "10") return 0.48;
      return sameSuitCount >= 3 ? 0.34 : 0.24;
    }

    if (card.rank === "A") return sameSuitCount <= 2 ? 0.9 : 0.72;
    if (card.rank === "K") return sameSuitCount <= 2 ? 0.42 : 0.3;
    if (card.rank === "Q") return sameSuitCount <= 2 ? 0.18 : 0.12;

    return 0.03;
  }

  function countSuit(hand, suit) {
    return hand.filter((card) => card.type === "standard" && card.suit === suit).length;
  }

  function evaluateHand(playerId) {
    const hand = state.hands[playerId] || [];
    const trumpSuit = getTrumpSuit();
    const personality = getPersonality(playerId);
    const raw = hand.reduce((sum, card) => sum + cardBidValue(card, hand), 0);
    const jokerCount = hand.filter((card) => card.type === "joker").length;
    const trumpCards = trumpSuit ? hand.filter((card) => card.type === "standard" && card.suit === trumpSuit) : [];
    const highTrumpCount = trumpCards.filter((card) => RANK_POWER[card.rank] >= RANK_POWER.Q).length;
    const aceCount = hand.filter((card) => card.type === "standard" && card.rank === "A").length;
    const longSuitBonus = SUITS.reduce((bonus, suit) => {
      const count = countSuit(hand, suit.id);
      return bonus + (count >= 4 ? 0.35 : count === 3 ? 0.16 : 0);
    }, 0);
    const controlBonus = jokerCount >= 1 && highTrumpCount >= 1 ? 0.38 : 0;
    const doubleJokerBonus = jokerCount >= 2 ? 0.5 : 0;
    const noTrumpPenalty = trumpSuit ? 0 : -0.2;
    const total = raw + longSuitBonus + controlBonus + doubleJokerBonus + noTrumpPenalty + personality.risk;
    const safe = Math.floor(total);
    const aggressive = Math.round(total);
    const capByStrength = Math.min(8, safe + (jokerCount >= 1 || highTrumpCount >= 2 || aceCount >= 2 ? 1 : 0));
    const planned = personality.risk > 0.2 ? Math.min(capByStrength, aggressive) : safe;

    return clamp(planned, 0, 8);
  }

  function getAllowedBidClosestTo(target) {
    const normalizedTarget = clamp(target, 0, 8);
    const sorted = [...BID_OPTIONS].sort((firstBid, secondBid) => {
      return Math.abs(getBidNumber(firstBid) - normalizedTarget) - Math.abs(getBidNumber(secondBid) - normalizedTarget);
    });

    return sorted.find((bid) => isBidAllowedForCurrentTurn(bid)) ?? "pass";
  }

  function shouldAvoidForcedOne() {
    const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;

    if (!isLastBidder) {
      return false;
    }

    return getOrderedBidTotal() === 8;
  }

  chooseBotBid = function mediumChooseBotBid(playerId) {
    if (!isMediumAi() || !isBotId(playerId) || isFourHundredPulka()) {
      return originalChooseBotBid(playerId);
    }

    const target = evaluateHand(playerId);

    if (target <= 0 && isBidAllowedForCurrentTurn("pass")) {
      return "pass";
    }

    if (shouldAvoidForcedOne() && target <= 1) {
      const saferBid = getAllowedBidClosestTo(2);
      return saferBid === "pass" ? 2 : saferBid;
    }

    return getAllowedBidClosestTo(target);
  };
})();

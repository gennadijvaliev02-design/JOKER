(() => {
  const originalChooseBotBid = chooseBotBid;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getHandRisk(playerId) {
    const hand = state.hands[playerId] || [];
    const trumpSuit = getTrumpSuit();
    const jokers = hand.filter((card) => card.type === "joker").length;
    const trumps = trumpSuit ? hand.filter((card) => card.type === "standard" && card.suit === trumpSuit) : [];
    const highTrumps = trumps.filter((card) => RANK_POWER[card.rank] >= RANK_POWER.Q).length;
    const aces = hand.filter((card) => card.type === "standard" && card.rank === "A").length;
    const kings = hand.filter((card) => card.type === "standard" && card.rank === "K").length;
    const lowOnly = hand.filter((card) => card.type === "standard" && RANK_POWER[card.rank] <= RANK_POWER["10"]).length;

    return {
      strong: jokers * 2 + highTrumps + aces + Math.floor(kings / 2),
      weak: lowOnly,
    };
  }

  function getClosestAllowedBid(target) {
    const normalized = clamp(target, 0, 8);
    const sorted = [...BID_OPTIONS].sort((firstBid, secondBid) => {
      return Math.abs(getBidNumber(firstBid) - normalized) - Math.abs(getBidNumber(secondBid) - normalized);
    });

    return sorted.find((bid) => isBidAllowedForCurrentTurn(bid)) ?? "pass";
  }

  function isLastBidder() {
    return state.biddingIndex === state.biddingOrder.length - 1;
  }

  chooseBotBid = function mediumForcedBidBrainChooseBotBid(playerId) {
    const originalBid = originalChooseBotBid(playerId);

    if (!isMediumAi() || !isBotId(playerId) || !isLastBidder() || isFourHundredPulka()) {
      return originalBid;
    }

    const beforeTotal = getOrderedBidTotal();
    const risk = getHandRisk(playerId);
    const originalNumber = getBidNumber(originalBid);

    // Total 9 before the last bidder means pass is forbidden, so 1 can become a forced survival bid.
    if (beforeTotal === 9) {
      if (risk.strong <= 1 && originalNumber <= 1) {
        return 1;
      }

      if (risk.strong >= 3) {
        return getClosestAllowedBid(Math.max(2, originalNumber));
      }

      return getClosestAllowedBid(Math.max(1, originalNumber));
    }

    // Total 8 means 1 is forbidden. Weak hands should pass instead of jumping into a bad 2.
    if (beforeTotal === 8) {
      if (risk.strong <= 1 && originalNumber <= 2 && isBidAllowedForCurrentTurn("pass")) {
        return "pass";
      }

      return getClosestAllowedBid(Math.max(2, originalNumber));
    }

    // If the last bidder can create a heavy over-order, don't overbid with a trash hand.
    if (beforeTotal >= 10 && risk.strong <= 1 && originalNumber > 1) {
      return getClosestAllowedBid(1);
    }

    return originalBid;
  };
})();

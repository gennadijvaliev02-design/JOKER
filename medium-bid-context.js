(() => {
  const originalSubmitBid = submitBid;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  submitBid = function mediumBidContextSubmitBid(playerId, bid) {
    const player = getPlayerById(playerId);
    const isLastBidder = state.phase === "bidding" && state.biddingIndex === state.biddingOrder.length - 1;
    const beforeTotal = state.phase === "bidding" ? getOrderedBidTotal() : 0;
    const bidValue = bid === "pass" ? 0 : Number(bid || 0);
    const forcedOne = Boolean(isMediumAi() && isLastBidder && beforeTotal === 9 && bidValue === 1);
    const forcedPass = Boolean(isMediumAi() && isLastBidder && beforeTotal === 8 && bid === "pass");

    if (player) {
      player.mediumForcedOneBid = forcedOne;
      player.mediumForcedPassBid = forcedPass;
      player.mediumBidBeforeTotal = beforeTotal;
    }

    return originalSubmitBid(playerId, bid);
  };
})();

(function () {
  if (typeof state === "undefined") {
    console.warn("Joker short-deal tactics: game state is unavailable.");
    return;
  }

  const originalChooseBotBid = chooseBotBid;
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;

  function isMediumPopular() {
    return window.JokerRules?.isPopular?.()
      && typeof window.isAiDifficultyAtLeast === "function"
      && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function getHandSize() {
    return Math.max(
      1,
      Math.min(
        9,
        Number(state.currentHandSize || window.JokerRules?.getHandSize?.(state.currentPulka, state.currentGame) || 9),
      ),
    );
  }

  function isLastBidder() {
    return state.biddingIndex === state.biddingOrder.length - 1;
  }

  function stableRoll(playerId, salt) {
    const handKey = (state.hands[playerId] || []).map((card) => card.id).sort().join("|");
    const source = `${state.currentPulka}:${state.currentGame}:${playerId}:${handKey}:${salt}`;
    let hash = 2166136261;

    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) / 4294967296;
  }

  function getLegalBidClosestTo(target) {
    const handSize = getHandSize();
    const normalized = Math.max(0, Math.min(handSize, Number(target) || 0));
    const options = BID_OPTIONS
      .filter((bid) => bid === "pass" || Number(bid) <= handSize)
      .filter((bid) => isBidAllowedForCurrentTurn(bid))
      .sort((first, second) => {
        return Math.abs(getBidNumber(first) - normalized) - Math.abs(getBidNumber(second) - normalized);
      });

    return options[0] ?? "pass";
  }

  function choosePassOrForced(target = 0) {
    if (isBidAllowedForCurrentTurn("pass")) {
      return "pass";
    }

    return getLegalBidClosestTo(target);
  }

  function countPreviousOneBids() {
    return state.players.filter((player) => player.bid === 1).length;
  }

  function getSingleCardBid(playerId, originalBid) {
    const card = state.hands[playerId]?.[0];
    if (!card) {
      return originalBid;
    }

    const previousOneBids = countPreviousOneBids();

    // Experienced one-card table tactic:
    // once somebody has ordered one, all non-final bidders pass.
    // The final bidder will be forced away from pass by the forbidden-total rule.
    if (previousOneBids >= 1) {
      if (!isLastBidder()) {
        return choosePassOrForced(1);
      }

      return getLegalBidClosestTo(1);
    }

    // A Joker is normally a real one-trick order, unless the pass trap above is active.
    if (card.type === "joker") {
      return getLegalBidClosestTo(1);
    }

    const trumpSuit = getTrumpSuit();
    const isTrumpCard = Boolean(trumpSuit && card.suit === trumpSuit);

    if (trumpSuit) {
      if (isTrumpCard) {
        const isWeakTrump = RANK_POWER[card.rank] <= RANK_POWER["10"];
        const orderProbability = isWeakTrump ? 0.70 : 0.86;
        return stableRoll(playerId, "single-trump") < orderProbability
          ? getLegalBidClosestTo(1)
          : choosePassOrForced(1);
      }

      // In a one-card trump deal, a side-suit Ace or King is not reliable:
      // any trump takes it. Do not treat it as an automatic order.
      if (card.rank === "A" || card.rank === "K") {
        return choosePassOrForced(1);
      }

      return choosePassOrForced(1);
    }

    const botLeads = state.leadPlayerId === playerId;
    const isHighNoTrumpCard = card.rank === "A" || card.rank === "K";

    if (botLeads && isHighNoTrumpCard) {
      return stableRoll(playerId, "single-no-trump-high-lead") < 0.75
        ? getLegalBidClosestTo(1)
        : choosePassOrForced(1);
    }

    return originalBid === 1 && isBidAllowedForCurrentTurn(1)
      ? originalBid
      : choosePassOrForced(1);
  }

  function getTwoCardBid(playerId, originalBid) {
    const hand = state.hands[playerId] || [];
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit) {
      return originalBid;
    }

    const trumpCards = hand.filter((card) => card.type === "standard" && card.suit === trumpSuit);
    const jokers = hand.filter((card) => card.type === "joker");

    // Two actual trumps in a two-card deal are usually two controlled tricks
    // and also pressure the final bidder, so order two whenever legal.
    if (trumpCards.length === 2) {
      return getLegalBidClosestTo(2);
    }

    // Side-suit Aces should not inflate the order while a trump suit exists.
    // Count only real controls: Jokers and cards of the trump suit.
    const reliableControls = Math.min(2, jokers.length + trumpCards.length);
    const originalNumber = getBidNumber(originalBid);
    const hasSideAce = hand.some((card) => {
      return card.type === "standard" && card.rank === "A" && card.suit !== trumpSuit;
    });

    if (hasSideAce && originalNumber > reliableControls) {
      return reliableControls > 0
        ? getLegalBidClosestTo(reliableControls)
        : choosePassOrForced(1);
    }

    return originalBid;
  }

  function correctShortTrumpAceOverbid(playerId, originalBid) {
    const handSize = getHandSize();
    const hand = state.hands[playerId] || [];
    const trumpSuit = getTrumpSuit();

    if (!trumpSuit || handSize > 3) {
      return originalBid;
    }

    const jokers = hand.filter((card) => card.type === "joker").length;
    const trumps = hand.filter((card) => card.type === "standard" && card.suit === trumpSuit).length;
    const sideAces = hand.filter((card) => {
      return card.type === "standard" && card.rank === "A" && card.suit !== trumpSuit;
    }).length;
    const reliableControls = Math.min(handSize, jokers + trumps);
    const originalNumber = getBidNumber(originalBid);

    if (sideAces > 0 && originalNumber > reliableControls) {
      return reliableControls > 0
        ? getLegalBidClosestTo(reliableControls)
        : choosePassOrForced(1);
    }

    return originalBid;
  }

  chooseBotBid = function expertShortDealBid(playerId) {
    const originalBid = originalChooseBotBid(playerId);

    if (!isMediumPopular() || !isBotId(playerId) || isFourHundredPulka()) {
      return originalBid;
    }

    const handSize = getHandSize();

    if (handSize === 1) {
      return getSingleCardBid(playerId, originalBid);
    }

    if (handSize === 2) {
      return getTwoCardBid(playerId, originalBid);
    }

    return correctShortTrumpAceOverbid(playerId, originalBid);
  };

  function shouldUseOneCardJokerSacrifice(playerId) {
    if (!isMediumPopular() || getHandSize() !== 1 || state.phase !== "playing") {
      return false;
    }

    const player = getPlayerById(playerId);
    const hand = state.hands[playerId] || [];
    const orderedOneOpponents = state.players.filter((opponent) => {
      return opponent.id !== playerId && opponent.bid === 1;
    }).length;

    return player?.bid === "pass"
      && orderedOneOpponents >= 2
      && hand.some((card) => card.type === "joker");
  }

  chooseBotCard = function oneCardJokerSacrifice(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !shouldUseOneCardJokerSacrifice(playerId)) {
      return originalCard;
    }

    const joker = (state.hands[playerId] || []).find((card) => {
      return card.type === "joker" && isLegalCard(playerId, card);
    });

    return joker || originalCard;
  };

  chooseJokerMode = function oneCardJokerSacrificeMode(playerId, card) {
    if (card?.type === "joker" && shouldUseOneCardJokerSacrifice(playerId) && state.currentTrick.length > 0) {
      return "beat";
    }

    return originalChooseJokerMode(playerId, card);
  };

  window.JokerShortDealTactics = Object.freeze({
    inspectBid(playerId) {
      return {
        handSize: getHandSize(),
        originalBid: originalChooseBotBid(playerId),
        selectedBid: chooseBotBid(playerId),
        previousOneBids: countPreviousOneBids(),
        lastBidder: isLastBidder(),
      };
    },
  });
})();

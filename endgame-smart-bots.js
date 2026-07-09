(() => {
  const originalChooseBotCard = chooseBotCard;
  const originalChooseJokerMode = chooseJokerMode;
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function isEndgame(playerId) {
    const cardsLeft = state.hands[playerId]?.length || 0;
    return state.phase === "playing" && cardsLeft > 0 && cardsLeft <= 3;
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
      oneMore: !shouldAvoid && needed === 1,
    };
  }

  function getLegalCards(playerId) {
    const hand = state.hands[playerId] || [];
    const legalCards = hand.filter((card) => isLegalCard(playerId, card));
    return legalCards.length ? legalCards : hand;
  }

  function getStandardCards(cards) {
    return cards.filter((card) => card.type === "standard");
  }

  function getJokerCards(cards) {
    return cards.filter((card) => card.type === "joker");
  }

  function isTrump(card) {
    const trumpSuit = getTrumpSuit();
    return Boolean(trumpSuit && card?.type === "standard" && card.suit === trumpSuit);
  }

  function cardPower(card) {
    if (card?.type === "joker") {
      return 100;
    }

    const trumpBonus = isTrump(card) ? 34 : 0;
    return trumpBonus + (RANK_POWER[card.rank] || 0);
  }

  function sortLow(cards) {
    return [...cards].sort((first, second) => cardPower(first) - cardPower(second));
  }

  function sortHigh(cards) {
    return [...cards].sort((first, second) => cardPower(second) - cardPower(first));
  }

  function getWinningStandardCards(playerId, cards) {
    return getStandardCards(cards).filter((card) => wouldCardWinCurrentTrick(playerId, card));
  }

  function getLosingStandardCards(playerId, cards) {
    return getStandardCards(cards).filter((card) => !wouldCardWinCurrentTrick(playerId, card));
  }

  function getCurrentWinnerGoal() {
    const winner = getCurrentWinningPlay()?.player;
    return winner ? getGoal(winner.id) : null;
  }

  function getTrickKey() {
    return state.currentTrick.map((play) => `${play.player?.id}:${play.card?.id}:${play.jokerMode || ""}`).join("|");
  }

  function setEndgameJokerIntent(playerId, card, mode, reason) {
    state.endgameJokerIntent = {
      playerId,
      cardId: card?.id,
      mode,
      reason,
      trickKey: getTrickKey(),
    };
  }

  function getEndgameJokerIntent(playerId, card) {
    const intent = state.endgameJokerIntent;

    if (!intent || intent.playerId !== playerId || intent.cardId !== card?.id || intent.trickKey !== getTrickKey()) {
      return null;
    }

    return intent;
  }

  function chooseJokerForBeat(playerId, jokerCards, reason) {
    const joker = jokerCards.find((card) => card.color === "red") || jokerCards[0] || null;

    if (joker) {
      setEndgameJokerIntent(playerId, joker, "beat", reason);
    }

    return joker;
  }

  function chooseJokerForDuck(playerId, jokerCards, reason) {
    const joker = jokerCards.find((card) => card.color === "black") || jokerCards[0] || null;

    if (joker) {
      setEndgameJokerIntent(playerId, joker, "duck", reason);
    }

    return joker;
  }

  function chooseEndgameFollow(playerId, legalCards, originalCard) {
    const selfGoal = getGoal(playerId);
    const winnerGoal = getCurrentWinnerGoal();
    const jokerCards = getJokerCards(legalCards);
    const winners = getWinningStandardCards(playerId, legalCards);
    const losers = getLosingStandardCards(playerId, legalCards);
    const standards = getStandardCards(legalCards);

    if (winnerGoal?.player?.id !== playerId) {
      if (winnerGoal?.needsTake && winners.length && !selfGoal.shouldAvoid) {
        return sortLow(winners)[0];
      }

      if (winnerGoal?.needsTake && jokerCards.length && selfGoal.needsTake) {
        return chooseJokerForBeat(playerId, jokerCards, "block needed trick in endgame") || originalCard;
      }

      if (winnerGoal?.shouldAvoid) {
        if (losers.length) {
          return sortHigh(losers)[0];
        }

        if (standards.length && selfGoal.shouldAvoid) {
          return sortLow(standards)[0];
        }
      }
    }

    if (selfGoal.desperate || selfGoal.needsTake) {
      if (winners.length) {
        return sortLow(winners)[0];
      }

      if (jokerCards.length) {
        return chooseJokerForBeat(playerId, jokerCards, "must take in endgame") || originalCard;
      }
    }

    if (selfGoal.shouldAvoid) {
      if (losers.length) {
        return sortHigh(losers)[0];
      }

      if (standards.length) {
        return sortLow(standards)[0];
      }

      if (jokerCards.length) {
        return chooseJokerForDuck(playerId, jokerCards, "avoid extra trick in endgame") || originalCard;
      }
    }

    return originalCard;
  }

  function leadScoreForTaking(playerId, card, goal) {
    const trumpBonus = isTrump(card) ? 30 : 0;
    const aceBonus = card.rank === "A" ? 18 : 0;
    const neededBonus = goal.desperate ? 24 : goal.oneMore ? 10 : 0;
    return cardPower(card) + trumpBonus + aceBonus + neededBonus;
  }

  function leadScoreForAvoiding(card) {
    const trumpPenalty = isTrump(card) ? 80 : 0;
    const rankPenalty = (RANK_POWER[card.rank] || 0) * 8;
    return -trumpPenalty - rankPenalty;
  }

  function chooseEndgameLead(playerId, legalCards, originalCard) {
    const goal = getGoal(playerId);
    const standards = getStandardCards(legalCards);
    const jokerCards = getJokerCards(legalCards);

    if (goal.shouldAvoid) {
      if (standards.length) {
        return sortLow(standards)[0];
      }

      if (jokerCards.length) {
        setEndgameJokerIntent(playerId, jokerCards[0], "lead", "only joker left while avoiding");
        return jokerCards[0];
      }
    }

    if (goal.desperate && jokerCards.length && !standards.some((card) => card.rank === "A" || isTrump(card))) {
      return jokerCards.find((card) => card.color === "red") || jokerCards[0];
    }

    if (goal.needsTake && standards.length) {
      return standards
        .map((card) => ({ card, score: leadScoreForTaking(playerId, card, goal) }))
        .sort((first, second) => second.score - first.score)[0]?.card || originalCard;
    }

    if (!goal.needsTake && standards.length) {
      return standards
        .map((card) => ({ card, score: leadScoreForAvoiding(card) }))
        .sort((first, second) => second.score - first.score)[0]?.card || originalCard;
    }

    return originalCard;
  }

  chooseJokerMode = function endgameJokerMode(playerId, card) {
    if (!isBotId(playerId) || card?.type !== "joker" || !state.currentTrick.length || !isEndgame(playerId)) {
      return originalChooseJokerMode(playerId, card);
    }

    const intent = getEndgameJokerIntent(playerId, card);

    if (intent?.mode) {
      return intent.mode;
    }

    const goal = getGoal(playerId);

    if (goal.shouldAvoid) {
      return "duck";
    }

    if (goal.needsTake) {
      return "beat";
    }

    return originalChooseJokerMode(playerId, card);
  };

  chooseLeadJokerAction = function endgameLeadJokerAction(playerId) {
    const action = originalChooseLeadJokerAction(playerId);

    if (!isBotId(playerId) || !isEndgame(playerId)) {
      return action;
    }

    const goal = getGoal(playerId);

    if (goal.needsTake) {
      return {
        ...action,
        jokerCommand: "high",
        jokerSuit: getTrumpSuit() || action.jokerSuit,
      };
    }

    return {
      ...action,
      jokerCommand: "take",
    };
  };

  chooseBotCard = function endgameSmartChooseBotCard(playerId) {
    const originalCard = originalChooseBotCard(playerId);

    if (!isBotId(playerId) || !originalCard || !isEndgame(playerId)) {
      return originalCard;
    }

    const legalCards = getLegalCards(playerId);

    if (!legalCards.length) {
      return originalCard;
    }

    if (state.currentTrick.length === 0) {
      return chooseEndgameLead(playerId, legalCards, originalCard);
    }

    return chooseEndgameFollow(playerId, legalCards, originalCard);
  };
})();

(() => {
  const STORAGE_KEY = "joker-medium-bot-learning-v1";
  const originalChooseBotBid = chooseBotBid;
  const originalWriteCurrentGameScore = writeCurrentGameScore;

  function isMediumAi() {
    return typeof window.isAiDifficultyAtLeast === "function" && window.isAiDifficultyAtLeast("medium");
  }

  function isBotId(playerId) {
    return typeof playerId === "string" && playerId.startsWith("bot-");
  }

  function createDefaultMemory() {
    return {
      version: 1,
      bots: {
        "bot-1": { games: 0, fulfilled: 0, under: 0, over: 0, zero: 0 },
        "bot-2": { games: 0, fulfilled: 0, under: 0, over: 0, zero: 0 },
        "bot-3": { games: 0, fulfilled: 0, under: 0, over: 0, zero: 0 },
      },
    };
  }

  function loadMemory() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");

      if (parsed?.version === 1 && parsed.bots) {
        return { ...createDefaultMemory(), ...parsed, bots: { ...createDefaultMemory().bots, ...parsed.bots } };
      }
    } catch {
      // ignored
    }

    return createDefaultMemory();
  }

  function saveMemory(memory) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      // localStorage can be blocked; game must keep working.
    }
  }

  function getTarget(player) {
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

  function getAdjustment(playerId) {
    const memory = loadMemory();
    const stats = memory.bots[playerId];

    if (!stats || stats.games < 4) {
      return 0;
    }

    const underRate = stats.under / stats.games;
    const overRate = stats.over / stats.games;
    const zeroRate = stats.zero / stats.games;

    if (underRate > 0.34 || zeroRate > 0.18) {
      return -1;
    }

    if (overRate > 0.42 && underRate < 0.22) {
      return 1;
    }

    return 0;
  }

  function getClosestAllowedBid(target) {
    const normalized = clamp(target, 0, 8);
    const sorted = [...BID_OPTIONS].sort((firstBid, secondBid) => {
      return Math.abs(getBidNumber(firstBid) - normalized) - Math.abs(getBidNumber(secondBid) - normalized);
    });

    return sorted.find((bid) => isBidAllowedForCurrentTurn(bid)) ?? "pass";
  }

  chooseBotBid = function mediumLearningChooseBotBid(playerId) {
    const originalBid = originalChooseBotBid(playerId);

    if (!isMediumAi() || !isBotId(playerId) || isFourHundredPulka()) {
      return originalBid;
    }

    const adjustment = getAdjustment(playerId);

    if (!adjustment) {
      return originalBid;
    }

    const originalValue = getBidNumber(originalBid);
    const adjustedValue = originalValue + adjustment;

    if (originalValue === 0 && adjustment < 0) {
      return originalBid;
    }

    return getClosestAllowedBid(adjustedValue);
  };

  writeCurrentGameScore = function mediumLearningWriteCurrentGameScore() {
    const memory = loadMemory();

    if (isMediumAi()) {
      state.players.forEach((player) => {
        if (!isBotId(player.id)) {
          return;
        }

        const stats = memory.bots[player.id] || { games: 0, fulfilled: 0, under: 0, over: 0, zero: 0 };
        const target = getTarget(player);
        const tricks = player.tricks || 0;
        const fulfilled = player.bid === "pass" ? tricks === 0 : tricks === target;

        stats.games += 1;

        if (fulfilled) {
          stats.fulfilled += 1;
        } else if (tricks === 0 && player.bid !== "pass") {
          stats.zero += 1;
          stats.under += 1;
        } else if (tricks < target) {
          stats.under += 1;
        } else if (tricks > target || (player.bid === "pass" && tricks > 0)) {
          stats.over += 1;
        }

        memory.bots[player.id] = stats;
      });

      saveMemory(memory);
    }

    return originalWriteCurrentGameScore();
  };

  window.JokerMediumBotLearning = {
    load: loadMemory,
    reset() {
      const fresh = createDefaultMemory();
      saveMemory(fresh);
      return fresh;
    },
  };
})();

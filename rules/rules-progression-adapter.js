(function () {
  if (!window.JokerRules || typeof state === "undefined") {
    console.warn("Joker rules progression adapter: rules engine or game state is unavailable.");
    return;
  }

  const PULKA_SUMMARY_HOLD = 9200;

  function getRulePulkas() {
    return window.JokerRules.active?.pulkas || [];
  }

  function getRulePulka(pulkaNumber = state.currentPulka) {
    return getRulePulkas().find((pulka) => pulka.id === pulkaNumber) || null;
  }

  function getGamesInPulka(pulkaNumber = state.currentPulka) {
    const pulka = getRulePulka(pulkaNumber);
    return pulka?.games || pulka?.handSizes?.length || 4;
  }

  function getLastRulePulka() {
    return getRulePulkas().at(-1) || null;
  }

  function getPulkaStartIndex(pulkaNumber) {
    return state.scoreRows.findIndex((row) => row.type === "game" && row.pulka === pulkaNumber);
  }

  function getPulkaGameRows(pulkaNumber) {
    return state.scoreRows.filter((row) => row.type === "game" && row.pulka === pulkaNumber);
  }

  function getPulkaTotalRow(pulkaNumber) {
    return state.scoreRows.find((row) => row.type === "total" && row.pulka === pulkaNumber) || null;
  }

  function isCurrentPulkaFinished() {
    return state.currentGame === getGamesInPulka();
  }

  function calculatePulkaTotalByNumber(playerId, pulkaNumber) {
    const playerIndex = state.players.findIndex((player) => player.id === playerId);
    const gameRows = getPulkaGameRows(pulkaNumber);

    return gameRows.reduce((sum, row) => {
      const entry = row.entries?.[playerIndex];
      return sum + (entry && !entry.crossed ? entry.value : 0);
    }, 0);
  }

  function crossBestSuccessfulEntryForPulka(gameRows, playerIndex) {
    const candidates = gameRows.slice(0, -1).flatMap((row, rowIndex) => {
      const entry = row.entries?.[playerIndex];
      return entry?.fulfilled && !entry.crossed ? [{ entry, rowIndex }] : [];
    });

    if (!candidates.length) {
      return;
    }

    candidates.sort((first, second) => {
      if (second.entry.value !== first.entry.value) {
        return second.entry.value - first.entry.value;
      }

      return first.rowIndex - second.rowIndex;
    });

    candidates[0].entry.crossed = true;
  }

  function applyDynamicPulkaBonuses(pulkaNumber) {
    const gameRows = getPulkaGameRows(pulkaNumber);

    if (!gameRows.length || gameRows.some((row) => !row.entries)) {
      return;
    }

    const premiumPlayerIndexes = [];

    state.players.forEach((_, playerIndex) => {
      const entries = gameRows.map((row) => row.entries[playerIndex]);

      if (!entries.every((entry) => entry?.fulfilled)) {
        return;
      }

      const previousEntries = entries.slice(0, -1);
      const bonus = previousEntries.length
        ? Math.max(...previousEntries.map((entry) => entry.value))
        : 0;
      const lastEntry = entries.at(-1);

      lastEntry.value += bonus;
      lastEntry.scoreLabel = String(lastEntry.value);
      lastEntry.premium = true;
      premiumPlayerIndexes.push(playerIndex);
    });

    if (premiumPlayerIndexes.length) {
      state.players.forEach((_, playerIndex) => {
        if (!premiumPlayerIndexes.includes(playerIndex)) {
          crossBestSuccessfulEntryForPulka(gameRows, playerIndex);
        }
      });
    }

    gameRows.forEach(syncScoreRow);
  }

  function getLanguage() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getSummaryCopy() {
    return getLanguage() === "en"
      ? {
          you: "You",
          pulkaFinished: (number) => `Bullet ${number} finished`,
          subtitle: "Score before the next deal",
          gameFinished: (number) => `Game ${number} finished`,
          newDeal: (number) => `Game ${number}. New deal`,
        }
      : {
          you: "Ты",
          pulkaFinished: (number) => `Пулька ${number} завершена`,
          subtitle: "Счёт перед следующей раздачей",
          gameFinished: (number) => `Игра ${number} завершена`,
          newDeal: (number) => `Игра ${number}. Новая раздача`,
        };
  }

  function showDynamicPulkaSummary(pulkaNumber) {
    if (state.autoPlay || !elements.gameSummary) {
      return;
    }

    const copy = getSummaryCopy();
    const medals = ["🥇", "🥈", "🥉", "4"];
    const rows = state.players
      .map((player) => ({
        player,
        delta: calculatePulkaTotalByNumber(player.id, pulkaNumber),
        total: calculateMatchTotal(player.id),
      }))
      .sort((first, second) => second.total - first.total);

    const title = document.createElement("div");
    title.className = "pulka-summary-title";
    title.textContent = copy.pulkaFinished(pulkaNumber);

    const subtitle = document.createElement("div");
    subtitle.className = "pulka-summary-subtitle";
    subtitle.textContent = copy.subtitle;

    const list = document.createElement("div");
    list.className = "pulka-summary-list";
    list.replaceChildren(
      ...rows.map((item, index) => {
        const row = document.createElement("div");
        row.className = `pulka-summary-row ${index === 0 ? "is-leader" : ""}`.trim();

        const medal = document.createElement("span");
        medal.className = "pulka-summary-medal";
        medal.textContent = medals[index] || String(index + 1);

        const avatar = document.createElement("span");
        avatar.className = "pulka-summary-avatar";
        avatar.textContent = (item.player?.name || "?").trim().slice(0, 1).toUpperCase() || "?";

        const name = document.createElement("span");
        name.className = "pulka-summary-name";
        name.textContent = item.player.seat === "bottom" ? copy.you : item.player.name;

        const delta = document.createElement("span");
        delta.className = "pulka-summary-delta";
        delta.textContent = formatPulkaDelta(item.delta);

        const total = document.createElement("span");
        total.className = "pulka-summary-total";
        total.textContent = formatTotalScore(item.total);

        row.append(medal, avatar, name, delta, total);
        return row;
      }),
    );

    elements.gameSummary.classList.add("is-pulka-summary");
    elements.gameSummary.replaceChildren(title, subtitle, list);
    elements.gameSummary.hidden = false;
    scheduleGameTask(hideGameSummary, PULKA_SUMMARY_HOLD);
  }

  const originalHideGameSummary = hideGameSummary;
  hideGameSummary = function hideProfilePulkaSummary() {
    elements.gameSummary?.classList.remove("is-pulka-summary");
    originalHideGameSummary();
  };

  isFourHundredPulka = function isFourHundredPulkaFromProfile() {
    return window.JokerRules.isAggression() && state.currentPulka === 3;
  };

  isChooseTrumpPulka = function isChooseTrumpPulkaFromProfile() {
    return getRulePulka()?.trumpMode === "chooser-rotation";
  };

  isNoTrumpPulka = function isNoTrumpPulkaFromProfile() {
    return window.JokerRules.isAggression() && state.currentPulka === 4;
  };

  isFixedTrumpPulka = function isFixedTrumpPulkaFromProfile() {
    return window.JokerRules.isAggression() && state.currentPulka === 5;
  };

  createEmptyScoreRows = function createProfileScoreRows() {
    const rows = [];

    for (const pulka of getRulePulkas()) {
      const gameCount = pulka.games || pulka.handSizes?.length || 4;

      for (let game = 1; game <= gameCount; game += 1) {
        rows.push({
          type: "game",
          pulka: pulka.id,
          game,
          cells: state.players.map(() => ""),
        });
      }

      rows.push({
        type: "total",
        pulka: pulka.id,
        game: "",
        cells: state.players.map(() => ""),
      });
    }

    return rows;
  };

  writeCurrentGameScore = function writeProfileGameScore() {
    const gameRow = state.scoreRows.find((row) => {
      return row.type === "game" && row.pulka === state.currentPulka && row.game === state.currentGame;
    });

    if (!gameRow) {
      console.error("Score row not found", {
        pulka: state.currentPulka,
        game: state.currentGame,
        rules: window.JokerRules.activeId,
      });
      return;
    }

    const playerScores = state.players.map((player) => ({
      ...calculatePlayerScore(player),
      jokerCount: player.jokersPlayed,
    }));

    gameRow.entries = playerScores.map(createScoreEntry);
    syncScoreRow(gameRow);

    if (isCurrentPulkaFinished()) {
      applyDynamicPulkaBonuses(state.currentPulka);
      const totalRow = getPulkaTotalRow(state.currentPulka);

      if (totalRow) {
        totalRow.deltas = state.players.map((player) => {
          return calculatePulkaTotalByNumber(player.id, state.currentPulka);
        });
        totalRow.cells = state.players.map((player) => {
          return formatTotalScore(calculateMatchTotal(player.id));
        });
      }
    }
  };

  applyPulkaBonuses = function applyPulkaBonusesFromProfile(pulkaOffset) {
    const pulkaNumber = state.scoreRows[pulkaOffset]?.pulka || state.currentPulka;
    applyDynamicPulkaBonuses(pulkaNumber);
  };

  calculatePulkaTotal = function calculatePulkaTotalFromProfile(playerId, pulkaOffset) {
    const pulkaNumber = state.scoreRows[pulkaOffset]?.pulka || state.currentPulka;
    return calculatePulkaTotalByNumber(playerId, pulkaNumber);
  };

  advanceGame = function advanceProfileGame() {
    const gameCount = getGamesInPulka();

    if (state.currentGame < gameCount) {
      state.currentGame += 1;
      return;
    }

    const pulkas = getRulePulkas();
    const currentIndex = pulkas.findIndex((pulka) => pulka.id === state.currentPulka);
    const nextPulka = pulkas[currentIndex + 1];

    if (nextPulka) {
      state.currentPulka = nextPulka.id;
      state.currentGame = 1;
    }
  };

  isFinalGame = function isFinalProfileGame() {
    const lastPulka = getLastRulePulka();
    return Boolean(
      lastPulka
      && state.currentPulka === lastPulka.id
      && state.currentGame === getGamesInPulka(lastPulka.id),
    );
  };

  getDevTargetFromUrl = function getProfileDevTargetFromUrl() {
    const requestedPulka = Number(urlParams.get("pulka"));
    const requestedGame = Number(urlParams.get("game"));
    const pulkas = getRulePulkas();

    if (!Number.isInteger(requestedPulka) || !Number.isInteger(requestedGame) || !pulkas.length) {
      return null;
    }

    const pulkaIds = pulkas.map((pulka) => pulka.id);
    const minPulka = Math.min(...pulkaIds);
    const maxPulka = Math.max(...pulkaIds);
    const pulka = clamp(requestedPulka, minPulka, maxPulka);

    return {
      pulka,
      game: clamp(requestedGame, 1, getGamesInPulka(pulka)),
    };
  };

  finishGameSoon = function finishProfileGameSoon() {
    const copy = getSummaryCopy();
    state.busy = true;
    render();
    showNotice(copy.gameFinished(state.currentGame));

    scheduleGameTask(() => {
      const finishedPulka = state.currentPulka;
      const gameSummary = createGameSummary();
      const pulkaFinished = isCurrentPulkaFinished();

      writeCurrentGameScore();
      renderScoreSheet();

      if (isFinalGame()) {
        showGameSummary(gameSummary);
        finishMatch();
        return;
      }

      if (pulkaFinished) {
        hideNotice();
        showDynamicPulkaSummary(finishedPulka);

        scheduleGameTask(() => {
          advanceGame();
          startDeal();
          render();
        }, getDelay(PULKA_SUMMARY_HOLD));
        return;
      }

      showGameSummary(gameSummary);
      advanceGame();
      startDeal();
      showNotice(copy.newDeal(state.currentGame));
      render();
      scheduleGameTask(hideNotice, getDelay(1200));
    }, getDelay(1300));
  };

  window.JokerRulesProgression = Object.freeze({
    getGamesInPulka,
    getPulkaStartIndex,
    isCurrentPulkaFinished,
  });
})();

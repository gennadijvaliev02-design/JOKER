(() => {
  const medals = ["🥇", "🥈", "🥉", "4"];
  const PULKA_SUMMARY_HOLD = 9200;

  function getLang() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getCopy() {
    return getLang() === "en"
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

  function getInitial(player) {
    return (player?.name || "?").trim().slice(0, 1).toUpperCase() || "?";
  }

  function refreshScoreSheetNow() {
    if (typeof renderScoreSheet === "function") {
      renderScoreSheet();
    }
  }

  function showPulkaSummary(pulkaNumber, pulkaOffset, holdTime = 4200) {
    if (state.autoPlay || !elements.gameSummary) {
      return;
    }

    const copy = getCopy();
    const pulkaTotals = calculatePulkaTotals(pulkaOffset);
    const matchTotals = calculateMatchTotals();
    const rows = state.players
      .map((player, playerIndex) => ({
        player,
        delta: pulkaTotals[playerIndex],
        total: matchTotals[playerIndex],
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
        avatar.textContent = getInitial(item.player);

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

    scheduleGameTask(hideGameSummary, holdTime);
  }

  const originalHideGameSummary = hideGameSummary;
  hideGameSummary = function patchedHideGameSummary() {
    if (elements.gameSummary) {
      elements.gameSummary.classList.remove("is-pulka-summary");
    }

    originalHideGameSummary();
  };

  finishGameSoon = function patchedFinishGameSoon() {
    const copy = getCopy();
    state.busy = true;
    render();
    showNotice(copy.gameFinished(state.currentGame));

    scheduleGameTask(() => {
      const finishedGame = state.currentGame;
      const finishedPulka = state.currentPulka;
      const pulkaOffset = (state.currentPulka - 1) * 5;
      const playerScores = calculateCurrentPlayerScores();
      const gameSummary = createGameSummary(playerScores);
      const shouldShowPulkaSummary = finishedGame === 4 && !isFinalGame();

      writeCurrentGameScore(playerScores);
      refreshScoreSheetNow();

      if (isFinalGame()) {
        showGameSummary(gameSummary);
        finishMatch();
        return;
      }

      if (shouldShowPulkaSummary) {
        hideNotice();
        showPulkaSummary(finishedPulka, pulkaOffset, PULKA_SUMMARY_HOLD);

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

      showNotice(getCopy().newDeal(state.currentGame));
      render();
      scheduleGameTask(hideNotice, getDelay(1200));
    }, getDelay(1300));
  };
})();

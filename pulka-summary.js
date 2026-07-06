(() => {
  const medals = ["🥇", "🥈", "🥉", "4"];

  function getInitial(player) {
    return (player?.name || "?").trim().slice(0, 1).toUpperCase() || "?";
  }

  function showPulkaSummary(pulkaNumber, pulkaOffset) {
    if (state.autoPlay || !elements.gameSummary) {
      return;
    }

    const rows = state.players
      .map((player) => ({
        player,
        delta: calculatePulkaTotal(player.id, pulkaOffset),
        total: calculateMatchTotal(player.id),
      }))
      .sort((first, second) => second.total - first.total);

    const title = document.createElement("div");
    title.className = "pulka-summary-title";
    title.textContent = `Пулька ${pulkaNumber} завершена`;

    const subtitle = document.createElement("div");
    subtitle.className = "pulka-summary-subtitle";
    subtitle.textContent = "Счёт перед следующей раздачей";

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
        name.textContent = item.player.seat === "bottom" ? "Ты" : item.player.name;

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

    scheduleGameTask(hideGameSummary, 4200);
  }

  const originalHideGameSummary = hideGameSummary;
  hideGameSummary = function patchedHideGameSummary() {
    if (elements.gameSummary) {
      elements.gameSummary.classList.remove("is-pulka-summary");
    }

    originalHideGameSummary();
  };

  finishGameSoon = function patchedFinishGameSoon() {
    state.busy = true;
    render();
    showNotice(`Игра ${state.currentGame} завершена`);

    scheduleGameTask(() => {
      const finishedGame = state.currentGame;
      const finishedPulka = state.currentPulka;
      const pulkaOffset = (state.currentPulka - 1) * 5;
      const gameSummary = createGameSummary();

      writeCurrentGameScore();
      showGameSummary(gameSummary);

      const shouldShowPulkaSummary = finishedGame === 4 && !isFinalGame();

      if (isFinalGame()) {
        finishMatch();
        return;
      }

      advanceGame();
      startDeal();

      const nextText =
        finishedGame === 4 && state.currentPulka !== finishedPulka
          ? `Пулька ${state.currentPulka}. Игра ${state.currentGame}. Новая раздача`
          : `Игра ${state.currentGame}. Новая раздача`;

      showNotice(nextText);
      render();

      if (shouldShowPulkaSummary) {
        scheduleGameTask(() => showPulkaSummary(finishedPulka, pulkaOffset), getDelay(5100));
      }

      scheduleGameTask(hideNotice, getDelay(1200));
    }, getDelay(1300));
  };
})();
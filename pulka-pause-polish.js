(() => {
  const PULKA_END_PAUSE = 9000;

  finishGameSoon = function pulkaPauseFinishGameSoon() {
    state.busy = true;
    render();
    showNotice(`Игра ${state.currentGame} завершена`);

    scheduleGameTask(() => {
      const finishedGame = state.currentGame;
      const gameSummary = createGameSummary();
      writeCurrentGameScore();
      showGameSummary(gameSummary);

      if (isFinalGame()) {
        finishMatch();
        return;
      }

      const finishedPulka = state.currentPulka;
      const isPulkaFinished = finishedGame === 4;
      const nextDealDelay = isPulkaFinished ? PULKA_END_PAUSE : 0;

      advanceGame();

      if (isPulkaFinished) {
        showNotice(`Пулька ${finishedPulka} завершена. Смотрим счёт`);
      }

      scheduleGameTask(() => {
        startDeal();

        const nextText =
          isPulkaFinished && state.currentPulka !== finishedPulka
            ? `Пулька ${state.currentPulka}. Игра ${state.currentGame}. Новая раздача`
            : `Игра ${state.currentGame}. Новая раздача`;

        showNotice(nextText);
        render();
        scheduleGameTask(hideNotice, getDelay(1200));
      }, getDelay(nextDealDelay));
    }, getDelay(1300));
  };
})();
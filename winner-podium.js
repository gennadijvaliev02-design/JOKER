(() => {
  const medalByPlace = ["🥇", "🥈", "🥉", "4"];
  const placeClassByIndex = ["is-first", "is-second", "is-third", "is-fourth"];

  function getInitial(player) {
    return (player?.name || "?").trim().slice(0, 1).toUpperCase() || "?";
  }

  function formatWinnerScore(value) {
    if (typeof formatTotalScore === "function") {
      return formatTotalScore(value);
    }

    return (value / 100).toFixed(1).replace(".", ",");
  }

  function getRanking() {
    return [...state.players]
      .map((player) => ({
        player,
        total: calculateMatchTotal(player.id),
      }))
      .sort((first, second) => second.total - first.total);
  }

  function createPodiumPlayer(item, index) {
    const card = document.createElement("div");
    card.className = `podium-player ${placeClassByIndex[index] || ""}`.trim();

    const medal = document.createElement("div");
    medal.className = "podium-medal";
    medal.textContent = medalByPlace[index] || String(index + 1);

    const avatar = document.createElement("div");
    avatar.className = "podium-avatar";
    avatar.textContent = getInitial(item.player);

    const name = document.createElement("div");
    name.className = "podium-name";
    name.textContent = item.player.name;

    const score = document.createElement("div");
    score.className = "podium-score";
    score.textContent = formatWinnerScore(item.total);

    card.append(medal, avatar, name, score);
    return card;
  }

  function createWinnerScene(winner) {
    const ranking = getRanking();
    const winnerTotal = calculateMatchTotal(winner.id);

    const scene = document.createElement("div");
    scene.className = "winner-scene";

    const kicker = document.createElement("div");
    kicker.className = "winner-kicker";
    kicker.textContent = "Партия завершена";

    const main = document.createElement("div");
    main.className = "winner-main";

    const crown = document.createElement("div");
    crown.className = "winner-crown";
    crown.textContent = "🏆";

    const avatar = document.createElement("div");
    avatar.className = "winner-avatar";
    avatar.textContent = getInitial(winner);

    const name = document.createElement("div");
    name.className = "winner-name";
    name.textContent = winner.name;

    const score = document.createElement("div");
    score.className = "winner-score";
    score.textContent = `Счёт: ${formatWinnerScore(winnerTotal)}`;

    main.append(crown, avatar, name, score);

    const podium = document.createElement("div");
    podium.className = "winner-podium";
    podium.replaceChildren(...ranking.map(createPodiumPlayer));

    scene.append(kicker, main, podium);
    return scene;
  }

  showEndGameDialog = function patchedShowEndGameDialog(winner) {
    elements.gameDialog.classList.add("is-winner-scene");
    elements.gameDialogTitle.replaceChildren(createWinnerScene(winner));
    elements.gameDialogActions.replaceChildren(
      createDialogButton("Новая партия", "primary", restartMatch),
      createDialogButton("Главное меню", "", goToMainMenu),
    );
    elements.gameDialog.hidden = false;
  };

  const originalResetGameState = resetGameState;
  resetGameState = function patchedResetGameState() {
    elements.gameDialog.classList.remove("is-winner-scene");
    originalResetGameState();
  };

  const originalShowExitDialog = showExitDialog;
  showExitDialog = function patchedShowExitDialog() {
    elements.gameDialog.classList.remove("is-winner-scene");
    originalShowExitDialog();
  };
})();
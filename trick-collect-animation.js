(() => {
  const COLLECT_START_DELAY = 560;
  const COLLECT_ANIMATION_TIME = 980;

  function getCenterInsideTable(element) {
    const tableRect = elements.table.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    return {
      x: rect.left - tableRect.left + rect.width / 2,
      y: rect.top - tableRect.top + rect.height / 2,
    };
  }

  function getWinnerTarget(seat) {
    const avatar = document.querySelector(`[data-seat="${seat}"]`);

    if (avatar) {
      return getCenterInsideTable(avatar);
    }

    const fallback = {
      bottom: { x: elements.table.clientWidth * 0.5, y: elements.table.clientHeight * 0.84 },
      left: { x: elements.table.clientWidth * 0.16, y: elements.table.clientHeight * 0.42 },
      top: { x: elements.table.clientWidth * 0.5, y: elements.table.clientHeight * 0.16 },
      right: { x: elements.table.clientWidth * 0.84, y: elements.table.clientHeight * 0.42 },
    };

    return fallback[seat] || fallback.bottom;
  }

  function getRenderedPlayedCards() {
    return [...elements.playedCardSlot.querySelectorAll(".played-card")];
  }

  function createCollectedCard(play, sourceNode, index, center, target) {
    const source = getCenterInsideTable(sourceNode);
    const wrapper = document.createElement("div");
    const card = createCardElement(play.card);
    const spread = index - (state.currentTrick.length - 1) / 2;

    wrapper.className = "trick-collect-card";
    card.disabled = true;
    wrapper.append(card);

    wrapper.style.setProperty("--from-x", `${source.x - 36}px`);
    wrapper.style.setProperty("--from-y", `${source.y - 51}px`);
    wrapper.style.setProperty("--from-r", `${(index - 1.5) * 5}deg`);
    wrapper.style.setProperty("--stack-x", `${center.x - 36 + spread * 7}px`);
    wrapper.style.setProperty("--stack-y", `${center.y - 51 + spread * 3}px`);
    wrapper.style.setProperty("--stack-r", `${spread * 3}deg`);
    wrapper.style.setProperty("--to-x", `${target.x - 28 + spread * 3}px`);
    wrapper.style.setProperty("--to-y", `${target.y - 40 + spread * 2}px`);
    wrapper.style.setProperty("--to-r", `${spread * 9}deg`);
    wrapper.style.setProperty("--collect-delay", `${index * 24}ms`);

    return wrapper;
  }

  function playTrickCollectAnimation(winnerSeat, trickCards) {
    if (state.autoPlay || !elements.table || !elements.playedCardSlot) {
      return;
    }

    const renderedCards = getRenderedPlayedCards();

    if (!renderedCards.length) {
      return;
    }

    const layer = document.createElement("div");
    const center = getCenterInsideTable(elements.playedCardSlot);
    const target = getWinnerTarget(winnerSeat);
    const hasJoker = trickCards.some((play) => play.card?.type === "joker");

    layer.className = `trick-collect-layer ${hasJoker ? "is-magic" : ""}`.trim();
    layer.style.setProperty("--magic-left", `${center.x}px`);
    layer.style.setProperty("--magic-top", `${center.y}px`);
    layer.style.setProperty("--spark-x", `${Math.round((target.x - center.x) * 0.22)}px`);
    layer.style.setProperty("--spark-y", `${Math.round((target.y - center.y) * 0.22)}px`);

    const flyingCards = trickCards.map((play, index) => {
      return createCollectedCard(play, renderedCards[index] || renderedCards.at(-1), index, center, target);
    });

    layer.replaceChildren(...flyingCards);
    elements.table.append(layer);
    elements.table.classList.add("is-trick-collecting");

    window.setTimeout(() => {
      layer.remove();
      elements.table.classList.remove("is-trick-collecting");
    }, getDelay(COLLECT_ANIMATION_TIME + 180));
  }

  finishTrickSoon = function polishedFinishTrickSoon() {
    state.busy = true;
    render();

    scheduleGameTask(() => {
      const winnerPlay = getTrickWinner();
      const winner = winnerPlay.player;
      const collectedTrick = [...state.currentTrick];
      state.collectingTrickWinnerSeat = winner.seat;
      render();
      playTrickCollectAnimation(winner.seat, collectedTrick);

      scheduleGameTask(() => {
        winner.tricks += 1;
        playSound("trick");
        state.leadPlayerId = winner.id;
        state.activePlayerId = winner.id;
        state.currentTrick = [];
        state.collectingTrickWinnerSeat = null;
        state.trickNumber += 1;
        state.busy = false;
        render();

        if (!hasCardsLeft()) {
          finishGameSoon();
          return;
        }

        if (hasCardsLeft() && (state.autoPlay || state.activePlayerId !== "human")) {
          continueBotTurns();
        }
      }, getDelay(COLLECT_ANIMATION_TIME));
    }, getDelay(COLLECT_START_DELAY));
  };
})();
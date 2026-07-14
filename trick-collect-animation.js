(() => {
  "use strict";

  const COLLECT_START_DELAY = 560;
  const COLLECT_ANIMATION_TIME = 980;

  function getCenterInsideTable(element, tableRect) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - tableRect.left + rect.width / 2,
      y: rect.top - tableRect.top + rect.height / 2,
    };
  }

  function getWinnerTarget(seat, tableRect) {
    const avatar = document.querySelector(`[data-seat="${seat}"]`);
    if (avatar) return getCenterInsideTable(avatar, tableRect);

    const fallback = {
      bottom: { x: tableRect.width * 0.5, y: tableRect.height * 0.84 },
      left: { x: tableRect.width * 0.16, y: tableRect.height * 0.42 },
      top: { x: tableRect.width * 0.5, y: tableRect.height * 0.16 },
      right: { x: tableRect.width * 0.84, y: tableRect.height * 0.42 },
    };

    return fallback[seat] || fallback.bottom;
  }

  function getRenderedPlayedCards() {
    return Array.from(elements.playedCardSlot.querySelectorAll(".played-card"));
  }

  function createCollectedCard(play, sourceNode, index, center, target, trickLength, tableRect) {
    const source = getCenterInsideTable(sourceNode, tableRect);
    const wrapper = document.createElement("div");
    const card = createCardElement(play.card);
    const spread = index - (trickLength - 1) / 2;

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

  function playTrickCollectAnimation(winnerSeat, trickCards, winnerPlay) {
    if (state.autoPlay || !elements.table || !elements.playedCardSlot) return;

    const renderedCards = getRenderedPlayedCards();
    if (!renderedCards.length) return;

    const tableRect = elements.table.getBoundingClientRect();
    const center = getCenterInsideTable(elements.playedCardSlot, tableRect);
    const target = getWinnerTarget(winnerSeat, tableRect);
    const winnerJokerCard = winnerPlay?.card?.type === "joker" ? winnerPlay.card : null;
    const layer = document.createElement("div");

    layer.className = `trick-collect-layer ${winnerJokerCard ? `is-${winnerJokerCard.color}` : ""}`.trim();
    layer.style.contain = "layout paint style";

    const flyingCards = trickCards.map((play, index) => createCollectedCard(
      play,
      renderedCards[index] || renderedCards.at(-1),
      index,
      center,
      target,
      trickCards.length,
      tableRect,
    ));

    layer.append(...flyingCards);
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
      playTrickCollectAnimation(winner.seat, collectedTrick, winnerPlay);

      scheduleGameTask(() => {
        winner.tricks += 1;
        playSound(winnerPlay?.card?.type === "joker" ? "jokerCollect" : "trick");
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

        if (state.autoPlay || state.activePlayerId !== "human") {
          continueBotTurns();
        }
      }, getDelay(COLLECT_ANIMATION_TIME));
    }, getDelay(COLLECT_START_DELAY));
  };
})();
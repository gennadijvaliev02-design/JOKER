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

  function createJokerBubbleTrail(center, target, jokerColor) {
    const trail = document.createElement("div");
    const bubbleCount = 16;
    const distanceX = target.x - center.x;
    const distanceY = target.y - center.y;
    const normalLength = Math.max(1, Math.hypot(distanceX, distanceY));
    const normalX = -distanceY / normalLength;
    const normalY = distanceX / normalLength;

    trail.className = `joker-bubble-trail is-${jokerColor === "red" ? "red" : "black"}`;

    for (let index = 0; index < bubbleCount; index += 1) {
      const bubble = document.createElement("i");
      const progress = (index + 1) / (bubbleCount + 1);
      const wave = Math.sin(index * 1.7) * (5 + (index % 3) * 2);
      const jitter = (Math.random() - 0.5) * 7;
      const size = 4 + (index % 5) * 1.55;
      const x = center.x + distanceX * progress + normalX * (wave + jitter);
      const y = center.y + distanceY * progress + normalY * (wave - jitter);

      bubble.style.setProperty("--bubble-x", `${x}px`);
      bubble.style.setProperty("--bubble-y", `${y}px`);
      bubble.style.setProperty("--bubble-size", `${size}px`);
      bubble.style.setProperty("--bubble-delay", `${120 + index * 34}ms`);
      bubble.style.setProperty("--bubble-float-x", `${normalX * (10 + (index % 4) * 3)}px`);
      bubble.style.setProperty("--bubble-float-y", `${normalY * (8 + (index % 3) * 4) - 12}px`);
      trail.append(bubble);
    }

    return trail;
  }

  function playTrickCollectAnimation(winnerSeat, trickCards, winnerPlay) {
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
    const winnerJokerCard = winnerPlay?.card?.type === "joker" ? winnerPlay.card : null;

    layer.className = `trick-collect-layer ${winnerJokerCard ? `is-joker-magic is-${winnerJokerCard.color}` : ""}`.trim();

    const flyingCards = trickCards.map((play, index) => {
      return createCollectedCard(play, renderedCards[index] || renderedCards.at(-1), index, center, target);
    });

    if (winnerJokerCard) {
      layer.append(createJokerBubbleTrail(center, target, winnerJokerCard.color));
    }

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

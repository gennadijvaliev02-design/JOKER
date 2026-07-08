(() => {
  function getDisplayName(player) {
    return player?.seat === "bottom" ? "Ты" : player?.name || "?";
  }

  function ensureLastTrickUi() {
    if (!elements.table || document.getElementById("last-trick-button")) {
      return;
    }

    const button = document.createElement("button");
    button.id = "last-trick-button";
    button.className = "last-trick-button";
    button.type = "button";
    button.textContent = "последняя взятка";
    button.disabled = true;

    const viewer = document.createElement("div");
    viewer.id = "last-trick-viewer";
    viewer.className = "last-trick-viewer";
    viewer.hidden = true;

    const panel = document.createElement("div");
    panel.className = "last-trick-panel";

    const title = document.createElement("div");
    title.className = "last-trick-title";
    title.textContent = "Последняя взятка";

    const cards = document.createElement("div");
    cards.className = "last-trick-cards";

    panel.append(title, cards);
    viewer.append(panel);
    elements.table.append(button, viewer);

    const show = () => showLastTrick();
    const hide = () => hideLastTrick();

    button.addEventListener("pointerdown", (event) => {
      if (!state.lastTrick?.cards?.length) {
        return;
      }

      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      show();
    });

    button.addEventListener("pointerup", hide);
    button.addEventListener("pointercancel", hide);
    button.addEventListener("pointerleave", hide);
    button.addEventListener("mousedown", show);
    button.addEventListener("mouseup", hide);
    button.addEventListener("mouseleave", hide);
    button.addEventListener("touchstart", (event) => {
      event.preventDefault();
      show();
    }, { passive: false });
    button.addEventListener("touchend", hide);
    button.addEventListener("touchcancel", hide);
  }

  function updateLastTrickButton() {
    const button = document.getElementById("last-trick-button");

    if (!button) {
      return;
    }

    button.disabled = !state.lastTrick?.cards?.length;
  }

  function renderLastTrickCards(container) {
    const lastTrick = state.lastTrick;

    if (!lastTrick?.cards?.length) {
      container.replaceChildren();
      return;
    }

    const nodes = lastTrick.cards.map((play) => {
      const item = document.createElement("div");
      item.className = `last-trick-card-item ${play.player?.id === lastTrick.winnerId ? "is-winner" : ""}`.trim();

      const card = createCardElement(play.card);
      card.disabled = true;

      const name = document.createElement("div");
      name.className = "last-trick-card-name";
      name.textContent = getDisplayName(play.player);

      item.append(card, name);
      return item;
    });

    container.replaceChildren(...nodes);
  }

  function showLastTrick() {
    const viewer = document.getElementById("last-trick-viewer");
    const button = document.getElementById("last-trick-button");
    const cards = viewer?.querySelector(".last-trick-cards");

    if (!viewer || !cards || !state.lastTrick?.cards?.length) {
      return;
    }

    renderLastTrickCards(cards);
    viewer.hidden = false;
    button?.classList.add("is-active");
    requestAnimationFrame(() => viewer.classList.add("is-visible"));
  }

  function hideLastTrick() {
    const viewer = document.getElementById("last-trick-viewer");
    const button = document.getElementById("last-trick-button");

    if (!viewer) {
      return;
    }

    viewer.classList.remove("is-visible");
    button?.classList.remove("is-active");
    window.setTimeout(() => {
      if (!viewer.classList.contains("is-visible")) {
        viewer.hidden = true;
      }
    }, 120);
  }

  const originalRender = render;
  render = function renderWithLastTrickButton(...args) {
    const result = originalRender.apply(this, args);
    ensureLastTrickUi();
    updateLastTrickButton();
    return result;
  };

  const originalFinishTrickSoon = finishTrickSoon;
  finishTrickSoon = function finishTrickSoonWithLastTrick(...args) {
    const rememberedTrick = [...state.currentTrick];
    const winnerPlay = getTrickWinner?.();

    state.lastTrick = {
      cards: rememberedTrick,
      winnerId: winnerPlay?.player?.id || null,
      winnerSeat: winnerPlay?.player?.seat || null,
    };

    updateLastTrickButton();
    return originalFinishTrickSoon.apply(this, args);
  };

  const originalStartDeal = startDeal;
  startDeal = function startDealWithLastTrickReset(...args) {
    state.lastTrick = null;
    hideLastTrick();
    updateLastTrickButton();
    return originalStartDeal.apply(this, args);
  };

  ensureLastTrickUi();
  updateLastTrickButton();
})();

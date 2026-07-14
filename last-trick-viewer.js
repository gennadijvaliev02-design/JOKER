(() => {
  "use strict";

  function getLang() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getCopy() {
    return getLang() === "en"
      ? { you: "You", button: "last trick", title: "Last trick" }
      : { you: "Ты", button: "последняя взятка", title: "Последняя взятка" };
  }

  function getDisplayName(player) {
    return player?.seat === "bottom" ? getCopy().you : player?.name || "?";
  }

  function applyLastTrickLanguage() {
    const copy = getCopy();
    const button = document.getElementById("last-trick-button");
    const title = document.querySelector(".last-trick-title");

    if (button && button.textContent !== copy.button) button.textContent = copy.button;
    if (title && title.textContent !== copy.title) title.textContent = copy.title;
  }

  function ensureLastTrickUi() {
    if (typeof elements === "undefined" || !elements.table) return;

    if (document.getElementById("last-trick-button")) {
      applyLastTrickLanguage();
      return;
    }

    const copy = getCopy();

    const button = document.createElement("button");
    button.id = "last-trick-button";
    button.className = "last-trick-button";
    button.type = "button";
    button.textContent = copy.button;
    button.disabled = true;

    const viewer = document.createElement("div");
    viewer.id = "last-trick-viewer";
    viewer.className = "last-trick-viewer";
    viewer.hidden = true;

    const panel = document.createElement("div");
    panel.className = "last-trick-panel";

    const title = document.createElement("div");
    title.className = "last-trick-title";
    title.textContent = copy.title;

    const cards = document.createElement("div");
    cards.className = "last-trick-cards";

    panel.append(title, cards);
    viewer.append(panel);
    elements.table.append(button, viewer);

    button.addEventListener("pointerdown", (event) => {
      if (!state.lastTrick?.cards?.length) return;

      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      showLastTrick();
    });

    button.addEventListener("pointerup", hideLastTrick);
    button.addEventListener("pointercancel", hideLastTrick);
    button.addEventListener("lostpointercapture", hideLastTrick);
  }

  function updateLastTrickButton() {
    ensureLastTrickUi();
    const button = document.getElementById("last-trick-button");
    if (!button) return;

    const disabled = !state.lastTrick?.cards?.length;
    if (button.disabled !== disabled) button.disabled = disabled;
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

    if (!viewer || !cards || !state.lastTrick?.cards?.length) return;

    applyLastTrickLanguage();
    renderLastTrickCards(cards);
    viewer.hidden = false;
    button?.classList.add("is-active");
    requestAnimationFrame(() => viewer.classList.add("is-visible"));
  }

  function hideLastTrick() {
    const viewer = document.getElementById("last-trick-viewer");
    const button = document.getElementById("last-trick-button");
    if (!viewer) return;

    viewer.classList.remove("is-visible");
    button?.classList.remove("is-active");
    window.setTimeout(() => {
      if (!viewer.classList.contains("is-visible")) viewer.hidden = true;
    }, 120);
  }

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

  window.addEventListener("joker-language-change", applyLastTrickLanguage);
  window.addEventListener("load", () => {
    ensureLastTrickUi();
    updateLastTrickButton();
  }, { once: true });

  ensureLastTrickUi();
  updateLastTrickButton();
})();
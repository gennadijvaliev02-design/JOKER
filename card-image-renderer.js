(() => {
  const originalCreateCardElement = createCardElement;

  function applySharedCardOptions(cardElement, options) {
    if (options.playable !== undefined) {
      cardElement.classList.toggle("is-disabled", options.playable === false);
    }

    if (options.dealIndex !== null && options.dealIndex !== undefined) {
      cardElement.classList.add("is-dealt");
      cardElement.style.setProperty("--deal-delay", `${Math.min(options.dealIndex, 8) * 240}ms`);
    }

    if (options.handIndex !== undefined && options.handCount) {
      const middle = (options.handCount - 1) / 2;
      const offset = options.handIndex - middle;
      const lift = Math.round(Math.abs(offset) * 2.2);

      cardElement.style.setProperty("--hand-rotate", `${offset * 1.8}deg`);
      cardElement.style.setProperty("--hand-lift", `${lift}px`);
    }
  }

  function createFallbackMarkup(card) {
    if (card.type === "joker") {
      return `
        <span class="card-fallback">
          <span class="joker-word">JOKER</span>
          <span class="card-center">★<span class="mini-rank">JOKER</span></span>
          <span class="joker-word bottom">JOKER</span>
        </span>
      `;
    }

    return `
      <span class="card-fallback">
        <span class="card-corner top">
          <span class="card-rank">${card.rank}</span>
          <span class="card-suit">${card.symbol}</span>
        </span>
        <span class="card-center">${card.symbol}</span>
        <span class="card-corner bottom">
          <span class="card-rank">${card.rank}</span>
          <span class="card-suit">${card.symbol}</span>
        </span>
      </span>
    `;
  }

  function getCardImagePath(card) {
    if (card.type === "joker") {
      return `cards/joker_${card.color}.png`;
    }

    return `cards/${card.rank}_${card.suit}.png`;
  }

  createCardElement = function patchedCreateCardElement(card, options = {}) {
    if (!card) {
      return originalCreateCardElement(card, options);
    }

    const cardElement = document.createElement("button");
    cardElement.className = `card ${card.color} ${card.type === "joker" ? "joker-card" : ""} card-image`;
    cardElement.type = "button";
    cardElement.dataset.card = card.id;
    cardElement.disabled = options.playable === false;
    applySharedCardOptions(cardElement, options);

    const altText = card.type === "joker" ? `${card.color === "red" ? "Красный" : "Чёрный"} джокер` : `${card.rank} ${card.symbol}`;
    cardElement.innerHTML = `
      <img class="card-face" src="${getCardImagePath(card)}" alt="${altText}" draggable="false" onerror="this.remove()" />
      ${createFallbackMarkup(card)}
    `;

    return cardElement;
  };

  const seatApplyBeforeCardPatch = applyVisualSeatsFromPlayerOrder;

  function getMixedBotSeats() {
    const seats = ["left", "top", "right"];

    for (let index = seats.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [seats[index], seats[swapIndex]] = [seats[swapIndex], seats[index]];
    }

    return seats;
  }

  applyVisualSeatsFromPlayerOrder = function finalRandomBotSeats() {
    seatApplyBeforeCardPatch?.();
    const seats = getMixedBotSeats();
    let botIndex = 0;

    state.players = state.players.map((player) => ({
      ...player,
      seat: player.id === "human" ? "bottom" : seats[botIndex++],
    }));
  };
})();

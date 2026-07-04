(() => {
  const originalCreateCardElement = createCardElement;

  createCardElement = function patchedCreateCardElement(card, options = {}) {
    if (card?.type !== "joker") {
      return originalCreateCardElement(card, options);
    }

    const cardElement = document.createElement("button");
    cardElement.className = `card ${card.color} joker-card card-image joker-image-card`;
    cardElement.type = "button";
    cardElement.dataset.card = card.id;
    cardElement.disabled = options.playable === false;

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

    const imageName = card.color === "red" ? "joker_red.png" : "joker_black.png";
    cardElement.innerHTML = `<img class="card-face" src="cards/${imageName}" alt="${card.color === "red" ? "Красный" : "Чёрный"} джокер" draggable="false" />`;

    return cardElement;
  };
})();

(() => {
  "use strict";

  const SEATS = ["left", "top", "right"];
  const stacksBySeat = typeof opponentStacksBySeat === "object"
    ? opponentStacksBySeat
    : Object.fromEntries(SEATS.map((seat) => [seat, document.querySelector(`.${seat}-stack`)]));
  const renderedCounts = new WeakMap();
  let playerSeatSignature = "";
  let playerIdBySeat = Object.create(null);

  function syncPlayerSeats() {
    const signature = state.players.map((player) => `${player.id}:${player.seat}`).join("|");
    if (signature === playerSeatSignature) return;

    playerIdBySeat = Object.create(null);
    state.players.forEach((player) => {
      playerIdBySeat[player.seat] = player.id;
    });
    playerSeatSignature = signature;
  }

  function getStackMetrics(count) {
    if (count >= 9) return { scale: 0.94, overlap: -7, angle: 1.05 };
    if (count >= 7) return { scale: 0.98, overlap: -6, angle: 1.15 };
    if (count >= 5) return { scale: 1.02, overlap: -5, angle: 1.3 };
    return { scale: 1.06, overlap: -3, angle: 1.55 };
  }

  function syncStackChildren(stack, count) {
    while (stack.children.length < count) {
      const card = document.createElement("span");
      card.setAttribute("aria-hidden", "true");
      stack.append(card);
    }

    while (stack.children.length > count) stack.lastElementChild?.remove();
  }

  function applyFanGeometry(stack, seat, count, angle) {
    const middle = (count - 1) / 2;

    for (let index = 0; index < stack.children.length; index += 1) {
      const card = stack.children[index];
      const offset = index - middle;
      const distance = Math.abs(offset);
      let shiftX = 0;
      let shiftY = 0;
      let rotation = offset * angle;

      if (seat === "top") {
        shiftY = distance * 0.85;
      } else if (seat === "left") {
        shiftX = distance * 0.95;
        rotation = offset * angle * 0.72;
      } else if (seat === "right") {
        shiftX = distance * -0.95;
        rotation = offset * angle * -0.72;
      }

      card.style.setProperty("--fan-shift-x", `${shiftX.toFixed(2)}px`);
      card.style.setProperty("--fan-shift-y", `${shiftY.toFixed(2)}px`);
      card.style.setProperty("--fan-rotation", `${rotation.toFixed(2)}deg`);
      card.style.zIndex = String(index + 1);
    }
  }

  function updateStackPresentation(stack, seat, count) {
    const metrics = getStackMetrics(count);

    stack.dataset.cardCount = String(count);
    stack.style.setProperty("--opponent-scale", String(metrics.scale));
    stack.style.setProperty("--opponent-overlap", `${metrics.overlap}px`);
    stack.classList.toggle("is-many", count >= 7);
    stack.classList.toggle("is-full", count >= 9);
    stack.setAttribute("aria-label", `${count} карт у соперника`);
    applyFanGeometry(stack, seat, count, metrics.angle);
  }

  renderOpponentCardStacks = function renderResponsiveOpponentCardStacks() {
    syncPlayerSeats();

    for (const seat of SEATS) {
      const stack = stacksBySeat[seat];
      if (!stack) continue;

      const playerId = playerIdBySeat[seat];
      const cardCount = playerId ? state.hands[playerId]?.length || 0 : 0;
      const countIsCurrent = renderedCounts.get(stack) === cardCount
        && stack.children.length === cardCount;

      if (countIsCurrent) continue;

      syncStackChildren(stack, cardCount);
      updateStackPresentation(stack, seat, cardCount);
      renderedCounts.set(stack, cardCount);
    }
  };

  renderOpponentCardStacks();
})();

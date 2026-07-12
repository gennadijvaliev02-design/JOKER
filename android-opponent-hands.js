(() => {
  function getStackMetrics(count) {
    if (count >= 9) {
      return { scale: 0.76, gap: 1 };
    }

    if (count >= 7) {
      return { scale: 0.84, gap: 1 };
    }

    if (count >= 5) {
      return { scale: 0.92, gap: 2 };
    }

    return { scale: 1, gap: 3 };
  }

  function syncStackChildren(stack, count) {
    while (stack.children.length < count) {
      const card = document.createElement("span");
      card.setAttribute("aria-hidden", "true");
      stack.append(card);
    }

    while (stack.children.length > count) {
      stack.lastElementChild?.remove();
    }
  }

  function updateStackPresentation(stack, count) {
    const metrics = getStackMetrics(count);

    stack.dataset.cardCount = String(count);
    stack.style.setProperty("--opponent-scale", String(metrics.scale));
    stack.style.setProperty("--opponent-gap", `${metrics.gap}px`);
    stack.classList.toggle("is-many", count >= 7);
    stack.classList.toggle("is-full", count >= 9);
    stack.setAttribute("aria-label", `${count} карт у соперника`);
  }

  renderOpponentCardStacks = function renderResponsiveOpponentCardStacks() {
    for (const seat of ["left", "top", "right"]) {
      const player = state.players.find((candidate) => candidate.seat === seat);
      const stack = document.querySelector(`.${seat}-stack`);

      if (!stack) {
        continue;
      }

      const cardCount = player ? state.hands[player.id]?.length || 0 : 0;
      syncStackChildren(stack, cardCount);
      updateStackPresentation(stack, cardCount);
    }
  };

  renderOpponentCardStacks();
})();

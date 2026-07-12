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

  function polishOpponentStacks() {
    for (const seat of ["left", "top", "right"]) {
      const stack = document.querySelector(`.${seat}-stack`);

      if (!stack) {
        continue;
      }

      const count = stack.children.length;
      const metrics = getStackMetrics(count);

      stack.dataset.cardCount = String(count);
      stack.style.setProperty("--opponent-scale", String(metrics.scale));
      stack.style.setProperty("--opponent-gap", `${metrics.gap}px`);
      stack.classList.toggle("is-many", count >= 7);
      stack.classList.toggle("is-full", count >= 9);
      stack.setAttribute("aria-label", `${count} карт у соперника`);
    }
  }

  if (typeof renderOpponentCardStacks === "function") {
    const originalRenderOpponentCardStacks = renderOpponentCardStacks;

    renderOpponentCardStacks = function renderResponsiveOpponentCardStacks(...args) {
      const result = originalRenderOpponentCardStacks.apply(this, args);
      polishOpponentStacks();
      return result;
    };
  }

  polishOpponentStacks();
})();

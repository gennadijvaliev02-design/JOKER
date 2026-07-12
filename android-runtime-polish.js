(() => {
  const table = document.querySelector(".table");

  function syncRuntimeState() {
    if (!table || typeof state === "undefined") {
      return;
    }

    table.dataset.phase = state.phase || "idle";

    const activePlayer = state.players?.find?.((player) => player.id === state.activePlayerId);
    table.dataset.activeSeat = activePlayer?.seat || "";
    table.classList.toggle("is-runtime-busy", Boolean(state.busy));
    table.classList.toggle("is-runtime-playing", state.phase === "playing");
    table.classList.toggle("is-runtime-bidding", state.phase === "bidding");
    table.classList.toggle("is-runtime-ace-deal", state.phase === "ace-deal");
  }

  if (typeof render === "function") {
    const originalRender = render;

    render = function renderWithAndroidRuntimePolish(...args) {
      const result = originalRender.apply(this, args);
      syncRuntimeState();
      return result;
    };
  }

  function canVibrate() {
    return typeof navigator.vibrate === "function"
      && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  document.addEventListener("pointerdown", (event) => {
    const interactive = event.target.closest(
      "button:not(:disabled), .card:not(.is-disabled), [role='button']",
    );

    if (!interactive || !canVibrate()) {
      return;
    }

    const duration = interactive.matches(".card") ? 7 : 10;
    navigator.vibrate(duration);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncRuntimeState();
    }
  });

  syncRuntimeState();
})();

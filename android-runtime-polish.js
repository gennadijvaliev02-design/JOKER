(() => {
  "use strict";

  const table = document.querySelector(".table");
  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;

  let lastPhase = null;
  let lastActiveSeat = null;
  let lastBusy = null;

  function syncRuntimeState(force = false) {
    if (!table || typeof state === "undefined") return;

    const phase = state.phase || "idle";
    const activePlayer = state.players?.find?.((player) => player.id === state.activePlayerId);
    const activeSeat = activePlayer?.seat || "";
    const busy = Boolean(state.busy);

    if (force || phase !== lastPhase) {
      if (table.dataset.phase !== phase) table.dataset.phase = phase;
      table.classList.toggle("is-runtime-playing", phase === "playing");
      table.classList.toggle("is-runtime-bidding", phase === "bidding");
      table.classList.toggle("is-runtime-ace-deal", phase === "ace-deal");
      lastPhase = phase;
    }

    if (force || activeSeat !== lastActiveSeat) {
      if (table.dataset.activeSeat !== activeSeat) table.dataset.activeSeat = activeSeat;
      lastActiveSeat = activeSeat;
    }

    if (force || busy !== lastBusy) {
      table.classList.toggle("is-runtime-busy", busy);
      lastBusy = busy;
    }
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
    return typeof navigator.vibrate === "function" && !reducedMotionQuery?.matches;
  }

  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element)) return;

    const interactive = event.target.closest(
      "button:not(:disabled), .card:not(.is-disabled), [role='button']",
    );

    if (!interactive || !canVibrate()) return;

    navigator.vibrate(interactive.matches(".card") ? 7 : 10);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncRuntimeState(true);
  });

  syncRuntimeState(true);
})();
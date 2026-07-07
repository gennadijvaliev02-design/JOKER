(() => {
  function isJokerPanelPhase() {
    return ["joker-lead-command", "joker-lead-suit", "joker-mode"].includes(state.phase);
  }

  function cancelJokerPanel() {
    if (!isJokerPanelPhase()) {
      return;
    }

    state.pendingJokerCardId = null;
    state.pendingJokerCommand = null;
    state.phase = "playing";
    elements.bidPanel.hidden = true;
    hideNotice();
    render();
  }

  function isCloseCorner(event) {
    const rect = elements.bidPanel.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;

    if (typeof clientX !== "number" || typeof clientY !== "number") {
      return false;
    }

    return clientX >= rect.right - 46 && clientX <= rect.right && clientY >= rect.top && clientY <= rect.top + 46;
  }

  elements.bidPanel.addEventListener("pointerdown", (event) => {
    if (!isJokerPanelPhase() || elements.bidPanel.hidden || !isCloseCorner(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    cancelJokerPanel();
  });
})();
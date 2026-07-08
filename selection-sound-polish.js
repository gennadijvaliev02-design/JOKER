(() => {
  let lastSelectionSoundAt = 0;

  function canPlaySelectionSound() {
    const now = Date.now();

    if (now - lastSelectionSoundAt < 90) {
      return false;
    }

    lastSelectionSoundAt = now;
    return true;
  }

  function playSelectionSound(type) {
    if (!canPlaySelectionSound() || typeof playSound !== "function") {
      return;
    }

    playSound(type);
  }

  document.addEventListener(
    "click",
    (event) => {
      const bidButton = event.target.closest("[data-bid]");

      if (bidButton && state.phase === "bidding" && getCurrentBidderId?.() === "human" && !bidButton.disabled) {
        playSelectionSound("bidSelect");
        return;
      }

      const trumpButton = event.target.closest("[data-trump]");

      if (trumpButton && state.phase === "trump-select" && state.trumpChooserId === "human" && !trumpButton.disabled) {
        playSelectionSound("trumpSelect");
      }
    },
    true,
  );
})();

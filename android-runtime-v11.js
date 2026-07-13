(() => {
  const originalPlaySound = typeof playSound === "function" ? playSound : null;

  if (originalPlaySound) {
    playSound = function playCalmAndroidSound(type) {
      if (type === "joker" || type === "jokerCollect") {
        return;
      }

      return originalPlaySound(type);
    };
  }
})();

(() => {
  const CARD_PRELOAD_STATE = {
    ready: false,
    loading: false,
  };

  function loadBotLogicPolish() {
    if (document.querySelector('script[data-bot-logic-polish="1"]')) return;

    const script = document.createElement("script");
    script.src = "bot-logic-polish.js?v=1";
    script.dataset.botLogicPolish = "1";
    document.body.append(script);
  }

  loadBotLogicPolish();

  function getStandardCardImagePaths() {
    return createJokerDeck()
      .filter((card) => card.type === "standard")
      .map((card) => `cards/${card.rank}_${card.suit}.png`);
  }

  function loadCardImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ src, ok: true });
      image.onerror = () => resolve({ src, ok: false });
      image.decoding = "async";
      image.src = src;
    });
  }

  async function preloadCardImagesWithButtonStatus() {
    if (CARD_PRELOAD_STATE.ready) return true;
    if (CARD_PRELOAD_STATE.loading) return false;

    const originalText = elements.startGame.textContent;
    const imagePaths = getStandardCardImagePaths();
    let loadedCount = 0;

    CARD_PRELOAD_STATE.loading = true;
    elements.startGame.disabled = true;
    elements.startGame.textContent = "Загрузка карт 0%";

    const results = await Promise.all(
      imagePaths.map(async (src) => {
        const result = await loadCardImage(src);
        loadedCount += 1;
        const percent = Math.round((loadedCount / imagePaths.length) * 100);
        elements.startGame.textContent = `Загрузка карт ${percent}%`;
        return result;
      }),
    );

    const failedImages = results.filter((result) => !result.ok).map((result) => result.src);
    if (failedImages.length) {
      console.warn("Не загрузились карты:", failedImages);
    }

    CARD_PRELOAD_STATE.ready = true;
    CARD_PRELOAD_STATE.loading = false;
    elements.startGame.disabled = false;
    elements.startGame.textContent = originalText;
    return true;
  }

  async function startGameAfterPreload(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (state.started || CARD_PRELOAD_STATE.loading) return;

    const ready = await preloadCardImagesWithButtonStatus();
    if (!ready) return;

    startGame();
  }

  elements.startGame.addEventListener("click", startGameAfterPreload, { capture: true });
})();
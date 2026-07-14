(() => {
  "use strict";

  const CARD_PRELOAD_STATE = {
    ready: false,
    promise: null,
    failedImages: [],
  };

  function getCardImagePaths() {
    return createJokerDeck().map((card) => {
      if (card.type === "joker") return `cards/joker_${card.color}.png`;
      return `cards/${card.rank}_${card.suit}.png`;
    });
  }

  function loadCardImage(src) {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = async () => {
        try {
          await image.decode?.();
        } catch {
          // The image is already loaded; older WebViews may reject decode().
        }
        resolve({ src, ok: true });
      };

      image.onerror = () => resolve({ src, ok: false });
      image.decoding = "async";
      image.src = src;
    });
  }

  function preloadCardImages(onProgress) {
    if (CARD_PRELOAD_STATE.ready) return Promise.resolve(true);
    if (CARD_PRELOAD_STATE.promise) return CARD_PRELOAD_STATE.promise;

    const imagePaths = getCardImagePaths();
    let loadedCount = 0;

    CARD_PRELOAD_STATE.promise = Promise.all(
      imagePaths.map(async (src) => {
        const result = await loadCardImage(src);
        loadedCount += 1;
        onProgress?.(loadedCount, imagePaths.length);
        return result;
      }),
    ).then((results) => {
      CARD_PRELOAD_STATE.failedImages = results
        .filter((result) => !result.ok)
        .map((result) => result.src);

      if (CARD_PRELOAD_STATE.failedImages.length) {
        console.warn("Не загрузились карты:", CARD_PRELOAD_STATE.failedImages);
      }

      CARD_PRELOAD_STATE.ready = true;
      return true;
    }).catch((error) => {
      CARD_PRELOAD_STATE.promise = null;
      console.warn("Ошибка предзагрузки карт", error);
      return false;
    });

    return CARD_PRELOAD_STATE.promise;
  }

  async function ensureReady({ showProgress = false } = {}) {
    const button = document.getElementById("start-game");
    const originalText = button?.textContent || "";

    if (showProgress && button) button.disabled = true;

    const imagesReady = await preloadCardImages((loaded, total) => {
      if (showProgress && button?.isConnected) {
        button.textContent = `Загрузка карт ${Math.round((loaded / total) * 100)}%`;
      }
    });

    if (showProgress && button?.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }

    return imagesReady;
  }

  function warmUp() {
    ensureReady({ showProgress: false });
  }

  window.JokerCardPreload = {
    ensureReady,
    isReady: () => CARD_PRELOAD_STATE.ready,
    getFailedImages: () => [...CARD_PRELOAD_STATE.failedImages],
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(warmUp, { timeout: 1200 });
  } else {
    window.setTimeout(warmUp, 240);
  }
})();
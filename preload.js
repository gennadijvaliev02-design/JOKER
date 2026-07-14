(() => {
  "use strict";

  const CARD_PRELOAD_STATE = {
    ready: false,
    promise: null,
    failedImages: [],
  };

  let botLogicPromise = null;

  function ensureBotLogicLoaded() {
    if (window.__JOKER_BOT_LOGIC_POLISH_READY__) {
      return Promise.resolve(true);
    }

    if (botLogicPromise) {
      return botLogicPromise;
    }

    const existing = document.querySelector('script[data-bot-logic-polish="1"]');
    if (existing) {
      botLogicPromise = new Promise((resolve) => {
        if (existing.dataset.loaded === "true") {
          resolve(true);
          return;
        }

        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
      });
      return botLogicPromise;
    }

    botLogicPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "bot-logic-polish.js?v=1";
      script.async = false;
      script.dataset.botLogicPolish = "1";
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        window.__JOKER_BOT_LOGIC_POLISH_READY__ = true;
        resolve(true);
      }, { once: true });
      script.addEventListener("error", () => {
        console.warn("Не загрузился bot-logic-polish.js");
        resolve(false);
      }, { once: true });
      document.body.append(script);
    });

    return botLogicPromise;
  }

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

  function preloadCardImages(onProgress) {
    if (CARD_PRELOAD_STATE.ready) {
      return Promise.resolve(true);
    }

    if (CARD_PRELOAD_STATE.promise) {
      return CARD_PRELOAD_STATE.promise;
    }

    const imagePaths = getStandardCardImagePaths();
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

    if (showProgress && button) {
      button.disabled = true;
    }

    const imagePromise = preloadCardImages((loaded, total) => {
      if (showProgress && button?.isConnected) {
        button.textContent = `Загрузка карт ${Math.round((loaded / total) * 100)}%`;
      }
    });

    const [imagesReady] = await Promise.all([
      imagePromise,
      ensureBotLogicLoaded(),
    ]);

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

  ensureBotLogicLoaded();

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(warmUp, { timeout: 1200 });
  } else {
    window.setTimeout(warmUp, 240);
  }
})();

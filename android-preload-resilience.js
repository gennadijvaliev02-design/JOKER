(() => {
  "use strict";

  if (window.__JOKER_ANDROID_PRELOAD_RESILIENCE__) return;
  window.__JOKER_ANDROID_PRELOAD_RESILIENCE__ = true;

  const root = document.documentElement;
  const STARTUP_WAIT_LIMIT_MS = 5000;
  const preload = window.JokerCardPreload;

  if (!preload || typeof preload.ensureReady !== "function") {
    root.dataset.androidPreload = "unavailable";
    return;
  }

  const originalEnsureReady = preload.ensureReady.bind(preload);

  async function ensureAndroidCardsReady(options = {}) {
    let timeoutId = 0;
    let timedOut = false;

    const timeout = new Promise((resolve) => {
      timeoutId = window.setTimeout(() => {
        timedOut = true;
        resolve(false);
      }, STARTUP_WAIT_LIMIT_MS);
    });

    try {
      const ready = await Promise.race([
        Promise.resolve(originalEnsureReady(options)).catch(() => false),
        timeout,
      ]);

      root.dataset.androidPreload = timedOut
        ? "timeout-fallback"
        : ready
          ? "ready"
          : "fallback";

      if (timedOut) {
        window.dispatchEvent(new CustomEvent("joker-android-preload-timeout", {
          detail: { waitLimitMs: STARTUP_WAIT_LIMIT_MS },
        }));
      }

      return ready;
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }

  Object.defineProperty(ensureAndroidCardsReady, "__jokerAndroidPreloadOwner", {
    value: true,
  });

  preload.ensureReady = ensureAndroidCardsReady;

  window.JokerAndroidPreloadResilience = Object.freeze({
    waitLimitMs: STARTUP_WAIT_LIMIT_MS,
    getState: () => root.dataset.androidPreload || "idle",
  });
})();

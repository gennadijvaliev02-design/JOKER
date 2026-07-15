(() => {
  "use strict";

  if (window.__JOKER_ANDROID_SYSTEM_INTEGRATION__) return;
  window.__JOKER_ANDROID_SYSTEM_INTEGRATION__ = true;

  const root = document.documentElement;
  const HAPTIC_GAP_MS = 55;
  const GAME_PHASES_WITH_WAKE_LOCK = new Set([
    "ace-deal",
    "dealing",
    "trump-select",
    "bidding",
    "playing",
    "scoring",
  ]);

  let foreground = !document.hidden;
  let keepAwakeRequested = false;
  let wakeLock = null;
  let wakeLockRequest = null;
  let audioResumePending = false;
  let lastHapticAt = 0;
  let lastLifecycleSource = "initial";

  function getNativeBridge() {
    const bridge = window.JokerAndroid;
    return bridge && typeof bridge.setKeepScreenOn === "function" ? bridge : null;
  }

  function isMatchActive() {
    const gameState = window.jokerState;
    return Boolean(
      gameState?.started
      && gameState.phase !== "idle"
      && gameState.phase !== "finished"
      && GAME_PHASES_WITH_WAKE_LOCK.has(gameState.phase),
    );
  }

  function shouldKeepAwake() {
    return foreground && isMatchActive();
  }

  function emitSystemState(reason) {
    root.dataset.androidLifecycle = foreground ? "foreground" : "background";
    root.dataset.androidKeepAwake = keepAwakeRequested ? "true" : "false";

    window.dispatchEvent(new CustomEvent("joker-android-system-state", {
      detail: {
        foreground,
        keepAwake: keepAwakeRequested,
        phase: window.jokerState?.phase || "idle",
        source: lastLifecycleSource,
        reason,
      },
    }));
  }

  function releaseFallbackWakeLock() {
    const lock = wakeLock;
    wakeLock = null;
    wakeLockRequest = null;
    lock?.release?.().catch?.(() => {});
  }

  function requestFallbackWakeLock() {
    if (!navigator.wakeLock?.request || wakeLock || wakeLockRequest || !shouldKeepAwake()) {
      return;
    }

    wakeLockRequest = navigator.wakeLock.request("screen")
      .then((lock) => {
        wakeLockRequest = null;
        wakeLock = lock;
        lock.addEventListener?.("release", () => {
          if (wakeLock === lock) wakeLock = null;
          if (shouldKeepAwake()) requestFallbackWakeLock();
        }, { once: true });
      })
      .catch(() => {
        wakeLockRequest = null;
      });
  }

  function syncKeepAwake(force = false) {
    const desired = shouldKeepAwake();
    const nativeBridge = getNativeBridge();

    if (!force && desired === keepAwakeRequested) {
      if (desired && !nativeBridge && !wakeLock) requestFallbackWakeLock();
      return;
    }

    keepAwakeRequested = desired;

    if (nativeBridge) {
      try {
        nativeBridge.setKeepScreenOn(desired);
      } catch {
        if (desired) requestFallbackWakeLock();
        else releaseFallbackWakeLock();
      }
    } else if (desired) {
      requestFallbackWakeLock();
    } else {
      releaseFallbackWakeLock();
    }

    emitSystemState("keep-awake");
  }

  function suspendAudio() {
    const context = window.jokerState?.audioContext;
    audioResumePending = Boolean(
      context
      && context.state !== "closed"
      && window.jokerState?.started,
    );

    if (context?.state === "running") {
      context.suspend?.().catch(() => {});
    }
  }

  function resumeAudio() {
    const context = window.jokerState?.audioContext;
    if (!audioResumePending || !window.jokerState?.started || context?.state !== "suspended") {
      audioResumePending = false;
      return;
    }

    context.resume?.().catch(() => {});
    audioResumePending = false;
  }

  function applyLifecycle(nextForeground, source) {
    const changed = foreground !== nextForeground;
    foreground = nextForeground;
    lastLifecycleSource = source;
    window.__JOKER_ANDROID_PAUSED__ = !foreground;

    if (foreground) {
      resumeAudio();
    } else {
      suspendAudio();
    }

    syncKeepAwake(changed);
    if (changed) emitSystemState("lifecycle");
  }

  function haptic(type = "selection") {
    if (!foreground) return false;

    const now = Date.now();
    if (now - lastHapticAt < HAPTIC_GAP_MS) return false;
    lastHapticAt = now;

    const nativeBridge = window.JokerAndroid;
    if (nativeBridge && typeof nativeBridge.haptic === "function") {
      try {
        nativeBridge.haptic(type);
        return true;
      } catch {
        // Fall through to the Web vibration fallback.
      }
    }

    if (typeof navigator.vibrate !== "function") return false;
    const duration = type === "warning" || type === "error"
      ? 32
      : type === "success" || type === "trick"
        ? 24
        : 12;
    return navigator.vibrate(duration);
  }

  function handlePointerDown(event) {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;

    const handCard = target.closest(".hand .card");
    if (handCard) {
      haptic(handCard.disabled || handCard.classList.contains("is-disabled") ? "warning" : "selection");
      return;
    }

    const control = target.closest(
      "[data-bid], [data-trump], .dialog-action, #table-menu, #score-button, .last-trick-button, .game-emote",
    );
    if (control && !control.disabled) haptic("selection");
  }

  function installSoundGate() {
    if (typeof playSound !== "function" || playSound.__jokerAndroidSystemOwner) return;

    const previousPlaySound = playSound;
    const androidPlaySound = function androidLifecyclePlaySound(type, ...args) {
      if (!foreground) return undefined;

      const result = previousPlaySound.call(this, type, ...args);
      if (!window.jokerState?.autoPlay && (type === "trick" || type === "jokerCollect")) {
        haptic("success");
      }
      return result;
    };

    Object.defineProperty(androidPlaySound, "__jokerAndroidSystemOwner", { value: true });
    playSound = androidPlaySound;
  }

  function installRenderSync() {
    if (typeof render !== "function" || render.__jokerAndroidSystemOwner) return;

    const previousRender = render;
    const androidRender = function androidSystemRender(...args) {
      const result = previousRender.apply(this, args);
      syncKeepAwake();
      return result;
    };

    Object.defineProperty(androidRender, "__jokerAndroidSystemOwner", { value: true });
    render = androidRender;
  }

  window.addEventListener("joker-native-lifecycle", (event) => {
    applyLifecycle(event.detail?.state !== "background", "native");
  });

  document.addEventListener("visibilitychange", () => {
    applyLifecycle(!document.hidden, "visibility");
  });

  window.addEventListener("pagehide", () => applyLifecycle(false, "pagehide"));
  window.addEventListener("pageshow", () => applyLifecycle(!document.hidden, "pageshow"));
  window.addEventListener("beforeunload", () => {
    foreground = false;
    keepAwakeRequested = false;
    try {
      getNativeBridge()?.setKeepScreenOn(false);
    } catch {
      // The Activity may already be leaving.
    }
    releaseFallbackWakeLock();
  }, { once: true });

  document.addEventListener("pointerdown", handlePointerDown, true);

  installSoundGate();
  installRenderSync();
  applyLifecycle(!document.hidden, "initial");
  syncKeepAwake(true);

  window.JokerAndroidSystem = Object.freeze({
    isForeground: () => foreground,
    isKeepingAwake: () => keepAwakeRequested,
    sync: () => syncKeepAwake(true),
    haptic,
  });
})();

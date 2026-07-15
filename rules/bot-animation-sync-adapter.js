(function () {
  "use strict";

  const bridge = window.JokerBotActionBridge;
  if (!bridge?.eventName) {
    console.warn("Joker bot animation sync: action bridge is unavailable.");
    return;
  }

  const FALLBACK_CARD_SETTLE_MS = 520;
  const MAX_CARD_SETTLE_MS = 1600;
  const pendingContinuations = new Map();
  let gateActionId = null;
  let gateTimer = null;
  let gateDeadline = 0;

  function prefersReducedMotion() {
    return typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getAnimationRemainingMs() {
    if (prefersReducedMotion()) return 0;

    const roots = [
      document.querySelector("#played-card-slot"),
      document.querySelector(".drop-zone"),
      document.querySelector(".table"),
    ].filter(Boolean);

    let remaining = 0;
    for (const root of roots) {
      if (typeof root.getAnimations !== "function") continue;
      for (const animation of root.getAnimations({ subtree: true })) {
        const timing = animation.effect?.getComputedTiming?.();
        const endTime = Number(timing?.endTime || 0);
        const currentTime = Number(animation.currentTime || 0);
        if (Number.isFinite(endTime) && Number.isFinite(currentTime)) {
          remaining = Math.max(remaining, endTime - currentTime);
        }
      }
    }

    if (remaining <= 0) return FALLBACK_CARD_SETTLE_MS;
    return Math.min(MAX_CARD_SETTLE_MS, Math.ceil(remaining) + 34);
  }

  function emit(stage, detail = {}) {
    window.dispatchEvent(new CustomEvent("joker-bot-animation-sync", {
      detail: {
        stage,
        actionId: gateActionId,
        deadline: gateDeadline || null,
        ...detail,
      },
    }));
  }

  function flushContinuations(actionId) {
    if (actionId != null && gateActionId !== actionId) return;

    if (gateTimer) {
      window.clearTimeout(gateTimer);
      gateTimer = null;
    }

    const releasedActionId = gateActionId;
    gateActionId = null;
    gateDeadline = 0;
    document.documentElement.classList.remove("is-bot-animation-gated");
    delete document.documentElement.dataset.botAnimationActionId;

    const continuations = [...pendingContinuations.values()];
    pendingContinuations.clear();
    emit("released", { actionId: releasedActionId, continuationCount: continuations.length });

    continuations.forEach((continuation) => {
      queueMicrotask(() => continuation());
    });
  }

  function openGate(actionId) {
    const duration = getAnimationRemainingMs();
    if (duration <= 0) {
      flushContinuations();
      return;
    }

    if (gateTimer) window.clearTimeout(gateTimer);
    gateActionId = actionId;
    gateDeadline = Date.now() + duration;
    document.documentElement.classList.add("is-bot-animation-gated");
    document.documentElement.dataset.botAnimationActionId = String(actionId);
    emit("waiting", { duration });
    gateTimer = window.setTimeout(() => flushContinuations(actionId), duration);
  }

  function wrapContinuation(name) {
    const original = window[name] || globalThis[name];
    if (typeof original !== "function") return;

    const wrapped = function animationSynchronizedContinuation(...args) {
      if (gateActionId == null) {
        return original.apply(this, args);
      }

      const receiver = this;
      pendingContinuations.set(name, () => original.apply(receiver, args));
      emit("queued", { continuation: name });
      return undefined;
    };

    if (window[name] === original) window[name] = wrapped;
    try {
      globalThis[name] = wrapped;
    } catch {
      // Top-level function bindings can be non-writable in some harnesses.
    }
  }

  wrapContinuation("continueBotTurns");
  wrapContinuation("processBiddingTurns");

  window.addEventListener(bridge.eventName, (event) => {
    const detail = event.detail;
    if (!detail || detail.kind !== "card") return;

    if (detail.stage === "committed") {
      openGate(detail.actionId);
      return;
    }

    if ((detail.stage === "rejected" || detail.stage === "error") && gateActionId === detail.actionId) {
      flushContinuations(detail.actionId);
    }
  });

  window.addEventListener("joker-rules-change", () => flushContinuations());
  window.addEventListener("pagehide", () => flushContinuations());

  window.JokerBotAnimationSync = Object.freeze({
    isWaiting() {
      return gateActionId != null;
    },
    getActionId() {
      return gateActionId;
    },
    release: flushContinuations,
  });
})();

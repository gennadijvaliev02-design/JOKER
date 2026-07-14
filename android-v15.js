(() => {
  "use strict";

  const V15_CSS = String.raw`
    /* Android V15 — final glow owner and low-cost panel rendering. */

    .trump-pill.v13-trump-ready .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.36),
        0 0 8px rgba(255,216,102,.14),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 10px rgba(255,255,255,.30) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="red"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.38),
        0 0 6px rgba(255,255,255,.16),
        0 0 11px rgba(255,73,96,.18),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 11px rgba(255,255,255,.32) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="black"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(226,234,231,.52),
        0 0 5px rgba(226,234,231,.15),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 10px rgba(255,255,255,.30) !important;
    }

    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel,
    .bid-panel.is-v12-joker-command-panel,
    .bid-panel.is-v12-joker-mode-panel,
    .bid-panel.is-v12-order-panel {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel {
      box-shadow:
        0 24px 54px rgba(0,0,0,.62),
        0 0 0 1px rgba(255,255,255,.065),
        0 0 11px rgba(226,185,83,.05),
        inset 0 1px 0 rgba(255,255,255,.16),
        inset 0 -22px 36px rgba(0,0,0,.34) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option,
    .bid-panel.is-v12-joker-suit-panel .bid-option[data-joker-lead-suit] {
      box-shadow:
        0 11px 23px rgba(0,0,0,.43),
        inset 0 1px 0 rgba(255,255,255,.17),
        inset 0 -11px 18px rgba(0,0,0,.31) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="hearts"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="diamonds"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="hearts"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="diamonds"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .bid-option[data-joker-lead-suit="hearts"],
    .bid-panel.is-v12-joker-suit-panel .bid-option[data-joker-lead-suit="diamonds"] {
      text-shadow:
        0 1px 0 rgba(255,255,255,.30),
        0 0 5px rgba(255,72,95,.18),
        0 3px 5px rgba(0,0,0,.68) !important;
      filter: none !important;
    }

    .bid-panel .android-silver-suit {
      color: #cbd3d0 !important;
      border-color: rgba(198,211,207,.58) !important;
      background:
        linear-gradient(180deg, rgba(255,255,255,.085), transparent 32%),
        linear-gradient(180deg, rgba(43,57,55,.97), rgba(10,18,20,.995)) !important;
      text-shadow:
        0 1px 0 rgba(255,255,255,.28),
        0 2px 4px rgba(0,0,0,.84) !important;
      filter: none !important;
      box-shadow:
        0 11px 23px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.16),
        inset 0 -11px 18px rgba(0,0,0,.34) !important;
    }

    .bid-panel .android-silver-suit::before {
      background: linear-gradient(180deg, rgba(255,255,255,.085), transparent) !important;
      filter: none !important;
    }

    .bid-panel .android-silver-suit .android-joker-suit-symbol {
      color: #cbd3d0 !important;
      text-shadow:
        0 1px 0 rgba(255,255,255,.28),
        0 2px 4px rgba(0,0,0,.84) !important;
      filter: none !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="no-trump"] {
      text-shadow: 0 2px 4px rgba(0,0,0,.74), 0 0 7px rgba(238,199,100,.06) !important;
      box-shadow:
        0 11px 23px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.16),
        inset 0 -11px 18px rgba(0,0,0,.33) !important;
    }
  `;

  if (!document.getElementById("android-v15-style")) {
    const style = document.createElement("style");
    style.id = "android-v15-style";
    style.textContent = V15_CSS;
    document.head.append(style);
  }
})();

(() => {
  "use strict";

  /* Prevent the legacy 240ms HUD polling loop before its delayed installer runs. */
  if (!window.__JOKER_ANDROID_INTERVAL_GUARD__) {
    window.__JOKER_ANDROID_INTERVAL_GUARD__ = true;
    const nativeSetInterval = window.setInterval.bind(window);

    window.setInterval = function androidGuardedSetInterval(handler, delay, ...args) {
      if (
        Number(delay) === 240
        && typeof handler === "function"
        && handler.name === "syncHudVisibility"
      ) {
        requestAnimationFrame(() => {
          if (!document.hidden) handler();
        });
        return 0;
      }

      return nativeSetInterval(handler, delay, ...args);
    };
  }

  /* Paint the actual generated black-suit buttons, not another generic CSS guess. */
  let silverFrame = 0;

  function paintSilverSuits() {
    silverFrame = 0;
    const buttons = document.querySelectorAll([
      '.bid-option[data-trump="clubs"]',
      '.bid-option[data-trump="spades"]',
      '.bid-option[data-joker-lead-suit="clubs"]',
      '.bid-option[data-joker-lead-suit="spades"]',
      '.android-joker-suit-option[data-joker-lead-suit="clubs"]',
      '.android-joker-suit-option[data-joker-lead-suit="spades"]',
    ].join(","));

    buttons.forEach((button) => {
      button.classList.add("android-silver-suit");
      button.style.setProperty("color", "#cbd3d0", "important");
      button.style.setProperty("text-shadow", "0 1px 0 rgba(255,255,255,.28), 0 2px 4px rgba(0,0,0,.84)", "important");
      button.style.setProperty("filter", "none", "important");
      button.style.setProperty("border-color", "rgba(198,211,207,.58)", "important");
      button.style.setProperty("box-shadow", "0 11px 23px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.16), inset 0 -11px 18px rgba(0,0,0,.34)", "important");

      button.querySelectorAll(".android-joker-suit-symbol").forEach((symbol) => {
        symbol.style.setProperty("color", "#cbd3d0", "important");
        symbol.style.setProperty("text-shadow", "0 1px 0 rgba(255,255,255,.28), 0 2px 4px rgba(0,0,0,.84)", "important");
        symbol.style.setProperty("filter", "none", "important");
      });
    });
  }

  function scheduleSilverPaint() {
    if (silverFrame) return;
    silverFrame = requestAnimationFrame(paintSilverSuits);
  }

  const bidPanel = document.getElementById("bid-panel");
  if (bidPanel) {
    const observer = new MutationObserver(scheduleSilverPaint);
    observer.observe(bidPanel, { subtree: true, childList: true, characterData: true });
  }

  scheduleSilverPaint();
})();

(() => {
  "use strict";

  /* Android V16 performance correction — preserve visuals, remove repeated work. */
  const previousPlaySound = typeof playSound === "function" ? playSound : null;
  const noiseCacheByContext = new WeakMap();

  function getAudioContext() {
    if (state.audioContext) {
      state.audioContext.resume?.().catch(() => {});
      return state.audioContext;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    state.audioContext = new AudioContext();
    state.audioContext.resume?.().catch(() => {});
    return state.audioContext;
  }

  function getNoiseClip(ctx, duration) {
    let cache = noiseCacheByContext.get(ctx);
    if (!cache) {
      cache = new Map();
      noiseCacheByContext.set(ctx, cache);
    }

    const key = Math.max(1, Math.round(duration * 1000));
    const existing = cache.get(key);
    if (existing) return existing;

    const variants = 4;
    const framesPerVariant = Math.max(1, Math.ceil(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, framesPerVariant * variants, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let variant = 0; variant < variants; variant += 1) {
      const offset = variant * framesPerVariant;
      for (let index = 0; index < framesPerVariant; index += 1) {
        const fade = 1 - index / framesPerVariant;
        data[offset + index] = (Math.random() * 2 - 1) * fade;
      }
    }

    const clip = { buffer, framesPerVariant, variants };
    cache.set(key, clip);
    return clip;
  }

  function playCachedNoise(ctx, time, { duration, volume, filter, q = 1.1, type = "bandpass" }) {
    const clip = getNoiseClip(ctx, duration);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const biquad = ctx.createBiquadFilter();
    const variant = Math.floor(Math.random() * clip.variants);
    const offset = (variant * clip.framesPerVariant) / ctx.sampleRate;

    source.buffer = clip.buffer;
    biquad.type = type;
    biquad.frequency.setValueAtTime(filter, time);
    biquad.Q.value = q;
    gain.gain.setValueAtTime(volume * 1.0248, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(ctx.destination);
    source.start(time, offset, duration);
    source.stop(time + duration + 0.02);
  }

  function playFastTone(ctx, time, { frequency, endFrequency, duration, volume }) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), time + duration);
    gain.gain.setValueAtTime(volume * 1.0248, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playFastShuffle(ctx) {
    const now = ctx.currentTime + 0.02;

    for (let index = 0; index < 18; index += 1) {
      const time = now + index * 0.044;
      playCachedNoise(ctx, time, {
        duration: 0.052,
        volume: 0.07,
        filter: 1500 + (index % 8) * 155,
      });

      if (index % 2 === 0) {
        playFastTone(ctx, time, {
          frequency: 150 + index * 5,
          endFrequency: 90,
          duration: 0.04,
          volume: 0.012,
        });
      }
    }
  }

  function playFastDeal(ctx) {
    const now = ctx.currentTime;
    playCachedNoise(ctx, now, {
      duration: 0.038,
      volume: 0.072,
      filter: 2300,
      q: 0.9,
    });
    playFastTone(ctx, now, {
      frequency: 255,
      endFrequency: 118,
      duration: 0.034,
      volume: 0.0075,
    });
  }

  playSound = function androidV16PlaySound(type) {
    if (type !== "shuffle" && type !== "deal") {
      return previousPlaySound?.(type);
    }

    if (state.autoPlay) return;

    const ctx = getAudioContext();
    if (!ctx) {
      return previousPlaySound?.(type);
    }

    if (type === "shuffle") {
      playFastShuffle(ctx);
    } else {
      playFastDeal(ctx);
    }
  };

  if (typeof renderScoreSheet === "function" && typeof elements !== "undefined" && elements.scoreSheet) {
    const fullRenderScoreSheet = renderScoreSheet;

    renderScoreSheet = function androidV16RenderScoreSheet() {
      if (elements.scoreSheet.hidden) return;
      return fullRenderScoreSheet();
    };

    const refreshVisibleScore = () => {
      requestAnimationFrame(() => {
        if (!elements.scoreSheet.hidden) fullRenderScoreSheet();
      });
    };

    elements.scoreButton?.addEventListener("click", refreshVisibleScore);
    elements.scoreClose?.addEventListener("click", refreshVisibleScore);
  }

  let handCacheInstalled = false;

  function installHandRenderCache() {
    if (handCacheInstalled || typeof renderHand !== "function" || !elements?.playerHand) return;
    handCacheInstalled = true;
    const fullRenderHand = renderHand;

    renderHand = function androidV16CachedHand(...args) {
      const hand = state.hands?.human || [];
      const nodes = [...elements.playerHand.querySelectorAll(":scope > .card")];
      const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;
      const domMatches = nodes.length === hand.length
        && nodes.every((node, index) => node.dataset.card === hand[index]?.id);

      if (!domMatches || shouldAnimateDeal) {
        return fullRenderHand.apply(this, args);
      }

      const middle = (hand.length - 1) / 2;
      nodes.forEach((node, index) => {
        const card = hand[index];
        const playable = typeof canHumanPlay === "function" ? canHumanPlay(card) : true;
        const offset = index - middle;
        const lift = Math.round(Math.abs(offset) * 2.2);

        node.disabled = !playable;
        node.classList.toggle("is-disabled", !playable);
        node.classList.remove("is-dealt");
        node.style.removeProperty("--deal-delay");
        node.style.setProperty("--hand-rotate", `${offset * 1.8}deg`);
        node.style.setProperty("--hand-lift", `${lift}px`);
      });
    };
  }

  window.setTimeout(installHandRenderCache, 520);
  window.addEventListener("load", () => window.setTimeout(installHandRenderCache, 520), { once: true });
})();

(() => {
  "use strict";

  /* Deal 2026 duplicate guard: hide whole real-hand containers, not replaceable children. */
  if (document.getElementById("android-deal-container-mask-style")) return;

  const style = document.createElement("style");
  style.id = "android-deal-container-mask-style";
  style.textContent = `
    .table.is-deal-2026-staging > .hand,
    .table.is-deal-2026-staging > .hidden-cards {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      animation: none !important;
      transition: none !important;
    }

    .table.is-deal-2026-staging > .hand *,
    .table.is-deal-2026-staging > .hidden-cards * {
      opacity: 0 !important;
      visibility: hidden !important;
      animation: none !important;
      transition: none !important;
    }

    .table.is-deal-2026-revealing > .hand,
    .table.is-deal-2026-revealing > .hidden-cards {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;

  document.head.append(style);
})();

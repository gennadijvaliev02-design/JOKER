(() => {
  const V15_CSS = String.raw`
    /* Android V15 — glow only. No layout, sizing, colour or gameplay changes. */

    /* Trump card: keep the glass card, reduce only its glow by about 40%. */
    .trump-pill.v13-trump-ready .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.36),
        0 0 10px rgba(255,216,102,.17),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 12px rgba(255,255,255,.35) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="red"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.38),
        0 0 7px rgba(255,255,255,.19),
        0 0 14px rgba(255,73,96,.23),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 13px rgba(255,255,255,.38) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="black"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.45),
        0 0 8px rgba(255,255,255,.37),
        0 0 14px rgba(190,234,255,.15),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 14px rgba(255,255,255,.44) !important;
    }

    /* Trump choice and Joker High/Take panels: reduce only luminous halos by about 70%. */
    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel {
      box-shadow:
        0 28px 66px rgba(0,0,0,.64),
        0 0 0 1px rgba(255,255,255,.07),
        0 0 16px rgba(226,185,83,.066),
        0 0 20px rgba(42,234,183,.045),
        inset 0 1px 0 rgba(255,255,255,.20),
        inset 0 -25px 42px rgba(0,0,0,.35) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option {
      box-shadow:
        0 13px 27px rgba(0,0,0,.45),
        0 0 10px rgba(48,229,185,.048),
        inset 0 1px 0 rgba(255,255,255,.22),
        inset 0 -13px 21px rgba(0,0,0,.33),
        inset 0 0 14px rgba(67,242,199,.018) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="hearts"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="diamonds"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="hearts"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="diamonds"] .android-joker-suit-symbol {
      text-shadow:
        0 1px 0 rgba(255,255,255,.35),
        0 0 5px rgba(255,255,255,.075),
        0 0 8px rgba(255,72,95,.216),
        0 0 14px rgba(255,44,75,.102),
        0 3px 5px rgba(0,0,0,.66) !important;
      filter: drop-shadow(0 0 3px rgba(255,73,96,.12)) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="clubs"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="spades"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="clubs"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="spades"] .android-joker-suit-symbol {
      text-shadow:
        0 1px 0 rgba(255,255,255,.42),
        0 0 4px rgba(255,255,255,.288),
        0 0 8px rgba(255,255,255,.216),
        0 0 14px rgba(186,229,255,.12),
        0 3px 5px rgba(0,0,0,.76) !important;
      filter: drop-shadow(0 0 3px rgba(255,255,255,.186)) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="no-trump"] {
      text-shadow:
        0 2px 4px rgba(0,0,0,.74),
        0 0 9px rgba(238,199,100,.075) !important;
      box-shadow:
        0 13px 27px rgba(0,0,0,.46),
        0 0 10px rgba(233,195,95,.057),
        inset 0 1px 0 rgba(255,255,255,.18),
        inset 0 -13px 21px rgba(0,0,0,.34) !important;
    }
  `;

  if (document.getElementById("android-v15-style")) return;

  const style = document.createElement("style");
  style.id = "android-v15-style";
  style.textContent = V15_CSS;
  document.head.append(style);
})();

(() => {
  /* Android V16 performance correction — no visual or gameplay changes. */
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
    gain.gain.setValueAtTime(volume * 0.84 * 1.22, time);
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
    gain.gain.setValueAtTime(volume * 0.84 * 1.22, time);
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
        if (!elements.scoreSheet.hidden) {
          fullRenderScoreSheet();
        }
      });
    };

    elements.scoreButton?.addEventListener("click", refreshVisibleScore);
    elements.scoreClose?.addEventListener("click", refreshVisibleScore);

    if (!elements.scoreSheet.hidden) {
      fullRenderScoreSheet();
    }
  }
})();

(() => {
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

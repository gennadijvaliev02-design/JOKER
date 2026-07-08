(() => {
  const MASTER_VOLUME = 0.84;
  const SFX_VOLUME = 1.22;

  function getContext() {
    if (state.audioContext) {
      state.audioContext.resume?.().catch(() => {});
      return state.audioContext;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return null;
    }

    state.audioContext = new AudioContext();
    state.audioContext.resume?.().catch(() => {});
    return state.audioContext;
  }

  function playTone(ctx, time, { frequency, endFrequency = frequency, duration, type = "triangle", volume = 0.01, destination }) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);

    if (endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), time + duration);
    }

    gain.gain.setValueAtTime(volume * MASTER_VOLUME * SFX_VOLUME, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(destination || ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playNoise(ctx, time, { duration, volume = 0.04, filter = 2600, q = 1.1, type = "bandpass", destination }) {
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      const fade = 1 - index / data.length;
      data[index] = (Math.random() * 2 - 1) * fade;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const biquad = ctx.createBiquadFilter();
    source.buffer = buffer;
    biquad.type = type;
    biquad.frequency.setValueAtTime(filter, time);
    biquad.Q.value = q;
    gain.gain.setValueAtTime(volume * MASTER_VOLUME * SFX_VOLUME, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(destination || ctx.destination);
    source.start(time);
    source.stop(time + duration + 0.02);
  }

  function playShuffle(ctx) {
    const now = ctx.currentTime + 0.02;

    for (let index = 0; index < 18; index += 1) {
      const time = now + index * 0.044;
      playNoise(ctx, time, { duration: 0.052, volume: 0.07, filter: 1500 + (index % 8) * 155 });

      if (index % 2 === 0) {
        playTone(ctx, time, { frequency: 150 + index * 5, endFrequency: 90, duration: 0.04, volume: 0.012 });
      }
    }
  }

  function playDeal(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.038, volume: 0.072, filter: 2300, q: 0.9 });
    playTone(ctx, now, { frequency: 255, endFrequency: 118, duration: 0.034, volume: 0.0075 });
  }

  function playCard(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.06, volume: 0.095, filter: 2750 });
    playTone(ctx, now, { frequency: 220, endFrequency: 115, duration: 0.052, volume: 0.009 });
  }

  function playTrick(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.12, volume: 0.095, filter: 1900 });
    playTone(ctx, now, { frequency: 180, endFrequency: 98, duration: 0.10, volume: 0.012 });
  }

  function playTrump(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.075, volume: 0.058, filter: 3600, q: 1.5 });
    playTone(ctx, now, { frequency: 392, endFrequency: 523, duration: 0.08, type: "triangle", volume: 0.012 });
    playTone(ctx, now + 0.035, { frequency: 523, endFrequency: 659, duration: 0.09, type: "sine", volume: 0.01 });
  }

  function playBidSelect(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.045, volume: 0.072, filter: 2400, q: 1.7 });
    playTone(ctx, now, { frequency: 196, endFrequency: 124, duration: 0.055, type: "triangle", volume: 0.014 });
    playTone(ctx, now + 0.028, { frequency: 587, endFrequency: 740, duration: 0.06, type: "sine", volume: 0.009 });
  }

  function playTrumpSelect(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.075, volume: 0.088, filter: 2850, q: 2.1 });
    playTone(ctx, now, { frequency: 110, endFrequency: 82, duration: 0.09, type: "sawtooth", volume: 0.02 });
    playTone(ctx, now + 0.026, { frequency: 440, endFrequency: 660, duration: 0.11, type: "triangle", volume: 0.015 });
    playTone(ctx, now + 0.095, { frequency: 660, endFrequency: 880, duration: 0.08, type: "sine", volume: 0.01 });
  }

  function playJoker(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.055, volume: 0.105, filter: 5200, q: 2.4, type: "highpass" });
    playTone(ctx, now, { frequency: 196, endFrequency: 98, duration: 0.06, type: "sawtooth", volume: 0.018 });
    playTone(ctx, now + 0.018, { frequency: 740, endFrequency: 1480, duration: 0.075, type: "square", volume: 0.018 });
    playTone(ctx, now + 0.052, { frequency: 1480, endFrequency: 988, duration: 0.065, type: "triangle", volume: 0.012 });
  }

  function playJokerCollect(ctx) {
    const now = ctx.currentTime;

    playNoise(ctx, now, { duration: 0.34, volume: 0.155, filter: 7600, q: 3.2, type: "highpass" });
    playNoise(ctx, now + 0.045, { duration: 0.22, volume: 0.085, filter: 11800, q: 4.6, type: "bandpass" });

    for (let index = 0; index < 18; index += 1) {
      const time = now + 0.018 + index * 0.014;
      const frequency = 1450 + Math.random() * 4200;
      playTone(ctx, time, {
        frequency,
        endFrequency: frequency * (1.35 + Math.random() * 0.65),
        duration: 0.026 + Math.random() * 0.018,
        type: index % 3 === 0 ? "square" : "triangle",
        volume: 0.0065 + Math.random() * 0.007,
      });
    }

    playTone(ctx, now + 0.035, { frequency: 880, endFrequency: 1760, duration: 0.13, type: "triangle", volume: 0.013 });
    playTone(ctx, now + 0.12, { frequency: 1760, endFrequency: 988, duration: 0.17, type: "sine", volume: 0.009 });
  }

  const originalPlaySound = playSound;
  playSound = function polishedPlaySound(type) {
    if (state.autoPlay) {
      return;
    }

    const ctx = getContext();

    if (!ctx) {
      originalPlaySound?.(type);
      return;
    }

    const sounds = {
      shuffle: playShuffle,
      deal: playDeal,
      card: playCard,
      trick: playTrick,
      trump: playTrump,
      bidSelect: playBidSelect,
      trumpSelect: playTrumpSelect,
      joker: playJoker,
      jokerCollect: playJokerCollect,
    };

    const sound = sounds[type];

    if (!sound) {
      return;
    }

    sound(ctx);
  };

  const originalStartGame = startGame;
  startGame = function polishedStartGame(...args) {
    playSound("shuffle");
    return originalStartGame.apply(this, args);
  };

  const originalStartDeal = startDeal;
  startDeal = function polishedStartDeal(...args) {
    playSound("shuffle");
    return originalStartDeal.apply(this, args);
  };
})();

(() => {
  const MASTER_VOLUME = 0.82;
  const SFX_VOLUME = 1.18;

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

  function playNoise(ctx, time, { duration, volume = 0.04, filter = 2600, destination }) {
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
    biquad.type = "bandpass";
    biquad.frequency.setValueAtTime(filter, time);
    biquad.Q.value = 1.1;
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

    for (let index = 0; index < 4; index += 1) {
      const time = now + index * 0.048;
      playNoise(ctx, time, { duration: 0.045, volume: 0.085, filter: 2100 + index * 180 });
      playTone(ctx, time, { frequency: 290 + index * 18, endFrequency: 145, duration: 0.042, volume: 0.01 });
    }
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
    playNoise(ctx, now, { duration: 0.06, volume: 0.038, filter: 3200 });
    playTone(ctx, now, { frequency: 440, endFrequency: 554, duration: 0.09, type: "sine", volume: 0.012 });
    playTone(ctx, now + 0.04, { frequency: 554, endFrequency: 440, duration: 0.09, type: "triangle", volume: 0.008 });
  }

  function playJoker(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.08, volume: 0.032, filter: 4200 });
    playTone(ctx, now, { frequency: 659, endFrequency: 987, duration: 0.12, type: "sine", volume: 0.017 });
    playTone(ctx, now + 0.05, { frequency: 880, endFrequency: 1320, duration: 0.14, type: "triangle", volume: 0.012 });
    playTone(ctx, now + 0.12, { frequency: 1174, endFrequency: 784, duration: 0.10, type: "sine", volume: 0.007 });
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
      joker: playJoker,
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
    window.setTimeout(() => playSound("deal"), 220);
    window.setTimeout(() => playSound("deal"), 520);
    window.setTimeout(() => playSound("deal"), 820);
    return originalStartDeal.apply(this, args);
  };
})();

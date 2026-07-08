(() => {
  const MASTER_VOLUME = 0.42;
  const MUSIC_VOLUME = 0.045;
  const SFX_VOLUME = 0.72;
  let musicStarted = false;
  let musicNodes = [];

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

  function makeGain(ctx, value, destination = ctx.destination) {
    const gain = ctx.createGain();
    gain.gain.value = value;
    gain.connect(destination);
    return gain;
  }

  function playTone(ctx, time, { frequency, endFrequency = frequency, duration, type = "sine", volume = 0.04, destination }) {
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

    for (let index = 0; index < 9; index += 1) {
      const time = now + index * 0.038;
      playNoise(ctx, time, { duration: 0.055, volume: 0.038, filter: 1600 + index * 120 });
      playTone(ctx, time, { frequency: 150 + index * 7, endFrequency: 90, duration: 0.045, type: "triangle", volume: 0.012 });
    }
  }

  function playDeal(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.052, volume: 0.052, filter: 2300 });
    playTone(ctx, now, { frequency: 420, endFrequency: 210, duration: 0.055, type: "triangle", volume: 0.018 });
  }

  function playCard(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.062, volume: 0.058, filter: 2750 });
    playTone(ctx, now, { frequency: 240, endFrequency: 115, duration: 0.058, type: "triangle", volume: 0.014 });
  }

  function playTrump(ctx) {
    const now = ctx.currentTime;
    playTone(ctx, now, { frequency: 392, endFrequency: 587, duration: 0.12, type: "sine", volume: 0.032 });
    playTone(ctx, now + 0.06, { frequency: 587, endFrequency: 784, duration: 0.15, type: "sine", volume: 0.022 });
  }

  function playJoker(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.12, volume: 0.03, filter: 4200 });
    playTone(ctx, now, { frequency: 523, endFrequency: 1046, duration: 0.22, type: "sine", volume: 0.032 });
    playTone(ctx, now + 0.045, { frequency: 659, endFrequency: 1318, duration: 0.20, type: "triangle", volume: 0.022 });
    playTone(ctx, now + 0.11, { frequency: 988, endFrequency: 1976, duration: 0.16, type: "sine", volume: 0.014 });
  }

  function playTrick(ctx) {
    const now = ctx.currentTime;
    playNoise(ctx, now, { duration: 0.11, volume: 0.055, filter: 1900 });
    playTone(ctx, now, { frequency: 196, endFrequency: 98, duration: 0.12, type: "triangle", volume: 0.02 });
  }

  function startMenuMusic() {
    if (musicStarted || state.autoPlay) {
      return;
    }

    const ctx = getContext();

    if (!ctx) {
      return;
    }

    musicStarted = true;
    const master = makeGain(ctx, MUSIC_VOLUME * MASTER_VOLUME);
    const low = ctx.createOscillator();
    const mid = ctx.createOscillator();
    const pad = ctx.createOscillator();
    const lowGain = makeGain(ctx, 0.42, master);
    const midGain = makeGain(ctx, 0.20, master);
    const padGain = makeGain(ctx, 0.13, master);
    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = 950;
    filter.Q.value = 0.7;
    master.disconnect();
    master.connect(filter);
    filter.connect(ctx.destination);

    low.type = "sine";
    mid.type = "triangle";
    pad.type = "sine";
    low.frequency.value = 82.41;
    mid.frequency.value = 164.81;
    pad.frequency.value = 329.63;
    low.connect(lowGain);
    mid.connect(midGain);
    pad.connect(padGain);
    low.start();
    mid.start();
    pad.start();

    musicNodes = [low, mid, pad, lowGain, midGain, padGain, master, filter];

    const notes = [82.41, 98, 110, 123.47, 98, 87.31];
    let step = 0;

    window.setInterval(() => {
      if (!musicStarted || !state.audioContext) {
        return;
      }

      const time = ctx.currentTime;
      const root = notes[step % notes.length];
      low.frequency.exponentialRampToValueAtTime(root, time + 0.6);
      mid.frequency.exponentialRampToValueAtTime(root * 2, time + 0.8);
      pad.frequency.exponentialRampToValueAtTime(root * 4, time + 1.1);
      step += 1;
    }, 2600);
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
      trump: playTrump,
      joker: playJoker,
      trick: playTrick,
    };

    (sounds[type] || playCard)(ctx);
  };

  const originalStartGame = startGame;
  startGame = function polishedStartGame(...args) {
    startMenuMusic();
    playSound("shuffle");
    return originalStartGame.apply(this, args);
  };

  const originalStartDeal = startDeal;
  startDeal = function polishedStartDeal(...args) {
    playSound("shuffle");
    return originalStartDeal.apply(this, args);
  };
})();

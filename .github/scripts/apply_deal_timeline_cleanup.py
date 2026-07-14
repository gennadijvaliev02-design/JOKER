from pathlib import Path

path = Path("android-deal-2026.js")
text = path.read_text(encoding="utf-8")

if "const activeAnimations = new Set();" not in text:
    text = text.replace(
        "  const stageCards = { left: [], top: [], right: [], bottom: [] };\n"
        "  const noiseCache = new WeakMap();\n",
        "  const stageCards = { left: [], top: [], right: [], bottom: [] };\n"
        "  const noiseCache = new WeakMap();\n"
        "  const activeAnimations = new Set();\n"
        "  const activeSoundSources = new Set();\n",
        1,
    )

if "function trackAnimation(animation, onFinish)" not in text:
    text = text.replace(
        "  function safeDelay(value) {\n",
        "  function trackAnimation(animation, onFinish) {\n"
        "    activeAnimations.add(animation);\n"
        "    let settled = false;\n\n"
        "    const settle = () => {\n"
        "      if (settled) return;\n"
        "      settled = true;\n"
        "      activeAnimations.delete(animation);\n"
        "      onFinish?.();\n"
        "    };\n\n"
        "    animation.addEventListener(\"finish\", settle, { once: true });\n"
        "    animation.addEventListener(\"cancel\", settle, { once: true });\n"
        "    return animation;\n"
        "  }\n\n"
        "  function cancelActiveMotion() {\n"
        "    activeAnimations.forEach((animation) => animation.cancel());\n"
        "    activeAnimations.clear();\n\n"
        "    activeSoundSources.forEach((source) => {\n"
        "      try {\n"
        "        source.stop();\n"
        "      } catch {\n"
        "        // The source may have already ended.\n"
        "      }\n"
        "    });\n"
        "    activeSoundSources.clear();\n"
        "  }\n\n"
        "  function safeDelay(value) {\n",
        1,
    )

if "cancelActiveMotion();\n    previousTotal = 0;" not in text:
    text = text.replace(
        "  function resetDeal() {\n"
        "    activeToken += 1;\n"
        "    previousTotal = 0;\n",
        "  function resetDeal() {\n"
        "    activeToken += 1;\n"
        "    cancelActiveMotion();\n"
        "    previousTotal = 0;\n",
        1,
    )

old_sound_start = text.find("  function playDealTick(sound) {")
if old_sound_start != -1:
    old_sound_end = text.find("\n  function dealerOrder()", old_sound_start)
    if old_sound_end == -1:
        raise SystemExit("playDealTick end marker not found")
    new_sound = '''  function playDealTick(sound, delay = 0) {
    if (!sound) return;
    const { context, buffer, duration, frames, variants } = sound;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const variant = soundVariant % variants;
    soundVariant += 1;
    const startAt = context.currentTime + safeDelay(delay) / 1000;
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2250 + variant * 110, startAt);
    filter.Q.value = 0.9;
    gain.gain.setValueAtTime(0.060, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    activeSoundSources.add(source);
    source.addEventListener("ended", () => {
      activeSoundSources.delete(source);
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start(startAt, variant * frames / context.sampleRate, duration);
    source.stop(startAt + duration + 0.01);
  }
'''
    text = text[:old_sound_start] + new_sound + text[old_sound_end:]

old_animation_start = text.find("  function animateToStage({ card, start, end, delay, token, sound }) {\n    window.setTimeout(() => {")
if old_animation_start != -1:
    old_animation_end = text.find("\n  function revealBottomPreview()", old_animation_start)
    if old_animation_end == -1:
        raise SystemExit("animateToStage end marker not found")
    new_animation = '''  function animateToStage({ card, start, end, delay, token, sound }) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const arc = Math.min(42, 16 + Math.abs(deltaX) * 0.025 + Math.abs(deltaY) * 0.07);
    const middleX = start.x + deltaX * 0.55;
    const middleY = start.y + deltaY * 0.55 - arc;
    const wobble = (Number(card.dataset.absoluteIndex) % 3 - 1) * 2.2;

    playDealTick(sound, delay);
    const animation = card.animate([
      { opacity: 0, transform: `translate3d(${start.x}px, ${start.y}px, 0) rotate(-3deg) scale(.82)` },
      { opacity: 0.88, transform: `translate3d(${start.x}px, ${start.y}px, 0) rotate(-3deg) scale(.82)`, offset: 0.02 },
      { opacity: 1, transform: `translate3d(${middleX}px, ${middleY}px, 0) rotate(${end.rotation * 0.40 + wobble}deg) scale(1.03)`, offset: 0.62 },
      { opacity: 1, transform: end.css },
    ], {
      delay: safeDelay(delay),
      duration: safeDelay(FLIGHT_DURATION),
      easing: "cubic-bezier(.18,.76,.22,1)",
      fill: "both",
    });

    trackAnimation(animation, () => {
      if (token !== activeToken || !card.isConnected) return;
      card.style.transform = end.css;
      card.style.opacity = "1";
      card.classList.add("is-staged");
      animation.cancel();
    });
  }
'''
    text = text[:old_animation_start] + new_animation + text[old_animation_end:]

old_transfer = '''        promises.push(new Promise((resolve) => {
          window.setTimeout(() => {
            if (token !== activeToken || !record.node.isConnected) {
              resolve();
              return;
            }
            const animation = record.node.animate([
              { opacity: 1, transform: record.node.style.transform },
              { opacity: 1, transform: end },
              { opacity: 0.10, transform: end },
            ], {
              duration: safeDelay(TRANSFER_DURATION),
              easing: "cubic-bezier(.16,.82,.22,1)",
              fill: "forwards",
            });
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              resolve();
            };
            animation.addEventListener?.("finish", finish, { once: true });
            animation.finished?.then(finish).catch(() => {});
            window.setTimeout(finish, safeDelay(TRANSFER_DURATION + 80));
          }, safeDelay(delay));
        }));
'''
new_transfer = '''        promises.push(new Promise((resolve) => {
          if (token !== activeToken || !record.node.isConnected) {
            resolve();
            return;
          }

          const animation = record.node.animate([
            { opacity: 1, transform: record.node.style.transform },
            { opacity: 1, transform: end },
            { opacity: 0.10, transform: end },
          ], {
            delay: safeDelay(delay),
            duration: safeDelay(TRANSFER_DURATION),
            easing: "cubic-bezier(.16,.82,.22,1)",
            fill: "both",
          });
          trackAnimation(animation, resolve);
        }));
'''
if old_transfer in text:
    text = text.replace(old_transfer, new_transfer, 1)
elif new_transfer not in text:
    raise SystemExit("transfer animation block not found")

old_create = '''  function createStageCard(back, seat, absoluteIndex) {
    const card = document.createElement("span");
    card.className = "deal-2026-stage-card";
    card.dataset.seat = seat;
    card.dataset.absoluteIndex = String(absoluteIndex);
    applyBack(card, back);
    layer.append(card);
    return card;
  }
'''
new_create = '''  function createStageCard(back, seat, absoluteIndex) {
    const card = document.createElement("span");
    card.className = "deal-2026-stage-card";
    card.dataset.seat = seat;
    card.dataset.absoluteIndex = String(absoluteIndex);
    applyBack(card, back);
    return card;
  }
'''
if old_create in text:
    text = text.replace(old_create, new_create, 1)
elif new_create not in text:
    raise SystemExit("createStageCard block not found")

if "      cancelActiveMotion();\n      activeToken += 1;" not in text:
    text = text.replace(
        "      activeToken += 1;\n"
        "      const token = activeToken;\n"
        "      removeLegacyArtifacts();\n",
        "      cancelActiveMotion();\n"
        "      activeToken += 1;\n"
        "      const token = activeToken;\n"
        "      removeLegacyArtifacts();\n",
        1,
    )

if "const cardFragment = document.createDocumentFragment();" not in text:
    text = text.replace(
        "      let step = 0;\n\n"
        "      for (let round = 0; round < batch.count; round += 1) {\n",
        "      let step = 0;\n"
        "      const cardFragment = document.createDocumentFragment();\n"
        "      const flightJobs = [];\n\n"
        "      for (let round = 0; round < batch.count; round += 1) {\n",
        1,
    )

if "          cardFragment.append(card);" not in text:
    text = text.replace(
        "          const card = createStageCard(back, seat, absoluteIndex);\n"
        "          stageCards[seat].push({\n",
        "          const card = createStageCard(back, seat, absoluteIndex);\n"
        "          cardFragment.append(card);\n"
        "          stageCards[seat].push({\n",
        1,
    )

if "          flightJobs.push({ card, start, end, delay: step * CARD_INTERVAL, token, sound });" not in text:
    text = text.replace(
        "          animateToStage({ card, start, end, delay: step * CARD_INTERVAL, token, sound });\n",
        "          flightJobs.push({ card, start, end, delay: step * CARD_INTERVAL, token, sound });\n",
        1,
    )

if "      flightJobs.forEach(animateToStage);" not in text:
    text = text.replace(
        "      const flightEnd = Math.max(0, step - 1) * CARD_INTERVAL + FLIGHT_DURATION;\n",
        "      layer.append(cardFragment);\n"
        "      flightJobs.forEach(animateToStage);\n\n"
        "      const flightEnd = Math.max(0, step - 1) * CARD_INTERVAL + FLIGHT_DURATION;\n",
        1,
    )

path.write_text(text, encoding="utf-8")

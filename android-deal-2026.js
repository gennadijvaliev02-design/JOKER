(() => {
  "use strict";

  /* Android Deal 2026 — one owner, table staging piles, no duplicate hands. */
  const CARD_INTERVAL = 190;
  const FLIGHT_DURATION = 540;
  const PREVIEW_FLIP_DURATION = 360;
  const TRANSFER_DELAY = 230;
  const TRANSFER_DURATION = 560;
  const TRANSFER_STAGGER = 18;
  const CLEANUP_PAD = 170;

  if (window.__JOKER_ANDROID_DEAL_2026_STAGE__) return;
  window.__JOKER_ANDROID_DEAL_2026_STAGE__ = true;

  let installed = false;
  let activeToken = 0;
  let lastDuration = 900;
  let dealSignature = "";
  let previousTotal = 0;
  let soundVariant = 0;
  let layer = null;
  let tableRect = null;
  let cardWidth = 50;
  let cardHeight = 70;

  const stageCards = { left: [], top: [], right: [], bottom: [] };
  const noiseCache = new WeakMap();

  function safeDelay(value) {
    return typeof getDelay === "function" ? getDelay(value) : value;
  }

  function currentSignature() {
    return `${window.JokerRules?.activeId || "rules"}:${state.currentPulka}:${state.currentGame}`;
  }

  function humanNodes() {
    return [...(elements?.playerHand?.querySelectorAll(":scope > .card") || [])];
  }

  function opponentNodes(seat) {
    return [...(document.querySelector(`.${seat}-stack`)?.children || [])];
  }

  function rectInTable(element, currentTableRect = tableRect) {
    const rect = element.getBoundingClientRect();
    const left = rect.left - currentTableRect.left;
    const top = rect.top - currentTableRect.top;
    return {
      left,
      top,
      right: left + rect.width,
      bottom: top + rect.height,
      width: rect.width,
      height: rect.height,
      centerX: left + rect.width / 2,
      centerY: top + rect.height / 2,
    };
  }

  function getBackSnapshot() {
    const sample = document.querySelector(".hidden-cards span")
      || document.querySelector(".flying-card-back")
      || document.querySelector(".card-back");

    if (!sample) {
      return {
        color: "#f3eee2",
        image: "repeating-linear-gradient(45deg,#d6d0c2 0 2px,#f3eee2 2px 5px)",
        position: "center",
        size: "cover",
        repeat: "no-repeat",
      };
    }

    const style = getComputedStyle(sample);
    return {
      color: style.backgroundColor,
      image: style.backgroundImage,
      position: style.backgroundPosition,
      size: style.backgroundSize,
      repeat: style.backgroundRepeat,
    };
  }

  function applyBack(node, back) {
    node.style.backgroundColor = back.color;
    node.style.backgroundImage = back.image;
    node.style.backgroundPosition = back.position;
    node.style.backgroundSize = back.size;
    node.style.backgroundRepeat = back.repeat;
  }

  function clearBack(node) {
    node.style.removeProperty("background-color");
    node.style.removeProperty("background-image");
    node.style.removeProperty("background-position");
    node.style.removeProperty("background-size");
    node.style.removeProperty("background-repeat");
  }

  function overlapArea(first, second, margin = 12) {
    const left = Math.max(first.left - margin, second.left);
    const top = Math.max(first.top - margin, second.top);
    const right = Math.min(first.right + margin, second.right);
    const bottom = Math.min(first.bottom + margin, second.bottom);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  }

  function findDeckCenter(width, height) {
    const smile = elements?.emotionButton || document.querySelector("#emotion-button");
    const padding = 12;

    if (!smile || !smile.getClientRects().length) {
      return { x: tableRect.width - width - 74, y: height / 2 + 24 };
    }

    const smileRect = rectInTable(smile);
    const clampX = (value) => Math.max(width / 2 + padding, Math.min(tableRect.width - width / 2 - padding, value));
    const clampY = (value) => Math.max(height / 2 + padding, Math.min(tableRect.height - height / 2 - padding, value));
    const gap = 18;
    const horizontal = smileRect.width / 2 + width / 2 + gap;
    const vertical = smileRect.height / 2 + height / 2 + gap;

    const candidates = [
      [smileRect.centerX - horizontal, smileRect.centerY],
      [smileRect.centerX - horizontal, smileRect.centerY + height * 0.72],
      [smileRect.centerX, smileRect.centerY + vertical],
      [smileRect.centerX - horizontal - width * 0.78, smileRect.centerY + height * 0.52],
      [smileRect.centerX - horizontal - width * 0.78, smileRect.centerY],
      [smileRect.centerX - horizontal, smileRect.centerY - height * 0.72],
    ].map(([x, y]) => ({ x: clampX(x), y: clampY(y) }));

    const blockers = [...document.querySelectorAll(
      ".player, .game-hud, #table-menu, #score-button, .hand, .game-summary:not([hidden]), .table-notice:not([hidden]), .bid-panel:not([hidden]), .game-dialog:not([hidden])",
    )]
      .filter((node) => node !== smile && node.getClientRects().length > 0)
      .map((node) => rectInTable(node));

    function score({ x, y }) {
      const candidate = {
        left: x - width / 2,
        top: y - height / 2,
        right: x + width / 2,
        bottom: y + height / 2,
      };
      const collision = blockers.reduce((sum, blocker) => sum + overlapArea(candidate, blocker), 0);
      return collision * 1000 + Math.hypot(x - smileRect.centerX, y - smileRect.centerY);
    }

    return candidates.sort((first, second) => score(first) - score(second))[0];
  }

  function stageCenter(seat) {
    const width = tableRect.width;
    const height = tableRect.height;
    const compact = height <= 430;
    const centers = {
      top: { x: width * 0.50, y: height * (compact ? 0.245 : 0.255) },
      left: { x: width * (compact ? 0.285 : 0.295), y: height * 0.485 },
      right: { x: width * (compact ? 0.715 : 0.705), y: height * 0.485 },
      bottom: { x: width * 0.50, y: height * (compact ? 0.695 : 0.715) },
    };
    return centers[seat] || centers.bottom;
  }

  function stageTransform(seat, absoluteIndex, total) {
    const center = stageCenter(seat);
    const capped = Math.min(absoluteIndex, 8);
    const middle = (Math.min(Math.max(total, 1), 9) - 1) / 2;
    const spread = capped - middle;
    let x = center.x - cardWidth / 2;
    let y = center.y - cardHeight / 2;
    let rotation = 0;

    if (seat === "top" || seat === "bottom") {
      x += spread * 5.2;
      y += Math.abs(spread) * 0.75 + capped * 0.9;
      rotation = spread * 1.25;
    } else {
      x += capped * (seat === "left" ? 1.2 : -1.2);
      y += spread * 4.1;
      rotation = (seat === "left" ? -90 : 90) + spread * 0.8;
    }

    return {
      x,
      y,
      rotation,
      css: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(1)`,
    };
  }

  function createLayer() {
    const node = document.createElement("div");
    node.className = "deal-2026-stage-layer";
    node.setAttribute("aria-hidden", "true");
    elements.table.append(node);
    layer = node;
    tableRect = elements.table.getBoundingClientRect();
    const compact = tableRect.height <= 430;
    cardWidth = compact ? 45 : 50;
    cardHeight = compact ? 63 : 70;
    elements.table.classList.add("is-deal-2026-staging");
  }

  function ensureLayer() {
    if (!layer?.isConnected) createLayer();
    tableRect = elements.table.getBoundingClientRect();
  }

  function clearStageCards() {
    Object.values(stageCards).forEach((cards) => cards.splice(0).forEach((record) => record.node.remove()));
  }

  function removeLegacyArtifacts() {
    document.querySelectorAll(
      ".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .v11-deal-layer, .v12-deal-layer, .v13-deal-layer, .v14-deal-layer, .v17-deal-layer, .v18-deal-layer, .android-dealer-deck",
    ).forEach((node) => node.remove());

    document.querySelectorAll(
      ".is-deal-pending, .is-deal-arrived, .is-v11-deal-pending, .is-v11-deal-arrived, .is-v12-deal-pending, .is-v12-facedown, .is-v13-pending, .is-v13-facedown, .is-v14-pending, .is-v14-facedown, .is-v17-human-pending, .is-v18-human-pending, .is-deal-2026-opponent-pending, .is-deal-2026-human-pending",
    ).forEach((node) => node.classList.remove(
      "is-deal-pending", "is-deal-arrived", "is-v11-deal-pending", "is-v11-deal-arrived",
      "is-v12-deal-pending", "is-v12-facedown", "is-v13-pending", "is-v13-facedown",
      "is-v14-pending", "is-v14-facedown", "is-v17-human-pending", "is-v18-human-pending",
      "is-deal-2026-opponent-pending", "is-deal-2026-human-pending",
    ));

    elements?.table?.classList.remove(
      "is-dealing", "is-v11-dealing", "is-v12-dealing", "is-v13-dealing",
      "is-v14-dealing", "is-v18-dealing", "is-deal-2026-running",
    );
  }

  function resetDeal() {
    activeToken += 1;
    previousTotal = 0;
    clearStageCards();
    layer?.remove();
    layer = null;
    elements?.table?.classList.remove("is-deal-2026-staging");
    removeLegacyArtifacts();
  }

  function getBatch(total) {
    const signature = currentSignature();
    if (signature !== dealSignature || total <= previousTotal) {
      resetDeal();
      dealSignature = signature;
    }
    const from = previousTotal;
    const count = Math.max(0, total - from);
    previousTotal = total;
    return { from, count, total };
  }

  function clearNativeDealEffects() {
    humanNodes().forEach((card) => {
      card.classList.remove("is-dealt");
      card.style.removeProperty("--deal-delay");
    });
  }

  function prepareDealSound() {
    const context = state.audioContext;
    if (!context) return null;
    context.resume?.().catch(() => {});
    const existing = noiseCache.get(context);
    if (existing) return { context, ...existing };

    const duration = 0.038;
    const variants = 4;
    const frames = Math.max(1, Math.ceil(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frames * variants, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let variant = 0; variant < variants; variant += 1) {
      const base = variant * frames;
      for (let index = 0; index < frames; index += 1) {
        data[base + index] = (Math.random() * 2 - 1) * (1 - index / frames);
      }
    }
    const cached = { buffer, duration, frames, variants };
    noiseCache.set(context, cached);
    return { context, ...cached };
  }

  function playDealTick(sound) {
    if (!sound) return;
    const { context, buffer, duration, frames, variants } = sound;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const variant = soundVariant % variants;
    soundVariant += 1;
    const now = context.currentTime;
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2250 + variant * 110, now);
    filter.Q.value = 0.9;
    gain.gain.setValueAtTime(0.060, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now, variant * frames / context.sampleRate, duration);
    source.stop(now + duration + 0.01);
  }

  function dealerOrder() {
    const dealerNumber = state.currentGame === 1 ? 4 : state.currentGame - 1;
    const dealer = state.players.find((player) => player.order === dealerNumber)
      || (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"
        ? getPlayerById(getGameLeaderId()) : null)
      || state.players[0];
    const order = typeof getPlayerOrderFrom === "function"
      ? [...getPlayerOrderFrom(dealer?.id)]
      : state.players.map((player) => player.id);
    if (order.length > 1 && order[0] === dealer?.id) order.push(order.shift());
    return order;
  }

  function freshHumanIdsForBatch(count) {
    const existing = new Set(stageCards.bottom.map((record) => record.cardId).filter(Boolean));
    return (state.hands?.human || [])
      .map((card) => card?.id)
      .filter((id) => id && !existing.has(id))
      .slice(0, count);
  }

  function createDeck(back) {
    const deck = document.createElement("div");
    deck.className = "deal-2026-stage-deck";
    for (let index = 0; index < 3; index += 1) {
      const card = document.createElement("span");
      card.className = "deal-2026-stage-deck-card";
      applyBack(card, back);
      deck.append(card);
    }
    const center = findDeckCenter(cardWidth, cardHeight);
    deck.style.left = `${center.x}px`;
    deck.style.top = `${center.y}px`;
    layer.append(deck);
    return deck;
  }

  function createStageCard(back, seat, absoluteIndex) {
    const card = document.createElement("span");
    card.className = "deal-2026-stage-card";
    card.dataset.seat = seat;
    card.dataset.absoluteIndex = String(absoluteIndex);
    applyBack(card, back);
    layer.append(card);
    return card;
  }

  function animateToStage({ card, start, end, delay, token, sound }) {
    window.setTimeout(() => {
      if (token !== activeToken || !card.isConnected) return;
      playDealTick(sound);
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const arc = Math.min(42, 16 + Math.abs(deltaX) * 0.025 + Math.abs(deltaY) * 0.07);
      const middleX = start.x + deltaX * 0.55;
      const middleY = start.y + deltaY * 0.55 - arc;
      const wobble = (Number(card.dataset.absoluteIndex) % 3 - 1) * 2.2;
      const animation = card.animate([
        { opacity: 0.88, transform: `translate3d(${start.x}px, ${start.y}px, 0) rotate(-3deg) scale(.82)` },
        { opacity: 1, transform: `translate3d(${middleX}px, ${middleY}px, 0) rotate(${end.rotation * 0.40 + wobble}deg) scale(1.03)`, offset: 0.62 },
        { opacity: 1, transform: end.css },
      ], {
        duration: safeDelay(FLIGHT_DURATION),
        easing: "cubic-bezier(.18,.76,.22,1)",
        fill: "forwards",
      });

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        card.style.transform = end.css;
        card.style.opacity = "1";
        animation.cancel();
        card.classList.add("is-staged");
      };
      animation.addEventListener?.("finish", finish, { once: true });
      animation.finished?.then(finish).catch(() => {});
      window.setTimeout(finish, safeDelay(FLIGHT_DURATION + 90));
    }, safeDelay(delay));
  }

  function revealBottomPreview() {
    const nodesById = new Map(humanNodes().map((node) => [node.dataset.card, node]));
    stageCards.bottom.forEach((record) => {
      if (!record.cardId || record.faceUp) return;
      const actual = nodesById.get(record.cardId);
      if (!actual) return;
      record.faceUp = true;
      record.node.innerHTML = actual.innerHTML;
      record.node.classList.add("card", "is-preview-face");
      if (actual.classList.contains("red")) record.node.classList.add("red");
      if (actual.classList.contains("black")) record.node.classList.add("black");
      if (actual.classList.contains("joker-card")) record.node.classList.add("joker-card");
      clearBack(record.node);
      record.node.animate([
        { transform: `${record.node.style.transform} rotateY(90deg)`, opacity: 0.72 },
        { transform: record.node.style.transform, opacity: 1 },
      ], {
        duration: safeDelay(PREVIEW_FLIP_DURATION),
        easing: "cubic-bezier(.2,.72,.22,1)",
      });
    });
  }

  function targetForRecord(record, seatTargets, index) {
    if (record.seat === "bottom") {
      return seatTargets.get(record.cardId) || humanNodes()[index] || null;
    }
    return seatTargets[index] || null;
  }

  function transferTransform(target, seat) {
    const rect = rectInTable(target);
    const scaleX = Math.max(0.48, rect.width / cardWidth);
    const scaleY = Math.max(0.48, rect.height / cardHeight);
    const rotation = seat === "left" ? -90 : seat === "right" ? 90 : 0;
    return `translate3d(${rect.left}px, ${rect.top}px, 0) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  }

  function transferAllToHands(token) {
    clearNativeDealEffects();
    const promises = [];
    let globalIndex = 0;

    for (const seat of ["left", "top", "right", "bottom"]) {
      const records = stageCards[seat];
      const targets = seat === "bottom"
        ? new Map(humanNodes().map((node) => [node.dataset.card, node]))
        : opponentNodes(seat);

      records.forEach((record, index) => {
        const target = targetForRecord(record, targets, index);
        if (!target?.isConnected || !record.node?.isConnected) return;
        const end = transferTransform(target, seat);
        const delay = globalIndex * TRANSFER_STAGGER;
        globalIndex += 1;

        promises.push(new Promise((resolve) => {
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
      });
    }

    return Promise.all(promises).then(() => {
      if (token !== activeToken) return;
      clearNativeDealEffects();
      elements.table.classList.remove("is-deal-2026-staging");
      elements.table.classList.add("is-deal-2026-revealing");
      window.setTimeout(() => elements.table.classList.remove("is-deal-2026-revealing"), 430);
      clearStageCards();
      layer?.remove();
      layer = null;
    });
  }

  function injectStyles() {
    if (document.getElementById("android-deal-2026-stage-style")) return;
    const style = document.createElement("style");
    style.id = "android-deal-2026-stage-style";
    style.textContent = `
      .deal-2026-stage-layer {
        position: absolute !important;
        inset: 0 !important;
        z-index: 74 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        contain: layout paint style !important;
        transform: translateZ(0) !important;
      }
      .deal-2026-stage-deck {
        position: absolute !important;
        width: 50px !important;
        height: 70px !important;
        transform: translate3d(-50%, -50%, 0) rotate(-2deg) !important;
        transform-origin: center !important;
        contain: strict !important;
        animation: deal-2026-deck-breathe 2.1s ease-in-out infinite alternate !important;
      }
      .deal-2026-stage-deck-card,
      .deal-2026-stage-card {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 50px !important;
        height: 70px !important;
        border: 1.5px solid rgba(249,246,237,.94) !important;
        border-radius: 6px !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.34), 0 8px 15px rgba(0,0,0,.30) !important;
        backface-visibility: hidden !important;
        pointer-events: none !important;
      }
      .deal-2026-stage-deck-card:nth-child(1) { transform: translate3d(-6px,-5px,0) rotate(-3deg) !important; }
      .deal-2026-stage-deck-card:nth-child(2) { transform: translate3d(-3px,-2px,0) rotate(-1deg) !important; }
      .deal-2026-stage-deck-card:nth-child(3) { transform: translate3d(0,0,0) rotate(1deg) !important; }
      .deal-2026-stage-card {
        opacity: 0;
        z-index: 3 !important;
        will-change: transform, opacity !important;
        contain: layout paint style !important;
      }
      .deal-2026-stage-card.is-staged { opacity: 1 !important; }
      .deal-2026-stage-card.card.is-preview-face {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        width: 50px !important;
        height: 70px !important;
        overflow: hidden !important;
        transform-origin: center !important;
        box-shadow: 0 8px 15px rgba(0,0,0,.30) !important;
      }
      .deal-2026-stage-card.card.is-preview-face .card-corner { font-size: 10px !important; line-height: .9 !important; }
      .deal-2026-stage-card.card.is-preview-face .card-center { font-size: 27px !important; }
      .deal-2026-stage-card.card.is-preview-face .joker-word { font-size: 6px !important; }
      .is-deal-2026-staging .hand .card,
      .is-deal-2026-staging .hidden-cards span {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        animation: none !important;
      }
      .is-deal-2026-revealing .hand .card,
      .is-deal-2026-revealing .hidden-cards span {
        animation: deal-2026-real-card-reveal 390ms cubic-bezier(.16,.82,.22,1) both !important;
      }
      .game-summary:not([hidden]),
      .table-notice:not([hidden]),
      .bid-panel:not([hidden]) { z-index: 94 !important; }
      @keyframes deal-2026-real-card-reveal {
        from { opacity: .25; transform: translate3d(0,8px,0) scale(.985); }
        to { opacity: 1; transform: translate3d(0,0,0) scale(1); }
      }
      @keyframes deal-2026-deck-breathe {
        from { transform: translate3d(-50%,-50%,0) rotate(-3deg) scale(.992); }
        to { transform: translate3d(-50%,-50%,0) rotate(1deg) scale(1.012); }
      }
      @media (max-height: 430px) {
        .deal-2026-stage-deck,
        .deal-2026-stage-deck-card,
        .deal-2026-stage-card,
        .deal-2026-stage-card.card.is-preview-face {
          width: 45px !important;
          height: 63px !important;
        }
        .deal-2026-stage-card.card.is-preview-face .card-corner { font-size: 9px !important; }
        .deal-2026-stage-card.card.is-preview-face .card-center { font-size: 24px !important; }
      }
    `;
    document.head.append(style);
  }

  function install() {
    if (installed) return;
    if (
      typeof playCardDealAnimation !== "function"
      || typeof runAfterDealAnimation !== "function"
      || typeof scheduleGameTask !== "function"
      || typeof elements === "undefined"
      || !elements.table
      || !elements.playerHand
    ) {
      window.setTimeout(install, 80);
      return;
    }

    installed = true;
    injectStyles();

    playCardDealAnimation = function playAndroidStagingDeal(handCount) {
      if (state.autoPlay || !elements.table) return;
      const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
      const batch = getBatch(total);
      if (!batch.count) {
        lastDuration = 320;
        return;
      }

      activeToken += 1;
      const token = activeToken;
      removeLegacyArtifacts();
      ensureLayer();
      elements.table.classList.add("is-deal-2026-staging");
      clearNativeDealEffects();

      layer.querySelectorAll(".deal-2026-stage-deck").forEach((node) => node.remove());
      const back = getBackSnapshot();
      const deck = createDeck(back);
      const deckRect = rectInTable(deck);
      const start = {
        x: deckRect.centerX - cardWidth / 2,
        y: deckRect.centerY - cardHeight / 2,
      };
      const order = dealerOrder();
      const sound = prepareDealSound();
      const freshHumanIds = freshHumanIdsForBatch(batch.count);
      let step = 0;

      for (let round = 0; round < batch.count; round += 1) {
        const absoluteIndex = batch.from + round;
        for (const playerId of order) {
          const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;
          if (!player) continue;
          const seat = player.seat;
          const end = stageTransform(seat, absoluteIndex, total);
          const card = createStageCard(back, seat, absoluteIndex);
          stageCards[seat].push({
            seat,
            absoluteIndex,
            cardId: seat === "bottom" ? (freshHumanIds[round] || null) : null,
            node: card,
            faceUp: false,
          });
          animateToStage({ card, start, end, delay: step * CARD_INTERVAL, token, sound });
          step += 1;
        }
      }

      const flightEnd = Math.max(0, step - 1) * CARD_INTERVAL + FLIGHT_DURATION;
      const handSize = Math.max(1, Number(state.currentHandSize) || 9);
      const finalBatch = total >= handSize;

      if (!finalBatch) {
        lastDuration = flightEnd + CLEANUP_PAD;
        window.setTimeout(() => {
          if (token !== activeToken) return;
          deck.remove();
          if (total === Math.min(3, handSize)) revealBottomPreview();
        }, safeDelay(flightEnd + 30));
        return;
      }

      const stagedCount = Object.values(stageCards).reduce((sum, cards) => sum + cards.length, 0);
      const transferSpan = Math.max(0, stagedCount - 1) * TRANSFER_STAGGER + TRANSFER_DURATION;
      lastDuration = flightEnd + TRANSFER_DELAY + transferSpan + CLEANUP_PAD;
      window.setTimeout(() => {
        if (token !== activeToken) return;
        deck.remove();
        transferAllToHands(token);
      }, safeDelay(flightEnd + TRANSFER_DELAY));
    };

    runAfterDealAnimation = function runAfterAndroidStagingDeal(callback) {
      if (state.autoPlay) {
        callback();
        return;
      }
      scheduleGameTask(callback, safeDelay(lastDuration + 80));
    };
  }

  function scheduleInstall() {
    window.setTimeout(install, 260);
  }

  window.addEventListener("joker-rules-adapters-ready", scheduleInstall, { once: true });
  window.addEventListener("load", scheduleInstall, { once: true });
  scheduleInstall();
})();

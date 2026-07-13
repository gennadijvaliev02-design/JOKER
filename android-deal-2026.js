(() => {
  "use strict";

  /* Android Deal 2026 — the only owner of the ordinary 3/6/9-card deal. */
  const CARD_INTERVAL = 190;
  const FLIGHT_DURATION = 540;
  const REVEAL_PAUSE = 240;
  const REVEAL_DURATION = 420;
  const CLEANUP_PAD = 170;

  if (window.__JOKER_ANDROID_DEAL_2026__) return;
  window.__JOKER_ANDROID_DEAL_2026__ = true;

  let installed = false;
  let activeToken = 0;
  let lastDuration = 900;
  let dealSignature = "";
  let previousTotal = 0;
  let soundVariant = 0;

  const revealedHumanIds = new Set();
  const pendingHumanIds = new Set();
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

  function rectInTable(element, tableRect) {
    const rect = element.getBoundingClientRect();
    const left = rect.left - tableRect.left;
    const top = rect.top - tableRect.top;
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

  function overlapArea(first, second, margin = 12) {
    const left = Math.max(first.left - margin, second.left);
    const top = Math.max(first.top - margin, second.top);
    const right = Math.min(first.right + margin, second.right);
    const bottom = Math.min(first.bottom + margin, second.bottom);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  }

  function findDeckCenter(tableRect, width, height) {
    const smile = elements?.emotionButton || document.querySelector("#emotion-button");
    const padding = 12;

    if (!smile || !smile.getClientRects().length) {
      return { x: tableRect.width - width - 74, y: height / 2 + 24 };
    }

    const smileRect = rectInTable(smile, tableRect);
    const clampX = (value) => Math.max(width / 2 + padding, Math.min(tableRect.width - width / 2 - padding, value));
    const clampY = (value) => Math.max(height / 2 + padding, Math.min(tableRect.height - height / 2 - padding, value));
    const baseGap = 18;
    const horizontal = smileRect.width / 2 + width / 2 + baseGap;
    const vertical = smileRect.height / 2 + height / 2 + baseGap;

    const rawCandidates = [
      [smileRect.centerX - horizontal, smileRect.centerY],
      [smileRect.centerX - horizontal, smileRect.centerY + height * 0.72],
      [smileRect.centerX, smileRect.centerY + vertical],
      [smileRect.centerX - horizontal - width * 0.78, smileRect.centerY + height * 0.52],
      [smileRect.centerX - horizontal - width * 0.78, smileRect.centerY],
      [smileRect.centerX - horizontal, smileRect.centerY - height * 0.72],
    ];

    const candidates = rawCandidates.map(([x, y]) => ({ x: clampX(x), y: clampY(y) }));
    const blockers = [...document.querySelectorAll(
      ".player, .game-hud, #table-menu, #score-button, .hand, .game-summary:not([hidden]), .table-notice:not([hidden]), .bid-panel:not([hidden]), .game-dialog:not([hidden])",
    )]
      .filter((node) => node !== smile && node.getClientRects().length > 0)
      .map((node) => rectInTable(node, tableRect));

    const scoreCandidate = ({ x, y }) => {
      const candidate = {
        left: x - width / 2,
        top: y - height / 2,
        right: x + width / 2,
        bottom: y + height / 2,
      };
      const collision = blockers.reduce((sum, blocker) => sum + overlapArea(candidate, blocker), 0);
      const distance = Math.hypot(x - smileRect.centerX, y - smileRect.centerY);
      return collision * 1000 + distance;
    };

    return candidates.sort((first, second) => scoreCandidate(first) - scoreCandidate(second))[0];
  }

  function createLayer(back) {
    const layer = document.createElement("div");
    layer.className = "deal-2026-layer";
    layer.setAttribute("aria-hidden", "true");

    const deck = document.createElement("div");
    deck.className = "deal-2026-deck";

    for (let index = 0; index < 3; index += 1) {
      const card = document.createElement("span");
      card.className = "deal-2026-deck-card";
      applyBack(card, back);
      deck.append(card);
    }

    layer.append(deck);
    elements.table.append(layer);

    const tableRect = elements.table.getBoundingClientRect();
    const compact = tableRect.height <= 430;
    const cardWidth = compact ? 45 : 50;
    const cardHeight = compact ? 63 : 70;
    const center = findDeckCenter(tableRect, cardWidth, cardHeight);

    deck.style.left = `${center.x}px`;
    deck.style.top = `${center.y}px`;

    return { layer, deck, tableRect, cardWidth, cardHeight };
  }

  function removeLegacyArtifacts() {
    document.querySelectorAll(
      ".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .v11-deal-layer, .v12-deal-layer, .v13-deal-layer, .v14-deal-layer, .v17-deal-layer, .v18-deal-layer, .deal-2026-layer, .android-dealer-deck",
    ).forEach((node) => node.remove());

    document.querySelectorAll(
      ".is-deal-pending, .is-deal-arrived, .is-v11-deal-pending, .is-v11-deal-arrived, .is-v12-deal-pending, .is-v12-facedown, .is-v13-pending, .is-v13-facedown, .is-v14-pending, .is-v14-facedown, .is-v17-human-pending, .is-v18-human-pending, .is-deal-2026-opponent-pending",
    ).forEach((node) => node.classList.remove(
      "is-deal-pending",
      "is-deal-arrived",
      "is-v11-deal-pending",
      "is-v11-deal-arrived",
      "is-v12-deal-pending",
      "is-v12-facedown",
      "is-v13-pending",
      "is-v13-facedown",
      "is-v14-pending",
      "is-v14-facedown",
      "is-v17-human-pending",
      "is-v18-human-pending",
      "is-deal-2026-opponent-pending",
    ));

    elements?.table?.classList.remove(
      "is-dealing",
      "is-v11-dealing",
      "is-v12-dealing",
      "is-v13-dealing",
      "is-v14-dealing",
      "is-v18-dealing",
      "is-deal-2026-running",
    );
  }

  function resetMemory() {
    previousTotal = 0;
    revealedHumanIds.clear();
    pendingHumanIds.clear();
    applyHumanVisibility();
  }

  function getBatch(total) {
    const signature = currentSignature();
    if (signature !== dealSignature || total <= previousTotal) {
      dealSignature = signature;
      resetMemory();
    }

    const from = previousTotal;
    const count = Math.max(0, total - from);
    previousTotal = total;
    return { from, count, total };
  }

  function applyHumanVisibility() {
    humanNodes().forEach((card) => {
      card.classList.remove("is-dealt");
      card.style.removeProperty("--deal-delay");
      card.classList.toggle("is-deal-2026-human-pending", pendingHumanIds.has(card.dataset.card));
    });
  }

  function selectHumanBatch(count) {
    const hand = Array.isArray(state.hands?.human) ? state.hands.human : [];
    const ids = hand
      .map((card) => card?.id)
      .filter((id) => id && !revealedHumanIds.has(id))
      .slice(0, count);

    ids.forEach((id) => pendingHumanIds.add(id));
    applyHumanVisibility();

    const nodesById = new Map(humanNodes().map((node) => [node.dataset.card, node]));
    return ids.map((id) => ({ id, node: nodesById.get(id) || null }));
  }

  function selectOpponentBatch(seat, from, total) {
    const stack = document.querySelector(`.${seat}-stack`);
    if (!stack) return [];

    return [...stack.children].slice(from, total).map((node) => {
      node.classList.add("is-deal-2026-opponent-pending");
      return { node };
    });
  }

  function fallbackHumanRects(items, total, tableRect, cardWidth, cardHeight) {
    const handRect = rectInTable(elements.playerHand, tableRect);
    const count = Math.max(1, total);
    const spread = Math.min(tableRect.width * 0.58, cardWidth + (count - 1) * cardWidth * 0.62);
    const step = count > 1 ? (spread - cardWidth) / (count - 1) : 0;
    const startX = handRect.centerX - spread / 2;
    const top = handRect.top + Math.max(0, handRect.height - cardHeight);

    return items.map((item, index) => {
      const absoluteIndex = Math.max(0, state.hands.human.findIndex((card) => card.id === item.id));
      const left = startX + (absoluteIndex >= 0 ? absoluteIndex : index) * step;
      return {
        ...item,
        rect: {
          left,
          top,
          right: left + cardWidth,
          bottom: top + cardHeight,
          width: cardWidth,
          height: cardHeight,
          centerX: left + cardWidth / 2,
          centerY: top + cardHeight / 2,
        },
      };
    });
  }

  function dealerOrder() {
    const dealerNumber = state.currentGame === 1 ? 4 : state.currentGame - 1;
    const dealer = state.players.find((player) => player.order === dealerNumber)
      || (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"
        ? getPlayerById(getGameLeaderId())
        : null)
      || state.players[0];

    const order = typeof getPlayerOrderFrom === "function"
      ? [...getPlayerOrderFrom(dealer?.id)]
      : state.players.map((player) => player.id);

    if (order.length > 1 && order[0] === dealer?.id) order.push(order.shift());
    return order;
  }

  function createFlyingCard(back) {
    const card = document.createElement("span");
    card.className = "deal-2026-flying-card";
    applyBack(card, back);
    return card;
  }

  function createLandedBack(layer, rect, back, rotation, scale) {
    const card = document.createElement("span");
    card.className = "deal-2026-landed-back";
    applyBack(card, back);
    card.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) rotate(${rotation}deg) scale(${scale})`;
    layer.append(card);
    requestAnimationFrame(() => card.classList.add("is-visible"));
    return card;
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
        const fade = 1 - index / frames;
        data[base + index] = (Math.random() * 2 - 1) * fade;
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
    gain.gain.setValueAtTime(0.062, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now, (variant * frames) / context.sampleRate, duration);
    source.stop(now + duration + 0.02);
  }

  function buildPlans({ layer, deck, tableRect, cardWidth, cardHeight, back, queues, count }) {
    const deckRect = rectInTable(deck, tableRect);
    const startX = deckRect.centerX - cardWidth / 2;
    const startY = deckRect.centerY - cardHeight / 2;
    const order = dealerOrder();
    const flights = [];

    for (let round = 0; round < count; round += 1) {
      for (const playerId of order) {
        const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;
        if (!player) continue;
        const target = queues[player.seat]?.shift();
        if (target?.rect) flights.push({ ...target, seat: player.seat });
      }
    }

    return flights.map((flight, index) => {
      const endX = flight.rect.centerX - cardWidth / 2;
      const endY = flight.rect.centerY - cardHeight / 2;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const arc = Math.min(46, 18 + Math.abs(deltaY) * 0.075 + Math.abs(deltaX) * 0.022);
      const rotation = flight.seat === "left" ? -88 : flight.seat === "right" ? 88 : flight.seat === "top" ? 1 : 0;
      const wobble = (index % 3 - 1) * 2;
      const scale = Math.max(0.50, Math.min(1.36, Math.min(
        Math.max(flight.rect.width, 1) / cardWidth,
        Math.max(flight.rect.height, 1) / cardHeight,
      )));
      const card = createFlyingCard(back);
      layer.append(card);

      return {
        ...flight,
        index,
        card,
        rotation,
        scale,
        start: `translate3d(${startX}px, ${startY}px, 0) rotate(-3deg) scale(.82)`,
        lift: `translate3d(${startX + deltaX * 0.20}px, ${startY + deltaY * 0.14 - 12}px, 0) rotate(${wobble}deg) scale(.94)`,
        middle: `translate3d(${startX + deltaX * 0.55}px, ${startY + deltaY * 0.55 - arc}px, 0) rotate(${rotation * 0.42 + wobble}deg) scale(1.025)`,
        end: `translate3d(${endX}px, ${endY}px, 0) rotate(${rotation}deg) scale(${scale})`,
      };
    });
  }

  function startPlan(plan, token, back, sound, landedHumanBacks) {
    let completed = false;
    const delay = safeDelay(plan.index * CARD_INTERVAL);

    const finish = () => {
      if (completed || token !== activeToken) return;
      completed = true;

      if (plan.seat === "bottom") {
        landedHumanBacks.push(createLandedBack(plan.card.parentElement, plan.rect, back, plan.rotation, plan.scale));
      } else {
        plan.node?.classList.remove("is-deal-2026-opponent-pending");
      }
      plan.card.remove();
    };

    const animation = plan.card.animate([
      { opacity: 0.82, transform: plan.start, offset: 0 },
      { opacity: 1, transform: plan.lift, offset: 0.20 },
      { opacity: 1, transform: plan.middle, offset: 0.62 },
      { opacity: 1, transform: plan.end, offset: 1 },
    ], {
      delay,
      duration: safeDelay(FLIGHT_DURATION),
      easing: "cubic-bezier(0.18, 0.72, 0.20, 1)",
      fill: "both",
    });

    animation.addEventListener?.("finish", finish, { once: true });
    animation.finished?.then(finish).catch(() => {});
    window.setTimeout(finish, delay + safeDelay(FLIGHT_DURATION + 100));
    window.setTimeout(() => {
      if (token === activeToken) playDealTick(sound);
    }, delay);
  }

  function revealHuman(ids, landedBacks, token, renderHandFn) {
    if (token !== activeToken) return;

    ids.forEach((id) => {
      pendingHumanIds.delete(id);
      revealedHumanIds.add(id);
    });

    renderHandFn();
    applyHumanVisibility();

    const fresh = new Set(ids);
    humanNodes().forEach((card) => {
      if (!fresh.has(card.dataset.card)) return;
      card.classList.remove("is-deal-2026-human-reveal");
      void card.offsetWidth;
      card.classList.add("is-deal-2026-human-reveal");
      window.setTimeout(() => card.classList.remove("is-deal-2026-human-reveal"), REVEAL_DURATION + 60);
    });

    landedBacks.forEach((card) => card.classList.add("is-leaving"));
  }

  function injectStyles() {
    if (document.getElementById("android-deal-2026-style")) return;

    const style = document.createElement("style");
    style.id = "android-deal-2026-style";
    style.textContent = `
      .deal-2026-layer {
        position: absolute !important;
        inset: 0 !important;
        z-index: 72 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        contain: layout paint style !important;
        transform: translateZ(0) !important;
      }

      .deal-2026-deck {
        position: absolute !important;
        width: 50px !important;
        height: 70px !important;
        transform: translate3d(-50%, -50%, 0) rotate(-2deg) !important;
        transform-origin: center !important;
        animation: deal-2026-deck-breathe 2.2s ease-in-out infinite alternate !important;
        contain: layout paint style !important;
      }

      .deal-2026-deck-card,
      .deal-2026-flying-card,
      .deal-2026-landed-back {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 50px !important;
        height: 70px !important;
        border: 1.5px solid rgba(249, 246, 237, .94) !important;
        border-radius: 6px !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.34), 0 8px 15px rgba(0,0,0,.30) !important;
        backface-visibility: hidden !important;
        pointer-events: none !important;
      }

      .deal-2026-deck-card:nth-child(1) { transform: translate3d(-6px,-5px,0) rotate(-3deg) !important; }
      .deal-2026-deck-card:nth-child(2) { transform: translate3d(-3px,-2px,0) rotate(-1deg) !important; }
      .deal-2026-deck-card:nth-child(3) { transform: translate3d(0,0,0) rotate(1deg) !important; }

      .deal-2026-flying-card {
        z-index: 4 !important;
        opacity: 0;
        will-change: transform, opacity !important;
        contain: strict !important;
      }

      .deal-2026-landed-back {
        z-index: 3 !important;
        opacity: 0;
        will-change: opacity, transform !important;
        transition: opacity 120ms linear !important;
      }
      .deal-2026-landed-back.is-visible { opacity: 1 !important; }
      .deal-2026-landed-back.is-leaving { opacity: 0 !important; transition: opacity 190ms ease !important; }

      .hand .card.is-deal-2026-human-pending,
      .hidden-cards span.is-deal-2026-opponent-pending {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        animation: none !important;
      }

      .hand .card.is-deal-2026-human-reveal {
        animation: deal-2026-human-reveal 420ms cubic-bezier(.16,.82,.22,1) both !important;
        transform-origin: center bottom !important;
      }

      .game-summary:not([hidden]), .table-notice:not([hidden]) { z-index: 92 !important; }

      @keyframes deal-2026-human-reveal {
        0% { opacity: .62; transform: translate3d(0,11px,0) scale(.982); }
        62% { opacity: 1; transform: translate3d(0,-6px,0) scale(1.014); }
        100% { opacity: 1; transform: translate3d(0,0,0) scale(1); }
      }

      @keyframes deal-2026-deck-breathe {
        from { transform: translate3d(-50%,-50%,0) rotate(-3deg) scale(.992); }
        to { transform: translate3d(-50%,-50%,0) rotate(1deg) scale(1.012); }
      }

      @media (max-height: 430px) {
        .deal-2026-deck, .deal-2026-deck-card, .deal-2026-flying-card, .deal-2026-landed-back {
          width: 45px !important;
          height: 63px !important;
        }
      }
    `;
    document.head.append(style);
  }

  function install() {
    if (installed) return;
    if (
      typeof playCardDealAnimation !== "function"
      || typeof renderHand !== "function"
      || typeof scheduleGameTask !== "function"
      || typeof elements === "undefined"
      || !elements.table
      || !elements.playerHand
    ) {
      window.setTimeout(install, 50);
      return;
    }

    installed = true;
    injectStyles();

    const coreRenderHand = renderHand;

    renderHand = function renderHandWithDeal2026(...args) {
      const result = coreRenderHand.apply(this, args);
      applyHumanVisibility();
      return result;
    };

    playCardDealAnimation = function playDeal2026(handCount) {
      if (state.autoPlay || !elements.table) return;

      activeToken += 1;
      const token = activeToken;
      removeLegacyArtifacts();

      const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
      const batch = getBatch(total);
      if (!batch.count) {
        lastDuration = 350;
        return;
      }

      const back = getBackSnapshot();
      const humanBatch = selectHumanBatch(batch.count);
      const humanIds = humanBatch.map((item) => item.id);
      const { layer, deck, tableRect, cardWidth, cardHeight } = createLayer(back);
      elements.table.classList.add("is-deal-2026-running");

      const humanWithRects = humanBatch.map((item) => ({
        ...item,
        rect: item.node?.getClientRects().length ? rectInTable(item.node, tableRect) : null,
      }));
      const resolvedHumans = humanWithRects.every((item) => item.rect)
        ? humanWithRects
        : fallbackHumanRects(humanWithRects, total, tableRect, cardWidth, cardHeight);

      const toTargets = (items) => items.map((item) => ({
        ...item,
        rect: rectInTable(item.node, tableRect),
      }));

      const queues = {
        left: toTargets(selectOpponentBatch("left", batch.from, total)),
        top: toTargets(selectOpponentBatch("top", batch.from, total)),
        right: toTargets(selectOpponentBatch("right", batch.from, total)),
        bottom: resolvedHumans,
      };

      const plans = buildPlans({
        layer,
        deck,
        tableRect,
        cardWidth,
        cardHeight,
        back,
        queues,
        count: batch.count,
      });
      const sound = prepareDealSound();
      const landedHumanBacks = [];

      plans.forEach((plan) => startPlan(plan, token, back, sound, landedHumanBacks));

      const flightEnd = Math.max(0, plans.length - 1) * CARD_INTERVAL + FLIGHT_DURATION;
      lastDuration = flightEnd + REVEAL_PAUSE + REVEAL_DURATION + CLEANUP_PAD;

      window.setTimeout(
        () => revealHuman(humanIds, landedHumanBacks, token, coreRenderHand),
        safeDelay(flightEnd + REVEAL_PAUSE),
      );

      window.setTimeout(() => {
        if (token !== activeToken) return;
        document.querySelectorAll(".is-deal-2026-opponent-pending").forEach((node) => {
          node.classList.remove("is-deal-2026-opponent-pending");
        });
        pendingHumanIds.clear();
        applyHumanVisibility();
        elements.table.classList.remove("is-deal-2026-running");
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
        window.setTimeout(() => layer.remove(), 210);
      }, safeDelay(lastDuration));
    };

    runAfterDealAnimation = function runAfterDeal2026(callback) {
      if (state.autoPlay) {
        callback();
        return;
      }
      scheduleGameTask(callback, safeDelay(lastDuration + 90));
    };
  }

  install();
})();

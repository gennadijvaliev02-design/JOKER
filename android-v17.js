(() => {
  /* Android V18 — final deal owner. Only deal motion, deck placement and deal sound timing. */

  const CARD_INTERVAL = 260;
  const FLIGHT_DURATION = 620;
  const REVEAL_PAUSE = 260;
  const REVEAL_DURATION = 420;
  const CLEANUP_PAD = 180;
  const INSTALL_DELAY = 260;

  let installed = false;
  let activeToken = 0;
  let lastDuration = 900;
  let signature = "";
  let previousTotal = 0;

  const revealedHumanIds = new Set();
  const pendingHumanIds = new Set();

  function safeDelay(value) {
    return typeof getDelay === "function" ? getDelay(value) : value;
  }

  function currentSignature() {
    return `${window.JokerRules?.activeId || "rules"}:${state.currentPulka}:${state.currentGame}`;
  }

  function humanNodes() {
    return [...(elements?.playerHand?.querySelectorAll(":scope > .card") || [])];
  }

  function applyPendingHumanVisibility() {
    humanNodes().forEach((card) => {
      card.classList.toggle("is-v18-human-pending", pendingHumanIds.has(card.dataset.card));
    });
  }

  function sampleBack() {
    return document.querySelector(".hidden-cards span")
      || document.querySelector(".v14-deck-card")
      || document.querySelector(".flying-card-back");
  }

  function readBackStyle() {
    const sample = sampleBack();
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
    return {
      left: rect.left - tableRect.left,
      top: rect.top - tableRect.top,
      right: rect.right - tableRect.left,
      bottom: rect.bottom - tableRect.top,
      width: rect.width,
      height: rect.height,
      centerX: rect.left - tableRect.left + rect.width / 2,
      centerY: rect.top - tableRect.top + rect.height / 2,
    };
  }

  function intersects(first, second, margin = 10) {
    return !(
      first.right + margin <= second.left
      || first.left - margin >= second.right
      || first.bottom + margin <= second.top
      || first.top - margin >= second.bottom
    );
  }

  function findDeckCenter(tableRect, deckWidth, deckHeight) {
    const emotion = elements?.emotionButton || document.querySelector("#emotion-button");
    if (!emotion) {
      return { x: tableRect.width * 0.82, y: tableRect.height * 0.30 };
    }

    const emotionRect = rectInTable(emotion, tableRect);
    const gap = 18;
    const padding = 12;

    const clampX = (value) => Math.min(
      tableRect.width - deckWidth / 2 - padding,
      Math.max(deckWidth / 2 + padding, value),
    );
    const clampY = (value) => Math.min(
      tableRect.height - deckHeight / 2 - padding,
      Math.max(deckHeight / 2 + padding, value),
    );

    const left = emotionRect.left - deckWidth / 2 - gap;
    const right = emotionRect.right + deckWidth / 2 + gap;
    const above = emotionRect.top - deckHeight / 2 - gap;
    const below = emotionRect.bottom + deckHeight / 2 + gap;

    const candidates = [
      [left, emotionRect.centerY],
      [left, below],
      [emotionRect.centerX, below],
      [right, emotionRect.centerY],
      [left - deckWidth * 0.72, below],
      [emotionRect.centerX, above],
    ].map(([x, y]) => ({ x: clampX(x), y: clampY(y) }));

    const blockers = [...document.querySelectorAll(
      ".player, .game-hud, #table-menu, #score-button, .hand, .game-summary:not([hidden]), .table-notice:not([hidden]), .bid-panel:not([hidden])",
    )]
      .filter((element) => element !== emotion && element.getClientRects().length > 0)
      .map((element) => rectInTable(element, tableRect));

    return candidates.find(({ x, y }) => {
      const candidate = {
        left: x - deckWidth / 2,
        top: y - deckHeight / 2,
        right: x + deckWidth / 2,
        bottom: y + deckHeight / 2,
      };
      return blockers.every((blocker) => !intersects(candidate, blocker));
    }) || candidates[0];
  }

  function createLayer(back) {
    const layer = document.createElement("div");
    layer.className = "v18-deal-layer";
    layer.setAttribute("aria-hidden", "true");

    const deck = document.createElement("div");
    deck.className = "v18-deal-deck";

    for (let index = 0; index < 3; index += 1) {
      const card = document.createElement("span");
      card.className = "v18-deck-card";
      applyBack(card, back);
      deck.append(card);
    }

    layer.append(deck);
    elements.table.append(layer);

    const tableRect = elements.table.getBoundingClientRect();
    const compact = tableRect.height <= 430;
    const deckWidth = compact ? 45 : 50;
    const deckHeight = compact ? 63 : 70;
    const center = findDeckCenter(tableRect, deckWidth, deckHeight);

    deck.style.left = `${center.x}px`;
    deck.style.top = `${center.y}px`;

    return { layer, deck, tableRect, deckWidth, deckHeight };
  }

  function cleanLegacyArtifacts() {
    document.querySelectorAll(
      ".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .v11-deal-layer, .v12-deal-layer, .v13-deal-layer, .v14-deal-layer, .v17-deal-layer, .v18-deal-layer, .android-dealer-deck",
    ).forEach((node) => node.remove());

    document.querySelectorAll(".is-v18-opponent-pending").forEach((node) => {
      node.classList.remove("is-v18-opponent-pending");
    });

    elements?.table?.classList.remove(
      "is-dealing",
      "is-v11-dealing",
      "is-v12-dealing",
      "is-v13-dealing",
      "is-v14-dealing",
      "is-v18-dealing",
    );
  }

  function resetBatchMemory() {
    previousTotal = 0;
    revealedHumanIds.clear();
    pendingHumanIds.clear();
    applyPendingHumanVisibility();
  }

  function getBatch(total) {
    const nextSignature = currentSignature();
    if (nextSignature !== signature || total <= previousTotal) {
      signature = nextSignature;
      resetBatchMemory();
    }

    const from = previousTotal;
    const count = Math.max(0, total - from);
    previousTotal = total;
    return { from, count };
  }

  function collectHumanBatch(count) {
    let fresh = humanNodes().filter((card) => {
      const id = card.dataset.card;
      return id && !revealedHumanIds.has(id);
    });

    if (fresh.length > count) {
      fresh = fresh.slice(-count);
    }

    fresh.forEach((card) => {
      const id = card.dataset.card;
      if (id) pendingHumanIds.add(id);
      card.classList.add("is-v18-human-pending");
    });

    return fresh;
  }

  function collectOpponentBatch(seat, from, total) {
    const stack = document.querySelector(`.${seat}-stack`);
    if (!stack) return [];

    const nodes = [...stack.children].slice(from, total);
    nodes.forEach((node) => node.classList.add("is-v18-opponent-pending"));
    return nodes;
  }

  function playerOrderFromDealer() {
    const dealerOrder = state.currentGame === 1 ? 4 : state.currentGame - 1;
    const dealer = state.players.find((player) => player.order === dealerOrder)
      || (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"
        ? getPlayerById(getGameLeaderId())
        : null)
      || state.players[0];

    const order = typeof getPlayerOrderFrom === "function"
      ? [...getPlayerOrderFrom(dealer?.id)]
      : state.players.map((player) => player.id);

    if (order.length > 1 && order[0] === dealer?.id) {
      order.push(order.shift());
    }

    return order;
  }

  function createFlyingCard(back) {
    const card = document.createElement("span");
    card.className = "v18-flying-card";
    applyBack(card, back);
    return card;
  }

  function createLandedBack(layer, targetRect, back, rotation, scale) {
    const card = document.createElement("span");
    card.className = "v18-landed-back";
    applyBack(card, back);
    card.style.transform = `translate3d(${targetRect.left}px, ${targetRect.top}px, 0) rotate(${rotation}deg) scale(${scale})`;
    layer.append(card);
    requestAnimationFrame(() => card.classList.add("is-visible"));
    return card;
  }

  function playDealSound(soundPlayer) {
    if (!soundPlayer) return;
    requestAnimationFrame(() => {
      try {
        soundPlayer("deal");
      } catch (error) {
        console.debug("Android V18 deal sound skipped", error);
      }
    });
  }

  function buildPlans({ layer, deck, tableRect, back, queues, batchCount }) {
    const deckRect = rectInTable(deck, tableRect);
    const compact = tableRect.height <= 430;
    const baseWidth = compact ? 45 : 50;
    const baseHeight = compact ? 63 : 70;
    const startX = deckRect.centerX - baseWidth / 2;
    const startY = deckRect.centerY - baseHeight / 2;
    const order = playerOrderFromDealer();
    const flights = [];

    for (let round = 0; round < batchCount; round += 1) {
      for (const playerId of order) {
        const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;
        if (!player) continue;

        const target = queues[player.seat]?.shift();
        if (target?.isConnected) {
          flights.push({ seat: player.seat, target });
        }
      }
    }

    return flights.map((flight, index) => {
      const targetRect = rectInTable(flight.target, tableRect);
      const endX = targetRect.centerX - baseWidth / 2;
      const endY = targetRect.centerY - baseHeight / 2;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const arc = Math.min(44, 18 + Math.abs(deltaY) * 0.08 + Math.abs(deltaX) * 0.025);
      const middleX = startX + deltaX * 0.54;
      const middleY = startY + deltaY * 0.54 - arc;
      const rotation = flight.seat === "left" ? -88 : flight.seat === "right" ? 88 : flight.seat === "top" ? 1 : 0;
      const wobble = (index % 3 - 1) * 2.1;
      const scale = Math.max(0.52, Math.min(1.38, Math.min(
        Math.max(targetRect.width, 1) / baseWidth,
        Math.max(targetRect.height, 1) / baseHeight,
      )));
      const card = createFlyingCard(back);
      layer.append(card);

      return {
        ...flight,
        index,
        card,
        targetRect,
        rotation,
        scale,
        start: `translate3d(${startX}px, ${startY}px, 0) rotate(-3deg) scale(.82)`,
        lift: `translate3d(${startX + deltaX * 0.20}px, ${startY + deltaY * 0.14 - 12}px, 0) rotate(${wobble}deg) scale(.94)`,
        middle: `translate3d(${middleX}px, ${middleY}px, 0) rotate(${rotation * 0.42 + wobble}deg) scale(1.03)`,
        end: `translate3d(${endX}px, ${endY}px, 0) rotate(${rotation}deg) scale(${scale})`,
      };
    });
  }

  function animatePlan(plan, token, back, soundPlayer, landedHumanBacks) {
    window.setTimeout(() => {
      if (token !== activeToken || !plan.card.isConnected) return;

      playDealSound(soundPlayer);

      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;

        if (plan.seat === "bottom") {
          landedHumanBacks.push(
            createLandedBack(plan.card.parentElement, plan.targetRect, back, plan.rotation, plan.scale),
          );
        } else {
          plan.target.classList.remove("is-v18-opponent-pending");
        }

        plan.card.remove();
      };

      const animation = plan.card.animate([
        { opacity: 0.86, transform: plan.start, offset: 0 },
        { opacity: 1, transform: plan.lift, offset: 0.22 },
        { opacity: 1, transform: plan.middle, offset: 0.62 },
        { opacity: 1, transform: plan.end, offset: 1 },
      ], {
        duration: safeDelay(FLIGHT_DURATION),
        easing: "cubic-bezier(0.18, 0.72, 0.20, 1)",
        fill: "forwards",
      });

      animation.addEventListener?.("finish", finish, { once: true });
      animation.finished?.then(finish).catch(() => {});
      window.setTimeout(finish, safeDelay(FLIGHT_DURATION + 100));
    }, safeDelay(plan.index * CARD_INTERVAL));
  }

  function revealHumanBatch(ids, landedBacks, token) {
    if (token !== activeToken) return;

    ids.forEach((id) => {
      pendingHumanIds.delete(id);
      revealedHumanIds.add(id);
    });
    applyPendingHumanVisibility();

    const idSet = new Set(ids);
    humanNodes().forEach((card) => {
      if (!idSet.has(card.dataset.card)) return;
      card.classList.remove("is-v18-human-reveal");
      void card.offsetWidth;
      card.classList.add("is-v18-human-reveal");
      window.setTimeout(() => card.classList.remove("is-v18-human-reveal"), REVEAL_DURATION + 60);
    });

    landedBacks.forEach((card) => card.classList.add("is-leaving"));
  }

  function injectStyles() {
    if (document.getElementById("android-v18-deal-style")) return;

    const style = document.createElement("style");
    style.id = "android-v18-deal-style";
    style.textContent = `
      .v18-deal-layer {
        position: absolute !important;
        inset: 0 !important;
        z-index: 72 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        contain: layout paint style !important;
        transform: translateZ(0) !important;
      }

      .v18-deal-deck {
        position: absolute !important;
        width: 50px !important;
        height: 70px !important;
        transform: translate3d(-50%, -50%, 0) rotate(-2deg) !important;
        transform-origin: center !important;
        animation: v18-deck-breathe 2.1s ease-in-out infinite alternate !important;
        contain: layout paint style !important;
      }

      .v18-deck-card,
      .v18-flying-card,
      .v18-landed-back {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 50px !important;
        height: 70px !important;
        border: 1.5px solid rgba(249, 246, 237, 0.94) !important;
        border-radius: 6px !important;
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.34),
          0 8px 15px rgba(0, 0, 0, 0.30) !important;
        backface-visibility: hidden !important;
        pointer-events: none !important;
      }

      .v18-deck-card:nth-child(1) { transform: translate3d(-6px, -5px, 0) rotate(-3deg) !important; }
      .v18-deck-card:nth-child(2) { transform: translate3d(-3px, -2px, 0) rotate(-1deg) !important; }
      .v18-deck-card:nth-child(3) { transform: translate3d(0, 0, 0) rotate(1deg) !important; }

      .v18-flying-card {
        z-index: 4 !important;
        opacity: 0;
        will-change: transform, opacity !important;
        contain: strict !important;
      }

      .v18-landed-back {
        z-index: 3 !important;
        opacity: 0;
        will-change: opacity, transform !important;
        transition: opacity 120ms linear !important;
      }

      .v18-landed-back.is-visible { opacity: 1 !important; }
      .v18-landed-back.is-leaving {
        opacity: 0 !important;
        transition: opacity 190ms ease !important;
      }

      .hand .card.is-v18-human-pending,
      .hidden-cards span.is-v18-opponent-pending {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        animation: none !important;
      }

      .hand .card.is-v18-human-reveal {
        animation: v18-human-reveal 420ms cubic-bezier(0.16, 0.82, 0.22, 1) both !important;
        transform-origin: center bottom !important;
      }

      .game-summary:not([hidden]),
      .table-notice:not([hidden]) {
        z-index: 92 !important;
      }

      @keyframes v18-human-reveal {
        0% { opacity: 0.62; transform: translate3d(0, 11px, 0) scale(0.982); }
        62% { opacity: 1; transform: translate3d(0, -6px, 0) scale(1.014); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      }

      @keyframes v18-deck-breathe {
        from { transform: translate3d(-50%, -50%, 0) rotate(-3deg) scale(0.992); }
        to { transform: translate3d(-50%, -50%, 0) rotate(1deg) scale(1.012); }
      }

      @media (max-height: 430px) {
        .v18-deal-deck,
        .v18-deck-card,
        .v18-flying-card,
        .v18-landed-back {
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
      window.setTimeout(install, 80);
      return;
    }

    installed = true;
    injectStyles();

    const soundPlayer = typeof playSound === "function" ? playSound : null;
    const baseRenderHand = renderHand;

    renderHand = function androidV18RenderHand(...args) {
      const result = baseRenderHand.apply(this, args);
      applyPendingHumanVisibility();
      return result;
    };

    playCardDealAnimation = function androidV18Deal(handCount) {
      if (state.autoPlay || !elements.table) return;

      activeToken += 1;
      const token = activeToken;
      cleanLegacyArtifacts();

      const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
      const batch = getBatch(total);
      if (!batch.count) {
        lastDuration = 350;
        return;
      }

      const back = readBackStyle();
      const humanBatch = collectHumanBatch(batch.count);
      const humanIds = humanBatch.map((card) => card.dataset.card).filter(Boolean);
      const queues = {
        left: collectOpponentBatch("left", batch.from, total),
        top: collectOpponentBatch("top", batch.from, total),
        right: collectOpponentBatch("right", batch.from, total),
        bottom: [...humanBatch],
      };

      const { layer, deck, tableRect } = createLayer(back);
      elements.table.classList.add("is-v18-dealing");

      const landedHumanBacks = [];
      const plans = buildPlans({
        layer,
        deck,
        tableRect,
        back,
        queues,
        batchCount: batch.count,
      });

      plans.forEach((plan) => {
        animatePlan(plan, token, back, soundPlayer, landedHumanBacks);
      });

      const flightEnd = Math.max(0, plans.length - 1) * CARD_INTERVAL + FLIGHT_DURATION;
      lastDuration = flightEnd + REVEAL_PAUSE + REVEAL_DURATION + CLEANUP_PAD;

      window.setTimeout(
        () => revealHumanBatch(humanIds, landedHumanBacks, token),
        safeDelay(flightEnd + REVEAL_PAUSE),
      );

      window.setTimeout(() => {
        if (token !== activeToken) return;

        document.querySelectorAll(".is-v18-opponent-pending").forEach((node) => {
          node.classList.remove("is-v18-opponent-pending");
        });
        pendingHumanIds.clear();
        applyPendingHumanVisibility();
        elements.table.classList.remove("is-v18-dealing");

        layer.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 180,
          fill: "forwards",
        });
        window.setTimeout(() => layer.remove(), 210);
      }, safeDelay(lastDuration));
    };

    runAfterDealAnimation = function androidV18AfterDeal(callback) {
      if (state.autoPlay) {
        callback();
        return;
      }
      scheduleGameTask(callback, safeDelay(lastDuration + 90));
    };
  }

  function scheduleInstall() {
    window.setTimeout(install, INSTALL_DELAY);
  }

  window.addEventListener("joker-rules-adapters-ready", scheduleInstall, { once: true });
  window.addEventListener("load", scheduleInstall, { once: true });
  scheduleInstall();
})();

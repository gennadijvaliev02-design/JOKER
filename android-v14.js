(() => {
  const V14_CSS = String.raw`
    /* Android V14 — final focused polish: smoother deal, visible human backs, calmer glow. */

    .joker-announcement {
      box-shadow:
        0 18px 42px rgba(0, 0, 0, 0.52),
        0 0 16px rgba(255, 214, 41, 0.12),
        0 0 12px rgba(44, 177, 255, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
    }

    .joker-announcement::before {
      background: linear-gradient(115deg, transparent 0 30%, rgba(255, 255, 255, 0.17) 45%, transparent 60% 100%) !important;
    }

    .joker-announcement.is-take {
      box-shadow:
        0 18px 42px rgba(0, 0, 0, 0.52),
        0 0 16px rgba(72, 255, 154, 0.11),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
    }

    .joker-announcement-player {
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.82),
        0 0 7px rgba(255, 214, 41, 0.15) !important;
    }

    .joker-announcement-suit.is-red {
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.70),
        0 0 10px rgba(255, 66, 66, 0.27) !important;
    }

    .joker-announcement-suit.is-black {
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.80),
        0 0 9px rgba(255, 255, 255, 0.17) !important;
    }

    .player.is-joker-announcer .avatar {
      box-shadow:
        0 0 0 3px rgba(255, 214, 41, 0.72),
        0 0 14px rgba(255, 214, 41, 0.34),
        inset 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
    }

    .player.is-joker-announcer .name {
      text-shadow: 0 0 8px rgba(255, 214, 41, 0.31) !important;
    }

    .v14-deal-layer {
      position: absolute !important;
      inset: 0 !important;
      z-index: 70 !important;
      overflow: hidden !important;
      pointer-events: none !important;
      contain: layout paint style !important;
      transform: translateZ(0) !important;
    }

    .v14-deal-deck {
      position: absolute !important;
      left: 50% !important;
      top: 44% !important;
      width: 50px !important;
      height: 70px !important;
      opacity: 1 !important;
      visibility: visible !important;
      transform: translate3d(-50%, -50%, 0) rotate(-2deg) !important;
      filter: drop-shadow(0 11px 15px rgba(0, 0, 0, 0.40)) !important;
      animation: v14-deck-breathe 1.55s ease-in-out infinite alternate !important;
      transform-origin: center !important;
    }

    .v14-deck-card,
    .v14-flying-card,
    .v14-bottom-fallback {
      position: absolute !important;
      width: 50px !important;
      height: 70px !important;
      border: 1.5px solid rgba(249, 246, 237, 0.94) !important;
      border-radius: 6px !important;
      background-repeat: no-repeat !important;
      pointer-events: none !important;
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.36),
        0 9px 17px rgba(0, 0, 0, 0.34) !important;
      backface-visibility: hidden !important;
    }

    .v14-deck-card:nth-child(1) { transform: translate3d(-6px, -5px, 0) rotate(-3deg) !important; }
    .v14-deck-card:nth-child(2) { transform: translate3d(-3px, -2px, 0) rotate(-1deg) !important; }
    .v14-deck-card:nth-child(3) { transform: translate3d(0, 0, 0) rotate(1deg) !important; }

    .v14-flying-card {
      left: 0 !important;
      top: 0 !important;
      z-index: 4 !important;
      opacity: 0;
      will-change: transform, opacity !important;
      transform-origin: center !important;
      contain: strict !important;
    }

    .v14-bottom-fallback {
      z-index: 3 !important;
      opacity: 0;
      visibility: hidden;
      transition: opacity 130ms linear !important;
    }

    .v14-bottom-fallback.is-v14-landed {
      opacity: 1 !important;
      visibility: visible !important;
    }

    .hidden-cards span.is-v14-opponent-pending,
    .hand .card.is-v14-pending {
      opacity: 0 !important;
      visibility: hidden !important;
      animation: none !important;
      pointer-events: none !important;
    }

    .hand .card.is-v14-facedown {
      position: relative !important;
      overflow: hidden !important;
      color: transparent !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .hand .card.is-v14-facedown > * {
      opacity: 0 !important;
    }

    .hand .card.is-v14-facedown::after {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      z-index: 40 !important;
      display: block !important;
      border: 1px solid rgba(249, 246, 237, 0.94) !important;
      border-radius: inherit !important;
      background-color: var(--v14-back-color, #f4eee3) !important;
      background-image: var(--v14-back-image) !important;
      background-position: var(--v14-back-position, center) !important;
      background-size: var(--v14-back-size, cover) !important;
      background-repeat: var(--v14-back-repeat, no-repeat) !important;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38) !important;
      backface-visibility: hidden !important;
    }

    .hand .card.is-v14-revealing {
      animation: v14-card-reveal 470ms cubic-bezier(0.16, 0.82, 0.22, 1) both !important;
      transform-origin: center bottom !important;
    }

    @keyframes v14-card-reveal {
      0% { opacity: 0.55; transform: translate3d(0, 13px, 0) scale(0.975); }
      58% { opacity: 1; transform: translate3d(0, -8px, 0) scale(1.018); }
      100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }

    @keyframes v14-deck-breathe {
      from { transform: translate3d(-50%, -50%, 0) rotate(-3deg) scale(0.985); }
      to { transform: translate3d(-50%, -50%, 0) rotate(2deg) scale(1.025); }
    }

    @media (max-height: 430px) {
      .v14-deal-deck,
      .v14-deck-card,
      .v14-flying-card,
      .v14-bottom-fallback {
        width: 45px !important;
        height: 63px !important;
      }
    }
  `;

  function injectStyles() {
    if (document.getElementById("android-v14-style")) return;
    const style = document.createElement("style");
    style.id = "android-v14-style";
    style.textContent = V14_CSS;
    document.head.append(style);
  }

  let installed = false;

  function installDeal() {
    const CARD_INTERVAL = 213; // Exactly 1.5x the previous 142ms rhythm.
    const FLIGHT_DURATION = 495; // Exactly 1.5x the previous 330ms flight.
    const REVEAL_PAUSE = 300;
    const REVEAL_DURATION = 470;
    const CLEANUP_PAD = 150;

    const soundPlayer = typeof playSound === "function" ? playSound : null;
    const baseRenderHand = renderHand;

    let signature = "";
    let previousTotal = 0;
    let activeToken = 0;
    let lastDuration = 900;

    const pendingIds = new Set();
    const faceDownIds = new Set();
    const revealedIds = new Set();

    function safeDelay(value) {
      return typeof getDelay === "function" ? getDelay(value) : value;
    }

    function currentSignature() {
      return `${window.JokerRules?.activeId || "rules"}:${state.currentPulka}:${state.currentGame}`;
    }

    function handNodes() {
      return [...(elements?.playerHand?.querySelectorAll(":scope > .card") || [])];
    }

    function seatNodes(seat) {
      if (seat === "bottom") return handNodes();
      return [...(document.querySelector(`.${seat}-stack`)?.children || [])];
    }

    function sampleBackNode() {
      return document.querySelector(".hidden-cards span")
        || document.querySelector(".v13-deck-card")
        || document.querySelector(".flying-card-back");
    }

    function backSnapshot() {
      const sample = sampleBackNode();
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

    function applyBackInline(node, back) {
      node.style.backgroundColor = back.color;
      node.style.backgroundImage = back.image;
      node.style.backgroundPosition = back.position;
      node.style.backgroundSize = back.size;
      node.style.backgroundRepeat = back.repeat;
    }

    function applyBackVars(node, back) {
      node.style.setProperty("--v14-back-color", back.color);
      node.style.setProperty("--v14-back-image", back.image);
      node.style.setProperty("--v14-back-position", back.position);
      node.style.setProperty("--v14-back-size", back.size);
      node.style.setProperty("--v14-back-repeat", back.repeat);
    }

    function clearLegacyClasses(node) {
      node.classList.remove(
        "is-deal-pending",
        "is-deal-arrived",
        "is-v11-deal-pending",
        "is-v11-deal-arrived",
        "is-v12-deal-pending",
        "is-v12-facedown",
        "is-v12-hand-lift",
        "is-v13-pending",
        "is-v13-facedown",
        "is-v13-lifting",
        "is-sequential-deal-pending",
        "is-sequential-deal-arrived",
      );
    }

    function applyHumanState() {
      const back = backSnapshot();
      handNodes().forEach((card) => {
        clearLegacyClasses(card);
        card.classList.remove("is-v14-pending", "is-v14-facedown");

        const id = card.dataset.card;
        if (pendingIds.has(id)) {
          card.classList.add("is-v14-pending");
        } else if (faceDownIds.has(id)) {
          applyBackVars(card, back);
          card.classList.add("is-v14-facedown");
        }
      });
    }

    renderHand = function renderHandWithV14DealState(...args) {
      const result = baseRenderHand.apply(this, args);
      applyHumanState();
      return result;
    };

    function resetMemory() {
      previousTotal = 0;
      pendingIds.clear();
      faceDownIds.clear();
      revealedIds.clear();
      handNodes().forEach((card) => {
        clearLegacyClasses(card);
        card.classList.remove("is-v14-pending", "is-v14-facedown", "is-v14-revealing");
      });
    }

    function clearArtifacts() {
      document
        .querySelectorAll(
          ".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .v11-deal-layer, .v12-deal-layer, .v13-deal-layer, .v14-deal-layer, .android-dealer-deck",
        )
        .forEach((node) => node.remove());

      elements?.table?.classList.remove(
        "is-dealing",
        "is-v11-dealing",
        "is-v12-dealing",
        "is-v13-dealing",
        "is-v14-dealing",
      );
    }

    function prepareBatch(total) {
      const nextSignature = currentSignature();
      if (nextSignature !== signature || total <= previousTotal) {
        signature = nextSignature;
        resetMemory();
      }

      const from = previousTotal;
      const count = Math.max(0, total - from);
      previousTotal = total;

      // This is the critical V14 fix: build the real human hand before targets are measured.
      renderHand();

      const queues = { left: [], top: [], right: [], bottom: [] };

      for (const seat of ["left", "top", "right"]) {
        const nodes = seatNodes(seat);
        nodes.forEach((node) => {
          clearLegacyClasses(node);
          node.classList.remove("is-v14-opponent-pending");
        });

        const fresh = nodes.slice(from, total);
        fresh.forEach((node) => {
          node.classList.add("is-v14-opponent-pending");
          queues[seat].push(node);
        });
      }

      const humans = handNodes();
      let freshHumans = humans.filter((card) => {
        const id = card.dataset.card;
        return id && !revealedIds.has(id);
      });

      if (freshHumans.length > count) freshHumans = freshHumans.slice(0, count);
      if (freshHumans.length < count) {
        freshHumans = humans.slice(Math.max(0, humans.length - count));
      }

      freshHumans.forEach((card) => {
        const id = card.dataset.card;
        if (id) pendingIds.add(id);
        card.classList.add("is-v14-pending");
        queues.bottom.push(card);
      });

      applyHumanState();
      return { from, count, queues, missingBottom: Math.max(0, count - queues.bottom.length) };
    }

    function dealerPlayer() {
      const dealerOrder = state.currentGame === 1 ? 4 : state.currentGame - 1;
      return state.players.find((player) => player.order === dealerOrder)
        || (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"
          ? getPlayerById(getGameLeaderId())
          : null)
        || state.players[0];
    }

    function playerOrderFromDealer(dealerId) {
      const order = typeof getPlayerOrderFrom === "function"
        ? [...getPlayerOrderFrom(dealerId)]
        : state.players.map((player) => player.id);

      if (order.length > 1 && order[0] === dealerId) order.push(order.shift());
      return order;
    }

    function createLayer(back) {
      const layer = document.createElement("div");
      layer.className = "v14-deal-layer";
      layer.setAttribute("aria-hidden", "true");

      const deck = document.createElement("div");
      deck.className = "v14-deal-deck";
      deck.setAttribute("aria-hidden", "true");

      for (let index = 0; index < 3; index += 1) {
        const card = document.createElement("span");
        card.className = "v14-deck-card";
        applyBackInline(card, back);
        deck.append(card);
      }

      layer.append(deck);
      elements.table.append(layer);
      return { layer, deck };
    }

    function createFallbackTargets(layer, missingCount, total, from, back) {
      if (!missingCount) return [];

      const tableRect = elements.table.getBoundingClientRect();
      const width = tableRect.height <= 430 ? 45 : 50;
      const height = tableRect.height <= 430 ? 63 : 70;
      const fullCount = Math.max(1, total);
      const maxSpread = Math.min(tableRect.width * 0.56, width + (fullCount - 1) * width * 0.63);
      const step = fullCount > 1 ? (maxSpread - width) / (fullCount - 1) : 0;
      const startX = tableRect.width / 2 - maxSpread / 2;
      const top = tableRect.height - height * 0.86;
      const targets = [];

      for (let index = 0; index < missingCount; index += 1) {
        const absoluteIndex = from + index;
        const card = document.createElement("span");
        card.className = "v14-bottom-fallback";
        card.dataset.v14Fallback = "true";
        card.style.left = `${startX + absoluteIndex * step}px`;
        card.style.top = `${top}px`;
        card.style.transform = `rotate(${(absoluteIndex - (fullCount - 1) / 2) * 1.25}deg)`;
        applyBackInline(card, back);
        layer.append(card);
        targets.push(card);
      }

      return targets;
    }

    function createFlyingCard(back) {
      const card = document.createElement("span");
      card.className = "v14-flying-card";
      applyBackInline(card, back);
      return card;
    }

    function resolveTarget(plan) {
      if (plan.seat === "bottom" && plan.cardId) {
        return handNodes().find((node) => node.dataset.card === plan.cardId) || plan.target;
      }
      return plan.target;
    }

    function land(plan, back) {
      const target = resolveTarget(plan);
      if (!target?.isConnected) return;

      if (target.dataset.v14Fallback === "true") {
        target.classList.add("is-v14-landed");
        return;
      }

      if (plan.seat === "bottom") {
        const id = target.dataset.card;
        if (id) {
          pendingIds.delete(id);
          faceDownIds.add(id);
        }
        target.classList.remove("is-v14-pending");
        applyBackVars(target, back);
        target.classList.add("is-v14-facedown");
        return;
      }

      target.classList.remove("is-v14-opponent-pending");
    }

    function playDealTick() {
      if (!soundPlayer) return;
      requestAnimationFrame(() => {
        try {
          soundPlayer("deal");
        } catch (error) {
          console.debug("V14 deal sound skipped", error);
        }
      });
    }

    function buildFlightPlans({ layer, deck, flights, back }) {
      const tableRect = elements.table.getBoundingClientRect();
      const deckRect = deck.getBoundingClientRect();
      const probe = createFlyingCard(back);
      layer.append(probe);
      const probeRect = probe.getBoundingClientRect();
      const width = probeRect.width || 50;
      const height = probeRect.height || 70;
      probe.remove();

      const startX = deckRect.left - tableRect.left + deckRect.width / 2 - width / 2;
      const startY = deckRect.top - tableRect.top + deckRect.height / 2 - height / 2;

      return flights.map((flight, index) => {
        const targetRect = flight.target.getBoundingClientRect();
        const endX = targetRect.left - tableRect.left + targetRect.width / 2 - width / 2;
        const endY = targetRect.top - tableRect.top + targetRect.height / 2 - height / 2;
        const middleX = startX + (endX - startX) * 0.54;
        const middleY = startY + (endY - startY) * 0.54 - Math.min(34, Math.abs(endY - startY) * 0.065 + 13);
        const scale = Math.max(0.48, Math.min(1.42, Math.min(
          Math.max(targetRect.width, 1) / width,
          Math.max(targetRect.height, 1) / height,
        )));
        const rotation = flight.seat === "left" ? -88 : flight.seat === "right" ? 88 : flight.seat === "top" ? 1 : 0;
        const turn = (index % 3 - 1) * 2.2;
        const card = createFlyingCard(back);
        layer.append(card);

        return {
          ...flight,
          card,
          index,
          cardId: flight.seat === "bottom" ? flight.target.dataset.card || null : null,
          start: `translate3d(${startX}px, ${startY}px, 0) rotate(-2deg) scale(.79)`,
          middle: `translate3d(${middleX}px, ${middleY}px, 0) rotate(${rotation * 0.42 + turn}deg) scale(1.025)`,
          end: `translate3d(${endX}px, ${endY}px, 0) rotate(${rotation}deg) scale(${scale})`,
        };
      });
    }

    function animatePlan(plan, token, back) {
      window.setTimeout(() => {
        if (token !== activeToken || !plan.card.isConnected) return;

        playDealTick();
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          land(plan, back);
          plan.card.remove();
        };

        const animation = plan.card.animate([
          { opacity: 0.94, transform: plan.start, offset: 0 },
          { opacity: 1, transform: plan.middle, offset: 0.56 },
          { opacity: 1, transform: plan.end, offset: 1 },
        ], {
          duration: safeDelay(FLIGHT_DURATION),
          easing: "cubic-bezier(0.20, 0.72, 0.22, 1)",
          fill: "forwards",
        });

        animation.addEventListener?.("finish", finish, { once: true });
        animation.finished?.then(finish).catch(() => {});
        window.setTimeout(finish, safeDelay(FLIGHT_DURATION + 90));
      }, safeDelay(plan.index * CARD_INTERVAL));
    }

    function revealHumanCards(layer) {
      // Rebuild once more in case the core game replaced hand nodes during the animation.
      renderHand();
      const backCards = handNodes().filter((card) => {
        const id = card.dataset.card;
        return id && (faceDownIds.has(id) || pendingIds.has(id));
      });

      backCards.forEach((card) => {
        const id = card.dataset.card;
        if (id) revealedIds.add(id);
        pendingIds.delete(id);
        faceDownIds.delete(id);
        card.classList.remove("is-v14-pending", "is-v14-facedown", "is-v14-revealing");
        void card.offsetWidth;
        card.classList.add("is-v14-revealing");
        window.setTimeout(() => card.classList.remove("is-v14-revealing"), REVEAL_DURATION + 45);
      });

      layer.querySelectorAll(".v14-bottom-fallback").forEach((card) => {
        card.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 180,
          fill: "forwards",
        });
      });
    }

    playCardDealAnimation = function playV14SmoothDeal(handCount) {
      if (state.autoPlay || !elements?.table) return;

      activeToken += 1;
      const token = activeToken;
      clearArtifacts();

      const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
      const batch = prepareBatch(total);
      if (!batch.count) {
        lastDuration = 350;
        return;
      }

      const back = backSnapshot();
      const { layer, deck } = createLayer(back);
      elements.table.classList.add("is-v14-dealing");

      const fallbacks = createFallbackTargets(
        layer,
        batch.missingBottom,
        total,
        batch.from + batch.queues.bottom.length,
        back,
      );
      batch.queues.bottom.push(...fallbacks);

      const dealer = dealerPlayer();
      const order = playerOrderFromDealer(dealer?.id);
      const flights = [];

      for (let round = 0; round < batch.count; round += 1) {
        for (const playerId of order) {
          const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;
          if (!player) continue;
          const target = batch.queues[player.seat]?.shift();
          if (target) flights.push({ target, seat: player.seat });
        }
      }

      // One forced layout read here; no layout reads happen during the flight sequence.
      const plans = buildFlightPlans({ layer, deck, flights, back });
      plans.forEach((plan) => animatePlan(plan, token, back));

      const flightEnd = Math.max(0, plans.length - 1) * CARD_INTERVAL + FLIGHT_DURATION;
      lastDuration = flightEnd + REVEAL_PAUSE + REVEAL_DURATION + CLEANUP_PAD;

      window.setTimeout(() => {
        if (token === activeToken) revealHumanCards(layer);
      }, safeDelay(flightEnd + REVEAL_PAUSE));

      window.setTimeout(() => {
        if (token !== activeToken) return;

        document.querySelectorAll(".is-v14-opponent-pending").forEach((node) => {
          node.classList.remove("is-v14-opponent-pending");
        });
        pendingIds.clear();
        applyHumanState();
        elements.table.classList.remove(
          "is-dealing",
          "is-v11-dealing",
          "is-v12-dealing",
          "is-v13-dealing",
          "is-v14-dealing",
        );

        layer.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 170,
          fill: "forwards",
        });
        window.setTimeout(() => layer.remove(), 195);
      }, safeDelay(lastDuration));
    };

    runAfterDealAnimation = function runAfterV14Deal(callback) {
      if (state.autoPlay) {
        callback();
        return;
      }
      scheduleGameTask(callback, safeDelay(lastDuration + 70));
    };
  }

  function install() {
    if (installed) return;
    installed = true;
    injectStyles();
    installDeal();
  }

  function scheduleInstall() {
    window.setTimeout(install, 120);
  }

  injectStyles();
  window.addEventListener("joker-rules-adapters-ready", scheduleInstall, { once: true });
  window.addEventListener("load", scheduleInstall, { once: true });
  scheduleInstall();
})();

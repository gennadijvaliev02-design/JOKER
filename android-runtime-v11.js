(() => {
  /* Keep the approved calm Joker sound behaviour. */
  const originalPlaySound = typeof playSound === "function" ? playSound : null;

  if (originalPlaySound) {
    playSound = function playCalmAndroidSound(type) {
      if (type === "joker" || type === "jokerCollect") return;
      return originalPlaySound(type);
    };
  }

  const V13_CSS = String.raw`
    /* Android V13 — focused real-device correction layer. */

    .v13-hud-hidden {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* The trump plate only appears when an actual trump card exists. */
    .trump-pill.v13-trump-ready {
      width: clamp(146px, 13.8vw, 182px) !important;
      min-width: clamp(146px, 13.8vw, 182px) !important;
      min-height: 62px !important;
      padding: 7px 9px 7px 13px !important;
      gap: 9px !important;
      justify-content: flex-start !important;
      overflow: visible !important;
      border-color: rgba(98, 246, 211, 0.72) !important;
      background:
        linear-gradient(180deg, rgba(255,255,255,.12), transparent 30%),
        radial-gradient(circle at 77% 50%, rgba(255, 216, 104, .18), transparent 43%),
        radial-gradient(circle at 20% 20%, rgba(57, 255, 210, .18), transparent 42%),
        linear-gradient(145deg, rgba(14, 55, 48, .97), rgba(5, 17, 20, .99)) !important;
      box-shadow:
        0 12px 28px rgba(0,0,0,.44),
        0 0 18px rgba(45, 233, 190, .16),
        0 0 8px rgba(229, 191, 93, .12),
        inset 0 1px 0 rgba(255,255,255,.18),
        inset 0 -13px 24px rgba(0,0,0,.28) !important;
      color: #f6fbf8 !important;
      font-size: clamp(15px, 1.42vw, 18px) !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      text-shadow: 0 2px 4px rgba(0,0,0,.76), 0 0 10px rgba(255,255,255,.09) !important;
    }

    .trump-pill.v13-trump-ready .trump-card {
      flex: 0 0 auto !important;
      width: 48px !important;
      height: 61px !important;
      margin-left: auto !important;
      transform: translateX(3px) !important;
      border-color: rgba(255,255,255,.72) !important;
      box-shadow:
        0 0 0 1px rgba(255,255,255,.36),
        0 0 17px rgba(255, 216, 102, .28),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 12px rgba(255,255,255,.35) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="red"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.38),
        0 0 12px rgba(255,255,255,.32),
        0 0 24px rgba(255, 73, 96, .38),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 13px rgba(255,255,255,.38) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="black"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.45),
        0 0 13px rgba(255,255,255,.62),
        0 0 24px rgba(190, 234, 255, .25),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 14px rgba(255,255,255,.44) !important;
    }

    /* Web-version glass and magical suit glow. */
    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel {
      border-color: rgba(229, 195, 105, .90) !important;
      background:
        linear-gradient(180deg, rgba(255,255,255,.13), transparent 26%),
        radial-gradient(ellipse at 50% -20%, rgba(231, 194, 98, .31), transparent 47%),
        radial-gradient(circle at 12% 12%, rgba(58, 255, 207, .20), transparent 36%),
        radial-gradient(circle at 88% 86%, rgba(12, 126, 91, .34), transparent 42%),
        linear-gradient(145deg, rgba(13, 48, 41, .985), rgba(5, 11, 16, .995) 58%, rgba(17, 29, 31, .985)) !important;
      box-shadow:
        0 28px 66px rgba(0,0,0,.64),
        0 0 0 1px rgba(255,255,255,.07),
        0 0 26px rgba(226, 185, 83, .22),
        0 0 35px rgba(42, 234, 183, .15),
        inset 0 1px 0 rgba(255,255,255,.20),
        inset 0 -25px 42px rgba(0,0,0,.35) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option {
      position: relative !important;
      overflow: hidden !important;
      display: grid !important;
      place-items: center !important;
      align-content: center !important;
      justify-content: center !important;
      padding: 0 !important;
      border-color: rgba(91, 237, 207, .72) !important;
      background:
        linear-gradient(180deg, rgba(255,255,255,.16), transparent 31%),
        radial-gradient(circle at 50% 38%, rgba(94,255,216,.18), transparent 48%),
        linear-gradient(180deg, rgba(25, 65, 58, .98), rgba(7, 19, 23, .995)) !important;
      box-shadow:
        0 13px 27px rgba(0,0,0,.45),
        0 0 16px rgba(48, 229, 185, .16),
        inset 0 1px 0 rgba(255,255,255,.22),
        inset 0 -13px 21px rgba(0,0,0,.33),
        inset 0 0 20px rgba(67, 242, 199, .06) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump]::before,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option::before {
      content: "" !important;
      position: absolute !important;
      inset: 2px 8px auto !important;
      height: 45% !important;
      border-radius: 14px 14px 50% 50% !important;
      background: linear-gradient(180deg, rgba(255,255,255,.17), transparent) !important;
      filter: blur(.4px) !important;
      pointer-events: none !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump]:not([data-trump="no-trump"]),
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-symbol {
      font-family: Georgia, "Times New Roman", serif !important;
      font-variant-emoji: text !important;
      font-size: clamp(42px, 4.35vw, 56px) !important;
      font-weight: 900 !important;
      line-height: .78 !important;
      letter-spacing: 0 !important;
      text-align: center !important;
      transform: translateY(1px) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="hearts"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="diamonds"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="hearts"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="diamonds"] .android-joker-suit-symbol {
      color: #ff5b70 !important;
      text-shadow:
        0 1px 0 rgba(255,255,255,.35),
        0 0 7px rgba(255,255,255,.25),
        0 0 13px rgba(255, 72, 95, .72),
        0 0 24px rgba(255, 44, 75, .34),
        0 3px 5px rgba(0,0,0,.66) !important;
      filter: drop-shadow(0 0 5px rgba(255, 73, 96, .40)) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="clubs"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="spades"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="clubs"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="spades"] .android-joker-suit-symbol {
      color: #f8fcff !important;
      text-shadow:
        0 1px 0 #fff,
        0 0 5px rgba(255,255,255,.96),
        0 0 12px rgba(255,255,255,.72),
        0 0 23px rgba(186, 229, 255, .40),
        0 3px 5px rgba(0,0,0,.76) !important;
      filter: drop-shadow(0 0 6px rgba(255,255,255,.62)) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="no-trump"] {
      min-height: 62px !important;
      color: #f4d78c !important;
      border-color: rgba(235, 200, 113, .82) !important;
      background:
        linear-gradient(180deg, rgba(255,255,255,.14), transparent 30%),
        radial-gradient(circle at 50% 30%, rgba(238, 199, 100, .25), transparent 48%),
        linear-gradient(180deg, rgba(72, 57, 28, .98), rgba(15, 17, 16, .995)) !important;
      text-shadow: 0 2px 4px rgba(0,0,0,.74), 0 0 15px rgba(238,199,100,.25) !important;
      box-shadow:
        0 13px 27px rgba(0,0,0,.46),
        0 0 18px rgba(233, 195, 95, .19),
        inset 0 1px 0 rgba(255,255,255,.18),
        inset 0 -13px 21px rgba(0,0,0,.34) !important;
    }

    /* V13 uses a true full-table coordinate system. */
    .v13-deal-layer {
      position: absolute !important;
      inset: 0 !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 60 !important;
      overflow: hidden !important;
      pointer-events: none !important;
      transform: none !important;
    }

    .v13-deal-deck {
      position: absolute !important;
      left: 50% !important;
      top: 44% !important;
      z-index: 2 !important;
      width: 48px !important;
      height: 67px !important;
      opacity: 1 !important;
      visibility: visible !important;
      transform: translate(-50%, -50%) rotate(-3deg) !important;
      filter: drop-shadow(0 11px 15px rgba(0,0,0,.42)) !important;
      animation: v13-deck-breathe 1.25s ease-in-out infinite alternate !important;
    }

    .v13-deck-card,
    .v13-flying-card {
      position: absolute !important;
      width: 48px !important;
      height: 67px !important;
      border: 1.5px solid rgba(249,246,237,.94) !important;
      border-radius: 6px !important;
      opacity: 1 !important;
      visibility: visible !important;
      animation: none !important;
      pointer-events: none !important;
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.36),
        0 9px 17px rgba(0,0,0,.34) !important;
      will-change: transform, opacity, filter;
    }

    .v13-deck-card:nth-child(1) { transform: translate(-6px, -5px) rotate(-3deg) !important; }
    .v13-deck-card:nth-child(2) { transform: translate(-3px, -2px) rotate(-1deg) !important; }
    .v13-deck-card:nth-child(3) { transform: translate(0, 0) rotate(1deg) !important; }

    @keyframes v13-deck-breathe {
      from { filter: drop-shadow(0 10px 14px rgba(0,0,0,.40)) brightness(.98); }
      to { filter: drop-shadow(0 13px 18px rgba(0,0,0,.48)) brightness(1.06); }
    }

    .hand .card.is-v13-pending,
    .hidden-cards span.is-v13-pending {
      opacity: 0 !important;
      visibility: hidden !important;
      animation: none !important;
      pointer-events: none !important;
    }

    .hand .card.is-v13-facedown {
      position: relative !important;
      overflow: hidden !important;
      color: transparent !important;
    }

    .hand .card.is-v13-facedown > * {
      opacity: 0 !important;
    }

    .hand .card.is-v13-facedown::after {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      z-index: 30 !important;
      display: block !important;
      border: 1px solid rgba(249,246,237,.94) !important;
      border-radius: inherit !important;
      background-color: var(--v13-back-color, #f4eee3) !important;
      background-image: var(--v13-back-image) !important;
      background-position: var(--v13-back-position, center) !important;
      background-size: var(--v13-back-size, cover) !important;
      background-repeat: var(--v13-back-repeat, no-repeat) !important;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.38) !important;
    }

    .hand .card.is-v13-lifting {
      animation: v13-hand-lift 440ms cubic-bezier(.16,.82,.22,1) both !important;
      transform-origin: center bottom !important;
    }

    @keyframes v13-hand-lift {
      0% { opacity: .94; transform: translateY(14px) rotateX(25deg) scale(.965); filter: brightness(.88); }
      58% { opacity: 1; transform: translateY(-11px) rotateX(0) scale(1.025); filter: brightness(1.09); }
      100% { opacity: 1; transform: translateY(0) rotateX(0) scale(1); filter: brightness(1); }
    }

    @media (max-height: 430px) {
      .trump-pill.v13-trump-ready {
        width: 139px !important;
        min-width: 139px !important;
        min-height: 54px !important;
        padding: 5px 7px 5px 10px !important;
        font-size: 14px !important;
      }

      .trump-pill.v13-trump-ready .trump-card {
        width: 43px !important;
        height: 55px !important;
      }

      .v13-deal-deck,
      .v13-deck-card,
      .v13-flying-card {
        width: 43px !important;
        height: 60px !important;
      }
    }
  `;

  function injectV13Styles() {
    if (document.getElementById("android-v13-style")) return;
    const style = document.createElement("style");
    style.id = "android-v13-style";
    style.textContent = V13_CSS;
    document.head.append(style);
  }

  function cleanSuitGlyph(value) {
    return String(value || "")
      .replace(/\uFE0F/g, "")
      .replace(/❤️/g, "♥")
      .replace(/♦️/g, "♦")
      .replace(/♣️/g, "♣")
      .replace(/♠️/g, "♠");
  }

  function normalizeSuitGlyphs() {
    document
      .querySelectorAll(
        '.bid-panel.is-v12-trump-panel .bid-option[data-trump]:not([data-trump="no-trump"]), .android-joker-suit-symbol',
      )
      .forEach((node) => {
        const next = cleanSuitGlyph(node.textContent);
        if (node.textContent !== next) node.textContent = next;
      });
  }

  function bidsAreFinished() {
    if (typeof state === "undefined" || !state?.players?.length) return false;
    return state.players.every((player) => player.bid !== null && player.bid !== undefined);
  }

  function setHiddenState(node, hidden) {
    if (!node) return;
    node.classList.toggle("v13-hud-hidden", Boolean(hidden));
  }

  function syncHudVisibility() {
    const trump = document.getElementById("trump-label");
    const round = document.getElementById("round-label");

    if (trump) {
      const card = trump.querySelector(".trump-card");
      const suitText = cleanSuitGlyph(card?.textContent || "");
      const hasRealTrump = Boolean(card && card.getBoundingClientRect().width > 0);

      setHiddenState(trump, !hasRealTrump);
      trump.classList.toggle("v13-trump-ready", hasRealTrump);
      trump.dataset.v13Suit = /[♥♦]/.test(suitText) ? "red" : /[♣♠]/.test(suitText) ? "black" : "special";
    }

    if (round) {
      const text = round.textContent.trim();
      const isPushNotice = /пихается|отнимается|push|take/i.test(text)
        || round.classList.contains("is-push")
        || round.classList.contains("is-take");
      setHiddenState(round, !(bidsAreFinished() && isPushNotice));
    }

    normalizeSuitGlyphs();
  }

  function installHudObserver() {
    const hud = document.querySelector(".game-hud");
    if (hud) {
      const observer = new MutationObserver(syncHudVisibility);
      observer.observe(hud, { subtree: true, childList: true, characterData: true, attributes: true });
    }

    const bidPanel = document.getElementById("bid-panel");
    if (bidPanel) {
      const observer = new MutationObserver(normalizeSuitGlyphs);
      observer.observe(bidPanel, { subtree: true, childList: true, characterData: true, attributes: true });
    }

    syncHudVisibility();
    window.setInterval(syncHudVisibility, 240);
  }

  function installV13Deal() {
    const CARD_INTERVAL = 142;
    const FLIGHT_DURATION = 330;
    const REVEAL_PAUSE = 270;
    const LIFT_DURATION = 440;
    const CLEANUP_PAD = 120;

    let signature = "";
    let previousTotal = 0;
    let activeToken = 0;
    let lastDuration = 900;
    const pendingIds = new Set();
    const faceDownIds = new Set();
    const landedIds = new Set();

    const baseRenderHand = renderHand;

    function safeDelay(value) {
      return typeof getDelay === "function" ? getDelay(value) : value;
    }

    function handNodes() {
      return [...(elements?.playerHand?.querySelectorAll(":scope > .card") || [])];
    }

    function seatNodes(seat) {
      if (seat === "bottom") return handNodes();
      return [...(document.querySelector(`.${seat}-stack`)?.children || [])];
    }

    function currentSignature() {
      return `${window.JokerRules?.activeId || "rules"}:${state.currentPulka}:${state.currentGame}`;
    }

    function sampleBackNode() {
      return document.querySelector(".hidden-cards span") || document.querySelector(".flying-card-back");
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
      node.style.setProperty("--v13-back-color", back.color);
      node.style.setProperty("--v13-back-image", back.image);
      node.style.setProperty("--v13-back-position", back.position);
      node.style.setProperty("--v13-back-size", back.size);
      node.style.setProperty("--v13-back-repeat", back.repeat);
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
        "is-sequential-deal-pending",
        "is-sequential-deal-arrived",
      );
    }

    function applyHumanState() {
      const back = backSnapshot();
      handNodes().forEach((card) => {
        clearLegacyClasses(card);
        const id = card.dataset.card;
        card.classList.toggle("is-v13-pending", pendingIds.has(id));
        card.classList.toggle("is-v13-facedown", faceDownIds.has(id));
        if (faceDownIds.has(id)) applyBackVars(card, back);
      });
    }

    renderHand = function renderHandWithV13DealState(...args) {
      const result = baseRenderHand.apply(this, args);
      applyHumanState();
      return result;
    };

    function resetMemory() {
      previousTotal = 0;
      pendingIds.clear();
      faceDownIds.clear();
      landedIds.clear();
      handNodes().forEach((card) => {
        clearLegacyClasses(card);
        card.classList.remove("is-v13-pending", "is-v13-facedown", "is-v13-lifting");
      });
    }

    function clearArtifacts() {
      document
        .querySelectorAll(
          ".deal-flight-layer.is-hand-deal, .deal-flight-layer.is-premium-deal, .v11-deal-layer, .v12-deal-layer, .v13-deal-layer, .android-dealer-deck",
        )
        .forEach((node) => node.remove());

      elements?.table?.classList.remove("is-dealing", "is-v11-dealing", "is-v12-dealing", "is-v13-dealing");
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
      const queues = { left: [], top: [], right: [], bottom: [] };

      Object.keys(queues).forEach((seat) => {
        const nodes = seatNodes(seat);
        nodes.forEach(clearLegacyClasses);
        const fresh = nodes.slice(from, total);

        fresh.forEach((node) => {
          node.classList.add("is-v13-pending");
          queues[seat].push(node);

          if (seat === "bottom") {
            const id = node.dataset.card;
            if (id) pendingIds.add(id);
          }
        });
      });

      applyHumanState();
      return { count, queues };
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
      layer.className = "v13-deal-layer";
      layer.setAttribute("aria-hidden", "true");

      const deck = document.createElement("div");
      deck.className = "v13-deal-deck";
      deck.setAttribute("aria-hidden", "true");

      for (let index = 0; index < 3; index += 1) {
        const card = document.createElement("span");
        card.className = "v13-deck-card";
        applyBackInline(card, back);
        deck.append(card);
      }

      layer.append(deck);
      elements.table.append(layer);
      return { layer, deck };
    }

    function createFlyingCard(back) {
      const card = document.createElement("span");
      card.className = "v13-flying-card";
      applyBackInline(card, back);
      return card;
    }

    function land(target, seat, back) {
      if (!target?.isConnected) return;
      target.classList.remove("is-v13-pending");

      if (seat === "bottom") {
        const id = target.dataset.card;
        pendingIds.delete(id);
        landedIds.add(id);
        faceDownIds.add(id);
        applyBackVars(target, back);
        target.classList.add("is-v13-facedown");
      }
    }

    function animateFlight({ layer, deck, target, seat, delay, index, token, back }) {
      window.setTimeout(() => {
        if (token !== activeToken || !layer.isConnected || !target?.isConnected) return;

        const tableRect = elements.table.getBoundingClientRect();
        const deckRect = deck.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const card = createFlyingCard(back);
        layer.append(card);

        const width = card.getBoundingClientRect().width || 48;
        const height = card.getBoundingClientRect().height || 67;
        const startX = deckRect.left - tableRect.left + deckRect.width / 2 - width / 2;
        const startY = deckRect.top - tableRect.top + deckRect.height / 2 - height / 2;
        const endX = targetRect.left - tableRect.left + targetRect.width / 2 - width / 2;
        const endY = targetRect.top - tableRect.top + targetRect.height / 2 - height / 2;
        const middleX = startX + (endX - startX) * 0.56;
        const middleY = startY + (endY - startY) * 0.56 - Math.min(38, Math.abs(endY - startY) * 0.08 + 16);
        const scale = Math.max(.48, Math.min(1.42, Math.min(targetRect.width / width, targetRect.height / height)));
        const rotation = seat === "left" ? -88 : seat === "right" ? 88 : seat === "top" ? 1 : 0;
        const turn = (index % 3 - 1) * 3;
        let finished = false;

        if (originalPlaySound) originalPlaySound("deal");

        const finish = () => {
          if (finished) return;
          finished = true;
          land(target, seat, back);
          card.remove();
        };

        const animation = card.animate([
          {
            opacity: .94,
            filter: "brightness(.92) blur(.45px)",
            transform: `translate3d(${startX}px, ${startY}px, 0) rotate(-3deg) scale(.78)`,
          },
          {
            opacity: 1,
            filter: "brightness(1.08) blur(0)",
            transform: `translate3d(${middleX}px, ${middleY}px, 0) rotate(${rotation * .44 + turn}deg) scale(1.04)`,
            offset: .62,
          },
          {
            opacity: 1,
            filter: "brightness(1) blur(0)",
            transform: `translate3d(${endX}px, ${endY}px, 0) rotate(${rotation}deg) scale(${scale})`,
          },
        ], {
          duration: safeDelay(FLIGHT_DURATION),
          easing: "cubic-bezier(.18,.78,.22,1)",
          fill: "forwards",
        });

        animation.addEventListener?.("finish", finish, { once: true });
        animation.finished?.then(finish).catch(() => {});
        window.setTimeout(finish, safeDelay(FLIGHT_DURATION + 80));
      }, safeDelay(delay));
    }

    function revealNewHumanCards() {
      const cards = handNodes().filter((card) => faceDownIds.has(card.dataset.card));
      cards.forEach((card) => faceDownIds.delete(card.dataset.card));

      cards.forEach((card) => {
        card.classList.remove("is-v13-facedown", "is-v13-lifting");
        void card.offsetWidth;
        card.classList.add("is-v13-lifting");
        window.setTimeout(() => card.classList.remove("is-v13-lifting"), LIFT_DURATION + 45);
      });
    }

    playCardDealAnimation = function playV13Deal(handCount) {
      if (state.autoPlay || !elements?.table) return;

      activeToken += 1;
      const token = activeToken;
      clearArtifacts();

      const total = Math.max(0, Math.min(Number(handCount) || 0, 9));
      const batch = prepareBatch(total);
      if (!batch.count) {
        lastDuration = 320;
        return;
      }

      const back = backSnapshot();
      const { layer, deck } = createLayer(back);
      elements.table.classList.add("is-v13-dealing");

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

      flights.forEach((flight, index) => {
        animateFlight({
          layer,
          deck,
          target: flight.target,
          seat: flight.seat,
          delay: index * CARD_INTERVAL,
          index,
          token,
          back,
        });
      });

      const flightEnd = Math.max(0, flights.length - 1) * CARD_INTERVAL + FLIGHT_DURATION;
      lastDuration = flightEnd + REVEAL_PAUSE + LIFT_DURATION + CLEANUP_PAD;

      window.setTimeout(() => {
        if (token === activeToken) revealNewHumanCards();
      }, safeDelay(flightEnd + REVEAL_PAUSE));

      window.setTimeout(() => {
        if (token !== activeToken) return;

        document.querySelectorAll(".is-v13-pending").forEach((node) => node.classList.remove("is-v13-pending"));
        pendingIds.clear();
        applyHumanState();
        elements.table.classList.remove("is-dealing", "is-v11-dealing", "is-v12-dealing", "is-v13-dealing");
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
        window.setTimeout(() => layer.remove(), 170);
      }, safeDelay(lastDuration));
    };

    runAfterDealAnimation = function runAfterV13Deal(callback) {
      if (state.autoPlay) {
        callback();
        return;
      }
      scheduleGameTask(callback, safeDelay(lastDuration + 60));
    };
  }

  let v13Installed = false;

  function installV13() {
    if (v13Installed) return;
    v13Installed = true;
    injectV13Styles();
    installHudObserver();
    installV13Deal();
  }

  function installAfterV12() {
    window.setTimeout(installV13, 0);
  }

  injectV13Styles();
  window.addEventListener("joker-rules-adapters-ready", installAfterV12, { once: true });
  window.addEventListener("load", installAfterV12, { once: true });

  if (document.documentElement.dataset.rulesReady === "true") {
    installAfterV12();
  }
})();

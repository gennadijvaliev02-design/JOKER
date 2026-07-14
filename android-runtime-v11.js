(() => {
  "use strict";

  /* Keep the approved calm Joker sound behaviour. */
  const originalPlaySound = typeof playSound === "function" ? playSound : null;

  if (originalPlaySound) {
    playSound = function playCalmAndroidSound(type) {
      if (type === "joker" || type === "jokerCollect") return;
      return originalPlaySound(type);
    };
  }

  const V13_CSS = String.raw`
    /* Android V13 — focused real-device HUD and suit correction layer. */
    .v13-hud-hidden {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

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
      const hasRealTrump = Boolean(card);

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

  let installed = false;
  let hudObserver = null;
  let bidObserver = null;

  function installHudObservers() {
    if (installed) return;
    installed = true;

    const hud = document.querySelector(".game-hud");
    if (hud) {
      hudObserver = new MutationObserver(syncHudVisibility);
      hudObserver.observe(hud, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: false,
      });
    }

    const bidPanel = document.getElementById("bid-panel");
    if (bidPanel) {
      bidObserver = new MutationObserver(normalizeSuitGlyphs);
      bidObserver.observe(bidPanel, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: false,
      });
    }

    syncHudVisibility();
  }

  function installAfterRules() {
    window.setTimeout(installHudObservers, 0);
  }

  injectV13Styles();
  window.addEventListener("joker-rules-adapters-ready", installAfterRules, { once: true });
  window.addEventListener("load", installAfterRules, { once: true });

  if (document.documentElement.dataset.rulesReady === "true") {
    installAfterRules();
  }
})();

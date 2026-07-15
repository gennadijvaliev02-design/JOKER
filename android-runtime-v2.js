(() => {
  "use strict";

  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  const SUIT_META = {
    hearts: {
      color: "red",
      path: "M12 21.2S3.1 16.1 1.7 10.1C.8 6.3 3.1 3.2 6.6 3.2c2.2 0 4.1 1.3 5.4 3.4 1.3-2.1 3.2-3.4 5.4-3.4 3.5 0 5.8 3.1 4.9 6.9C20.9 16.1 12 21.2 12 21.2Z",
    },
    diamonds: {
      color: "red",
      path: "M12 1.7 21.3 12 12 22.3 2.7 12 12 1.7Z",
    },
    spades: {
      color: "black",
      path: "M12 1.7C10.3 4.8 3 8.6 3 14.2c0 3.2 2.4 5.2 5.2 5.2 1.4 0 2.6-.5 3.5-1.5-.2 1.7-.8 3-2.3 4.4h5.2c-1.5-1.4-2.1-2.7-2.3-4.4.9 1 2.1 1.5 3.5 1.5 2.8 0 5.2-2 5.2-5.2 0-5.6-7.3-9.4-9-12.5Z",
    },
    clubs: {
      color: "black",
      path: "M12 2.2a4.2 4.2 0 0 0-2 7.9 4.6 4.6 0 1 0-2.8 8.2c1.7 0 3.2-.9 4-2.2-.1 2.4-.8 4.3-2.6 6.1h6.8c-1.8-1.8-2.5-3.7-2.6-6.1.8 1.3 2.3 2.2 4 2.2a4.6 4.6 0 1 0-2.8-8.2A4.2 4.2 0 0 0 12 2.2Z",
    },
  };

  const SYMBOL_TO_SUIT = {
    "♥": "hearts",
    "♦": "diamonds",
    "♠": "spades",
    "♣": "clubs",
  };

  const trumpPill = document.querySelector(".trump-pill");
  let lastTrumpCard = null;
  let lastTrumpSignature = "";
  let lastTrumpRenderKey = null;
  let lastRoundSignature = null;
  let lastTrickSignature = null;
  let selectedCard = null;
  let selectionTimer = 0;

  function getLanguage() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function normalizeSuit(rawSuit) {
    if (!rawSuit) return null;

    const value = String(rawSuit).toLowerCase();
    if (SYMBOL_TO_SUIT[rawSuit]) return SYMBOL_TO_SUIT[rawSuit];
    if (value.includes("heart") || value.includes("черв")) return "hearts";
    if (value.includes("diamond") || value.includes("буб")) return "diamonds";
    if (value.includes("spade") || value.includes("пик")) return "spades";
    if (value.includes("club") || value.includes("крест") || value.includes("треф")) return "clubs";
    return null;
  }

  function getCurrentSuit(trumpCard) {
    const trump = typeof state !== "undefined" ? state.trump : null;
    const candidates = [
      typeof trump === "string" ? trump : null,
      trump?.suit,
      trump?.symbol,
      trump?.card?.suit,
      trump?.card?.symbol,
      trumpCard?.dataset?.card,
      trumpCard?.getAttribute?.("aria-label"),
      trumpCard?.textContent,
    ];

    for (const candidate of candidates) {
      const suit = normalizeSuit(candidate);
      if (suit) return suit;
    }

    return null;
  }

  function createSuitArt(suit) {
    const meta = SUIT_META[suit];
    if (!meta) return null;

    const art = document.createElement("span");
    art.className = `android-trump-suit-art is-${meta.color}`;
    art.dataset.suit = suit;
    art.setAttribute("aria-hidden", "true");
    art.innerHTML = `
      <svg viewBox="0 0 24 24" role="presentation" focusable="false">
        <path d="${meta.path}" fill="currentColor"></path>
        <path d="${meta.path}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".45" transform="translate(0 -.25)"></path>
      </svg>
    `;
    return art;
  }

  function syncTrumpPresentation() {
    if (typeof state === "undefined" || !trumpPill) return;

    const trumpCard = trumpPill.querySelector(".trump-card") || trumpPill.querySelector(".card");
    if (!trumpCard) {
      lastTrumpCard = null;
      lastTrumpSignature = "";
      return;
    }

    const language = getLanguage();
    const titleText = language === "en" ? "Trump" : "Козырь";
    const suit = getCurrentSuit(trumpCard);
    const signature = `${language}:${suit || "none"}`;
    const currentTitle = trumpPill.querySelector(".android-trump-title");
    const currentArt = trumpCard.querySelector(".android-trump-suit-art");
    const presentationIsCurrent = trumpCard === lastTrumpCard
      && signature === lastTrumpSignature
      && currentTitle?.textContent === titleText
      && (suit ? currentArt?.dataset.suit === suit : !currentArt);

    if (presentationIsCurrent) return;

    for (const node of Array.from(trumpPill.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.remove();
    }

    let title = trumpPill.querySelector(".android-trump-title");
    if (!title) {
      title = document.createElement("span");
      title.className = "android-trump-title";
      trumpPill.insertBefore(title, trumpCard);
    }
    if (title.textContent !== titleText) title.textContent = titleText;

    if (!suit) {
      trumpCard.classList.remove("has-android-suit-art");
      trumpCard.removeAttribute("data-android-suit");
      currentArt?.remove();
      lastTrumpCard = trumpCard;
      lastTrumpSignature = signature;
      return;
    }

    if (currentArt?.dataset.suit !== suit) {
      currentArt?.remove();
      const art = createSuitArt(suit);
      if (art) trumpCard.append(art);
    }

    if (trumpCard.dataset.androidSuit !== suit) trumpCard.dataset.androidSuit = suit;
    trumpCard.classList.add("has-android-suit-art");
    lastTrumpCard = trumpCard;
    lastTrumpSignature = signature;
  }

  function syncHudClasses(bidBalance) {
    const hasTrump = Boolean(state.trump);
    const suitKind = state.trump?.type === "standard"
      ? (state.trump.color === "red" || state.trump.suit === "hearts" || state.trump.suit === "diamonds" ? "red" : "black")
      : "special";

    elements.trumpLabel.classList.toggle("v13-hud-hidden", !hasTrump);
    elements.trumpLabel.classList.toggle("v13-trump-ready", hasTrump);
    if (elements.trumpLabel.dataset.v13Suit !== suitKind) {
      elements.trumpLabel.dataset.v13Suit = suitKind;
    }

    elements.roundLabel.classList.toggle("v13-hud-hidden", !bidBalance);
  }

  function renderCachedHud() {
    const chooser = getPlayerById(state.trumpChooserId);
    const bidBalance = getBidBalance();
    const roundSignature = bidBalance ? `${bidBalance.type}:${bidBalance.text}` : "hidden";

    if (roundSignature !== lastRoundSignature) {
      elements.roundLabel.hidden = !bidBalance;
      elements.roundLabel.textContent = bidBalance?.text || "";
      elements.roundLabel.classList.toggle("is-push", bidBalance?.type === "push");
      elements.roundLabel.classList.toggle("is-take", bidBalance?.type === "take");
      lastRoundSignature = roundSignature;
    }

    if (!state.trump) {
      const chooserText = state.phase === "trump-select" && chooser
        ? ` · ${chooser.seat === "bottom" ? "ты" : chooser.name}`
        : "";
      const label = state.phase === "trump-select" ? `Козырь${chooserText}` : "Козырь";
      const renderKey = `empty:${label}`;

      if (renderKey !== lastTrumpRenderKey || elements.trumpLabel.dataset.trumpKey !== "") {
        elements.trumpLabel.textContent = label;
        elements.trumpLabel.dataset.trumpKey = "";
        lastTrumpCard = null;
        lastTrumpSignature = "";
        lastTrumpRenderKey = renderKey;
      }

      syncTrumpPresentation();
      syncHudClasses(bidBalance);
      return;
    }

    const trumpKey = getTrumpRenderKey(state.trump);
    const renderKey = `trump:${trumpKey}`;
    const hasRenderedCard = Boolean(elements.trumpLabel.querySelector(".trump-card"));

    if (renderKey !== lastTrumpRenderKey || elements.trumpLabel.dataset.trumpKey !== trumpKey || !hasRenderedCard) {
      const shouldReveal = elements.trumpLabel.dataset.trumpKey !== trumpKey;
      elements.trumpLabel.dataset.trumpKey = trumpKey;
      elements.trumpLabel.replaceChildren("Козырь", createTrumpCardElement(state.trump, shouldReveal));
      lastTrumpCard = null;
      lastTrumpSignature = "";
      lastTrumpRenderKey = renderKey;
    }

    syncTrumpPresentation();
    syncHudClasses(bidBalance);
  }

  function getTrickSignature() {
    if (typeof getTrickRenderSignature === "function") {
      return getTrickRenderSignature();
    }

    let signature = `${state.collectingTrickWinnerSeat || ""}|`;
    for (const play of state.currentTrick) {
      signature += [
        play.player?.id || "",
        play.player?.name || "",
        play.player?.seat || "",
        play.card?.id || "",
        play.jokerMode || "",
        play.jokerCommand || "",
        play.jokerSuit || "",
        play.order ?? "",
      ].join(":");
      signature += "|";
    }
    return signature;
  }

  function clearTouchSelection() {
    if (selectionTimer) {
      window.clearTimeout(selectionTimer);
      selectionTimer = 0;
    }

    selectedCard?.classList.remove("is-touch-selected");
    selectedCard = null;
  }

  function canVibrate() {
    return typeof navigator.vibrate === "function" && !reducedMotionQuery?.matches;
  }

  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element)) return;

    const interactive = event.target.closest(
      "button:not(:disabled), .card:not(.is-disabled), [role='button']",
    );
    if (interactive && canVibrate()) {
      navigator.vibrate(interactive.matches(".card") ? 7 : 10);
    }

    const card = event.target.closest(".hand .card:not(.is-disabled):not(:disabled)");
    if (!card) return;

    if (selectionTimer) {
      window.clearTimeout(selectionTimer);
      selectionTimer = 0;
    }
    if (selectedCard && selectedCard !== card) selectedCard.classList.remove("is-touch-selected");

    selectedCard = card;
    card.classList.add("is-touch-selected");
  }, { passive: true });

  document.addEventListener("pointerup", () => {
    if (!selectedCard) return;
    if (selectionTimer) window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(clearTouchSelection, 130);
  }, { passive: true });

  document.addEventListener("pointercancel", clearTouchSelection, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTouchSelection();
  });

  if (typeof renderHud === "function") renderHud = renderCachedHud;

  if (typeof renderTrick === "function") {
    const originalRenderTrick = renderTrick;
    renderTrick = function renderCachedAndroidTrick(...args) {
      const signature = getTrickSignature();
      if (signature === lastTrickSignature) return;

      const result = originalRenderTrick.apply(this, args);
      lastTrickSignature = signature;
      return result;
    };
  }

  window.addEventListener("joker-language-change", () => {
    lastTrumpSignature = "";
    syncTrumpPresentation();
  });

  syncTrumpPresentation();
})();

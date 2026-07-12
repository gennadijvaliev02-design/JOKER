(() => {
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
    if (typeof state === "undefined") return;

    const pill = document.querySelector(".trump-pill");
    if (!pill) return;

    const trumpCard = pill.querySelector(".trump-card") || pill.querySelector(".card");
    if (!trumpCard) return;

    for (const node of [...pill.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.remove();
      }
    }

    let title = pill.querySelector(".android-trump-title");
    if (!title) {
      title = document.createElement("span");
      title.className = "android-trump-title";
      pill.insertBefore(title, trumpCard);
    }
    title.textContent = getLanguage() === "en" ? "Trump" : "Козырь";

    const suit = getCurrentSuit(trumpCard);
    const previousSuit = trumpCard.dataset.androidSuit || "";

    if (!suit) {
      trumpCard.classList.remove("has-android-suit-art");
      trumpCard.removeAttribute("data-android-suit");
      trumpCard.querySelector(".android-trump-suit-art")?.remove();
      return;
    }

    if (previousSuit !== suit || !trumpCard.querySelector(".android-trump-suit-art")) {
      trumpCard.querySelector(".android-trump-suit-art")?.remove();
      const art = createSuitArt(suit);
      if (art) trumpCard.append(art);
    }

    trumpCard.dataset.androidSuit = suit;
    trumpCard.classList.add("has-android-suit-art");
  }

  function clearTouchSelection(except = null) {
    document.querySelectorAll(".hand .card.is-touch-selected").forEach((card) => {
      if (card !== except) card.classList.remove("is-touch-selected");
    });
  }

  document.addEventListener("pointerdown", (event) => {
    const card = event.target.closest(".hand .card:not(.is-disabled):not(:disabled)");
    if (!card) return;

    clearTouchSelection(card);
    card.classList.add("is-touch-selected");
  }, { passive: true });

  document.addEventListener("pointerup", () => {
    window.setTimeout(() => clearTouchSelection(), 130);
  }, { passive: true });

  document.addEventListener("pointercancel", () => clearTouchSelection(), { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTouchSelection();
  });

  function syncAndroidV2() {
    syncTrumpPresentation();
    clearTouchSelection();
  }

  if (typeof render === "function") {
    const originalRender = render;
    render = function renderWithAndroidV2(...args) {
      const result = originalRender.apply(this, args);
      syncAndroidV2();
      return result;
    };
  }

  window.addEventListener("joker-language-change", syncTrumpPresentation);
  syncAndroidV2();
})();

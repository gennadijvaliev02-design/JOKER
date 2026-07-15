(() => {
  "use strict";

  const startScreen = document.getElementById("start-screen");
  const originalStartButton = document.getElementById("start-game");

  if (!startScreen || !originalStartButton) {
    return;
  }

  // script.js attaches direct start to the original button before this file loads.
  // Replacing the node removes that old listener, so the selector becomes the only entry point.
  const startButton = originalStartButton.cloneNode(true);
  originalStartButton.replaceWith(startButton);

  // Every later layer must point to the real button, not the detached original node.
  if (typeof elements !== "undefined" && elements.startGame === originalStartButton) {
    elements.startGame = startButton;
  }

  let starting = false;
  let renderedLanguage = "";
  let renderedDifficulty = "";
  let closeTimer = null;

  function notifyOverlayChange(isOpen) {
    setMenuOverlayOpen("difficulty", isOpen);
  }

  function afterNextPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  const menuFanCards = [...startScreen.querySelectorAll(".menu-fan-card")];
  const openMenuOverlays = new Set();

  function setMenuOverlayOpen(owner, isOpen) {
    if (isOpen) openMenuOverlays.add(owner);
    else openMenuOverlays.delete(owner);

    const playState = openMenuOverlays.size ? "paused" : "running";
    menuFanCards.forEach((card) => {
      if (card.style.animationPlayState !== playState) card.style.animationPlayState = playState;
    });
  }

  window.JokerMenuOverlayState = Object.freeze({ setOpen: setMenuOverlayOpen });

  function getCurrentDifficulty() {
    if (typeof window.getAiDifficulty === "function") {
      return window.getAiDifficulty();
    }

    try {
      return window.localStorage.getItem("joker-ai-difficulty") || "easy";
    } catch {
      return "easy";
    }
  }

  function setDifficulty(value) {
    window.JOKER_AI_DIFFICULTY = value;

    try {
      window.localStorage.setItem("joker-ai-difficulty", value);
    } catch {
      // The URL/local window value still keeps the mode for this session.
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "difficulty-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="difficulty-modal" role="dialog" aria-modal="true" aria-labelledby="difficulty-title">
      <h2 class="difficulty-title" id="difficulty-title">Выбери сложность</h2>
      <div class="difficulty-options">
        <button class="difficulty-option is-easy" type="button" data-ai-difficulty-choice="easy">
          <span class="difficulty-icon" aria-hidden="true">⊘</span>
          <span class="difficulty-copy">
            <span class="difficulty-name" data-difficulty-easy-name>Лёгкие боты</span>
            <span class="difficulty-desc" data-difficulty-easy-desc>Спокойная игра для новичков.</span>
          </span>
        </button>
        <button class="difficulty-option is-medium" type="button" data-ai-difficulty-choice="medium">
          <span class="difficulty-icon" aria-hidden="true">♛</span>
          <span class="difficulty-copy">
            <span class="difficulty-name" data-difficulty-medium-name>Средние боты</span>
            <span class="difficulty-desc" data-difficulty-medium-desc>Умнее, агрессивнее, считают козыри.</span>
          </span>
        </button>
      </div>
      <div class="difficulty-separator" aria-hidden="true"></div>
      <button class="difficulty-back" type="button" data-difficulty-back>← Назад</button>
    </section>
  `;

  startScreen.append(overlay);

  const modal = overlay.querySelector(".difficulty-modal");
  const choices = [...overlay.querySelectorAll("[data-ai-difficulty-choice]")];
  const backButton = overlay.querySelector("[data-difficulty-back]");
  const title = overlay.querySelector("#difficulty-title");
  const easyName = overlay.querySelector("[data-difficulty-easy-name]");
  const easyDesc = overlay.querySelector("[data-difficulty-easy-desc]");
  const mediumName = overlay.querySelector("[data-difficulty-medium-name]");
  const mediumDesc = overlay.querySelector("[data-difficulty-medium-desc]");

  function getTexts() {
    return window.JokerI18n?.getTexts?.() || {
      difficultyTitle: "Выбери сложность",
      easyName: "Лёгкие боты",
      easyDesc: "Спокойная игра для новичков.",
      mediumName: "Средние боты",
      mediumDesc: "Умнее, агрессивнее, считают козыри.",
      back: "← Назад",
      play: "▶ Играть с ботами",
    };
  }

  function applyLanguage(force = false) {
    const language = window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
    if (!force && language === renderedLanguage) return;

    const t = getTexts();
    title.textContent = t.difficultyTitle;
    easyName.textContent = t.easyName;
    easyDesc.textContent = t.easyDesc;
    mediumName.textContent = t.mediumName;
    mediumDesc.textContent = t.mediumDesc;
    backButton.textContent = t.back;
    startButton.textContent = t.play;
    renderedLanguage = language;
  }

  function updateSelectedState(force = false) {
    const current = getCurrentDifficulty();
    if (!force && current === renderedDifficulty) return;

    choices.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.aiDifficultyChoice === current);
    });
    renderedDifficulty = current;
  }

  function setStartingState(value) {
    starting = value;
    choices.forEach((button) => {
      button.disabled = value;
    });
    backButton.disabled = value;
    overlay.classList.toggle("is-starting", value);
  }

  function openDifficultyDialog() {
    if (starting) return;
    window.clearTimeout(closeTimer);
    applyLanguage();
    updateSelectedState();
    overlay.hidden = false;
    notifyOverlayChange(true);

    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      requestAnimationFrame(() => {
        choices
          .find((button) => button.dataset.aiDifficultyChoice === getCurrentDifficulty())
          ?.focus?.({ preventScroll: true });
      });
    });
  }

  function closeDifficultyDialog(restoreFocus = true, immediate = false) {
    window.clearTimeout(closeTimer);
    overlay.classList.remove("is-visible");

    const finish = () => {
      if (overlay.classList.contains("is-visible")) return;
      overlay.hidden = true;
      notifyOverlayChange(false);
      if (restoreFocus) requestAnimationFrame(() => startButton.focus?.({ preventScroll: true }));
    };

    if (immediate) {
      finish();
      return;
    }

    closeTimer = window.setTimeout(finish, 145);
  }

  async function startWithDifficulty(value) {
    if (starting || state.started) return;

    setStartingState(true);
    setDifficulty(value);
    updateSelectedState(true);

    // Paint the selected/pressed state before any game initialization starts.
    await afterNextPaint();
    const ready = await (window.JokerCardPreload?.ensureReady?.({ showProgress: false })
      || Promise.resolve(true));

    closeDifficultyDialog(false, true);
    await afterNextPaint();

    if (!ready) {
      console.warn("Карты не успели полностью предзагрузиться; запускаем с браузерным fallback");
    }

    if (typeof window.startGame === "function") {
      window.startGame();
      return;
    }

    console.warn("Difficulty selector could not find startGame()");
    setStartingState(false);
  }

  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    openDifficultyDialog();
  });

  choices.forEach((button) => {
    button.addEventListener("click", () => {
      startWithDifficulty(button.dataset.aiDifficultyChoice);
    });
  });

  backButton.addEventListener("click", () => closeDifficultyDialog(true));

  overlay.addEventListener("click", (event) => {
    if (!starting && !modal.contains(event.target)) {
      closeDifficultyDialog(true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden && !starting) {
      closeDifficultyDialog(true);
    }
  });

  window.addEventListener("joker-language-change", () => applyLanguage(true));
  applyLanguage(true);
  updateSelectedState(true);

  window.JokerDifficultySelect = {
    open: openDifficultyDialog,
    startWithDifficulty,
  };
})();

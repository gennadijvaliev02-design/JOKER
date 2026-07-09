(() => {
  const startScreen = document.getElementById("start-screen");
  const originalStartButton = document.getElementById("start-game");

  if (!startScreen || !originalStartButton) {
    return;
  }

  // script.js attaches direct start to the original button before this file loads.
  // Replacing the node removes that old listener, so the selector becomes the only entry point.
  const startButton = originalStartButton.cloneNode(true);
  originalStartButton.replaceWith(startButton);

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
            <span class="difficulty-name">Лёгкие боты</span>
            <span class="difficulty-desc">Спокойная игра для новичков.</span>
          </span>
        </button>
        <button class="difficulty-option is-medium" type="button" data-ai-difficulty-choice="medium">
          <span class="difficulty-icon" aria-hidden="true">♛</span>
          <span class="difficulty-copy">
            <span class="difficulty-name">Средние боты</span>
            <span class="difficulty-desc">Умнее, агрессивнее, считают козыри.</span>
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

  function updateSelectedState() {
    const current = getCurrentDifficulty();
    choices.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.aiDifficultyChoice === current);
    });
  }

  function openDifficultyDialog() {
    updateSelectedState();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    choices.find((button) => button.dataset.aiDifficultyChoice === getCurrentDifficulty())?.focus?.();
  }

  function closeDifficultyDialog() {
    overlay.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!overlay.classList.contains("is-visible")) {
        overlay.hidden = true;
      }
    }, 190);
    startButton.focus?.();
  }

  function startWithDifficulty(value) {
    setDifficulty(value);
    updateSelectedState();
    closeDifficultyDialog();
    window.setTimeout(() => {
      if (typeof window.startGame === "function") {
        window.startGame();
      } else {
        console.warn("Difficulty selector could not find startGame()");
      }
    }, 120);
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

  backButton.addEventListener("click", closeDifficultyDialog);

  overlay.addEventListener("click", (event) => {
    if (!modal.contains(event.target)) {
      closeDifficultyDialog();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeDifficultyDialog();
    }
  });

  window.JokerDifficultySelect = {
    open: openDifficultyDialog,
    startWithDifficulty,
  };
})();

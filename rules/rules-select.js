(function () {
  const startScreen = document.getElementById("start-screen");
  const startButton = document.getElementById("start-game");

  if (!startScreen || !startButton || !window.JokerRules) {
    console.warn("Joker rules selector: menu or rules engine is unavailable.");
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "difficulty-overlay rules-mode-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="difficulty-modal rules-mode-modal" role="dialog" aria-modal="true" aria-labelledby="rules-mode-title">
      <h2 class="difficulty-title" id="rules-mode-title">Выбери правила</h2>
      <div class="difficulty-options">
        <button class="difficulty-option rules-mode-option is-popular" type="button" data-rules-mode-choice="popular">
          <span class="difficulty-icon" aria-hidden="true">🎲</span>
          <span class="difficulty-copy">
            <span class="difficulty-name" data-rules-popular-name>Popular</span>
            <span class="difficulty-desc" data-rules-popular-desc>Раздачи 1→8 и 8→1. Быстрее и непредсказуемее.</span>
          </span>
        </button>
        <button class="difficulty-option rules-mode-option is-aggression" type="button" data-rules-mode-choice="aggression">
          <span class="difficulty-icon" aria-hidden="true">🧠</span>
          <span class="difficulty-copy">
            <span class="difficulty-name" data-rules-aggression-name>Aggression</span>
            <span class="difficulty-desc" data-rules-aggression-desc>По 9 карт. Больше расчёта, контроля и давления.</span>
          </span>
        </button>
      </div>
      <div class="difficulty-separator" aria-hidden="true"></div>
      <button class="difficulty-back" type="button" data-rules-mode-back>← Назад</button>
    </section>
  `;

  startScreen.append(overlay);

  const modal = overlay.querySelector(".rules-mode-modal");
  const choices = [...overlay.querySelectorAll("[data-rules-mode-choice]")];
  const title = overlay.querySelector("#rules-mode-title");
  const popularName = overlay.querySelector("[data-rules-popular-name]");
  const popularDesc = overlay.querySelector("[data-rules-popular-desc]");
  const aggressionName = overlay.querySelector("[data-rules-aggression-name]");
  const aggressionDesc = overlay.querySelector("[data-rules-aggression-desc]");
  const backButton = overlay.querySelector("[data-rules-mode-back]");

  function getLanguage() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getTexts() {
    return getLanguage() === "en"
      ? {
          title: "Choose rules",
          popularName: "Popular",
          popularDesc: "Deals from 1→8 and 8→1. Faster and less predictable.",
          aggressionName: "Aggression",
          aggressionDesc: "Nine-card hands. More calculation, control and pressure.",
          back: "← Back",
        }
      : {
          title: "Выбери правила",
          popularName: "Popular",
          popularDesc: "Раздачи 1→8 и 8→1. Быстрее и непредсказуемее.",
          aggressionName: "Aggression",
          aggressionDesc: "По 9 карт. Больше расчёта, контроля и давления.",
          back: "← Назад",
        };
  }

  function applyLanguage() {
    const texts = getTexts();
    title.textContent = texts.title;
    popularName.textContent = texts.popularName;
    popularDesc.textContent = texts.popularDesc;
    aggressionName.textContent = texts.aggressionName;
    aggressionDesc.textContent = texts.aggressionDesc;
    backButton.textContent = texts.back;
  }

  function updateSelectedState() {
    choices.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.rulesModeChoice === window.JokerRules.activeId);
    });
  }

  function openRulesDialog() {
    if (window.jokerState?.started) {
      return;
    }

    applyLanguage();
    updateSelectedState();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    choices.find((button) => button.dataset.rulesModeChoice === window.JokerRules.activeId)?.focus?.();
  }

  function closeRulesDialog() {
    overlay.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!overlay.classList.contains("is-visible")) {
        overlay.hidden = true;
      }
    }, 190);
    startButton.focus?.();
  }

  function continueToDifficulty(ruleId) {
    if (!window.JokerRules.selectProfile(ruleId)) {
      console.warn(`Could not select Joker rules profile: ${ruleId}`);
      return;
    }

    updateSelectedState();
    closeRulesDialog();
    window.setTimeout(() => {
      if (window.JokerDifficultySelect?.open) {
        window.JokerDifficultySelect.open();
      } else {
        console.warn("Rules selector could not find difficulty selector.");
      }
    }, 120);
  }

  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openRulesDialog();
  }, true);

  choices.forEach((button) => {
    button.addEventListener("click", () => continueToDifficulty(button.dataset.rulesModeChoice));
  });

  backButton.addEventListener("click", closeRulesDialog);

  overlay.addEventListener("click", (event) => {
    if (!modal.contains(event.target)) {
      closeRulesDialog();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeRulesDialog();
    }
  });

  window.addEventListener("joker-language-change", applyLanguage);
  window.addEventListener("joker-rules-change", updateSelectedState);
  applyLanguage();

  window.JokerRulesSelect = Object.freeze({
    open: openRulesDialog,
    close: closeRulesDialog,
  });
})();

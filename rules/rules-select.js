(function () {
  const startScreen = document.getElementById("start-screen");
  const startButton = document.getElementById("start-game");
  const rulesCard = document.getElementById("rules-card");

  if (!startScreen || !startButton || !window.JokerRules) {
    console.warn("Joker rules selector: menu or rules engine is unavailable.");
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .rules-mode-option.is-popular {
      border-color: rgba(75, 255, 155, 0.78);
      box-shadow: 0 0 0 1px rgba(75, 255, 155, 0.16), 0 0 26px rgba(75, 255, 155, 0.15), inset 0 1px 0 rgba(255,255,255,.14);
    }
    .rules-mode-option.is-popular .difficulty-icon,
    .rules-mode-option.is-popular .difficulty-name { color: #65ffab; }
    .rules-mode-option.is-aggression {
      border-color: rgba(255, 115, 82, 0.82);
      box-shadow: 0 0 0 1px rgba(255, 115, 82, 0.16), 0 0 30px rgba(255, 75, 55, 0.18), inset 0 1px 0 rgba(255,255,255,.14);
    }
    .rules-mode-option.is-aggression .difficulty-icon,
    .rules-mode-option.is-aggression .difficulty-name { color: #ff8a6d; }
  `;
  document.head.append(style);

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
            <span class="difficulty-name" data-rules-popular-name>Популярная</span>
            <span class="difficulty-desc" data-rules-popular-desc>Раздачи 1→8 и 8→1. Быстрее и непредсказуемее.</span>
          </span>
        </button>
        <button class="difficulty-option rules-mode-option is-aggression" type="button" data-rules-mode-choice="aggression">
          <span class="difficulty-icon" aria-hidden="true">🧠</span>
          <span class="difficulty-copy">
            <span class="difficulty-name" data-rules-aggression-name>Агрессивная</span>
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
          popularName: "Популярная",
          popularDesc: "Раздачи 1→8 и 8→1. Быстрее и непредсказуемее.",
          aggressionName: "Агрессивная",
          aggressionDesc: "По 9 карт. Больше расчёта, контроля и давления.",
          back: "← Назад",
        };
  }

  function getRulesList() {
    const isEnglish = getLanguage() === "en";

    if (window.JokerRules.isPopular()) {
      return isEnglish
        ? [
            "The match has four bullets: 1→8, four 9-card games, 8→1, then four 9-card games.",
            "Bid how many tricks you plan to take.",
            "The last player cannot leave the total bids equal to the number of tricks.",
            "A center Joker means no trump; a chooser may also select no trump.",
            "Follow suit when possible; otherwise play trump when available.",
            "The Joker works with the same Take, High, Beat and Duck commands.",
            "Complete every game in a bullet without failing to earn a premium.",
          ]
        : [
            "В партии 4 пульки: 1→8, четыре игры по 9 карт, 8→1 и снова четыре игры по 9 карт.",
            "Закажи, сколько взяток планируешь взять.",
            "Последний игрок не может оставить сумму заказов равной числу взяток.",
            "Джокер из центра означает безку; выбирающий козырь тоже может выбрать безку.",
            "Ходи в масть, если она есть; без масти нужно ходить козырем.",
            "Джокер работает с командами Берёт, Высший, Перебить и Подсунуть.",
            "Не испортил ни одной игры в целой пульке — получаешь премию.",
          ];
    }

    return isEnglish
      ? [
          "The match has five bullets with four games in each.",
          "Bid how many tricks you plan to take.",
          "The total bids cannot equal nine.",
          "In the 400 bullet, every player must take exactly three tricks.",
          "Follow suit when possible; otherwise play trump when available.",
          "The Joker is the strongest card and supports tactical commands.",
          "Complete all four games in a bullet to earn a premium.",
        ]
      : [
          "В партии 5 пулек по 4 игры.",
          "Закажи, сколько взяток планируешь взять.",
          "Сумма заказов не должна быть ровно 9.",
          "В пульке 400 всем нужно взять ровно 3 взятки.",
          "Ходи в масть, если она есть; без масти нужно ходить козырем.",
          "Джокер — самая сильная карта и поддерживает тактические команды.",
          "За 4 выполненные игры пульки даётся премия.",
        ];
  }

  function applyRulesCard() {
    const list = rulesCard?.querySelector("ol");
    if (!list) {
      return;
    }

    list.replaceChildren(...getRulesList().map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
  }

  function applyLanguage() {
    const texts = getTexts();
    title.textContent = texts.title;
    popularName.textContent = texts.popularName;
    popularDesc.textContent = texts.popularDesc;
    aggressionName.textContent = texts.aggressionName;
    aggressionDesc.textContent = texts.aggressionDesc;
    backButton.textContent = texts.back;
    applyRulesCard();
  }

  function updateChoiceState() {
    choices.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.rulesModeChoice === window.JokerRules.activeId);
    });
  }

  function updateSelectedState() {
    updateChoiceState();
    applyRulesCard();
  }

  function openRulesDialog() {
    if (window.jokerState?.started) {
      return;
    }

    applyLanguage();
    updateChoiceState();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    choices.find((button) => button.dataset.rulesModeChoice === window.JokerRules.activeId)?.focus?.({ preventScroll: true });
  }

  function closeRulesDialog({ restoreFocus = true } = {}) {
    overlay.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!overlay.classList.contains("is-visible")) {
        overlay.hidden = true;
      }
    }, 190);

    if (restoreFocus) {
      startButton.focus?.({ preventScroll: true });
    }
  }

  function continueToDifficulty(ruleId) {
    if (!window.JokerRules.selectProfile(ruleId)) {
      console.warn(`Could not select Joker rules profile: ${ruleId}`);
      return;
    }

    closeRulesDialog({ restoreFocus: false });
    window.setTimeout(() => {
      if (window.JokerDifficultySelect?.open) {
        window.JokerDifficultySelect.open();
      } else {
        console.warn("Rules selector could not find difficulty selector.");
      }
    }, 220);
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

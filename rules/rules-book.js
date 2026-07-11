(function () {
  const rulesCard = document.getElementById("rules-card");
  const rulesToggle = document.getElementById("rules-toggle");

  if (!rulesCard || !rulesToggle || !window.JokerRules) {
    console.warn("Joker rules book: menu or rules engine is unavailable.");
    return;
  }

  const PAGES = ["popular", "aggression"];
  const COPY = {
    ru: {
      bookLabel: "Правила игры",
      close: "Закрыть правила",
      previous: "Предыдущая версия правил",
      next: "Следующая версия правил",
      popular: {
        title: "Популярная",
        region: "Владикавказская версия",
        icon: "🎲",
        rules: [
          "В партии 4 пульки: 1→8, четыре игры по 9 карт, 8→1 и снова четыре игры по 9 карт.",
          "Закажи, сколько взяток планируешь взять.",
          "Последний игрок не может оставить сумму заказов равной числу взяток.",
          "Джокер из центра означает безку; выбирающий козырь тоже может выбрать безку.",
          "Ходи в масть, если она есть; без масти нужно ходить козырем.",
          "Джокер работает с командами Берёт, Высший, Перебить и Подсунуть.",
          "Не испортил ни одной игры в целой пульке — получаешь премию.",
        ],
      },
      aggression: {
        title: "Агрессивная",
        region: "Цхинвальская версия",
        icon: "🧠",
        rules: [
          "В партии 5 пулек по 4 игры.",
          "Закажи, сколько взяток планируешь взять.",
          "Сумма заказов не должна быть ровно 9.",
          "В пульке 400 каждому игроку нужно взять ровно 3 взятки.",
          "Ходи в масть, если она есть; без масти нужно ходить козырем.",
          "Джокер — самая сильная карта и поддерживает тактические команды.",
          "За 4 выполненные игры пульки даётся премия.",
        ],
      },
    },
    en: {
      bookLabel: "Game rules",
      close: "Close rules",
      previous: "Previous rules version",
      next: "Next rules version",
      popular: {
        title: "Popular",
        region: "Vladikavkaz rules",
        icon: "🎲",
        rules: [
          "The match has four bullets: 1→8, four 9-card games, 8→1, then four more 9-card games.",
          "Bid how many tricks you plan to take.",
          "The last player cannot leave the total bids equal to the number of tricks.",
          "A center Joker means no trump; a chooser may also select no trump.",
          "Follow suit when possible; otherwise play trump when available.",
          "The Joker uses Take, High, Beat and Duck commands.",
          "Complete every game in a bullet without failing to earn a premium.",
        ],
      },
      aggression: {
        title: "Aggression",
        region: "Tskhinval rules",
        icon: "🧠",
        rules: [
          "The match has five bullets with four games in each.",
          "Bid how many tricks you plan to take.",
          "The total bids cannot equal nine.",
          "In the 400 bullet, every player must take exactly three tricks.",
          "Follow suit when possible; otherwise play trump when available.",
          "The Joker is the strongest card and supports tactical commands.",
          "Complete all four games in a bullet to earn a premium.",
        ],
      },
    },
  };

  const style = document.createElement("style");
  style.textContent = `
    .rules-card[hidden] { display: none !important; }
    .rules-card.rules-book-card {
      left: clamp(10px, 3vw, 34px) !important;
      right: clamp(10px, 3vw, 34px) !important;
      bottom: clamp(10px, 3vw, 28px) !important;
      max-height: min(390px, 72vh) !important;
      padding: 0 !important;
      overflow: hidden !important;
      border: 1px solid rgba(255, 232, 137, 0.34) !important;
      border-radius: 25px !important;
      background:
        radial-gradient(circle at 12% 0%, rgba(255, 220, 100, 0.13), transparent 34%),
        radial-gradient(circle at 92% 100%, rgba(40, 255, 177, 0.10), transparent 38%),
        linear-gradient(145deg, rgba(4, 26, 29, 0.97), rgba(3, 10, 17, 0.97)) !important;
      box-shadow:
        0 28px 70px rgba(0, 0, 0, 0.62),
        inset 0 1px 0 rgba(255, 255, 255, 0.12),
        0 0 0 1px rgba(50, 255, 187, 0.06) !important;
      backdrop-filter: blur(20px) saturate(1.2);
      -webkit-backdrop-filter: blur(20px) saturate(1.2);
    }

    .rules-book {
      --rules-accent: #63ffb1;
      --rules-accent-soft: rgba(99, 255, 177, 0.16);
      position: relative;
      min-height: 270px;
      display: grid;
      align-items: center;
      padding: 24px clamp(56px, 8vw, 88px) 34px;
      color: rgba(255, 255, 255, 0.9);
      overflow: hidden;
    }

    .rules-book[data-page="aggression"] {
      --rules-accent: #ff8a6d;
      --rules-accent-soft: rgba(255, 106, 79, 0.16);
    }

    .rules-book::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(115deg, transparent 0 42%, rgba(255,255,255,.035) 48%, transparent 55%),
        radial-gradient(circle at 50% 110%, var(--rules-accent-soft), transparent 52%);
    }

    .rules-book-page {
      position: relative;
      z-index: 1;
      animation: rules-book-page-in 220ms ease both;
    }

    .rules-book-kicker {
      margin-bottom: 9px;
      color: rgba(255, 234, 165, 0.7);
      font-size: 10px;
      font-weight: 950;
      letter-spacing: 0.17em;
      text-transform: uppercase;
    }

    .rules-book-heading {
      display: flex;
      align-items: center;
      gap: 13px;
      margin-bottom: 13px;
    }

    .rules-book-icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border: 1px solid color-mix(in srgb, var(--rules-accent) 58%, transparent);
      border-radius: 15px;
      background: var(--rules-accent-soft);
      color: var(--rules-accent);
      font-size: 22px;
      box-shadow: 0 0 22px var(--rules-accent-soft), inset 0 1px 0 rgba(255,255,255,.12);
    }

    .rules-book-title {
      margin: 0;
      color: var(--rules-accent);
      font-size: clamp(21px, 3.4vw, 32px);
      line-height: 1;
      font-weight: 1000;
      letter-spacing: -0.035em;
      text-transform: uppercase;
      text-shadow: 0 0 22px var(--rules-accent-soft);
    }

    .rules-book-region {
      margin: 5px 0 0;
      color: rgba(255, 255, 255, 0.58);
      font-size: 11px;
      font-weight: 850;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .rules-book-list {
      margin: 0;
      padding-left: 21px;
      columns: 2;
      column-gap: 34px;
      color: rgba(255, 255, 255, 0.84);
      font-size: clamp(11px, 1.45vw, 14px);
      line-height: 1.38;
    }

    .rules-book-list li {
      break-inside: avoid;
      margin: 0 0 7px;
      padding-left: 3px;
    }

    .rules-book-list li::marker {
      color: var(--rules-accent);
      font-weight: 950;
    }

    .rules-book-close,
    .rules-book-nav {
      position: absolute;
      z-index: 4;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.16);
      color: rgba(255,255,255,.88);
      cursor: pointer;
      transition: transform 150ms ease, filter 150ms ease, border-color 150ms ease, background 150ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    .rules-book-close {
      top: 12px;
      right: 12px;
      width: 38px;
      height: 38px;
      border-radius: 13px;
      background: rgba(255,255,255,.075);
      font-size: 25px;
      line-height: 1;
      font-weight: 500;
    }

    .rules-book-nav {
      top: 50%;
      width: 44px;
      height: 62px;
      border-color: color-mix(in srgb, var(--rules-accent) 48%, transparent);
      border-radius: 17px;
      background:
        radial-gradient(circle at 30% 22%, rgba(255,255,255,.18), transparent 35%),
        var(--rules-accent-soft);
      color: var(--rules-accent);
      font-size: 42px;
      line-height: 1;
      font-family: Arial, sans-serif;
      font-weight: 300;
      box-shadow: 0 0 24px var(--rules-accent-soft), inset 0 1px 0 rgba(255,255,255,.12);
    }

    .rules-book-prev { left: 13px; transform: translateY(-50%); }
    .rules-book-next { right: 13px; transform: translateY(-50%); }

    .rules-book-close:hover,
    .rules-book-close:focus-visible {
      transform: scale(1.06);
      filter: brightness(1.16);
      border-color: rgba(255,255,255,.34);
      outline: none;
    }

    .rules-book-prev:hover,
    .rules-book-prev:focus-visible { transform: translateY(-50%) translateX(-2px) scale(1.05); outline: none; }
    .rules-book-next:hover,
    .rules-book-next:focus-visible { transform: translateY(-50%) translateX(2px) scale(1.05); outline: none; }

    .rules-book-dots {
      position: absolute;
      left: 50%;
      bottom: 12px;
      z-index: 3;
      display: flex;
      gap: 7px;
      transform: translateX(-50%);
    }

    .rules-book-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: rgba(255,255,255,.2);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
      transition: width 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }

    .rules-book-dot.is-active {
      width: 24px;
      background: var(--rules-accent);
      box-shadow: 0 0 13px var(--rules-accent);
    }

    @keyframes rules-book-page-in {
      from { opacity: 0; transform: translateY(7px) scale(.992); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 760px), (max-height: 540px) {
      .rules-card.rules-book-card {
        left: 8px !important;
        right: 8px !important;
        bottom: 8px !important;
        max-height: min(360px, 82vh) !important;
        border-radius: 20px !important;
      }

      .rules-book {
        min-height: 225px;
        padding: 16px 50px 28px;
      }

      .rules-book-heading { margin-bottom: 9px; }
      .rules-book-icon { width: 37px; height: 37px; border-radius: 12px; font-size: 19px; }
      .rules-book-region { font-size: 9px; }
      .rules-book-list { column-gap: 22px; font-size: 10px; line-height: 1.27; }
      .rules-book-list li { margin-bottom: 5px; }
      .rules-book-close { top: 8px; right: 8px; width: 32px; height: 32px; font-size: 21px; }
      .rules-book-nav { width: 36px; height: 52px; border-radius: 14px; font-size: 34px; }
      .rules-book-prev { left: 8px; }
      .rules-book-next { right: 8px; }
      .rules-book-dots { bottom: 8px; }
    }

    @media (max-width: 560px) {
      .rules-book-list { columns: 1; }
    }
  `;
  document.head.append(style);

  rulesCard.classList.add("rules-book-card");
  rulesCard.innerHTML = `
    <div class="rules-book" data-page="popular">
      <button class="rules-book-close" type="button" data-rules-book-close aria-label="Закрыть правила">×</button>
      <button class="rules-book-nav rules-book-prev" type="button" data-rules-book-prev aria-label="Предыдущая версия правил">‹</button>
      <section class="rules-book-page" data-rules-book-page></section>
      <button class="rules-book-nav rules-book-next" type="button" data-rules-book-next aria-label="Следующая версия правил">›</button>
      <div class="rules-book-dots" aria-hidden="true">
        <span class="rules-book-dot is-active"></span>
        <span class="rules-book-dot"></span>
      </div>
    </div>
  `;

  const book = rulesCard.querySelector(".rules-book");
  const page = rulesCard.querySelector("[data-rules-book-page]");
  const closeButton = rulesCard.querySelector("[data-rules-book-close]");
  const previousButton = rulesCard.querySelector("[data-rules-book-prev]");
  const nextButton = rulesCard.querySelector("[data-rules-book-next]");
  const dots = [...rulesCard.querySelectorAll(".rules-book-dot")];
  let pageIndex = window.JokerRules.isPopular() ? 0 : 1;

  function getLanguage() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getCopy() {
    return COPY[getLanguage() === "en" ? "en" : "ru"];
  }

  function applyModeNames() {
    const isEnglish = getLanguage() === "en";
    const popularName = document.querySelector("[data-rules-popular-name]");
    const aggressionName = document.querySelector("[data-rules-aggression-name]");

    if (popularName) {
      popularName.textContent = isEnglish ? "Popular" : "Популярная";
    }

    if (aggressionName) {
      aggressionName.textContent = isEnglish ? "Aggression" : "Агрессивная";
    }
  }

  function renderPage() {
    const copy = getCopy();
    const pageId = PAGES[pageIndex];
    const current = copy[pageId];

    book.dataset.page = pageId;
    closeButton.setAttribute("aria-label", copy.close);
    previousButton.setAttribute("aria-label", copy.previous);
    nextButton.setAttribute("aria-label", copy.next);

    page.innerHTML = `
      <div class="rules-book-kicker">${copy.bookLabel}</div>
      <div class="rules-book-heading">
        <div class="rules-book-icon" aria-hidden="true">${current.icon}</div>
        <div>
          <h2 class="rules-book-title">${current.title}</h2>
          <p class="rules-book-region">${current.region}</p>
        </div>
      </div>
      <ol class="rules-book-list">
        ${current.rules.map((rule) => `<li>${rule}</li>`).join("")}
      </ol>
    `;

    dots.forEach((dot, index) => dot.classList.toggle("is-active", index === pageIndex));
    applyModeNames();
  }

  function openBook() {
    pageIndex = window.JokerRules.isPopular() ? 0 : 1;
    renderPage();
    rulesCard.hidden = false;
    closeButton.focus?.();
  }

  function closeBook() {
    rulesCard.hidden = true;
    rulesToggle.focus?.();
  }

  function turnPage(direction) {
    pageIndex = (pageIndex + direction + PAGES.length) % PAGES.length;
    renderPage();
  }

  rulesToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (rulesCard.hidden) {
      openBook();
    } else {
      closeBook();
    }
  }, true);

  closeButton.addEventListener("click", closeBook);
  previousButton.addEventListener("click", () => turnPage(-1));
  nextButton.addEventListener("click", () => turnPage(1));

  document.addEventListener("keydown", (event) => {
    if (rulesCard.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeBook();
    } else if (event.key === "ArrowLeft") {
      turnPage(-1);
    } else if (event.key === "ArrowRight") {
      turnPage(1);
    }
  });

  window.addEventListener("joker-language-change", renderPage);
  window.addEventListener("joker-rules-change", () => {
    if (rulesCard.hidden) {
      pageIndex = window.JokerRules.isPopular() ? 0 : 1;
    }
    renderPage();
  });

  renderPage();

  window.JokerRulesBook = Object.freeze({
    open: openBook,
    close: closeBook,
    next: () => turnPage(1),
    previous: () => turnPage(-1),
  });
})();

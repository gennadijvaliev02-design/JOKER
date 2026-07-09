(() => {
  const startScreen = document.getElementById("start-screen");
  const onlineButton = document.getElementById("online-button");
  const settingsButton = document.getElementById("settings-button");
  const languageButton = document.getElementById("language-toggle");

  if (!startScreen) {
    return;
  }

  const STORAGE_KEY = "joker-language";
  const texts = {
    ru: {
      subtitle: "Современный карточный стол с честными ботами, живыми анимациями и лучшими правилами.",
      name: "Твоё имя",
      play: "▶ Играть с ботами",
      online: "🌍 Онлайн",
      soon: "скоро",
      rules: "📖 Правила",
      settings: "⚙ Настройки",
      langButton: "EN",
      langToast: "Русский интерфейс включён",
      onlineToast: "Онлайн режим скоро будет",
      settingsToast: "Настройки добавим после главного меню",
      rulesItems: [
        "В партии 5 пулек по 4 игры.",
        "Закажи, сколько взяток планируешь взять.",
        "Сумма заказов не должна быть ровно 9.",
        "В пульке 400 всем нужно взять ровно 3.",
        "Ходи в масть, если она есть.",
        "Джокер самый сильный.",
        "За 4 выполненные игры пульки даётся премия.",
      ],
      difficultyTitle: "Выбери сложность",
      easyName: "Лёгкие боты",
      easyDesc: "Спокойная игра для новичков.",
      mediumName: "Средние боты",
      mediumDesc: "Умнее, агрессивнее, считают козыри.",
      back: "← Назад",
    },
    en: {
      subtitle: "A modern card table with fair bots, smooth animations, and classic Joker rules.",
      name: "Your name",
      play: "▶ Play vs Bots",
      online: "🌍 Online",
      soon: "soon",
      rules: "📖 Rules",
      settings: "⚙ Settings",
      langButton: "RU",
      langToast: "English interface enabled",
      onlineToast: "Online mode is coming soon",
      settingsToast: "Settings will be added after the main menu",
      rulesItems: [
        "The match has 5 bullets of 4 games each.",
        "Bid how many tricks you plan to take.",
        "The total bids cannot be exactly 9.",
        "In the 400 bullet, everyone must take exactly 3 tricks.",
        "Follow suit if you have it.",
        "The Joker is the strongest card.",
        "Complete all 4 games in a bullet to earn a bonus.",
      ],
      difficultyTitle: "Choose difficulty",
      easyName: "Easy bots",
      easyDesc: "Calm gameplay for beginners.",
      mediumName: "Medium bots",
      mediumDesc: "Smarter, sharper, and counting trumps.",
      back: "← Back",
    },
  };

  const toast = document.createElement("div");
  toast.className = "menu-toast";
  startScreen.append(toast);

  let toastTimer = null;

  function readLanguage() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ru";
    } catch {
      return "ru";
    }
  }

  function saveLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Session still works through window.JokerLanguage.
    }
  }

  function showMenuToast(text) {
    toast.textContent = text;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1900);
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function applyLanguage(language) {
    const lang = language === "en" ? "en" : "ru";
    const t = texts[lang];

    window.JokerLanguage = lang;
    window.JokerMenuTexts = texts;
    document.documentElement.lang = lang;

    setText(".menu-subtitle", t.subtitle);
    setText(".name-field span", t.name);
    setText("#start-game", t.play);
    setText("#rules-toggle", t.rules);
    setText("#settings-button", t.settings);
    setText("#language-toggle", t.langButton);

    if (onlineButton) {
      onlineButton.innerHTML = `${t.online} <small>${t.soon}</small>`;
    }

    [...document.querySelectorAll("#rules-card li")].forEach((item, index) => {
      if (t.rulesItems[index]) {
        item.textContent = t.rulesItems[index];
      }
    });

    window.dispatchEvent(new CustomEvent("joker-language-change", { detail: { language: lang, texts: t } }));
  }

  function setLanguage(language) {
    const lang = language === "en" ? "en" : "ru";
    saveLanguage(lang);
    applyLanguage(lang);
    return lang;
  }

  onlineButton?.addEventListener("click", () => {
    showMenuToast(texts[window.JokerLanguage || "ru"].onlineToast);
  });

  settingsButton?.addEventListener("click", () => {
    showMenuToast(texts[window.JokerLanguage || "ru"].settingsToast);
  });

  languageButton?.addEventListener("click", () => {
    const nextLanguage = window.JokerLanguage === "en" ? "ru" : "en";
    setLanguage(nextLanguage);
    showMenuToast(texts[nextLanguage].langToast);
  });

  window.JokerI18n = {
    getLanguage: () => window.JokerLanguage || "ru",
    getTexts: () => texts[window.JokerLanguage || "ru"],
    setLanguage,
  };

  applyLanguage(readLanguage());
})();

(() => {
  const STORAGE_KEY = "joker-local-rating-v1";
  const AWARD_KEY = "joker-local-rating-last-award";
  const PLACE_POINTS = [25, 10, -5, -20];
  const LEAGUES = [
    { id: "bronze", min: 0, emoji: "🥉", ru: "Бронза", en: "Bronze" },
    { id: "silver", min: 120, emoji: "🥈", ru: "Серебро", en: "Silver" },
    { id: "gold", min: 300, emoji: "🥇", ru: "Золото", en: "Gold" },
    { id: "diamond", min: 650, emoji: "💎", ru: "Алмаз", en: "Diamond" },
    { id: "master", min: 1100, emoji: "🔥", ru: "Мастер", en: "Master" },
    { id: "legend", min: 1700, emoji: "👑", ru: "Легенда", en: "Legend" },
  ];

  const COPY = {
    ru: {
      rating: "Рейтинг",
      games: "Игр",
      wins: "Побед",
      winRate: "Победы",
      next: "До следующей лиги",
      max: "Максимальная лига",
      placement: "Место",
      result: "Рейтинг",
      points: "очков",
      resetTitle: "Локальный рейтинг хранится в этом браузере",
    },
    en: {
      rating: "Rating",
      games: "Games",
      wins: "Wins",
      winRate: "Win rate",
      next: "To next league",
      max: "Top league",
      placement: "Place",
      result: "Rating",
      points: "points",
      resetTitle: "Local rating is saved in this browser",
    },
  };

  const style = document.createElement("style");
  style.textContent = `
    .local-rating-card {
      position: relative;
      display: grid;
      gap: 9px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(255, 226, 116, 0.28);
      background:
        linear-gradient(135deg, rgba(255, 214, 41, 0.13), rgba(0, 220, 178, 0.07)),
        rgba(2, 17, 22, 0.58);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 10px 24px rgba(0, 0, 0, 0.22);
      color: rgba(255, 255, 255, 0.9);
      overflow: hidden;
    }

    .local-rating-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 12% 0%, rgba(255, 226, 116, 0.22), transparent 42%);
      pointer-events: none;
    }

    .local-rating-top,
    .local-rating-stats,
    .local-rating-progress-text {
      position: relative;
      z-index: 1;
    }

    .local-rating-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .local-rating-league {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 15px;
      font-weight: 950;
      color: #ffe57e;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .local-rating-points {
      font-size: 14px;
      font-weight: 900;
      color: #eaffff;
      white-space: nowrap;
    }

    .local-rating-bar {
      position: relative;
      z-index: 1;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.13);
      overflow: hidden;
      box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.35);
    }

    .local-rating-fill {
      width: var(--rating-progress, 0%);
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #3affad, #ffe46f, #ff9f1a);
      box-shadow: 0 0 14px rgba(255, 220, 90, 0.42);
      transition: width 340ms ease;
    }

    .local-rating-progress-text {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.74);
    }

    .local-rating-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
    }

    .local-rating-stat {
      display: grid;
      gap: 2px;
      padding: 6px 7px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .local-rating-stat b {
      font-size: 14px;
      line-height: 1;
    }

    .local-rating-stat span {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.62);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .rating-result-card {
      width: min(560px, 92%);
      margin: 12px auto 6px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border-radius: 18px;
      border: 1px solid rgba(255, 226, 116, 0.38);
      background:
        linear-gradient(135deg, rgba(5, 36, 45, 0.82), rgba(8, 16, 28, 0.78)),
        radial-gradient(circle at 0% 0%, rgba(255, 226, 116, 0.22), transparent 40%);
      color: #f8f4dc;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.1);
    }

    .rating-result-badge {
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      font-size: 24px;
      background: rgba(255, 225, 94, 0.13);
      border: 1px solid rgba(255, 225, 94, 0.44);
    }

    .rating-result-title {
      font-size: 13px;
      font-weight: 950;
      color: #ffe682;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rating-result-detail {
      margin-top: 3px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.75);
    }

    .rating-result-delta {
      font-size: 20px;
      font-weight: 950;
      white-space: nowrap;
    }

    .rating-result-delta.is-positive {
      color: #63ffab;
    }

    .rating-result-delta.is-negative {
      color: #ff8585;
    }

    @media (max-height: 560px) {
      .local-rating-card {
        padding: 9px 11px;
        gap: 7px;
      }

      .local-rating-stats {
        display: none;
      }

      .rating-result-card {
        padding: 9px 11px;
        margin-top: 8px;
      }
    }
  `;
  document.head.append(style);

  function getLang() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getCopy() {
    return COPY[getLang()] || COPY.ru;
  }

  function readStats() {
    try {
      return {
        rating: 0,
        games: 0,
        wins: 0,
        podiums: 0,
        bestRating: 0,
        ...(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {}),
      };
    } catch {
      return { rating: 0, games: 0, wins: 0, podiums: 0, bestRating: 0 };
    }
  }

  function saveStats(stats) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Rating display still works during this session.
    }
  }

  function getLeague(rating) {
    return [...LEAGUES].reverse().find((league) => rating >= league.min) || LEAGUES[0];
  }

  function getNextLeague(rating) {
    return LEAGUES.find((league) => league.min > rating) || null;
  }

  function getLeagueName(league) {
    return league[getLang()] || league.en;
  }

  function getProgress(rating) {
    const league = getLeague(rating);
    const next = getNextLeague(rating);

    if (!next) {
      return 100;
    }

    return Math.max(0, Math.min(100, ((rating - league.min) / (next.min - league.min)) * 100));
  }

  function getWinRate(stats) {
    return stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;
  }

  function createRatingCard() {
    const card = document.createElement("div");
    card.className = "local-rating-card";
    card.title = getCopy().resetTitle;
    return card;
  }

  function ensureRatingCard() {
    const menuActions = document.querySelector(".menu-actions");
    const nameField = document.querySelector(".name-field");

    if (!menuActions || !nameField) {
      return null;
    }

    let card = document.getElementById("local-rating-card");

    if (!card) {
      card = createRatingCard();
      card.id = "local-rating-card";
      nameField.insertAdjacentElement("afterend", card);
    }

    return card;
  }

  function renderRatingCard() {
    const card = ensureRatingCard();
    if (!card) return;

    const copy = getCopy();
    const stats = readStats();
    const league = getLeague(stats.rating);
    const next = getNextLeague(stats.rating);
    const progress = getProgress(stats.rating);

    card.style.setProperty("--rating-progress", `${progress}%`);
    card.innerHTML = `
      <div class="local-rating-top">
        <div class="local-rating-league"><span>${league.emoji}</span><span>${getLeagueName(league)}</span></div>
        <div class="local-rating-points">${stats.rating} ${copy.points}</div>
      </div>
      <div class="local-rating-bar" aria-hidden="true"><div class="local-rating-fill"></div></div>
      <div class="local-rating-progress-text">
        <span>${next ? `${copy.next}: ${Math.max(0, next.min - stats.rating)}` : copy.max}</span>
        <span>${next ? `${next.min}` : "MAX"}</span>
      </div>
      <div class="local-rating-stats">
        <div class="local-rating-stat"><b>${stats.games}</b><span>${copy.games}</span></div>
        <div class="local-rating-stat"><b>${stats.wins}</b><span>${copy.wins}</span></div>
        <div class="local-rating-stat"><b>${getWinRate(stats)}%</b><span>${copy.winRate}</span></div>
      </div>
    `;
  }

  function getHumanPlacement() {
    const ranking = [...state.players]
      .map((player) => ({ player, total: calculateMatchTotal(player.id) }))
      .sort((first, second) => second.total - first.total);

    return ranking.findIndex((item) => item.player.id === "human") + 1;
  }

  function getAwardFingerprint() {
    const totals = state.players.map((player) => `${player.id}:${calculateMatchTotal(player.id)}`).join("|");
    return `${state.currentPulka}-${state.currentGame}-${state.winnerId || ""}-${totals}`;
  }

  function readLastAwardFingerprint() {
    try {
      return window.sessionStorage.getItem(AWARD_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveLastAwardFingerprint(value) {
    try {
      window.sessionStorage.setItem(AWARD_KEY, value);
    } catch {
      // Duplicate protection is best-effort.
    }
  }

  function awardRatingOnce() {
    const fingerprint = getAwardFingerprint();

    if (readLastAwardFingerprint() === fingerprint) {
      return null;
    }

    saveLastAwardFingerprint(fingerprint);

    const place = Math.max(1, getHumanPlacement());
    const delta = PLACE_POINTS[place - 1] ?? -20;
    const before = readStats();
    const rating = Math.max(0, before.rating + delta);
    const nextStats = {
      ...before,
      rating,
      games: before.games + 1,
      wins: before.wins + (place === 1 ? 1 : 0),
      podiums: before.podiums + (place <= 3 ? 1 : 0),
      bestRating: Math.max(before.bestRating || 0, rating),
      updatedAt: Date.now(),
    };

    saveStats(nextStats);
    renderRatingCard();

    return { place, delta, before, after: nextStats };
  }

  function createRatingResultCard(result) {
    const copy = getCopy();
    const league = getLeague(result.after.rating);
    const next = getNextLeague(result.after.rating);
    const sign = result.delta > 0 ? "+" : "";

    const card = document.createElement("div");
    card.className = "rating-result-card";
    card.innerHTML = `
      <div class="rating-result-badge">${league.emoji}</div>
      <div>
        <div class="rating-result-title">${copy.result} · ${getLeagueName(league)}</div>
        <div class="rating-result-detail">
          ${copy.placement}: #${result.place} · ${result.after.rating} ${copy.points}${next ? ` · ${copy.next}: ${Math.max(0, next.min - result.after.rating)}` : ` · ${copy.max}`}
        </div>
      </div>
      <div class="rating-result-delta ${result.delta >= 0 ? "is-positive" : "is-negative"}">${sign}${result.delta}</div>
    `;

    return card;
  }

  const originalShowEndGameDialog = window.showEndGameDialog;
  if (typeof originalShowEndGameDialog === "function") {
    window.showEndGameDialog = function showEndGameDialogWithRating(winner) {
      const result = originalShowEndGameDialog.apply(this, arguments);
      document.querySelector(".rating-result-card")?.remove();

      const award = awardRatingOnce();
      if (award && elements?.gameDialogActions) {
        elements.gameDialogActions.before(createRatingResultCard(award));
      }

      return result;
    };
  }

  window.addEventListener("joker-language-change", renderRatingCard);
  window.JokerRating = {
    readStats,
    render: renderRatingCard,
    reset() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      renderRatingCard();
    },
  };

  renderRatingCard();
})();

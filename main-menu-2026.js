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

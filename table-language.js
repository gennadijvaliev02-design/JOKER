(() => {
  const texts = {
    ru: {
      yourTurn: "ТВОЙ ХОД",
      trump: "Козырь",
      trumpWaiting: "Козырь: ждём раздачу",
      bid: "Заказ",
      score: "счет",
      scoreCap: "Счёт",
      you: "Ты",
      thinking: "думает",
      bidThinking: "думает над заказом...",
      push: "пихается",
      take: "отнимается",
      game: "Игра",
      pulka: "пулька",
      pulkaCap: "Пулька",
      finished: "Партия завершена",
      chooseTrump: "Выбери козырь",
      thinksTrump: "думает над козырем...",
      yourBid: "Твой заказ",
      jokerCommand: "Команда джокера",
      jokerQuestion: "Как сыграть джокером?",
      joker: "Джокер",
      takeButton: "Берет",
      highButton: "Высший",
      takeSuit: "Берет масть",
      duckButton: "Подсунуть",
      beatButton: "Перебить",
      noTrump: "Безка",
      pass: "Пас",
      mustFollowSuit: "Нужно ходить в масть",
      mustThrowTrump: "Масти нет — нужно кинуть козырь",
      completed: "завершена",
      newDeal: "Новая раздача",
      winner: "Победитель",
      exitQuestion: "Выйти из партии?",
      continue: "Продолжить",
      toMenu: "В меню",
      mainMenu: "Главное меню",
      newGame: "Новая партия",
    },
    en: {
      yourTurn: "YOUR TURN",
      trump: "Trump",
      trumpWaiting: "Trump: waiting for deal",
      bid: "Bid",
      score: "score",
      scoreCap: "Score",
      you: "You",
      thinking: "is thinking",
      bidThinking: "is thinking about the bid...",
      push: "push",
      take: "take away",
      game: "Game",
      pulka: "bullet",
      pulkaCap: "Bullet",
      finished: "Match finished",
      chooseTrump: "Choose trump",
      thinksTrump: "is choosing trump...",
      yourBid: "Your bid",
      jokerCommand: "Joker command",
      jokerQuestion: "How to play the Joker?",
      joker: "Joker",
      takeButton: "Take",
      highButton: "High",
      takeSuit: "Take suit",
      duckButton: "Duck",
      beatButton: "Beat",
      noTrump: "No trump",
      pass: "Pass",
      mustFollowSuit: "You must follow suit",
      mustThrowTrump: "No suit — you must play trump",
      completed: "finished",
      newDeal: "New deal",
      winner: "Winner",
      exitQuestion: "Leave the match?",
      continue: "Continue",
      toMenu: "To menu",
      mainMenu: "Main menu",
      newGame: "New game",
    },
  };

  function getLang() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function t() {
    return texts[getLang()] || texts.ru;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function translateMessage(text, copy) {
    if (!text) return text;

    return text
      .replace(/^Выбери козырь$/i, copy.chooseTrump)
      .replace(/^Choose trump$/i, copy.chooseTrump)
      .replace(/^Твой заказ$/i, copy.yourBid)
      .replace(/^Your bid$/i, copy.yourBid)
      .replace(/^Команда джокера$/i, copy.jokerCommand)
      .replace(/^Joker command$/i, copy.jokerCommand)
      .replace(/^Как сыграть джокером\?$/i, copy.jokerQuestion)
      .replace(/^How to play the Joker\?$/i, copy.jokerQuestion)
      .replace(/^(.+) думает над козырем\.\.\.$/i, `$1 ${copy.thinksTrump}`)
      .replace(/^(.+) is choosing trump\.\.\.$/i, `$1 ${copy.thinksTrump}`)
      .replace(/^(.+) думает над заказом\.\.\.$/i, `$1 ${copy.bidThinking}`)
      .replace(/^(.+) is thinking about the bid\.\.\.$/i, `$1 ${copy.bidThinking}`)
      .replace(/^(.+) думает$/i, `$1 ${copy.thinking}`)
      .replace(/^(.+) is thinking$/i, `$1 ${copy.thinking}`)
      .replace(/^Нужно ходить в масть$/i, copy.mustFollowSuit)
      .replace(/^You must follow suit$/i, copy.mustFollowSuit)
      .replace(/^Масти нет — нужно кинуть козырь$/i, copy.mustThrowTrump)
      .replace(/^No suit — you must play trump$/i, copy.mustThrowTrump)
      .replace(/^Игра\s+(\d+)\s+завершена$/i, `${copy.game} $1 ${copy.completed}`)
      .replace(/^Game\s+(\d+)\s+finished$/i, `${copy.game} $1 ${copy.completed}`)
      .replace(/^Пулька\s+(\d+)\.\s+Игра\s+(\d+)\.\s+Новая раздача$/i, `${copy.pulkaCap} $1. ${copy.game} $2. ${copy.newDeal}`)
      .replace(/^Bullet\s+(\d+)\.\s+Game\s+(\d+)\.\s+New deal$/i, `${copy.pulkaCap} $1. ${copy.game} $2. ${copy.newDeal}`)
      .replace(/^Игра\s+(\d+)\.\s+Новая раздача$/i, `${copy.game} $1. ${copy.newDeal}`)
      .replace(/^Game\s+(\d+)\.\s+New deal$/i, `${copy.game} $1. ${copy.newDeal}`)
      .replace(/^Партия завершена\. Победитель:\s+(.+)$/i, `${copy.finished}. ${copy.winner}: $1`)
      .replace(/^Match finished\. Winner:\s+(.+)$/i, `${copy.finished}. ${copy.winner}: $1`)
      .replace(/^Выйти из партии\?$/i, copy.exitQuestion)
      .replace(/^Leave the match\?$/i, copy.exitQuestion)
      .replace(/^Победитель:\s+(.+)$/i, `${copy.winner}: $1`)
      .replace(/^Winner:\s+(.+)$/i, `${copy.winner}: $1`);
  }

  function translatePanelText(text, copy) {
    return translateMessage(text, copy)
      .replace(/^Заказ$/i, copy.bid)
      .replace(/^Bid$/i, copy.bid)
      .replace(/^Козырь$/i, copy.trump)
      .replace(/^Trump$/i, copy.trump)
      .replace(/^Джокер$/i, copy.joker)
      .replace(/^Joker$/i, copy.joker)
      .replace(/^Безка$/i, copy.noTrump)
      .replace(/^No trump$/i, copy.noTrump)
      .replace(/^Пас$/i, copy.pass)
      .replace(/^Pass$/i, copy.pass)
      .replace(/^Берет$/i, copy.takeButton)
      .replace(/^Take$/i, copy.takeButton)
      .replace(/^Высший$/i, copy.highButton)
      .replace(/^High$/i, copy.highButton)
      .replace(/^Берет масть$/i, copy.takeSuit)
      .replace(/^Take suit$/i, copy.takeSuit)
      .replace(/^Подсунуть$/i, copy.duckButton)
      .replace(/^Duck$/i, copy.duckButton)
      .replace(/^Перебить$/i, copy.beatButton)
      .replace(/^Beat$/i, copy.beatButton);
  }

  function translatePlayerNames(copy) {
    document.querySelectorAll("[data-name]").forEach((name) => {
      if (name.dataset.name === "bottom" || name.textContent === "Ты" || name.textContent === "You") {
        name.textContent = copy.you;
      }
    });
  }

  function translateThinkingBadges(copy) {
    document.querySelectorAll(".player.is-thinking .name").forEach((name) => {
      const base = name.dataset.name === "bottom" ? copy.you : name.textContent.replace(/\s+(думает|is thinking)$/i, "");
      name.textContent = `${base} ${copy.thinking}`;
    });
  }

  function translateTrumpLabel(copy) {
    const label = document.getElementById("trump-label");
    if (!label) return;

    if (!label.dataset.trumpKey) {
      label.textContent = translateMessage(label.textContent, copy).replace(/^Козырь$/i, copy.trump).replace(/^Trump$/i, copy.trump);
      return;
    }

    const firstText = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (firstText) {
      firstText.textContent = copy.trump;
    }
  }

  function translateBidPanel(copy) {
    const title = document.querySelector(".bid-title");
    if (title) {
      title.textContent = translatePanelText(title.textContent, copy);
    }

    document.querySelectorAll(".bid-option").forEach((button) => {
      button.textContent = translatePanelText(button.textContent, copy);
    });
  }

  function translateRoundBalance(copy) {
    const label = document.getElementById("round-label");
    if (!label || label.hidden) return;

    label.textContent = label.textContent
      .replace(/^пихается\s+(\d+)/i, `${copy.push} $1`)
      .replace(/^отнимается\s+(\d+)/i, `${copy.take} $1`)
      .replace(/^push\s+(\d+)/i, `${copy.push} $1`)
      .replace(/^take away\s+(\d+)/i, `${copy.take} $1`);
  }

  function translatePlayedLabels(copy) {
    document.querySelectorAll(".played-label").forEach((label) => {
      label.textContent = label.textContent.replace(/^Ты/, copy.you).replace(/^You/, copy.you);
    });
  }

  function translateSummary(copy) {
    document.querySelectorAll(".summary-title").forEach((title) => {
      title.textContent = title.textContent
        .replace(/^Игра\s+(\d+)\s+·\s+пулька\s+(\d+)/i, `${copy.game} $1 · ${copy.pulka} $2`)
        .replace(/^Game\s+(\d+)\s+·\s+bullet\s+(\d+)/i, `${copy.game} $1 · ${copy.pulka} $2`);
    });

    document.querySelectorAll(".summary-name").forEach((name) => {
      if (name.textContent === "Ты" || name.textContent === "You") {
        name.textContent = copy.you;
      }
    });
  }

  function translateDialog(copy) {
    const dialogTitle = document.getElementById("game-dialog-title");
    if (dialogTitle && dialogTitle.children.length === 0) {
      dialogTitle.textContent = translateMessage(dialogTitle.textContent, copy);
    }

    document.querySelectorAll(".dialog-action").forEach((button) => {
      button.textContent = button.textContent
        .replace(/^Продолжить$/i, copy.continue)
        .replace(/^Continue$/i, copy.continue)
        .replace(/^В меню$/i, copy.toMenu)
        .replace(/^To menu$/i, copy.toMenu)
        .replace(/^Главное меню$/i, copy.mainMenu)
        .replace(/^Main menu$/i, copy.mainMenu)
        .replace(/^Новая партия$/i, copy.newGame)
        .replace(/^New game$/i, copy.newGame);
    });
  }

  function translateScoreSheet(copy) {
    setText(".sheet-title", copy.scoreCap);
  }

  function applyTableLanguage() {
    const copy = t();

    setText(".turn-pill", copy.yourTurn);
    setText("#score-button", copy.score);

    const notice = document.getElementById("table-notice");
    if (notice && !notice.hidden) {
      notice.textContent = translateMessage(notice.textContent, copy);
    }

    translatePlayerNames(copy);
    translateThinkingBadges(copy);
    translateTrumpLabel(copy);
    translateBidPanel(copy);
    translateRoundBalance(copy);
    translatePlayedLabels(copy);
    translateSummary(copy);
    translateDialog(copy);
    translateScoreSheet(copy);
  }

  const originalRender = window.render;
  if (typeof originalRender === "function") {
    window.render = function translatedRender(...args) {
      const result = originalRender.apply(this, args);
      applyTableLanguage();
      return result;
    };
  }

  const originalShowNotice = window.showNotice;
  if (typeof originalShowNotice === "function") {
    window.showNotice = function translatedShowNotice(message) {
      return originalShowNotice.call(this, translateMessage(message, t()));
    };
  }

  const originalCreateDialogButton = window.createDialogButton;
  if (typeof originalCreateDialogButton === "function") {
    window.createDialogButton = function translatedCreateDialogButton(text, variant, onClick) {
      const copy = t();
      const translated = translatePanelText(text, copy)
        .replace(/^Продолжить$/i, copy.continue)
        .replace(/^В меню$/i, copy.toMenu)
        .replace(/^Главное меню$/i, copy.mainMenu)
        .replace(/^Новая партия$/i, copy.newGame);
      return originalCreateDialogButton.call(this, translated, variant, onClick);
    };
  }

  window.addEventListener("joker-language-change", applyTableLanguage);
  window.JokerApplyTableLanguage = applyTableLanguage;
  window.JokerTranslateTableMessage = (message) => translateMessage(message, t());
  applyTableLanguage();
})();

(() => {
  const texts = {
    ru: {
      yourTurn: "ТВОЙ ХОД",
      trump: "Козырь",
      trumpWaiting: "Козырь: ждём раздачу",
      bid: "Заказ",
      score: "счет",
      you: "Ты",
      push: "пихается",
      take: "отнимается",
      game: "Игра",
      pulka: "пулька",
      pulkaCap: "Пулька",
      finished: "Партия завершена",
    },
    en: {
      yourTurn: "YOUR TURN",
      trump: "Trump",
      trumpWaiting: "Trump: waiting for deal",
      bid: "Bid",
      score: "score",
      you: "You",
      push: "push",
      take: "take away",
      game: "Game",
      pulka: "bullet",
      pulkaCap: "Bullet",
      finished: "Match finished",
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

  function translateTrumpLabel(copy) {
    const label = document.getElementById("trump-label");
    if (!label) return;

    if (!label.dataset.trumpKey) {
      label.textContent = copy.trump;
      return;
    }

    const firstText = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (firstText) {
      firstText.textContent = copy.trump;
    }
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

  function applyTableLanguage() {
    const copy = t();

    setText(".turn-pill", copy.yourTurn);
    setText(".bid-title", copy.bid);
    setText("#score-button", copy.score);

    const dialogTitle = document.getElementById("game-dialog-title");
    if (dialogTitle && (dialogTitle.textContent === "Партия завершена" || dialogTitle.textContent === "Match finished")) {
      dialogTitle.textContent = copy.finished;
    }

    translateTrumpLabel(copy);
    translateRoundBalance(copy);
    translatePlayedLabels(copy);
    translateSummary(copy);
  }

  const originalRender = window.render;
  if (typeof originalRender === "function") {
    window.render = function translatedRender(...args) {
      const result = originalRender.apply(this, args);
      applyTableLanguage();
      return result;
    };
  }

  window.addEventListener("joker-language-change", applyTableLanguage);
  window.JokerApplyTableLanguage = applyTableLanguage;
  applyTableLanguage();
})();

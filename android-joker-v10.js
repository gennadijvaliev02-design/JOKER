(() => {
  "use strict";

  const JOKER_PHASES = new Set([
    "joker-lead-command",
    "joker-lead-suit",
    "joker-mode",
  ]);

  function clearJokerPanelClasses() {
    elements.bidPanel?.classList.remove(
      "is-android-joker-panel",
      "is-joker-command-panel",
      "is-joker-suit-panel",
      "is-joker-mode-panel",
    );
  }

  function ensureCancelButton() {
    if (!elements.bidPanel) return null;

    let button = elements.bidPanel.querySelector("[data-joker-cancel]");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "android-joker-cancel";
      button.dataset.jokerCancel = "true";
      button.setAttribute("aria-label", "Отменить выбор джокера");
      button.textContent = "×";
      elements.bidPanel.append(button);
    }

    return button;
  }

  function prepareJokerPanel(mode, title) {
    if (!elements.bidPanel || !elements.bidTitle || !elements.bidOptions) return;

    clearJokerPanelClasses();
    elements.bidPanel.classList.add("is-android-joker-panel", `is-joker-${mode}-panel`);
    elements.bidPanel.hidden = false;
    elements.bidTitle.textContent = title;
    ensureCancelButton()?.removeAttribute("hidden");
  }

  function makeCommandButton(command, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bid-option android-joker-command-option is-${command}`;
    button.dataset.jokerLeadCommand = command;
    button.textContent = label;
    return button;
  }

  function makeModeButton(mode, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bid-option android-joker-mode-option is-${mode}`;
    button.dataset.jokerMode = mode;
    button.textContent = label;
    return button;
  }

  function makeSuitButton(suit) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bid-option android-joker-suit-option is-${suit.color}`;
    button.dataset.jokerLeadSuit = suit.id;
    button.setAttribute("aria-label", suit.name);

    const symbol = document.createElement("span");
    symbol.className = "android-joker-suit-symbol";
    symbol.textContent = suit.symbol;

    const label = document.createElement("span");
    label.className = "android-joker-suit-name";
    label.textContent = suit.name;

    button.append(symbol, label);
    return button;
  }

  renderLeadJokerCommandSelection = function renderAndroidLeadJokerCommandSelection() {
    prepareJokerPanel("command", "Команда джокера");
    elements.bidOptions.replaceChildren(
      makeCommandButton("take", "Берёт"),
      makeCommandButton("high", "Высший"),
    );
  };

  renderLeadJokerSuitSelection = function renderAndroidLeadJokerSuitSelection() {
    const isTake = state.pendingJokerCommand === "take";
    prepareJokerPanel("suit", isTake ? "Берёт масть" : "Высший");

    const suitButtons = FIXED_TRUMP_BY_GAME
      .map((suitId) => SUITS.find((suit) => suit.id === suitId))
      .filter(Boolean)
      .map(makeSuitButton);

    elements.bidOptions.replaceChildren(...suitButtons);
  };

  renderJokerModeSelection = function renderAndroidJokerModeSelection() {
    prepareJokerPanel("mode", "Как сыграть джокером?");
    elements.bidOptions.replaceChildren(
      makeModeButton("duck", "Подсунуть"),
      makeModeButton("beat", "Перебить"),
    );
  };

  function cancelJokerChoice() {
    if (!JOKER_PHASES.has(state.phase)) return;

    state.pendingJokerCardId = null;
    state.pendingJokerCommand = null;
    state.phase = "playing";
    state.busy = false;
    elements.bidPanel.hidden = true;
    elements.bidOptions.replaceChildren();
    clearJokerPanelClasses();
    ensureCancelButton()?.setAttribute("hidden", "");
    hideNotice();
    render();
  }

  elements.bidPanel?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest("[data-joker-cancel]")) return;

    event.preventDefault();
    event.stopPropagation();
    cancelJokerChoice();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && JOKER_PHASES.has(state.phase)) cancelJokerChoice();
  });

  window.AndroidJokerPanel = {
    clearClasses: clearJokerPanelClasses,
    hideCancel() {
      ensureCancelButton()?.setAttribute("hidden", "");
    },
  };
})();

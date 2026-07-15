from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)


def replace_section(text, start_marker, end_marker, new_block, label):
    if text.count(start_marker) != 1 or text.count(end_marker) != 1:
        raise SystemExit(f"{label}: marker mismatch")
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + new_block.rstrip() + "\n\n" + text[end:]


script_path = Path("script.js")
script = script_path.read_text(encoding="utf-8")

new_bidding = r'''const bidPanelNodesByKey = new Map();

function createBidPanelButton(datasetName, datasetValue, text, className = "bid-option") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset[datasetName] = String(datasetValue);
  button.textContent = text;
  return button;
}

function getCachedBidPanelNodes(key, factory) {
  let nodes = bidPanelNodesByKey.get(key);
  if (!nodes) {
    nodes = factory();
    bidPanelNodesByKey.set(key, nodes);
  }
  return nodes;
}

function syncBidPanelNodes(nodes) {
  const current = elements.bidOptions.children;
  let matches = current.length === nodes.length;

  for (let index = 0; matches && index < nodes.length; index += 1) {
    matches = current[index] === nodes[index];
  }

  if (matches) return false;
  elements.bidOptions.replaceChildren(...nodes);
  return true;
}

function renderBidding() {
  if (state.phase === "joker-lead-command" && state.activePlayerId === "human") {
    renderLeadJokerCommandSelection();
    return;
  }

  if (state.phase === "joker-lead-suit" && state.activePlayerId === "human") {
    renderLeadJokerSuitSelection();
    return;
  }

  if (state.phase === "joker-mode" && state.activePlayerId === "human") {
    renderJokerModeSelection();
    return;
  }

  if (state.phase === "trump-select" && state.trumpChooserId === "human") {
    renderTrumpSelection();
    return;
  }

  elements.bidPanel.hidden = state.phase !== "bidding" || getCurrentBidderId() !== "human";

  if (elements.bidPanel.hidden) {
    if (elements.bidOptions.childElementCount) elements.bidOptions.replaceChildren();
    return;
  }

  setElementText(elements.bidTitle, "Заказ");
  const currentBidTotal = getOrderedBidTotal();
  const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;
  const buttons = getCachedBidPanelNodes("base-order:9", () =>
    BID_OPTIONS.map((bid) => createBidPanelButton("bid", bid, bid === "pass" ? "Пас" : String(bid))),
  );

  for (const button of buttons) {
    const bidValue = button.dataset.bid === "pass" ? 0 : Number(button.dataset.bid);
    const isForbidden = isLastBidder && currentBidTotal + bidValue === 9;
    button.disabled = isForbidden;
    button.classList.toggle("is-forbidden", isForbidden);
  }

  syncBidPanelNodes(buttons);
}'''
script = replace_section(
    script,
    "function renderBidding() {",
    "function renderEmotionPanel() {",
    new_bidding,
    "base bidding panel",
)

new_static_panels = r'''function renderTrumpSelection() {
  elements.bidPanel.hidden = false;
  setElementText(elements.bidTitle, "Козырь");

  const buttons = getCachedBidPanelNodes("base-trump", () => {
    const nodes = FIXED_TRUMP_BY_GAME.map((suitId) => {
      const suit = SUITS.find((item) => item.id === suitId);
      return createBidPanelButton("trump", suit.id, suit.symbol);
    });
    nodes.push(createBidPanelButton("trump", "no-trump", "Безка"));
    return nodes;
  });

  syncBidPanelNodes(buttons);
}

function renderJokerModeSelection() {
  elements.bidPanel.hidden = false;
  setElementText(elements.bidTitle, "Джокер");

  const buttons = getCachedBidPanelNodes("base-joker-mode", () => [
    createBidPanelButton("jokerMode", "duck", "Подсунуть", "bid-option joker-duck-option"),
    createBidPanelButton("jokerMode", "beat", "Перебить", "bid-option joker-beat-option"),
  ]);

  syncBidPanelNodes(buttons);
}

function renderLeadJokerCommandSelection() {
  elements.bidPanel.hidden = false;
  setElementText(elements.bidTitle, "Джокер");

  const buttons = getCachedBidPanelNodes("base-joker-command", () => [
    createBidPanelButton("jokerLeadCommand", "take", "Берет", "bid-option joker-take-option"),
    createBidPanelButton("jokerLeadCommand", "high", "Высший", "bid-option joker-high-option"),
  ]);

  syncBidPanelNodes(buttons);
}

function renderLeadJokerSuitSelection() {
  elements.bidPanel.hidden = false;
  setElementText(elements.bidTitle, state.pendingJokerCommand === "take" ? "Берет масть" : "Высший");

  const buttons = getCachedBidPanelNodes("base-joker-suit", () =>
    FIXED_TRUMP_BY_GAME.map((suitId) => {
      const suit = SUITS.find((item) => item.id === suitId);
      return createBidPanelButton("jokerLeadSuit", suit.id, suit.symbol);
    }),
  );

  syncBidPanelNodes(buttons);
}'''
script = replace_section(
    script,
    "function renderTrumpSelection() {",
    "function getOrderedBidTotal() {",
    new_static_panels,
    "static bid panels",
)
script_path.write_text(script, encoding="utf-8")


rules_path = Path("rules/rules-hand-size-adapter.js")
rules = rules_path.read_text(encoding="utf-8")
new_rules_bidding = r'''  renderBidding = function renderBiddingFromRules() {
    if (state.phase === "joker-lead-command" && state.activePlayerId === "human") {
      renderLeadJokerCommandSelection();
      return;
    }

    if (state.phase === "joker-lead-suit" && state.activePlayerId === "human") {
      renderLeadJokerSuitSelection();
      return;
    }

    if (state.phase === "joker-mode" && state.activePlayerId === "human") {
      renderJokerModeSelection();
      return;
    }

    if (state.phase === "trump-select" && state.trumpChooserId === "human") {
      renderTrumpSelection();
      return;
    }

    elements.bidPanel.hidden = state.phase !== "bidding" || getCurrentBidderId() !== "human";

    if (elements.bidPanel.hidden) {
      if (elements.bidOptions.childElementCount) elements.bidOptions.replaceChildren();
      return;
    }

    setElementText(elements.bidTitle, "Заказ");
    const handSize = getCurrentHandSize();
    const currentBidTotal = getOrderedBidTotal();
    const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;
    const buttons = getCachedBidPanelNodes(`rules-order:${handSize}`, () => {
      const nodes = [];
      for (const bid of BID_OPTIONS) {
        if (bid === "pass" || bid <= handSize) {
          nodes.push(createBidPanelButton("bid", bid, bid === "pass" ? "Пас" : String(bid)));
        }
      }
      return nodes;
    });

    for (const button of buttons) {
      const bidValue = button.dataset.bid === "pass" ? 0 : Number(button.dataset.bid);
      const isForbidden = isLastBidder && currentBidTotal + bidValue === handSize;
      button.disabled = isForbidden;
      button.classList.toggle("is-forbidden", isForbidden);
    }

    syncBidPanelNodes(buttons);
  };'''
rules = replace_section(
    rules,
    "  renderBidding = function renderBiddingFromRules() {",
    "  isBidAllowedForCurrentTurn = function isBidAllowedForCurrentRules(bid) {",
    new_rules_bidding,
    "rules bidding panel",
)
rules_path.write_text(rules, encoding="utf-8")


joker_path = Path("android-joker-v10.js")
joker = joker_path.read_text(encoding="utf-8")
joker = replace_once(
    joker,
    '    elements.bidTitle.textContent = title;',
    '    setElementText(elements.bidTitle, title);',
    "joker panel title",
)
new_android_joker_panels = r'''  renderLeadJokerCommandSelection = function renderAndroidLeadJokerCommandSelection() {
    prepareJokerPanel("command", "Команда джокера");
    const buttons = getCachedBidPanelNodes("android-joker-command", () => [
      makeCommandButton("take", "Берёт"),
      makeCommandButton("high", "Высший"),
    ]);
    syncBidPanelNodes(buttons);
  };

  renderLeadJokerSuitSelection = function renderAndroidLeadJokerSuitSelection() {
    const isTake = state.pendingJokerCommand === "take";
    prepareJokerPanel("suit", isTake ? "Берёт масть" : "Высший");

    const buttons = getCachedBidPanelNodes("android-joker-suit", () =>
      FIXED_TRUMP_BY_GAME
        .map((suitId) => SUITS.find((suit) => suit.id === suitId))
        .filter(Boolean)
        .map(makeSuitButton),
    );
    syncBidPanelNodes(buttons);
  };

  renderJokerModeSelection = function renderAndroidJokerModeSelection() {
    prepareJokerPanel("mode", "Как сыграть джокером?");
    const buttons = getCachedBidPanelNodes("android-joker-mode", () => [
      makeModeButton("duck", "Подсунуть"),
      makeModeButton("beat", "Перебить"),
    ]);
    syncBidPanelNodes(buttons);
  };'''
joker = replace_section(
    joker,
    "  renderLeadJokerCommandSelection = function renderAndroidLeadJokerCommandSelection() {",
    "  function cancelJokerChoice() {",
    new_android_joker_panels,
    "Android joker panels",
)
joker = replace_once(
    joker,
    '    elements.bidOptions.replaceChildren();',
    '    if (elements.bidOptions.childElementCount) elements.bidOptions.replaceChildren();',
    "joker cancel clear",
)
joker_path.write_text(joker, encoding="utf-8")


v12_path = Path("android-v12.js")
v12 = v12_path.read_text(encoding="utf-8")
v12 = replace_once(
    v12,
    '      return `order:${state.biddingIndex}:${state.biddingOrder.length}:${getOrderedBidTotal?.() ?? ""}`;',
    '''      const handSize = Number(window.JokerRules?.getHandSize?.(state.currentPulka, state.currentGame))
        || Number(state.currentHandSize)
        || Number(state.hands?.human?.length)
        || 9;
      const rulesId = window.JokerRules?.activeId || "rules";
      return `order:${rulesId}:${state.currentPulka}:${state.currentGame}:${handSize}:${state.biddingIndex}:${state.biddingOrder.length}:${getOrderedBidTotal?.() ?? ""}`;''',
    "Android order panel key",
)
v12_path.write_text(v12, encoding="utf-8")

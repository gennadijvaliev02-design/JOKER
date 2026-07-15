from pathlib import Path
import re


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


owners = {
    "renderHud": [],
    "renderEmotionPanel": [],
    "showPlayerEmotion": [],
}
for path in Path(".").rglob("*.js"):
    if any(part in {".git", "node_modules", "www", "android"} for part in path.parts):
        continue
    source = path.read_text(encoding="utf-8")
    for symbol in owners:
        if path.name != "script.js" and re.search(rf"\b{symbol}\s*=", source):
            owners[symbol].append(str(path))

expected = {
    "renderHud": ["android-runtime-v2.js"],
    "renderEmotionPanel": ["game-emotions.js"],
    "showPlayerEmotion": ["game-emotions.js"],
}
if owners != expected:
    raise SystemExit(f"Unexpected HUD/emotion owners: {owners}")


script_path = Path("script.js")
script = script_path.read_text(encoding="utf-8")
script = replace_once(
    script,
    '''let lastHandRenderSignature = null;
let lastTrickRenderSignature = null;
let trickRenderLanguageVersion = 0;''',
    '''let lastHandRenderSignature = null;
let lastTrickRenderSignature = null;
let trickRenderLanguageVersion = 0;
let lastHudRoundSignature = null;
let lastHudTrumpRenderKey = null;
let baseEmotionButtons = null;
let emotionCooldownTimerId = 0;''',
    "shared render cache state",
)

new_hud = r'''function getHudRenderState() {
  const chooser = getPlayerById(state.trumpChooserId);
  const bidBalance = getBidBalance();
  const roundSignature = bidBalance ? `${bidBalance.type}:${bidBalance.text}` : "hidden";

  if (!state.trump) {
    const chooserText = state.phase === "trump-select" && chooser
      ? ` · ${chooser.seat === "bottom" ? "ты" : chooser.name}`
      : "";
    const label = state.phase === "trump-select" ? `Козырь${chooserText}` : "Козырь";
    return {
      bidBalance,
      roundSignature,
      trumpKey: "",
      renderKey: `empty:${label}`,
      label,
    };
  }

  const trumpKey = getTrumpRenderKey(state.trump);
  return {
    bidBalance,
    roundSignature,
    trumpKey,
    renderKey: `trump:${trumpKey}`,
    label: "Козырь",
  };
}

function renderHud() {
  const hud = getHudRenderState();

  if (hud.roundSignature !== lastHudRoundSignature) {
    elements.roundLabel.hidden = !hud.bidBalance;
    setElementText(elements.roundLabel, hud.bidBalance?.text || "");
    elements.roundLabel.classList.toggle("is-push", hud.bidBalance?.type === "push");
    elements.roundLabel.classList.toggle("is-take", hud.bidBalance?.type === "take");
    lastHudRoundSignature = hud.roundSignature;
  }

  if (!state.trump) {
    if (hud.renderKey !== lastHudTrumpRenderKey || elements.trumpLabel.dataset.trumpKey !== "") {
      setElementText(elements.trumpLabel, hud.label);
      elements.trumpLabel.dataset.trumpKey = "";
      lastHudTrumpRenderKey = hud.renderKey;
    }
    return;
  }

  const hasRenderedCard = Boolean(elements.trumpLabel.querySelector(".trump-card"));
  if (
    hud.renderKey !== lastHudTrumpRenderKey
    || elements.trumpLabel.dataset.trumpKey !== hud.trumpKey
    || !hasRenderedCard
  ) {
    const shouldReveal = elements.trumpLabel.dataset.trumpKey !== hud.trumpKey;
    elements.trumpLabel.dataset.trumpKey = hud.trumpKey;
    elements.trumpLabel.replaceChildren("Козырь", createTrumpCardElement(state.trump, shouldReveal));
    lastHudTrumpRenderKey = hud.renderKey;
  }
}'''
script = replace_section(
    script,
    "function renderHud() {",
    "function getBidBalance() {",
    new_hud,
    "base HUD cache",
)

new_base_emotion_panel = r'''function renderEmotionPanel() {
  if (!baseEmotionButtons) {
    baseEmotionButtons = EMOTIONS.map((emotion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "emotion-option";
      button.dataset.emotion = emotion;
      button.textContent = emotion;
      return button;
    });
  }

  const current = elements.emotionPanel.children;
  let matches = current.length === baseEmotionButtons.length;
  for (let index = 0; matches && index < baseEmotionButtons.length; index += 1) {
    matches = current[index] === baseEmotionButtons[index];
  }
  if (!matches) elements.emotionPanel.replaceChildren(...baseEmotionButtons);
}'''
script = replace_section(
    script,
    "function renderEmotionPanel() {",
    "function toggleEmotionPanel() {",
    new_base_emotion_panel,
    "base emotion panel cache",
)

script = replace_once(
    script,
    '''function showPlayerEmotion(seat, emotion) {
  const avatar = document.querySelector(`[data-seat="${seat}"]`);

  if (!avatar) {
    return;
  }

  avatar.querySelector(".avatar-emotion")?.remove();

  const bubble = document.createElement("span");
  bubble.className = "avatar-emotion";
  bubble.textContent = emotion;
  avatar.append(bubble);

  if (state.emotionTimeoutId) {
    window.clearTimeout(state.emotionTimeoutId);
  }

  state.emotionTimeoutId = window.setTimeout(() => {
    bubble.remove();
    state.emotionTimeoutId = null;
  }, 3000);
}''',
    '''function showPlayerEmotion(seat, emotion) {
  const avatar = playerViewsBySeat[seat]?.avatar || null;
  if (!avatar) return;

  avatar.querySelector(":scope > .avatar-emotion")?.remove();

  const bubble = document.createElement("span");
  bubble.className = "avatar-emotion";
  setElementText(bubble, emotion);
  avatar.append(bubble);

  if (state.emotionTimeoutId) window.clearTimeout(state.emotionTimeoutId);
  state.emotionTimeoutId = window.setTimeout(() => {
    bubble.remove();
    state.emotionTimeoutId = null;
  }, 3000);
}''',
    "base emotion avatar cache",
)

script = replace_once(
    script,
    '''function startEmotionCooldown() {
  state.emotionCooldownUntil = Date.now() + 3000;
  elements.emotionButton.disabled = true;
  window.setTimeout(() => {
    elements.emotionButton.disabled = false;
  }, 3000);
}''',
    '''function startEmotionCooldown() {
  state.emotionCooldownUntil = Date.now() + 3000;
  if (!elements.emotionButton.disabled) elements.emotionButton.disabled = true;
  if (emotionCooldownTimerId) window.clearTimeout(emotionCooldownTimerId);
  emotionCooldownTimerId = window.setTimeout(() => {
    emotionCooldownTimerId = 0;
    if (Date.now() >= state.emotionCooldownUntil) elements.emotionButton.disabled = false;
  }, 3000);
}''',
    "emotion cooldown timer",
)

script = replace_once(
    script,
    '''function showNotice(text) {
  elements.tableNotice.textContent = text;
  elements.tableNotice.hidden = false;
}

function hideNotice() {
  elements.tableNotice.hidden = true;
}''',
    '''function showNotice(text) {
  setElementText(elements.tableNotice, text);
  if (elements.tableNotice.hidden) elements.tableNotice.hidden = false;
}

function hideNotice() {
  if (!elements.tableNotice.hidden) elements.tableNotice.hidden = true;
}''',
    "notice no-op writes",
)
script_path.write_text(script, encoding="utf-8")


runtime_path = Path("android-runtime-v2.js")
runtime = runtime_path.read_text(encoding="utf-8")
runtime = replace_once(
    runtime,
    '''  let lastTrumpRenderKey = null;
  let lastRoundSignature = null;
  let lastTrickSignature = null;
  let selectedCard = null;''',
    '''  let lastTrumpRenderKey = null;
  let lastRoundSignature = null;
  let lastHudClassSignature = null;
  let lastTrickSignature = null;
  let selectedCard = null;
  const setText = typeof setElementText === "function"
    ? setElementText
    : (node, value) => {
        if (node && node.textContent !== value) node.textContent = value;
      };''',
    "Android HUD cache state",
)

new_android_hud = r'''  function getAndroidHudState() {
    if (typeof getHudRenderState === "function") return getHudRenderState();

    const chooser = getPlayerById(state.trumpChooserId);
    const bidBalance = getBidBalance();
    const roundSignature = bidBalance ? `${bidBalance.type}:${bidBalance.text}` : "hidden";
    if (!state.trump) {
      const chooserText = state.phase === "trump-select" && chooser
        ? ` · ${chooser.seat === "bottom" ? "ты" : chooser.name}`
        : "";
      const label = state.phase === "trump-select" ? `Козырь${chooserText}` : "Козырь";
      return { bidBalance, roundSignature, trumpKey: "", renderKey: `empty:${label}`, label };
    }

    const trumpKey = getTrumpRenderKey(state.trump);
    return { bidBalance, roundSignature, trumpKey, renderKey: `trump:${trumpKey}`, label: "Козырь" };
  }

  function syncHudClasses(bidBalance) {
    const hasTrump = Boolean(state.trump);
    const suitKind = state.trump?.type === "standard"
      ? (state.trump.color === "red" || state.trump.suit === "hearts" || state.trump.suit === "diamonds" ? "red" : "black")
      : "special";
    const signature = `${hasTrump ? 1 : 0}:${suitKind}:${bidBalance ? 1 : 0}`;
    if (signature === lastHudClassSignature) return;

    elements.trumpLabel.classList.toggle("v13-hud-hidden", !hasTrump);
    elements.trumpLabel.classList.toggle("v13-trump-ready", hasTrump);
    if (elements.trumpLabel.dataset.v13Suit !== suitKind) elements.trumpLabel.dataset.v13Suit = suitKind;
    elements.roundLabel.classList.toggle("v13-hud-hidden", !bidBalance);
    lastHudClassSignature = signature;
  }

  function renderCachedHud() {
    const hud = getAndroidHudState();

    if (hud.roundSignature !== lastRoundSignature) {
      elements.roundLabel.hidden = !hud.bidBalance;
      setText(elements.roundLabel, hud.bidBalance?.text || "");
      elements.roundLabel.classList.toggle("is-push", hud.bidBalance?.type === "push");
      elements.roundLabel.classList.toggle("is-take", hud.bidBalance?.type === "take");
      lastRoundSignature = hud.roundSignature;
    }

    if (!state.trump) {
      if (hud.renderKey !== lastTrumpRenderKey || elements.trumpLabel.dataset.trumpKey !== "") {
        setText(elements.trumpLabel, hud.label);
        elements.trumpLabel.dataset.trumpKey = "";
        lastTrumpCard = null;
        lastTrumpSignature = "";
        lastTrumpRenderKey = hud.renderKey;
      }

      syncTrumpPresentation();
      syncHudClasses(hud.bidBalance);
      return;
    }

    const hasRenderedCard = Boolean(elements.trumpLabel.querySelector(".trump-card"));
    if (
      hud.renderKey !== lastTrumpRenderKey
      || elements.trumpLabel.dataset.trumpKey !== hud.trumpKey
      || !hasRenderedCard
    ) {
      const shouldReveal = elements.trumpLabel.dataset.trumpKey !== hud.trumpKey;
      elements.trumpLabel.dataset.trumpKey = hud.trumpKey;
      elements.trumpLabel.replaceChildren("Козырь", createTrumpCardElement(state.trump, shouldReveal));
      lastTrumpCard = null;
      lastTrumpSignature = "";
      lastTrumpRenderKey = hud.renderKey;
    }

    syncTrumpPresentation();
    syncHudClasses(hud.bidBalance);
  }'''
runtime = replace_section(
    runtime,
    "  function syncHudClasses(bidBalance) {",
    "  function getTrickSignature() {",
    new_android_hud,
    "Android shared HUD cache",
)
runtime_path.write_text(runtime, encoding="utf-8")


game_path = Path("game-emotions.js")
game = game_path.read_text(encoding="utf-8")
game = replace_once(
    game,
    '''  const emotionTimersBySeat = new Map();
  const emotionBubblesBySeat = new Map();
  const avatarsBySeat = new Map(
    ["left", "top", "right", "bottom"].map((seat) => [
      seat,
      document.querySelector(`[data-seat="${seat}"]`),
    ]),
  );''',
    '''  const GAME_EMOTION_IDS = new Set(GAME_EMOTIONS.map((emotion) => emotion.id));
  const emotionTimersBySeat = new Map();
  const emotionBubblesBySeat = new Map();
  const emotionIconTemplatesById = new Map();
  let emotionPanelButtons = null;
  const avatarsBySeat = new Map(
    ["left", "top", "right", "bottom"].map((seat) => [
      seat,
      typeof playerViewsBySeat === "object"
        ? (playerViewsBySeat[seat]?.avatar || null)
        : document.querySelector(`[data-seat="${seat}"]`),
    ]),
  );''',
    "emotion shared avatar cache",
)

new_custom_panel = r'''  function cloneGameEmotionIcon(id) {
    const normalizedId = GAME_EMOTION_IDS.has(id) ? id : "laugh";
    let template = emotionIconTemplatesById.get(normalizedId);
    if (!template) {
      template = createGameEmotionIcon(normalizedId);
      emotionIconTemplatesById.set(normalizedId, template);
    }
    return template.cloneNode(true);
  }

  function getEmotionPanelButtons() {
    if (emotionPanelButtons) return emotionPanelButtons;
    emotionPanelButtons = GAME_EMOTIONS.map((emotion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "emotion-option";
      button.dataset.emotion = emotion.id;
      button.title = emotion.label;
      button.setAttribute("aria-label", emotion.label);
      button.append(cloneGameEmotionIcon(emotion.id));
      return button;
    });
    return emotionPanelButtons;
  }

  function renderCustomEmotionPanel() {
    if (!elements.emotionPanel) return;
    const buttons = getEmotionPanelButtons();
    const current = elements.emotionPanel.children;
    let matches = current.length === buttons.length;
    for (let index = 0; matches && index < buttons.length; index += 1) {
      matches = current[index] === buttons[index];
    }
    if (!matches) elements.emotionPanel.replaceChildren(...buttons);
  }'''
game = replace_section(
    game,
    "  function renderCustomEmotionPanel() {",
    "  function clearSeatEmotion(seat, expectedBubble = null) {",
    new_custom_panel,
    "custom emotion panel cache",
)

game = replace_once(
    game,
    '''  showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {
    const avatar = avatarsBySeat.get(seat);
    if (!avatar) return;

    clearSeatEmotion(seat);
    avatar.querySelector(".avatar-emotion")?.remove();

    const bubble = document.createElement("span");
    bubble.className = "avatar-emotion";
    bubble.append(createGameEmotionIcon(emotionId || "laugh"));
    avatar.append(bubble);
    emotionBubblesBySeat.set(seat, bubble);

    const timer = window.setTimeout(() => {
      clearSeatEmotion(seat, bubble);
    }, 3000);
    emotionTimersBySeat.set(seat, timer);
  };''',
    '''  showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {
    const avatar = avatarsBySeat.get(seat);
    if (!avatar) return;

    const hadManagedBubble = emotionBubblesBySeat.has(seat);
    clearSeatEmotion(seat);
    if (!hadManagedBubble) avatar.querySelector(":scope > .avatar-emotion")?.remove();

    const bubble = document.createElement("span");
    bubble.className = "avatar-emotion";
    bubble.append(cloneGameEmotionIcon(emotionId));
    avatar.append(bubble);
    emotionBubblesBySeat.set(seat, bubble);

    const timer = window.setTimeout(() => clearSeatEmotion(seat, bubble), 3000);
    emotionTimersBySeat.set(seat, timer);
  };''',
    "custom emotion bubble templates",
)

game = replace_once(
    game,
    '''  if (elements.emotionButton) {
    elements.emotionButton.replaceChildren(createGameEmotionIcon("laugh"));
    elements.emotionButton.setAttribute("aria-label", "Эмоции");
  }''',
    '''  if (elements.emotionButton) {
    const icon = elements.emotionButton.firstElementChild;
    if (elements.emotionButton.childElementCount !== 1 || !icon?.matches?.(".game-emote.is-laugh")) {
      elements.emotionButton.replaceChildren(cloneGameEmotionIcon("laugh"));
    }
    if (elements.emotionButton.getAttribute("aria-label") !== "Эмоции") {
      elements.emotionButton.setAttribute("aria-label", "Эмоции");
    }
  }''',
    "emotion toolbar icon cache",
)
game_path.write_text(game, encoding="utf-8")


language_path = Path("table-language.js")
language = language_path.read_text(encoding="utf-8")
language = replace_once(
    language,
    '''  const originalShowNotice = window.showNotice;
  if (typeof originalShowNotice === "function") {
    window.showNotice = function translatedShowNotice(message) {
      return originalShowNotice.call(this, translateMessage(message, t()));
    };
  }''',
    '''  const originalShowNotice = window.showNotice;
  let lastNoticeSource = null;
  let lastNoticeLanguage = null;
  let lastNoticeTranslation = null;
  if (typeof originalShowNotice === "function") {
    window.showNotice = function translatedShowNotice(message) {
      const language = getLang();
      if (message !== lastNoticeSource || language !== lastNoticeLanguage) {
        lastNoticeSource = message;
        lastNoticeLanguage = language;
        lastNoticeTranslation = translateMessage(message, t());
      }
      return originalShowNotice.call(this, lastNoticeTranslation);
    };
  }''',
    "translated notice cache",
)
language_path.write_text(language, encoding="utf-8")

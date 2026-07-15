(() => {
  "use strict";

  const GAME_EMOTIONS = [
    { id: "laugh", label: "Смех" },
    { id: "cool", label: "Красава" },
    { id: "ok", label: "Окей" },
    { id: "fire", label: "Огонь" },
    { id: "mad", label: "Злюсь" },
    { id: "thinking", label: "Думаю" },
    { id: "silent", label: "Молчу" },
    { id: "barrel", label: "Штанга" },
  ];

  const GAME_EMOTION_IDS = new Set(GAME_EMOTIONS.map((emotion) => emotion.id));
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
  );

  function createGameEmotionIcon(id) {
    const icon = document.createElement("span");
    icon.className = `game-emote is-${id}`;
    icon.setAttribute("aria-hidden", "true");

    if (!["fire", "barrel", "ok"].includes(id)) {
      const leftEye = document.createElement("span");
      leftEye.className = "eye-left";
      const rightEye = document.createElement("span");
      rightEye.className = "eye-right";
      const mouth = document.createElement("span");
      mouth.className = "mouth";
      icon.append(leftEye, rightEye, mouth);
    }

    const mark = document.createElement("span");
    mark.className = "mark";
    const extra = document.createElement("span");
    extra.className = "extra";
    icon.append(mark, extra);

    return icon;
  }

  function cloneGameEmotionIcon(id) {
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
  }

  function clearSeatEmotion(seat, expectedBubble = null) {
    const timer = emotionTimersBySeat.get(seat);
    if (timer) window.clearTimeout(timer);
    emotionTimersBySeat.delete(seat);

    const bubble = emotionBubblesBySeat.get(seat);
    if (!expectedBubble || bubble === expectedBubble) {
      bubble?.remove();
      emotionBubblesBySeat.delete(seat);
    }
  }

  showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {
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
  };

  renderEmotionPanel = renderCustomEmotionPanel;

  if (elements.emotionButton) {
    const icon = elements.emotionButton.firstElementChild;
    if (elements.emotionButton.childElementCount !== 1 || !icon?.matches?.(".game-emote.is-laugh")) {
      elements.emotionButton.replaceChildren(cloneGameEmotionIcon("laugh"));
    }
    if (elements.emotionButton.getAttribute("aria-label") !== "Эмоции") {
      elements.emotionButton.setAttribute("aria-label", "Эмоции");
    }
  }

  renderCustomEmotionPanel();
})();

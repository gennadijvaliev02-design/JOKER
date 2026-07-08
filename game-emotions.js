(() => {
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

  function renderCustomEmotionPanel() {
    if (!elements.emotionPanel) {
      return;
    }

    const buttons = GAME_EMOTIONS.map((emotion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "emotion-option";
      button.dataset.emotion = emotion.id;
      button.title = emotion.label;
      button.setAttribute("aria-label", emotion.label);
      button.append(createGameEmotionIcon(emotion.id));
      return button;
    });

    elements.emotionPanel.replaceChildren(...buttons);
  }

  showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {
    const avatar = document.querySelector(`[data-seat="${seat}"]`);

    if (!avatar) {
      return;
    }

    avatar.querySelector(".avatar-emotion")?.remove();

    const bubble = document.createElement("span");
    bubble.className = "avatar-emotion";
    bubble.append(createGameEmotionIcon(emotionId || "laugh"));
    avatar.append(bubble);

    if (state.emotionTimeoutId) {
      window.clearTimeout(state.emotionTimeoutId);
    }

    state.emotionTimeoutId = window.setTimeout(() => {
      bubble.remove();
      state.emotionTimeoutId = null;
    }, 3000);
  };

  renderEmotionPanel = renderCustomEmotionPanel;

  if (elements.emotionButton) {
    elements.emotionButton.innerHTML = "";
    elements.emotionButton.append(createGameEmotionIcon("ok"));
    elements.emotionButton.setAttribute("aria-label", "Эмоции");
  }

  renderCustomEmotionPanel();
})();

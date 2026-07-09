(() => {
  let announcementElement = null;
  let announcerSeat = null;

  function getLang() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getCopy() {
    return getLang() === "en"
      ? { you: "You", declared: "declared", take: "Take", high: "High" }
      : { you: "Ты", declared: "объявил", take: "Берёт", high: "Высший" };
  }

  function ensureJokerAnnouncementElement() {
    if (announcementElement) return announcementElement;

    announcementElement = document.createElement("div");
    announcementElement.className = "joker-announcement";
    announcementElement.setAttribute("aria-live", "polite");
    announcementElement.setAttribute("aria-hidden", "true");

    const table = document.querySelector(".table");
    table?.append(announcementElement);
    return announcementElement;
  }

  function getJokerAnnouncementText(play) {
    const copy = getCopy();
    const suit = SUITS.find((item) => item.id === play.jokerSuit);
    const playerName = play.player.seat === "bottom" ? copy.you : play.player.name;
    const commandText = play.jokerCommand === "take" ? copy.take : copy.high;

    return {
      playerName,
      declaredText: copy.declared,
      commandText,
      suitSymbol: suit?.symbol || "",
      suitColor: suit?.color || "black",
    };
  }

  function setJokerAnnouncerHighlight(seat) {
    clearJokerAnnouncerHighlight();
    announcerSeat = seat;
    const avatar = document.querySelector(`[data-seat="${seat}"]`);
    avatar?.closest(".player")?.classList.add("is-joker-announcer");
  }

  function clearJokerAnnouncerHighlight() {
    document.querySelectorAll(".player.is-joker-announcer").forEach((player) => {
      player.classList.remove("is-joker-announcer");
    });
    announcerSeat = null;
  }

  function showJokerAnnouncement(play) {
    if (!play || play.card?.type !== "joker" || play.jokerMode !== "lead" || !play.jokerCommand || !play.jokerSuit) {
      return;
    }

    const element = ensureJokerAnnouncementElement();
    const text = getJokerAnnouncementText(play);
    const suitClass = text.suitColor === "red" ? "is-red" : "is-black";
    const commandClass = play.jokerCommand === "take" ? "is-take" : "is-high";

    element.classList.remove("is-take", "is-high", "is-visible");
    void element.offsetWidth;
    element.classList.add(commandClass);
    element.innerHTML = `
      <span class="joker-announcement-player">🃏 ${text.playerName} ${text.declaredText}</span>
      <span class="joker-announcement-action">
        <span>${text.commandText}</span>
        <span class="joker-announcement-suit ${suitClass}">${text.suitSymbol}</span>
      </span>
    `;
    element.classList.add("is-visible");
    element.setAttribute("aria-hidden", "false");
    setJokerAnnouncerHighlight(play.player.seat);
  }

  function hideJokerAnnouncement() {
    const element = ensureJokerAnnouncementElement();
    element.classList.remove("is-visible");
    element.setAttribute("aria-hidden", "true");
    clearJokerAnnouncerHighlight();
  }

  const originalPlayCard = playCard;
  playCard = function patchedPlayCard(playerId, cardId, options = {}) {
    const result = originalPlayCard(playerId, cardId, options);

    if (result) {
      const lastPlay = state.currentTrick.at(-1);
      showJokerAnnouncement(lastPlay);
    }

    return result;
  };

  window.setInterval(() => {
    if (announcementElement?.classList.contains("is-visible") && state.currentTrick.length === 0) {
      hideJokerAnnouncement();
    }

    if (announcerSeat && state.currentTrick.length === 0) {
      clearJokerAnnouncerHighlight();
    }
  }, 120);
})();

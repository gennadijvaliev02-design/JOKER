(() => {
  "use strict";

  let announcementElement = null;
  let highlightedPlayer = null;

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
    document.querySelector(".table")?.append(announcementElement);
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

  function clearJokerAnnouncerHighlight() {
    highlightedPlayer?.classList.remove("is-joker-announcer");
    highlightedPlayer = null;
  }

  function setJokerAnnouncerHighlight(seat) {
    clearJokerAnnouncerHighlight();
    highlightedPlayer = document.querySelector(`[data-seat="${seat}"]`)?.closest(".player") || null;
    highlightedPlayer?.classList.add("is-joker-announcer");
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
    if (announcementElement) {
      announcementElement.classList.remove("is-visible");
      announcementElement.setAttribute("aria-hidden", "true");
    }
    clearJokerAnnouncerHighlight();
  }

  const originalPlayCard = playCard;
  playCard = function patchedPlayCard(playerId, cardId, options = {}) {
    const result = originalPlayCard(playerId, cardId, options);

    if (result) showJokerAnnouncement(state.currentTrick.at(-1));
    return result;
  };

  const originalRenderTrick = renderTrick;
  renderTrick = function renderTrickWithJokerAnnouncementCleanup(...args) {
    const result = originalRenderTrick.apply(this, args);
    if (state.currentTrick.length === 0) hideJokerAnnouncement();
    return result;
  };

  const originalStartDeal = startDeal;
  startDeal = function startDealWithoutStaleJokerAnnouncement(...args) {
    hideJokerAnnouncement();
    return originalStartDeal.apply(this, args);
  };
})();

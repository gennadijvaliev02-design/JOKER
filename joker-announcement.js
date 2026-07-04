(() => {
  let announcementElement = null;

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
    const suit = SUITS.find((item) => item.id === play.jokerSuit);
    const playerName = play.player.seat === "bottom" ? "Ты" : play.player.name;
    const commandText = play.jokerCommand === "take" ? "Берёт" : "Высший";

    return {
      playerName,
      commandText,
      suitSymbol: suit?.symbol || "",
      suitColor: suit?.color || "black",
    };
  }

  function showJokerAnnouncement(play) {
    if (!play || play.card?.type !== "joker" || play.jokerMode !== "lead" || !play.jokerCommand || !play.jokerSuit) {
      return;
    }

    const element = ensureJokerAnnouncementElement();
    const text = getJokerAnnouncementText(play);
    const suitClass = text.suitColor === "red" ? "is-red" : "is-black";

    element.innerHTML = `
      <span class="joker-announcement-player">🃏 ${text.playerName}</span>
      <span class="joker-announcement-action">
        <span>${text.commandText}</span>
        <span class="joker-announcement-suit ${suitClass}">${text.suitSymbol}</span>
      </span>
    `;
    element.classList.add("is-visible");
    element.setAttribute("aria-hidden", "false");
  }

  function hideJokerAnnouncement() {
    const element = ensureJokerAnnouncementElement();
    element.classList.remove("is-visible");
    element.setAttribute("aria-hidden", "true");
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
  }, 120);
})();

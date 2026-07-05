(() => {
  let lastAceDeal = null;
  let overlayElement = null;

  const originalDealUntilFirstAce = dealUntilFirstAce;
  dealUntilFirstAce = function patchedDealUntilFirstAce() {
    const result = originalDealUntilFirstAce();
    lastAceDeal = result;
    return result;
  };

  function ensureAceDealOverlay() {
    if (overlayElement) return overlayElement;

    overlayElement = document.createElement("div");
    overlayElement.className = "ace-deal-overlay";
    overlayElement.setAttribute("aria-hidden", "true");

    const table = document.querySelector(".table");
    table?.append(overlayElement);
    return overlayElement;
  }

  function getAceSuitSymbol(card) {
    if (!card?.suit) return "A";
    const suit = SUITS.find((item) => item.id === card.suit);
    return `A${suit?.symbol || ""}`;
  }

  function showAceDealAnimation() {
    if (state.autoPlay || !lastAceDeal) return;

    const overlay = ensureAceDealOverlay();
    const winner = getPlayerById(lastAceDeal.winnerId);
    const winnerName = winner?.seat === "bottom" ? "Ты" : winner?.name || "Игрок";
    const aceIsRed = lastAceDeal.card?.color === "red";

    overlay.innerHTML = `
      <div class="ace-deal-stage">
        <div class="ace-deal-title">Раздача на туза</div>
        <div class="ace-deal-cards" aria-hidden="true">
          <span class="ace-mini-card"></span>
          <span class="ace-mini-card"></span>
          <span class="ace-mini-card"></span>
          <span class="ace-mini-card is-ace ${aceIsRed ? "is-red" : ""}">${getAceSuitSymbol(lastAceDeal.card)}</span>
        </div>
        <div class="ace-deal-winner">Первый туз у <strong>${winnerName}</strong></div>
      </div>
    `;

    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
    }, 1500);
  }

  const originalStartAceDeal = startAceDeal;
  startAceDeal = function patchedStartAceDeal() {
    originalStartAceDeal();
    showAceDealAnimation();
  };
})();

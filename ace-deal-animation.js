(() => {
  let lastAceDeal = null;

  function drawCardByRule(deck, rule) {
    const index = deck.findIndex(rule);

    if (index === -1) {
      return deck.pop();
    }

    return deck.splice(index, 1)[0];
  }

  dealUntilFirstAce = function cinematicDealUntilFirstAce() {
    const deck = shuffle(createJokerDeck());
    const revealedCards = [];
    const targetAceIndex = 8 + Math.floor(Math.random() * 13);

    for (let dealIndex = 0; dealIndex <= targetAceIndex; dealIndex += 1) {
      const player = state.players[dealIndex % state.players.length];
      const shouldRevealAce = dealIndex === targetAceIndex;
      const card = shouldRevealAce
        ? drawCardByRule(deck, (deckCard) => deckCard.rank === "A")
        : drawCardByRule(deck, (deckCard) => deckCard.rank !== "A");

      revealedCards.push({ playerId: player.id, card });

      if (shouldRevealAce) {
        const result = {
          winnerId: player.id,
          card,
          revealedCards,
        };

        lastAceDeal = result;
        return result;
      }
    }

    lastAceDeal = revealedCards.at(-1);
    return lastAceDeal;
  };

  function getPlayerDisplayName(player) {
    return player?.seat === "bottom" ? "Ты" : player?.name || "Игрок";
  }

  function createOpenAceDealCard(deal, index, seatPileCount) {
    const player = getPlayerById(deal.playerId);
    const seat = player?.seat || "bottom";
    const pileIndex = seatPileCount[seat] || 0;
    seatPileCount[seat] = pileIndex + 1;

    const wrapper = document.createElement("div");
    wrapper.className = `ace-open-played-card ${seat}`;
    wrapper.classList.toggle("is-winning-ace", deal.card?.rank === "A");
    wrapper.style.setProperty("--ace-delay", `${index * 390}ms`);
    wrapper.style.setProperty("--pile-x", `${pileIndex * 4}px`);
    wrapper.style.setProperty("--pile-y", `${pileIndex * 2}px`);
    wrapper.style.setProperty("--pile-r", `${(pileIndex % 3 - 1) * 2.5}deg`);

    const label = document.createElement("div");
    label.className = "ace-open-label";
    label.textContent = getPlayerDisplayName(player);

    const cardElement = createCardElement(deal.card);
    cardElement.disabled = true;

    wrapper.append(label, cardElement);
    return wrapper;
  }

  function playOpenAceDealAnimation(aceDeal) {
    if (state.autoPlay || !elements.table) return;

    const layer = createDealLayer("is-ace-open-deal");
    if (!layer) return;

    const revealedCards = (aceDeal?.revealedCards || lastAceDeal?.revealedCards || []).slice(0, 24);
    const winner = getPlayerById(aceDeal?.winnerId || lastAceDeal?.winnerId);
    const seatPileCount = {};

    const title = document.createElement("div");
    title.className = "ace-open-title";
    title.textContent = "Раздача на туза";

    const winnerText = document.createElement("div");
    winnerText.className = "ace-open-winner";
    winnerText.textContent = `Первый туз у ${getPlayerDisplayName(winner)}`;
    winnerText.style.setProperty("--winner-delay", `${Math.max(1, revealedCards.length) * 390 + 180}ms`);

    const cards = revealedCards.map((deal, index) => createOpenAceDealCard(deal, index, seatPileCount));

    layer.replaceChildren(title, ...cards, winnerText);
    window.setTimeout(() => layer.remove(), getDelay(Math.max(3600, revealedCards.length * 390 + 1700)));
  }

  playAceDealAnimation = function patchedPlayAceDealAnimation(aceDeal) {
    playOpenAceDealAnimation(aceDeal);
  };
})();
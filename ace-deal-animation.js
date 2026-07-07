(() => {
  let lastAceDeal = null;
  const ACE_CARD_DELAY = 390;
  const ACE_END_PAUSE = 1700;

  function getAceDealDuration(aceDeal) {
    const cardCount = Math.max(1, aceDeal?.revealedCards?.length || 1);
    return Math.max(3600, cardCount * ACE_CARD_DELAY + ACE_END_PAUSE);
  }

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
    wrapper.style.setProperty("--ace-delay", `${index * ACE_CARD_DELAY}ms`);
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
    winnerText.style.setProperty("--winner-delay", `${Math.max(1, revealedCards.length) * ACE_CARD_DELAY + 180}ms`);

    const cards = revealedCards.map((deal, index) => createOpenAceDealCard(deal, index, seatPileCount));

    layer.replaceChildren(title, ...cards, winnerText);
    window.setTimeout(() => layer.remove(), getDelay(getAceDealDuration(aceDeal)));
  }

  playAceDealAnimation = function patchedPlayAceDealAnimation(aceDeal) {
    playOpenAceDealAnimation(aceDeal);
  };

  startAceDeal = function cinematicStartAceDeal() {
    state.phase = "ace-deal";
    state.busy = true;
    state.trump = null;
    state.hands = {};
    state.currentTrick = [];
    state.activePlayerId = null;
    hideNotice();
    render();

    const aceDeal = dealUntilFirstAce();
    applyTableOrderFromAceWinner(aceDeal.winnerId);
    state.scoreRows = createEmptyScoreRows();

    if (state.devTarget) {
      state.currentPulka = state.devTarget.pulka;
      state.currentGame = state.devTarget.game;
    }

    render();
    playAceDealAnimation(aceDeal);

    const waitBeforeRealDeal = state.autoPlay ? 900 : getAceDealDuration(aceDeal) + 450;

    scheduleGameTask(() => {
      startDeal();
      render();
    }, getDelay(waitBeforeRealDeal));
  };

  function getDealerForCurrentGame() {
    const dealerOrder = state.currentGame === 1 ? 4 : state.currentGame - 1;
    return state.players.find((player) => player.order === dealerOrder) || getPlayerById(getGameLeaderId()) || state.players[0];
  }

  playCardDealAnimation = function dealerSeatCardDealAnimation(handCount) {
    if (state.autoPlay || !elements.table) return;

    const layer = createDealLayer("is-hand-deal is-dealer-seat-deal");
    if (!layer) return;

    const dealer = getDealerForCurrentGame();
    const dealerTarget = getSeatDealTarget(dealer?.seat || "bottom");
    const cardsPerPlayer = Math.max(3, Math.min(handCount || 9, 9));
    const playersInDealOrder = getPlayerOrderFrom(dealer?.id || getGameLeaderId());
    const cards = [];
    let dealStep = 0;

    for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex += 1) {
      for (const playerId of playersInDealOrder) {
        const player = getPlayerById(playerId);
        if (!player) continue;

        const target = getSeatDealTarget(player.seat);
        const targetWithSpread = {
          ...target,
          x: target.x + (cardIndex - (cardsPerPlayer - 1) / 2) * (player.seat === "top" || player.seat === "bottom" ? 9 : 2),
          y: target.y + (cardIndex - (cardsPerPlayer - 1) / 2) * (player.seat === "left" || player.seat === "right" ? 5 : 1),
        };

        const card = createFlyingBack(targetWithSpread, dealStep * 115, dealStep);
        card.style.setProperty("--flight-start-x", `${dealerTarget.x}px`);
        card.style.setProperty("--flight-start-y", `${dealerTarget.y}px`);
        card.style.setProperty("--flight-start-r", `${dealerTarget.rotate || 0}deg`);
        cards.push(card);
        dealStep += 1;
      }
    }

    layer.replaceChildren(...cards);
    window.setTimeout(() => layer.remove(), getDelay(5200));
  };
})();
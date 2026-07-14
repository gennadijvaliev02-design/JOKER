(() => {
  "use strict";

  let lastAceDeal = null;
  const ACE_CARD_DELAY = 440;
  const ACE_END_PAUSE = 1900;

  function getLang() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function getAceCopy() {
    return getLang() === "en"
      ? { you: "You", player: "Player", title: "Deal for the first ace", firstAce: "First ace goes to" }
      : { you: "Ты", player: "Игрок", title: "Раздача на туза", firstAce: "Первый туз у" };
  }

  function getAceDealDuration(aceDeal) {
    const cardCount = Math.max(1, aceDeal?.revealedCards?.length || 1);
    return Math.max(3800, cardCount * ACE_CARD_DELAY + ACE_END_PAUSE);
  }

  function drawCardByRule(deck, rule) {
    const index = deck.findIndex(rule);
    if (index === -1) return deck.pop();
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
        const result = { winnerId: player.id, card, revealedCards };
        lastAceDeal = result;
        return result;
      }
    }

    lastAceDeal = revealedCards.at(-1);
    return lastAceDeal;
  };

  function getPlayerDisplayName(player) {
    const copy = getAceCopy();
    return player?.seat === "bottom" ? copy.you : player?.name || copy.player;
  }

  function scheduleDealSound(delay, loud = false) {
    scheduleGameTask(() => playSound(loud ? "trump" : "deal"), getDelay(delay));
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

    document.querySelector(".deal-flight-layer.is-ace-open-deal")?.remove();

    const copy = getAceCopy();
    const layer = createDealLayer("is-ace-open-deal");
    if (!layer) return;

    const revealedCards = aceDeal?.revealedCards || lastAceDeal?.revealedCards || [];
    const winner = getPlayerById(aceDeal?.winnerId || lastAceDeal?.winnerId);
    const seatPileCount = {};

    const title = document.createElement("div");
    title.className = "ace-open-title";
    title.textContent = copy.title;

    const winnerText = document.createElement("div");
    winnerText.className = "ace-open-winner";
    winnerText.textContent = `${copy.firstAce} ${getPlayerDisplayName(winner)}`;
    winnerText.style.setProperty("--winner-delay", `${Math.max(1, revealedCards.length) * ACE_CARD_DELAY + 180}ms`);

    const cards = revealedCards.map((deal, index) => {
      scheduleDealSound(index * ACE_CARD_DELAY + 45, deal.card?.rank === "A");
      return createOpenAceDealCard(deal, index, seatPileCount);
    });

    layer.replaceChildren(title, ...cards, winnerText);
    window.setTimeout(() => layer.remove(), getDelay(getAceDealDuration(aceDeal)));
  }

  playAceDealAnimation = playOpenAceDealAnimation;

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
})();
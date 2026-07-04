const SUITS = [
  { id: "spades", symbol: "♠", color: "black", name: "пика" },
  { id: "clubs", symbol: "♣", color: "black", name: "крест" },
  { id: "hearts", symbol: "♥", color: "red", name: "сердце" },
  { id: "diamonds", symbol: "♦", color: "red", name: "кирпич" },
];

const RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const BOT_NAMES = ["Клод", "GPT", "Qwen"];
const FIXED_TRUMP_BY_GAME = ["hearts", "clubs", "diamonds", "spades"];
const SUIT_SORT_WEIGHT = {
  diamonds: 0,
  hearts: 1,
  clubs: 2,
  spades: 3,
};
const RANK_SORT_WEIGHT = {
  A: 0,
  K: 1,
  Q: 2,
  J: 3,
  10: 4,
  9: 5,
  8: 6,
  7: 7,
  6: 8,
};
const RANK_POWER = {
  6: 0,
  7: 1,
  8: 2,
  9: 3,
  10: 4,
  J: 5,
  Q: 6,
  K: 7,
  A: 8,
};
const DEMO_BIDS = [
  [2, "pass", 3, 1],
  [3, 2, "pass", 2],
  [1, 3, 2, "pass"],
  [4, 1, 2, 3],
];
const BID_OPTIONS = ["pass", 1, 2, 3, 4, 5, 6, 7, 8, 9];
const EMOTIONS = ["😀", "😂", "😎", "😮", "😡", "😢", "😍", "🤔", "👏", "🔥"];
const FULFILLED_SCORE = {
  pass: 50,
  1: 100,
  2: 150,
  3: 200,
  4: 250,
  5: 300,
  6: 350,
  7: 400,
  8: 450,
  9: 900,
};

const state = {
  players: [],
  deck: [],
  hands: {},
  currentTrick: [],
  playedCards: [],
  phase: "idle",
  leadPlayerId: "human",
  activePlayerId: "human",
  pendingJokerCardId: null,
  pendingJokerCommand: null,
  trumpChooserId: null,
  biddingOrder: [],
  biddingIndex: 0,
  busy: false,
  trickNumber: 1,
  scoreRows: [],
  currentPulka: 1,
  currentGame: 1,
  trump: null,
  winnerId: null,
  autoPlay: false,
  devTarget: null,
  started: false,
  timeoutIds: [],
  audioContext: null,
  dealAnimationKey: 0,
  renderedDealAnimationKey: 0,
  emotionCooldownUntil: 0,
  emotionTimeoutId: null,
};

const elements = {
  startScreen: document.querySelector("#start-screen"),
  table: document.querySelector(".table"),
  playerName: document.querySelector("#player-name"),
  startGame: document.querySelector("#start-game"),
  rulesToggle: document.querySelector("#rules-toggle"),
  rulesCard: document.querySelector("#rules-card"),
  playerHand: document.querySelector("#player-hand"),
  playedCardSlot: document.querySelector("#played-card-slot"),
  tableNotice: document.querySelector("#table-notice"),
  bidPanel: document.querySelector("#bid-panel"),
  bidTitle: document.querySelector(".bid-title"),
  bidOptions: document.querySelector("#bid-options"),
  roundLabel: document.querySelector("#round-label"),
  trumpLabel: document.querySelector("#trump-label"),
  scoreButton: document.querySelector("#score-button"),
  scoreSheet: document.querySelector("#score-sheet"),
  scoreClose: document.querySelector("#score-close"),
  scoreGrid: document.querySelector("#score-grid"),
  emotionButton: document.querySelector("#emotion-button"),
  emotionPanel: document.querySelector("#emotion-panel"),
  tableMenu: document.querySelector("#table-menu"),
  gameDialog: document.querySelector("#game-dialog"),
  gameDialogTitle: document.querySelector("#game-dialog-title"),
  gameDialogActions: document.querySelector("#game-dialog-actions"),
};

const urlParams = new URLSearchParams(window.location.search);

function createJokerDeck() {
  const cards = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (rank === "6" && (suit.id === "spades" || suit.id === "clubs")) {
        continue;
      }

      cards.push({
        id: `${rank}-${suit.id}`,
        rank,
        suit: suit.id,
        symbol: suit.symbol,
        color: suit.color,
        type: "standard",
      });
    }
  }

  cards.push(
    { id: "joker-red", rank: "Joker", suit: null, symbol: "★", color: "red", type: "joker" },
    { id: "joker-black", rank: "Joker", suit: null, symbol: "★", color: "black", type: "joker" },
  );

  return cards;
}

function shuffle(cards) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function buildPlayers(playerName) {
  return [
    { id: "human", seat: "bottom", name: playerName || "Игрок", bid: null, tricks: 0, jokersPlayed: 0, total: 0, order: 1 },
    { id: "bot-1", seat: "left", name: BOT_NAMES[0], bid: null, tricks: 0, jokersPlayed: 0, total: 0, order: 2 },
    { id: "bot-2", seat: "top", name: BOT_NAMES[1], bid: null, tricks: 0, jokersPlayed: 0, total: 0, order: 3 },
    { id: "bot-3", seat: "right", name: BOT_NAMES[2], bid: null, tricks: 0, jokersPlayed: 0, total: 0, order: 4 },
  ];
}

function startGame() {
  const playerName = elements.playerName.value.trim() || "Игрок";

  initAudio();
  state.started = true;
  state.autoPlay = urlParams.get("autoplay") === "1";
  state.devTarget = getDevTargetFromUrl();
  state.players = buildPlayers(playerName);
  elements.startScreen.classList.add("is-hidden");
  startAceDeal();
}

function startAceDeal() {
  state.phase = "ace-deal";
  state.busy = true;
  state.trump = null;
  state.hands = {};
  state.currentTrick = [];
  state.activePlayerId = null;
  render();

  const aceDeal = dealUntilFirstAce();
  applyTableOrderFromAceWinner(aceDeal.winnerId);
  state.scoreRows = createEmptyScoreRows();

  const winner = getPlayerById(aceDeal.winnerId);
  const orderText = state.players.map((player) => player.name).join(" → ");

  if (state.devTarget) {
    state.currentPulka = state.devTarget.pulka;
    state.currentGame = state.devTarget.game;
  }

  const jumpText = state.devTarget ? ` Старт: пулька ${state.currentPulka}, игра ${state.currentGame}.` : "";
  showNotice(`Раздача на туза: первый туз у ${winner.name}. Порядок: ${orderText}.${jumpText}`);
  render();

  scheduleGameTask(() => {
    startDeal();
    render();
    scheduleGameTask(hideNotice, getDelay(1400));
  }, getDelay(1700));
}

function dealUntilFirstAce() {
  const deck = shuffle(createJokerDeck());
  let dealIndex = 0;

  while (deck.length) {
    const player = state.players[dealIndex % state.players.length];
    const card = deck.pop();

    if (card.rank === "A") {
      return {
        winnerId: player.id,
        card,
      };
    }

    dealIndex += 1;
  }

  return {
    winnerId: state.players.at(-1).id,
    card: null,
  };
}

function applyTableOrderFromAceWinner(aceWinnerId) {
  const aceWinnerIndex = state.players.findIndex((player) => player.id === aceWinnerId);
  const firstPlayerIndex = (aceWinnerIndex + 1) % state.players.length;
  const orderedPlayers = [];

  for (let offset = 0; offset < state.players.length; offset += 1) {
    orderedPlayers.push(state.players[(firstPlayerIndex + offset) % state.players.length]);
  }

  state.players = orderedPlayers.map((player, index) => ({
    ...player,
    order: index + 1,
  }));
  applyVisualSeatsFromPlayerOrder();
}

function applyVisualSeatsFromPlayerOrder() {
  const botSeatsByScoreOrder = ["left", "top", "right"];
  let botSeatIndex = 0;

  state.players = state.players.map((player, index) => {
    return {
      ...player,
      seat: player.id === "human" ? "bottom" : botSeatsByScoreOrder[botSeatIndex++],
    };
  });
}

function startDeal() {
  playSound("deal");
  state.players.forEach((player) => {
    player.bid = null;
    player.tricks = 0;
    player.jokersPlayed = 0;
  });

  const deck = shuffle(createJokerDeck());
  const hands = Object.fromEntries(state.players.map((player) => [player.id, []]));

  for (let cardIndex = 0; cardIndex < 3; cardIndex += 1) {
    for (const player of state.players) {
      hands[player.id].push(deck.pop());
    }
  }

  state.deck = deck;
  state.hands = sortHands(hands);
  markDealAnimation();
  state.currentTrick = [];
  state.playedCards = [];
  state.leadPlayerId = getGameLeaderId();
  state.activePlayerId = null;
  state.trumpChooserId = null;
  state.busy = false;
  state.biddingOrder = getPlayerOrderFrom(state.leadPlayerId);
  state.biddingIndex = 0;
  state.trickNumber = 1;
  hideNotice();

  if (isChooseTrumpPulka()) {
    render();
    runAfterDealAnimation(startTrumpSelection);
    return;
  }

  state.trump = getTrumpForCurrentGame(state.deck);
  playSound("trump");
  completeDealAfterTrump();
}

function completeDealAfterTrump() {
  state.activePlayerId = null;
  state.trumpChooserId = null;

  for (let cardIndex = 0; cardIndex < 6; cardIndex += 1) {
    for (const player of state.players) {
      state.hands[player.id].push(state.deck.pop());
    }
  }

  state.hands = sortHands(state.hands);
  markDealAnimation();

  render();
  runAfterDealAnimation(startTurnAfterDeal);
}

function startTurnAfterDeal() {
  if (isFourHundredPulka()) {
    state.players.forEach((player) => {
      player.bid = 3;
    });
    startPlayingCurrentGame();
    return;
  }

  state.phase = "bidding";
  processBiddingTurns();
}

function runAfterDealAnimation(callback) {
  if (state.autoPlay) {
    callback();
    return;
  }

  scheduleGameTask(callback, 5600);
}

function startTrumpSelection() {
  state.phase = "trump-select";
  state.trump = null;
  state.trumpChooserId = getGameLeaderId();
  state.activePlayerId = state.trumpChooserId;

  if (state.trumpChooserId === "human" && state.autoPlay) {
    state.trump = chooseBotTrump("human");
    playSound("trump");
    completeDealAfterTrump();
    render();
    return;
  }

  if (state.trumpChooserId === "human") {
    showNotice("Выбери козырь");
    render();
    return;
  }

  state.busy = true;
  showNotice(`${getPlayerById(state.trumpChooserId).name} думает над козырем...`);
  render();

  scheduleGameTask(() => {
    state.trump = chooseBotTrump(state.trumpChooserId);
    playSound("trump");
    state.busy = false;
    completeDealAfterTrump();
    render();
  }, getBotDecisionDelay());
}

function sortHands(hands) {
  return Object.fromEntries(
    Object.entries(hands).map(([playerId, hand]) => [playerId, [...hand].sort(compareCards)]),
  );
}

function compareCards(firstCard, secondCard) {
  if (firstCard.type === "joker" && secondCard.type !== "joker") {
    return -1;
  }

  if (firstCard.type !== "joker" && secondCard.type === "joker") {
    return 1;
  }

  if (firstCard.type === "joker" && secondCard.type === "joker") {
    return firstCard.color === "red" ? -1 : 1;
  }

  const firstSuitGroup = getHandSuitGroup(firstCard.suit);
  const secondSuitGroup = getHandSuitGroup(secondCard.suit);

  if (firstSuitGroup !== secondSuitGroup) {
    return firstSuitGroup - secondSuitGroup;
  }

  return RANK_POWER[secondCard.rank] - RANK_POWER[firstCard.rank];
}

function getHandSuitGroup(suit) {
  const trumpSuit = getTrumpSuit();

  if (trumpSuit && suit === trumpSuit) {
    return -1;
  }

  return SUIT_SORT_WEIGHT[suit];
}

function createEmptyScoreRows() {
  const rows = [];

  for (let pulka = 1; pulka <= 5; pulka += 1) {
    for (let game = 1; game <= 4; game += 1) {
      rows.push({
        type: "game",
        game,
        cells: state.players.map(() => ""),
      });
    }

    rows.push({
      type: "total",
      game: "",
      cells: state.players.map(() => ""),
    });
  }

  return rows;
}

function render() {
  renderPlayers();
  renderHud();
  renderOpponentCardStacks();
  renderHand();
  renderTrick();
  renderBidding();
  renderScoreSheet();
}

function renderPlayers() {
  for (const player of state.players) {
    const playerElement = document.querySelector(`[data-seat="${player.seat}"]`)?.closest(".player");
    const name = document.querySelector(`[data-name="${player.seat}"]`);
    const avatar = document.querySelector(`[data-seat="${player.seat}"]`);
    const orderBadge = document.querySelector(`[data-order-badge="${player.seat}"]`);
    const order = document.querySelector(`[data-order="${player.seat}"]`);
    const bid = document.querySelector(`[data-bid="${player.seat}"]`);
    const taken = document.querySelector(`[data-taken="${player.seat}"]`);
    const stats = taken?.closest(".player-stats");

    name.textContent = player.seat === "bottom" ? "Ты" : player.name;
    const avatarInitial = avatar.querySelector(".avatar-initial") || document.createElement("span");
    avatarInitial.className = "avatar-initial";
    avatarInitial.textContent = player.name.slice(0, 1).toUpperCase();
    avatar.prepend(avatarInitial);
    orderBadge.textContent = String(player.order);
    order.textContent = String(player.order);
    bid.textContent = formatBid(player.bid);
    bid.classList.toggle("is-pass", player.bid === "pass");
    taken.textContent = String(player.tricks);
    taken.classList.toggle("is-danger", isBidBroken(player));
    stats?.classList.toggle("is-fulfilled", isBidFulfilledNow(player));
    playerElement?.classList.toggle("is-active", player.id === state.activePlayerId && !state.busy);
  }
}

function renderOpponentCardStacks() {
  for (const seat of ["left", "top", "right"]) {
    const player = state.players.find((candidate) => candidate.seat === seat);
    const stack = document.querySelector(`.${seat}-stack`);

    if (!stack) {
      continue;
    }

    const cardCount = player ? state.hands[player.id]?.length || 0 : 0;
    stack.replaceChildren(...Array.from({ length: cardCount }, () => document.createElement("span")));
  }
}

function formatBid(bid) {
  if (bid === null) {
    return "—";
  }

  return bid === "pass" ? "П" : String(bid);
}

function isBidBroken(player, final = false) {
  if (player.bid === "pass") {
    return player.tricks > 0;
  }

  if (player.tricks > player.bid) {
    return true;
  }

  const remainingCards = state.hands[player.id]?.length || 0;

  if (player.tricks + remainingCards < player.bid) {
    return true;
  }

  return final && player.tricks !== player.bid;
}

function isBidFulfilledNow(player) {
  if (player.bid === null) {
    return false;
  }

  if (player.bid === "pass") {
    return player.tricks === 0 && state.phase === "playing";
  }

  return player.tricks === player.bid;
}

function renderHud() {
  const chooser = getPlayerById(state.trumpChooserId);
  const bidBalance = getBidBalance();
  elements.roundLabel.hidden = !bidBalance;
  elements.roundLabel.textContent = bidBalance?.text || "";
  elements.roundLabel.classList.toggle("is-push", bidBalance?.type === "push");
  elements.roundLabel.classList.toggle("is-take", bidBalance?.type === "take");

  if (!state.trump) {
    const chooserText = state.phase === "trump-select" && chooser ? ` · ${chooser.seat === "bottom" ? "ты" : chooser.name}` : "";
    elements.trumpLabel.textContent = state.phase === "trump-select" ? `Козырь${chooserText}` : "Козырь";
    elements.trumpLabel.dataset.trumpKey = "";
    return;
  }

  const trumpKey = getTrumpRenderKey(state.trump);
  const shouldReveal = elements.trumpLabel.dataset.trumpKey !== trumpKey;
  elements.trumpLabel.dataset.trumpKey = trumpKey;

  elements.trumpLabel.replaceChildren("Козырь", createTrumpCardElement(state.trump, shouldReveal));
}

function getBidBalance() {
  if (!state.players.length || state.players.some((player) => player.bid === null)) {
    return null;
  }

  const totalBid = state.players.reduce((sum, player) => {
    return sum + (player.bid === "pass" ? 0 : player.bid);
  }, 0);
  const balance = totalBid - 9;

  if (balance > 0) {
    return { type: "take", text: `отнимается ${balance}` };
  }

  if (balance < 0) {
    return { type: "push", text: `пихается ${Math.abs(balance)}` };
  }

  return null;
}

function renderHand() {
  const hand = state.hands.human || [];
  const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;

  elements.playerHand.replaceChildren(
    ...hand.map((card, index) =>
      createCardElement(card, {
        playable: canHumanPlay(card),
        dealIndex: shouldAnimateDeal ? index : null,
        handIndex: index,
        handCount: hand.length,
      }),
    ),
  );

  if (shouldAnimateDeal) {
    state.renderedDealAnimationKey = state.dealAnimationKey;
    elements.table?.classList.add("is-dealing");
    window.setTimeout(() => {
      elements.table?.classList.remove("is-dealing");
    }, getDelay(5600));
  }
}

function createCardElement(card, options = {}) {
  const cardElement = document.createElement("button");
  cardElement.className = `card ${card.color} ${card.type === "joker" ? "joker-card" : ""}`;
  cardElement.type = "button";
  cardElement.dataset.card = card.id;
  cardElement.disabled = options.playable === false;

  if (options.playable !== undefined) {
    cardElement.classList.toggle("is-disabled", options.playable === false);
  }

  if (options.dealIndex !== null && options.dealIndex !== undefined) {
    cardElement.classList.add("is-dealt");
    cardElement.style.setProperty("--deal-delay", `${Math.min(options.dealIndex, 8) * 240}ms`);
  }

  if (options.handIndex !== undefined && options.handCount) {
    const middle = (options.handCount - 1) / 2;
    const offset = options.handIndex - middle;
    const lift = Math.round(Math.abs(offset) * 2.2);

    cardElement.style.setProperty("--hand-rotate", `${offset * 1.8}deg`);
    cardElement.style.setProperty("--hand-lift", `${lift}px`);
  }

  if (card.type === "joker") {
    cardElement.innerHTML = `
      <span class="joker-word">JOKER</span>
      <span class="card-center">★<span class="mini-rank">JOKER</span></span>
      <span class="joker-word bottom">JOKER</span>
    `;
    return cardElement;
  }

  cardElement.innerHTML = `
    <span class="card-corner top">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit">${card.symbol}</span>
    </span>
    <span class="card-center">${card.symbol}</span>
    <span class="card-corner bottom">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit">${card.symbol}</span>
    </span>
  `;

  return cardElement;
}

function markDealAnimation() {
  if (state.autoPlay) {
    return;
  }

  state.dealAnimationKey += 1;
}

function renderTrick() {
  elements.playedCardSlot.replaceChildren(
    ...state.currentTrick.map((play) => {
      const playedCard = document.createElement("div");
      playedCard.className = `played-card ${play.player.seat} ${play.jokerMode === "duck" ? "is-ducked" : ""}`;
      playedCard.classList.toggle("is-entering", play.order === state.currentTrick.length - 1);

      const label = document.createElement("span");
      label.className = "played-label";
      label.textContent = `${play.player.seat === "bottom" ? "Ты" : play.player.name}${formatJokerPlaySuffix(play)}`;

      const cardElement = createCardElement(play.card);
      cardElement.disabled = true;

      playedCard.append(label, cardElement);
      return playedCard;
    }),
  );
}

function formatJokerPlaySuffix(play) {
  if (play.jokerMode === "duck") {
    return " · под";
  }

  if (play.card.type === "joker" && play.jokerMode === "lead" && play.jokerCommand && play.jokerSuit) {
    const suit = SUITS.find((item) => item.id === play.jokerSuit);
    return ` · ${play.jokerCommand === "take" ? "бер" : "выс"} ${suit?.symbol || ""}`;
  }

  return "";
}

function canHumanPlay(card) {
  if (state.phase !== "playing" || state.busy || state.activePlayerId !== "human") {
    return false;
  }

  return isLegalCard("human", card);
}

function isLegalCard(playerId, card) {
  return getIllegalMoveReason(playerId, card) === "";
}

function getIllegalMoveReason(playerId, card) {
  const leadSuit = getLeadSuit();

  if (!leadSuit || card.type === "joker") {
    return "";
  }

  if (card.suit === leadSuit) {
    return "";
  }

  if (hasSuit(playerId, leadSuit)) {
    return "Нужно ходить в масть";
  }

  const trumpSuit = getTrumpSuit();

  if (trumpSuit && card.suit !== trumpSuit && hasSuit(playerId, trumpSuit)) {
    return "Масти нет — нужно кинуть козырь";
  }

  return "";
}

function getLeadSuit() {
  const firstPlay = state.currentTrick[0];

  if (firstPlay?.card.type === "joker" && firstPlay.jokerMode === "lead" && firstPlay.jokerSuit) {
    return firstPlay.jokerSuit;
  }

  const leadPlay = state.currentTrick.find((play) => play.card.type !== "joker");
  return leadPlay?.card.suit || null;
}

function getTrumpSuit() {
  return state.trump?.type === "standard" ? state.trump.suit : null;
}

function hasSuit(playerId, suit) {
  return state.hands[playerId].some((handCard) => handCard.type !== "joker" && handCard.suit === suit);
}

function playCard(playerId, cardId, options = {}) {
  const hand = state.hands[playerId];
  const cardIndex = hand.findIndex((card) => card.id === cardId);

  if (cardIndex === -1) {
    return false;
  }

  const card = hand[cardIndex];

  const illegalReason = getIllegalMoveReason(playerId, card);

  if (illegalReason) {
    if (playerId === "human") {
      showNotice(illegalReason);
    }

    return false;
  }

  hand.splice(cardIndex, 1);

  if (card.type === "joker") {
    getPlayerById(playerId).jokersPlayed += 1;
    playSound("joker");
  } else {
    playSound("card");
  }

  const playedCard = {
    player: getPlayerById(playerId),
    card,
    jokerMode: card.type === "joker" ? options.jokerMode || "lead" : null,
    jokerCommand: options.jokerCommand || null,
    jokerSuit: options.jokerSuit || null,
    order: state.currentTrick.length,
  };

  state.currentTrick.push(playedCard);
  state.playedCards.push(playedCard);
  state.activePlayerId = getNextPlayerId(playerId);
  render();
  return true;
}

function handleHumanCardClick(event) {
  const cardButton = event.target.closest("[data-card]");

  if (!cardButton || state.phase !== "playing" || state.activePlayerId !== "human" || state.busy) {
    return;
  }

  const card = state.hands.human?.find((handCard) => handCard.id === cardButton.dataset.card);

  if (needsLeadJokerChoice(card)) {
    state.phase = "joker-lead-command";
    state.pendingJokerCardId = card.id;
    state.pendingJokerCommand = null;
    showNotice("Команда джокера");
    render();
    return;
  }

  if (needsJokerModeChoice(card)) {
    state.phase = "joker-mode";
    state.pendingJokerCardId = card.id;
    showNotice("Как сыграть джокером?");
    render();
    return;
  }

  if (!playCard("human", cardButton.dataset.card)) {
    cardButton.classList.remove("is-invalid");
    void cardButton.offsetWidth;
    cardButton.classList.add("is-invalid");
    return;
  }

  continueBotTurns();
}

function renderBidding() {
  if (state.phase === "joker-lead-command" && state.activePlayerId === "human") {
    renderLeadJokerCommandSelection();
    return;
  }

  if (state.phase === "joker-lead-suit" && state.activePlayerId === "human") {
    renderLeadJokerSuitSelection();
    return;
  }

  if (state.phase === "joker-mode" && state.activePlayerId === "human") {
    renderJokerModeSelection();
    return;
  }

  if (state.phase === "trump-select" && state.trumpChooserId === "human") {
    renderTrumpSelection();
    return;
  }

  elements.bidPanel.hidden = state.phase !== "bidding" || getCurrentBidderId() !== "human";

  if (elements.bidPanel.hidden) {
    elements.bidOptions.replaceChildren();
    return;
  }

  elements.bidTitle.textContent = "Заказ";
  const currentBidTotal = getOrderedBidTotal();
  const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;
  const buttons = BID_OPTIONS.map((bid) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bid-option";
    button.dataset.bid = String(bid);
    button.textContent = bid === "pass" ? "Пас" : String(bid);

    const bidValue = bid === "pass" ? 0 : bid;
    const isForbidden = isLastBidder && currentBidTotal + bidValue === 9;
    button.disabled = isForbidden;
    button.classList.toggle("is-forbidden", isForbidden);

    return button;
  });

  elements.bidOptions.replaceChildren(...buttons);
}

function renderEmotionPanel() {
  const buttons = EMOTIONS.map((emotion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "emotion-option";
    button.dataset.emotion = emotion;
    button.textContent = emotion;
    return button;
  });

  elements.emotionPanel.replaceChildren(...buttons);
}

function toggleEmotionPanel() {
  if (!state.started || state.phase === "idle" || isEmotionCoolingDown()) {
    return;
  }

  elements.emotionPanel.hidden = !elements.emotionPanel.hidden;
}

function handleEmotionClick(event) {
  const button = event.target.closest("[data-emotion]");

  if (!button || isEmotionCoolingDown()) {
    return;
  }

  showPlayerEmotion("bottom", button.dataset.emotion);
  elements.emotionPanel.hidden = true;
  startEmotionCooldown();
}

function showPlayerEmotion(seat, emotion) {
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
}

function startEmotionCooldown() {
  state.emotionCooldownUntil = Date.now() + 3000;
  elements.emotionButton.disabled = true;
  window.setTimeout(() => {
    elements.emotionButton.disabled = false;
  }, 3000);
}

function isEmotionCoolingDown() {
  return Date.now() < state.emotionCooldownUntil;
}

function renderTrumpSelection() {
  elements.bidPanel.hidden = false;
  elements.bidTitle.textContent = "Козырь";

  const suitButtons = FIXED_TRUMP_BY_GAME.map((suitId) => SUITS.find((suit) => suit.id === suitId)).map((suit) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bid-option";
    button.dataset.trump = suit.id;
    button.textContent = suit.symbol;
    return button;
  });

  const noTrumpButton = document.createElement("button");
  noTrumpButton.type = "button";
  noTrumpButton.className = "bid-option";
  noTrumpButton.dataset.trump = "no-trump";
  noTrumpButton.textContent = "Безка";

  elements.bidOptions.replaceChildren(...suitButtons, noTrumpButton);
}

function renderJokerModeSelection() {
  elements.bidPanel.hidden = false;
  elements.bidTitle.textContent = "Джокер";

  const duckButton = document.createElement("button");
  duckButton.type = "button";
  duckButton.className = "bid-option joker-duck-option";
  duckButton.dataset.jokerMode = "duck";
  duckButton.textContent = "Подсунуть";

  const beatButton = document.createElement("button");
  beatButton.type = "button";
  beatButton.className = "bid-option joker-beat-option";
  beatButton.dataset.jokerMode = "beat";
  beatButton.textContent = "Перебить";

  elements.bidOptions.replaceChildren(duckButton, beatButton);
}

function renderLeadJokerCommandSelection() {
  elements.bidPanel.hidden = false;
  elements.bidTitle.textContent = "Джокер";

  const highButton = document.createElement("button");
  highButton.type = "button";
  highButton.className = "bid-option joker-high-option";
  highButton.dataset.jokerLeadCommand = "high";
  highButton.textContent = "Высший";

  const takeButton = document.createElement("button");
  takeButton.type = "button";
  takeButton.className = "bid-option joker-take-option";
  takeButton.dataset.jokerLeadCommand = "take";
  takeButton.textContent = "Берет";

  elements.bidOptions.replaceChildren(takeButton, highButton);
}

function renderLeadJokerSuitSelection() {
  elements.bidPanel.hidden = false;
  elements.bidTitle.textContent = state.pendingJokerCommand === "take" ? "Берет масть" : "Высший";

  const suitButtons = FIXED_TRUMP_BY_GAME.map((suitId) => SUITS.find((suit) => suit.id === suitId)).map((suit) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bid-option";
    button.dataset.jokerLeadSuit = suit.id;
    button.textContent = suit.symbol;
    return button;
  });

  elements.bidOptions.replaceChildren(...suitButtons);
}

function getOrderedBidTotal() {
  return state.players.reduce((sum, player) => {
    return sum + (typeof player.bid === "number" ? player.bid : 0);
  }, 0);
}

function handleBidClick(event) {
  const leadCommandButton = event.target.closest("[data-joker-lead-command]");

  if (leadCommandButton && state.phase === "joker-lead-command" && state.activePlayerId === "human") {
    state.pendingJokerCommand = leadCommandButton.dataset.jokerLeadCommand;
    state.phase = "joker-lead-suit";
    render();
    return;
  }

  const leadSuitButton = event.target.closest("[data-joker-lead-suit]");

  if (leadSuitButton && state.phase === "joker-lead-suit" && state.activePlayerId === "human") {
    const cardId = state.pendingJokerCardId;
    const command = state.pendingJokerCommand;
    state.pendingJokerCardId = null;
    state.pendingJokerCommand = null;
    state.phase = "playing";
    elements.bidPanel.hidden = true;
    hideNotice();

    if (cardId && playCard("human", cardId, { jokerMode: "lead", jokerCommand: command, jokerSuit: leadSuitButton.dataset.jokerLeadSuit })) {
      continueBotTurns();
    }

    return;
  }

  const jokerModeButton = event.target.closest("[data-joker-mode]");

  if (jokerModeButton && state.phase === "joker-mode" && state.activePlayerId === "human") {
    const cardId = state.pendingJokerCardId;
    state.pendingJokerCardId = null;
    state.phase = "playing";
    elements.bidPanel.hidden = true;
    hideNotice();

    if (cardId && playCard("human", cardId, { jokerMode: jokerModeButton.dataset.jokerMode })) {
      continueBotTurns();
    }

    return;
  }

  const trumpButton = event.target.closest("[data-trump]");

  if (trumpButton && state.phase === "trump-select" && state.trumpChooserId === "human") {
    state.trump = createTrumpFromChoice(trumpButton.dataset.trump);
    playSound("trump");
    state.trumpChooserId = null;
    hideNotice();
    completeDealAfterTrump();
    render();
    return;
  }

  const button = event.target.closest("[data-bid]");

  if (!button || state.phase !== "bidding" || button.disabled || getCurrentBidderId() !== "human") {
    return;
  }

  const bid = button.dataset.bid === "pass" ? "pass" : Number(button.dataset.bid);
  submitBid("human", bid);
  hideNotice();
  processBiddingTurns();
}

function processBiddingTurns() {
  if (state.phase !== "bidding") {
    return;
  }

  const bidderId = getCurrentBidderId();

  if (!bidderId) {
    if (hasForbiddenBidTotal()) {
      rewindLastBidForForbiddenTotal();
      render();
      processBiddingTurns();
      return;
    }

    startPlayingCurrentGame();
    return;
  }

  if (bidderId === "human") {
    if (state.autoPlay) {
      submitBid("human", chooseBotBid("human"));
      processBiddingTurns();
      return;
    }

    state.busy = false;
    showNotice("Твой заказ");
    render();
    return;
  }

  state.busy = true;
  showNotice(`${getPlayerById(bidderId).name} думает над заказом...`);
  render();

  scheduleGameTask(() => {
    submitBid(bidderId, chooseBotBid(bidderId));
    processBiddingTurns();
  }, getBotDecisionDelay());
}

function getCurrentBidderId() {
  return state.biddingOrder[state.biddingIndex] || null;
}

function submitBid(playerId, bid) {
  if (!isBidAllowedForCurrentTurn(bid)) {
    console.warn("Blocked forbidden bid total 9", {
      playerId,
      bid,
      biddingIndex: state.biddingIndex,
      currentTotal: getOrderedBidTotal(),
    });
    return false;
  }

  getPlayerById(playerId).bid = bid;
  state.biddingIndex += 1;
  return true;
}

function chooseBotBid(playerId) {
  const preferredBid = estimateBidFromHand(playerId);

  if (isBidAllowedForCurrentTurn(preferredBid)) {
    return preferredBid;
  }

  const fallbackBids = [...BID_OPTIONS].sort((firstBid, secondBid) => {
    return Math.abs(getBidNumber(firstBid) - getBidNumber(preferredBid)) - Math.abs(getBidNumber(secondBid) - getBidNumber(preferredBid));
  });

  return fallbackBids.find((bid) => isBidAllowedForCurrentTurn(bid)) ?? "pass";
}

function estimateBidFromHand(playerId) {
  const hand = state.hands[playerId] || [];
  const rawScore = hand.reduce((sum, card) => sum + getBidCardValue(card), 0);
  const estimated = Math.floor(rawScore);
  const reservedEstimate = Math.max(0, estimated - 1);
  const capped = clamp(reservedEstimate, 0, 8);

  return capped === 0 ? "pass" : capped;
}

function getBidCardValue(card) {
  if (card.type === "joker") {
    return 1.65;
  }

  const trumpSuit = getTrumpSuit();
  const isTrump = trumpSuit && card.suit === trumpSuit;

  if (isTrump) {
    if (card.rank === "A") return 1.25;
    if (card.rank === "K") return 0.95;
    if (card.rank === "Q") return 0.65;
    if (card.rank === "J" || card.rank === "10") return 0.42;
    return 0.22;
  }

  if (card.rank === "A") return 0.85;
  if (card.rank === "K") return 0.45;
  if (card.rank === "Q") return 0.22;

  return 0.06;
}

function getBidNumber(bid) {
  return bid === "pass" ? 0 : bid;
}

function isBidAllowedForCurrentTurn(bid) {
  const isLastBidder = state.biddingIndex === state.biddingOrder.length - 1;
  const bidValue = bid === "pass" ? 0 : bid;

  return !isLastBidder || getOrderedBidTotal() + bidValue !== 9;
}

function hasForbiddenBidTotal() {
  return !isFourHundredPulka() && state.players.every((player) => player.bid !== null) && getOrderedBidTotal() === 9;
}

function rewindLastBidForForbiddenTotal() {
  const lastBidderId = state.biddingOrder.at(-1);
  const lastBidder = getPlayerById(lastBidderId);

  if (!lastBidder) {
    return;
  }

  console.error("Forbidden bid total 9 reached; rewinding last bid", {
    playerId: lastBidderId,
    bid: lastBidder.bid,
  });
  lastBidder.bid = null;
  state.biddingIndex = Math.max(0, state.biddingOrder.length - 1);
  showNotice(`${lastBidder.seat === "bottom" ? "Твой" : lastBidder.name} перезаказ`);
}

function startPlayingCurrentGame() {
  state.phase = "playing";
  state.busy = false;
  state.activePlayerId = state.leadPlayerId;
  hideNotice();
  render();

  if (state.autoPlay) {
    continueBotTurns();
    return;
  }

  if (state.activePlayerId !== "human") {
    continueBotTurns();
  }
}

function continueBotTurns() {
  if (state.currentTrick.length === state.players.length) {
    finishTrickSoon();
    return;
  }

  if (state.activePlayerId === "human") {
    if (state.autoPlay) {
      const chosenCard = chooseBotCard("human");

      if (chosenCard) {
        playCard("human", chosenCard.id, getJokerPlayOptions("human", chosenCard));
      }

      continueBotTurns();
      return;
    }

    hideNotice();
    render();
    return;
  }

  state.busy = true;
  showNotice(`${getPlayerById(state.activePlayerId).name} думает...`);
  render();

  scheduleGameTask(() => {
    const botId = state.activePlayerId;
    const chosenCard = chooseBotCard(botId);

    if (chosenCard) {
      playCard(botId, chosenCard.id, getJokerPlayOptions(botId, chosenCard));
    }

    state.busy = false;
    continueBotTurns();
  }, getBotPlayDelay());
}

function chooseBotCard(playerId) {
  const hand = state.hands[playerId];
  const legalCards = hand.filter((card) => isLegalCard(playerId, card));
  const candidates = legalCards.length ? legalCards : hand;
  const wantsTrick = shouldPlayerTakeTrick(playerId);
  const standardCards = candidates.filter((card) => card.type !== "joker");
  const jokerCards = candidates.filter((card) => card.type === "joker");

  if (!state.currentTrick.length) {
    if (!wantsTrick) {
      return [...standardCards, ...jokerCards].sort(compareBotLeadLowCards)[0];
    }

    if (jokerCards.length && shouldLeadHighTrumpJoker(playerId)) {
      return [...jokerCards].sort(compareBotCards)[0];
    }

    if (shouldSpendJokerNow(playerId) && jokerCards.length && !hasStrongLeadCard(playerId, standardCards)) {
      return [...jokerCards].sort(compareBotCards)[0];
    }

    return [...standardCards, ...jokerCards].sort(compareBotLeadHighCards)[0];
  }

  if (!wantsTrick) {
    const losingStandardCards = standardCards.filter((card) => !wouldCardWinCurrentTrick(playerId, card));

    if (losingStandardCards.length) {
      return [...losingStandardCards].sort(compareBotCards).at(-1);
    }

    if (jokerCards.length) {
      return [...jokerCards].sort(compareBotCards)[0];
    }

    return [...standardCards].sort(compareBotCards)[0];
  }

  const highLeadJokerPlay = getHighLeadJokerPlay();

  if (highLeadJokerPlay?.jokerSuit) {
    const requestedSuitCards = standardCards.filter((card) => card.suit === highLeadJokerPlay.jokerSuit);

    if (requestedSuitCards.length) {
      return [...requestedSuitCards].sort(compareBotLeadHighCards)[0];
    }
  }

  if (wantsTrick) {
    const standardWinningCards = standardCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (standardWinningCards.length) {
      return [...standardWinningCards].sort(compareBotCards)[0];
    }

    const jokerWinningCards = jokerCards.filter((card) => wouldCardWinCurrentTrick(playerId, card));

    if (jokerWinningCards.length && (shouldSpendJokerNow(playerId) || shouldBeatStrongTrumpWithJoker(playerId))) {
      return [...jokerWinningCards].sort(compareBotCards)[0];
    }
  }

  return [...standardCards, ...jokerCards].sort(compareBotCards)[0];
}

function shouldPlayerTakeTrick(playerId) {
  const player = getPlayerById(playerId);

  if (isFourHundredPulka()) {
    return player.tricks < 3;
  }

  if (player.bid === "pass") {
    return false;
  }

  if (player.tricks >= player.bid) {
    return false;
  }

  return true;
}

function shouldSpendJokerNow(playerId) {
  const player = getPlayerById(playerId);
  const remainingCards = state.hands[playerId]?.length || 0;
  const remainingTricksIncludingCurrent = Math.max(1, remainingCards);

  if (player.bid === "pass") {
    return false;
  }

  const target = isFourHundredPulka() ? 3 : player.bid;
  const neededTricks = target - player.tricks;

  if (neededTricks <= 0) {
    return false;
  }

  return neededTricks >= remainingTricksIncludingCurrent || remainingCards <= 3;
}

function shouldLeadHighTrumpJoker(playerId) {
  const trumpSuit = getTrumpSuit();

  if (!trumpSuit || !shouldPlayerTakeTrick(playerId)) {
    return false;
  }

  const jokerCount = getJokerCount(playerId);
  const trumpCount = getSuitCards(playerId, trumpSuit).length;
  const player = getPlayerById(playerId);
  const target = isFourHundredPulka() ? 3 : player.bid;
  const neededTricks = target === "pass" ? 0 : target - player.tricks;

  if (neededTricks <= 0) {
    return false;
  }

  return (jokerCount >= 2 && trumpCount >= 2) || (jokerCount >= 1 && trumpCount >= 2 && neededTricks >= 2);
}

function shouldBeatStrongTrumpWithJoker(playerId) {
  if (!shouldPlayerTakeTrick(playerId) || !getJokerCount(playerId)) {
    return false;
  }

  const currentWinner = getCurrentWinningPlay();

  if (!isStrongTrumpPlay(currentWinner)) {
    return false;
  }

  const player = getPlayerById(playerId);
  const target = isFourHundredPulka() ? 3 : player.bid;
  const neededTricks = target === "pass" ? 0 : target - player.tricks;
  const remainingCards = state.hands[playerId]?.length || 0;

  return neededTricks > 0 && remainingCards >= neededTricks;
}

function isStrongTrumpPlay(play) {
  const trumpSuit = getTrumpSuit();

  if (!play || !trumpSuit || play.card.type !== "standard" || play.card.suit !== trumpSuit) {
    return false;
  }

  return RANK_POWER[play.card.rank] >= RANK_POWER.K;
}

function getJokerCount(playerId) {
  return (state.hands[playerId] || []).filter((card) => card.type === "joker").length;
}

function getSuitCards(playerId, suit) {
  return (state.hands[playerId] || []).filter((card) => card.type === "standard" && card.suit === suit);
}

function getPlayedStandardCards(suit = null) {
  return state.playedCards
    .map((play) => play.card)
    .filter((card) => card.type === "standard" && (!suit || card.suit === suit));
}

function isHigherCardAlreadyPlayed(card, rank) {
  return getPlayedStandardCards(card.suit).some((playedCard) => RANK_POWER[playedCard.rank] === rank);
}

function getUnseenHigherCardCount(card) {
  if (card.type !== "standard") {
    return 0;
  }

  return RANKS.filter((rank) => RANK_POWER[rank] > RANK_POWER[card.rank] && !isHigherCardAlreadyPlayed(card, RANK_POWER[rank])).length;
}

function isLikelyHighCard(card) {
  if (card.type !== "standard") {
    return false;
  }

  if (card.rank === "A") {
    return true;
  }

  const trumpSuit = getTrumpSuit();
  const unseenHigherCards = getUnseenHigherCardCount(card);

  if (trumpSuit && card.suit === trumpSuit) {
    return unseenHigherCards <= 1 && RANK_POWER[card.rank] >= RANK_POWER.J;
  }

  return unseenHigherCards === 0 && RANK_POWER[card.rank] >= RANK_POWER.J;
}

function getBotAttackPower(card) {
  if (card.type === "joker") {
    return 100;
  }

  const trumpBonus = getTrumpSuit() && card.suit === getTrumpSuit() ? 30 : 0;
  const memoryBonus = isLikelyHighCard(card) ? 14 : 0;
  return trumpBonus + memoryBonus + RANK_POWER[card.rank];
}

function hasStrongLeadCard(playerId, cards) {
  return cards.some((card) => {
    if (card.type === "joker") {
      return false;
    }

    if (isLikelyHighCard(card)) {
      return true;
    }

    return getTrumpSuit() && card.suit === getTrumpSuit() && RANK_POWER[card.rank] >= RANK_POWER.Q;
  });
}

function wouldCardWinCurrentTrick(playerId, card) {
  const simulatedPlay = {
    player: getPlayerById(playerId),
    card,
    jokerMode: chooseJokerMode(playerId, card),
    jokerCommand: card.type === "joker" && state.currentTrick.length === 0 ? chooseLeadJokerAction(playerId).jokerCommand : null,
    jokerSuit: card.type === "joker" && state.currentTrick.length === 0 ? chooseLeadJokerAction(playerId).jokerSuit : null,
    order: state.currentTrick.length,
  };

  state.currentTrick.push(simulatedPlay);
  const winner = state.currentTrick.length === state.players.length ? getTrickWinner() : getCurrentWinningPlay();
  state.currentTrick.pop();

  return winner?.player.id === playerId;
}

function getCurrentWinningPlay() {
  return getTrickWinner();
}

function getHighLeadJokerPlay() {
  const firstPlay = state.currentTrick[0];

  if (firstPlay?.card.type === "joker" && firstPlay.jokerMode === "lead" && firstPlay.jokerCommand === "high") {
    return firstPlay;
  }

  return null;
}

function needsJokerModeChoice(card) {
  return card?.type === "joker" && state.currentTrick.length > 0;
}

function needsLeadJokerChoice(card) {
  return card?.type === "joker" && state.currentTrick.length === 0;
}

function getJokerPlayOptions(playerId, card) {
  if (needsLeadJokerChoice(card)) {
    return {
      jokerMode: "lead",
      ...chooseLeadJokerAction(playerId),
    };
  }

  return {
    jokerMode: chooseJokerMode(playerId, card),
  };
}

function chooseJokerMode(playerId, card) {
  if (!needsJokerModeChoice(card)) {
    return card?.type === "joker" ? "lead" : null;
  }

  if (!shouldPlayerTakeTrick(playerId)) {
    return "duck";
  }

  if (shouldSpendJokerNow(playerId)) {
    return "beat";
  }

  return "duck";
}

function chooseLeadJokerAction(playerId) {
  const needsTrick = shouldSpendJokerNow(playerId);
  const leadHighTrump = shouldLeadHighTrumpJoker(playerId);

  return {
    jokerCommand: needsTrick || leadHighTrump ? "high" : "take",
    jokerSuit: leadHighTrump ? getTrumpSuit() : chooseLeadJokerSuit(playerId),
  };
}

function chooseLeadJokerSuit(playerId) {
  const suitCounts = new Map();

  for (const card of state.hands[playerId]) {
    if (card.type === "standard") {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
  }

  if (suitCounts.size) {
    return [...suitCounts.entries()].sort((first, second) => {
      if (second[1] !== first[1]) {
        return second[1] - first[1];
      }

      return FIXED_TRUMP_BY_GAME.indexOf(first[0]) - FIXED_TRUMP_BY_GAME.indexOf(second[0]);
    })[0][0];
  }

  return getTrumpSuit() || "hearts";
}

function compareBotCards(firstCard, secondCard) {
  if (firstCard.type === "joker" && secondCard.type !== "joker") {
    return 1;
  }

  if (firstCard.type !== "joker" && secondCard.type === "joker") {
    return -1;
  }

  if (firstCard.type === "joker" && secondCard.type === "joker") {
    return firstCard.color === "black" ? -1 : 1;
  }

  return RANK_POWER[firstCard.rank] - RANK_POWER[secondCard.rank];
}

function compareBotLeadLowCards(firstCard, secondCard) {
  return compareBotCards(firstCard, secondCard);
}

function compareBotLeadHighCards(firstCard, secondCard) {
  if (firstCard.type === "joker" && secondCard.type !== "joker") {
    return 1;
  }

  if (firstCard.type !== "joker" && secondCard.type === "joker") {
    return -1;
  }

  const powerDifference = getBotAttackPower(secondCard) - getBotAttackPower(firstCard);

  if (powerDifference !== 0) {
    return powerDifference;
  }

  return compareBotCards(secondCard, firstCard);
}

function finishTrickSoon() {
  state.busy = true;
  render();

  scheduleGameTask(() => {
    const winnerPlay = getTrickWinner();
    const winner = winnerPlay.player;

    winner.tricks += 1;
    playSound("trick");
    state.leadPlayerId = winner.id;
    state.activePlayerId = winner.id;
    state.currentTrick = [];
    state.trickNumber += 1;
    state.busy = false;
    render();

    if (!hasCardsLeft()) {
      finishGameSoon();
      return;
    }

    if (hasCardsLeft() && (state.autoPlay || state.activePlayerId !== "human")) {
      continueBotTurns();
    }
  }, getDelay(900));
}

function finishGameSoon() {
  state.busy = true;
  render();
  showNotice(`Игра ${state.currentGame} завершена`);

  scheduleGameTask(() => {
    const finishedGame = state.currentGame;
    writeCurrentGameScore();

    if (isFinalGame()) {
      finishMatch();
      return;
    }

    const finishedPulka = state.currentPulka;
    advanceGame();
    startDeal();

    const nextText =
      finishedGame === 4 && state.currentPulka !== finishedPulka
        ? `Пулька ${state.currentPulka}. Игра ${state.currentGame}. Новая раздача`
        : `Игра ${state.currentGame}. Новая раздача`;

    showNotice(nextText);
    render();

    scheduleGameTask(hideNotice, getDelay(1200));
  }, getDelay(1300));
}

function writeCurrentGameScore() {
  const pulkaOffset = (state.currentPulka - 1) * 5;
  const gameRow = state.scoreRows[pulkaOffset + state.currentGame - 1];
  const playerScores = state.players.map((player) => ({
    ...calculatePlayerScore(player),
    jokerCount: player.jokersPlayed,
  }));

  gameRow.entries = playerScores.map(createScoreEntry);
  syncScoreRow(gameRow);

  if (state.currentGame === 4) {
    applyPulkaBonuses(pulkaOffset);
    const totalRow = state.scoreRows[pulkaOffset + 4];
    totalRow.deltas = state.players.map((player) => calculatePulkaTotal(player.id, pulkaOffset));
    totalRow.cells = state.players.map((player) => formatTotalScore(calculateMatchTotal(player.id)));
  }
}

function formatPlayerScore(player) {
  return formatScoreEntryLabel(calculatePlayerScore(player));
}

function scoreValue(player) {
  return calculatePlayerScore(player).value;
}

function calculatePlayerScore(player) {
  if (isFourHundredPulka()) {
    return calculateFourHundredScore(player);
  }

  if (player.bid === "pass") {
    const value = player.tricks === 0 ? FULFILLED_SCORE.pass : player.tricks * 10;

    return {
      bidLabel: "-",
      scoreLabel: String(value),
      value,
      fulfilled: player.tricks === 0,
    };
  }

  if (player.tricks === 0) {
    return {
      bidLabel: String(player.bid),
      scoreLabel: "⊣",
      value: -250,
      fulfilled: false,
    };
  }

  if (player.tricks === player.bid) {
    const value = FULFILLED_SCORE[player.bid];

    return {
      bidLabel: String(player.bid),
      scoreLabel: String(value),
      value,
      fulfilled: true,
    };
  }

  const value = player.tricks * 10;

  return {
    bidLabel: String(player.bid),
    scoreLabel: String(value),
    value,
    fulfilled: false,
  };
}

function calculateFourHundredScore(player) {
  if (player.tricks === 0) {
    return {
      bidLabel: "3",
      scoreLabel: "⊣",
      value: -500,
      fulfilled: false,
    };
  }

  if (player.tricks === 3) {
    return {
      bidLabel: "3",
      scoreLabel: "400",
      value: 400,
      fulfilled: true,
    };
  }

  const value = player.tricks * 20;

  return {
    bidLabel: "3",
    scoreLabel: String(value),
    value,
    fulfilled: false,
  };
}

function createScoreEntry(score) {
  return {
    ...score,
    label: formatScoreEntryLabel(score),
    jokerCount: score.jokerCount || 0,
    crossed: false,
    premium: false,
  };
}

function formatScoreEntryLabel(entry) {
  return `${entry.bidLabel} ${entry.scoreLabel}`;
}

function syncScoreRow(row) {
  row.cells = row.entries.map(formatScoreEntryLabel);
  row.values = row.entries.map((entry) => (entry.crossed ? 0 : entry.value));
}

function applyPulkaBonuses(pulkaOffset) {
  const gameRows = state.scoreRows.slice(pulkaOffset, pulkaOffset + 4);
  const premiumPlayerIndexes = [];

  state.players.forEach((_, playerIndex) => {
    const entries = gameRows.map((row) => row.entries[playerIndex]);

    if (!entries.every((entry) => entry.fulfilled)) {
      return;
    }

    const bonus = Math.max(...entries.slice(0, 3).map((entry) => entry.value));
    const lastEntry = entries[3];
    lastEntry.value += bonus;
    lastEntry.scoreLabel = String(lastEntry.value);
    lastEntry.premium = true;
    premiumPlayerIndexes.push(playerIndex);
  });

  if (premiumPlayerIndexes.length) {
    state.players.forEach((_, playerIndex) => {
      if (premiumPlayerIndexes.includes(playerIndex)) {
        return;
      }

      crossBestSuccessfulEntry(gameRows, playerIndex);
    });
  }

  gameRows.forEach(syncScoreRow);
}

function crossBestSuccessfulEntry(gameRows, playerIndex) {
  const candidates = gameRows.slice(0, 3).flatMap((row, rowIndex) => {
    const entry = row.entries[playerIndex];

    return entry.fulfilled && !entry.crossed ? [{ entry, rowIndex }] : [];
  });

  if (!candidates.length) {
    return;
  }

  candidates.sort((first, second) => {
    if (second.entry.value !== first.entry.value) {
      return second.entry.value - first.entry.value;
    }

    return first.rowIndex - second.rowIndex;
  });

  candidates[0].entry.crossed = true;
}

function calculateMatchTotal(playerId) {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);

  return state.scoreRows.reduce((sum, row) => {
    if (row.type !== "game") {
      return sum;
    }

    if (row.entries) {
      const entry = row.entries[playerIndex];
      return sum + (entry && !entry.crossed ? entry.value : 0);
    }

    return sum + (row.values?.[playerIndex] || 0);
  }, 0);
}

function calculatePulkaTotal(playerId, pulkaOffset) {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);
  const gameRows = state.scoreRows.slice(pulkaOffset, pulkaOffset + 4);

  return gameRows.reduce((sum, row) => {
    const entry = row.entries?.[playerIndex];
    return sum + (entry && !entry.crossed ? entry.value : 0);
  }, 0);
}

function formatTotalScore(value) {
  return (value / 100).toFixed(1).replace(".", ",");
}

function formatPulkaDelta(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatTotalScore(value)}`;
}

function advanceGame() {
  if (state.currentGame < 4) {
    state.currentGame += 1;
    return;
  }

  state.currentGame = 1;
  state.currentPulka += 1;
}

function isFinalGame() {
  return state.currentPulka === 5 && state.currentGame === 4;
}

function finishMatch() {
  const winner = [...state.players].sort((firstPlayer, secondPlayer) => {
    return calculateMatchTotal(secondPlayer.id) - calculateMatchTotal(firstPlayer.id);
  })[0];

  state.phase = "finished";
  state.busy = false;
  state.activePlayerId = null;
  state.leadPlayerId = null;
  state.currentTrick = [];
  state.winnerId = winner.id;
  showNotice(`Партия завершена. Победитель: ${winner.name}`);
  showEndGameDialog(winner);
  render();
}

function scheduleGameTask(callback, delay) {
  const timeoutId = window.setTimeout(() => {
    state.timeoutIds = state.timeoutIds.filter((id) => id !== timeoutId);
    callback();
  }, delay);

  state.timeoutIds.push(timeoutId);
  return timeoutId;
}

function clearGameTasks() {
  state.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  state.timeoutIds = [];
}

function resetGameState() {
  clearGameTasks();
  clearEmotionState();
  state.players = [];
  state.deck = [];
  state.hands = {};
  state.currentTrick = [];
  state.playedCards = [];
  state.phase = "idle";
  state.leadPlayerId = "human";
  state.activePlayerId = "human";
  state.pendingJokerCardId = null;
  state.pendingJokerCommand = null;
  state.trumpChooserId = null;
  state.biddingOrder = [];
  state.biddingIndex = 0;
  state.busy = false;
  state.trickNumber = 1;
  state.scoreRows = [];
  state.currentPulka = 1;
  state.currentGame = 1;
  state.trump = null;
  state.winnerId = null;
  state.autoPlay = false;
  state.devTarget = null;
  state.started = false;
  elements.scoreSheet.hidden = true;
  elements.gameDialog.hidden = true;
  elements.gameDialogActions.replaceChildren();
  hideNotice();
  render();
}

function clearEmotionState() {
  if (state.emotionTimeoutId) {
    window.clearTimeout(state.emotionTimeoutId);
    state.emotionTimeoutId = null;
  }

  state.emotionCooldownUntil = 0;
  elements.emotionButton.disabled = false;
  elements.emotionPanel.hidden = true;
  document.querySelectorAll(".avatar-emotion").forEach((emotion) => emotion.remove());
}

function goToMainMenu() {
  resetGameState();
  elements.startScreen.classList.remove("is-hidden");
}

function restartMatch() {
  resetGameState();
  startGame();
}

function showExitDialog() {
  if (!state.started || state.phase === "idle") {
    return;
  }

  elements.gameDialogTitle.textContent = "Выйти из партии?";
  elements.gameDialogActions.replaceChildren(
    createDialogButton("Продолжить", "primary", () => {
      elements.gameDialog.hidden = true;
    }),
    createDialogButton("В меню", "", goToMainMenu),
  );
  elements.gameDialog.hidden = false;
}

function showEndGameDialog(winner) {
  elements.gameDialogTitle.textContent = `Победитель: ${winner.name}`;
  elements.gameDialogActions.replaceChildren(
    createDialogButton("Новая партия", "primary", restartMatch),
    createDialogButton("Главное меню", "", goToMainMenu),
  );
  elements.gameDialog.hidden = false;
}

function createDialogButton(text, variant, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `dialog-action ${variant}`.trim();
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function showNotice(text) {
  elements.tableNotice.textContent = text;
  elements.tableNotice.hidden = false;
}

function hideNotice() {
  elements.tableNotice.hidden = true;
}

function getTrickWinner() {
  const activePlays = state.currentTrick.filter((play) => play.jokerMode !== "duck");
  const leadJokerPlay = activePlays[0]?.card.type === "joker" && activePlays[0].jokerMode === "lead" ? activePlays[0] : null;
  const jokerPlays = activePlays.filter((play) => play.card.type === "joker" && play.jokerMode === "beat");

  if (jokerPlays.length) {
    return jokerPlays.at(-1);
  }

  const trumpSuit = state.trump?.type === "standard" ? state.trump.suit : null;
  const trumpPlays = trumpSuit ? activePlays.filter((play) => play.card.suit === trumpSuit) : [];

  if (leadJokerPlay) {
    if (leadJokerPlay.jokerCommand === "take") {
      const suitPlays = activePlays.filter((play) => play.card.suit === leadJokerPlay.jokerSuit);

      if (trumpPlays.length) {
        return getHighestStandardPlay(trumpPlays);
      }

      return suitPlays.length ? getHighestStandardPlay(suitPlays) : leadJokerPlay;
    }

    if (leadJokerPlay.jokerSuit === trumpSuit) {
      return leadJokerPlay;
    }

    if (trumpPlays.length) {
      return getHighestStandardPlay(trumpPlays);
    }

    return leadJokerPlay;
  }

  if (trumpPlays.length) {
    return getHighestStandardPlay(trumpPlays);
  }

  const winningPool = activePlays.filter((play) => play.card.suit === getLeadSuit());

  return getHighestStandardPlay(winningPool);
}

function getHighestStandardPlay(plays) {
  return [...plays].sort((firstPlay, secondPlay) => {
    return RANK_POWER[secondPlay.card.rank] - RANK_POWER[firstPlay.card.rank];
  })[0];
}

function getPlayerById(playerId) {
  return state.players.find((player) => player.id === playerId);
}

function getGameLeaderId() {
  return state.players[(state.currentGame - 1) % state.players.length].id;
}

function getTrumpForCurrentGame(deck) {
  if (isNoTrumpPulka()) {
    return { type: "no-trump" };
  }

  if (isFixedTrumpPulka()) {
    return createSuitTrump(FIXED_TRUMP_BY_GAME[state.currentGame - 1]);
  }

  return getMiddleDeckTrump(deck);
}

function createTrumpFromChoice(choice) {
  return choice === "no-trump" ? { type: "no-trump" } : createSuitTrump(choice);
}

function chooseBotTrump(playerId) {
  const suitCounts = new Map();

  for (const card of state.hands[playerId]) {
    if (card.type === "standard") {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
  }

  if (!suitCounts.size) {
    return { type: "no-trump" };
  }

  const chosenSuit = [...suitCounts.entries()].sort((first, second) => {
    if (second[1] !== first[1]) {
      return second[1] - first[1];
    }

    return FIXED_TRUMP_BY_GAME.indexOf(first[0]) - FIXED_TRUMP_BY_GAME.indexOf(second[0]);
  })[0][0];

  return createSuitTrump(chosenSuit);
}

function getMiddleDeckTrump(deck) {
  const trumpCard = deck[Math.floor(deck.length / 2)];

  return trumpCard.type === "joker" ? { type: "no-trump" } : trumpCard;
}

function createSuitTrump(suitId) {
  const suit = SUITS.find((item) => item.id === suitId);

  return {
    id: `fixed-${suit.id}`,
    rank: "",
    suit: suit.id,
    symbol: suit.symbol,
    color: suit.color,
    type: "standard",
    fixed: true,
  };
}

function isFourHundredPulka() {
  return state.currentPulka === 3;
}

function isChooseTrumpPulka() {
  return state.currentPulka === 2;
}

function isNoTrumpPulka() {
  return state.currentPulka === 4;
}

function isFixedTrumpPulka() {
  return state.currentPulka === 5;
}

function getPlayerOrderFrom(playerId) {
  const startIndex = state.players.findIndex((player) => player.id === playerId);

  return state.players.map((_, offset) => {
    return state.players[(startIndex + offset) % state.players.length].id;
  });
}

function getNextPlayerId(playerId) {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);
  const nextPlayer = state.players[(playerIndex + 1) % state.players.length];
  return nextPlayer.id;
}

function hasCardsLeft() {
  return Object.values(state.hands).some((hand) => hand.length > 0);
}

function getTrumpRenderKey(card) {
  return card.type === "no-trump" ? "no-trump" : `${card.suit}-${card.rank || "fixed"}`;
}

function createTrumpCardElement(card, shouldReveal = false) {
  const cardElement = document.createElement("span");
  cardElement.className = `trump-card ${card.color || ""} ${card.type === "no-trump" ? "no-trump-card" : ""} ${shouldReveal ? "is-revealed" : ""}`.trim();

  if (card.type === "no-trump") {
    cardElement.innerHTML = `
      <span class="trump-joker-star">★</span>
      <span class="trump-joker-label">JOKER</span>
    `;
    return cardElement;
  }

  cardElement.innerHTML = `<span class="trump-suit">${card.symbol}</span>`;

  return cardElement;
}

function renderScoreSheet() {
  const headerCells = [
    createScoreCell("", "header"),
    ...state.players.map((player) => createScoreCell(player.name, "header")),
  ];

  const rowCells = state.scoreRows.flatMap((row) => {
    if (row.type === "total") {
      return [
        createScoreCell("", "total"),
        ...row.cells.map((cell, index) => {
          const delta = row.deltas?.[index];
          const content = delta === undefined ? cell : createPulkaTotalElement(cell, delta);
          return createScoreCell(content, "total");
        }),
      ];
    }

    return [
      createScoreCell(`${row.game})`, "round-label"),
      ...(row.entries
        ? row.entries.map((entry) => createScoreCell(createScoreEntryElement(entry), entry.premium ? "premium" : ""))
        : row.cells.map((cell) => createScoreCell(formatScoreCell(cell)))),
    ];
  });

  elements.scoreGrid.replaceChildren(...headerCells, ...rowCells);
}

function createScoreCell(content, className = "") {
  const cell = document.createElement("div");
  cell.className = `score-cell ${className}`.trim();

  if (typeof content === "string") {
    cell.innerHTML = content.replaceAll("•", '<span class="joker-dot">•</span>');
  } else {
    cell.append(content);
  }

  return cell;
}

function createPulkaTotalElement(total, delta) {
  const wrapper = document.createElement("span");
  wrapper.className = "pulka-total";

  const totalValue = document.createElement("span");
  totalValue.className = "pulka-total-value";
  totalValue.textContent = total;

  const deltaValue = document.createElement("span");
  deltaValue.className = `pulka-delta ${delta > 0 ? "is-positive" : delta < 0 ? "is-negative" : "is-zero"}`;
  deltaValue.textContent = formatPulkaDelta(delta);

  wrapper.append(totalValue, deltaValue);
  return wrapper;
}

function formatScoreCell(value) {
  return value.replace("⊣", '<span class="barrel-mark" aria-label="штанга"></span>');
}

function createScoreEntryElement(entry) {
  const wrapper = document.createElement("span");
  wrapper.className = "score-entry";

  const bid = document.createElement("span");
  bid.textContent = entry.bidLabel;

  const score = document.createElement("span");
  score.className = entry.crossed ? "score-points is-crossed" : "score-points";
  score.innerHTML = formatScoreCell(entry.scoreLabel);

  wrapper.append(bid, " ", score);

  if (entry.jokerCount > 0) {
    const dots = document.createElement("span");
    dots.className = "joker-dots";
    dots.textContent = "•".repeat(entry.jokerCount);
    wrapper.append(" ", dots);
  }

  return wrapper;
}

function toggleScoreSheet() {
  elements.scoreSheet.hidden = !elements.scoreSheet.hidden;
}

function getDevTargetFromUrl() {
  const pulka = Number(urlParams.get("pulka"));
  const game = Number(urlParams.get("game"));

  if (!Number.isInteger(pulka) || !Number.isInteger(game)) {
    return null;
  }

  return {
    pulka: clamp(pulka, 1, 5),
    game: clamp(game, 1, 4),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDelay(delay) {
  return state.autoPlay ? 0 : delay;
}

function initAudio() {
  if (state.audioContext) {
    resumeAudio();
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  state.audioContext = new AudioContext();
  resumeAudio();
}

function resumeAudio() {
  state.audioContext?.resume?.().catch(() => {});
}

function playSound(type) {
  if (state.autoPlay) {
    return;
  }

  initAudio();

  const audioContext = state.audioContext;

  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  const profile = getSoundProfile(type);

  oscillator.type = profile.wave;
  oscillator.frequency.setValueAtTime(profile.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(profile.endFrequency, now + profile.duration);
  gain.gain.setValueAtTime(profile.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + profile.duration);

  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * profile.duration, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }

  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(profile.noiseVolume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);
  noise.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  noise.start(now);
  noise.stop(now + profile.duration);
}

function getSoundProfile(type) {
  const profiles = {
    deal: { frequency: 520, endFrequency: 240, duration: 0.08, volume: 0.018, noiseVolume: 0.028, wave: "triangle" },
    card: { frequency: 420, endFrequency: 160, duration: 0.07, volume: 0.016, noiseVolume: 0.024, wave: "triangle" },
    trump: { frequency: 620, endFrequency: 310, duration: 0.16, volume: 0.025, noiseVolume: 0.018, wave: "sine" },
    joker: { frequency: 760, endFrequency: 220, duration: 0.18, volume: 0.026, noiseVolume: 0.02, wave: "sawtooth" },
    trick: { frequency: 300, endFrequency: 120, duration: 0.12, volume: 0.018, noiseVolume: 0.03, wave: "triangle" },
  };

  return profiles[type] || profiles.card;
}

function getBotPlayDelay() {
  return state.autoPlay ? 0 : getRandomDelay(1100, 1750);
}

function getBotDecisionDelay() {
  return state.autoPlay ? 0 : getRandomDelay(1500, 2500);
}

function getRandomDelay(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

elements.startGame.addEventListener("click", startGame);
elements.rulesToggle.addEventListener("click", () => {
  elements.rulesCard.hidden = !elements.rulesCard.hidden;
});
elements.scoreButton.addEventListener("click", toggleScoreSheet);
elements.scoreClose.addEventListener("click", toggleScoreSheet);
elements.emotionButton.addEventListener("click", toggleEmotionPanel);
elements.emotionPanel.addEventListener("click", handleEmotionClick);
elements.tableMenu.addEventListener("click", showExitDialog);
elements.playerHand.addEventListener("click", handleHumanCardClick);
elements.bidOptions.addEventListener("click", handleBidClick);

renderEmotionPanel();

if (urlParams.has("demo")) {
  startGame();
}

if (urlParams.has("score")) {
  elements.scoreSheet.hidden = false;
}

window.jokerDeck = createJokerDeck();
window.jokerState = state;

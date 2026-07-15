(() => {
  "use strict";

  if (window.__JOKER_ANDROID_MATCH_PERSISTENCE__) return;
  window.__JOKER_ANDROID_MATCH_PERSISTENCE__ = true;

  const STORAGE_KEY = "joker-android-match-v1";
  const SCHEMA_VERSION = 1;
  const MAX_SNAPSHOT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  const PLAYER_IDS = ["human", "bot-1", "bot-2", "bot-3"];
  const PLAYER_ID_SET = new Set(PLAYER_IDS);
  const PLAYER_SEATS = ["bottom", "left", "top", "right"];
  const PLAYER_SEAT_SET = new Set(PLAYER_SEATS);
  const RECOVERABLE_PHASES = new Set([
    "trump-select",
    "bidding",
    "playing",
    "joker-lead-command",
    "joker-lead-suit",
    "joker-mode",
  ]);

  const root = document.documentElement;
  let restoring = false;
  let lastSerializedSnapshot = "";
  let storageDisabled = false;

  function isDevelopmentSession() {
    const params = new URLSearchParams(window.location?.search || "");
    return Boolean(
      state.autoPlay
      || state.devTarget
      || params.has("demo")
      || params.has("score")
      || params.has("autoplay")
      || params.has("pulka")
      || params.has("game"),
    );
  }

  function readStorage() {
    if (storageDisabled) return null;

    try {
      return window.localStorage;
    } catch {
      storageDisabled = true;
      return null;
    }
  }

  function removeStoredSnapshot(reason = "clear") {
    const storage = readStorage();
    if (storage) {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        storageDisabled = true;
      }
    }

    lastSerializedSnapshot = "";
    delete root.dataset.androidMatchSavedAt;
    root.dataset.androidMatchPersistence = reason;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getCardCatalog() {
    const source = Array.isArray(window.jokerDeck)
      ? window.jokerDeck
      : typeof createJokerDeck === "function"
        ? createJokerDeck()
        : [];
    return new Map(source.map((card) => [card.id, { ...card }]));
  }

  function serializePlay(play) {
    const playerId = play?.player?.id || play?.playerId;
    return {
      playerId,
      cardId: play?.card?.id || play?.cardId,
      jokerMode: play?.jokerMode || null,
      jokerCommand: play?.jokerCommand || null,
      jokerSuit: play?.jokerSuit || null,
      order: Number.isInteger(play?.order) ? play.order : 0,
    };
  }

  function serializeLastTrick(lastTrick) {
    if (!lastTrick?.cards?.length) return null;
    return {
      cards: lastTrick.cards.map(serializePlay),
      winnerId: lastTrick.winnerId || null,
      winnerSeat: lastTrick.winnerSeat || null,
    };
  }

  function getCurrentGameRow(gameState = state) {
    const offset = (gameState.currentPulka - 1) * 5 + gameState.currentGame - 1;
    return gameState.scoreRows?.[offset] || null;
  }

  function isCurrentGameAlreadyScored(gameState = state) {
    const row = getCurrentGameRow(gameState);
    return Array.isArray(row?.entries) && row.entries.length === PLAYER_IDS.length;
  }

  function arePlayersValid(players) {
    if (!Array.isArray(players) || players.length !== PLAYER_IDS.length) return false;
    const ids = players.map((player) => player?.id);
    const seats = players.map((player) => player?.seat);
    const orders = players.map((player) => player?.order);
    const human = players.find((player) => player?.id === "human");

    return ids.every((id) => PLAYER_ID_SET.has(id))
      && new Set(ids).size === PLAYER_IDS.length
      && seats.every((seat) => PLAYER_SEAT_SET.has(seat))
      && new Set(seats).size === PLAYER_SEATS.length
      && orders.every((order) => Number.isInteger(order) && order >= 1 && order <= 4)
      && new Set(orders).size === PLAYER_IDS.length
      && human?.seat === "bottom";
  }

  function hasCardsLeftIn(gameState) {
    return PLAYER_IDS.some((playerId) => gameState.hands?.[playerId]?.length > 0);
  }

  function areHandsCompleteForPhase(gameState) {
    const sizes = PLAYER_IDS.map((playerId) => gameState.hands?.[playerId]?.length);
    if (sizes.some((size) => !Number.isInteger(size))) return false;
    if (gameState.phase === "trump-select") return sizes.every((size) => size === 3);
    if (gameState.phase === "bidding") return sizes.every((size) => size === 9);
    return true;
  }

  function getRecoveryAction(gameState = state) {
    if (gameState.phase === "trump-select") return "trump-select";
    if (gameState.phase === "bidding") return "bidding";
    if (gameState.phase.startsWith("joker-")) return "await-human";

    if (gameState.phase === "playing") {
      if (gameState.currentTrick.length === gameState.players.length) return "finish-trick";
      if (!hasCardsLeftIn(gameState) && gameState.currentTrick.length === 0) return "finish-game";
      return gameState.activePlayerId === "human" && !gameState.autoPlay ? "await-human" : "bot-turn";
    }

    return "none";
  }

  function isSafeGameState(gameState) {
    if (
      !gameState.started
      || !RECOVERABLE_PHASES.has(gameState.phase)
      || !arePlayersValid(gameState.players)
      || !gameState.players.every(validatePlayer)
      || !Array.isArray(gameState.scoreRows)
      || gameState.scoreRows.length !== 25
      || !Number.isInteger(gameState.currentPulka)
      || gameState.currentPulka < 1
      || gameState.currentPulka > 5
      || !Number.isInteger(gameState.currentGame)
      || gameState.currentGame < 1
      || gameState.currentGame > 4
      || !Number.isInteger(gameState.trickNumber)
      || gameState.trickNumber < 1
      || gameState.trickNumber > 10
      || !PLAYER_ID_SET.has(gameState.leadPlayerId)
      || !Array.isArray(gameState.currentTrick)
      || gameState.currentTrick.length > gameState.players.length
      || !areHandsCompleteForPhase(gameState)
    ) {
      return false;
    }

    if (gameState.phase === "trump-select") {
      return gameState.trump === null
        && PLAYER_ID_SET.has(gameState.trumpChooserId)
        && gameState.activePlayerId === gameState.trumpChooserId;
    }

    if (gameState.phase === "bidding") {
      return Boolean(gameState.trump)
        && Array.isArray(gameState.biddingOrder)
        && gameState.biddingOrder.length === PLAYER_IDS.length
        && new Set(gameState.biddingOrder).size === PLAYER_IDS.length
        && gameState.biddingOrder.every((playerId) => PLAYER_ID_SET.has(playerId))
        && Number.isInteger(gameState.biddingIndex)
        && gameState.biddingIndex >= 0
        && gameState.biddingIndex <= gameState.biddingOrder.length;
    }

    if (gameState.phase.startsWith("joker-")) {
      return Boolean(gameState.trump)
        && gameState.activePlayerId === "human"
        && typeof gameState.pendingJokerCardId === "string"
        && gameState.hands.human?.some((card) => card.id === gameState.pendingJokerCardId);
    }

    if (gameState.phase === "playing") {
      if (!gameState.trump) return false;
      const trickPlayers = gameState.currentTrick.map((play) => play?.player?.id);
      if (trickPlayers.some((playerId) => !PLAYER_ID_SET.has(playerId))) return false;
      if (new Set(trickPlayers).size !== trickPlayers.length) return false;

      const cardsRemain = hasCardsLeftIn(gameState);
      if (gameState.currentTrick.length < gameState.players.length && cardsRemain && !PLAYER_ID_SET.has(gameState.activePlayerId)) {
        return false;
      }

      if (!cardsRemain && gameState.currentTrick.length === 0 && isCurrentGameAlreadyScored(gameState)) {
        return false;
      }
    }

    return true;
  }

  function canCreateSafeSnapshot() {
    return !restoring
      && !storageDisabled
      && !isDevelopmentSession()
      && isSafeGameState(state);
  }

  function buildSnapshot(reason) {
    if (!canCreateSafeSnapshot()) return null;

    const players = state.players.map((player) => ({
      id: player.id,
      seat: player.seat,
      name: player.name,
      bid: player.bid,
      tricks: player.tricks,
      jokersPlayed: player.jokersPlayed,
      order: player.order,
    }));

    return {
      schema: SCHEMA_VERSION,
      savedAt: Date.now(),
      reason,
      recovery: getRecoveryAction(state),
      state: {
        players,
        deck: (state.deck || []).map((card) => card.id),
        hands: Object.fromEntries(
          PLAYER_IDS.map((playerId) => [playerId, (state.hands[playerId] || []).map((card) => card.id)]),
        ),
        currentTrick: state.currentTrick.map(serializePlay),
        playedCards: (state.playedCards || []).map(serializePlay),
        lastTrick: serializeLastTrick(state.lastTrick),
        phase: state.phase,
        leadPlayerId: state.leadPlayerId,
        activePlayerId: state.activePlayerId,
        pendingJokerCardId: state.pendingJokerCardId,
        pendingJokerCommand: state.pendingJokerCommand,
        trumpChooserId: state.trumpChooserId,
        biddingOrder: [...state.biddingOrder],
        biddingIndex: state.biddingIndex,
        trickNumber: state.trickNumber,
        scoreRows: deepClone(state.scoreRows),
        currentPulka: state.currentPulka,
        currentGame: state.currentGame,
        trump: state.trump ? deepClone(state.trump) : null,
        winnerId: state.winnerId || null,
      },
    };
  }

  function saveCheckpoint(reason = "state") {
    const snapshot = buildSnapshot(reason);
    if (!snapshot) {
      if (state.phase === "idle" || state.phase === "finished" || !state.started) {
        removeStoredSnapshot(state.phase || "idle");
      }
      return false;
    }

    const serialized = JSON.stringify(snapshot);
    const comparable = serialized.replace(/"savedAt":\d+,/, '"savedAt":0,');
    const previousComparable = lastSerializedSnapshot.replace(/"savedAt":\d+,/, '"savedAt":0,');
    if (comparable === previousComparable) return true;

    const storage = readStorage();
    if (!storage) return false;

    try {
      storage.setItem(STORAGE_KEY, serialized);
      lastSerializedSnapshot = serialized;
      root.dataset.androidMatchPersistence = "saved";
      root.dataset.androidMatchSavedAt = String(snapshot.savedAt);
      window.dispatchEvent(new CustomEvent("joker-android-match-saved", {
        detail: { reason, savedAt: snapshot.savedAt, recovery: snapshot.recovery },
      }));
      return true;
    } catch {
      storageDisabled = true;
      return false;
    }
  }

  function validatePlayer(player) {
    return PLAYER_ID_SET.has(player?.id)
      && typeof player.seat === "string"
      && typeof player.name === "string"
      && Number.isInteger(player.order)
      && Number.isInteger(player.tricks)
      && player.tricks >= 0
      && player.tricks <= 9
      && Number.isInteger(player.jokersPlayed)
      && player.jokersPlayed >= 0
      && player.jokersPlayed <= 2
      && (player.bid === null || player.bid === "pass" || (Number.isInteger(player.bid) && player.bid >= 1 && player.bid <= 9));
  }

  function rehydratePlay(serializedPlay, playersById, cardsById) {
    const player = playersById.get(serializedPlay?.playerId);
    const card = cardsById.get(serializedPlay?.cardId);
    if (!player || !card) throw new Error("Invalid saved play");

    return {
      player,
      card: { ...card },
      jokerMode: serializedPlay.jokerMode || null,
      jokerCommand: serializedPlay.jokerCommand || null,
      jokerSuit: serializedPlay.jokerSuit || null,
      order: Number.isInteger(serializedPlay.order) ? serializedPlay.order : 0,
    };
  }

  function parseStoredSnapshot() {
    const storage = readStorage();
    if (!storage) return null;

    let raw;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      storageDisabled = true;
      return null;
    }
    if (!raw) return null;

    try {
      const snapshot = JSON.parse(raw);
      if (
        snapshot?.schema !== SCHEMA_VERSION
        || !Number.isFinite(snapshot.savedAt)
        || snapshot.savedAt > Date.now() + 5 * 60 * 1000
        || Date.now() - snapshot.savedAt > MAX_SNAPSHOT_AGE_MS
        || !RECOVERABLE_PHASES.has(snapshot.state?.phase)
        || !arePlayersValid(snapshot.state?.players)
        || !snapshot.state.players.every(validatePlayer)
        || !Array.isArray(snapshot.state.scoreRows)
        || snapshot.state.scoreRows.length !== 25
        || !Array.isArray(snapshot.state.currentTrick)
        || snapshot.state.currentTrick.length > PLAYER_IDS.length
        || !Array.isArray(snapshot.state.playedCards)
      ) {
        throw new Error("Invalid snapshot envelope");
      }

      const cardsById = getCardCatalog();
      if (cardsById.size !== 38) throw new Error("Unexpected deck catalog");

      const players = snapshot.state.players.map((player) => ({ ...player }));
      const playersById = new Map(players.map((player) => [player.id, player]));
      const deckIds = snapshot.state.deck;
      const handIds = PLAYER_IDS.flatMap((playerId) => snapshot.state.hands?.[playerId] || []);
      const playedIds = snapshot.state.playedCards.map((play) => play?.cardId);
      const completeGameCardIds = [...deckIds, ...handIds, ...playedIds];

      if (
        !Array.isArray(deckIds)
        || completeGameCardIds.length !== cardsById.size
        || completeGameCardIds.some((cardId) => !cardsById.has(cardId))
        || new Set(completeGameCardIds).size !== cardsById.size
      ) {
        throw new Error("Saved cards are incomplete or duplicated");
      }

      const currentTrickIds = snapshot.state.currentTrick.map((play) => play?.cardId);
      if (currentTrickIds.some((cardId) => !playedIds.includes(cardId))) {
        throw new Error("Current trick is not part of played cards");
      }

      const hands = Object.fromEntries(PLAYER_IDS.map((playerId) => {
        const ids = snapshot.state.hands?.[playerId];
        if (!Array.isArray(ids)) throw new Error("Missing saved hand");
        return [playerId, ids.map((cardId) => ({ ...cardsById.get(cardId) }))];
      }));

      const currentTrick = snapshot.state.currentTrick.map((play) => rehydratePlay(play, playersById, cardsById));
      const playedCards = snapshot.state.playedCards.map((play) => rehydratePlay(play, playersById, cardsById));
      const lastTrick = snapshot.state.lastTrick?.cards?.length
        ? {
            cards: snapshot.state.lastTrick.cards.map((play) => rehydratePlay(play, playersById, cardsById)),
            winnerId: snapshot.state.lastTrick.winnerId || null,
            winnerSeat: snapshot.state.lastTrick.winnerSeat || null,
          }
        : null;

      const restoredState = {
        ...snapshot.state,
        players,
        deck: deckIds.map((cardId) => ({ ...cardsById.get(cardId) })),
        hands,
        currentTrick,
        playedCards,
        lastTrick,
        started: true,
        autoPlay: false,
        devTarget: null,
      };

      if (!isSafeGameState(restoredState)) {
        throw new Error("Saved state is not a recoverable checkpoint");
      }

      lastSerializedSnapshot = raw;
      return {
        ...snapshot,
        recovery: getRecoveryAction(restoredState),
        state: restoredState,
      };
    } catch (error) {
      console.warn("Saved Android match was rejected", error);
      removeStoredSnapshot("invalid");
      window.dispatchEvent(new CustomEvent("joker-android-match-rejected", {
        detail: { reason: error?.message || "invalid" },
      }));
      return null;
    }
  }

  function cancelTransientVisuals() {
    clearGameTasks?.();
    document.querySelectorAll(
      ".deal-animation-layer, .trick-collect-layer, .joker-announcement, .android-deal-layer",
    ).forEach((node) => node.remove());
    elements.table?.classList.remove("is-trick-collecting");
    elements.gameDialog.hidden = true;
    elements.gameDialogActions.replaceChildren();
    elements.gameSummary.hidden = true;
    elements.gameSummary.classList.remove("is-pulka-summary");
    elements.scoreSheet.hidden = true;
    elements.emotionPanel.hidden = true;
    hideNotice?.();
  }

  function invalidateRenderCaches() {
    try {
      Object.keys(lastPlayerRenderSignatures).forEach((key) => delete lastPlayerRenderSignatures[key]);
      lastHandRenderSignature = null;
      lastTrickRenderSignature = null;
      lastHudRoundSignature = null;
      lastHudTrumpRenderKey = null;
    } catch {
      elements.playerHand?.replaceChildren();
      elements.playedCardSlot?.replaceChildren();
    }
  }

  function applyRestoredState(snapshot) {
    const restored = snapshot.state;
    const runtimeAudioContext = state.audioContext;
    const runtimeTimeoutIds = state.timeoutIds instanceof Set ? state.timeoutIds : new Set();

    restoring = true;
    cancelTransientVisuals();
    runtimeTimeoutIds.clear();

    Object.assign(state, restored, {
      started: true,
      autoPlay: false,
      devTarget: null,
      busy: false,
      collectingTrickWinnerSeat: null,
      timeoutIds: runtimeTimeoutIds,
      audioContext: runtimeAudioContext,
      emotionCooldownUntil: 0,
      emotionTimeoutId: null,
      winnerId: null,
    });

    const animationKey = Math.max(
      Number(state.dealAnimationKey) || 0,
      Number(state.renderedDealAnimationKey) || 0,
    ) + 1;
    state.dealAnimationKey = animationKey;
    state.renderedDealAnimationKey = animationKey;

    const human = state.players.find((player) => player.id === "human");
    if (elements.playerName && human) elements.playerName.value = human.name;
    elements.startScreen.classList.add("is-hidden");

    invalidateRenderCaches();
    render();

    const lastTrickButton = document.getElementById("last-trick-button");
    if (lastTrickButton) lastTrickButton.disabled = !state.lastTrick?.cards?.length;

    root.dataset.androidMatchPersistence = "restored";
    root.dataset.androidMatchSavedAt = String(snapshot.savedAt);
    restoring = false;
  }

  function continueRestoredMatch(snapshot) {
    if (!state.started || state.phase === "idle" || state.phase === "finished") return;

    switch (snapshot.recovery) {
      case "finish-trick":
        if (state.currentTrick.length === state.players.length) finishTrickSoon();
        break;
      case "finish-game":
        if (!hasCardsLeft() && state.currentTrick.length === 0 && !isCurrentGameAlreadyScored()) {
          finishGameSoon();
        }
        break;
      case "trump-select":
        if (state.trumpChooserId === "human") {
          showNotice("Выбери козырь");
          render();
        } else {
          startTrumpSelection();
        }
        break;
      case "bidding":
        processBiddingTurns();
        break;
      case "bot-turn":
        continueBotTurns();
        break;
      default:
        render();
        break;
    }

    window.dispatchEvent(new CustomEvent("joker-android-match-restored", {
      detail: {
        savedAt: snapshot.savedAt,
        phase: state.phase,
        pulka: state.currentPulka,
        game: state.currentGame,
        recovery: snapshot.recovery,
      },
    }));
  }

  function restoreStoredMatch() {
    if (isDevelopmentSession() || state.started) return false;
    const snapshot = parseStoredSnapshot();
    if (!snapshot) return false;

    applyRestoredState(snapshot);
    window.setTimeout(() => continueRestoredMatch(snapshot), 0);
    return true;
  }

  function installRenderOwner() {
    if (typeof render !== "function" || render.__jokerAndroidPersistenceOwner) return;
    const previousRender = render;

    const persistenceRender = function androidPersistenceRender(...args) {
      const result = previousRender.apply(this, args);
      if (!restoring) saveCheckpoint("render");
      return result;
    };

    Object.defineProperty(persistenceRender, "__jokerAndroidPersistenceOwner", { value: true });
    render = persistenceRender;
  }

  function wrapClearOwner(name, mode) {
    const original = window[name];
    if (typeof original !== "function" || original.__jokerAndroidPersistenceClearOwner) return;

    const wrapped = function androidPersistenceClearOwner(...args) {
      if (mode === "before") removeStoredSnapshot(name);
      const result = original.apply(this, args);
      if (mode !== "before") removeStoredSnapshot(name);
      return result;
    };

    Object.defineProperty(wrapped, "__jokerAndroidPersistenceClearOwner", { value: true });
    window[name] = wrapped;
  }

  installRenderOwner();
  wrapClearOwner("startGame", "before");
  wrapClearOwner("restartMatch", "before");
  wrapClearOwner("goToMainMenu", "after");
  wrapClearOwner("finishMatch", "after");

  window.addEventListener("joker-android-system-state", (event) => {
    if (event.detail?.foreground === false) saveCheckpoint("background");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveCheckpoint("hidden");
  });
  window.addEventListener("pagehide", () => saveCheckpoint("pagehide"));
  window.addEventListener("beforeunload", () => saveCheckpoint("beforeunload"), { once: true });

  window.JokerAndroidMatchPersistence = Object.freeze({
    save: () => saveCheckpoint("manual"),
    restore: restoreStoredMatch,
    clear: () => removeStoredSnapshot("manual"),
    hasSnapshot() {
      const storage = readStorage();
      try {
        return Boolean(storage?.getItem(STORAGE_KEY));
      } catch {
        return false;
      }
    },
  });

  restoreStoredMatch();
})();

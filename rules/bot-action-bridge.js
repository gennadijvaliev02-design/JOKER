(function () {
  "use strict";

  if (typeof state === "undefined") {
    console.warn("Joker bot action bridge: game state is unavailable.");
    return;
  }

  const EVENT_NAME = "joker-bot-action";
  let actionSequence = 0;

  function isAutomatedActor(playerId) {
    return Boolean(playerId && (playerId !== "human" || state.autoPlay));
  }

  function snapshotTrump(trump) {
    if (!trump) return null;
    return {
      type: trump.type || null,
      suit: trump.suit || null,
      symbol: trump.symbol || null,
      color: trump.color || null,
      cardId: trump.card?.id || null,
    };
  }

  function createAction(kind, playerId, payload) {
    actionSequence += 1;
    return {
      actionId: actionSequence,
      kind,
      playerId,
      phase: state.phase,
      pulka: state.currentPulka,
      game: state.currentGame,
      trickNumber: state.trickNumber,
      payload,
    };
  }

  function emit(stage, action, extra = {}) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: {
        ...action,
        ...extra,
        stage,
      },
    }));
  }

  function runAutomatedAction(kind, playerId, payload, callback) {
    if (!isAutomatedActor(playerId)) {
      return callback();
    }

    const action = createAction(kind, playerId, payload);
    emit("before", action);

    try {
      const result = callback();
      emit(result === false ? "rejected" : "committed", action, {
        success: result !== false,
      });
      return result;
    } catch (error) {
      emit("error", action, {
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  if (typeof playCard === "function") {
    const originalPlayCard = playCard;
    playCard = function bridgedPlayCard(playerId, cardId, options = {}) {
      return runAutomatedAction(
        "card",
        playerId,
        {
          cardId,
          jokerMode: options.jokerMode || null,
          jokerCommand: options.jokerCommand || null,
          jokerSuit: options.jokerSuit || null,
        },
        () => originalPlayCard.call(this, playerId, cardId, options),
      );
    };
  }

  if (typeof submitBid === "function") {
    const originalSubmitBid = submitBid;
    submitBid = function bridgedSubmitBid(playerId, bid) {
      return runAutomatedAction(
        "bid",
        playerId,
        { bid },
        () => originalSubmitBid.call(this, playerId, bid),
      );
    };
  }

  if (typeof completeDealAfterTrump === "function") {
    const originalCompleteDealAfterTrump = completeDealAfterTrump;
    completeDealAfterTrump = function bridgedCompleteDealAfterTrump(...args) {
      const chooserId = state.trumpChooserId;
      return runAutomatedAction(
        "trump",
        chooserId,
        { trump: snapshotTrump(state.trump) },
        () => originalCompleteDealAfterTrump.apply(this, args),
      );
    };
  }

  window.JokerBotActionBridge = Object.freeze({
    eventName: EVENT_NAME,
    isAutomatedActor,
    getLastActionId() {
      return actionSequence;
    },
  });
})();

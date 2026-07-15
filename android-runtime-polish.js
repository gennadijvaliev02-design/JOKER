(() => {
  "use strict";

  const table = document.querySelector(".table");
  const PLAYER_SEATS = ["left", "top", "right", "bottom"];

  const playerViews = Object.fromEntries(
    PLAYER_SEATS.map((seat) => {
      const avatar = document.querySelector(`[data-seat="${seat}"]`);
      const currentEmotion = avatar?.querySelector(":scope > .avatar-emotion") || null;
      let avatarInitial = avatar?.querySelector(":scope > .avatar-initial") || null;

      if (avatar && !avatarInitial) {
        avatarInitial = document.createElement("span");
        avatarInitial.className = "avatar-initial";
        avatar.replaceChildren(avatarInitial);
        if (currentEmotion) avatar.append(currentEmotion);
      }

      const taken = document.querySelector(`[data-taken="${seat}"]`);
      return [seat, {
        playerElement: avatar?.closest(".player") || null,
        name: document.querySelector(`[data-name="${seat}"]`),
        avatar,
        avatarInitial,
        orderBadge: document.querySelector(`[data-order-badge="${seat}"]`),
        order: document.querySelector(`[data-order="${seat}"]`),
        bid: document.querySelector(`[data-bid="${seat}"]`),
        taken,
        stats: taken?.closest(".player-stats") || null,
      }];
    }),
  );

  const lastPlayerSignatures = Object.create(null);
  let lastPhase = null;
  let lastActiveSeat = null;
  let lastBusy = null;

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function syncRuntimeState(force = false) {
    if (!table || typeof state === "undefined") return;

    const phase = state.phase || "idle";
    const activePlayer = state.players?.find?.((player) => player.id === state.activePlayerId);
    const activeSeat = activePlayer?.seat || "";
    const busy = Boolean(state.busy);

    if (force || phase !== lastPhase) {
      if (table.dataset.phase !== phase) table.dataset.phase = phase;
      table.classList.toggle("is-runtime-playing", phase === "playing");
      table.classList.toggle("is-runtime-bidding", phase === "bidding");
      table.classList.toggle("is-runtime-ace-deal", phase === "ace-deal");
      lastPhase = phase;
    }

    if (force || activeSeat !== lastActiveSeat) {
      if (table.dataset.activeSeat !== activeSeat) table.dataset.activeSeat = activeSeat;
      lastActiveSeat = activeSeat;
    }

    if (force || busy !== lastBusy) {
      table.classList.toggle("is-runtime-busy", busy);
      lastBusy = busy;
    }
  }

  function getPlayerSignature(player) {
    const handCount = state.hands?.[player.id]?.length || 0;
    const isActivePlayer = player.id === state.activePlayerId && state.phase === "playing";
    const isThinking = isActivePlayer && state.busy && player.id !== "human";

    return [
      player.name,
      player.seat,
      player.order,
      player.bid ?? "null",
      player.tricks,
      handCount,
      state.phase,
      isActivePlayer ? 1 : 0,
      isThinking ? 1 : 0,
    ].join("|");
  }

  if (typeof renderPlayers === "function") {
    renderPlayers = function renderCachedAndroidPlayers() {
      for (const player of state.players) {
        const view = playerViews[player.seat];
        if (!view) continue;

        const signature = getPlayerSignature(player);
        if (lastPlayerSignatures[player.seat] === signature) continue;
        lastPlayerSignatures[player.seat] = signature;

        setText(view.name, player.seat === "bottom" ? "Ты" : player.name);
        setText(view.avatarInitial, player.name.slice(0, 1).toUpperCase());
        setText(view.orderBadge, String(player.order));
        if (view.orderBadge) {
          const orderVisibility = state.phase === "ace-deal" ? "hidden" : "visible";
          if (view.orderBadge.style.visibility !== orderVisibility) {
            view.orderBadge.style.visibility = orderVisibility;
          }
        }
        setText(view.order, String(player.order));
        setText(view.bid, formatBid(player.bid));
        setText(view.taken, String(player.tricks));

        view.bid?.classList.toggle("is-pass", player.bid === "pass");
        view.taken?.classList.toggle("is-danger", isBidBroken(player));
        view.stats?.classList.toggle("is-fulfilled", isBidFulfilledNow(player));

        const isActivePlayer = player.id === state.activePlayerId && state.phase === "playing";
        view.playerElement?.classList.toggle("is-active", isActivePlayer);
        view.playerElement?.classList.toggle(
          "is-thinking",
          isActivePlayer && state.busy && player.id !== "human",
        );
      }

      syncRuntimeState();
    };
  }

  /*
   * Bot layers repeatedly ask the same legality question for every card.
   * Cache only the boolean rule result; no bot choice or rule is changed.
   */
  if (typeof isLegalCard === "function") {
    const fullIsLegalCard = isLegalCard;
    const legalityByPlayer = new Map();

    function getLegalityContext(playerId) {
      const hand = state.hands?.[playerId] || [];
      const firstPlay = state.currentTrick?.[0] || null;
      const leadSuit = typeof getLeadSuit === "function" ? (getLeadSuit() || "") : "";
      const trumpSuit = state.trump?.type === "standard" ? (state.trump.suit || "") : "";
      const rulesId = window.JokerRules?.activeId || "rules";
      let context = legalityByPlayer.get(playerId);

      const unchanged = context
        && context.hand === hand
        && context.handLength === hand.length
        && context.trickLength === (state.currentTrick?.length || 0)
        && context.leadSuit === leadSuit
        && context.trumpSuit === trumpSuit
        && context.rulesId === rulesId
        && context.firstCardId === (firstPlay?.card?.id || "")
        && context.firstJokerMode === (firstPlay?.jokerMode || "")
        && context.firstJokerCommand === (firstPlay?.jokerCommand || "")
        && context.firstJokerSuit === (firstPlay?.jokerSuit || "");

      if (unchanged) return context;

      context = {
        hand,
        handLength: hand.length,
        trickLength: state.currentTrick?.length || 0,
        leadSuit,
        trumpSuit,
        rulesId,
        firstCardId: firstPlay?.card?.id || "",
        firstJokerMode: firstPlay?.jokerMode || "",
        firstJokerCommand: firstPlay?.jokerCommand || "",
        firstJokerSuit: firstPlay?.jokerSuit || "",
        results: new Map(),
      };
      legalityByPlayer.set(playerId, context);
      return context;
    }

    isLegalCard = function cachedAndroidIsLegalCard(playerId, card) {
      if (!card?.id) return fullIsLegalCard(playerId, card);

      const context = getLegalityContext(playerId);
      if (context.results.has(card.id)) return context.results.get(card.id);

      const result = fullIsLegalCard(playerId, card);
      context.results.set(card.id, result);
      return result;
    };
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      Object.keys(lastPlayerSignatures).forEach((seat) => delete lastPlayerSignatures[seat]);
      syncRuntimeState(true);
    }
  });

  syncRuntimeState(true);
})();

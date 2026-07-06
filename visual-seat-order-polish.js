(() => {
  const PLAY_ORDER_SEATS = ["top", "right", "bottom", "left"];
  const HUMAN_SEAT_INDEX = PLAY_ORDER_SEATS.indexOf("bottom");

  applyVisualSeatsFromPlayerOrder = function patchedApplyVisualSeatsFromPlayerOrder() {
    const humanIndex = state.players.findIndex((player) => player.id === "human");

    if (humanIndex === -1) {
      const fallbackSeats = ["left", "top", "right", "bottom"];
      state.players = state.players.map((player, index) => ({
        ...player,
        seat: fallbackSeats[index] || player.seat,
      }));
      return;
    }

    state.players = state.players.map((player, index) => {
      const visualSeatIndex = (index - humanIndex + HUMAN_SEAT_INDEX + PLAY_ORDER_SEATS.length) % PLAY_ORDER_SEATS.length;

      return {
        ...player,
        seat: PLAY_ORDER_SEATS[visualSeatIndex],
      };
    });
  };
})();

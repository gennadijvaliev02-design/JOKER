(() => {
  const originalSeatApply = applyVisualSeatsFromPlayerOrder;

  function mixedSeats() {
    const a = ["left", "top", "right"];
    const r1 = Math.floor(Math.random() * 3);
    const r2 = Math.floor(Math.random() * 3);
    const tmp = a[r1];
    a[r1] = a[r2];
    a[r2] = tmp;

    if (Math.random() > 0.5) {
      const t = a[0];
      a[0] = a[2];
      a[2] = t;
    }

    return a;
  }

  applyVisualSeatsFromPlayerOrder = function finalRandomSeats() {
    originalSeatApply?.();
    const seats = mixedSeats();
    let index = 0;

    state.players = state.players.map((player) => ({
      ...player,
      seat: player.id === "human" ? "bottom" : seats[index++],
    }));
  };
})();

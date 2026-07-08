(() => {
  const originalBuildPlayers = buildPlayers;

  function shuffleBotSeats() {
    const seats = ["left", "top", "right"];

    for (let index = seats.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [seats[index], seats[swapIndex]] = [seats[swapIndex], seats[index]];
    }

    return seats;
  }

  buildPlayers = function buildPlayersWithRandomBotSeats(playerName) {
    const players = originalBuildPlayers(playerName);
    const botSeats = shuffleBotSeats();
    const bots = players.filter((player) => player.id !== "human");

    bots.forEach((bot, index) => {
      bot.seat = botSeats[index];
    });

    return players;
  };
})();

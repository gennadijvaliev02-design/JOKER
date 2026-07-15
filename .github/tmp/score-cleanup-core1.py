from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)


def replace_section(text, start_marker, end_marker, new_block, label):
    if text.count(start_marker) != 1 or text.count(end_marker) != 1:
        raise SystemExit(f"{label}: marker mismatch")
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + new_block.rstrip() + "\n\n" + text[end:]


path = Path("script.js")
text = path.read_text(encoding="utf-8")

text = replace_once(
    text,
    '''    const finishedGame = state.currentGame;
    const gameSummary = createGameSummary();
    writeCurrentGameScore();''',
    '''    const finishedGame = state.currentGame;
    const playerScores = calculateCurrentPlayerScores();
    const gameSummary = createGameSummary(playerScores);
    writeCurrentGameScore(playerScores);''',
    "finishGameSoon score snapshot",
)

text = replace_section(
    text,
    "function writeCurrentGameScore() {",
    "function createGameSummary() {",
    '''function calculateCurrentPlayerScores() {
  return state.players.map((player) => ({
    ...calculatePlayerScore(player),
    jokerCount: player.jokersPlayed,
  }));
}

function writeCurrentGameScore(playerScores = calculateCurrentPlayerScores()) {
  const pulkaOffset = (state.currentPulka - 1) * 5;
  const gameRow = state.scoreRows[pulkaOffset + state.currentGame - 1];

  gameRow.entries = playerScores.map(createScoreEntry);
  syncScoreRow(gameRow);

  if (state.currentGame === 4) {
    applyPulkaBonuses(pulkaOffset);
    const totalRow = state.scoreRows[pulkaOffset + 4];
    const pulkaTotals = calculatePulkaTotals(pulkaOffset);
    const matchTotals = calculateMatchTotals();

    totalRow.deltas = pulkaTotals;
    totalRow.cells = matchTotals.map(formatTotalScore);
  }
}''',
    "writeCurrentGameScore",
)

text = replace_section(
    text,
    "function createGameSummary() {",
    "function showGameSummary(summary) {",
    '''function createGameSummary(playerScores = calculateCurrentPlayerScores()) {
  const scores = state.players.map((player, playerIndex) => ({
    player,
    score: playerScores[playerIndex],
    bidText: formatBid(player.bid),
    tricks: player.tricks,
  }));
  const orderedScores = [...scores].sort((first, second) => second.score.value - first.score.value);
  const bestValue = orderedScores[0]?.score.value;

  return {
    pulka: state.currentPulka,
    game: state.currentGame,
    scores: orderedScores.map((item, index) => ({
      ...item,
      medal: item.score.value === bestValue ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "",
    })),
  };
}''',
    "createGameSummary",
)

path.write_text(text, encoding="utf-8")

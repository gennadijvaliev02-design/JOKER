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


pulka_path = Path("pulka-summary.js")
pulka = pulka_path.read_text(encoding="utf-8")
pulka = replace_once(
    pulka,
    '''    const rows = state.players
      .map((player) => ({
        player,
        delta: calculatePulkaTotal(player.id, pulkaOffset),
        total: calculateMatchTotal(player.id),
      }))
      .sort((first, second) => second.total - first.total);''',
    '''    const pulkaTotals = calculatePulkaTotals(pulkaOffset);
    const matchTotals = calculateMatchTotals();
    const rows = state.players
      .map((player, playerIndex) => ({
        player,
        delta: pulkaTotals[playerIndex],
        total: matchTotals[playerIndex],
      }))
      .sort((first, second) => second.total - first.total);''',
    "pulka batch totals",
)
pulka = replace_once(
    pulka,
    '''      const pulkaOffset = (state.currentPulka - 1) * 5;
      const gameSummary = createGameSummary();
      const shouldShowPulkaSummary = finishedGame === 4 && !isFinalGame();

      writeCurrentGameScore();''',
    '''      const pulkaOffset = (state.currentPulka - 1) * 5;
      const playerScores = calculateCurrentPlayerScores();
      const gameSummary = createGameSummary(playerScores);
      const shouldShowPulkaSummary = finishedGame === 4 && !isFinalGame();

      writeCurrentGameScore(playerScores);''',
    "pulka score snapshot",
)
pulka_path.write_text(pulka, encoding="utf-8")

pass_path = Path("pass-premium-cross-fix.js")
pass_source = pass_path.read_text(encoding="utf-8")
if pass_source.count("crossBestSuccessfulEntry = function noPassPremiumCross") != 1:
    raise SystemExit("pass crossing owner mismatch")
pass_path.write_text('''(() => {
  crossBestSuccessfulEntry = function noPassPremiumCross(gameRows, playerIndex) {
    let bestEntry = null;
    const rowCount = Math.min(3, gameRows.length);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const entry = gameRows[rowIndex].entries[playerIndex];
      const isPass = entry?.bidLabel === "-";

      if (!entry.fulfilled || entry.crossed || isPass) {
        continue;
      }

      if (!bestEntry || entry.value > bestEntry.value) {
        bestEntry = entry;
      }
    }

    if (bestEntry) {
      bestEntry.crossed = true;
    }
  };
})();
''', encoding="utf-8")

winner_path = Path("winner-podium.js")
winner = winner_path.read_text(encoding="utf-8")
winner = replace_section(
    winner,
    "  function getRanking() {",
    "  function createPodiumPlayer(",
    '''  function getRanking() {
    const matchTotals = calculateMatchTotals();

    return state.players
      .map((player, playerIndex) => ({
        player,
        total: matchTotals[playerIndex],
      }))
      .sort((first, second) => second.total - first.total);
  }''',
    "winner ranking",
)
winner = replace_once(
    winner,
    '''    const ranking = getRanking();
    const winnerTotal = calculateMatchTotal(winner.id);''',
    '''    const ranking = getRanking();
    const winnerTotal = ranking.find((item) => item.player.id === winner.id)?.total || 0;''',
    "winner total reuse",
)
winner_path.write_text(winner, encoding="utf-8")

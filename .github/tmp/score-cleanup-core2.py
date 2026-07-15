from pathlib import Path


def replace_section(text, start_marker, end_marker, new_block, label):
    if text.count(start_marker) != 1 or text.count(end_marker) != 1:
        raise SystemExit(f"{label}: marker mismatch")
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + new_block.rstrip() + "\n\n" + text[end:]


path = Path("script.js")
text = path.read_text(encoding="utf-8")

text = replace_section(
    text,
    "function syncScoreRow(row) {",
    "function calculateMatchTotal(playerId) {",
    '''function syncScoreRow(row) {
  const cells = new Array(row.entries.length);
  const values = new Array(row.entries.length);

  for (let entryIndex = 0; entryIndex < row.entries.length; entryIndex += 1) {
    const entry = row.entries[entryIndex];
    cells[entryIndex] = formatScoreEntryLabel(entry);
    values[entryIndex] = entry.crossed ? 0 : entry.value;
  }

  row.cells = cells;
  row.values = values;
}

function applyPulkaBonuses(pulkaOffset) {
  const gameRows = state.scoreRows.slice(pulkaOffset, pulkaOffset + 4);
  const premiumPlayerIndexes = new Set();

  for (const playerIndex of state.players.keys()) {
    const entries = gameRows.map((row) => row.entries[playerIndex]);

    if (!entries.every((entry) => entry.fulfilled)) {
      continue;
    }

    let bonus = entries[0].value;

    for (let entryIndex = 1; entryIndex < 3; entryIndex += 1) {
      bonus = Math.max(bonus, entries[entryIndex].value);
    }

    const lastEntry = entries[3];
    lastEntry.value += bonus;
    lastEntry.scoreLabel = String(lastEntry.value);
    lastEntry.premium = true;
    premiumPlayerIndexes.add(playerIndex);
  }

  if (premiumPlayerIndexes.size) {
    for (const playerIndex of state.players.keys()) {
      if (premiumPlayerIndexes.has(playerIndex)) {
        continue;
      }

      crossBestSuccessfulEntry(gameRows, playerIndex);
    }
  }

  gameRows.forEach(syncScoreRow);
}

function crossBestSuccessfulEntry(gameRows, playerIndex) {
  let bestEntry = null;
  const rowCount = Math.min(3, gameRows.length);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const entry = gameRows[rowIndex].entries[playerIndex];

    if (!entry.fulfilled || entry.crossed) {
      continue;
    }

    if (!bestEntry || entry.value > bestEntry.value) {
      bestEntry = entry;
    }
  }

  if (bestEntry) {
    bestEntry.crossed = true;
  }
}''',
    "score processing",
)

text = replace_section(
    text,
    "function calculateMatchTotal(playerId) {",
    "function formatTotalScore(value) {",
    '''function calculateMatchTotals() {
  const totals = Array(state.players.length).fill(0);

  for (const row of state.scoreRows) {
    if (row.type !== "game") {
      continue;
    }

    for (let playerIndex = 0; playerIndex < totals.length; playerIndex += 1) {
      if (row.entries) {
        const entry = row.entries[playerIndex];

        if (entry && !entry.crossed) {
          totals[playerIndex] += entry.value;
        }

        continue;
      }

      totals[playerIndex] += row.values?.[playerIndex] || 0;
    }
  }

  return totals;
}

function calculateMatchTotal(playerId) {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);
  return playerIndex === -1 ? 0 : calculateMatchTotals()[playerIndex];
}

function calculatePulkaTotals(pulkaOffset) {
  const totals = Array(state.players.length).fill(0);
  const gameRows = state.scoreRows.slice(pulkaOffset, pulkaOffset + 4);

  for (const row of gameRows) {
    for (let playerIndex = 0; playerIndex < totals.length; playerIndex += 1) {
      const entry = row.entries?.[playerIndex];

      if (entry && !entry.crossed) {
        totals[playerIndex] += entry.value;
      }
    }
  }

  return totals;
}

function calculatePulkaTotal(playerId, pulkaOffset) {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);
  return playerIndex === -1 ? 0 : calculatePulkaTotals(pulkaOffset)[playerIndex];
}''',
    "batch totals",
)

text = replace_section(
    text,
    "function finishMatch() {",
    "function scheduleGameTask(callback, delay) {",
    '''function finishMatch() {
  const matchTotals = calculateMatchTotals();
  let winnerIndex = 0;

  for (let playerIndex = 1; playerIndex < state.players.length; playerIndex += 1) {
    if (matchTotals[playerIndex] > matchTotals[winnerIndex]) {
      winnerIndex = playerIndex;
    }
  }

  const winner = state.players[winnerIndex];

  state.phase = "finished";
  state.busy = false;
  state.activePlayerId = null;
  state.leadPlayerId = null;
  state.currentTrick = [];
  state.collectingTrickWinnerSeat = null;
  state.winnerId = winner.id;
  showNotice(`Партия завершена. Победитель: ${winner.name}`);
  showEndGameDialog(winner);
  render();
}''',
    "finishMatch",
)

path.write_text(text, encoding="utf-8")

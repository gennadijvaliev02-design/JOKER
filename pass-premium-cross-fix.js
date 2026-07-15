(() => {
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

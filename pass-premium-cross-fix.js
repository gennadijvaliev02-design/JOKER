(() => {
  crossBestSuccessfulEntry = function noPassPremiumCross(gameRows, playerIndex) {
    const candidates = gameRows.slice(0, 3).flatMap((row, rowIndex) => {
      const entry = row.entries[playerIndex];
      const isPass = entry?.bidLabel === "-";

      return entry.fulfilled && !entry.crossed && !isPass ? [{ entry, rowIndex }] : [];
    });

    if (!candidates.length) {
      return;
    }

    candidates.sort((first, second) => {
      if (second.entry.value !== first.entry.value) {
        return second.entry.value - first.entry.value;
      }

      return first.rowIndex - second.rowIndex;
    });

    candidates[0].entry.crossed = true;
  };
})();

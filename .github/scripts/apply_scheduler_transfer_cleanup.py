from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old in text:
        file.write_text(text.replace(old, new, 1), encoding="utf-8")
    elif new not in text:
        raise SystemExit(f"Expected block not found in {path}")


replace_once(
    "script.js",
    "  timeoutIds: [],",
    "  timeoutIds: new Set(),",
)

replace_once(
    "script.js",
    '''function scheduleGameTask(callback, delay) {
  const timeoutId = window.setTimeout(() => {
    state.timeoutIds = state.timeoutIds.filter((id) => id !== timeoutId);
    callback();
  }, delay);

  state.timeoutIds.push(timeoutId);
  return timeoutId;
}

function clearGameTasks() {
  state.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  state.timeoutIds = [];
}
''',
    '''function scheduleGameTask(callback, delay) {
  const timeoutId = window.setTimeout(() => {
    state.timeoutIds.delete(timeoutId);
    callback();
  }, delay);

  state.timeoutIds.add(timeoutId);
  return timeoutId;
}

function clearGameTasks() {
  state.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  state.timeoutIds.clear();
}
''',
)

path = Path("android-deal-2026.js")
text = path.read_text(encoding="utf-8")
old = '''  function transferAllToHands(token) {
    clearNativeDealEffects();
    const promises = [];
    let globalIndex = 0;

    for (const seat of ["left", "top", "right", "bottom"]) {
      const records = stageCards[seat];
      const targets = seat === "bottom"
        ? new Map(humanNodes().map((node) => [node.dataset.card, node]))
        : opponentNodes(seat);

      records.forEach((record, index) => {
        const target = targetForRecord(record, targets, index);
        if (!target?.isConnected || !record.node?.isConnected) return;
        const end = transferTransform(target, seat);
        const delay = globalIndex * TRANSFER_STAGGER;
        globalIndex += 1;

        promises.push(new Promise((resolve) => {
          if (token !== activeToken || !record.node.isConnected) {
            resolve();
            return;
          }

          const animation = record.node.animate([
            { opacity: 1, transform: record.node.style.transform },
            { opacity: 1, transform: end },
            { opacity: 0.10, transform: end },
          ], {
            delay: safeDelay(delay),
            duration: safeDelay(TRANSFER_DURATION),
            easing: "cubic-bezier(.16,.82,.22,1)",
            fill: "both",
          });
          trackAnimation(animation, resolve);
        }));
      });
    }

    return Promise.all(promises).then(() => {
'''
new = '''  function transferAllToHands(token) {
    clearNativeDealEffects();
    const transferJobs = [];
    const humanTargetNodes = humanNodes();
    const humanTargetsById = new Map(humanTargetNodes.map((node) => [node.dataset.card, node]));
    let globalIndex = 0;

    // Read every target rectangle before starting any animation. This avoids
    // alternating layout reads and animation writes for up to 36 cards.
    for (const seat of ["left", "top", "right", "bottom"]) {
      const records = stageCards[seat];
      const targets = seat === "bottom" ? humanTargetsById : opponentNodes(seat);

      records.forEach((record, index) => {
        const target = record.seat === "bottom"
          ? (targets.get(record.cardId) || humanTargetNodes[index] || null)
          : (targets[index] || null);
        if (!target?.isConnected || !record.node?.isConnected) return;

        transferJobs.push({
          record,
          end: transferTransform(target, seat),
          delay: globalIndex * TRANSFER_STAGGER,
        });
        globalIndex += 1;
      });
    }

    const promises = transferJobs.map(({ record, end, delay }) => new Promise((resolve) => {
      if (token !== activeToken || !record.node.isConnected) {
        resolve();
        return;
      }

      const animation = record.node.animate([
        { opacity: 1, transform: record.node.style.transform },
        { opacity: 1, transform: end },
        { opacity: 0.10, transform: end },
      ], {
        delay: safeDelay(delay),
        duration: safeDelay(TRANSFER_DURATION),
        easing: "cubic-bezier(.16,.82,.22,1)",
        fill: "both",
      });
      trackAnimation(animation, resolve);
    }));

    return Promise.all(promises).then(() => {
'''
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit("transferAllToHands block not found")
path.write_text(text, encoding="utf-8")

index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = text.replace("script.js?v=31", "script.js?v=32")
index.write_text(text, encoding="utf-8")

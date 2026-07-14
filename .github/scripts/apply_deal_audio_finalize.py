from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old in text:
        file.write_text(text.replace(old, new, 1), encoding="utf-8")
    elif new not in text:
        raise SystemExit(f"Expected block not found in {path}")


replace_once(
    "sound-polish.js",
    '''  function getContext() {
    if (state.audioContext) {
      state.audioContext.resume?.().catch(() => {});
      return state.audioContext;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    state.audioContext = new AudioContext();
    state.audioContext.resume?.().catch(() => {});
    return state.audioContext;
  }
''',
    '''  function getContext() {
    if (state.audioContext) {
      if (state.audioContext.state === "suspended") {
        state.audioContext.resume?.().catch(() => {});
      }
      return state.audioContext;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    state.audioContext = new AudioContext();
    if (state.audioContext.state === "suspended") {
      state.audioContext.resume?.().catch(() => {});
    }
    return state.audioContext;
  }
''',
)

replace_once(
    "android-deal-2026.js",
    '''  function clearStageCards() {
    Object.values(stageCards).forEach((cards) => cards.splice(0).forEach((record) => record.node.remove()));
  }
''',
    '''  function clearStageCards() {
    Object.values(stageCards).forEach((cards) => {
      cards.length = 0;
    });
  }
''',
)

replace_once(
    "android-deal-2026.js",
    '''      record.node.animate([
        { transform: `${record.node.style.transform} rotateY(90deg)`, opacity: 0.72 },
        { transform: record.node.style.transform, opacity: 1 },
      ], {
        duration: safeDelay(PREVIEW_FLIP_DURATION),
        easing: "cubic-bezier(.2,.72,.22,1)",
      });
''',
    '''      const animation = record.node.animate([
        { transform: `${record.node.style.transform} rotateY(90deg)`, opacity: 0.72 },
        { transform: record.node.style.transform, opacity: 1 },
      ], {
        duration: safeDelay(PREVIEW_FLIP_DURATION),
        easing: "cubic-bezier(.2,.72,.22,1)",
      });
      trackAnimation(animation);
''',
)

replace_once(
    "android-deal-2026.js",
    '''      window.setTimeout(() => elements.table.classList.remove("is-deal-2026-revealing"), 430);
''',
    '''      scheduleGameTask(
        () => elements.table.classList.remove("is-deal-2026-revealing"),
        safeDelay(430),
      );
''',
)

index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = text.replace("sound-polish.js?v=9", "sound-polish.js?v=10")
index.write_text(text, encoding="utf-8")

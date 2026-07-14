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
    '''    oscillator.connect(gain);
    gain.connect(destination || ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
''',
    '''    oscillator.connect(gain);
    gain.connect(destination || ctx.destination);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
''',
)

replace_once(
    "sound-polish.js",
    '''    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(destination || ctx.destination);
    source.start(time, offset, duration);
    source.stop(time + duration + 0.02);
''',
    '''    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(destination || ctx.destination);
    source.addEventListener("ended", () => {
      source.disconnect();
      biquad.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start(time, offset, duration);
    source.stop(time + duration + 0.02);
''',
)

replace_once(
    "script.js",
    '''    window.setTimeout(() => {
      elements.table?.classList.remove("is-dealing");
    }, getDelay(5600));
''',
    '''    if (!window.__JOKER_ANDROID_DEAL_2026_STAGE__) {
      scheduleGameTask(() => {
        elements.table?.classList.remove("is-dealing");
      }, getDelay(5600));
    }
''',
)

replace_once(
    "trick-collect-animation.js",
    '''    window.setTimeout(() => {
      layer.remove();
      elements.table.classList.remove("is-trick-collecting");
    }, getDelay(COLLECT_ANIMATION_TIME + 180));
''',
    '''    scheduleGameTask(() => {
      layer.remove();
      elements.table.classList.remove("is-trick-collecting");
    }, getDelay(COLLECT_ANIMATION_TIME + 180));
''',
)

index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = text.replace("script.js?v=32", "script.js?v=33")
text = text.replace("trick-collect-animation.js?v=6", "trick-collect-animation.js?v=7")
text = text.replace("sound-polish.js?v=8", "sound-polish.js?v=9")
index.write_text(text, encoding="utf-8")

from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old in text:
        file.write_text(text.replace(old, new, 1), encoding="utf-8")
    elif new not in text:
        raise SystemExit(f"Expected block not found in {path}")


replace_once(
    "android-deal-2026.js",
    '''        window.setTimeout(() => {
          if (token !== activeToken) return;
          deck.remove();
          if (total === Math.min(3, handSize)) revealBottomPreview();
        }, safeDelay(flightEnd + 30));
''',
    '''        scheduleGameTask(() => {
          if (token !== activeToken) return;
          deck.remove();
          if (total === Math.min(3, handSize)) revealBottomPreview();
        }, safeDelay(flightEnd + 30));
''',
)

replace_once(
    "android-deal-2026.js",
    '''      window.setTimeout(() => {
        if (token !== activeToken) return;
        deck.remove();
        transferAllToHands(token);
      }, safeDelay(flightEnd + TRANSFER_DELAY));
''',
    '''      scheduleGameTask(() => {
        if (token !== activeToken) return;
        deck.remove();
        transferAllToHands(token);
      }, safeDelay(flightEnd + TRANSFER_DELAY));
''',
)

replace_once(
    "ace-deal-animation.js",
    '''    layer.replaceChildren(title, ...cards, winnerText);
    window.setTimeout(() => layer.remove(), getDelay(getAceDealDuration(aceDeal)));
''',
    '''    layer.replaceChildren(title, ...cards, winnerText);
    scheduleGameTask(() => layer.remove(), getDelay(getAceDealDuration(aceDeal)));
''',
)

replace_once(
    "android-ui-v11.css",
    '''  transition: opacity 160ms ease, transform 180ms ease !important;
}
''',
    '''  transition: opacity 160ms ease, transform 180ms ease !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
''',
)

index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = text.replace("ace-deal-animation.js?v=10", "ace-deal-animation.js?v=11")
index.write_text(text, encoding="utf-8")

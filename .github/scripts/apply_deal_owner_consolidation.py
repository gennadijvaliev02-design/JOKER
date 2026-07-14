from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old in text:
        file.write_text(text.replace(old, new, 1), encoding="utf-8")
    elif new not in text:
        raise SystemExit(f"Expected block not found in {path}")


# Android Deal 2026 owns its own visibility lifecycle. The base renderer must
# not add the legacy is-dealing class only to have it removed again.
replace_once(
    "script.js",
    '''  if (shouldAnimateDeal) {
    state.renderedDealAnimationKey = state.dealAnimationKey;
    elements.table?.classList.add("is-dealing");
    playCardDealAnimation(hand.length);
    if (!window.__JOKER_ANDROID_DEAL_2026_STAGE__) {
      scheduleGameTask(() => {
        elements.table?.classList.remove("is-dealing");
      }, getDelay(5600));
    }
  }
''',
    '''  if (shouldAnimateDeal) {
    state.renderedDealAnimationKey = state.dealAnimationKey;
    const usesAndroidDeal = Boolean(window.__JOKER_ANDROID_DEAL_2026_STAGE__);
    if (!usesAndroidDeal) elements.table?.classList.add("is-dealing");
    playCardDealAnimation(hand.length);
    if (!usesAndroidDeal) {
      scheduleGameTask(() => {
        elements.table?.classList.remove("is-dealing");
      }, getDelay(5600));
    }
  }
''',
)

path = Path("android-deal-2026.js")
text = path.read_text(encoding="utf-8")

# The transfer batching pass no longer calls this helper.
start = text.find("  function targetForRecord(record, seatTargets, index) {")
if start != -1:
    end = text.find("\n  function transferTransform", start)
    if end == -1:
        raise SystemExit("targetForRecord end marker not found")
    text = text[:start] + text[end:]

# Legacy owners are absent from the Android package. Clean stale artifacts once
# during installation, not before every three-card/final-card batch.
text = text.replace("  function removeLegacyArtifacts() {", "  function clearLegacyArtifactsOnce() {", 1)
text = text.replace(
    '''    elements?.table?.classList.remove(
      "is-dealing", "is-v11-dealing", "is-v12-dealing", "is-v13-dealing",
      "is-v14-dealing", "is-v18-dealing", "is-deal-2026-running",
    );
  }

  function resetDeal() {
''',
    '''    elements?.table?.classList.remove(
      "is-dealing", "is-v11-dealing", "is-v12-dealing", "is-v13-dealing",
      "is-v14-dealing", "is-v18-dealing", "is-deal-2026-running",
      "is-deal-2026-staging", "is-deal-2026-revealing",
    );
  }

  function resetDeal() {
''',
    1,
)
text = text.replace(
    '''    elements?.table?.classList.remove("is-deal-2026-staging");
    removeLegacyArtifacts();
  }
''',
    '''    elements?.table?.classList.remove("is-deal-2026-staging", "is-deal-2026-revealing");
  }
''',
    1,
)
text = text.replace("      removeLegacyArtifacts();\n      ensureLayer();", "      ensureLayer();", 1)

# Keep a single visibility-mask owner in Deal 2026.
old_mask = '''      .is-deal-2026-staging .hand .card,
      .is-deal-2026-staging .hidden-cards span {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        animation: none !important;
      }
      .is-deal-2026-revealing .hand .card,
      .is-deal-2026-revealing .hidden-cards span {
        animation: deal-2026-real-card-reveal 390ms cubic-bezier(.16,.82,.22,1) both !important;
      }
'''
new_mask = '''      .table.is-deal-2026-staging > .hand,
      .table.is-deal-2026-staging > .hidden-cards {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        animation: none !important;
        transition: none !important;
      }
      .table.is-deal-2026-staging > .hand *,
      .table.is-deal-2026-staging > .hidden-cards * {
        opacity: 0 !important;
        visibility: hidden !important;
        animation: none !important;
        transition: none !important;
      }
      .table.is-deal-2026-revealing > .hand,
      .table.is-deal-2026-revealing > .hidden-cards {
        opacity: 1 !important;
        visibility: visible !important;
      }
      .is-deal-2026-revealing .hand .card,
      .is-deal-2026-revealing .hidden-cards span {
        animation: deal-2026-real-card-reveal 390ms cubic-bezier(.16,.82,.22,1) both !important;
      }
'''
if old_mask in text:
    text = text.replace(old_mask, new_mask, 1)
elif new_mask not in text:
    raise SystemExit("Deal mask block not found")

text = text.replace(
    "        animation: deal-2026-deck-breathe 2.1s ease-in-out infinite alternate !important;\n",
    "",
    1,
)
keyframes = '''      @keyframes deal-2026-deck-breathe {
        from { transform: translate3d(-50%,-50%,0) rotate(-3deg) scale(.992); }
        to { transform: translate3d(-50%,-50%,0) rotate(1deg) scale(1.012); }
      }
'''
text = text.replace(keyframes, "", 1)

# Clear stale pre-cleanup classes once before the owner starts.
text = text.replace(
    '''    installed = true;
    injectStyles();
''',
    '''    installed = true;
    clearLegacyArtifactsOnce();
    injectStyles();
''',
    1,
)
path.write_text(text, encoding="utf-8")

# V15 now owns render caches only; remove its duplicate runtime style injection.
v15 = Path("android-v15.js")
text = v15.read_text(encoding="utf-8")
marker = '\n\n(() => {\n  "use strict";\n\n  /* Deal 2026 duplicate guard:'
start = text.find(marker)
if start != -1:
    text = text[:start].rstrip() + "\n"
elif "android-deal-container-mask-style" in text:
    raise SystemExit("V15 mask marker changed")
v15.write_text(text, encoding="utf-8")

index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = text.replace("script.js?v=33", "script.js?v=34")
index.write_text(text, encoding="utf-8")

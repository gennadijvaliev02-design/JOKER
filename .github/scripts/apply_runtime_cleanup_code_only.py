from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old in text:
        file.write_text(text.replace(old, new, 1), encoding="utf-8")
    elif new not in text:
        raise SystemExit(f"Expected block not found in {path}")


replace_once(
    "rules/rules-engine.js",
    '      .then(() => loadAdapter("rules/core-logic-fixes.js?v=1", "core-fixes"))\n'
    '      .then(() => loadAdapter("rules/deal-animation-adapter.js?v=2", "deal-animation"))\n'
    '      .then(() => loadAdapter("rules/bot-survival-priority.js?v=1", "bot-survival"))',
    '      .then(() => loadAdapter("rules/core-logic-fixes.js?v=1", "core-fixes"))\n'
    '      .then(() => {\n'
    '        if (window.__JOKER_ANDROID_DEAL_2026_STAGE__) return null;\n'
    '        return loadAdapter("rules/deal-animation-adapter.js?v=2", "deal-animation");\n'
    '      })\n'
    '      .then(() => loadAdapter("rules/bot-survival-priority.js?v=1", "bot-survival"))',
)

replace_once(
    "android-deal-2026.js",
    '  function install() {\n'
    '    if (installed) return;\n'
    '    if (\n'
    '      typeof playCardDealAnimation !== "function"\n'
    '      || typeof runAfterDealAnimation !== "function"\n'
    '      || typeof scheduleGameTask !== "function"\n'
    '      || typeof elements === "undefined"\n'
    '      || !elements.table\n'
    '      || !elements.playerHand\n'
    '    ) {\n'
    '      window.setTimeout(install, 80);\n'
    '      return;\n'
    '    }\n\n'
    '    installed = true;',
    '  function install() {\n'
    '    if (installed) return true;\n'
    '    if (\n'
    '      typeof playCardDealAnimation !== "function"\n'
    '      || typeof runAfterDealAnimation !== "function"\n'
    '      || typeof scheduleGameTask !== "function"\n'
    '      || typeof elements === "undefined"\n'
    '      || !elements.table\n'
    '      || !elements.playerHand\n'
    '    ) {\n'
    '      return false;\n'
    '    }\n\n'
    '    installed = true;',
)

replace_once(
    "android-deal-2026.js",
    '    runAfterDealAnimation = function runAfterAndroidStagingDeal(callback) {\n'
    '      if (state.autoPlay) {\n'
    '        callback();\n'
    '        return;\n'
    '      }\n'
    '      scheduleGameTask(callback, safeDelay(lastDuration + 80));\n'
    '    };\n'
    '  }\n\n'
    '  function scheduleInstall() {\n'
    '    window.setTimeout(install, 260);\n'
    '  }\n\n'
    '  window.addEventListener("joker-rules-adapters-ready", scheduleInstall, { once: true });\n'
    '  window.addEventListener("load", scheduleInstall, { once: true });\n'
    '  scheduleInstall();\n'
    '})();',
    '    runAfterDealAnimation = function runAfterAndroidStagingDeal(callback) {\n'
    '      if (state.autoPlay) {\n'
    '        callback();\n'
    '        return;\n'
    '      }\n'
    '      scheduleGameTask(callback, safeDelay(lastDuration + 80));\n'
    '    };\n\n'
    '    return true;\n'
    '  }\n\n'
    '  window.addEventListener("joker-rules-adapters-ready", install, { once: true });\n'
    '  window.addEventListener("load", install, { once: true });\n'
    '  if (document.documentElement.dataset.rulesReady === "true") install();\n'
    '})();',
)

high_joker = Path("high-joker-legal-fix.js")
text = high_joker.read_text(encoding="utf-8")
marker = "\n  const originalRender = render;"
if marker in text:
    start = text.index(marker)
    end = text.index("\n})();", start)
    high_joker.write_text(text[:start] + text[end:], encoding="utf-8")

replace_once(
    "android-runtime-polish.js",
    '        setText(view.orderBadge, String(player.order));\n'
    '        setText(view.order, String(player.order));',
    '        setText(view.orderBadge, String(player.order));\n'
    '        if (view.orderBadge) {\n'
    '          const orderVisibility = state.phase === "ace-deal" ? "hidden" : "visible";\n'
    '          if (view.orderBadge.style.visibility !== orderVisibility) {\n'
    '            view.orderBadge.style.visibility = orderVisibility;\n'
    '          }\n'
    '        }\n'
    '        setText(view.order, String(player.order));',
)

replace_once(
    "android-runtime-v2.js",
    '  document.addEventListener("pointerup", () => {\n'
    '    if (selectionTimer) window.clearTimeout(selectionTimer);\n'
    '    selectionTimer = window.setTimeout(clearTouchSelection, 130);\n'
    '  }, { passive: true });',
    '  document.addEventListener("pointerup", () => {\n'
    '    if (!selectedCard) return;\n'
    '    if (selectionTimer) window.clearTimeout(selectionTimer);\n'
    '    selectionTimer = window.setTimeout(clearTouchSelection, 130);\n'
    '  }, { passive: true });',
)

index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = text.replace("rules/rules-engine.js?v=7", "rules/rules-engine.js?v=8")
text = text.replace("high-joker-legal-fix.js?v=4", "high-joker-legal-fix.js?v=5")
index.write_text(text, encoding="utf-8")

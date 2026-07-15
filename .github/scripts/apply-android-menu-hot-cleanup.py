from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match in {path}, found {count}: {old[:80]!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


# Android menu transitions: one paint is enough; a second forced paint only delays the tap response.
replace_once(
    "difficulty-select.js",
    '  function afterNextPaint() {\n    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));\n  }',
    '  function afterNextPaint() {\n    return new Promise((resolve) => requestAnimationFrame(resolve));\n  }',
)

# Never restart the decorative fan while the table is already taking over the screen.
replace_once(
    "difficulty-select.js",
    '    const playState = openMenuOverlays.size ? "paused" : "running";',
    '    const playState = openMenuOverlays.size || startScreen.classList.contains("is-hidden")\n      ? "paused"\n      : "running";',
)

# Touch navigation does not need programmatic focus. Removing it avoids synchronous layout work in Android WebView.
replace_once(
    "difficulty-select.js",
    '''    requestAnimationFrame(() => {\n      overlay.classList.add("is-visible");\n      requestAnimationFrame(() => {\n        choices\n          .find((button) => button.dataset.aiDifficultyChoice === getCurrentDifficulty())\n          ?.focus?.({ preventScroll: true });\n      });\n    });''',
    '    requestAnimationFrame(() => overlay.classList.add("is-visible"));',
)
replace_once(
    "difficulty-select.js",
    '  function closeDifficultyDialog(restoreFocus = true, immediate = false) {',
    '  function closeDifficultyDialog(immediate = false) {',
)
replace_once(
    "difficulty-select.js",
    '      if (restoreFocus) requestAnimationFrame(() => startButton.focus?.({ preventScroll: true }));\n',
    '',
)
replace_once(
    "difficulty-select.js",
    '    closeDifficultyDialog(false, true);',
    '    closeDifficultyDialog(true);',
)
replace_once(
    "difficulty-select.js",
    '  backButton.addEventListener("click", () => closeDifficultyDialog(true));',
    '  backButton.addEventListener("click", () => closeDifficultyDialog());',
)
replace_once(
    "difficulty-select.js",
    '      closeDifficultyDialog(true);',
    '      closeDifficultyDialog();',
)
replace_once(
    "difficulty-select.js",
    '      closeDifficultyDialog(true);',
    '      closeDifficultyDialog();',
)

# Keep menu decoration paused until startGame has synchronously hidden the menu.
replace_once(
    "difficulty-select.js",
    '    setStartingState(true);\n    setDifficulty(value);',
    '    setStartingState(true);\n    setMenuOverlayOpen("game-start", true);\n    setDifficulty(value);',
)
replace_once(
    "difficulty-select.js",
    '''    if (typeof window.startGame === "function") {\n      window.startGame();\n      return;\n    }\n\n    console.warn("Difficulty selector could not find startGame()");''',
    '''    if (typeof window.startGame === "function") {\n      window.startGame();\n      setMenuOverlayOpen("game-start", false);\n      return;\n    }\n\n    setMenuOverlayOpen("game-start", false);\n    console.warn("Difficulty selector could not find startGame()");''',
)

replace_once(
    "rules/rules-select.js",
    '''    requestAnimationFrame(() => {\n      overlay.classList.add("is-visible");\n      requestAnimationFrame(() => {\n        choices\n          .find((button) => button.dataset.rulesModeChoice === window.JokerRules.activeId)\n          ?.focus?.({ preventScroll: true });\n      });\n    });''',
    '    requestAnimationFrame(() => overlay.classList.add("is-visible"));',
)
replace_once(
    "rules/rules-select.js",
    '  function closeRulesDialog({ restoreFocus = true, immediate = false } = {}) {',
    '  function closeRulesDialog({ immediate = false } = {}) {',
)
replace_once(
    "rules/rules-select.js",
    '      if (restoreFocus) requestAnimationFrame(() => startButton.focus?.({ preventScroll: true }));\n',
    '',
)
replace_once(
    "rules/rules-select.js",
    '    closeRulesDialog({ restoreFocus: false, immediate: true });',
    '    closeRulesDialog({ immediate: true });',
)

# Decode fewer local card images at once so Android WebView does not get a six-image CPU burst during menu use.
replace_once(
    "preload.js",
    '  const PRELOAD_CONCURRENCY = 6;',
    '  const PRELOAD_CONCURRENCY = 2;',
)

# Keep the Android source audit aligned with the optimized preload and menu behavior.
workflow = Path(".github/workflows/android-apk.yml")
workflow_text = workflow.read_text(encoding="utf-8")
if workflow_text.count("PRELOAD_CONCURRENCY = 6") != 2:
    raise SystemExit("Expected two Android preload guards")
workflow_text = workflow_text.replace("PRELOAD_CONCURRENCY = 6", "PRELOAD_CONCURRENCY = 2")
anchor = "          grep -q 'PRELOAD_CONCURRENCY = 2' preload.js\n"
source_guards = (
    anchor
    + "          ! grep -q '\\.focus' difficulty-select.js\n"
    + "          ! grep -q '\\.focus' rules/rules-select.js\n"
    + "          grep -q 'setMenuOverlayOpen(\"game-start\", true)' difficulty-select.js\n"
)
if workflow_text.count(anchor) != 1:
    raise SystemExit("Expected one source preload guard anchor")
workflow_text = workflow_text.replace(anchor, source_guards, 1)
www_anchor = "          grep -q 'PRELOAD_CONCURRENCY = 2' www/preload.js\n"
www_guards = (
    www_anchor
    + "          ! grep -q '\\.focus' www/difficulty-select.js\n"
    + "          ! grep -q '\\.focus' www/rules/rules-select.js\n"
    + "          grep -q 'setMenuOverlayOpen(\"game-start\", true)' www/difficulty-select.js\n"
)
if workflow_text.count(www_anchor) != 1:
    raise SystemExit("Expected one packaged preload guard anchor")
workflow_text = workflow_text.replace(www_anchor, www_guards, 1)
workflow.write_text(workflow_text, encoding="utf-8")

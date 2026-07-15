from pathlib import Path
import re

ROOT = Path('.')


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content.rstrip() + '\n', encoding='utf-8')


def extract_template(source: str, pattern: str, label: str) -> str:
    match = re.search(pattern, source, re.S)
    if not match:
        raise SystemExit(f'Could not extract {label}')
    return match.group(1).strip()


runtime_v11 = read('android-runtime-v11.js')
v13_css = extract_template(
    runtime_v11,
    r'const V13_CSS = String\.raw`(.*?)`;\n\n  if \(!document\.getElementById\("android-v13-style"\)\)',
    'Android V13 CSS',
)
write('android-runtime-v13.css', '/* Static replacement for the former android-runtime-v11.js style injector. */\n' + v13_css)

v14_source = read('android-v14.js')
v14_css = extract_template(
    v14_source,
    r'const V14_CSS = String\.raw`(.*?)`;\n\n  if \(!document\.getElementById\("android-v14-style"\)\)',
    'Android V14 CSS',
)
write('android-v14.css', '/* Static replacement for the former android-v14.js style injector. */\n' + v14_css)

deal_path = ROOT / 'android-deal-2026.js'
deal_source = deal_path.read_text(encoding='utf-8')
deal_block = re.search(
    r'\n  function injectStyles\(\) \{(.*?)\n  \}\n\n  function install\(\)',
    deal_source,
    re.S,
)
if not deal_block:
    raise SystemExit('Could not find Deal 2026 injectStyles() block')

deal_css = extract_template(
    deal_block.group(1),
    r'style\.textContent = `(.*?)`;\n    document\.head\.append\(style\);',
    'Deal 2026 CSS',
)
write('android-deal-2026.css', '/* Static Deal 2026 styles; previously parsed and injected at runtime. */\n' + deal_css)

deal_source = deal_source[:deal_block.start()] + '\n\n  function install()' + deal_source[deal_block.end():]
deal_source = deal_source.replace('    injectStyles();\n', '')
if 'function injectStyles' in deal_source or 'android-deal-2026-stage-style' in deal_source:
    raise SystemExit('Deal 2026 runtime style injector was not fully removed')
deal_path.write_text(deal_source, encoding='utf-8')

workflow_path = ROOT / '.github/workflows/android-apk.yml'
workflow = workflow_path.read_text(encoding='utf-8')

old_runtime_sequence = (
    '<script src="android-joker-v10.js?v=2"></script>\\n'
    '    <script src="android-runtime-v11.js?v=5"></script>\\n'
    '    <script src="android-v12.js?v=4"></script>\\n'
    '    <script src="android-v14.js?v=3"></script>\\n'
    '    <script src="android-v15.js?v=5"></script>\\n'
    '    <script src="android-deal-2026.js?v=20260715-2"></script>'
)
new_runtime_sequence = (
    '<script src="android-joker-v10.js?v=2"></script>\\n'
    '    <link rel="stylesheet" href="android-runtime-v13.css?v=1" />\\n'
    '    <script src="android-v12.js?v=4"></script>\\n'
    '    <link rel="stylesheet" href="android-v14.css?v=1" />\\n'
    '    <script src="android-v15.js?v=5"></script>\\n'
    '    <link rel="stylesheet" href="android-deal-2026.css?v=1" />\\n'
    '    <script src="android-deal-2026.js?v=20260715-3"></script>'
)
if old_runtime_sequence not in workflow:
    raise SystemExit('Android runtime script sequence changed unexpectedly')
workflow = workflow.replace(old_runtime_sequence, new_runtime_sequence, 1)

line_replacements = {
    "          ! grep -q 'MutationObserver' android-runtime-v11.js\n": "          test ! -e android-runtime-v11.js\n          test -s android-runtime-v13.css\n",
    "          ! grep -q 'installHudHook' android-runtime-v11.js\n": "",
    "          grep -q 'android-runtime-v11.js?v=5' www/index.html\n": "          grep -q 'android-runtime-v13.css?v=1' www/index.html\n          grep -q 'android-v14.css?v=1' www/index.html\n          grep -q 'android-deal-2026.css?v=1' www/index.html\n",
    "          grep -q 'android-deal-2026.js?v=20260715-2' www/index.html\n": "          grep -q 'android-deal-2026.js?v=20260715-3' www/index.html\n",
    "          ! grep -q 'MutationObserver' www/android-runtime-v11.js\n": "          test ! -e www/android-runtime-v11.js\n          test -s www/android-runtime-v13.css\n          test ! -e www/android-v14.js\n          test -s www/android-v14.css\n          test -s www/android-deal-2026.css\n",
    "          ! grep -q 'installHudHook' www/android-runtime-v11.js\n": "",
    "          ! grep -q 'playCardDealAnimation' www/android-v14.js\n": "",
    "          ! grep -q 'runAfterDealAnimation' www/android-v14.js\n": "",
    "          ! grep -q 'deal-2026-deck-breathe' www/android-deal-2026.js\n": "          ! grep -q 'deal-2026-deck-breathe' www/android-deal-2026.js\n          ! grep -q 'function injectStyles' www/android-deal-2026.js\n          ! grep -q 'android-deal-2026-stage-style' www/android-deal-2026.js\n",
}
for old, new in line_replacements.items():
    if old not in workflow:
        raise SystemExit(f'Workflow guard not found: {old.strip()}')
    workflow = workflow.replace(old, new, 1)

# Add source-level guards for files that no longer belong in the runtime.
source_anchor = "          test ! -e android-runtime-v11.js\n          test -s android-runtime-v13.css\n"
source_extra = (
    source_anchor
    + "          test ! -e android-v14.js\n"
    + "          test -s android-v14.css\n"
    + "          test -s android-deal-2026.css\n"
    + "          ! grep -q 'function injectStyles' android-deal-2026.js\n"
)
workflow = workflow.replace(source_anchor, source_extra, 1)

# Ensure removed runtime scripts cannot silently return to final HTML.
html_guard_anchor = "          ! grep -q 'android-v17.js' www/index.html\n"
html_guards = (
    html_guard_anchor
    + "          ! grep -q 'android-runtime-v11.js' www/index.html\n"
    + "          ! grep -q 'android-v14.js' www/index.html\n"
)
workflow = workflow.replace(html_guard_anchor, html_guards, 1)
workflow_path.write_text(workflow, encoding='utf-8')

(ROOT / 'android-runtime-v11.js').unlink()
(ROOT / 'android-v14.js').unlink()

# The migration tooling is intentionally one-use and must not remain in the product branch.
(ROOT / '.github/scripts/migrate-android-runtime-css.py').unlink()
(ROOT / '.github/workflows/apply-android-runtime-css-migration.yml').unlink()

print('Android runtime CSS migration completed.')

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


def stylesheet_loader(style_id: str, href: str, comment: str) -> str:
    return f'''(() => {{
  "use strict";

  /* {comment} */
  if (document.getElementById("{style_id}")) return;
  const link = document.createElement("link");
  link.id = "{style_id}";
  link.rel = "stylesheet";
  link.href = "{href}";
  document.head.append(link);
}})();
'''


runtime_v11 = read('android-runtime-v11.js')
v13_css = extract_template(
    runtime_v11,
    r'const V13_CSS = String\.raw`(.*?)`;\n\n  if \(!document\.getElementById\("android-v13-style"\)\)',
    'Android V13 CSS',
)
write('android-runtime-v13.css', '/* Extracted from the former runtime style template. */\n' + v13_css)
write(
    'android-runtime-v11.js',
    stylesheet_loader(
        'android-runtime-v13-stylesheet',
        'android-runtime-v13.css?v=1',
        'Load static V13 styles without parsing a large CSS template as JavaScript.',
    ),
)

v14_source = read('android-v14.js')
v14_css = extract_template(
    v14_source,
    r'const V14_CSS = String\.raw`(.*?)`;\n\n  if \(!document\.getElementById\("android-v14-style"\)\)',
    'Android V14 CSS',
)
write('android-v14.css', '/* Extracted from the former runtime style template. */\n' + v14_css)
write(
    'android-v14.js',
    stylesheet_loader(
        'android-v14-stylesheet',
        'android-v14.css?v=1',
        'Load static V14 styles without parsing a CSS template as JavaScript.',
    ),
)

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
write('android-deal-2026.css', '/* Extracted from the former Deal 2026 runtime style template. */\n' + deal_css)

static_loader = '''
  function ensureDealStylesheet() {
    if (document.getElementById("android-deal-2026-stylesheet")) return;
    const link = document.createElement("link");
    link.id = "android-deal-2026-stylesheet";
    link.rel = "stylesheet";
    link.href = "android-deal-2026.css?v=1";
    document.head.append(link);
  }

  ensureDealStylesheet();

  function install()'''

deal_source = deal_source[:deal_block.start()] + static_loader + deal_source[deal_block.end():]
deal_source = deal_source.replace('    injectStyles();\n', '')
if 'function injectStyles' in deal_source or 'style.textContent = `' in deal_source:
    raise SystemExit('Deal 2026 runtime CSS template was not fully removed')
deal_path.write_text(deal_source, encoding='utf-8')

print('Android runtime CSS extraction completed.')

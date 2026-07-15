from pathlib import Path
import re

symbols = ("renderHand", "renderTrick")
lines = []
for symbol in symbols:
    lines.append(f"[{symbol}]")
    for path in sorted(Path('.').rglob('*.js')):
        source = path.read_text(encoding='utf-8')
        for number, line in enumerate(source.splitlines(), 1):
            if path.name != 'script.js' and re.search(rf'\b{symbol}\s*=', line):
                lines.append(f"{path}:{number}: {line.strip()}")
    lines.append("")

script = Path('script.js').read_text(encoding='utf-8')
lines.extend([
    '[markers]',
    f'renderHandDecl={script.count("function renderHand() {")}',
    f'renderTrickDecl={script.count("function renderTrick() {")}',
    f'handReplace={script.count("elements.playerHand.replaceChildren(")}',
    f'trickReplace={script.count("elements.playedCardSlot.replaceChildren(")}',
])
Path('card-render-owner-audit.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')

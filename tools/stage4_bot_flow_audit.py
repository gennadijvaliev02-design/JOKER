from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path('.')
EXCLUDED = {'.git', 'node_modules', 'android', 'www', 'tools'}
CRITICAL = [
    'continueBotTurns', 'playBotTurn', 'playCard', 'submitBid',
    'processBiddingTurns', 'chooseBotCard', 'chooseBotBid', 'chooseBotTrump',
    'chooseJokerMode', 'chooseLeadJokerAction', 'scheduleGameTask',
    'render', 'showNotice', 'hideNotice', 'startPlayingCurrentGame',
]
CALLS = [
    'playCard(', 'submitBid(', 'chooseBotCard(', 'chooseBotBid(',
    'chooseBotTrump(', 'chooseJokerMode(', 'chooseLeadJokerAction(',
    'scheduleGameTask(', 'continueBotTurns(', 'processBiddingTurns(',
    'showNotice(', 'render(',
]
MUTATIONS = [
    'state.hands', 'state.currentTrick', 'state.activePlayerId', 'state.phase',
    'state.busy', '.bid =', '.tricks =', '.jokersPlayed',
]
BOT_HINTS = ('bot', 'medium', 'smart', 'joker-save', 'trump-counting', 'player-goal', 'leader-pressure', 'endgame')

def js_files() -> list[Path]:
    result = []
    for path in ROOT.rglob('*.js'):
        if any(part in EXCLUDED for part in path.parts):
            continue
        result.append(path)
    return sorted(result)

def line_no(text: str, offset: int) -> int:
    return text.count('\n', 0, offset) + 1

files = js_files()
owners = {name: [] for name in CRITICAL}
call_sites = {name: [] for name in CALLS}
direct_bot_mutations = []
async_sites = []

owner_patterns = {
    name: [
        re.compile(rf'\bfunction\s+{re.escape(name)}\s*\('),
        re.compile(rf'\b(?:window\.)?{re.escape(name)}\s*=\s*function\b'),
        re.compile(rf'\b(?:window\.)?{re.escape(name)}\s*=\s*\([^)]*\)\s*=>'),
    ]
    for name in CRITICAL
}

for path in files:
    text = path.read_text(encoding='utf-8')
    for name, patterns in owner_patterns.items():
        for pattern in patterns:
            for match in pattern.finditer(text):
                owners[name].append({'file': str(path), 'line': line_no(text, match.start())})
    for call in CALLS:
        start = 0
        while True:
            index = text.find(call, start)
            if index < 0:
                break
            call_sites[call].append({'file': str(path), 'line': line_no(text, index)})
            start = index + len(call)
    lowered = str(path).lower()
    if any(hint in lowered for hint in BOT_HINTS):
        for mutation in MUTATIONS:
            start = 0
            while True:
                index = text.find(mutation, start)
                if index < 0:
                    break
                direct_bot_mutations.append({
                    'file': str(path), 'line': line_no(text, index), 'token': mutation,
                })
                start = index + len(mutation)
    for token in ('setTimeout(', 'setInterval(', 'requestAnimationFrame(', 'scheduleGameTask('):
        start = 0
        while True:
            index = text.find(token, start)
            if index < 0:
                break
            async_sites.append({'file': str(path), 'line': line_no(text, index), 'token': token})
            start = index + len(token)

report = {
    'files_scanned': len(files),
    'critical_owners': owners,
    'call_sites': call_sites,
    'direct_bot_mutations': direct_bot_mutations,
    'async_sites': async_sites,
}
Path('stage4-bot-flow-audit.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8'
)
print(f'Scanned {len(files)} JavaScript files')
print('Owners:')
for name, entries in owners.items():
    print(f'  {name}: {entries}')
print(f'Direct bot mutations: {len(direct_bot_mutations)}')
for item in direct_bot_mutations:
    print(f"  {item['file']}:{item['line']} {item['token']}")
print(f'Async sites: {len(async_sites)}')

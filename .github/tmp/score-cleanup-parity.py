import copy
import random

PLAYER_COUNT = 4


def sync_old(row):
    row["cells"] = [f'{entry["bidLabel"]} {entry["scoreLabel"]}' for entry in row["entries"]]
    row["values"] = [0 if entry["crossed"] else entry["value"] for entry in row["entries"]]


def sync_new(row):
    cells = [None] * len(row["entries"])
    values = [None] * len(row["entries"])
    for index, entry in enumerate(row["entries"]):
        cells[index] = f'{entry["bidLabel"]} {entry["scoreLabel"]}'
        values[index] = 0 if entry["crossed"] else entry["value"]
    row["cells"] = cells
    row["values"] = values


def cross_old(rows, player_index):
    candidates = []
    for row_index, row in enumerate(rows[:3]):
        entry = row["entries"][player_index]
        if entry["fulfilled"] and not entry["crossed"] and entry["bidLabel"] != "-":
            candidates.append((entry, row_index))
    candidates.sort(key=lambda item: (-item[0]["value"], item[1]))
    if candidates:
        candidates[0][0]["crossed"] = True


def cross_new(rows, player_index):
    best = None
    for row in rows[:3]:
        entry = row["entries"][player_index]
        if not entry["fulfilled"] or entry["crossed"] or entry["bidLabel"] == "-":
            continue
        if best is None or entry["value"] > best["value"]:
            best = entry
    if best is not None:
        best["crossed"] = True


def apply_old(rows):
    premium = []
    for player_index in range(PLAYER_COUNT):
        entries = [row["entries"][player_index] for row in rows]
        if not all(entry["fulfilled"] for entry in entries):
            continue
        bonus = max(entry["value"] for entry in entries[:3])
        last = entries[3]
        last["value"] += bonus
        last["scoreLabel"] = str(last["value"])
        last["premium"] = True
        premium.append(player_index)
    if premium:
        for player_index in range(PLAYER_COUNT):
            if player_index not in premium:
                cross_old(rows, player_index)
    for row in rows:
        sync_old(row)


def apply_new(rows):
    premium = set()
    for player_index in range(PLAYER_COUNT):
        entries = [row["entries"][player_index] for row in rows]
        if not all(entry["fulfilled"] for entry in entries):
            continue
        bonus = entries[0]["value"]
        for entry_index in range(1, 3):
            bonus = max(bonus, entries[entry_index]["value"])
        last = entries[3]
        last["value"] += bonus
        last["scoreLabel"] = str(last["value"])
        last["premium"] = True
        premium.add(player_index)
    if premium:
        for player_index in range(PLAYER_COUNT):
            if player_index not in premium:
                cross_new(rows, player_index)
    for row in rows:
        sync_new(row)


def random_entry():
    value = random.choice([-500, -250, 10, 20, 30, 40, 50, 100, 150, 200, 250, 300, 350, 400, 450, 900])
    return {
        "bidLabel": random.choice(["-", "1", "2", "3", "4", "5", "6", "7", "8", "9"]),
        "scoreLabel": str(value),
        "value": value,
        "fulfilled": random.choice([True, False]),
        "crossed": False,
        "premium": False,
    }


def match_old(rows, player_index):
    total = 0
    for row in rows:
        if row["type"] != "game":
            continue
        if row.get("entries") is not None:
            entry = row["entries"][player_index]
            total += entry["value"] if entry and not entry["crossed"] else 0
        else:
            values = row.get("values")
            total += (values[player_index] if values else 0) or 0
    return total


def match_new(rows):
    totals = [0] * PLAYER_COUNT
    for row in rows:
        if row["type"] != "game":
            continue
        for player_index in range(PLAYER_COUNT):
            if row.get("entries") is not None:
                entry = row["entries"][player_index]
                if entry and not entry["crossed"]:
                    totals[player_index] += entry["value"]
                continue
            values = row.get("values")
            totals[player_index] += (values[player_index] if values else 0) or 0
    return totals


def pulka_old(rows, offset, player_index):
    total = 0
    for row in rows[offset:offset + 4]:
        entries = row.get("entries")
        entry = entries[player_index] if entries else None
        total += entry["value"] if entry and not entry["crossed"] else 0
    return total


def pulka_new(rows, offset):
    totals = [0] * PLAYER_COUNT
    for row in rows[offset:offset + 4]:
        for player_index in range(PLAYER_COUNT):
            entries = row.get("entries")
            entry = entries[player_index] if entries else None
            if entry and not entry["crossed"]:
                totals[player_index] += entry["value"]
    return totals


for _ in range(30000):
    rows = [{"entries": [random_entry() for _ in range(PLAYER_COUNT)]} for _ in range(4)]
    old_rows = copy.deepcopy(rows)
    new_rows = copy.deepcopy(rows)
    apply_old(old_rows)
    apply_new(new_rows)
    assert old_rows == new_rows

    score_rows = []
    for row_index in range(25):
        if row_index % 5 == 4:
            score_rows.append({"type": "total"})
        elif random.choice([True, False]):
            entries = [random_entry() for _ in range(PLAYER_COUNT)]
            for entry in entries:
                entry["crossed"] = random.choice([True, False])
            score_rows.append({"type": "game", "entries": entries})
        else:
            score_rows.append({"type": "game", "values": random.choice([None, [random.randint(-500, 900) for _ in range(PLAYER_COUNT)]])})

    assert [match_old(score_rows, index) for index in range(PLAYER_COUNT)] == match_new(score_rows)
    offset = random.choice([0, 5, 10, 15, 20])
    assert [pulka_old(score_rows, offset, index) for index in range(PLAYER_COUNT)] == pulka_new(score_rows, offset)

    totals = [random.randint(-2000, 5000) for _ in range(PLAYER_COUNT)]
    old_winner = sorted(range(PLAYER_COUNT), key=lambda index: -totals[index])[0]
    new_winner = 0
    for index in range(1, PLAYER_COUNT):
        if totals[index] > totals[new_winner]:
            new_winner = index
    assert old_winner == new_winner

print("score cleanup parity tests passed")

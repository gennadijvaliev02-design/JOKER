from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)


def replace_section(text, start_marker, end_marker, new_block, label):
    if text.count(start_marker) != 1 or text.count(end_marker) != 1:
        raise SystemExit(f"{label}: marker mismatch")
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + new_block.rstrip() + "\n\n" + text[end:]


render_players = []
render_stacks = []
for path in Path(".").rglob("*.js"):
    source = path.read_text(encoding="utf-8")
    if path.name != "script.js" and re.search(r"\brenderPlayers\s*=", source):
        render_players.append(str(path))
    if path.name != "script.js" and re.search(r"\brenderOpponentCardStacks\s*=", source):
        render_stacks.append(str(path))

if render_players != ["android-runtime-polish.js"]:
    raise SystemExit(f"Unexpected renderPlayers owners: {render_players}")
if render_stacks != ["android-opponent-hands.js"]:
    raise SystemExit(f"Unexpected renderOpponentCardStacks owners: {render_stacks}")

script_path = Path("script.js")
script = script_path.read_text(encoding="utf-8")
marker = '''  gameDialogActions: document.querySelector("#game-dialog-actions"),
};'''
cache_block = '''  gameDialogActions: document.querySelector("#game-dialog-actions"),
};

const PLAYER_SEATS = ["left", "top", "right", "bottom"];
const OPPONENT_SEATS = ["left", "top", "right"];
const playerViewsBySeat = Object.fromEntries(
  PLAYER_SEATS.map((seat) => {
    const avatar = document.querySelector(`[data-seat="${seat}"]`);
    const currentEmotion = avatar?.querySelector(":scope > .avatar-emotion") || null;
    let avatarInitial = avatar?.querySelector(":scope > .avatar-initial") || null;

    if (avatar && !avatarInitial) {
      const initialText = avatar.textContent.trim().slice(0, 1);
      avatarInitial = document.createElement("span");
      avatarInitial.className = "avatar-initial";
      avatarInitial.textContent = initialText;
      avatar.replaceChildren(avatarInitial);
      if (currentEmotion) avatar.append(currentEmotion);
    }

    const taken = document.querySelector(`[data-taken="${seat}"]`);
    return [
      seat,
      {
        avatar,
        avatarInitial,
        playerElement: avatar?.closest(".player") || null,
        name: document.querySelector(`[data-name="${seat}"]`),
        orderBadge: document.querySelector(`[data-order-badge="${seat}"]`),
        order: document.querySelector(`[data-order="${seat}"]`),
        bid: document.querySelector(`[data-bid="${seat}"]`),
        taken,
        stats: taken?.closest(".player-stats") || null,
      },
    ];
  }),
);
const opponentStacksBySeat = Object.fromEntries(
  OPPONENT_SEATS.map((seat) => [seat, document.querySelector(`.${seat}-stack`)]),
);
const lastPlayerRenderSignatures = Object.create(null);

function setElementText(element, text) {
  if (element && element.textContent !== text) {
    element.textContent = text;
  }
}

function getPlayerRenderSignature(player) {
  const handCount = state.hands[player.id]?.length || 0;
  const isActivePlayer = player.id === state.activePlayerId && state.phase === "playing";
  const isThinking = isActivePlayer && state.busy && player.id !== "human";

  return [
    player.name,
    player.seat,
    player.order,
    player.bid ?? "null",
    player.tricks,
    handCount,
    state.phase,
    isActivePlayer ? 1 : 0,
    isThinking ? 1 : 0,
  ].join("|");
}'''
script = replace_once(script, marker, cache_block, "DOM cache insertion")

old_render = '''function renderPlayers() {
  for (const player of state.players) {
    const avatar = document.querySelector(`[data-seat="${player.seat}"]`);
    const playerElement = avatar?.closest(".player");
    const name = document.querySelector(`[data-name="${player.seat}"]`);
    const orderBadge = document.querySelector(`[data-order-badge="${player.seat}"]`);
    const order = document.querySelector(`[data-order="${player.seat}"]`);
    const bid = document.querySelector(`[data-bid="${player.seat}"]`);
    const taken = document.querySelector(`[data-taken="${player.seat}"]`);
    const stats = taken?.closest(".player-stats");

    name.textContent = player.seat === "bottom" ? "Ты" : player.name;
    const currentEmotion = avatar.querySelector(".avatar-emotion");
    const avatarInitial = document.createElement("span");
    avatarInitial.className = "avatar-initial";
    avatarInitial.textContent = player.name.slice(0, 1).toUpperCase();
    avatar.replaceChildren(avatarInitial);
    if (currentEmotion) {
      avatar.append(currentEmotion);
    }
    orderBadge.textContent = String(player.order);
    order.textContent = String(player.order);
    bid.textContent = formatBid(player.bid);
    bid.classList.toggle("is-pass", player.bid === "pass");
    taken.textContent = String(player.tricks);
    taken.classList.toggle("is-danger", isBidBroken(player));
    stats?.classList.toggle("is-fulfilled", isBidFulfilledNow(player));
    const isActivePlayer = player.id === state.activePlayerId && state.phase === "playing";
    playerElement?.classList.toggle("is-active", isActivePlayer);
    playerElement?.classList.toggle("is-thinking", isActivePlayer && state.busy && player.id !== "human");
  }
}'''
new_render = '''function renderPlayers() {
  for (const player of state.players) {
    const view = playerViewsBySeat[player.seat];

    if (!view?.avatar) {
      continue;
    }

    const signature = getPlayerRenderSignature(player);
    if (lastPlayerRenderSignatures[player.seat] === signature) {
      continue;
    }
    lastPlayerRenderSignatures[player.seat] = signature;

    setElementText(view.name, player.seat === "bottom" ? "Ты" : player.name);
    setElementText(view.avatarInitial, player.name.slice(0, 1).toUpperCase());
    setElementText(view.orderBadge, String(player.order));
    setElementText(view.order, String(player.order));
    setElementText(view.bid, formatBid(player.bid));
    setElementText(view.taken, String(player.tricks));

    view.bid?.classList.toggle("is-pass", player.bid === "pass");
    view.taken?.classList.toggle("is-danger", isBidBroken(player));
    view.stats?.classList.toggle("is-fulfilled", isBidFulfilledNow(player));

    const isActivePlayer = player.id === state.activePlayerId && state.phase === "playing";
    view.playerElement?.classList.toggle("is-active", isActivePlayer);
    view.playerElement?.classList.toggle("is-thinking", isActivePlayer && state.busy && player.id !== "human");
  }
}'''
script = replace_once(script, old_render, new_render, "renderPlayers")

old_stacks = '''function renderOpponentCardStacks() {
  for (const seat of ["left", "top", "right"]) {
    const player = state.players.find((candidate) => candidate.seat === seat);
    const stack = document.querySelector(`.${seat}-stack`);

    if (!stack) {
      continue;
    }

    const cardCount = player ? state.hands[player.id]?.length || 0 : 0;
    stack.replaceChildren(...Array.from({ length: cardCount }, () => document.createElement("span")));
  }
}'''
new_stacks = '''function renderOpponentCardStacks() {
  for (const seat of OPPONENT_SEATS) {
    const stack = opponentStacksBySeat[seat];

    if (!stack) {
      continue;
    }

    const player = state.players.find((candidate) => candidate.seat === seat);
    const cardCount = player ? state.hands[player.id]?.length || 0 : 0;

    if (stack.children.length === cardCount) {
      continue;
    }

    stack.replaceChildren(...Array.from({ length: cardCount }, () => document.createElement("span")));
  }
}'''
script = replace_once(script, old_stacks, new_stacks, "renderOpponentCardStacks")
script_path.write_text(script, encoding="utf-8")

android_opponents_path = Path("android-opponent-hands.js")
android_opponents = android_opponents_path.read_text(encoding="utf-8")
android_opponents = replace_once(
    android_opponents,
    '''  const SEATS = ["left", "top", "right"];
  const stacksBySeat = Object.fromEntries(
    SEATS.map((seat) => [seat, document.querySelector(`.${seat}-stack`)]),
  );''',
    '''  const SEATS = ["left", "top", "right"];
  const stacksBySeat = typeof opponentStacksBySeat === "object"
    ? opponentStacksBySeat
    : Object.fromEntries(SEATS.map((seat) => [seat, document.querySelector(`.${seat}-stack`)]));''',
    "Android stack cache reuse",
)
android_opponents_path.write_text(android_opponents, encoding="utf-8")

android_runtime_path = Path("android-runtime-polish.js")
android_runtime = android_runtime_path.read_text(encoding="utf-8")
new_android_views = '''  const PLAYER_SEATS = ["left", "top", "right", "bottom"];
  const playerViews = typeof playerViewsBySeat === "object"
    ? playerViewsBySeat
    : Object.fromEntries(
        PLAYER_SEATS.map((seat) => {
          const avatar = document.querySelector(`[data-seat="${seat}"]`);
          const currentEmotion = avatar?.querySelector(":scope > .avatar-emotion") || null;
          let avatarInitial = avatar?.querySelector(":scope > .avatar-initial") || null;

          if (avatar && !avatarInitial) {
            avatarInitial = document.createElement("span");
            avatarInitial.className = "avatar-initial";
            avatar.replaceChildren(avatarInitial);
            if (currentEmotion) avatar.append(currentEmotion);
          }

          const taken = document.querySelector(`[data-taken="${seat}"]`);
          return [seat, {
            playerElement: avatar?.closest(".player") || null,
            name: document.querySelector(`[data-name="${seat}"]`),
            avatar,
            avatarInitial,
            orderBadge: document.querySelector(`[data-order-badge="${seat}"]`),
            order: document.querySelector(`[data-order="${seat}"]`),
            bid: document.querySelector(`[data-bid="${seat}"]`),
            taken,
            stats: taken?.closest(".player-stats") || null,
          }];
        }),
      );'''
android_runtime = replace_section(
    android_runtime,
    '  const PLAYER_SEATS = ["left", "top", "right", "bottom"];',
    '  const lastPlayerSignatures = Object.create(null);',
    new_android_views,
    "Android player view cache reuse",
)
android_runtime = replace_once(
    android_runtime,
    '''  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }''',
    '''  const setText = typeof setElementText === "function"
    ? setElementText
    : (node, value) => {
        if (node && node.textContent !== value) node.textContent = value;
      };''',
    "Android text helper reuse",
)
android_runtime_path.write_text(android_runtime, encoding="utf-8")

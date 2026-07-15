from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)


hand_owners = []
trick_owners = []
for path in Path('.').rglob('*.js'):
    if path.name == 'script.js':
        continue
    source = path.read_text(encoding='utf-8')
    if re.search(r'\brenderHand\s*=', source):
        hand_owners.append(str(path))
    if re.search(r'\brenderTrick\s*=', source):
        trick_owners.append(str(path))

if sorted(hand_owners) != ['android-v15.js', 'rules/deal-animation-adapter.js']:
    raise SystemExit(f'Unexpected renderHand owners: {sorted(hand_owners)}')
if sorted(trick_owners) != ['android-runtime-v2.js', 'joker-announcement.js']:
    raise SystemExit(f'Unexpected renderTrick owners: {sorted(trick_owners)}')

script_path = Path('script.js')
script = script_path.read_text(encoding='utf-8')
helper_marker = 'const urlParams = new URLSearchParams(window.location.search);'
helper_block = '''let lastHandRenderSignature = null;
let lastTrickRenderSignature = null;
let trickRenderLanguageVersion = 0;

function getHandRenderState(hand, shouldAnimateDeal) {
  const playability = new Array(hand.length);
  let signature = `${state.dealAnimationKey}|${shouldAnimateDeal ? 1 : 0}`;

  for (let index = 0; index < hand.length; index += 1) {
    const card = hand[index];
    const playable = canHumanPlay(card);
    playability[index] = playable;
    signature += `|${card.id}:${playable ? 1 : 0}`;
  }

  return { playability, signature };
}

function getTrickRenderSignature() {
  let signature = `${trickRenderLanguageVersion}|${state.collectingTrickWinnerSeat || ""}`;

  for (const play of state.currentTrick) {
    signature += [
      play.player?.id || "",
      play.player?.name || "",
      play.player?.seat || "",
      play.card?.id || "",
      play.jokerMode || "",
      play.jokerCommand || "",
      play.jokerSuit || "",
      play.order ?? "",
    ].join(":");
    signature += "|";
  }

  return signature;
}

window.addEventListener("joker-language-change", () => {
  trickRenderLanguageVersion += 1;
  lastTrickRenderSignature = null;
});

const urlParams = new URLSearchParams(window.location.search);'''
script = replace_once(script, helper_marker, helper_block, 'render cache helpers')

old_hand = '''function renderHand() {
  const hand = state.hands.human || [];
  const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;

  elements.playerHand.replaceChildren(
    ...hand.map((card, index) =>
      createCardElement(card, {
        playable: canHumanPlay(card),
        dealIndex: shouldAnimateDeal ? index : null,
        handIndex: index,
        handCount: hand.length,
      }),
    ),
  );

  if (shouldAnimateDeal) {
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
}'''
new_hand = '''function renderHand() {
  const hand = state.hands.human || [];
  const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;
  const { playability, signature } = getHandRenderState(hand, shouldAnimateDeal);
  const nodes = elements.playerHand.children;
  let domMatches = nodes.length === hand.length;

  for (let index = 0; domMatches && index < hand.length; index += 1) {
    domMatches = nodes[index]?.classList.contains("card")
      && nodes[index]?.dataset.card === hand[index].id;
  }

  if (domMatches && signature === lastHandRenderSignature) {
    return;
  }

  elements.playerHand.replaceChildren(
    ...hand.map((card, index) =>
      createCardElement(card, {
        playable: playability[index],
        dealIndex: shouldAnimateDeal ? index : null,
        handIndex: index,
        handCount: hand.length,
      }),
    ),
  );
  lastHandRenderSignature = signature;

  if (shouldAnimateDeal) {
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
}'''
script = replace_once(script, old_hand, new_hand, 'renderHand')

old_trick = '''function renderTrick() {
  elements.playedCardSlot.replaceChildren(
    ...state.currentTrick.map((play) => {
      const playedCard = document.createElement("div");
      playedCard.className = `played-card ${play.player.seat} ${play.jokerMode === "duck" ? "is-ducked" : ""}`;
      playedCard.classList.toggle("is-joker-play", play.card.type === "joker");
      playedCard.classList.toggle("is-joker-take", play.card.type === "joker" && play.jokerCommand === "take");
      playedCard.classList.toggle("is-joker-high", play.card.type === "joker" && play.jokerCommand === "high");
      playedCard.classList.toggle("is-joker-beat", play.card.type === "joker" && play.jokerMode === "beat");
      playedCard.classList.toggle("is-joker-duck", play.card.type === "joker" && play.jokerMode === "duck");
      playedCard.classList.toggle("is-entering", play.order === state.currentTrick.length - 1);
      playedCard.classList.toggle("is-collecting", Boolean(state.collectingTrickWinnerSeat));

      if (state.collectingTrickWinnerSeat) {
        playedCard.dataset.collectTo = state.collectingTrickWinnerSeat;
      }

      const label = document.createElement("span");
      label.className = "played-label";
      label.textContent = `${play.player.seat === "bottom" ? "Ты" : play.player.name}${formatJokerPlaySuffix(play)}`;

      const cardElement = createCardElement(play.card);
      cardElement.disabled = true;

      playedCard.append(label, cardElement);
      return playedCard;
    }),
  );
}'''
new_trick = '''function renderTrick() {
  const signature = getTrickRenderSignature();

  if (
    signature === lastTrickRenderSignature
    && elements.playedCardSlot.children.length === state.currentTrick.length
  ) {
    return;
  }

  elements.playedCardSlot.replaceChildren(
    ...state.currentTrick.map((play) => {
      const playedCard = document.createElement("div");
      playedCard.className = `played-card ${play.player.seat} ${play.jokerMode === "duck" ? "is-ducked" : ""}`;
      playedCard.classList.toggle("is-joker-play", play.card.type === "joker");
      playedCard.classList.toggle("is-joker-take", play.card.type === "joker" && play.jokerCommand === "take");
      playedCard.classList.toggle("is-joker-high", play.card.type === "joker" && play.jokerCommand === "high");
      playedCard.classList.toggle("is-joker-beat", play.card.type === "joker" && play.jokerMode === "beat");
      playedCard.classList.toggle("is-joker-duck", play.card.type === "joker" && play.jokerMode === "duck");
      playedCard.classList.toggle("is-entering", play.order === state.currentTrick.length - 1);
      playedCard.classList.toggle("is-collecting", Boolean(state.collectingTrickWinnerSeat));

      if (state.collectingTrickWinnerSeat) {
        playedCard.dataset.collectTo = state.collectingTrickWinnerSeat;
      }

      const label = document.createElement("span");
      label.className = "played-label";
      label.textContent = `${play.player.seat === "bottom" ? "Ты" : play.player.name}${formatJokerPlaySuffix(play)}`;

      const cardElement = createCardElement(play.card);
      cardElement.disabled = true;

      playedCard.append(label, cardElement);
      return playedCard;
    }),
  );
  lastTrickRenderSignature = signature;
}'''
script = replace_once(script, old_trick, new_trick, 'renderTrick')
script_path.write_text(script, encoding='utf-8')

runtime_path = Path('android-runtime-v2.js')
runtime = runtime_path.read_text(encoding='utf-8')
old_signature = '''  function getTrickSignature() {
    const plays = state.currentTrick.map((play) => [
      play.player?.id || "",
      play.player?.seat || "",
      play.card?.id || "",
      play.jokerMode || "",
      play.jokerCommand || "",
      play.jokerSuit || "",
      play.order ?? "",
    ].join(":"));

    return `${state.collectingTrickWinnerSeat || ""}|${plays.join("|")}`;
  }'''
new_signature = '''  function getTrickSignature() {
    if (typeof getTrickRenderSignature === "function") {
      return getTrickRenderSignature();
    }

    let signature = `${state.collectingTrickWinnerSeat || ""}|`;
    for (const play of state.currentTrick) {
      signature += [
        play.player?.id || "",
        play.player?.name || "",
        play.player?.seat || "",
        play.card?.id || "",
        play.jokerMode || "",
        play.jokerCommand || "",
        play.jokerSuit || "",
        play.order ?? "",
      ].join(":");
      signature += "|";
    }
    return signature;
  }'''
runtime = replace_once(runtime, old_signature, new_signature, 'Android trick signature reuse')
runtime_path.write_text(runtime, encoding='utf-8')

v15_path = Path('android-v15.js')
v15 = v15_path.read_text(encoding='utf-8')
v15 = replace_once(
    v15,
    '''      const nodes = Array.from(elements.playerHand.children);
      const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;
      const domMatches = nodes.length === hand.length
        && nodes.every((node, index) => node.classList.contains("card") && node.dataset.card === hand[index]?.id);''',
    '''      const nodes = elements.playerHand.children;
      const shouldAnimateDeal = state.dealAnimationKey !== state.renderedDealAnimationKey;
      let domMatches = nodes.length === hand.length;

      for (let index = 0; domMatches && index < hand.length; index += 1) {
        domMatches = nodes[index]?.classList.contains("card")
          && nodes[index]?.dataset.card === hand[index]?.id;
      }''',
    'Android hand DOM match',
)
v15 = replace_once(
    v15,
    '''      nodes.forEach((node, index) => {
        const card = hand[index];
        const playable = typeof canHumanPlay === "function" ? canHumanPlay(card) : true;
        const disabled = !playable;
        const offset = index - middle;
        const rotate = `${offset * 1.8}deg`;
        const lift = `${Math.round(Math.abs(offset) * 2.2)}px`;

        if (node.disabled !== disabled) node.disabled = disabled;
        node.classList.toggle("is-disabled", disabled);
        if (node.classList.contains("is-dealt")) node.classList.remove("is-dealt");
        if (node.style.getPropertyValue("--deal-delay")) node.style.removeProperty("--deal-delay");
        if (node.style.getPropertyValue("--hand-rotate") !== rotate) node.style.setProperty("--hand-rotate", rotate);
        if (node.style.getPropertyValue("--hand-lift") !== lift) node.style.setProperty("--hand-lift", lift);
      });''',
    '''      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        const card = hand[index];
        const playable = typeof canHumanPlay === "function" ? canHumanPlay(card) : true;
        const disabled = !playable;
        const offset = index - middle;
        const rotate = `${offset * 1.8}deg`;
        const lift = `${Math.round(Math.abs(offset) * 2.2)}px`;

        if (node.disabled !== disabled) node.disabled = disabled;
        node.classList.toggle("is-disabled", disabled);
        if (node.classList.contains("is-dealt")) node.classList.remove("is-dealt");
        if (node.style.getPropertyValue("--deal-delay")) node.style.removeProperty("--deal-delay");
        if (node.style.getPropertyValue("--hand-rotate") !== rotate) node.style.setProperty("--hand-rotate", rotate);
        if (node.style.getPropertyValue("--hand-lift") !== lift) node.style.setProperty("--hand-lift", lift);
      }''',
    'Android hand live collection loop',
)
v15_path.write_text(v15, encoding='utf-8')

from pathlib import Path

path = Path("android-runtime-polish.js")
text = path.read_text(encoding="utf-8")

marker = '''  function canVibrate() {
'''
block = '''  /*
   * Bot layers repeatedly ask the same legality question for every card.
   * Cache only the boolean rule result; no bot choice or rule is changed.
   */
  if (typeof isLegalCard === "function") {
    const fullIsLegalCard = isLegalCard;
    const legalityByPlayer = new Map();

    function getLegalityContext(playerId) {
      const hand = state.hands?.[playerId] || [];
      const firstPlay = state.currentTrick?.[0] || null;
      const leadSuit = typeof getLeadSuit === "function" ? (getLeadSuit() || "") : "";
      const trumpSuit = state.trump?.type === "standard" ? (state.trump.suit || "") : "";
      const rulesId = window.JokerRules?.activeId || "rules";
      let context = legalityByPlayer.get(playerId);

      const unchanged = context
        && context.hand === hand
        && context.handLength === hand.length
        && context.trickLength === (state.currentTrick?.length || 0)
        && context.leadSuit === leadSuit
        && context.trumpSuit === trumpSuit
        && context.rulesId === rulesId
        && context.firstCardId === (firstPlay?.card?.id || "")
        && context.firstJokerMode === (firstPlay?.jokerMode || "")
        && context.firstJokerCommand === (firstPlay?.jokerCommand || "")
        && context.firstJokerSuit === (firstPlay?.jokerSuit || "");

      if (unchanged) return context;

      context = {
        hand,
        handLength: hand.length,
        trickLength: state.currentTrick?.length || 0,
        leadSuit,
        trumpSuit,
        rulesId,
        firstCardId: firstPlay?.card?.id || "",
        firstJokerMode: firstPlay?.jokerMode || "",
        firstJokerCommand: firstPlay?.jokerCommand || "",
        firstJokerSuit: firstPlay?.jokerSuit || "",
        results: new Map(),
      };
      legalityByPlayer.set(playerId, context);
      return context;
    }

    isLegalCard = function cachedAndroidIsLegalCard(playerId, card) {
      if (!card?.id) return fullIsLegalCard(playerId, card);

      const context = getLegalityContext(playerId);
      if (context.results.has(card.id)) return context.results.get(card.id);

      const result = fullIsLegalCard(playerId, card);
      context.results.set(card.id, result);
      return result;
    };
  }

'''

if block not in text:
    if marker not in text:
        raise SystemExit("Legality cache insertion point not found")
    text = text.replace(marker, block + marker, 1)

path.write_text(text, encoding="utf-8")

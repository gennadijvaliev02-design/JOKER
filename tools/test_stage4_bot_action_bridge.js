const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function harness() {
  const events = [];
  const calls = [];
  class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const state = {
    autoPlay: false,
    phase: "playing",
    currentPulka: 2,
    currentGame: 3,
    trickNumber: 4,
    trumpChooserId: null,
    trump: null,
  };
  const context = {
    console,
    Error,
    CustomEvent,
    state,
    window: { dispatchEvent(event) { events.push(event); } },
    playCard(playerId, cardId, options) {
      calls.push(["card", playerId, cardId, options]);
      return cardId !== "reject";
    },
    submitBid(playerId, bid) {
      calls.push(["bid", playerId, bid]);
      return bid !== 99;
    },
    completeDealAfterTrump() {
      calls.push(["trump", state.trumpChooserId]);
      state.trumpChooserId = null;
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("rules/bot-action-bridge.js", "utf8"), context);
  return { context, state, events, calls };
}

{
  const { context, events } = harness();
  assert.equal(context.playCard("human", "A-spades", {}), true);
  assert.equal(events.length, 0);
}

{
  const { context, events } = harness();
  const options = { jokerMode: "lead", jokerCommand: "take", jokerSuit: "hearts" };
  assert.equal(context.playCard("bot-1", "joker-red", options), true);
  assert.equal(events.length, 2);
  assert.equal(events[0].detail.stage, "before");
  assert.equal(events[1].detail.stage, "committed");
  assert.equal(events[1].detail.kind, "card");
  assert.equal(events[1].detail.playerId, "bot-1");
  assert.equal(events[1].detail.payload.jokerSuit, "hearts");
  assert.equal(events[0].detail.actionId, events[1].detail.actionId);
}

{
  const { context, events } = harness();
  assert.equal(context.playCard("bot-2", "reject", {}), false);
  assert.equal(events.at(-1).detail.stage, "rejected");
  assert.equal(events.at(-1).detail.success, false);
}

{
  const { context, events } = harness();
  assert.equal(context.submitBid("bot-1", 3), true);
  assert.equal(events[0].detail.kind, "bid");
  assert.equal(events[1].detail.payload.bid, 3);
}

{
  const { context, state, events } = harness();
  state.autoPlay = true;
  assert.equal(context.submitBid("human", "pass"), true);
  assert.equal(events.length, 2);
}

{
  const { context, state, events } = harness();
  state.trumpChooserId = "bot-2";
  state.trump = { type: "standard", suit: "diamonds", symbol: "♦", color: "red" };
  context.completeDealAfterTrump();
  assert.equal(events[0].detail.kind, "trump");
  assert.equal(events[0].detail.playerId, "bot-2");
  assert.equal(events[1].detail.payload.trump.suit, "diamonds");
  assert.equal(state.trumpChooserId, null);
}

{
  const { context, events } = harness();
  for (let index = 0; index < 5000; index += 1) {
    assert.equal(context.playCard(`bot-${index % 3 + 1}`, `card-${index}`, {}), true);
    assert.equal(events[index * 2].detail.stage, "before");
    assert.equal(events[index * 2 + 1].detail.stage, "committed");
  }
  assert.equal(context.window.JokerBotActionBridge.getLastActionId(), 5000);
}

const engine = fs.readFileSync("rules/rules-engine.js", "utf8");
assert.ok(engine.indexOf("rules/core-logic-fixes.js") < engine.indexOf("rules/bot-action-bridge.js"));
assert.ok(engine.indexOf("rules/bot-action-bridge.js") < engine.indexOf("rules/bot-survival-priority.js"));
console.log("Stage 4 bot action bridge checks passed");

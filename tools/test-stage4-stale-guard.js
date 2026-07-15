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
    activePlayerId: "bot-1",
    trumpChooserId: null,
    trump: null,
    players: [{ id: "human" }, { id: "bot-1" }, { id: "bot-2" }, { id: "bot-3" }],
    hands: {
      human: [{ id: "human-card" }],
      "bot-1": [{ id: "card-1" }],
      "bot-2": [{ id: "card-2" }],
      "bot-3": [{ id: "card-3" }],
    },
    currentTrick: [],
    biddingOrder: ["bot-1", "bot-2", "human", "bot-3"],
    biddingIndex: 0,
  };
  const context = {
    console,
    Error,
    CustomEvent,
    state,
    window: { dispatchEvent(event) { events.push(event); } },
    getCurrentBidderId() { return state.biddingOrder[state.biddingIndex] || null; },
    playCard(playerId, cardId, options) {
      calls.push(["card", playerId, cardId, options]);
      return true;
    },
    submitBid(playerId, bid) {
      calls.push(["bid", playerId, bid]);
      state.biddingIndex += 1;
      return true;
    },
    completeDealAfterTrump() {
      calls.push(["trump"]);
      state.trumpChooserId = null;
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("rules/bot-action-bridge.js", "utf8"), context);
  return { context, state, events, calls };
}

{
  const { context, state, events, calls } = harness();
  state.activePlayerId = "bot-2";
  assert.equal(context.playCard("bot-1", "card-1", {}), false);
  assert.equal(calls.length, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.stage, "rejected");
  assert.equal(events[0].detail.reason, "active-player-changed");
  assert.equal(events[0].detail.stale, true);
}

{
  const { context, state, events, calls } = harness();
  state.phase = "bidding";
  state.biddingIndex = 1;
  assert.equal(context.submitBid("bot-1", 2), false);
  assert.equal(calls.length, 0);
  assert.equal(events[0].detail.reason, "bidder-changed");
}

{
  const { context, state, events, calls } = harness();
  state.phase = "playing";
  assert.equal(context.playCard("bot-1", "missing", {}), false);
  assert.equal(calls.length, 0);
  assert.equal(events[0].detail.reason, "card-unavailable");
}

{
  const { context, events, calls } = harness();
  assert.equal(context.playCard("bot-1", "card-1", {}), true);
  assert.equal(calls.length, 1);
  assert.equal(events[0].detail.stage, "before");
  assert.equal(events[1].detail.stage, "committed");
}

{
  const { context, state, events, calls } = harness();
  state.phase = "bidding";
  assert.equal(context.submitBid("bot-1", 3), true);
  assert.equal(calls.length, 1);
  assert.equal(events[1].detail.stage, "committed");
}

{
  const { context, state, events, calls } = harness();
  state.autoPlay = false;
  state.activePlayerId = "bot-2";
  assert.equal(context.playCard("human", "human-card", {}), true);
  assert.equal(calls.length, 1);
  assert.equal(events.length, 0);
}

{
  const { context, state, events, calls } = harness();
  state.autoPlay = true;
  state.activePlayerId = "bot-2";
  assert.equal(context.playCard("human", "human-card", {}), false);
  assert.equal(calls.length, 0);
  assert.equal(events[0].detail.reason, "active-player-changed");
}

console.log("Stage 4 stale action guard checks passed");

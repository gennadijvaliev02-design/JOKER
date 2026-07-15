const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const listeners = new Map();
const events = [];
const timers = [];
const root = {
  classList: {
    values: new Set(),
    add(value) { this.values.add(value); },
    remove(value) { this.values.delete(value); },
  },
  dataset: {},
};
const animationRoot = {
  getAnimations() {
    return [{ currentTime: 100, effect: { getComputedTiming: () => ({ endTime: 400 }) } }];
  },
};

class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}

let continuationCalls = 0;
const windowObject = {
  JokerBotActionBridge: { eventName: "joker-bot-action" },
  addEventListener(type, listener) {
    const bucket = listeners.get(type) || [];
    bucket.push(listener);
    listeners.set(type, bucket);
  },
  dispatchEvent(event) {
    events.push(event);
    for (const listener of listeners.get(event.type) || []) listener(event);
  },
  setTimeout(callback, delay) {
    timers.push({ callback, delay });
    return timers.length;
  },
  clearTimeout() {},
  matchMedia() { return { matches: false }; },
  continueBotTurns() { continuationCalls += 1; },
};

const context = {
  console,
  CustomEvent,
  Date,
  Map,
  Math,
  Number,
  Object,
  Set,
  String,
  document: {
    documentElement: root,
    querySelector(selector) {
      if (selector === "#played-card-slot") return animationRoot;
      if (selector === ".table") return animationRoot;
      return null;
    },
  },
  queueMicrotask(callback) { callback(); },
  window: windowObject,
};
context.globalThis = context;
context.continueBotTurns = windowObject.continueBotTurns;
vm.createContext(context);
vm.runInContext(fs.readFileSync("rules/bot-animation-sync-adapter.js", "utf8"), context);

windowObject.dispatchEvent(new CustomEvent("joker-bot-action", {
  detail: { actionId: 7, kind: "card", stage: "committed" },
}));
assert.equal(windowObject.JokerBotAnimationSync.isWaiting(), true);
assert.equal(root.dataset.botAnimationActionId, "7");
assert.equal(timers.length, 1);
assert.equal(timers[0].delay, 334);

context.continueBotTurns();
context.continueBotTurns();
assert.equal(continuationCalls, 0);
assert.equal(events.filter((event) => event.type === "joker-bot-animation-sync" && event.detail.stage === "queued").length, 2);

timers[0].callback();
assert.equal(windowObject.JokerBotAnimationSync.isWaiting(), false);
assert.equal(continuationCalls, 1);
assert.equal(root.classList.values.has("is-bot-animation-gated"), false);

windowObject.dispatchEvent(new CustomEvent("joker-bot-action", {
  detail: { actionId: 8, kind: "bid", stage: "committed" },
}));
assert.equal(windowObject.JokerBotAnimationSync.isWaiting(), false);

const engine = fs.readFileSync("rules/rules-engine.js", "utf8");
assert.ok(engine.indexOf("bot-action-ui-adapter.js") < engine.indexOf("bot-animation-sync-adapter.js"));
assert.ok(engine.indexOf("bot-animation-sync-adapter.js") < engine.indexOf("deal-animation-adapter.js"));
console.log("Stage 4 bot animation sync checks passed");

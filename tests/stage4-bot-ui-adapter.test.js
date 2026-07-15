const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class ClassList {
  constructor() { this.values = new Set(); }
  add(...items) { items.forEach((item) => this.values.add(item)); }
  remove(...items) { items.forEach((item) => this.values.delete(item)); }
  toggle(item, force) { if (force) this.values.add(item); else this.values.delete(item); }
  contains(item) { return this.values.has(item); }
}

const listeners = new Map();
const timers = [];
const player = {
  classList: new ClassList(),
  dataset: {},
  attributes: {},
  setAttribute(name, value) { this.attributes[name] = value; },
  removeAttribute(name) { delete this.attributes[name]; },
};
const root = { classList: new ClassList(), dataset: {} };
const document = {
  documentElement: root,
  querySelectorAll(selector) {
    if (selector.includes("data-player-id=\"bot-1\"")) return [player];
    if (selector.includes(".is-bot-")) return [player];
    return [];
  },
};
class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }
const window = {
  JokerBotActionBridge: { eventName: "joker-bot-action" },
  addEventListener(name, callback) { listeners.set(name, callback); },
  dispatchEvent(event) { const callback = listeners.get(event.type); if (callback) callback(event); },
  setTimeout(callback) { timers.push(callback); return timers.length; },
  clearTimeout() {},
};
const context = { window, document, CustomEvent, CSS: { escape: String }, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync("rules/bot-action-ui-adapter.js", "utf8"), context);

window.dispatchEvent(new CustomEvent("joker-bot-action", { detail: {
  actionId: 1, kind: "card", playerId: "bot-1", stage: "before",
} }));
assert.equal(root.dataset.botActionStage, "before");
assert.equal(root.classList.contains("is-bot-action-active"), true);
assert.equal(player.classList.contains("is-bot-thinking"), true);
assert.equal(player.attributes["aria-busy"], "true");

window.dispatchEvent(new CustomEvent("joker-bot-action", { detail: {
  actionId: 1, kind: "card", playerId: "bot-1", stage: "committed",
} }));
assert.equal(root.dataset.botActionStage, "committed");
assert.equal(player.classList.contains("is-bot-action-success"), false);
assert.equal(player.classList.contains("is-bot-action-committed"), true);
assert.equal(timers.length, 1);
timers[0]();
assert.equal(root.dataset.botActionStage, undefined);
assert.equal(window.JokerBotActionUi.getCurrentActionId(), null);

window.dispatchEvent(new CustomEvent("joker-bot-action", { detail: {
  actionId: 2, kind: "bid", playerId: "bot-1", stage: "before",
} }));
window.dispatchEvent(new CustomEvent("joker-bot-action", { detail: {
  actionId: 2, kind: "bid", playerId: "bot-1", stage: "rejected",
} }));
assert.equal(player.classList.contains("is-bot-action-rejected"), true);

const engine = fs.readFileSync("rules/rules-engine.js", "utf8");
assert.ok(engine.indexOf("bot-action-bridge.js") < engine.indexOf("bot-action-ui-adapter.js"));
assert.ok(engine.indexOf("bot-action-ui-adapter.js") < engine.indexOf("bot-survival-priority.js"));
console.log("Stage 4 bot UI adapter checks passed");

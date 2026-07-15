"use strict";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, enabled) {
    if (enabled) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

function makeButton(bid) {
  return {
    dataset: { bid: String(bid) },
    disabled: false,
    classList: new FakeClassList(),
  };
}

const cache = new Map();
let factoryCalls = 0;
function getCached(key, factory) {
  let nodes = cache.get(key);
  if (!nodes) {
    factoryCalls += 1;
    nodes = factory();
    cache.set(key, nodes);
  }
  return nodes;
}

const container = {
  children: [],
  replaceCount: 0,
  replaceChildren(...nodes) {
    this.children = nodes;
    this.replaceCount += 1;
  },
};

function sync(nodes) {
  let matches = container.children.length === nodes.length;
  for (let index = 0; matches && index < nodes.length; index += 1) {
    matches = container.children[index] === nodes[index];
  }
  if (matches) return false;
  container.replaceChildren(...nodes);
  return true;
}

const first = getCached("mode", () => [makeButton("duck"), makeButton("beat")]);
const second = getCached("mode", () => [makeButton("wrong")]);
if (first !== second || factoryCalls !== 1) throw new Error("Panel nodes were not cached");
if (!sync(first) || container.replaceCount !== 1) throw new Error("Initial panel attach failed");
if (sync(second) || container.replaceCount !== 1) throw new Error("Identical panel was reattached");

function oldOrderState(handSize, currentBidTotal, isLastBidder) {
  return ["pass", 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .filter((bid) => bid === "pass" || bid <= handSize)
    .map((bid) => ({
      bid: String(bid),
      forbidden: isLastBidder && currentBidTotal + (bid === "pass" ? 0 : bid) === handSize,
    }));
}

function newOrderState(handSize, currentBidTotal, isLastBidder) {
  const buttons = getCached(`rules-order:${handSize}`, () => {
    const nodes = [];
    for (const bid of ["pass", 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      if (bid === "pass" || bid <= handSize) nodes.push(makeButton(bid));
    }
    return nodes;
  });

  for (const button of buttons) {
    const bidValue = button.dataset.bid === "pass" ? 0 : Number(button.dataset.bid);
    const forbidden = isLastBidder && currentBidTotal + bidValue === handSize;
    button.disabled = forbidden;
    button.classList.toggle("is-forbidden", forbidden);
  }

  return buttons.map((button) => ({
    bid: button.dataset.bid,
    forbidden: button.disabled && button.classList.contains("is-forbidden"),
  }));
}

for (let run = 0; run < 30000; run += 1) {
  const handSize = 1 + (run % 9);
  const currentBidTotal = (run * 7) % 19;
  const isLastBidder = run % 3 === 0;
  const expected = JSON.stringify(oldOrderState(handSize, currentBidTotal, isLastBidder));
  const actual = JSON.stringify(newOrderState(handSize, currentBidTotal, isLastBidder));
  if (actual !== expected) throw new Error(`Order state mismatch at run ${run}`);
}

function orderPanelKey({ rulesId, pulka, game, handSize, biddingIndex, orderLength, total }) {
  return `order:${rulesId}:${pulka}:${game}:${handSize}:${biddingIndex}:${orderLength}:${total}`;
}

const baseKey = orderPanelKey({ rulesId: "a", pulka: 1, game: 1, handSize: 9, biddingIndex: 0, orderLength: 4, total: 0 });
const changedHand = orderPanelKey({ rulesId: "a", pulka: 1, game: 1, handSize: 3, biddingIndex: 0, orderLength: 4, total: 0 });
const changedRules = orderPanelKey({ rulesId: "b", pulka: 1, game: 1, handSize: 9, biddingIndex: 0, orderLength: 4, total: 0 });
if (baseKey === changedHand || baseKey === changedRules) throw new Error("Android order panel key ignores rules context");

console.log("bidding cache parity: ok");

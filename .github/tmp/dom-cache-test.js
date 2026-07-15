class ClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, enabled) {
    if (enabled) this.values.add(name);
    else this.values.delete(name);
  }
}

class FakeNode {
  constructor(text = "") {
    this.textContent = text;
    this.classList = new ClassList();
    this.children = [];
    this.writeCount = 0;
  }

  setText(value) {
    if (this.textContent !== value) {
      this.textContent = value;
      this.writeCount += 1;
    }
  }
}

function formatBid(bid) {
  if (bid === null) return "—";
  return bid === "pass" ? "П" : String(bid);
}

for (let run = 0; run < 20000; run += 1) {
  const player = {
    id: run % 4 === 0 ? "human" : `bot-${run % 4}`,
    seat: ["left", "top", "right", "bottom"][run % 4],
    name: `P${run % 17}`,
    order: 1 + (run % 4),
    bid: [null, "pass", 1, 4][run % 4],
    tricks: run % 10,
  };

  const expected = {
    name: player.seat === "bottom" ? "Ты" : player.name,
    initial: player.name.slice(0, 1).toUpperCase(),
    order: String(player.order),
    bid: formatBid(player.bid),
    taken: String(player.tricks),
  };

  const nodes = {
    name: new FakeNode(expected.name),
    initial: new FakeNode(expected.initial),
    order: new FakeNode(expected.order),
    bid: new FakeNode(expected.bid),
    taken: new FakeNode(expected.taken),
  };

  nodes.name.setText(expected.name);
  nodes.initial.setText(expected.initial);
  nodes.order.setText(expected.order);
  nodes.bid.setText(expected.bid);
  nodes.taken.setText(expected.taken);

  if (Object.values(nodes).some((node) => node.writeCount !== 0)) {
    throw new Error("Unchanged text was rewritten");
  }

  if (
    nodes.name.textContent !== expected.name
    || nodes.initial.textContent !== expected.initial
    || nodes.order.textContent !== expected.order
    || nodes.bid.textContent !== expected.bid
    || nodes.taken.textContent !== expected.taken
  ) {
    throw new Error("Player render parity failed");
  }
}

for (let count = 0; count <= 9; count += 1) {
  const stack = { children: Array.from({ length: count }, () => ({})), replacements: 0 };
  if (stack.children.length !== count) stack.replacements += 1;
  if (stack.replacements !== 0) throw new Error("Stable opponent stack was replaced");
}

console.log("DOM cache parity tests passed");

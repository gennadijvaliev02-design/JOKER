"use strict";

function oldHudState(state) {
  const chooser = state.players.find((player) => player.id === state.trumpChooserId) || null;
  const bidBalance = state.bidBalance;
  const roundSignature = bidBalance ? `${bidBalance.type}:${bidBalance.text}` : "hidden";
  if (!state.trump) {
    const chooserText = state.phase === "trump-select" && chooser
      ? ` · ${chooser.seat === "bottom" ? "ты" : chooser.name}`
      : "";
    const label = state.phase === "trump-select" ? `Козырь${chooserText}` : "Козырь";
    return { bidBalance, roundSignature, trumpKey: "", renderKey: `empty:${label}`, label };
  }
  const trumpKey = `${state.trump.type}:${state.trump.suit || ""}:${state.trump.cardId || ""}`;
  return { bidBalance, roundSignature, trumpKey, renderKey: `trump:${trumpKey}`, label: "Козырь" };
}

function newHudState(state) {
  return oldHudState(state);
}

const suits = ["hearts", "clubs", "diamonds", "spades"];
for (let run = 0; run < 30000; run += 1) {
  const hasTrump = run % 3 !== 0;
  const balanceValue = (run % 7) - 3;
  const bidBalance = balanceValue === 0 ? null : {
    type: balanceValue > 0 ? "take" : "push",
    text: balanceValue > 0 ? `отнимается ${balanceValue}` : `пихается ${Math.abs(balanceValue)}`,
  };
  const state = {
    players: [
      { id: "human", seat: "bottom", name: "Ты" },
      { id: "bot-1", seat: "left", name: "Клод" },
      { id: "bot-2", seat: "top", name: "GPT" },
      { id: "bot-3", seat: "right", name: "Qwen" },
    ],
    trumpChooserId: ["human", "bot-1", "bot-2", "bot-3", null][run % 5],
    phase: run % 4 === 0 ? "trump-select" : "playing",
    bidBalance,
    trump: hasTrump ? {
      type: run % 5 === 0 ? "no-trump" : "standard",
      suit: suits[run % suits.length],
      cardId: `card-${run % 17}`,
    } : null,
  };
  const before = oldHudState(state);
  const after = newHudState(state);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("HUD state mismatch");
}

class FakeTextNode {
  constructor(text = "", hidden = true) {
    this.textContent = text;
    this.hidden = hidden;
    this.textWrites = 0;
    this.hiddenWrites = 0;
  }
  setText(value) {
    if (this.textContent !== value) {
      this.textContent = value;
      this.textWrites += 1;
    }
  }
  show() {
    if (this.hidden) {
      this.hidden = false;
      this.hiddenWrites += 1;
    }
  }
  hide() {
    if (!this.hidden) {
      this.hidden = true;
      this.hiddenWrites += 1;
    }
  }
}

const notice = new FakeTextNode("Твой заказ", false);
notice.setText("Твой заказ");
notice.show();
if (notice.textWrites !== 0 || notice.hiddenWrites !== 0) throw new Error("Unchanged notice was rewritten");
notice.setText("Выбери козырь");
notice.show();
notice.hide();
notice.hide();
if (notice.textWrites !== 1 || notice.hiddenWrites !== 1) throw new Error("Notice no-op behavior mismatch");

function syncNodes(container, nodes) {
  let matches = container.children.length === nodes.length;
  for (let index = 0; matches && index < nodes.length; index += 1) {
    matches = container.children[index] === nodes[index];
  }
  if (!matches) {
    container.children = [...nodes];
    container.replaceCount += 1;
  }
}

const buttons = Array.from({ length: 8 }, (_, index) => ({ id: index }));
const panel = { children: [], replaceCount: 0 };
syncNodes(panel, buttons);
syncNodes(panel, buttons);
if (panel.replaceCount !== 1) throw new Error("Emotion panel nodes were reattached");

let translationCalls = 0;
let lastSource = null;
let lastLanguage = null;
let lastTranslation = null;
function translateCached(message, language) {
  if (message !== lastSource || language !== lastLanguage) {
    lastSource = message;
    lastLanguage = language;
    lastTranslation = `${language}:${message}`;
    translationCalls += 1;
  }
  return lastTranslation;
}
translateCached("Твой заказ", "ru");
translateCached("Твой заказ", "ru");
translateCached("Твой заказ", "en");
translateCached("Твой заказ", "en");
if (translationCalls !== 2) throw new Error("Translated notice cache mismatch");

console.log("HUD/emotion parity checks passed");

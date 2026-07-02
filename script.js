const SUITS = [
  { id: "spades", symbol: "♠", color: "black" },
  { id: "clubs", symbol: "♣", color: "black" },
  { id: "hearts", symbol: "♥", color: "red" },
  { id: "diamonds", symbol: "♦", color: "red" },
];

const RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function createJokerDeck() {
  const cards = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (rank === "6" && (suit.id === "spades" || suit.id === "clubs")) {
        continue;
      }

      cards.push({
        id: `${rank}-${suit.id}`,
        rank,
        suit: suit.id,
        symbol: suit.symbol,
        color: suit.color,
        type: "standard",
      });
    }
  }

  cards.push(
    { id: "joker-red", rank: "Joker", suit: null, symbol: "★", color: "red", type: "joker" },
    { id: "joker-black", rank: "Joker", suit: null, symbol: "★", color: "black", type: "joker" },
  );

  return cards;
}

window.jokerDeck = createJokerDeck();

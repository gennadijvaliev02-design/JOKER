(function () {
  const aggressionRules = Object.freeze({
    id: "aggression",
    name: "Aggression",
    version: 2,
    description: "Текущая стратегическая версия с раздачами по 9 карт.",
    zeroTrickPenalty: -250,
    passScore: 50,
    fullHandScores: Object.freeze({ 9: 900 }),
    fulfilledScores: Object.freeze({
      pass: 50,
      1: 100,
      2: 150,
      3: 200,
      4: 250,
      5: 300,
      6: 350,
      7: 400,
      8: 450,
      9: 900,
    }),
    pulkas: Object.freeze([
      Object.freeze({ id: 1, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "current-game-engine" }),
      Object.freeze({ id: 2, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "chooser-rotation" }),
      Object.freeze({ id: 3, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "current-game-engine" }),
      Object.freeze({ id: 4, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "current-game-engine" }),
      Object.freeze({ id: 5, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "current-game-engine" }),
    ]),
    features: Object.freeze({
      premium: true,
      crossing: true,
      noTrump: true,
      jokerCommands: true,
      forbiddenTotalBid: true,
    }),
  });

  window.JokerRuleProfiles = window.JokerRuleProfiles || {};
  window.JokerRuleProfiles.aggression = aggressionRules;
})();

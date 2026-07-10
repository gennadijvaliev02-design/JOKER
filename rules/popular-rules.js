(function () {
  const popularRules = Object.freeze({
    id: "popular",
    name: "Popular",
    version: 1,
    description: "Популярная версия с раздачами 1→8, 9×4, 8→1 и 9×4.",
    shтангаPenalty: -200,
    passScore: 50,
    fullHandScores: Object.freeze({
      1: 100,
      2: 200,
      3: 300,
      4: 400,
      5: 500,
      6: 600,
      7: 700,
      8: 800,
      9: 900,
    }),
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
      Object.freeze({ id: 1, games: 8, handSizes: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]), trumpMode: "center-card" }),
      Object.freeze({ id: 2, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "chooser-rotation" }),
      Object.freeze({ id: 3, games: 8, handSizes: Object.freeze([8, 7, 6, 5, 4, 3, 2, 1]), trumpMode: "center-card" }),
      Object.freeze({ id: 4, games: 4, handSizes: Object.freeze([9, 9, 9, 9]), trumpMode: "chooser-rotation" }),
    ]),
    dealFlow: Object.freeze({
      aceDeal: "same-as-aggression",
      firstPlayerRotation: "clockwise-from-ace-order",
      centerTrumpAfterCardsPerPlayer: 3,
      jokerCenterCardMeansNoTrump: true,
    }),
    features: Object.freeze({
      premium: true,
      crossing: true,
      noTrump: true,
      jokerCommands: true,
      forbiddenTotalBid: true,
      fourHundredPulka: false,
    }),
  });

  window.JokerRuleProfiles = window.JokerRuleProfiles || {};
  window.JokerRuleProfiles.popular = popularRules;
})();

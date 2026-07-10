(function () {
  if (!window.JokerRules || typeof state === "undefined") {
    console.warn("Joker rules scoring adapter: rules engine or game state is unavailable.");
    return;
  }

  const originalCalculatePlayerScore = calculatePlayerScore;

  function getActiveProfile() {
    return window.JokerRules.active || {};
  }

  function getCurrentHandSize() {
    const configuredSize = window.JokerRules.getHandSize(state.currentPulka, state.currentGame);
    return Math.max(1, Math.min(9, Number(state.currentHandSize || configuredSize) || 9));
  }

  function getZeroTrickPenalty(profile) {
    const configured = profile.zeroTrickPenalty ?? profile["shтангаPenalty"];
    return Number.isFinite(Number(configured)) ? Number(configured) : -250;
  }

  function getFulfilledScore(profile, bid) {
    const configured = profile.fulfilledScores?.[bid];
    return Number.isFinite(Number(configured)) ? Number(configured) : null;
  }

  function getFullHandScore(profile, handSize) {
    const configured = profile.fullHandScores?.[handSize];
    return Number.isFinite(Number(configured)) ? Number(configured) : null;
  }

  function calculateProfileScore(player, handSize = getCurrentHandSize()) {
    const profile = getActiveProfile();

    if (player.bid === "pass") {
      const passScore = Number(profile.passScore ?? profile.fulfilledScores?.pass ?? 50);
      const value = player.tricks === 0 ? passScore : player.tricks * 10;

      return {
        bidLabel: "-",
        scoreLabel: String(value),
        value,
        fulfilled: player.tricks === 0,
      };
    }

    if (player.tricks === 0) {
      return {
        bidLabel: String(player.bid),
        scoreLabel: "⊣",
        value: getZeroTrickPenalty(profile),
        fulfilled: false,
      };
    }

    if (player.tricks === player.bid) {
      const isFullHand = Number(player.bid) === handSize && player.tricks === handSize;
      const fullHandScore = isFullHand ? getFullHandScore(profile, handSize) : null;
      const fulfilledScore = getFulfilledScore(profile, player.bid);
      const value = fullHandScore ?? fulfilledScore ?? player.tricks * 10;

      return {
        bidLabel: String(player.bid),
        scoreLabel: String(value),
        value,
        fulfilled: true,
      };
    }

    const value = player.tricks * 10;

    return {
      bidLabel: String(player.bid),
      scoreLabel: String(value),
      value,
      fulfilled: false,
    };
  }

  calculatePlayerScore = function calculatePlayerScoreFromProfile(player) {
    if (isFourHundredPulka()) {
      return originalCalculatePlayerScore(player);
    }

    return calculateProfileScore(player);
  };

  function preview(input) {
    const handSize = Math.max(1, Math.min(9, Number(input?.handSize) || getCurrentHandSize()));
    const player = {
      bid: input?.bid ?? "pass",
      tricks: Math.max(0, Number(input?.tricks) || 0),
    };

    return calculateProfileScore(player, handSize);
  }

  function runRegressionChecks() {
    const checks = window.JokerRules.isPopular()
      ? [
          { name: "Popular pass", input: { bid: "pass", tricks: 0, handSize: 3 }, expected: 50 },
          { name: "Popular shтанга", input: { bid: 1, tricks: 0, handSize: 1 }, expected: -200 },
          { name: "Popular 2/2", input: { bid: 2, tricks: 2, handSize: 2 }, expected: 200 },
          { name: "Popular 2/3", input: { bid: 2, tricks: 2, handSize: 3 }, expected: 150 },
          { name: "Popular 8/8", input: { bid: 8, tricks: 8, handSize: 8 }, expected: 800 },
          { name: "Popular 9/9", input: { bid: 9, tricks: 9, handSize: 9 }, expected: 900 },
        ]
      : [
          { name: "Aggression pass", input: { bid: "pass", tricks: 0, handSize: 9 }, expected: 50 },
          { name: "Aggression shтанга", input: { bid: 2, tricks: 0, handSize: 9 }, expected: -250 },
          { name: "Aggression 2/9", input: { bid: 2, tricks: 2, handSize: 9 }, expected: 150 },
          { name: "Aggression 9/9", input: { bid: 9, tricks: 9, handSize: 9 }, expected: 900 },
        ];

    const results = checks.map((check) => {
      const actual = preview(check.input).value;
      const passed = actual === check.expected;
      console.assert(passed, `${check.name}: expected ${check.expected}, received ${actual}`);
      return { ...check, actual, passed };
    });

    console.table(results);
    return results;
  }

  window.JokerRulesScoring = Object.freeze({
    preview,
    runRegressionChecks,
  });

  if (new URLSearchParams(window.location.search).get("rulesTest") === "1") {
    runRegressionChecks();
  }
})();

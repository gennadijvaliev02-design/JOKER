(() => {
  const ALLOWED_DIFFICULTIES = new Set(["easy", "medium"]);
  const STORAGE_KEY = "joker-ai-difficulty";

  function readDifficultyFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("ai") || params.get("difficulty");
      return value ? value.toLowerCase() : null;
    } catch {
      return null;
    }
  }

  function readDifficultyFromStorage() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveDifficulty(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage can be blocked in some browsers; URL mode still works.
    }
  }

  function normalizeDifficulty(value) {
    const normalized = typeof value === "string" ? value.toLowerCase() : "";
    return ALLOWED_DIFFICULTIES.has(normalized) ? normalized : "easy";
  }

  const urlDifficulty = readDifficultyFromUrl();
  const difficulty = normalizeDifficulty(urlDifficulty || readDifficultyFromStorage() || "easy");

  if (urlDifficulty) {
    saveDifficulty(difficulty);
  }

  window.JOKER_AI_DIFFICULTY = difficulty;
  window.getAiDifficulty = function getAiDifficulty() {
    return window.JOKER_AI_DIFFICULTY || "easy";
  };
  window.isAiDifficultyAtLeast = function isAiDifficultyAtLeast(level) {
    const order = ["easy", "medium"];
    return order.indexOf(window.getAiDifficulty()) >= order.indexOf(level);
  };
})();

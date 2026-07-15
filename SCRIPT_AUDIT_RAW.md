# Template-aware `script.js` references

## Raw single-reference declarations

- `formatPlayerScore` — declaration line 1918; raw refs 1; direct calls 0
- `scoreValue` — declaration line 1922; raw refs 1; direct calls 0

## All declarations with at most three raw references

### `startAceDeal` — declaration line 183; raw refs 3; direct calls 1
- `ace-deal-animation.js:120` — `startAceDeal = function cinematicStartAceDeal() {`
- `script.js:180` — `startAceDeal();`
- `script.js:183` — `function startAceDeal() {`

### `applyTableOrderFromAceWinner` — declaration line 244; raw refs 3; direct calls 2
- `ace-deal-animation.js:130` — `applyTableOrderFromAceWinner(aceDeal.winnerId);`
- `script.js:193` — `applyTableOrderFromAceWinner(aceDeal.winnerId);`
- `script.js:244` — `function applyTableOrderFromAceWinner(aceWinnerId) {`

### `startTurnAfterDeal` — declaration line 331; raw refs 3; direct calls 0
- `rules/rules-hand-size-adapter.js:89` — `runAfterDealAnimation(startTurnAfterDeal);`
- `script.js:328` — `runAfterDealAnimation(startTurnAfterDeal);`
- `script.js:331` — `function startTurnAfterDeal() {`

### `startTrumpSelection` — declaration line 353; raw refs 3; direct calls 0
- `rules/rules-hand-size-adapter.js:59` — `runAfterDealAnimation(startTrumpSelection);`
- `script.js:305` — `runAfterDealAnimation(startTrumpSelection);`
- `script.js:353` — `function startTrumpSelection() {`

### `compareCards` — declaration line 392; raw refs 2; direct calls 0
- `script.js:388` — `Object.entries(hands).map(([playerId, hand]) => [playerId, [...hand].sort(compareCards)]),`
- `script.js:392` — `function compareCards(firstCard, secondCard) {`

### `getHandSuitGroup` — declaration line 415; raw refs 3; direct calls 2
- `script.js:405` — `const firstSuitGroup = getHandSuitGroup(firstCard.suit);`
- `script.js:406` — `const secondSuitGroup = getHandSuitGroup(secondCard.suit);`
- `script.js:415` — `function getHandSuitGroup(suit) {`

### `isBidBroken` — declaration line 512; raw refs 3; direct calls 2
- `android-runtime-polish.js:113` — `view.taken?.classList.toggle("is-danger", isBidBroken(player));`
- `script.js:482` — `taken.classList.toggle("is-danger", isBidBroken(player));`
- `script.js:512` — `function isBidBroken(player, final = false) {`

### `isBidFulfilledNow` — declaration line 530; raw refs 3; direct calls 2
- `android-runtime-polish.js:114` — `view.stats?.classList.toggle("is-fulfilled", isBidFulfilledNow(player));`
- `script.js:483` — `stats?.classList.toggle("is-fulfilled", isBidFulfilledNow(player));`
- `script.js:530` — `function isBidFulfilledNow(player) {`

### `formatJokerPlaySuffix` — declaration line 788; raw refs 2; direct calls 1
- `script.js:777` — `label.textContent = `${play.player.seat === "bottom" ? "Ты" : play.player.name}${formatJokerPlaySuffix(play)}`;`
- `script.js:788` — `function formatJokerPlaySuffix(play) {`

### `hasSuit` — declaration line 852; raw refs 3; direct calls 2
- `script.js:824` — `if (hasSuit(playerId, leadSuit)) {`
- `script.js:830` — `if (trumpSuit && card.suit !== trumpSuit && hasSuit(playerId, trumpSuit)) {`
- `script.js:852` — `function hasSuit(playerId, suit) {`

### `handleHumanCardClick` — declaration line 901; raw refs 2; direct calls 0
- `script.js:901` — `function handleHumanCardClick(event) {`
- `script.js:2636` — `elements.playerHand.addEventListener("click", handleHumanCardClick);`

### `renderEmotionPanel` — declaration line 986; raw refs 3; direct calls 1
- `game-emotions.js:96` — `renderEmotionPanel = renderCustomEmotionPanel;`
- `script.js:986` — `function renderEmotionPanel() {`
- `script.js:2639` — `renderEmotionPanel();`

### `toggleEmotionPanel` — declaration line 999; raw refs 2; direct calls 0
- `script.js:999` — `function toggleEmotionPanel() {`
- `script.js:2633` — `elements.emotionButton.addEventListener("click", toggleEmotionPanel);`

### `handleEmotionClick` — declaration line 1007; raw refs 2; direct calls 0
- `script.js:1007` — `function handleEmotionClick(event) {`
- `script.js:2634` — `elements.emotionPanel.addEventListener("click", handleEmotionClick);`

### `showPlayerEmotion` — declaration line 1019; raw refs 3; direct calls 1
- `game-emotions.js:77` — `showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {`
- `script.js:1014` — `showPlayerEmotion("bottom", button.dataset.emotion);`
- `script.js:1019` — `function showPlayerEmotion(seat, emotion) {`

### `startEmotionCooldown` — declaration line 1043; raw refs 2; direct calls 1
- `script.js:1016` — `startEmotionCooldown();`
- `script.js:1043` — `function startEmotionCooldown() {`

### `isEmotionCoolingDown` — declaration line 1051; raw refs 3; direct calls 2
- `script.js:1000` — `if (!state.started || state.phase === "idle" || isEmotionCoolingDown()) {`
- `script.js:1010` — `if (!button || isEmotionCoolingDown()) {`
- `script.js:1051` — `function isEmotionCoolingDown() {`

### `renderTrumpSelection` — declaration line 1055; raw refs 3; direct calls 2
- `rules/rules-hand-size-adapter.js:109` — `renderTrumpSelection();`
- `script.js:954` — `renderTrumpSelection();`
- `script.js:1055` — `function renderTrumpSelection() {`

### `handleBidClick` — declaration line 1137; raw refs 2; direct calls 0
- `script.js:1137` — `function handleBidClick(event) {`
- `script.js:2637` — `elements.bidOptions.addEventListener("click", handleBidClick);`

### `getBidCardValue` — declaration line 1291; raw refs 3; direct calls 2
- `bot-personality-polish.js:57` — `const rawScore = hand.reduce((sum, card) => sum + getBidCardValue(card), 0);`
- `script.js:1283` — `const rawScore = hand.reduce((sum, card) => sum + getBidCardValue(card), 0);`
- `script.js:1291` — `function getBidCardValue(card) {`

### `hasForbiddenBidTotal` — declaration line 1325; raw refs 3; direct calls 1
- `rules/rules-hand-size-adapter.js:155` — `hasForbiddenBidTotal = function hasForbiddenBidTotalForCurrentRules() {`
- `script.js:1213` — `if (hasForbiddenBidTotal()) {`
- `script.js:1325` — `function hasForbiddenBidTotal() {`

### `rewindLastBidForForbiddenTotal` — declaration line 1329; raw refs 2; direct calls 1
- `script.js:1214` — `rewindLastBidForForbiddenTotal();`
- `script.js:1329` — `function rewindLastBidForForbiddenTotal() {`

### `startPlayingCurrentGame` — declaration line 1346; raw refs 3; direct calls 2
- `script.js:336` — `startPlayingCurrentGame();`
- `script.js:1220` — `startPlayingCurrentGame();`
- `script.js:1346` — `function startPlayingCurrentGame() {`

### `shouldBeatStrongTrumpWithJoker` — declaration line 1525; raw refs 3; direct calls 2
- `bot-memory-polish.js:269` — `(shouldSpendJokerNow(playerId) || shouldBeatStrongTrumpWithJoker(playerId))`
- `script.js:1460` — `if (jokerWinningCards.length && (shouldSpendJokerNow(playerId) || shouldBeatStrongTrumpWithJoker(playerId))) {`
- `script.js:1525` — `function shouldBeatStrongTrumpWithJoker(playerId) {`

### `isStrongTrumpPlay` — declaration line 1544; raw refs 2; direct calls 1
- `script.js:1532` — `if (!isStrongTrumpPlay(currentWinner)) {`
- `script.js:1544` — `function isStrongTrumpPlay(play) {`

### `isHigherCardAlreadyPlayed` — declaration line 1568; raw refs 2; direct calls 1
- `script.js:1568` — `function isHigherCardAlreadyPlayed(card, rank) {`
- `script.js:1577` — `return RANKS.filter((rank) => RANK_POWER[rank] > RANK_POWER[card.rank] && !isHigherCardAlreadyPlayed(card, RANK_POWER[rank])).length;`

### `hasStrongLeadCard` — declaration line 1609; raw refs 3; direct calls 2
- `bot-memory-polish.js:237` — `if (!preserveLastJoker && shouldSpendJokerNow(playerId) && jokerCards.length && !hasStrongLeadCard(playerId, standardCards)) {`
- `script.js:1420` — `if (shouldSpendJokerNow(playerId) && jokerCards.length && !hasStrongLeadCard(playerId, standardCards)) {`
- `script.js:1609` — `function hasStrongLeadCard(playerId, cards) {`

### `needsJokerModeChoice` — declaration line 1654; raw refs 3; direct calls 2
- `script.js:919` — `if (needsJokerModeChoice(card)) {`
- `script.js:1654` — `function needsJokerModeChoice(card) {`
- `script.js:1676` — `if (!needsJokerModeChoice(card)) {`

### `needsLeadJokerChoice` — declaration line 1658; raw refs 3; direct calls 2
- `script.js:910` — `if (needsLeadJokerChoice(card)) {`
- `script.js:1658` — `function needsLeadJokerChoice(card) {`
- `script.js:1663` — `if (needsLeadJokerChoice(card)) {`

### `getJokerPlayOptions` — declaration line 1662; raw refs 3; direct calls 2
- `script.js:1374` — `playCard("human", chosenCard.id, getJokerPlayOptions("human", chosenCard));`
- `script.js:1395` — `playCard(botId, chosenCard.id, getJokerPlayOptions(botId, chosenCard));`
- `script.js:1662` — `function getJokerPlayOptions(playerId, card) {`

### `compareBotLeadLowCards` — declaration line 1739; raw refs 2; direct calls 0
- `script.js:1413` — `return [...standardCards, ...jokerCards].sort(compareBotLeadLowCards)[0];`
- `script.js:1739` — `function compareBotLeadLowCards(firstCard, secondCard) {`

### `createGameSummaryRow` — declaration line 1888; raw refs 2; direct calls 0
- `script.js:1880` — `list.replaceChildren(...summary.scores.map(createGameSummaryRow));`
- `script.js:1888` — `function createGameSummaryRow(item) {`

### `formatPlayerScore` — declaration line 1918; raw refs 1; direct calls 0
- `script.js:1918` — `function formatPlayerScore(player) {`

### `scoreValue` — declaration line 1922; raw refs 1; direct calls 0
- `script.js:1922` — `function scoreValue(player) {`

### `calculateFourHundredScore` — declaration line 1972; raw refs 2; direct calls 1
- `script.js:1928` — `return calculateFourHundredScore(player);`
- `script.js:1972` — `function calculateFourHundredScore(player) {`

### `createScoreEntry` — declaration line 2001; raw refs 3; direct calls 0
- `rules/rules-progression-adapter.js:263` — `gameRow.entries = playerScores.map(createScoreEntry);`
- `script.js:1834` — `gameRow.entries = playerScores.map(createScoreEntry);`
- `script.js:2001` — `function createScoreEntry(score) {`

### `applyPulkaBonuses` — declaration line 2020; raw refs 3; direct calls 1
- `rules/rules-progression-adapter.js:281` — `applyPulkaBonuses = function applyPulkaBonusesFromProfile(pulkaOffset) {`
- `script.js:1838` — `applyPulkaBonuses(pulkaOffset);`
- `script.js:2020` — `function applyPulkaBonuses(pulkaOffset) {`

### `crossBestSuccessfulEntry` — declaration line 2052; raw refs 3; direct calls 1
- `pass-premium-cross-fix.js:2` — `crossBestSuccessfulEntry = function noPassPremiumCross(gameRows, playerIndex) {`
- `script.js:2045` — `crossBestSuccessfulEntry(gameRows, playerIndex);`
- `script.js:2052` — `function crossBestSuccessfulEntry(gameRows, playerIndex) {`

### `clearGameTasks` — declaration line 2151; raw refs 2; direct calls 1
- `script.js:2151` — `function clearGameTasks() {`
- `script.js:2157` — `clearGameTasks();`

### `clearEmotionState` — declaration line 2190; raw refs 2; direct calls 1
- `script.js:2158` — `clearEmotionState();`
- `script.js:2190` — `function clearEmotionState() {`

### `restartMatch` — declaration line 2207; raw refs 3; direct calls 0
- `script.js:2207` — `function restartMatch() {`
- `script.js:2230` — `createDialogButton("Новая партия", "primary", restartMatch),`
- `winner-podium.js:119` — `createDialogButton(copy.newGame, "primary", restartMatch),`

### `getTrumpForCurrentGame` — declaration line 2311; raw refs 3; direct calls 2
- `rules/rules-hand-size-adapter.js:63` — `state.trump = getTrumpForCurrentGame(state.deck);`
- `script.js:309` — `state.trump = getTrumpForCurrentGame(state.deck);`
- `script.js:2311` — `function getTrumpForCurrentGame(deck) {`

### `createTrumpFromChoice` — declaration line 2323; raw refs 2; direct calls 1
- `script.js:1184` — `state.trump = createTrumpFromChoice(trumpButton.dataset.trump);`
- `script.js:2323` — `function createTrumpFromChoice(choice) {`

### `getMiddleDeckTrump` — declaration line 2351; raw refs 2; direct calls 1
- `script.js:2320` — `return getMiddleDeckTrump(deck);`
- `script.js:2351` — `function getMiddleDeckTrump(deck) {`

### `isChooseTrumpPulka` — declaration line 2375; raw refs 3; direct calls 1
- `rules/rules-progression-adapter.js:206` — `isChooseTrumpPulka = function isChooseTrumpPulkaFromProfile() {`
- `script.js:303` — `if (isChooseTrumpPulka()) {`
- `script.js:2375` — `function isChooseTrumpPulka() {`

### `isNoTrumpPulka` — declaration line 2379; raw refs 3; direct calls 1
- `rules/rules-progression-adapter.js:210` — `isNoTrumpPulka = function isNoTrumpPulkaFromProfile() {`
- `script.js:2312` — `if (isNoTrumpPulka()) {`
- `script.js:2379` — `function isNoTrumpPulka() {`

### `isFixedTrumpPulka` — declaration line 2383; raw refs 3; direct calls 1
- `rules/rules-progression-adapter.js:214` — `isFixedTrumpPulka = function isFixedTrumpPulkaFromProfile() {`
- `script.js:2316` — `if (isFixedTrumpPulka()) {`
- `script.js:2383` — `function isFixedTrumpPulka() {`

### `getNextPlayerId` — declaration line 2395; raw refs 2; direct calls 1
- `script.js:896` — `state.activePlayerId = getNextPlayerId(playerId);`
- `script.js:2395` — `function getNextPlayerId(playerId) {`

### `getTrumpRenderKey` — declaration line 2405; raw refs 3; direct calls 2
- `android-runtime-v2.js:198` — `const trumpKey = getTrumpRenderKey(state.trump);`
- `script.js:557` — `const trumpKey = getTrumpRenderKey(state.trump);`
- `script.js:2405` — `function getTrumpRenderKey(card) {`

### `createTrumpCardElement` — declaration line 2409; raw refs 3; direct calls 2
- `android-runtime-v2.js:205` — `elements.trumpLabel.replaceChildren("Козырь", createTrumpCardElement(state.trump, shouldReveal));`
- `script.js:561` — `elements.trumpLabel.replaceChildren("Козырь", createTrumpCardElement(state.trump, shouldReveal));`
- `script.js:2409` — `function createTrumpCardElement(card, shouldReveal = false) {`

### `createPulkaTotalElement` — declaration line 2468; raw refs 2; direct calls 1
- `script.js:2438` — `const content = delta === undefined ? cell : createPulkaTotalElement(cell, delta);`
- `script.js:2468` — `function createPulkaTotalElement(total, delta) {`

### `createScoreEntryElement` — declaration line 2488; raw refs 2; direct calls 1
- `script.js:2447` — `? row.entries.map((entry) => createScoreCell(createScoreEntryElement(entry), entry.premium ? "premium" : ""))`
- `script.js:2488` — `function createScoreEntryElement(entry) {`

### `toggleScoreSheet` — declaration line 2511; raw refs 3; direct calls 0
- `script.js:2511` — `function toggleScoreSheet() {`
- `script.js:2631` — `elements.scoreButton.addEventListener("click", toggleScoreSheet);`
- `script.js:2632` — `elements.scoreClose.addEventListener("click", toggleScoreSheet);`

### `getDevTargetFromUrl` — declaration line 2515; raw refs 3; direct calls 1
- `rules/rules-progression-adapter.js:318` — `getDevTargetFromUrl = function getProfileDevTargetFromUrl() {`
- `script.js:177` — `state.devTarget = getDevTargetFromUrl();`
- `script.js:2515` — `function getDevTargetFromUrl() {`

### `initAudio` — declaration line 2537; raw refs 3; direct calls 2
- `script.js:174` — `initAudio();`
- `script.js:2537` — `function initAudio() {`
- `script.js:2562` — `initAudio();`

### `resumeAudio` — declaration line 2553; raw refs 3; direct calls 2
- `script.js:2539` — `resumeAudio();`
- `script.js:2550` — `resumeAudio();`
- `script.js:2553` — `function resumeAudio() {`

### `getSoundProfile` — declaration line 2603; raw refs 2; direct calls 1
- `script.js:2575` — `const profile = getSoundProfile(type);`
- `script.js:2603` — `function getSoundProfile(type) {`

### `getBotPlayDelay` — declaration line 2615; raw refs 2; direct calls 1
- `script.js:1400` — `}, getBotPlayDelay());`
- `script.js:2615` — `function getBotPlayDelay() {`

### `getBotDecisionDelay` — declaration line 2619; raw refs 3; direct calls 2
- `script.js:383` — `}, getBotDecisionDelay());`
- `script.js:1244` — `}, getBotDecisionDelay());`
- `script.js:2619` — `function getBotDecisionDelay() {`

### `getRandomDelay` — declaration line 2623; raw refs 3; direct calls 2
- `script.js:2616` — `return state.autoPlay ? 0 : getRandomDelay(420, 720);`
- `script.js:2620` — `return state.autoPlay ? 0 : getRandomDelay(700, 1100);`
- `script.js:2623` — `function getRandomDelay(min, max) {`


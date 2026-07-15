# `script.js` static audit

Generated from `agent/android-script-audit-1`. This is an audit artifact, not a product change.

## Summary

- Lines: **2651**
- Named function declarations: **162**
- High-confidence unused declarations: **3**
- Callback/external-only candidates: **12**
- Functions reassigned somewhere in the project: **74**
- Exact duplicate function bodies: **0 groups**

## High-confidence unused declarations

- `formatJokerPlaySuffix` — lines 788-799 (10 body lines)
- `formatPlayerScore` — lines 1918-1920 (1 body lines)
- `scoreValue` — lines 1922-1924 (1 body lines)

## Callback or external-only candidates

These are not automatically dead: a bare function reference can be passed as a callback.

### `startTurnAfterDeal` — lines 331-342
References: 3; direct calls: 0
- `rules/rules-hand-size-adapter.js:89` — `runAfterDealAnimation(startTurnAfterDeal);`
- `script.js:328` — `runAfterDealAnimation(startTurnAfterDeal);`
- `script.js:331` — `function startTurnAfterDeal() {`

### `startTrumpSelection` — lines 353-384
References: 3; direct calls: 0
- `rules/rules-hand-size-adapter.js:59` — `runAfterDealAnimation(startTrumpSelection);`
- `script.js:305` — `runAfterDealAnimation(startTrumpSelection);`
- `script.js:353` — `function startTrumpSelection() {`

### `compareCards` — lines 392-413
References: 2; direct calls: 0
- `script.js:388` — `Object.entries(hands).map(([playerId, hand]) => [playerId, [...hand].sort(compareCards)]),`
- `script.js:392` — `function compareCards(firstCard, secondCard) {`

### `handleHumanCardClick` — lines 901-935
References: 2; direct calls: 0
- `script.js:901` — `function handleHumanCardClick(event) {`
- `script.js:2636` — `elements.playerHand.addEventListener("click", handleHumanCardClick);`

### `toggleEmotionPanel` — lines 999-1005
References: 2; direct calls: 0
- `script.js:999` — `function toggleEmotionPanel() {`
- `script.js:2633` — `elements.emotionButton.addEventListener("click", toggleEmotionPanel);`

### `handleEmotionClick` — lines 1007-1017
References: 2; direct calls: 0
- `script.js:1007` — `function handleEmotionClick(event) {`
- `script.js:2634` — `elements.emotionPanel.addEventListener("click", handleEmotionClick);`

### `handleBidClick` — lines 1137-1203
References: 2; direct calls: 0
- `script.js:1137` — `function handleBidClick(event) {`
- `script.js:2637` — `elements.bidOptions.addEventListener("click", handleBidClick);`

### `compareBotLeadLowCards` — lines 1739-1741
References: 2; direct calls: 0
- `script.js:1413` — `return [...standardCards, ...jokerCards].sort(compareBotLeadLowCards)[0];`
- `script.js:1739` — `function compareBotLeadLowCards(firstCard, secondCard) {`

### `createGameSummaryRow` — lines 1888-1910
References: 2; direct calls: 0
- `script.js:1880` — `list.replaceChildren(...summary.scores.map(createGameSummaryRow));`
- `script.js:1888` — `function createGameSummaryRow(item) {`

### `createScoreEntry` — lines 2001-2009
References: 3; direct calls: 0
- `rules/rules-progression-adapter.js:263` — `gameRow.entries = playerScores.map(createScoreEntry);`
- `script.js:1834` — `gameRow.entries = playerScores.map(createScoreEntry);`
- `script.js:2001` — `function createScoreEntry(score) {`

### `restartMatch` — lines 2207-2210
References: 3; direct calls: 0
- `script.js:2207` — `function restartMatch() {`
- `script.js:2230` — `createDialogButton("Новая партия", "primary", restartMatch),`
- `winner-podium.js:119` — `createDialogButton(copy.newGame, "primary", restartMatch),`

### `toggleScoreSheet` — lines 2511-2513
References: 3; direct calls: 0
- `script.js:2511` — `function toggleScoreSheet() {`
- `script.js:2631` — `elements.scoreButton.addEventListener("click", toggleScoreSheet);`
- `script.js:2632` — `elements.scoreClose.addEventListener("click", toggleScoreSheet);`

## Functions reassigned or wrapped elsewhere

### `buildPlayers` — declared at lines 162-169
- `high-joker-legal-fix.js:64` — `buildPlayers = function buildPlayersWithRandomBotNames(playerName) {`
- `random-bot-seats.js:15` — `buildPlayers = function buildPlayersWithRandomBotSeats(playerName) {`

### `startGame` — declared at lines 171-181
- `android-menu-motion.js:23` — `if (typeof startGame === "function") {`
- `android-menu-motion.js:25` — `startGame = function startGameWithMenuMotionSync(...args) {`
- `difficulty-select.js:17` — `if (typeof elements !== "undefined" && elements.startGame === originalStartButton) {`
- `difficulty-select.js:18` — `elements.startGame = startButton;`
- `difficulty-select.js:206` — `if (typeof window.startGame === "function") {`

### `startAceDeal` — declared at lines 183-214
- `ace-deal-animation.js:120` — `startAceDeal = function cinematicStartAceDeal() {`

### `dealUntilFirstAce` — declared at lines 216-242
- `ace-deal-animation.js:29` — `dealUntilFirstAce = function cinematicDealUntilFirstAce() {`

### `applyVisualSeatsFromPlayerOrder` — declared at lines 260-270
- `final-random-seats.js:21` — `applyVisualSeatsFromPlayerOrder = function finalRandomSeats() {`
- `visual-seat-order-polish.js:5` — `applyVisualSeatsFromPlayerOrder = function patchedApplyVisualSeatsFromPlayerOrder() {`

### `startDeal` — declared at lines 272-312
- `joker-announcement.js:103` — `startDeal = function startDealWithoutStaleJokerAnnouncement(...args) {`
- `last-trick-viewer.js:153` — `startDeal = function startDealWithLastTrickReset(...args) {`
- `rules/rules-hand-size-adapter.js:23` — `startDeal = function startDealFromRules() {`

### `completeDealAfterTrump` — declared at lines 314-329
- `rules/rules-hand-size-adapter.js:68` — `completeDealAfterTrump = function completeDealAfterTrumpFromRules() {`

### `runAfterDealAnimation` — declared at lines 344-351
- `android-deal-2026.js:630` — `runAfterDealAnimation = function runAfterAndroidStagingDeal(callback) {`
- `rules/deal-animation-adapter.js:204` — `runAfterDealAnimation = function runAfterProfileDealAnimation(callback) {`

### `createEmptyScoreRows` — declared at lines 425-445
- `rules/rules-progression-adapter.js:218` — `createEmptyScoreRows = function createProfileScoreRows() {`

### `render` — declared at lines 447-455
- `table-language.js:318` — `window.render = function translatedRender(...args) {`

### `renderPlayers` — declared at lines 457-488
- `android-runtime-polish.js:89` — `if (typeof renderPlayers === "function") {`
- `android-runtime-polish.js:90` — `renderPlayers = function renderCachedAndroidPlayers() {`

### `renderOpponentCardStacks` — declared at lines 490-502
- `android-opponent-hands.js:80` — `renderOpponentCardStacks = function renderResponsiveOpponentCardStacks() {`

### `renderHud` — declared at lines 542-562
- `android-runtime-v2.js:277` — `if (typeof renderHud === "function") renderHud = renderCachedHud;`
- `android-runtime-v2.js:277` — `if (typeof renderHud === "function") renderHud = renderCachedHud;`

### `getBidBalance` — declared at lines 564-583
- `rules/rules-hand-size-adapter.js:161` — `getBidBalance = function getBidBalanceForCurrentRules() {`

### `renderHand` — declared at lines 585-611
- `android-v15.js:68` — `renderHand = function androidV16CachedHand(...args) {`
- `rules/deal-animation-adapter.js:137` — `renderHand = function renderHandWithSequentialDeal(...args) {`

### `playCardDealAnimation` — declared at lines 644-674
- `android-deal-2026.js:551` — `playCardDealAnimation = function playAndroidStagingDeal(handCount) {`
- `rules/deal-animation-adapter.js:143` — `playCardDealAnimation = function slowerSequentialCardDealAnimation(handCount) {`
- `rules/rules-hand-size-adapter.js:226` — `playCardDealAnimation = function playCardDealAnimationFromRules(handCount) {`

### `playAceDealAnimation` — declared at lines 676-699
- `ace-deal-animation.js:118` — `playAceDealAnimation = playOpenAceDealAnimation;`

### `createCardElement` — declared at lines 701-701
- `card-image-renderer.js:58` — `createCardElement = function patchedCreateCardElement(card, options = {}) {`

### `renderTrick` — declared at lines 758-786
- `android-runtime-v2.js:279` — `if (typeof renderTrick === "function") {`
- `android-runtime-v2.js:281` — `renderTrick = function renderCachedAndroidTrick(...args) {`
- `joker-announcement.js:96` — `renderTrick = function renderTrickWithJokerAnnouncementCleanup(...args) {`

### `canHumanPlay` — declared at lines 801-807
- `android-v15.js:87` — `const playable = typeof canHumanPlay === "function" ? canHumanPlay(card) : true;`

### `isLegalCard` — declared at lines 809-811
- `android-runtime-polish.js:132` — `if (typeof isLegalCard === "function") {`
- `android-runtime-polish.js:175` — `isLegalCard = function cachedAndroidIsLegalCard(playerId, card) {`

### `getIllegalMoveReason` — declared at lines 813-835
- `high-joker-legal-fix.js:33` — `getIllegalMoveReason = function getIllegalMoveReasonWithHighJokerRule(playerId, card) {`

### `getLeadSuit` — declared at lines 837-846
- `android-runtime-polish.js:139` — `const leadSuit = typeof getLeadSuit === "function" ? (getLeadSuit() || "") : "";`
- `android-v15.js:55` — `const leadSuit = typeof getLeadSuit === "function" ? (getLeadSuit() || "") : "";`
- `medium-game-plan.js:72` — `const leadSuit = typeof getLeadSuit === "function" ? (getLeadSuit() || "") : "";`

### `playCard` — declared at lines 856-856
- `joker-announcement.js:88` — `playCard = function patchedPlayCard(playerId, cardId, options = {}) {`

### `renderBidding` — declared at lines 937-984
- `android-v12.js:109` — `renderBidding = function renderCachedV12Bidding(...args) {`
- `rules/rules-hand-size-adapter.js:92` — `renderBidding = function renderBiddingFromRules() {`

### `renderEmotionPanel` — declared at lines 986-997
- `game-emotions.js:96` — `renderEmotionPanel = renderCustomEmotionPanel;`

### `showPlayerEmotion` — declared at lines 1019-1041
- `game-emotions.js:77` — `showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {`

### `renderJokerModeSelection` — declared at lines 1077-1094
- `android-joker-v10.js:103` — `renderJokerModeSelection = function renderAndroidJokerModeSelection() {`

### `renderLeadJokerCommandSelection` — declared at lines 1096-1113
- `android-joker-v10.js:83` — `renderLeadJokerCommandSelection = function renderAndroidLeadJokerCommandSelection() {`

### `renderLeadJokerSuitSelection` — declared at lines 1115-1129
- `android-joker-v10.js:91` — `renderLeadJokerSuitSelection = function renderAndroidLeadJokerSuitSelection() {`

### `submitBid` — declared at lines 1251-1265
- `medium-bid-context.js:8` — `submitBid = function mediumBidContextSubmitBid(playerId, bid) {`

### `chooseBotBid` — declared at lines 1267-1279
- `bot-personality-polish.js:186` — `chooseBotBid = function personalityChooseBotBid(playerId) {`
- `medium-bid-planner.js:101` — `chooseBotBid = function mediumChooseBotBid(playerId) {`
- `medium-bot-self-learning.js:120` — `chooseBotBid = function mediumLearningChooseBotBid(playerId) {`
- `medium-forced-bid-brain.js:41` — `chooseBotBid = function mediumForcedBidBrainChooseBotBid(playerId) {`
- `medium-personality-v2.js:113` — `chooseBotBid = function mediumPersonalityChooseBid(playerId) {`
- `rules/rules-hand-size-adapter.js:195` — `chooseBotBid = function chooseBotBidWithinCurrentHand(playerId) {`
- `rules/short-deal-tactics.js:192` — `chooseBotBid = function expertShortDealBid(playerId) {`

### `estimateBidFromHand` — declared at lines 1281-1289
- `rules/rules-hand-size-adapter.js:183` — `estimateBidFromHand = function estimateBidFromCurrentHand(playerId) {`

### `isBidAllowedForCurrentTurn` — declared at lines 1318-1323
- `rules/rules-hand-size-adapter.js:143` — `isBidAllowedForCurrentTurn = function isBidAllowedForCurrentRules(bid) {`

### `hasForbiddenBidTotal` — declared at lines 1325-1327
- `rules/rules-hand-size-adapter.js:155` — `hasForbiddenBidTotal = function hasForbiddenBidTotalForCurrentRules() {`

### `chooseBotCard` — declared at lines 1403-1466
- `anti-premium-bots.js:236` — `chooseBotCard = function antiPremiumChooseBotCard(playerId) {`
- `bot-legal-guard.js:27` — `chooseBotCard = function guardedChooseBotCard(playerId) {`
- `bot-memory-polish.js:219` — `chooseBotCard = function smarterChooseBotCard(playerId) {`
- `bot-personality-polish.js:206` — `chooseBotCard = function personalityChooseBotCard(playerId) {`
- `endgame-smart-bots.js:295` — `chooseBotCard = function endgameSmartChooseBotCard(playerId) {`
- `joker-save-bots.js:42` — `chooseBotCard = function saveDuckJokerBotCard(playerId) {`
- `leader-pressure-bots.js:199` — `chooseBotCard = function leaderPressureChooseBotCard(playerId) {`
- `medium-bid-balance-war.js:262` — `chooseBotCard = function mediumBidBalanceWarChooseBotCard(playerId) {`
- `medium-desperation-guard.js:184` — `chooseBotCard = function mediumDesperationGuardChooseBotCard(playerId) {`
- `medium-endgame-table-war.js:187` — `chooseBotCard = function mediumEndgameWarChooseBotCard(playerId) {`
- `medium-four-hundred-anti-premium.js:306` — `chooseBotCard = function mediumFourHundredAntiPremiumChooseCard(playerId) {`
- `medium-four-hundred-control.js:260` — `chooseBotCard = function mediumFourHundredChooseBotCard(playerId) {`
- `medium-game-plan.js:252` — `chooseBotCard = function mediumGamePlanChooseBotCard(playerId) {`
- `medium-high-order-executor-v2.js:209` — `chooseBotCard = function mediumHighOrderExecutorChooseCard(playerId) {`
- `medium-human-pressure-v2.js:223` — `chooseBotCard = function mediumHumanPressureChooseCard(playerId) {`
- `medium-human-profile.js:249` — `chooseBotCard = function mediumHumanProfileChooseBotCard(playerId) {`
- `medium-light-sabotage.js:125` — `chooseBotCard = function mediumSabotageChooseBotCard(playerId) {`
- `medium-no-trump-control.js:195` — `chooseBotCard = function mediumNoTrumpChooseBotCard(playerId) {`
- `medium-overeat-control.js:50` — `chooseBotCard = function mediumOvereatChooseBotCard(playerId) {`
- `medium-overeat-push.js:101` — `chooseBotCard = function mediumOvereatPushChooseBotCard(playerId) {`
- `medium-personality-v2.js:131` — `chooseBotCard = function mediumPersonalityChooseCard(playerId) {`
- `medium-premium-trap.js:161` — `chooseBotCard = function mediumPremiumTrapChooseBotCard(playerId) {`
- `medium-recovery-plan.js:88` — `chooseBotCard = function mediumRecoveryChooseBotCard(playerId) {`
- `medium-strong-hand-executor.js:77` — `chooseBotCard = function mediumStrongHandChooseBotCard(playerId) {`
- `medium-suit-clear-executor.js:109` — `chooseBotCard = function mediumSuitClearExecutorChooseBotCard(playerId) {`
- `medium-table-cooperation.js:234` — `chooseBotCard = function mediumTableCooperationChooseBotCard(playerId) {`
- `medium-trump-economy.js:129` — `chooseBotCard = function mediumTrumpEconomyChooseBotCard(playerId) {`
- `medium-zero-trap.js:152` — `chooseBotCard = function mediumZeroTrapChooseBotCard(playerId) {`
- `personality-modes-bots.js:244` — `chooseBotCard = function personalityChooseBotCard(playerId) {`
- `player-goal-bots.js:188` — `chooseBotCard = function playerGoalChooseBotCard(playerId) {`
- `rules/bot-survival-priority.js:133` — `chooseBotCard = function chooseBotCardWithSurvivalPriority(playerId) {`
- `rules/short-deal-tactics.js:228` — `chooseBotCard = function oneCardJokerSacrifice(playerId) {`
- `rules/strategic-bot-brain.js:346` — `chooseBotCard = function strategicChooseBotCard(playerId) {`
- `smart-joker-bots.js:242` — `chooseBotCard = function smartJokerChooseBotCard(playerId) {`
- `smart-lead-bots.js:216` — `chooseBotCard = function smartLeadChooseBotCard(playerId) {`
- `trump-counting-bots.js:193` — `chooseBotCard = function trumpCountingChooseBotCard(playerId) {`
- `void-suit-memory-bots.js:134` — `chooseBotCard = function voidSuitMemoryChooseBotCard(playerId) {`

### `shouldSpendJokerNow` — declared at lines 1486-1503
- `bot-logic-polish.js:75` — `shouldSpendJokerNow = function polishedShouldSpendJokerNow(playerId) {`
- `bot-memory-polish.js:46` — `shouldSpendJokerNow = function smarterShouldSpendJokerNow(playerId) {`
- `medium-recovery-plan.js:80` — `shouldSpendJokerNow = function mediumRecoveryShouldSpendJokerNow(playerId) {`
- `personality-modes-bots.js:187` — `shouldSpendJokerNow = function personalityShouldSpendJokerNow(playerId) {`

### `shouldLeadHighTrumpJoker` — declared at lines 1505-1523
- `bot-logic-polish.js:97` — `shouldLeadHighTrumpJoker = function polishedShouldLeadHighTrumpJoker(playerId) {`
- `bot-memory-polish.js:54` — `shouldLeadHighTrumpJoker = function smarterShouldLeadHighTrumpJoker(playerId) {`
- `medium-strong-hand-executor.js:63` — `shouldLeadHighTrumpJoker = function mediumStrongShouldLeadHighTrumpJoker(playerId) {`
- `personality-modes-bots.js:203` — `shouldLeadHighTrumpJoker = function personalityShouldLeadHighTrumpJoker(playerId) {`

### `getUnseenHigherCardCount` — declared at lines 1572-1578
- `rules/core-logic-fixes.js:21` — `getUnseenHigherCardCount = function getUnseenHigherCardCountWithOwnHand(card, viewerId = null) {`
- `smart-lead-bots.js:149` — `if (typeof getUnseenHigherCardCount === "function") {`

### `getBotAttackPower` — declared at lines 1599-1607
- `anti-premium-bots.js:100` — `if (typeof getBotAttackPower === "function") {`

### `wouldCardWinCurrentTrick` — declared at lines 1623-1638
- `rules/core-logic-fixes.js:49` — `wouldCardWinCurrentTrick = function stableWouldCardWinCurrentTrick(playerId, card) {`

### `chooseJokerMode` — declared at lines 1675-1689
- `endgame-smart-bots.js:248` — `chooseJokerMode = function endgameJokerMode(playerId, card) {`
- `medium-bid-balance-war.js:246` — `chooseJokerMode = function mediumBidBalanceWarJokerMode(playerId, card) {`
- `medium-desperation-guard.js:168` — `chooseJokerMode = function mediumDesperationJokerMode(playerId, card) {`
- `medium-endgame-table-war.js:175` — `chooseJokerMode = function mediumEndgameWarJokerMode(playerId, card) {`
- `medium-four-hundred-anti-premium.js:290` — `chooseJokerMode = function mediumFourHundredAntiPremiumJokerMode(playerId, card) {`
- `medium-four-hundred-control.js:240` — `chooseJokerMode = function mediumFourHundredJokerMode(playerId, card) {`
- `medium-high-order-executor-v2.js:193` — `chooseJokerMode = function mediumHighOrderJokerMode(playerId, card) {`
- `medium-human-pressure-v2.js:207` — `chooseJokerMode = function mediumHumanPressureJokerMode(playerId, card) {`
- `medium-human-profile.js:237` — `chooseJokerMode = function mediumHumanProfileJokerMode(playerId, card) {`
- `medium-light-sabotage.js:117` — `chooseJokerMode = function mediumSabotageJokerMode(playerId, card) {`
- `medium-no-trump-control.js:175` — `chooseJokerMode = function mediumNoTrumpJokerMode(playerId, card) {`
- `medium-premium-trap.js:149` — `chooseJokerMode = function mediumPremiumTrapJokerMode(playerId, card) {`
- `medium-table-cooperation.js:218` — `chooseJokerMode = function mediumTableCooperationJokerMode(playerId, card) {`
- `medium-zero-trap.js:140` — `chooseJokerMode = function mediumZeroTrapJokerMode(playerId, card) {`
- `personality-modes-bots.js:222` — `chooseJokerMode = function personalityChooseJokerMode(playerId, card) {`
- `rules/bot-survival-priority.js:163` — `chooseJokerMode = function chooseJokerModeWithSurvivalPriority(playerId, card) {`
- `rules/short-deal-tactics.js:242` — `chooseJokerMode = function oneCardJokerSacrificeMode(playerId, card) {`
- `smart-joker-bots.js:199` — `chooseJokerMode = function smartJokerMode(playerId, card) {`

### `chooseLeadJokerAction` — declared at lines 1691-1699
- `anti-premium-bots.js:261` — `chooseLeadJokerAction = function antiPremiumLeadJokerAction(playerId) {`
- `bot-logic-polish.js:105` — `chooseLeadJokerAction = function polishedChooseLeadJokerAction(playerId) {`
- `bot-memory-polish.js:199` — `chooseLeadJokerAction = function smarterChooseLeadJokerAction(playerId) {`
- `endgame-smart-bots.js:272` — `chooseLeadJokerAction = function endgameLeadJokerAction(playerId) {`
- `lead-joker-command-fix.js:4` — `chooseLeadJokerAction = function fixedLeadJokerAction(playerId) {`
- `medium-desperation-guard.js:153` — `chooseLeadJokerAction = function mediumDesperationLeadJokerAction(playerId) {`
- `medium-four-hundred-anti-premium.js:275` — `chooseLeadJokerAction = function mediumFourHundredAntiPremiumLeadJokerAction(playerId) {`
- `medium-four-hundred-control.js:218` — `chooseLeadJokerAction = function mediumFourHundredLeadJokerAction(playerId) {`
- `medium-high-order-executor-v2.js:178` — `chooseLeadJokerAction = function mediumHighOrderLeadJokerAction(playerId) {`
- `medium-joker-command-plan.js:93` — `chooseLeadJokerAction = function mediumJokerCommandPlan(playerId) {`
- `medium-light-sabotage.js:103` — `chooseLeadJokerAction = function mediumSabotageLeadJokerAction(playerId) {`
- `medium-no-trump-control.js:160` — `chooseLeadJokerAction = function mediumNoTrumpLeadJokerAction(playerId) {`
- `rules/bot-survival-priority.js:174` — `chooseLeadJokerAction = function chooseLeadJokerActionWithSurvivalPriority(playerId) {`
- `smart-joker-bots.js:211` — `chooseLeadJokerAction = function smartLeadJokerAction(playerId) {`
- `smart-joker-suit-bots.js:98` — `chooseLeadJokerAction = function smartBotJokerSuit(playerId) {`

### `chooseLeadJokerSuit` — declared at lines 1701-1721
- `bot-memory-polish.js:191` — `chooseLeadJokerSuit = function smarterChooseLeadJokerSuit(playerId) {`

### `finishTrickSoon` — declared at lines 1761-1792
- `last-trick-viewer.js:138` — `finishTrickSoon = function finishTrickSoonWithLastTrick(...args) {`
- `trick-collect-animation.js:98` — `finishTrickSoon = function polishedFinishTrickSoon() {`

### `finishGameSoon` — declared at lines 1794-1824
- `pulka-summary.js:107` — `finishGameSoon = function patchedFinishGameSoon() {`
- `rules/rules-progression-adapter.js:338` — `finishGameSoon = function finishProfileGameSoon() {`

### `writeCurrentGameScore` — declared at lines 1826-1843
- `medium-bot-self-learning.js:143` — `writeCurrentGameScore = function mediumLearningWriteCurrentGameScore() {`
- `medium-human-profile.js:269` — `writeCurrentGameScore = function mediumHumanProfileWriteScore() {`
- `rules/rules-progression-adapter.js:244` — `writeCurrentGameScore = function writeProfileGameScore() {`

### `hideGameSummary` — declared at lines 1912-1916
- `pulka-summary.js:99` — `hideGameSummary = function patchedHideGameSummary() {`
- `rules/rules-progression-adapter.js:197` — `hideGameSummary = function hideProfilePulkaSummary() {`

### `calculatePlayerScore` — declared at lines 1926-1970
- `rules/rules-scoring-adapter.js:81` — `calculatePlayerScore = function calculatePlayerScoreFromProfile(player) {`

### `applyPulkaBonuses` — declared at lines 2020-2050
- `rules/rules-progression-adapter.js:281` — `applyPulkaBonuses = function applyPulkaBonusesFromProfile(pulkaOffset) {`

### `crossBestSuccessfulEntry` — declared at lines 2052-2072
- `pass-premium-cross-fix.js:2` — `crossBestSuccessfulEntry = function noPassPremiumCross(gameRows, playerIndex) {`

### `calculateMatchTotal` — declared at lines 2074-2089
- `leader-pressure-bots.js:12` — `return typeof calculateMatchTotal === "function" ? Number(calculateMatchTotal(playerId)) || 0 : 0;`

### `calculatePulkaTotal` — declared at lines 2091-2099
- `rules/rules-progression-adapter.js:286` — `calculatePulkaTotal = function calculatePulkaTotalFromProfile(playerId, pulkaOffset) {`

### `formatTotalScore` — declared at lines 2101-2103
- `winner-podium.js:33` — `if (typeof formatTotalScore === "function") {`

### `advanceGame` — declared at lines 2110-2118
- `rules/rules-progression-adapter.js:291` — `advanceGame = function advanceProfileGame() {`

### `isFinalGame` — declared at lines 2120-2122
- `rules/rules-progression-adapter.js:309` — `isFinalGame = function isFinalProfileGame() {`

### `resetGameState` — declared at lines 2156-2188
- `winner-podium.js:126` — `resetGameState = function patchedResetGameState() {`

### `goToMainMenu` — declared at lines 2202-2205
- `android-menu-motion.js:32` — `if (typeof goToMainMenu === "function") {`
- `android-menu-motion.js:34` — `goToMainMenu = function goToMainMenuWithMotionSync(...args) {`

### `showExitDialog` — declared at lines 2212-2225
- `winner-podium.js:132` — `showExitDialog = function patchedShowExitDialog() {`

### `showEndGameDialog` — declared at lines 2227-2234
- `main-menu-2026.js:587` — `window.showEndGameDialog = function showEndGameDialogWithRating(winner) {`
- `winner-podium.js:114` — `showEndGameDialog = function patchedShowEndGameDialog(winner) {`

### `createDialogButton` — declared at lines 2236-2243
- `table-language.js:334` — `window.createDialogButton = function translatedCreateDialogButton(text, variant, onClick) {`

### `showNotice` — declared at lines 2245-2248
- `table-language.js:327` — `window.showNotice = function translatedShowNotice(message) {`

### `getPlayerById` — declared at lines 2303-2305
- `android-deal-2026.js:356` — `|| (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"`
- `android-deal-2026.js:585` — `const player = typeof getPlayerById === "function" ? getPlayerById(playerId) : null;`

### `getGameLeaderId` — declared at lines 2307-2309
- `android-deal-2026.js:356` — `|| (typeof getPlayerById === "function" && typeof getGameLeaderId === "function"`

### `chooseBotTrump` — declared at lines 2327-2349
- `medium-trump-planner.js:54` — `chooseBotTrump = function mediumTrumpPlannerChooseBotTrump(playerId) {`

### `isFourHundredPulka` — declared at lines 2371-2373
- `rules/rules-progression-adapter.js:202` — `isFourHundredPulka = function isFourHundredPulkaFromProfile() {`

### `isChooseTrumpPulka` — declared at lines 2375-2377
- `rules/rules-progression-adapter.js:206` — `isChooseTrumpPulka = function isChooseTrumpPulkaFromProfile() {`

### `isNoTrumpPulka` — declared at lines 2379-2381
- `rules/rules-progression-adapter.js:210` — `isNoTrumpPulka = function isNoTrumpPulkaFromProfile() {`

### `isFixedTrumpPulka` — declared at lines 2383-2385
- `rules/rules-progression-adapter.js:214` — `isFixedTrumpPulka = function isFixedTrumpPulkaFromProfile() {`

### `getPlayerOrderFrom` — declared at lines 2387-2393
- `android-deal-2026.js:359` — `const order = typeof getPlayerOrderFrom === "function"`

### `renderScoreSheet` — declared at lines 2426-2453
- `android-v15.js:5` — `if (typeof renderScoreSheet === "function" && typeof elements !== "undefined" && elements.scoreSheet) {`
- `android-v15.js:20` — `renderScoreSheet = function androidV16RenderScoreSheet(force = false) {`
- `pulka-summary.js:32` — `if (typeof renderScoreSheet === "function") {`

### `getDevTargetFromUrl` — declared at lines 2515-2527
- `rules/rules-progression-adapter.js:318` — `getDevTargetFromUrl = function getProfileDevTargetFromUrl() {`

### `getDelay` — declared at lines 2533-2535
- `android-deal-2026.js:63` — `return typeof getDelay === "function" ? getDelay(value) : value;`

### `playSound` — declared at lines 2557-2601
- `sound-polish.js:154` — `playSound = function polishedPlaySound(type) {`

## Exact duplicate function bodies

_None._

## Most repeated simple `if` conditions

- **8×** `card.rank ===`
- **8×** `card.type ===`
- **6×** `state.autoPlay`
- **5×** `player.bid ===`
- **3×** `firstCard.type === && secondCard.type !==`
- **3×** `firstCard.type !== && secondCard.type ===`
- **3×** `state.phase === && state.activePlayerId ===`
- **3×** `trumpPlays.length`
- **2×** `firstCard.type === && secondCard.type ===`
- **2×** `!usesAndroidDeal`
- **2×** `state.autoPlay || !elements.table`
- **2×** `state.emotionTimeoutId`
- **2×** `chosenCard`
- **2×** `!wantsTrick`
- **2×** `neededTricks <= 0`
- **2×** `card.type !==`
- **2×** `second[1] !== first[1]`
- **2×** `player.tricks === 0`

## Tiny helper functions

- `sortHands` — lines 386-390; references 5, direct calls 4
- `createCardElement` — lines 701-701; references 8, direct calls 5
- `isLegalCard` — lines 809-811; references 37, direct calls 33
- `getTrumpSuit` — lines 848-850; references 88, direct calls 87
- `hasSuit` — lines 852-854; references 3, direct calls 2
- `playCard` — lines 856-856; references 10, direct calls 6
- `isEmotionCoolingDown` — lines 1051-1053; references 3, direct calls 2
- `getOrderedBidTotal` — lines 1131-1135; references 12, direct calls 11
- `getCurrentBidderId` — lines 1247-1249; references 7, direct calls 4
- `getBidNumber` — lines 1314-1316; references 21, direct calls 20
- `isBidAllowedForCurrentTurn` — lines 1318-1323; references 17, direct calls 15
- `hasForbiddenBidTotal` — lines 1325-1327; references 3, direct calls 1
- `getJokerCount` — lines 1554-1556; references 7, direct calls 6
- `getSuitCards` — lines 1558-1560; references 10, direct calls 9
- `getPlayedStandardCards` — lines 1562-1566; references 5, direct calls 4
- `isHigherCardAlreadyPlayed` — lines 1568-1570; references 2, direct calls 1
- `getCurrentWinningPlay` — lines 1640-1642; references 23, direct calls 22
- `needsJokerModeChoice` — lines 1654-1656; references 3, direct calls 2
- `needsLeadJokerChoice` — lines 1658-1660; references 3, direct calls 2
- `compareBotLeadLowCards` — lines 1739-1741; references 2, direct calls 0
- `hideGameSummary` — lines 1912-1916; references 9, direct calls 1
- `formatPlayerScore` — lines 1918-1920; references 1, direct calls 0
- `scoreValue` — lines 1922-1924; references 1, direct calls 0
- `formatScoreEntryLabel` — lines 2011-2013; references 4, direct calls 2
- `syncScoreRow` — lines 2015-2018; references 5, direct calls 2
- `formatTotalScore` — lines 2101-2103; references 7, direct calls 5
- `formatPulkaDelta` — lines 2105-2108; references 4, direct calls 3
- `isFinalGame` — lines 2120-2122; references 6, direct calls 4
- `clearGameTasks` — lines 2151-2154; references 2, direct calls 1
- `goToMainMenu` — lines 2202-2205; references 7, direct calls 0
- `restartMatch` — lines 2207-2210; references 3, direct calls 0
- `showNotice` — lines 2245-2248; references 20, direct calls 17
- `hideNotice` — lines 2250-2252; references 18, direct calls 13
- `getHighestStandardPlay` — lines 2297-2301; references 6, direct calls 5
- `getPlayerById` — lines 2303-2305; references 62, direct calls 59
- `getGameLeaderId` — lines 2307-2309; references 10, direct calls 8
- `createTrumpFromChoice` — lines 2323-2325; references 2, direct calls 1
- `getMiddleDeckTrump` — lines 2351-2355; references 2, direct calls 1
- `isFourHundredPulka` — lines 2371-2373; references 66, direct calls 64
- `isChooseTrumpPulka` — lines 2375-2377; references 3, direct calls 1
- `isNoTrumpPulka` — lines 2379-2381; references 3, direct calls 1
- `isFixedTrumpPulka` — lines 2383-2385; references 3, direct calls 1
- `getNextPlayerId` — lines 2395-2399; references 2, direct calls 1
- `hasCardsLeft` — lines 2401-2403; references 4, direct calls 3
- `getTrumpRenderKey` — lines 2405-2407; references 3, direct calls 2
- `formatScoreCell` — lines 2484-2486; references 4, direct calls 3
- `toggleScoreSheet` — lines 2511-2513; references 3, direct calls 0
- `clamp` — lines 2529-2531; references 13, direct calls 12
- `getDelay` — lines 2533-2535; references 25, direct calls 23
- `resumeAudio` — lines 2553-2555; references 3, direct calls 2
- `getBotPlayDelay` — lines 2615-2617; references 2, direct calls 1
- `getBotDecisionDelay` — lines 2619-2621; references 3, direct calls 2
- `getRandomDelay` — lines 2623-2625; references 3, direct calls 2

## Full function inventory

| Function | Lines | Body lines | References | Direct calls | Reassigned |
|---|---:|---:|---:|---:|:---:|
| `createJokerDeck` | 123-149 | 25 | 7 | 6 |  |
| `shuffle` | 151-160 | 8 | 5 | 4 |  |
| `buildPlayers` | 162-169 | 6 | 6 | 1 | yes |
| `startGame` | 171-181 | 9 | 13 | 3 | yes |
| `startAceDeal` | 183-214 | 30 | 3 | 1 | yes |
| `dealUntilFirstAce` | 216-242 | 25 | 4 | 2 | yes |
| `applyTableOrderFromAceWinner` | 244-258 | 13 | 3 | 2 |  |
| `applyVisualSeatsFromPlayerOrder` | 260-270 | 9 | 5 | 1 | yes |
| `startDeal` | 272-312 | 39 | 13 | 7 | yes |
| `completeDealAfterTrump` | 314-329 | 14 | 7 | 5 | yes |
| `startTurnAfterDeal` | 331-342 | 10 | 3 | 0 |  |
| `runAfterDealAnimation` | 344-351 | 6 | 8 | 4 | yes |
| `startTrumpSelection` | 353-384 | 30 | 3 | 0 |  |
| `sortHands` | 386-390 | 3 | 5 | 4 |  |
| `compareCards` | 392-413 | 20 | 2 | 0 |  |
| `getHandSuitGroup` | 415-423 | 7 | 3 | 2 |  |
| `createEmptyScoreRows` | 425-445 | 19 | 4 | 2 | yes |
| `render` | 447-455 | 7 | 45 | 40 | yes |
| `renderPlayers` | 457-488 | 30 | 4 | 1 | yes |
| `renderOpponentCardStacks` | 490-502 | 11 | 4 | 2 | yes |
| `formatBid` | 504-510 | 5 | 4 | 3 |  |
| `isBidBroken` | 512-528 | 15 | 3 | 2 |  |
| `isBidFulfilledNow` | 530-540 | 9 | 3 | 2 |  |
| `renderHud` | 542-562 | 19 | 4 | 1 | yes |
| `getBidBalance` | 564-583 | 18 | 4 | 2 | yes |
| `renderHand` | 585-611 | 25 | 7 | 1 | yes |
| `getSeatDealTarget` | 613-622 | 8 | 6 | 5 |  |
| `createDealLayer` | 624-632 | 7 | 6 | 5 |  |
| `createFlyingBack` | 634-642 | 7 | 5 | 4 |  |
| `playCardDealAnimation` | 644-674 | 29 | 6 | 1 | yes |
| `playAceDealAnimation` | 676-699 | 22 | 4 | 2 | yes |
| `createCardElement` | 701-701 | 0 | 8 | 5 | yes |
| `markDealAnimation` | 750-756 | 5 | 5 | 4 |  |
| `renderTrick` | 758-786 | 27 | 7 | 1 | yes |
| `formatJokerPlaySuffix` | 788-799 | 10 | 1 | 0 |  |
| `canHumanPlay` | 801-807 | 5 | 4 | 2 | yes |
| `isLegalCard` | 809-811 | 1 | 37 | 33 | yes |
| `getIllegalMoveReason` | 813-835 | 21 | 5 | 2 | yes |
| `getLeadSuit` | 837-846 | 8 | 9 | 5 | yes |
| `getTrumpSuit` | 848-850 | 1 | 88 | 87 |  |
| `hasSuit` | 852-854 | 1 | 3 | 2 |  |
| `playCard` | 856-856 | 0 | 10 | 6 | yes |
| `handleHumanCardClick` | 901-935 | 33 | 2 | 0 |  |
| `renderBidding` | 937-984 | 46 | 5 | 1 | yes |
| `renderEmotionPanel` | 986-997 | 10 | 3 | 1 | yes |
| `toggleEmotionPanel` | 999-1005 | 5 | 2 | 0 |  |
| `handleEmotionClick` | 1007-1017 | 9 | 2 | 0 |  |
| `showPlayerEmotion` | 1019-1041 | 21 | 3 | 1 | yes |
| `startEmotionCooldown` | 1043-1049 | 5 | 2 | 1 |  |
| `isEmotionCoolingDown` | 1051-1053 | 1 | 3 | 2 |  |
| `renderTrumpSelection` | 1055-1075 | 19 | 3 | 2 |  |
| `renderJokerModeSelection` | 1077-1094 | 16 | 4 | 2 | yes |
| `renderLeadJokerCommandSelection` | 1096-1113 | 16 | 4 | 2 | yes |
| `renderLeadJokerSuitSelection` | 1115-1129 | 13 | 4 | 2 | yes |
| `getOrderedBidTotal` | 1131-1135 | 3 | 12 | 11 |  |
| `handleBidClick` | 1137-1203 | 65 | 2 | 0 |  |
| `processBiddingTurns` | 1205-1245 | 39 | 6 | 5 |  |
| `getCurrentBidderId` | 1247-1249 | 1 | 7 | 4 |  |
| `submitBid` | 1251-1265 | 13 | 6 | 3 | yes |
| `chooseBotBid` | 1267-1279 | 11 | 18 | 3 | yes |
| `estimateBidFromHand` | 1281-1289 | 7 | 4 | 1 | yes |
| `getBidCardValue` | 1291-1312 | 20 | 3 | 2 |  |
| `getBidNumber` | 1314-1316 | 1 | 21 | 20 |  |
| `isBidAllowedForCurrentTurn` | 1318-1323 | 4 | 17 | 15 | yes |
| `hasForbiddenBidTotal` | 1325-1327 | 1 | 3 | 1 | yes |
| `rewindLastBidForForbiddenTotal` | 1329-1344 | 14 | 2 | 1 |  |
| `startPlayingCurrentGame` | 1346-1361 | 14 | 3 | 2 |  |
| `continueBotTurns` | 1363-1401 | 37 | 10 | 9 |  |
| `chooseBotCard` | 1403-1466 | 62 | 76 | 2 | yes |
| `shouldPlayerTakeTrick` | 1468-1484 | 15 | 15 | 14 |  |
| `shouldSpendJokerNow` | 1486-1503 | 16 | 18 | 9 | yes |
| `shouldLeadHighTrumpJoker` | 1505-1523 | 17 | 13 | 4 | yes |
| `shouldBeatStrongTrumpWithJoker` | 1525-1542 | 16 | 3 | 2 |  |
| `isStrongTrumpPlay` | 1544-1552 | 7 | 2 | 1 |  |
| `getJokerCount` | 1554-1556 | 1 | 7 | 6 |  |
| `getSuitCards` | 1558-1560 | 1 | 10 | 9 |  |
| `getPlayedStandardCards` | 1562-1566 | 3 | 5 | 4 |  |
| `isHigherCardAlreadyPlayed` | 1568-1570 | 1 | 2 | 1 |  |
| `getUnseenHigherCardCount` | 1572-1578 | 5 | 22 | 19 | yes |
| `isLikelyHighCard` | 1580-1597 | 16 | 4 | 3 |  |
| `getBotAttackPower` | 1599-1607 | 7 | 5 | 3 | yes |
| `hasStrongLeadCard` | 1609-1621 | 11 | 3 | 2 |  |
| `wouldCardWinCurrentTrick` | 1623-1638 | 14 | 45 | 43 | yes |
| `getCurrentWinningPlay` | 1640-1642 | 1 | 23 | 22 |  |
| `getHighLeadJokerPlay` | 1644-1652 | 7 | 4 | 3 |  |
| `needsJokerModeChoice` | 1654-1656 | 1 | 3 | 2 |  |
| `needsLeadJokerChoice` | 1658-1660 | 1 | 3 | 2 |  |
| `getJokerPlayOptions` | 1662-1673 | 10 | 3 | 2 |  |
| `chooseJokerMode` | 1675-1689 | 13 | 41 | 4 | yes |
| `chooseLeadJokerAction` | 1691-1699 | 7 | 35 | 4 | yes |
| `chooseLeadJokerSuit` | 1701-1721 | 19 | 7 | 5 | yes |
| `compareBotCards` | 1723-1737 | 13 | 31 | 3 |  |
| `compareBotLeadLowCards` | 1739-1741 | 1 | 2 | 0 |  |
| `compareBotLeadHighCards` | 1743-1759 | 15 | 8 | 0 |  |
| `finishTrickSoon` | 1761-1792 | 30 | 5 | 1 | yes |
| `finishGameSoon` | 1794-1824 | 29 | 5 | 2 | yes |
| `writeCurrentGameScore` | 1826-1843 | 16 | 9 | 3 | yes |
| `createGameSummary` | 1845-1867 | 21 | 4 | 3 |  |
| `showGameSummary` | 1869-1886 | 16 | 6 | 5 |  |
| `createGameSummaryRow` | 1888-1910 | 21 | 2 | 0 |  |
| `hideGameSummary` | 1912-1916 | 3 | 9 | 1 | yes |
| `formatPlayerScore` | 1918-1920 | 1 | 1 | 0 |  |
| `scoreValue` | 1922-1924 | 1 | 1 | 0 |  |
| `calculatePlayerScore` | 1926-1970 | 43 | 8 | 5 | yes |
| `calculateFourHundredScore` | 1972-1999 | 26 | 2 | 1 |  |
| `createScoreEntry` | 2001-2009 | 7 | 3 | 0 |  |
| `formatScoreEntryLabel` | 2011-2013 | 1 | 4 | 2 |  |
| `syncScoreRow` | 2015-2018 | 2 | 5 | 2 |  |
| `applyPulkaBonuses` | 2020-2050 | 29 | 3 | 1 | yes |
| `crossBestSuccessfulEntry` | 2052-2072 | 19 | 3 | 1 | yes |
| `calculateMatchTotal` | 2074-2089 | 14 | 13 | 11 | yes |
| `calculatePulkaTotal` | 2091-2099 | 7 | 4 | 2 | yes |
| `formatTotalScore` | 2101-2103 | 1 | 7 | 5 | yes |
| `formatPulkaDelta` | 2105-2108 | 2 | 4 | 3 |  |
| `advanceGame` | 2110-2118 | 7 | 7 | 5 | yes |
| `isFinalGame` | 2120-2122 | 1 | 6 | 4 | yes |
| `finishMatch` | 2124-2139 | 14 | 4 | 3 |  |
| `scheduleGameTask` | 2141-2149 | 7 | 37 | 35 |  |
| `clearGameTasks` | 2151-2154 | 2 | 2 | 1 |  |
| `resetGameState` | 2156-2188 | 31 | 5 | 2 | yes |
| `clearEmotionState` | 2190-2200 | 9 | 2 | 1 |  |
| `goToMainMenu` | 2202-2205 | 2 | 7 | 0 | yes |
| `restartMatch` | 2207-2210 | 2 | 3 | 0 |  |
| `showExitDialog` | 2212-2225 | 12 | 4 | 0 | yes |
| `showEndGameDialog` | 2227-2234 | 6 | 5 | 1 | yes |
| `createDialogButton` | 2236-2243 | 6 | 9 | 6 | yes |
| `showNotice` | 2245-2248 | 2 | 20 | 17 | yes |
| `hideNotice` | 2250-2252 | 1 | 18 | 13 |  |
| `getTrickWinner` | 2254-2295 | 40 | 7 | 5 |  |
| `getHighestStandardPlay` | 2297-2301 | 3 | 6 | 5 |  |
| `getPlayerById` | 2303-2305 | 1 | 62 | 59 | yes |
| `getGameLeaderId` | 2307-2309 | 1 | 10 | 8 | yes |
| `getTrumpForCurrentGame` | 2311-2321 | 9 | 3 | 2 |  |
| `createTrumpFromChoice` | 2323-2325 | 1 | 2 | 1 |  |
| `chooseBotTrump` | 2327-2349 | 21 | 5 | 2 | yes |
| `getMiddleDeckTrump` | 2351-2355 | 3 | 2 | 1 |  |
| `createSuitTrump` | 2357-2369 | 11 | 5 | 4 |  |
| `isFourHundredPulka` | 2371-2373 | 1 | 66 | 64 | yes |
| `isChooseTrumpPulka` | 2375-2377 | 1 | 3 | 1 | yes |
| `isNoTrumpPulka` | 2379-2381 | 1 | 3 | 1 | yes |
| `isFixedTrumpPulka` | 2383-2385 | 1 | 3 | 1 | yes |
| `getPlayerOrderFrom` | 2387-2393 | 5 | 8 | 6 | yes |
| `getNextPlayerId` | 2395-2399 | 3 | 2 | 1 |  |
| `hasCardsLeft` | 2401-2403 | 1 | 4 | 3 |  |
| `getTrumpRenderKey` | 2405-2407 | 1 | 3 | 2 |  |
| `createTrumpCardElement` | 2409-2424 | 14 | 3 | 2 |  |
| `renderScoreSheet` | 2426-2453 | 26 | 9 | 4 | yes |
| `createScoreCell` | 2455-2466 | 10 | 8 | 7 |  |
| `createPulkaTotalElement` | 2468-2482 | 13 | 2 | 1 |  |
| `formatScoreCell` | 2484-2486 | 1 | 4 | 3 |  |
| `createScoreEntryElement` | 2488-2509 | 20 | 2 | 1 |  |
| `toggleScoreSheet` | 2511-2513 | 1 | 3 | 0 |  |
| `getDevTargetFromUrl` | 2515-2527 | 11 | 3 | 1 | yes |
| `clamp` | 2529-2531 | 1 | 13 | 12 |  |
| `getDelay` | 2533-2535 | 1 | 25 | 23 | yes |
| `initAudio` | 2537-2551 | 13 | 3 | 2 |  |
| `resumeAudio` | 2553-2555 | 1 | 3 | 2 |  |
| `playSound` | 2557-2601 | 43 | 18 | 14 | yes |
| `getSoundProfile` | 2603-2613 | 9 | 2 | 1 |  |
| `getBotPlayDelay` | 2615-2617 | 1 | 2 | 1 |  |
| `getBotDecisionDelay` | 2619-2621 | 1 | 3 | 2 |  |
| `getRandomDelay` | 2623-2625 | 1 | 3 | 2 |  |

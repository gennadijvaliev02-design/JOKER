# `script.js` override/load audit

## References to Android override files

### `android-joker-v10.js` — 0


### `android-v14.js` — 0


### `android-v15.js` — 0


### `android-runtime-v11.js` — 0


## Target function assignments, captures, and calls

### `renderJokerModeSelection`

- **assignment** `android-joker-v10.js:103` — `renderJokerModeSelection = function renderAndroidJokerModeSelection() {`
- **call** `script.js:932` — `renderJokerModeSelection();`
- **declaration** `script.js:1060` — `function renderJokerModeSelection() {`
- **call** `rules/rules-hand-size-adapter.js:104` — `renderJokerModeSelection();`

### `renderLeadJokerCommandSelection`

- **assignment** `android-joker-v10.js:83` — `renderLeadJokerCommandSelection = function renderAndroidLeadJokerCommandSelection() {`
- **call** `script.js:922` — `renderLeadJokerCommandSelection();`
- **declaration** `script.js:1079` — `function renderLeadJokerCommandSelection() {`
- **call** `rules/rules-hand-size-adapter.js:94` — `renderLeadJokerCommandSelection();`

### `renderLeadJokerSuitSelection`

- **assignment** `android-joker-v10.js:91` — `renderLeadJokerSuitSelection = function renderAndroidLeadJokerSuitSelection() {`
- **call** `script.js:927` — `renderLeadJokerSuitSelection();`
- **declaration** `script.js:1098` — `function renderLeadJokerSuitSelection() {`
- **call** `rules/rules-hand-size-adapter.js:99` — `renderLeadJokerSuitSelection();`

### `renderEmotionPanel`

- **declaration** `script.js:969` — `function renderEmotionPanel() {`
- **call** `script.js:2614` — `renderEmotionPanel();`
- **reference** `game-emotions.js:96` — `renderEmotionPanel = renderCustomEmotionPanel;`

### `showPlayerEmotion`

- **call** `script.js:997` — `showPlayerEmotion("bottom", button.dataset.emotion);`
- **declaration** `script.js:1002` — `function showPlayerEmotion(seat, emotion) {`
- **assignment** `game-emotions.js:77` — `showPlayerEmotion = function showCustomPlayerEmotion(seat, emotionId) {`

### `renderBidding`

- **call** `script.js:436` — `renderBidding();`
- **declaration** `script.js:920` — `function renderBidding() {`
- **capture** `android-v12.js:107` — `const originalRenderBidding = renderBidding;`
- **assignment** `android-v12.js:109` — `renderBidding = function renderCachedV12Bidding(...args) {`
- **assignment** `rules/rules-hand-size-adapter.js:92` — `renderBidding = function renderBiddingFromRules() {`

### `renderTrumpSelection`

- **call** `script.js:937` — `renderTrumpSelection();`
- **declaration** `script.js:1038` — `function renderTrumpSelection() {`
- **call** `rules/rules-hand-size-adapter.js:109` — `renderTrumpSelection();`

### `startAceDeal`

- **call** `script.js:163` — `startAceDeal();`
- **declaration** `script.js:166` — `function startAceDeal() {`
- **assignment** `ace-deal-animation.js:120` — `startAceDeal = function cinematicStartAceDeal() {`

### `dealUntilFirstAce`

- **capture** `script.js:175` — `const aceDeal = dealUntilFirstAce();`
- **declaration** `script.js:199` — `function dealUntilFirstAce() {`
- **assignment** `ace-deal-animation.js:29` — `dealUntilFirstAce = function cinematicDealUntilFirstAce() {`
- **capture** `ace-deal-animation.js:129` — `const aceDeal = dealUntilFirstAce();`

### `renderPlayers`

- **reference** `android-runtime-polish.js:89` — `if (typeof renderPlayers === "function") {`
- **assignment** `android-runtime-polish.js:90` — `renderPlayers = function renderCachedAndroidPlayers() {`
- **call** `script.js:431` — `renderPlayers();`
- **declaration** `script.js:440` — `function renderPlayers() {`

### `renderHud`

- **call** `script.js:432` — `renderHud();`
- **declaration** `script.js:525` — `function renderHud() {`
- **reference** `android-runtime-v2.js:277` — `if (typeof renderHud === "function") renderHud = renderCachedHud;`

### `renderHand`

- **reference** `android-v15.js:47` — `if (handCacheInstalled || typeof renderHand !== "function" || !elements?.playerHand) return;`
- **capture** `android-v15.js:50` — `const fullRenderHand = renderHand;`
- **assignment** `android-v15.js:68` — `renderHand = function androidV16CachedHand(...args) {`
- **call** `script.js:434` — `renderHand();`
- **declaration** `script.js:568` — `function renderHand() {`
- **capture** `rules/deal-animation-adapter.js:136` — `const originalRenderHand = renderHand;`
- **assignment** `rules/deal-animation-adapter.js:137` — `renderHand = function renderHandWithSequentialDeal(...args) {`

## Script loader construction

### `index.html`

- line 167: `<script src="rules/aggression-rules.js?v=2"></script>`
- line 168: `<script src="rules/popular-rules.js?v=2"></script>`
- line 169: `<script src="rules/rules-engine.js?v=9"></script>`
- line 170: `<script src="script.js?v=34"></script>`
- line 171: `<script src="ai-difficulty.js?v=1"></script>`
- line 172: `<script src="medium-bid-context.js?v=1"></script>`
- line 173: `<script src="medium-bid-planner.js?v=1"></script>`
- line 174: `<script src="medium-forced-bid-brain.js?v=1"></script>`
- line 175: `<script src="medium-trump-planner.js?v=1"></script>`
- line 176: `<script src="medium-bot-self-learning.js?v=1"></script>`
- line 177: `<script src="game-emotions.js?v=2"></script>`
- line 178: `<script src="pass-premium-cross-fix.js?v=1"></script>`
- line 179: `<script src="lead-joker-command-fix.js?v=1"></script>`
- line 180: `<script src="high-joker-legal-fix.js?v=5"></script>`
- line 181: `<script src="visual-seat-order-polish.js?v=1"></script>`
- line 182: `<script src="card-image-renderer.js?v=4"></script>`
- line 183: `<script src="bot-logic-polish.js?v=1"></script>`
- line 184: `<script>window.__JOKER_BOT_LOGIC_POLISH_READY__ = true;</script>`
- line 185: `<script src="preload.js?v=4"></script>`
- line 186: `<script src="ace-deal-animation.js?v=11"></script>`
- line 187: `<script src="joker-announcement.js?v=3"></script>`
- line 188: `<script src="winner-podium.js?v=2"></script>`
- line 189: `<script src="pulka-summary.js?v=6"></script>`
- line 190: `<script src="bot-memory-polish.js?v=2"></script>`
- line 191: `<script src="bot-personality-polish.js?v=5"></script>`
- line 192: `<script src="anti-premium-bots.js?v=2"></script>`
- line 193: `<script src="smart-joker-suit-bots.js?v=3"></script>`
- line 194: `<script src="joker-save-bots.js?v=2"></script>`
- line 195: `<script src="void-suit-memory-bots.js?v=2"></script>`
- line 196: `<script src="trump-counting-bots.js?v=1"></script>`
- line 197: `<script src="player-goal-bots.js?v=1"></script>`
- line 198: `<script src="leader-pressure-bots.js?v=1"></script>`
- line 199: `<script src="smart-lead-bots.js?v=1"></script>`
- line 200: `<script src="smart-joker-bots.js?v=1"></script>`
- line 201: `<script src="personality-modes-bots.js?v=1"></script>`
- line 202: `<script src="endgame-smart-bots.js?v=1"></script>`
- line 203: `<script src="medium-game-plan.js?v=1"></script>`
- line 204: `<script src="medium-strong-hand-executor.js?v=1"></script>`
- line 205: `<script src="medium-recovery-plan.js?v=1"></script>`
- line 206: `<script src="medium-overeat-control.js?v=1"></script>`
- line 207: `<script src="medium-overeat-push.js?v=1"></script>`
- line 208: `<script src="medium-premium-trap.js?v=1"></script>`
- line 209: `<script src="medium-zero-trap.js?v=2"></script>`
- line 210: `<script src="medium-light-sabotage.js?v=2"></script>`
- line 211: `<script src="medium-human-profile.js?v=1"></script>`
- line 212: `<script src="medium-endgame-table-war.js?v=1"></script>`
- line 213: `<script src="medium-joker-command-plan.js?v=1"></script>`
- line 214: `<script src="medium-suit-clear-executor.js?v=1"></script>`
- line 215: `<script src="medium-bid-balance-war.js?v=2"></script>`
- line 216: `<script src="medium-table-cooperation.js?v=2"></script>`
- line 217: `<script src="medium-four-hundred-control.js?v=1"></script>`
- line 218: `<script src="medium-no-trump-control.js?v=1"></script>`
- line 219: `<script src="medium-trump-economy.js?v=1"></script>`
- line 220: `<script src="medium-personality-v2.js?v=1"></script>`
- line 221: `<script src="medium-desperation-guard.js?v=1"></script>`
- line 222: `<script src="medium-high-order-executor-v2.js?v=1"></script>`
- line 223: `<script src="medium-human-pressure-v2.js?v=1"></script>`
- line 224: `<script src="medium-four-hundred-anti-premium.js?v=1"></script>`
- line 225: `<script src="bot-legal-guard.js?v=2"></script>`
- line 226: `<script src="trick-collect-animation.js?v=7"></script>`
- line 227: `<script src="last-trick-viewer.js?v=3"></script>`
- line 228: `<script src="main-menu-2026.js?v=3"></script>`
- line 229: `<script src="difficulty-select.js?v=5"></script>`
- line 230: `<script src="table-language.js?v=4"></script>`
- line 231: `<script src="sound-polish.js?v=10"></script>`
- line 232: `<script src="selection-sound-polish.js?v=1"></script>`

### `rules/rules-engine.js`

- line 93: `const adapter = document.createElement("script");`
- line 94: `adapter.src = src;`


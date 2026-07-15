# Android loader all-file audit

## `android-joker-v10` — 8

- `SCRIPT_OVERRIDE_AUDIT.md:5` — `### `android-joker-v10.js` — 0`
- `SCRIPT_OVERRIDE_AUDIT.md:21` — `- **assignment** `android-joker-v10.js:103` — `renderJokerModeSelection = function renderAndroidJokerModeSelection() {``
- `SCRIPT_OVERRIDE_AUDIT.md:28` — `- **assignment** `android-joker-v10.js:83` — `renderLeadJokerCommandSelection = function renderAndroidLeadJokerCommandSelection() {``
- `SCRIPT_OVERRIDE_AUDIT.md:35` — `- **assignment** `android-joker-v10.js:91` — `renderLeadJokerSuitSelection = function renderAndroidLeadJokerSuitSelection() {``
- `.github/workflows/audit-script-overrides.yml:46` — `needles = ['android-joker-v10.js', 'android-v14.js', 'android-v15.js', 'android-runtime-v11.js']`
- `.github/workflows/audit-android-loader-all-files.yml:27` — `'android-joker-v10', 'android-v14', 'android-v15',`
- `.github/workflows/android-apk.yml:170` — `sed -i 's#</body>#    <script src="android-opponent-hands.js?v=3"></script>\n    <script src="android-menu-motion.js?v=2"></script>\n    <script src="android-runtime-polish.js?v=5"></script>\n    <script src="android-runtime-v2.js?v=4"></script>\n    <script src="android-joker-v10.js?v=2"></script>\n    <script src="android-runtime-v11.js?v=5"></script>\n    <script src="android-v12.js?v=4"></script>\n    <script src="android-v14.js?v=3"></script>\n    <script src="android-v15.js?v=5"></script>\n    <script src="android-deal-2026.js?v=20260715-2"></script>\n  </body>#' www/index.html`
- `.github/workflows/android-apk.yml:184` — `grep -q 'android-joker-v10.js?v=2' www/index.html`

## `android-v14` — 7

- `SCRIPT_OVERRIDE_AUDIT.md:8` — `### `android-v14.js` — 0`
- `android-v14.js:37` — `["android-v14-stylesheet", "android-v14.css?v=1"],`
- `.github/workflows/audit-script-overrides.yml:46` — `needles = ['android-joker-v10.js', 'android-v14.js', 'android-v15.js', 'android-runtime-v11.js']`
- `.github/workflows/audit-android-loader-all-files.yml:27` — `'android-joker-v10', 'android-v14', 'android-v15',`
- `.github/workflows/android-apk.yml:170` — `sed -i 's#</body>#    <script src="android-opponent-hands.js?v=3"></script>\n    <script src="android-menu-motion.js?v=2"></script>\n    <script src="android-runtime-polish.js?v=5"></script>\n    <script src="android-runtime-v2.js?v=4"></script>\n    <script src="android-joker-v10.js?v=2"></script>\n    <script src="android-runtime-v11.js?v=5"></script>\n    <script src="android-v12.js?v=4"></script>\n    <script src="android-v14.js?v=3"></script>\n    <script src="android-v15.js?v=5"></script>\n    <script src="android-deal-2026.js?v=20260715-2"></script>\n  </body>#' www/index.html`
- `.github/workflows/android-apk.yml:249` — `! grep -q 'playCardDealAnimation' www/android-v14.js`
- `.github/workflows/android-apk.yml:250` — `! grep -q 'runAfterDealAnimation' www/android-v14.js`

## `android-v15` — 15

- `SCRIPT_OVERRIDE_AUDIT.md:11` — `### `android-v15.js` — 0`
- `SCRIPT_OVERRIDE_AUDIT.md:94` — `- **reference** `android-v15.js:47` — `if (handCacheInstalled || typeof renderHand !== "function" || !elements?.playerHand) return;``
- `SCRIPT_OVERRIDE_AUDIT.md:95` — `- **capture** `android-v15.js:50` — `const fullRenderHand = renderHand;``
- `SCRIPT_OVERRIDE_AUDIT.md:96` — `- **assignment** `android-v15.js:68` — `renderHand = function androidV16CachedHand(...args) {``
- `.github/workflows/audit-script-overrides.yml:46` — `needles = ['android-joker-v10.js', 'android-v14.js', 'android-v15.js', 'android-runtime-v11.js']`
- `.github/workflows/audit-android-loader-all-files.yml:27` — `'android-joker-v10', 'android-v14', 'android-v15',`
- `.github/workflows/android-apk.yml:80` — `! grep -q 'MutationObserver' android-v15.js`
- `.github/workflows/android-apk.yml:115` — `! grep -q 'android-deal-container-mask-style' android-v15.js`
- `.github/workflows/android-apk.yml:170` — `sed -i 's#</body>#    <script src="android-opponent-hands.js?v=3"></script>\n    <script src="android-menu-motion.js?v=2"></script>\n    <script src="android-runtime-polish.js?v=5"></script>\n    <script src="android-runtime-v2.js?v=4"></script>\n    <script src="android-joker-v10.js?v=2"></script>\n    <script src="android-runtime-v11.js?v=5"></script>\n    <script src="android-v12.js?v=4"></script>\n    <script src="android-v14.js?v=3"></script>\n    <script src="android-v15.js?v=5"></script>\n    <script src="android-deal-2026.js?v=20260715-2"></script>\n  </body>#' www/index.html`
- `.github/workflows/android-apk.yml:187` — `grep -q 'android-v15.js?v=5' www/index.html`
- `.github/workflows/android-apk.yml:237` — `! grep -q 'MutationObserver' www/android-v15.js`
- `.github/workflows/android-apk.yml:241` — `! grep -q 'window.setInterval =' www/android-v15.js`
- `.github/workflows/android-apk.yml:242` — `! grep -q '__JOKER_ANDROID_INTERVAL_GUARD__' www/android-v15.js`
- `.github/workflows/android-apk.yml:282` — `! grep -q 'android-deal-container-mask-style' www/android-v15.js`
- `.github/workflows/cleanup-pr-audit.yml:74` — `! grep -q 'MutationObserver' android-v15.js`

## `android-runtime-v11` — 10

- `SCRIPT_OVERRIDE_AUDIT.md:14` — `### `android-runtime-v11.js` — 0`
- `.github/workflows/audit-script-overrides.yml:46` — `needles = ['android-joker-v10.js', 'android-v14.js', 'android-v15.js', 'android-runtime-v11.js']`
- `.github/workflows/audit-android-loader-all-files.yml:28` — `'android-runtime-v11', 'android-runtime-v13',`
- `.github/workflows/android-apk.yml:78` — `! grep -q 'MutationObserver' android-runtime-v11.js`
- `.github/workflows/android-apk.yml:81` — `! grep -q 'installHudHook' android-runtime-v11.js`
- `.github/workflows/android-apk.yml:170` — `sed -i 's#</body>#    <script src="android-opponent-hands.js?v=3"></script>\n    <script src="android-menu-motion.js?v=2"></script>\n    <script src="android-runtime-polish.js?v=5"></script>\n    <script src="android-runtime-v2.js?v=4"></script>\n    <script src="android-joker-v10.js?v=2"></script>\n    <script src="android-runtime-v11.js?v=5"></script>\n    <script src="android-v12.js?v=4"></script>\n    <script src="android-v14.js?v=3"></script>\n    <script src="android-v15.js?v=5"></script>\n    <script src="android-deal-2026.js?v=20260715-2"></script>\n  </body>#' www/index.html`
- `.github/workflows/android-apk.yml:185` — `grep -q 'android-runtime-v11.js?v=5' www/index.html`
- `.github/workflows/android-apk.yml:235` — `! grep -q 'MutationObserver' www/android-runtime-v11.js`
- `.github/workflows/android-apk.yml:238` — `! grep -q 'installHudHook' www/android-runtime-v11.js`
- `.github/workflows/cleanup-pr-audit.yml:72` — `! grep -q 'MutationObserver' android-runtime-v11.js`

## `android-runtime-v13` — 4

- `android-runtime-v11.js:5` — `if (document.getElementById("android-runtime-v13-stylesheet")) return;`
- `android-runtime-v11.js:8` — `link.id = "android-runtime-v13-stylesheet";`
- `android-runtime-v11.js:10` — `link.href = "android-runtime-v13.css?v=1";`
- `.github/workflows/audit-android-loader-all-files.yml:28` — `'android-runtime-v11', 'android-runtime-v13',`

## `evaluateJavascript` — 1

- `.github/workflows/audit-android-loader-all-files.yml:29` — `'evaluateJavascript', 'loadUrl(', 'WebView',`

## `loadUrl(` — 1

- `.github/workflows/audit-android-loader-all-files.yml:29` — `'evaluateJavascript', 'loadUrl(', 'WebView',`

## `WebView` — 6

- `preload.js:26` — `// The image is already loaded; older WebViews may reject decode().`
- `android-fullscreen.css:3` — `* Removes the browser-era 2.16:1 letterbox and lets the native WebView`
- `android-fullscreen.css:75` — `/* Paint behind rounded corners/cutouts instead of exposing a white WebView. */`
- `android-webview-paint.css:1` — `/* Android WebView paint cleanup — preserve layout and colors, reduce repaint cost. */`
- `android-app.css:115` — `/* Older Android WebViews may ignore the individual `translate` property.`
- `.github/workflows/audit-android-loader-all-files.yml:29` — `'evaluateJavascript', 'loadUrl(', 'WebView',`

## `index.html` — 41

- `SCRIPT_OVERRIDE_AUDIT.md:104` — `### `index.html``
- `.github/workflows/audit-android-loader-all-files.yml:30` — `'index.html', 'file:///android_asset', 'copy',`
- `.github/workflows/android-apk.yml:56` — `parser.feed(Path('index.html').read_text(encoding='utf-8'))`
- `.github/workflows/android-apk.yml:73` — `! grep -q 'android-calm-joker-v11.css' index.html`
- `.github/workflows/android-apk.yml:74` — `! grep -q 'joker-image-cards.js' index.html`
- `.github/workflows/android-apk.yml:75` — `! grep -q 'joker-panel-cancel.js' index.html`
- `.github/workflows/android-apk.yml:76` — `! grep -q 'played-card-motion.css' index.html`
- `.github/workflows/android-apk.yml:161` — `sed -i 's/web-table-polish.css?v=4/web-table-polish.css?v=19/' www/index.html`
- `.github/workflows/android-apk.yml:162` — `sed -i 's/game-emotions.js?v=2/game-emotions.js?v=3/' www/index.html`
- `.github/workflows/android-apk.yml:163` — `sed -i 's/table-language.js?v=4/table-language.js?v=5/' www/index.html`
- `.github/workflows/android-apk.yml:164` — `sed -i 's/width=device-width, initial-scale=1.0/width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1.0/' www/index.html`
- `.github/workflows/android-apk.yml:167` — `sed -i 's#</head>#    <link rel="stylesheet" href="android-table-v2.css?v=2" />\n    <link rel="stylesheet" href="android-ui-v4.css?v=1" />\n    <link rel="stylesheet" href="android-ui-v5.css?v=1" />\n    <link rel="stylesheet" href="android-ui-v6.css?v=1" />\n    <link rel="stylesheet" href="android-ui-v7.css?v=2" />\n    <link rel="stylesheet" href="android-motion-v2.css?v=2" />\n    <link rel="stylesheet" href="android-fullscreen.css?v=1" />\n    <link rel="stylesheet" href="android-ui-v8.css?v=2" />\n    <link rel="stylesheet" href="android-ui-v9.css?v=2" />\n    <link rel="stylesheet" href="android-ui-v10.css?v=3" />\n    <link rel="stylesheet" href="android-ui-v11.css?v=4" />\n    <link rel="stylesheet" href="android-ui-v12.css?v=3" />\n  </head>#' www/index.html`
- `.github/workflows/android-apk.yml:170` — `sed -i 's#</body>#    <script src="android-opponent-hands.js?v=3"></script>\n    <script src="android-menu-motion.js?v=2"></script>\n    <script src="android-runtime-polish.js?v=5"></script>\n    <script src="android-runtime-v2.js?v=4"></script>\n    <script src="android-joker-v10.js?v=2"></script>\n    <script src="android-runtime-v11.js?v=5"></script>\n    <script src="android-v12.js?v=4"></script>\n    <script src="android-v14.js?v=3"></script>\n    <script src="android-v15.js?v=5"></script>\n    <script src="android-deal-2026.js?v=20260715-2"></script>\n  </body>#' www/index.html`
- `.github/workflows/android-apk.yml:172` — `grep -q 'table-language.js?v=5' www/index.html`
- `.github/workflows/android-apk.yml:173` — `grep -q 'android-ui-v7.css?v=2' www/index.html`
- `.github/workflows/android-apk.yml:174` — `grep -q 'android-motion-v2.css?v=2' www/index.html`
- `.github/workflows/android-apk.yml:175` — `grep -q 'android-ui-v8.css?v=2' www/index.html`
- `.github/workflows/android-apk.yml:176` — `grep -q 'android-ui-v9.css?v=2' www/index.html`
- `.github/workflows/android-apk.yml:177` — `grep -q 'android-ui-v10.css?v=3' www/index.html`
- `.github/workflows/android-apk.yml:178` — `grep -q 'android-ui-v11.css?v=4' www/index.html`
- `.github/workflows/android-apk.yml:179` — `grep -q 'android-ui-v12.css?v=3' www/index.html`
- `.github/workflows/android-apk.yml:180` — `grep -q 'android-opponent-hands.js?v=3' www/index.html`
- `.github/workflows/android-apk.yml:181` — `grep -q 'android-menu-motion.js?v=2' www/index.html`
- `.github/workflows/android-apk.yml:182` — `grep -q 'android-runtime-polish.js?v=5' www/index.html`
- `.github/workflows/android-apk.yml:183` — `grep -q 'android-runtime-v2.js?v=4' www/index.html`
- `.github/workflows/android-apk.yml:184` — `grep -q 'android-joker-v10.js?v=2' www/index.html`
- `.github/workflows/android-apk.yml:185` — `grep -q 'android-runtime-v11.js?v=5' www/index.html`
- `.github/workflows/android-apk.yml:186` — `grep -q 'android-v12.js?v=4' www/index.html`
- `.github/workflows/android-apk.yml:187` — `grep -q 'android-v15.js?v=5' www/index.html`
- `.github/workflows/android-apk.yml:188` — `grep -q 'android-deal-2026.js?v=20260715-2' www/index.html`
- `.github/workflows/android-apk.yml:208` — `parser.feed(Path('www/index.html').read_text(encoding='utf-8'))`
- `.github/workflows/android-apk.yml:222` — `! grep -q 'android-deal-v3.js' www/index.html`
- `.github/workflows/android-apk.yml:223` — `! grep -q 'android-deal-v4.js' www/index.html`
- `.github/workflows/android-apk.yml:224` — `! grep -q 'android-deal-v5.js' www/index.html`
- `.github/workflows/android-apk.yml:225` — `! grep -q 'android-v17.js' www/index.html`
- `.github/workflows/android-apk.yml:226` — `! grep -q 'android-calm-joker-v11.css' www/index.html`
- `.github/workflows/android-apk.yml:227` — `! grep -q 'joker-image-cards.js' www/index.html`
- `.github/workflows/android-apk.yml:228` — `! grep -q 'joker-panel-cancel.js' www/index.html`
- `.github/workflows/android-apk.yml:229` — `! grep -q 'played-card-motion.css' www/index.html`
- `.github/workflows/android-apk.yml:268` — `! grep -q 'rules/deal-animation-adapter.js' www/index.html`
- `.github/workflows/cleanup-pr-audit.yml:54` — `parser.feed(Path('index.html').read_text(encoding='utf-8'))`

## `file:///android_asset` — 1

- `.github/workflows/audit-android-loader-all-files.yml:30` — `'index.html', 'file:///android_asset', 'copy',`

## `copy` — 163

- `difficulty-select.css:149` — `.difficulty-copy {`
- `joker-announcement.js:29` — `const copy = getCopy();`
- `joker-announcement.js:31` — `const playerName = play.player.seat === "bottom" ? copy.you : play.player.name;`
- `joker-announcement.js:32` — `const commandText = play.jokerCommand === "take" ? copy.take : copy.high;`
- `joker-announcement.js:36` — `declaredText: copy.declared,`
- `pulka-summary.js:42` — `const copy = getCopy();`
- `pulka-summary.js:53` — `title.textContent = copy.pulkaFinished(pulkaNumber);`
- `pulka-summary.js:57` — `subtitle.textContent = copy.subtitle;`
- `pulka-summary.js:76` — `name.textContent = item.player.seat === "bottom" ? copy.you : item.player.name;`
- `pulka-summary.js:108` — `const copy = getCopy();`
- `pulka-summary.js:111` — `showNotice(copy.gameFinished(state.currentGame));`
- `winner-podium.js:74` — `const copy = t();`
- `winner-podium.js:83` — `kicker.textContent = copy.matchFinished;`
- `winner-podium.js:102` — `score.textContent = `${copy.score}: ${formatWinnerScore(winnerTotal)}`;`
- `winner-podium.js:115` — `const copy = t();`
- `winner-podium.js:119` — `createDialogButton(copy.newGame, "primary", restartMatch),`
- `winner-podium.js:120` — `createDialogButton(copy.mainMenu, "", goToMainMenu),`
- `difficulty-select.js:82` — `<span class="difficulty-copy">`
- `difficulty-select.js:89` — `<span class="difficulty-copy">`
- `ace-deal-animation.js:55` — `const copy = getAceCopy();`
- `ace-deal-animation.js:56` — `return player?.seat === "bottom" ? copy.you : player?.name || copy.player;`
- `ace-deal-animation.js:92` — `const copy = getAceCopy();`
- `ace-deal-animation.js:102` — `title.textContent = copy.title;`
- `ace-deal-animation.js:106` — `winnerText.textContent = `${copy.firstAce} ${getPlayerDisplayName(winner)}`;`
- `main-menu-2026.js:480` — `const copy = getCopy();`
- `main-menu-2026.js:490` — `<div class="local-rating-points">${stats.rating} ${copy.points}</div>`
- `main-menu-2026.js:494` — `<span>${next ? `${copy.next}: ${Math.max(0, next.min - stats.rating)}` : copy.max}</span>`
- `main-menu-2026.js:498` — `<div class="local-rating-stat"><b>${stats.games}</b><span>${copy.games}</span></div>`
- `main-menu-2026.js:499` — `<div class="local-rating-stat"><b>${stats.wins}</b><span>${copy.wins}</span></div>`
- `main-menu-2026.js:500` — `<div class="local-rating-stat"><b>${getWinRate(stats)}%</b><span>${copy.winRate}</span></div>`
- `main-menu-2026.js:564` — `const copy = getCopy();`
- `main-menu-2026.js:574` — `<div class="rating-result-title">${copy.result} · ${getLeagueName(league)}</div>`
- `main-menu-2026.js:576` — `${copy.placement}: #${result.place} · ${result.after.rating} ${copy.points}${next ? ` · ${copy.next}: ${Math.max(0, next.min - result.after.rating)}` : ` · ${copy.max}`}`
- `last-trick-viewer.js:19` — `const copy = getCopy();`
- `last-trick-viewer.js:23` — `if (button && button.textContent !== copy.button) button.textContent = copy.button;`
- `last-trick-viewer.js:24` — `if (title && title.textContent !== copy.title) title.textContent = copy.title;`
- `last-trick-viewer.js:35` — `const copy = getCopy();`
- `last-trick-viewer.js:41` — `button.textContent = copy.button;`
- `last-trick-viewer.js:54` — `title.textContent = copy.title;`
- `table-language.js:100` — `function translateMessage(text, copy) {`
- `table-language.js:104` — `.replace(/^Выбери козырь$/i, copy.chooseTrump)`
- `table-language.js:105` — `.replace(/^Choose trump$/i, copy.chooseTrump)`
- `table-language.js:106` — `.replace(/^Твой заказ$/i, copy.yourBid)`
- `table-language.js:107` — `.replace(/^Your bid$/i, copy.yourBid)`
- `table-language.js:108` — `.replace(/^Команда джокера$/i, copy.jokerCommand)`
- `table-language.js:109` — `.replace(/^Joker command$/i, copy.jokerCommand)`
- `table-language.js:110` — `.replace(/^Как сыграть джокером\?$/i, copy.jokerQuestion)`
- `table-language.js:111` — `.replace(/^How to play the Joker\?$/i, copy.jokerQuestion)`
- `table-language.js:112` — `.replace(/^(.+) думает над козырем\.\.\.$/i, `$1 ${copy.thinksTrump}`)`
- `table-language.js:113` — `.replace(/^(.+) is choosing trump\.\.\.$/i, `$1 ${copy.thinksTrump}`)`
- `table-language.js:114` — `.replace(/^(.+) думает над заказом\.\.\.$/i, `$1 ${copy.bidThinking}`)`
- `table-language.js:115` — `.replace(/^(.+) is thinking about the bid\.\.\.$/i, `$1 ${copy.bidThinking}`)`
- `table-language.js:116` — `.replace(/^(.+) думает$/i, `$1 ${copy.thinking}`)`
- `table-language.js:117` — `.replace(/^(.+) is thinking$/i, `$1 ${copy.thinking}`)`
- `table-language.js:118` — `.replace(/^Нужно ходить в масть$/i, copy.mustFollowSuit)`
- `table-language.js:119` — `.replace(/^You must follow suit$/i, copy.mustFollowSuit)`
- `table-language.js:120` — `.replace(/^Масти нет — нужно кинуть козырь$/i, copy.mustThrowTrump)`
- `table-language.js:121` — `.replace(/^No suit — you must play trump$/i, copy.mustThrowTrump)`
- `table-language.js:122` — `.replace(/^Игра\s+(\d+)\s+завершена$/i, `${copy.game} $1 ${copy.completed}`)`
- `table-language.js:123` — `.replace(/^Game\s+(\d+)\s+finished$/i, `${copy.game} $1 ${copy.completed}`)`
- `table-language.js:124` — `.replace(/^Пулька\s+(\d+)\.\s+Игра\s+(\d+)\.\s+Новая раздача$/i, `${copy.pulkaCap} $1. ${copy.game} $2. ${copy.newDeal}`)`
- `table-language.js:125` — `.replace(/^Bullet\s+(\d+)\.\s+Game\s+(\d+)\.\s+New deal$/i, `${copy.pulkaCap} $1. ${copy.game} $2. ${copy.newDeal}`)`
- `table-language.js:126` — `.replace(/^Игра\s+(\d+)\.\s+Новая раздача$/i, `${copy.game} $1. ${copy.newDeal}`)`
- `table-language.js:127` — `.replace(/^Game\s+(\d+)\.\s+New deal$/i, `${copy.game} $1. ${copy.newDeal}`)`
- `table-language.js:128` — `.replace(/^Партия завершена\. Победитель:\s+(.+)$/i, `${copy.finished}. ${copy.winner}: $1`)`
- `table-language.js:129` — `.replace(/^Match finished\. Winner:\s+(.+)$/i, `${copy.finished}. ${copy.winner}: $1`)`
- `table-language.js:130` — `.replace(/^Выйти из партии\?$/i, copy.exitQuestion)`
- `table-language.js:131` — `.replace(/^Leave the match\?$/i, copy.exitQuestion)`
- `table-language.js:132` — `.replace(/^Победитель:\s+(.+)$/i, `${copy.winner}: $1`)`
- `table-language.js:133` — `.replace(/^Winner:\s+(.+)$/i, `${copy.winner}: $1`);`
- `table-language.js:136` — `function translatePanelText(text, copy) {`
- `table-language.js:137` — `return translateMessage(text, copy)`
- `table-language.js:138` — `.replace(/^Заказ$/i, copy.bid)`
- `table-language.js:139` — `.replace(/^Bid$/i, copy.bid)`
- `table-language.js:140` — `.replace(/^Козырь$/i, copy.trump)`
- `table-language.js:141` — `.replace(/^Trump$/i, copy.trump)`
- `table-language.js:142` — `.replace(/^Джокер$/i, copy.joker)`
- `table-language.js:143` — `.replace(/^Joker$/i, copy.joker)`
- `table-language.js:144` — `.replace(/^Безка$/i, copy.noTrump)`
- `table-language.js:145` — `.replace(/^No trump$/i, copy.noTrump)`
- `table-language.js:146` — `.replace(/^Пас$/i, copy.pass)`
- `table-language.js:147` — `.replace(/^Pass$/i, copy.pass)`
- `table-language.js:148` — `.replace(/^Берет$/i, copy.takeButton)`
- `table-language.js:149` — `.replace(/^Take$/i, copy.takeButton)`
- `table-language.js:150` — `.replace(/^Высший$/i, copy.highButton)`
- `table-language.js:151` — `.replace(/^High$/i, copy.highButton)`
- `table-language.js:152` — `.replace(/^Берет масть$/i, copy.takeSuit)`
- `table-language.js:153` — `.replace(/^Take suit$/i, copy.takeSuit)`
- `table-language.js:154` — `.replace(/^Подсунуть$/i, copy.duckButton)`
- `table-language.js:155` — `.replace(/^Duck$/i, copy.duckButton)`
- `table-language.js:156` — `.replace(/^Перебить$/i, copy.beatButton)`
- `table-language.js:157` — `.replace(/^Beat$/i, copy.beatButton);`
- `table-language.js:160` — `function translatePlayerNames(copy) {`
- `table-language.js:163` — `if (name.textContent !== copy.you) name.textContent = copy.you;`
- `table-language.js:168` — `function translateThinkingBadges(copy) {`
- `table-language.js:170` — `const base = name.dataset.name === "bottom" ? copy.you : name.textContent.replace(/\s+(думает|is thinking)$/i, "");`
- `table-language.js:171` — `const value = `${base} ${copy.thinking}`;`
- `table-language.js:176` — `function translateTrumpLabel(copy) {`
- `table-language.js:181` — `const value = translateMessage(label.textContent, copy).replace(/^Козырь$/i, copy.trump).replace(/^Trump$/i, copy.trump);`
- `table-language.js:187` — `if (firstText && firstText.textContent !== copy.trump) {`
- `table-language.js:188` — `firstText.textContent = copy.trump;`
- `table-language.js:192` — `function translateBidPanel(copy) {`
- `table-language.js:198` — `const value = translatePanelText(title.textContent, copy);`
- `table-language.js:203` — `const value = translatePanelText(button.textContent, copy);`
- `table-language.js:208` — `function translateRoundBalance(copy) {`
- `table-language.js:213` — `.replace(/^пихается\s+(\d+)/i, `${copy.push} $1`)`
- `table-language.js:214` — `.replace(/^отнимается\s+(\d+)/i, `${copy.take} $1`)`
- `table-language.js:215` — `.replace(/^push\s+(\d+)/i, `${copy.push} $1`)`
- `table-language.js:216` — `.replace(/^take away\s+(\d+)/i, `${copy.take} $1`);`
- `table-language.js:220` — `function translatePlayedLabels(copy) {`
- `table-language.js:222` — `const value = label.textContent.replace(/^Ты/, copy.you).replace(/^You/, copy.you);`
- `table-language.js:227` — `function translateSummary(copy) {`
- `table-language.js:233` — `.replace(/^Игра\s+(\d+)\s+·\s+пулька\s+(\d+)/i, `${copy.game} $1 · ${copy.pulka} $2`)`
- `table-language.js:234` — `.replace(/^Game\s+(\d+)\s+·\s+bullet\s+(\d+)/i, `${copy.game} $1 · ${copy.pulka} $2`);`
- `table-language.js:239` — `if ((name.textContent === "Ты" || name.textContent === "You") && name.textContent !== copy.you) {`
- `table-language.js:240` — `name.textContent = copy.you;`
- `table-language.js:245` — `function translateDialog(copy) {`
- `table-language.js:251` — `const value = translateMessage(dialogTitle.textContent, copy);`
- `table-language.js:257` — `.replace(/^Продолжить$/i, copy.continue)`
- `table-language.js:258` — `.replace(/^Continue$/i, copy.continue)`
- `table-language.js:259` — `.replace(/^В меню$/i, copy.toMenu)`
- `table-language.js:260` — `.replace(/^To menu$/i, copy.toMenu)`
- `table-language.js:261` — `.replace(/^Главное меню$/i, copy.mainMenu)`
- `table-language.js:262` — `.replace(/^Main menu$/i, copy.mainMenu)`
- `table-language.js:263` — `.replace(/^Новая партия$/i, copy.newGame)`
- `table-language.js:264` — `.replace(/^New game$/i, copy.newGame);`
- `table-language.js:269` — `function translateScoreSheet(copy) {`
- `table-language.js:272` — `setText(".sheet-title", copy.scoreCap);`
- `table-language.js:279` — `const copy = t();`
- `table-language.js:281` — `setText(".turn-pill", copy.yourTurn);`
- `table-language.js:282` — `setText("#score-button", copy.score);`
- `table-language.js:286` — `const value = translateMessage(notice.textContent, copy);`
- `table-language.js:290` — `translatePlayerNames(copy);`
- `table-language.js:291` — `translateThinkingBadges(copy);`
- `table-language.js:292` — `translateTrumpLabel(copy);`
- `table-language.js:293` — `translateBidPanel(copy);`
- `table-language.js:294` — `translateRoundBalance(copy);`
- `table-language.js:295` — `translatePlayedLabels(copy);`
- `table-language.js:296` — `translateSummary(copy);`
- `table-language.js:297` — `translateDialog(copy);`
- `table-language.js:298` — `translateScoreSheet(copy);`
- `table-language.js:335` — `const copy = t();`
- `table-language.js:336` — `const translated = translatePanelText(text, copy)`
- `table-language.js:337` — `.replace(/^Продолжить$/i, copy.continue)`
- `table-language.js:338` — `.replace(/^В меню$/i, copy.toMenu)`
- `table-language.js:339` — `.replace(/^Главное меню$/i, copy.mainMenu)`
- `table-language.js:340` — `.replace(/^Новая партия$/i, copy.newGame);`
- `rules/rules-book.js:380` — `const copy = COPY[language];`
- `rules/rules-book.js:381` — `const current = copy[pageId];`
- `rules/rules-book.js:384` — `closeButton.setAttribute("aria-label", copy.close);`
- `rules/rules-book.js:385` — `previousButton.setAttribute("aria-label", copy.previous);`
- `rules/rules-book.js:386` — `nextButton.setAttribute("aria-label", copy.next);`
- `rules/rules-book.js:389` — `<div class="rules-book-kicker">${copy.bookLabel}</div>`
- `rules/rules-select.js:37` — `<span class="difficulty-copy">`
- `rules/rules-select.js:44` — `<span class="difficulty-copy">`
- `rules/rules-progression-adapter.js:140` — `const copy = getSummaryCopy();`
- `rules/rules-progression-adapter.js:152` — `title.textContent = copy.pulkaFinished(pulkaNumber);`
- `rules/rules-progression-adapter.js:156` — `subtitle.textContent = copy.subtitle;`
- `rules/rules-progression-adapter.js:175` — `name.textContent = item.player.seat === "bottom" ? copy.you : item.player.name;`
- `rules/rules-progression-adapter.js:339` — `const copy = getSummaryCopy();`
- `rules/rules-progression-adapter.js:342` — `showNotice(copy.gameFinished(state.currentGame));`
- `rules/rules-progression-adapter.js:373` — `showNotice(copy.newDeal(state.currentGame));`
- `.github/workflows/audit-android-loader-all-files.yml:30` — `'index.html', 'file:///android_asset', 'copy',`

## Android/native/build file inventory

- `.github/workflows/android-apk.yml`
- `.github/workflows/cleanup-pr-audit.yml`
- `android-app.css`
- `android-deal-2026.css`
- `android-deal-2026.js`
- `android-emotions.css`
- `android-fullscreen.css`
- `android-joker-v10.js`
- `android-menu-motion.js`
- `android-motion-v2.css`
- `android-opponent-hands.js`
- `android-runtime-polish.js`
- `android-runtime-v11.js`
- `android-runtime-v13.css`
- `android-runtime-v2.js`
- `android-table-v2.css`
- `android-ui-v10.css`
- `android-ui-v11.css`
- `android-ui-v12.css`
- `android-ui-v4.css`
- `android-ui-v5.css`
- `android-ui-v6.css`
- `android-ui-v7.css`
- `android-ui-v8.css`
- `android-ui-v9.css`
- `android-v12.js`
- `android-v14.css`
- `android-v14.js`
- `android-v15.js`
- `android-webview-paint.css`

# `script.js` unused/branch audit

- Total findings: **5**

## `no-unused-vars` — 5

- line 247, column 46: 'index' is defined but never used.
- line 1592, column 28: 'playerId' is defined but never used.
- line 1999, column 26: '_' is defined but never used.
- line 2015, column 28: '_' is defined but never used.
- line 2365, column 29: '_' is defined but never used.

## Context

### Lines 245-249

```js
  245:   let botSeatIndex = 0;
  246: 
> 247:   state.players = state.players.map((player, index) => {
  248:     return {
  249:       ...player,
```

### Lines 1590-1594

```js
 1590: }
 1591: 
>1592: function hasStrongLeadCard(playerId, cards) {
 1593:   return cards.some((card) => {
 1594:     if (card.type === "joker") {
```

### Lines 1997-2001

```js
 1997:   const premiumPlayerIndexes = [];
 1998: 
>1999:   state.players.forEach((_, playerIndex) => {
 2000:     const entries = gameRows.map((row) => row.entries[playerIndex]);
 2001: 
```

### Lines 2013-2017

```js
 2013: 
 2014:   if (premiumPlayerIndexes.length) {
>2015:     state.players.forEach((_, playerIndex) => {
 2016:       if (premiumPlayerIndexes.includes(playerIndex)) {
 2017:         return;
```

### Lines 2363-2367

```js
 2363:   const startIndex = state.players.findIndex((player) => player.id === playerId);
 2364: 
>2365:   return state.players.map((_, offset) => {
 2366:     return state.players[(startIndex + offset) % state.players.length].id;
 2367:   });
```


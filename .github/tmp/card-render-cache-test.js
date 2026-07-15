"use strict";

function handSignature(state) {
  let signature = `${state.dealAnimationKey}|${state.shouldAnimateDeal ? 1 : 0}`;
  for (let index = 0; index < state.hand.length; index += 1) {
    signature += `|${state.hand[index].id}:${state.playability[index] ? 1 : 0}`;
  }
  return signature;
}

function trickSignature(state) {
  let signature = `${state.languageVersion}|${state.collectTo || ""}`;
  for (const play of state.plays) {
    signature += [
      play.playerId,
      play.playerName,
      play.seat,
      play.cardId,
      play.jokerMode,
      play.jokerCommand,
      play.jokerSuit,
      play.order,
    ].join(":");
    signature += "|";
  }
  return signature;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

for (let run = 0; run < 30000; run += 1) {
  const handLength = randomInt(10);
  const hand = Array.from({ length: handLength }, (_, index) => ({ id: `${run}-${index}-${randomInt(40)}` }));
  const playability = hand.map(() => Math.random() > 0.45);
  const handState = {
    dealAnimationKey: randomInt(15),
    shouldAnimateDeal: Math.random() > 0.8,
    hand,
    playability,
  };
  const sameHandState = {
    dealAnimationKey: handState.dealAnimationKey,
    shouldAnimateDeal: handState.shouldAnimateDeal,
    hand: hand.map((card) => ({ ...card })),
    playability: [...playability],
  };
  if (handSignature(handState) !== handSignature(sameHandState)) {
    throw new Error("equal hand render state produced different signatures");
  }

  if (handLength) {
    const changedPlayable = { ...sameHandState, playability: [...sameHandState.playability] };
    changedPlayable.playability[0] = !changedPlayable.playability[0];
    if (handSignature(handState) === handSignature(changedPlayable)) {
      throw new Error("playability change was not detected");
    }

    const changedCard = {
      ...sameHandState,
      hand: sameHandState.hand.map((card) => ({ ...card })),
    };
    changedCard.hand[0].id += "-changed";
    if (handSignature(handState) === handSignature(changedCard)) {
      throw new Error("hand card change was not detected");
    }
  }

  const playCount = randomInt(5);
  const plays = Array.from({ length: playCount }, (_, index) => ({
    playerId: `p${randomInt(4)}`,
    playerName: `Player ${randomInt(20)}`,
    seat: ["left", "top", "right", "bottom"][randomInt(4)],
    cardId: `c${randomInt(38)}`,
    jokerMode: ["", "lead", "beat", "duck"][randomInt(4)],
    jokerCommand: ["", "take", "high"][randomInt(3)],
    jokerSuit: ["", "spades", "clubs", "hearts", "diamonds"][randomInt(5)],
    order: index,
  }));
  const trickState = {
    languageVersion: randomInt(4),
    collectTo: ["", "left", "top", "right", "bottom"][randomInt(5)],
    plays,
  };
  const sameTrickState = {
    languageVersion: trickState.languageVersion,
    collectTo: trickState.collectTo,
    plays: plays.map((play) => ({ ...play })),
  };
  if (trickSignature(trickState) !== trickSignature(sameTrickState)) {
    throw new Error("equal trick render state produced different signatures");
  }

  const changedLanguage = { ...sameTrickState, languageVersion: sameTrickState.languageVersion + 1 };
  if (trickSignature(trickState) === trickSignature(changedLanguage)) {
    throw new Error("language change was not detected");
  }

  const changedCollect = {
    ...sameTrickState,
    collectTo: sameTrickState.collectTo === "left" ? "right" : "left",
  };
  if (trickSignature(trickState) === trickSignature(changedCollect)) {
    throw new Error("collect target change was not detected");
  }

  if (playCount) {
    const changedPlay = {
      ...sameTrickState,
      plays: sameTrickState.plays.map((play) => ({ ...play })),
    };
    changedPlay.plays[0].playerName += " changed";
    if (trickSignature(trickState) === trickSignature(changedPlay)) {
      throw new Error("played card label change was not detected");
    }
  }
}

console.log("card render cache parity tests passed");

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class CustomEvent { constructor(type, init={}) { this.type=type; this.detail=init.detail; } }
class Target { constructor(){this.listeners=new Map();} addEventListener(t,f){if(!this.listeners.has(t))this.listeners.set(t,[]);this.listeners.get(t).push(f);} dispatchEvent(e){for(const f of this.listeners.get(e.type)||[])f(e);} }
function classList(){const s=new Set();return{add:(...x)=>x.forEach(v=>s.add(v)),remove:(...x)=>x.forEach(v=>s.delete(v)),toggle:(x,on)=>on?s.add(x):s.delete(x),contains:x=>s.has(x)};}
const target=new Target();
const root={classList:classList(),dataset:{}};
const player={classList:classList(),dataset:{playerId:'bot-1'},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];}};
const table={getAnimations(){return[{currentTime:20,effect:{getComputedTiming(){return{endTime:60};}}}];}};
const document={documentElement:root,querySelector(s){return s==='.table'?table:null;},querySelectorAll(s){return s.includes('bot-1')||s.startsWith('.is-bot')?[player]:[];}};
const timers=[];
const state={autoPlay:false,phase:'bidding',currentPulka:1,currentGame:1,trickNumber:0,activePlayerId:null,currentTrick:[],players:[1,2,3,4],hands:{'bot-1':[{id:'joker-red'},{id:'A-spades'}]},trumpChooserId:null,trump:null};
const events=[];target.addEventListener('joker-bot-action',e=>events.push(e.detail));
let continuationCount=0;
const context={console,CustomEvent,document,state,CSS:{escape:String},queueMicrotask:fn=>fn(),Date,Error,window:Object.assign(target,{document,matchMedia:()=>({matches:false}),setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){},continueBotTurns(){continuationCount++;}}),globalThis:null,getCurrentBidderId(){return'bot-1';},submitBid(){state.phase='playing';state.activePlayerId='bot-1';return true;},playCard(id,cardId){state.hands[id]=state.hands[id].filter(c=>c.id!==cardId);return true;},completeDealAfterTrump(){state.trumpChooserId=null;return true;}};
context.globalThis=context.window;
vm.createContext(context);
const adapters=['rules/bot-action-bridge.js','rules/bot-action-ui-adapter.js','rules/bot-animation-sync-adapter.js'];
for(const file of adapters){const source=fs.readFileSync(file,'utf8');new vm.Script(source,{filename:file});vm.runInContext(source,context,{filename:file});}
assert.equal(context.submitBid('bot-1',2),true);
assert.equal(events[0].kind,'bid');assert.equal(events[0].stage,'before');assert.equal(events[1].stage,'committed');assert.equal(root.dataset.botActionKind,'bid');
assert.equal(context.playCard('bot-1','joker-red',{jokerMode:'lead',jokerCommand:'take',jokerSuit:'hearts'}),true);
const cardEvents=events.filter(e=>e.kind==='card');
assert.equal(cardEvents.length,2);assert.equal(cardEvents[0].stage,'before');assert.equal(cardEvents[1].stage,'committed');assert.equal(cardEvents[1].payload.jokerSuit,'hearts');
assert.equal(context.window.JokerBotAnimationSync.isWaiting(),true);
context.window.continueBotTurns();context.window.continueBotTurns();assert.equal(continuationCount,0);
const gateTimer=timers.filter(t=>t.ms>=70&&t.ms<=1600).sort((a,b)=>a.ms-b.ms)[0];assert.ok(gateTimer);gateTimer.fn();assert.equal(continuationCount,1);
state.activePlayerId='bot-2';assert.equal(context.playCard('bot-1','A-spades',{}),false);assert.equal(events.at(-1).reason,'active-player-changed');assert.equal(events.at(-1).stale,true);
const engine=fs.readFileSync('rules/rules-engine.js','utf8');const order=['core-logic-fixes.js','bot-action-bridge.js','bot-action-ui-adapter.js','bot-animation-sync-adapter.js','deal-animation-adapter.js','bot-survival-priority.js'];for(let i=1;i<order.length;i++)assert.ok(engine.indexOf(order[i-1])<engine.indexOf(order[i]),`${order[i-1]} before ${order[i]}`);
console.log('Stage 4 bot end-to-end audit passed');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Emitter {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) || []) listener.call(this, event);
    return !event.defaultPrevented;
  }
}

class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
    this.defaultPrevented = false;
  }
  preventDefault() { this.defaultPrevented = true; }
}

let now = 1000;
const DateMock = { now: () => (now += 100) };
const nativeKeep = [];
const nativeHaptics = [];
const soundCalls = [];
let renderCalls = 0;
let suspendCalls = 0;
let resumeCalls = 0;

const audioContext = {
  state: 'running',
  suspend() { suspendCalls += 1; this.state = 'suspended'; return Promise.resolve(); },
  resume() { resumeCalls += 1; this.state = 'running'; return Promise.resolve(); },
};
const state = { started: false, phase: 'idle', autoPlay: false, audioContext };
const root = { dataset: {} };
const document = new Emitter();
document.hidden = false;
document.documentElement = root;
const window = new Emitter();
window.window = window;
window.document = document;
window.jokerState = state;
window.JokerAndroid = {
  setKeepScreenOn(value) { nativeKeep.push(value); },
  haptic(type) { nativeHaptics.push(type); },
};

const context = {
  window,
  document,
  navigator: { vibrate: () => true },
  CustomEvent,
  Date: DateMock,
  Set,
  Object,
  Promise,
  console,
  playSound(type) { soundCalls.push(type); },
  render() { renderCalls += 1; },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('android-system-integration.js', 'utf8'), context);

assert.equal(typeof window.JokerAndroidSystem.sync, 'function');
assert.deepEqual(nativeKeep, [false]);

state.started = true;
state.phase = 'playing';
context.render();
assert.equal(renderCalls, 1);
assert.deepEqual(nativeKeep, [false, true]);

window.dispatchEvent(new CustomEvent('joker-native-lifecycle', { detail: { state: 'background' } }));
assert.equal(suspendCalls, 1);
assert.equal(root.dataset.androidLifecycle, 'background');
assert.equal(nativeKeep.at(-1), false);
context.playSound('card');
assert.deepEqual(soundCalls, []);

window.dispatchEvent(new CustomEvent('joker-native-lifecycle', { detail: { state: 'foreground' } }));
assert.equal(resumeCalls, 1);
assert.equal(root.dataset.androidLifecycle, 'foreground');
assert.equal(nativeKeep.at(-1), true);

context.playSound('trick');
assert.deepEqual(soundCalls, ['trick']);
assert.equal(nativeHaptics.at(-1), 'success');

const enabledCard = { disabled: false, classList: { contains: () => false } };
document.dispatchEvent({
  type: 'pointerdown',
  target: { closest: (selector) => selector === '.hand .card' ? enabledCard : null },
});
assert.equal(nativeHaptics.at(-1), 'selection');

const disabledCard = { disabled: true, classList: { contains: () => true } };
document.dispatchEvent({
  type: 'pointerdown',
  target: { closest: (selector) => selector === '.hand .card' ? disabledCard : null },
});
assert.equal(nativeHaptics.at(-1), 'warning');

state.phase = 'finished';
context.render();
assert.equal(nativeKeep.at(-1), false);
assert.equal(window.JokerAndroidSystem.isKeepingAwake(), false);
console.log('Android lifecycle adapter harness passed');

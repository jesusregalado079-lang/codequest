// Tiny WebAudio chimes — no audio assets. iOS unlocks audio on first tap.
let ctx;
function ac() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', vol = 0.15) {
  const a = ac();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, a.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur);
}

export const sounds = {
  collect: () => { tone(880, 0, 0.15); tone(1320, 0.08, 0.2); },
  bump: () => tone(110, 0, 0.25, 'sawtooth', 0.1),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25)),
  tap: () => tone(440, 0, 0.06, 'triangle', 0.08),
};

// Computer Quest Typing Dojo: pure view helpers + renderer smoke run against a recording 2D context.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeCq } from '../src/cq/character.js';
import { LESSONS } from '../src/cq/lessons/pack1.js';
import { FINGER_FOR_KEY, itemsFor, KEYBOARD_ROWS } from '../src/cq/typing/content.js';
import { createSession, pressKey } from '../src/cq/typing/engine.js';
import { animating, HOP_MS, PUFF_MS, renderRun, STUMBLE_MS } from '../src/cq/typing/render.js';
import {
  accuracyLabel, bestLabel, dotColor, finishedCount, fitRun, heroX, itemAt, itemStarts, keyboardHtml, keyboardPrefKey,
  keyHighlight, LOCK_LABEL, MAX_CSS_WIDTH, modeCards, modeLocked, parseTypingHash, PATH_END, PATH_START, pickerHtml,
  progressFraction, recentDots, resultsMessages, soundPrefKey, stripHtml, stripModel, typingKey,
} from '../src/cq/typing/view.js';

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const AT = '2026-09-16T10:00:00.000Z';
const passed = (...ids) => { const lessons = {}; ids.forEach((id) => { lessons[id] = { startedAt: AT, quizPassedAt: AT, passedAt: AT, phase: 'key' }; }); return lessons; };

// ---------- routes ----------
assert.deepEqual(parseTypingHash('#typing'), { mode: null });
assert.deepEqual(parseTypingHash('typing'), { mode: null });
assert.deepEqual(parseTypingHash('#typing/homeRow'), { mode: 'homeRow' });
assert.deepEqual(parseTypingHash('#typing/lessonWords'), { mode: 'lessonWords' });
assert.deepEqual(parseTypingHash('#typing/sentences'), { mode: 'sentences' });
assert.deepEqual(parseTypingHash('#typing/nope'), { mode: null }, 'unknown mode falls back to the picker');
assert.deepEqual(parseTypingHash('#typing/constructor'), { mode: null });
['', '#', '#lesson/g1', '#typingx', '#typing/homeRow/x', null].forEach((hash) => assert.equal(parseTypingHash(hash), null, String(hash)));

// ---------- text strip ----------
{
  const items = ['ask', 'dad', 'fall'];
  assert.deepEqual(itemStarts(items), [0, 4, 8]);
  assert.equal(itemAt(items, 0), 0);
  assert.equal(itemAt(items, 3), 0, 'the separating space belongs to the word before it');
  assert.equal(itemAt(items, 4), 1);
  assert.equal(itemAt(items, 11), 2);
  assert.deepEqual(stripModel(items, 0), { typed: '', next: 'a', rest: 'sk␣', upcoming: 'dad', item: 0 });
  assert.deepEqual(stripModel(items, 2), { typed: 'as', next: 'k', rest: '␣', upcoming: 'dad', item: 0 });
  assert.deepEqual(stripModel(items, 3), { typed: 'ask', next: '␣', rest: '', upcoming: 'dad', item: 0 });
  assert.deepEqual(stripModel(items, 4), { typed: '', next: 'd', rest: 'ad␣', upcoming: 'fall', item: 1 });
  assert.deepEqual(stripModel(items, 10), { typed: 'fa', next: 'l', rest: 'l', upcoming: '', item: 2 }, 'last item has no trailing space');
  assert.deepEqual(stripModel(items, 12), { typed: 'fall', next: '', rest: '', upcoming: '', item: 2 }, 'done');
  assert.deepEqual(stripModel(items, 99), stripModel(items, 12), 'clamped');
  assert.deepEqual(stripModel([], 0), { typed: '', next: '', rest: '', upcoming: '', item: 0 });
  const sentences = ['i can type.', 'rocks are cool.'];
  assert.deepEqual(stripModel(sentences, 1), { typed: 'i', next: '␣', rest: 'can␣type.␣', upcoming: 'rocks␣are␣cool.', item: 0 }, 'spaces inside sentences show as ␣');
  assert.equal(stripModel(sentences, 12).item, 1);

  const html = stripHtml(stripModel(items, 2), false);
  assert.equal(html, '<span class="cq-ty-current"><span class="cq-ty-typed">as</span><span class="cq-ty-next">k</span><span class="cq-ty-rest">␣</span></span><span class="cq-ty-upcoming">dad</span>');
  assert.ok(stripHtml(stripModel(items, 2), true).includes('<span class="cq-ty-next cq-ty-wrong">k</span>'), 'wrong flash marks the next char');
  const nasty = stripHtml(stripModel(['<b>&"\'', 'x<y'], 1), false);
  assert.ok(nasty.includes('&#60;') && nasty.includes('&#38;') && nasty.includes('&#34;') && nasty.includes('&#39;'), 'escaped');
  assert.ok(!/<b>|x<y/.test(nasty), 'no raw markup from text');
  assert.ok(!stripHtml(stripModel(items, 12), false).includes('cq-ty-next'), 'no next char once done');
}

// ---------- keyboard highlight ----------
assert.deepEqual(keyHighlight('f'), { key: 'f', shift: false, finger: 'L2', shiftKey: null });
assert.deepEqual(keyHighlight('j'), { key: 'j', shift: false, finger: 'R2', shiftKey: null });
assert.deepEqual(keyHighlight('A'), { key: 'a', shift: true, finger: 'L5', shiftKey: 'R5' }, 'left-hand capital: right Shift');
assert.deepEqual(keyHighlight('P'), { key: 'p', shift: true, finger: 'R5', shiftKey: 'L5' }, 'right-hand capital: left Shift');
assert.deepEqual(keyHighlight(' '), { key: ' ', shift: false, finger: 'thumb', shiftKey: null });
assert.deepEqual(keyHighlight(';'), { key: ';', shift: false, finger: 'R5', shiftKey: null });
assert.deepEqual(keyHighlight('.'), { key: '.', shift: false, finger: 'R4', shiftKey: null });
assert.deepEqual(keyHighlight(','), { key: ',', shift: false, finger: 'R3', shiftKey: null });
['', 'ab', null, undefined, 'Enter', '?', '1', 'é', '__proto__', 'constructor'].forEach((c) => assert.equal(keyHighlight(c), null, String(c)));
Object.keys(FINGER_FOR_KEY).forEach((char) => {
  const hl = keyHighlight(char);
  assert.ok(hl, `every charted char maps to a key (${JSON.stringify(char)})`);
  assert.equal(hl.finger, FINGER_FOR_KEY[char].finger);
});
{
  const kb = keyboardHtml();
  KEYBOARD_ROWS.forEach((row) => row.forEach((k) => {
    const id = k.key === 'Shift' ? `Shift-${k.finger}` : k.key;
    assert.ok(kb.includes(`data-k="${id}" data-finger="${k.finger}"`), `key ${id} rendered with its finger`);
  }));
  assert.equal((kb.match(/cq-kb-bump/g) || []).length, 2, 'F and J bumps');
  assert.ok(/Pinky.*Ring.*Middle.*Index.*Thumb/.test(kb), 'finger legend');
  assert.equal(new Set(['L5', 'L4', 'L3', 'L2', 'R2', 'R3', 'R4', 'R5', 'thumb'].filter((f) => kb.includes(`data-finger="${f}"`))).size, 9);
  // Every text any mode can produce is highlightable.
  const all = normalizeCq({ track: 'standard', lessonsPassed: LESSONS.map((l) => l.id), lessons: passed('s1', 's2', 's3', 's4', 's5') });
  const allGuided = normalizeCq({ track: 'guided', lessonsPassed: LESSONS.map((l) => l.id), lessons: passed('g1', 'g2', 'g3', 'g4', 'g5') });
  [all, allGuided].forEach((cq) => ['homeRow', 'lessonWords', 'sentences'].forEach((mode) => {
    itemsFor(mode, cq, LESSONS, seeded(3)).join(' ').split('').forEach((c) => assert.ok(keyHighlight(c), `${mode}: ${JSON.stringify(c)} has a key`));
  }));
}

// ---------- dots, bests, lock labels ----------
assert.equal(dotColor(100), 'gold');
assert.equal(dotColor(95), 'gold');
assert.equal(dotColor(94), 'green');
assert.equal(dotColor(90), 'green');
assert.equal(dotColor(89), 'gray');
assert.equal(dotColor(0), 'gray');
assert.equal(dotColor(NaN), 'gray');
{
  const session = (accuracy, mode = 'homeRow') => ({ at: AT, mode, wpm: 8, accuracy, ms: 60000, chars: 40 });
  assert.deepEqual(recentDots(null).map((d) => d.color), ['empty', 'empty', 'empty', 'empty', 'empty']);
  assert.deepEqual(recentDots({ sessions: [session(96), session(80)] }).map((d) => d.color), ['empty', 'empty', 'empty', 'gold', 'gray']);
  const seven = [70, 99, 91, 95, 89, 90, 100].map((a) => session(a));
  assert.deepEqual(recentDots({ sessions: seven }).map((d) => d.color), ['green', 'gold', 'gray', 'green', 'gold'], 'last 5, oldest first');
}
assert.equal(bestLabel(null), '— ');
assert.equal(bestLabel({ wpm: 9.5, accuracy: 94, at: AT }), '9.5 WPM @ 94%');
assert.equal(bestLabel({ wpm: 7, accuracy: 91, at: AT }), '7 WPM @ 91%');
{
  const fresh = normalizeCq({ track: 'guided' });
  const passed2 = normalizeCq({ track: 'guided', lessons: passed('g1', 'g2') });
  const standard1 = normalizeCq({ track: 'standard', lessons: passed('s1') });
  assert.equal(LOCK_LABEL, 'Pass Lesson 2 to unlock');
  assert.equal(modeLocked('homeRow', fresh), false);
  assert.equal(modeLocked('lessonWords', fresh), false);
  assert.equal(modeLocked('sentences', fresh), true);
  assert.equal(modeLocked('sentences', passed2), false);
  assert.equal(modeLocked('sentences', standard1), true);
  assert.deepEqual(modeCards(fresh).map((c) => [c.mode, c.title, c.best, c.locked, c.lockLabel]), [
    ['homeRow', 'Home Row', '— ', false, ''],
    ['lessonWords', 'Lesson Words', '— ', false, ''],
    ['sentences', 'Sentences', '— ', true, 'Pass Lesson 2 to unlock'],
  ]);
  const withBest = normalizeCq({ track: 'guided', lessons: passed('g1', 'g2'), typing: { best: { homeRow: { wpm: 9.5, accuracy: 94, at: AT } }, sessions: [], bestGemDays: [] } });
  assert.deepEqual(modeCards(withBest).map((c) => [c.best, c.locked]), [['9.5 WPM @ 94%', false], ['— ', false], ['— ', false]]);
  const picker = pickerHtml(fresh);
  assert.equal((picker.match(/data-action="typing-mode"/g) || []).length, 3);
  assert.ok(picker.includes('🔒') && picker.includes('Pass Lesson 2 to unlock') && picker.includes('aria-disabled="true"'));
  assert.equal((picker.match(/cq-ty-dot /g) || []).length, 5, '5 dots');
  assert.ok(picker.includes('LAST 5 SESSIONS'));
  assert.ok(!/sibling|leader|rank|other profile/i.test(picker), 'no comparisons');
  assert.ok(!pickerHtml(passed2).includes('aria-disabled'), 'unlocked after lesson 2');
}

// ---------- results messages ----------
assert.deepEqual(resultsMessages({ accuracy: 96, newBest: true, gems: 5, missedKeys: [] }), {
  banner: 'Personal best!', gemsText: '+5 💎', tip: null, practice: null,
});
assert.deepEqual(resultsMessages({ accuracy: 92, newBest: true, gems: 0, missedKeys: ['f'] }), {
  banner: 'New best! (gems once a day)', gemsText: null, tip: null, practice: 'Practice these: f',
});
assert.deepEqual(resultsMessages({ accuracy: 91, newBest: false, gems: 0, missedKeys: ['f', 'j', ';'] }), {
  banner: null, gemsText: null, tip: null, practice: 'Practice these: f, j, ;',
});
assert.deepEqual(resultsMessages({ accuracy: 89, newBest: false, gems: 0, missedKeys: [' ', 'a'] }), {
  banner: null, gemsText: null, tip: 'Accuracy first! Get to 90% to set a best.', practice: 'Practice these: ␣, a',
});
assert.equal(resultsMessages({ accuracy: 90 }).tip, null, '90 is enough');
assert.equal(resultsMessages({ accuracy: 50, newBest: false, gems: 5 }).gemsText, null, 'no gems text without a best');
assert.deepEqual(resultsMessages(), { banner: null, gemsText: null, tip: null, practice: null });

// ---------- hero position + canvas fit ----------
assert.equal(heroX(0, 1000), 1000 * PATH_START);
assert.equal(heroX(1, 1000), 1000 * PATH_END);
assert.ok(Math.abs(heroX(0.5, 1000) - 1000 * (PATH_START + PATH_END) / 2) < 1e-9);
assert.equal(heroX(-1, 1000), heroX(0, 1000));
assert.equal(heroX(2, 1000), heroX(1, 1000));
assert.equal(heroX(NaN, 1000), heroX(0, 1000));
assert.equal(heroX(0.5, NaN), 0);
assert.ok(heroX(0.3, 960) < heroX(0.31, 960), 'monotonic');
assert.equal(progressFraction(3, 12), 0.25);
assert.equal(progressFraction(20, 12), 1);
assert.equal(progressFraction(3, 0), 0);
[[960, 1], [1400, 2], [360, 1], [328, 3], [0, 1], [NaN, NaN], [500, 2.625]].forEach(([w, dpr]) => {
  const v = fitRun(w, dpr);
  assert.ok(v.cssWidth <= MAX_CSS_WIDTH);
  if (w > 0) assert.ok(v.cssWidth <= w, 'fits the container');
  assert.ok(v.cssHeight >= Math.round(v.cssWidth / 4) && v.cssHeight <= Math.max(96, v.cssWidth / 4 + 1), `about 4:1 (${w})`);
  assert.ok(Number.isInteger(v.widthPx) && Number.isInteger(v.heightPx));
});
assert.deepEqual(fitRun(960, 1), { cssWidth: 960, cssHeight: 240, widthPx: 960, heightPx: 240 });
assert.deepEqual(fitRun(1400, 2), { cssWidth: 960, cssHeight: 240, widthPx: 1920, heightPx: 480 });
assert.deepEqual(fitRun(328, 1), { cssWidth: 328, cssHeight: 96, widthPx: 328, heightPx: 96 });

// ---------- key filter ----------
{
  const ev = (key, extra = {}) => ({ key, code: '', ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, ...extra });
  assert.equal(typingKey(ev('a')), 'a');
  assert.equal(typingKey(ev('A', { shiftKey: true })), 'A', 'Shift is fine');
  assert.equal(typingKey(ev(';')), ';');
  assert.equal(typingKey(ev(' ', { code: 'Space' })), ' ');
  ['Shift', 'Enter', 'Backspace', 'Tab', 'Escape', 'ArrowLeft', 'Dead', 'F5', 'Control', ''].forEach((k) => assert.equal(typingKey(ev(k)), null, k));
  ['ctrlKey', 'altKey', 'metaKey'].forEach((mod) => assert.equal(typingKey(ev('s', { [mod]: true })), null, `${mod} combo ignored`));
  assert.equal(typingKey(ev(' ', { code: 'Space' }), true), null, 'Space on an outside control activates it');
  assert.equal(typingKey(ev('Enter', { code: 'Enter' }), true), null);
  assert.equal(typingKey(ev('f'), true), 'f', 'letters still type with an outside control focused');
  assert.equal(typingKey(ev('.'), true), '.');
  assert.equal(typingKey(null), null);
}
assert.equal(keyboardPrefKey('p1'), 'codequest-cq-kbd-p1');
assert.equal(soundPrefKey('p1'), 'codequest-cq-typing-sound-p1');

// ---------- live top bar ----------
{
  let s = createSession({ mode: 'homeRow', items: ['ab'] });
  assert.equal(accuracyLabel(s), '—');
  s = pressKey(s, 'a', 1000).state;
  s = pressKey(s, 'x', 1100).state;
  assert.equal(accuracyLabel(s), '50%');
  assert.equal(finishedCount(['ab', 'cd'], 1), 0);
  assert.equal(finishedCount(['ab', 'cd'], 2), 1, 'finished on the last letter, before the space');
  assert.equal(finishedCount(['ab', 'cd'], 5), 2);
}

// ---------- renderer smoke run ----------
const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
function recordingContext() {
  return {
    rects: 0, badRects: [], badStyles: [], saves: 0, restores: 0, _fill: '#000000', imageSmoothingEnabled: true, globalAlpha: 1,
    get fillStyle() { return this._fill; },
    set fillStyle(value) { if (typeof value !== 'string' || !COLOR.test(value)) this.badStyles.push(value); this._fill = value; },
    fillRect(x, y, w, h) { this.rects += 1; if (![x, y, w, h].every(Number.isFinite)) this.badRects.push([x, y, w, h]); },
    clearRect(x, y, w, h) { if (![x, y, w, h].every(Number.isFinite)) this.badRects.push(['clear', x, y, w, h]); },
    save() { this.saves += 1; },
    restore() { this.restores += 1; },
  };
}
{
  const cq = normalizeCq({ track: 'standard', lessons: passed('s1', 's2'), look: { skin: 'tone3' } });
  const rng = seeded(21);
  const fits = [fitRun(960, 1), fitRun(328, 1), fitRun(880, 2), fitRun(1, 1)];
  const ctx = recordingContext();
  let keys = 0;
  let sawSmash = false;
  let sawAnim = false;
  ['homeRow', 'lessonWords', 'sentences'].forEach((mode, m) => {
    const items = itemsFor(mode, cq, LESSONS, rng);
    assert.ok(items.length > 0, `${mode} has items`);
    let session = createSession({ mode, items });
    const scene = { widthPx: 0, heightPx: 0, items, index: 0, look: cq.look, equipped: cq.equipped, worn: cq.worn, glow: m === 1, reducedMotion: m === 2, hop: null, stumble: null, smashes: {} };
    let t = 0;
    while (session.endedAt === null && keys < 200) {
      const expected = session.text[session.index];
      const key = (keys % 9 === 4) ? (expected === 'q' ? 'z' : 'q') : expected; // a few deliberate mistakes
      const before = session;
      const { state, result } = pressKey(before, key, 1000 + t);
      session = state;
      t += 16;
      if (result === 'correct') {
        scene.hop = { at: t, from: before.index / before.text.length };
        const done = finishedCount(items, state.index);
        if (done > finishedCount(items, before.index)) { scene.smashes[done - 1] = t; sawSmash = true; }
      } else scene.stumble = { at: t };
      scene.index = state.index;
      const fit = fits[keys % fits.length];
      scene.widthPx = fit.widthPx; scene.heightPx = fit.heightPx;
      [0, HOP_MS / 2, STUMBLE_MS / 2, PUFF_MS / 3].forEach((dt) => {
        if (animating(scene, t + dt)) sawAnim = true;
        const before2 = ctx.rects;
        assert.doesNotThrow(() => renderRun(ctx, scene, t + dt));
        if (fit.widthPx > 50) assert.ok(ctx.rects > before2 + 40, 'the path, blocks and hero draw');
      });
      keys += 1;
    }
    assert.equal(animating(scene, t + 10000), false, 'animations settle so the rAF can stop');
  });
  assert.equal(keys, 200, 'scripted 200 keys');
  assert.ok(sawSmash && sawAnim);
  assert.deepEqual(ctx.badRects.slice(0, 3), [], 'fillRect only gets finite numbers');
  assert.deepEqual(ctx.badStyles.slice(0, 3), [], 'fillStyle is always a valid color string');
  assert.equal(ctx.saves, ctx.restores, 'save/restore balanced');
  assert.doesNotThrow(() => renderRun(null, null, 0));
  assert.doesNotThrow(() => renderRun(ctx, { widthPx: 960, heightPx: 240, items: [], index: 0 }, NaN));
  assert.doesNotThrow(() => renderRun(ctx, { widthPx: 960, heightPx: 240, items: ['ab'], index: 1, look: null, hop: { at: NaN }, stumble: { at: 'x' }, smashes: { 0: 5 } }, 10));
  assert.deepEqual(ctx.badRects.slice(0, 3), []);
  assert.deepEqual(ctx.badStyles.slice(0, 3), []);
}

// ---------- source rules ----------
['../src/cq/typing/render.js', '../src/cq/typing/view.js', '../src/cq/typing/typing-ui.js', '../src/cq/ui.js'].forEach((path) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.equal(/\.at\(|Object\.hasOwn|structuredClone|findLast|replaceAll|\?\?=|\|\|=|&&=/.test(source), false, `${path}: no ES2021+ builtins`);
  assert.equal(/\balert\(|\bconfirm\(|\bprompt\(/.test(source), false, `${path}: no alert/confirm/prompt`);
  assert.equal(/<[a-z][^>]*\son[a-z]+=/i.test(source), false, `${path}: no inline event handlers (CSP)`);
});
{
  const renderSource = readFileSync(new URL('../src/cq/typing/render.js', import.meta.url), 'utf8');
  assert.equal(/Math\.random|document\.|window\./.test(renderSource), false, 'render.js: no Math.random and no DOM');
  const ui = readFileSync(new URL('../src/cq/typing/typing-ui.js', import.meta.url), 'utf8');
  assert.ok(ui.includes("win.addEventListener('keydown', onKeyDown)") && ui.includes("win.removeEventListener('keydown', onKeyDown)"), 'keydown bound to window and removed on destroy');
  assert.ok(ui.includes('webkitAudioContext'), 'lazy WebAudio');
  assert.ok(/isInteractiveOutside\(event\.target, els\.play\)/.test(ui));
  const destroySrc = ui.slice(ui.indexOf('destroy() {'));
  assert.ok(!/recordTypingSession|finish\(/.test(destroySrc), 'leaving mid-run records nothing');
  assert.ok(/cancelAnimationFrame\(raf\)/.test(destroySrc), 'rAF cancelled on destroy');
  const finishSrc = ui.slice(ui.indexOf('function finish('), ui.indexOf('function showResults('));
  assert.ok(/if \(recorded\) return;\s*recorded = true;/.test(finishSrc), 'records exactly once');
  assert.ok(finishSrc.indexOf('recordTypingSession(') < finishSrc.indexOf('setTimeout('), 'recorded before the results beat');
  const hub = readFileSync(new URL('../src/cq/ui.js', import.meta.url), 'utf8');
  assert.ok(hub.includes("const TABS = ['Gear', 'Wardrobe', 'Trader', 'Quests', 'Typing'];"), 'Typing tab after Quests');
  assert.ok(/if \(typingView\) \{ if \(!typingView\.inProgress\(\)\) typingView\.refresh\(\); \}/.test(hub), 'storage events never rebuild a run in progress');
}
const typingUi = await import('../src/cq/typing/typing-ui.js');
assert.equal(typeof typingUi.mountTyping, 'function', 'module loads without a DOM');

console.log('ok — Computer Quest Typing Dojo routes, text strip, keyboard highlight, dots, results text, hero position, key filter, and renderer smoke run pass');

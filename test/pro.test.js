// Pro track self-check: every chapter matches SCHEMA.md and every lesson's
// solution passes its own tests under the engine's execution model
// (user code + test code concatenated, shared assert).
// Run: npm test
import assert from 'node:assert';
import chapters from '../src/pro/chapters/index.js';

const proAssert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };

assert.strictEqual(chapters.length, 8, 'expected 8 chapters');

const seenIds = new Set();
let lessonCount = 0;
let testCount = 0;

for (const ch of chapters) {
  assert.match(ch.id, /^ch[1-8]$/, `bad chapter id ${ch.id}`);
  assert.ok(ch.title && ch.tagline && ch.intro, `${ch.id} missing title/tagline/intro`);
  assert.ok(ch.badge?.name && ch.badge?.emoji, `${ch.id} missing badge`);
  assert.ok(ch.lessons.length >= 5 && ch.lessons.length <= 6, `${ch.id} has ${ch.lessons.length} lessons`);

  for (const l of ch.lessons) {
    lessonCount++;
    assert.ok(l.id.startsWith(`${ch.id}-l`), `lesson id ${l.id} not under ${ch.id}`);
    assert.ok(!seenIds.has(l.id), `duplicate lesson id ${l.id}`);
    seenIds.add(l.id);
    assert.ok(l.title && l.reading && l.task && typeof l.starter === 'string',
      `${l.id} missing title/reading/task/starter`);
    assert.ok(l.reading.length > 500, `${l.id} reading suspiciously short`);
    assert.strictEqual(l.hints.length, 3, `${l.id} needs exactly 3 hints`);
    assert.ok([10, 15, 20].includes(l.xp), `${l.id} xp must be 10/15/20`);
    assert.ok(l.tests.length >= 2 && l.tests.length <= 5, `${l.id} needs 2-5 tests`);

    for (const t of l.tests) {
      testCount++;
      assert.ok(t.name && t.code, `${l.id} test missing name/code`);
      try {
        new Function('assert', `${l.solution}\n;${t.code}`)(proAssert);
      } catch (e) {
        assert.fail(`${l.id} solution fails test "${t.name}": ${e.message}`);
      }
    }

    // Starter code must NOT already pass every test (else the lesson is free).
    const starterPassesAll = l.tests.every((t) => {
      try {
        new Function('assert', `${l.starter}\n;${t.code}`)(proAssert);
        return true;
      } catch {
        return false;
      }
    });
    assert.ok(!starterPassesAll, `${l.id} starter code already passes all tests`);
  }
}

console.log(`pro ok: ${chapters.length} chapters, ${lessonCount} lessons, ${testCount} solution tests pass`);

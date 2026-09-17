// The kids app (Computer Quest + the base app) ships untranspiled to older iPad Safari. ES2021+
// syntax/builtins have broken it before (a `.at()` call caused the "World 2 glitch" in July): scan
// every kids-app source file for the patterns that are known to be unsupported there. src/pro/ is
// the grown-ups track, shipped separately, and is intentionally NOT scanned.
import assert from 'node:assert';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIRS = ['src/ui', 'src/engine', 'src/blocks', 'src/levels', 'src/cq'];
const FILES = ['src/progress.js', 'src/custom-levels.js'];

const PATTERNS = [
  { name: 'logical assignment ??=', re: /\?\?=/g },
  { name: 'logical assignment ||=', re: /\|\|=/g },
  { name: 'logical assignment &&=', re: /&&=/g },
  { name: 'Array/String.prototype.at(', re: /\.at\(/g },
  { name: 'Object.hasOwn', re: /Object\.hasOwn\(/g },
  { name: 'structuredClone', re: /\bstructuredClone\(/g },
  { name: 'Array.prototype.findLast', re: /\.findLast(Index)?\(/g },
  { name: 'String.prototype.replaceAll', re: /\.replaceAll\(/g },
  { name: 'numeric separator (1_000)', re: /\b\d[\d_]*_\d[\d_]*\b/g },
  // Zero indentation is this codebase's consistent signal for "not inside a function" — every
  // real `await` here is indented (inside an async function). A column-0 line containing `await`
  // as its own word is the one shape that would actually be a top-level await.
  { name: 'top-level await', re: /^\S.*\bawait\b/m },
];

// alert/confirm/prompt are checked separately (not in PATTERNS): the base coding game already has two
// legitimate native confirm() dialogs for irreversible actions (delete a custom level, remove a player),
// predating Computer Quest — those are allowed. Everything else (all of Computer Quest's own code, and
// any new call anywhere) must never use them; the app builds its own in-screen UI instead.
const DIALOG_RE = /\b(alert|confirm|prompt)\(/g;
const DIALOG_ALLOWLIST = new Set([
  'src/ui/menu.js:406', // delete a custom-built level — pre-existing, irreversible
  'src/ui/menu.js:642', // remove a player and their progress — pre-existing, irreversible
]);

function listJsFiles(dir) {
  const out = [];
  readdirSync(dir).forEach((name) => {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listJsFiles(full));
    else if (name.endsWith('.js')) out.push(full);
  });
  return out;
}

// A very small "is this occurrence inside a // comment" check — good enough for this codebase's
// style (no block comments hiding these patterns); genuine occurrences are always caught, and this
// only ever risks under-flagging a pattern that appears purely in prose after `//`, never a real one.
function lineIsCommentOnly(line, index) {
  const commentAt = line.indexOf('//');
  return commentAt !== -1 && commentAt < index && line.slice(0, commentAt).trim() === '' ? false
    : commentAt !== -1 && commentAt < index;
}

const targets = [
  ...DIRS.map((dir) => join(ROOT, dir)),
].flatMap((dir) => listJsFiles(dir))
  .concat(FILES.map((file) => join(ROOT, file)));

assert.ok(targets.length > 20, `found enough kids-app source files to scan (${targets.length})`);
const proDir = `${join(ROOT, 'src/pro')}/`;
assert.ok(!targets.some((path) => path.startsWith(proDir)), 'src/pro/ is never scanned (grown-ups track, off-limits)');

const offenders = [];
const dialogOffenders = [];
targets.forEach((path) => {
  const source = readFileSync(path, 'utf8');
  const lines = source.split('\n');
  const relPath = path.replace(ROOT, '');
  PATTERNS.forEach(({ name, re }) => {
    lines.forEach((line, i) => {
      let match;
      const lineRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
      while ((match = lineRe.exec(line))) {
        if (lineIsCommentOnly(line, match.index)) continue;
        offenders.push(`${relPath}:${i + 1}: ${name} — "${line.trim()}"`);
      }
    });
  });
  lines.forEach((line, i) => {
    let match;
    const lineRe = new RegExp(DIALOG_RE.source, 'g');
    while ((match = lineRe.exec(line))) {
      if (lineIsCommentOnly(line, match.index)) continue;
      if (DIALOG_ALLOWLIST.has(`${relPath}:${i + 1}`)) continue;
      dialogOffenders.push(`${relPath}:${i + 1}: ${match[1]}(...) — "${line.trim()}"`);
    }
  });
});

assert.deepStrictEqual(offenders, [], `ES2021+ syntax/builtins unsafe for old iPad Safari found:\n${offenders.join('\n')}`);
assert.deepStrictEqual(dialogOffenders, [], `unexpected alert/confirm/prompt (blocking browser dialogs) found:\n${dialogOffenders.join('\n')}`);

console.log(`ok — no ES2021+ syntax/builtins (??=, ||=, &&=, .at(, Object.hasOwn, structuredClone, findLast, replaceAll, numeric separators, top-level await) and no unexpected alert/confirm/prompt across ${targets.length} kids-app source files`);

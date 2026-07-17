// CodeQuest Pro — whole SPA, hash-routed. Plain DOM, no framework.
import chapters from '../chapters/index.js';
import { run } from '../engine/runner.js';
import { setHue } from './aether.js';
import {
  isComplete, completeLesson, hintsUsed, revealHint,
  totalXp, rank, streakCount, chapterProgress, badgeEarned,
} from '../progress.js';

const app = document.getElementById('app');

// one accent hue per chapter — drives frame gradients, ticks, and lesson accents
const HUES = [204, 262, 36, 152, 326, 184, 58, 12];
const hueOf = (ch) => HUES[chapters.indexOf(ch)] ?? 204;

const FLAME_SVG =
  '<svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true"><path d="M5.5 0C6 2.5 8.5 3.5 8.5 6.5a3 3 0 0 1-6 0C2.5 5 3 4.5 3.5 3.5 4 5 5 5.5 5 6.5 5 4 4.5 2 5.5 0Z" fill="currentColor" transform="translate(0,1.5) scale(1,1.6)"/></svg>';
const PLAY_SVG =
  '<svg width="11" height="12" viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1l10 6-10 6z" fill="currentColor"/></svg>';

/* ---------- markdown-lite renderer (SCHEMA.md subset) ---------- */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inline = (s) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

export function md(src) {
  let html = '';
  const segs = String(src).split('```'); // even = text, odd = fenced code
  segs.forEach((seg, i) => {
    if (i % 2) {
      const code = seg.replace(/^[ \t]*\w*\n/, '').replace(/\n[ \t]*$/, '');
      html += `<pre class="codeblock"><code>${esc(code)}</code></pre>`;
      return;
    }
    for (const block of seg.split(/\n[ \t]*\n/)) {
      const b = block.trim();
      if (!b) continue;
      const lines = b.split('\n').map((l) => l.trim());
      if (b.startsWith('## ')) {
        html += `<h2>${inline(b.slice(3))}</h2>`;
      } else if (lines.every((l) => l.startsWith('- '))) {
        html += `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
      } else {
        html += `<p>${inline(b)}</p>`;
      }
    }
  });
  return html;
}

/* ---------- routing ---------- */

function router() {
  const [chId, li] = location.hash.replace(/^#\/?/, '').split('/');
  const ch = chapters.find((c) => c.id === chId);
  scrollTo(0, 0);
  setHue(ch ? hueOf(ch) : 204); // backdrop takes on the chapter's colour
  if (!ch) {
    document.body.dataset.view = 'grid';
    return showChapters();
  }
  const i = Number(li);
  if (li !== undefined && ch.lessons[i]) {
    document.body.dataset.view = 'lesson'; // quiets the backdrop for reading
    return showLesson(ch, i);
  }
  document.body.dataset.view = 'chapter';
  showChapter(ch);
}
window.addEventListener('hashchange', router);

/* ---------- shared header (XP bar / rank / streak) ---------- */

function statusBar() {
  const xp = totalXp();
  const r = rank(xp);
  const st = streakCount();
  const pct = r.next ? Math.min(100, Math.round(((xp - r.floor) / (r.next - r.floor)) * 100)) : 100;
  return `
    <div class="statusbar">
      <span class="rank-title">${esc(r.title)}</span>
      <div class="xpbar" title="${xp} XP"><div class="xpbar-fill" style="width:${pct}%"></div></div>
      <span class="xp-label">${xp}${r.next !== null ? ` / ${r.next}` : ''} XP</span>
      <span class="streak" title="days in a row">${FLAME_SVG}${st}</span>
    </div>`;
}

/* ---------- chapter list ---------- */

function showChapters() {
  app.innerHTML = `
    <header class="pro-header">
      <h1>CodeQuest <span class="pro-mark">Pro</span></h1>
      ${statusBar()}
    </header>
    <section class="hero">
      <img class="hero-img" src="media/pro-bg.jpg" width="455" height="494"
           alt="CodeQuest Pro emblem — three gold pyramids inside a ring of blue energy" />
      <p class="hero-tagline">Read. Type real code. Run it. Level up.</p>
    </section>
    <main class="chapter-grid">
      ${[chapters.slice(0, 3), chapters.slice(3, 6), chapters.slice(6)]
        .map(
          (row) =>
            `<div class="frame-row">${row
              .map((ch) => {
                const n = chapters.indexOf(ch);
                const { done, total } = chapterProgress(ch);
                const earned = badgeEarned(ch);
                const pct = Math.round((done / total) * 100);
                return `
              <a class="frame${earned ? ' complete' : ''}" href="#/${ch.id}" style="--hue:${HUES[n]}">
                <div class="frame-bg"></div>
                <span class="ghost-num">${String(n + 1).padStart(2, '0')}</span>
                <i class="tick tl"></i><i class="tick br"></i>
                <div class="frame-body">
                  <div class="frame-kicker">
                    <span>Ch ${String(n + 1).padStart(2, '0')}</span>
                    <span class="ch-badge">${earned ? '●' : '○'} ${esc(ch.badge.name)}</span>
                  </div>
                  <h2>${esc(ch.title)}</h2>
                  <p class="tagline">${esc(ch.tagline)}</p>
                  <div class="frame-foot">
                    <span class="mini-progress"><i style="width:${pct}%"></i></span>
                    <span class="ch-progress">${done}/${total}</span>
                  </div>
                </div>
              </a>`;
              })
              .join('')}</div>`
        )
        .join('')}
    </main>`;
}

/* ---------- chapter view (intro + lesson list) ---------- */

function showChapter(ch) {
  app.innerHTML = `
    <header class="pro-header">
      <a class="back" href="#/">← All chapters</a>
      ${statusBar()}
    </header>
    <main class="chapter-page" style="--hue:${hueOf(ch)}">
      <h1>${esc(ch.title)}</h1>
      <div class="reading intro">${md(ch.intro)}</div>
      <ol class="lesson-list">
        ${ch.lessons
          .map((l, i) => {
            const done = isComplete(l.id);
            return `
            <li>
              <a class="lesson-row${done ? ' done' : ''}" href="#/${ch.id}/${i}">
                <span class="check">${done ? '✓' : ''}</span>
                <span class="lesson-title">${esc(l.title)}</span>
                <span class="lesson-xp">${l.xp} XP</span>
              </a>
            </li>`;
          })
          .join('')}
      </ol>
    </main>`;
}

/* ---------- lesson view ---------- */

function showLesson(ch, i) {
  const lesson = ch.lessons[i];
  const done = isComplete(lesson.id);
  const draftKey = `codequest-pro-draft-${lesson.id}`;
  const award = () => Math.max(0, lesson.xp - 2 * hintsUsed(lesson.id));

  const prev = i > 0 ? `#/${ch.id}/${i - 1}` : null;
  const next = i + 1 < ch.lessons.length ? `#/${ch.id}/${i + 1}` : null;

  app.innerHTML = `
    <header class="pro-header lesson-header">
      <a class="back" href="#/${ch.id}">← ${esc(ch.title)}</a>
      <span class="lesson-pos">Lesson ${i + 1} / ${ch.lessons.length}</span>
      <nav class="lesson-nav">
        ${prev ? `<a href="${prev}">‹ Prev</a>` : '<span class="dim">‹ Prev</span>'}
        ${next ? `<a href="${next}">Next ›</a>` : '<span class="dim">Next ›</span>'}
      </nav>
    </header>
    <main class="panes" style="--hue:${hueOf(ch)}">
      <section class="reading-pane">
        <h1>${esc(lesson.title)} ${done ? '<span class="done-tag">✓ completed</span>' : ''}</h1>
        <div class="reading">${md(lesson.reading)}</div>
        <div class="task-box"><strong>Your task</strong>${md(lesson.task)}</div>
        <div class="hints" id="hints"></div>
      </section>
      <section class="work-pane">
        <textarea id="editor" class="editor" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
        <div class="run-row">
          <button id="run" class="run-btn">${PLAY_SVG} Run <kbd>⌘↵</kbd></button>
          <button id="hint-btn" class="hint-btn"></button>
          <span id="award-label" class="award-label"></span>
        </div>
        <div id="output" class="output"></div>
        <div id="payoff"></div>
      </section>
    </main>`;

  const editor = document.getElementById('editor');
  const runBtn = document.getElementById('run');
  const hintBtn = document.getElementById('hint-btn');
  const hintsEl = document.getElementById('hints');
  const output = document.getElementById('output');
  const payoff = document.getElementById('payoff');
  const awardLabel = document.getElementById('award-label');

  editor.value = sessionStorage.getItem(draftKey) ?? lesson.starter;
  editor.addEventListener('input', () => sessionStorage.setItem(draftKey, editor.value));

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value: v } = editor;
      editor.value = v.slice(0, s) + '  ' + v.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
      sessionStorage.setItem(draftKey, editor.value);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      doRun();
    }
  });

  /* hints */
  function refreshHints() {
    const n = hintsUsed(lesson.id);
    hintsEl.innerHTML = lesson.hints
      .slice(0, n)
      .map((h, k) => `<div class="hint"><strong>Hint ${k + 1}</strong>${md(h)}</div>`)
      .join('');
    if (n >= lesson.hints.length) {
      hintBtn.hidden = true;
    } else {
      hintBtn.hidden = false;
      hintBtn.textContent = isComplete(lesson.id)
        ? `Hint ${n + 1} of ${lesson.hints.length}`
        : `Hint ${n + 1} of ${lesson.hints.length} · −2 XP`;
    }
    awardLabel.textContent = isComplete(lesson.id)
      ? 'completed'
      : `worth ${award()} XP`;
  }
  hintBtn.addEventListener('click', () => {
    revealHint(lesson.id);
    refreshHints();
  });
  refreshHints();

  /* run */
  async function doRun() {
    runBtn.disabled = true;
    output.innerHTML = '<div class="running">Running…</div>';
    const res = await run(editor.value, lesson.tests);
    runBtn.disabled = false;

    output.innerHTML =
      (res.userError ? `<div class="user-error">${esc(res.userError)}</div>` : '') +
      (res.logs.length
        ? `<pre class="console-out">${esc(res.logs.join('\n'))}</pre>`
        : '') +
      `<ul class="tests">${res.results
        .map(
          (r) =>
            `<li class="${r.pass ? 'pass' : 'fail'}"><span class="mark">${r.pass ? '✓' : '✗'}</span> ${esc(r.name)}${
              !r.pass && r.error ? ` <span class="err">— ${esc(r.error)}</span>` : ''
            }</li>`
        )
        .join('')}</ul>`;

    const allPass =
      !res.userError && res.results.length > 0 && res.results.every((r) => r.pass);
    if (allPass) celebrate();
  }
  runBtn.addEventListener('click', doRun);

  /* payoff */
  function celebrate() {
    const first = !isComplete(lesson.id);
    let html = '';
    if (first) {
      const before = rank().title;
      const earned = award();
      completeLesson(lesson.id, earned);
      const after = rank().title;
      html += `<div class="xp-pop">+${earned} XP</div>`;
      if (badgeEarned(ch)) {
        html += `
          <div class="badge-card">
            <div class="badge-emoji">${ch.badge.emoji}</div>
            <div><strong>Badge earned</strong><br>${esc(ch.badge.name)} — ${esc(ch.title)} complete!</div>
          </div>`;
      }
      if (after !== before) {
        html += `<div class="rank-banner">⬆ Rank up — you are now a <strong>${esc(after)}</strong></div>`;
      }
    } else {
      html += `<div class="already-done">Still passing. ✓</div>`;
    }
    html += `<div class="next-row">${
      next
        ? `<a class="next-btn" href="${next}">Next lesson →</a>`
        : `<a class="next-btn" href="#/${ch.id}">Back to chapter →</a>`
    }</div>`;
    payoff.innerHTML = html;
    refreshHints(); // award label -> "completed"
  }
}

router();

// Same worker the kid app uses (stale-while-revalidate, origin scope) — makes
// Pro work offline once visited, so add-to-home-screen behaves like an app.
if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');

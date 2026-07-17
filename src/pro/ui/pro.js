// CodeQuest Pro — whole SPA, hash-routed. Plain DOM, no framework.
import chapters from '../chapters/index.js';
import beginnerUnits from '../beginner/foundations.js';
import expertChapters from '../expert/index.js';
import { run } from '../engine/runner.js';
import { setHue } from './aether.js';
import {
  isComplete, completeLesson, hintsUsed, revealHint,
  totalXp, rank, streakCount, chapterProgress, badgeEarned,
} from '../progress.js';

const app = document.getElementById('app');
const beginner = beginnerUnits[0]; // one Foundations unit for now

// one accent hue per chapter — drives frame gradients, ticks, and lesson accents
const HUES = [204, 262, 36, 152, 326, 184, 58, 12];
const EXPERT_HUES = [280, 330, 190, 45, 165, 8];
const isExpert = (ch) => expertChapters.includes(ch);
function hueOf(ch) {
  const i = chapters.indexOf(ch);
  if (i >= 0) return HUES[i];
  const j = expertChapters.indexOf(ch);
  if (j >= 0) return EXPERT_HUES[j] ?? 280;
  return 204;
}

const FLAME_SVG =
  '<svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true"><path d="M5.5 0C6 2.5 8.5 3.5 8.5 6.5a3 3 0 0 1-6 0C2.5 5 3 4.5 3.5 3.5 4 5 5 5.5 5 6.5 5 4 4.5 2 5.5 0Z" fill="currentColor" transform="translate(0,1.5) scale(1,1.6)"/></svg>';
const PLAY_SVG =
  '<svg width="11" height="12" viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1l10 6-10 6z" fill="currentColor"/></svg>';

// one small sprite per tier (pixel-art fighter, powers up left→right), shown at
// the top and swapped as you switch tiers
const SPRITES = {
  beginner: '<img class="sprite-img" src="media/tier-beginner.png" alt="" width="78" height="200">',
  intermediate: '<img class="sprite-img" src="media/tier-intermediate.png" alt="" width="77" height="200">',
  expert: '<img class="sprite-img" src="media/tier-expert.png" alt="" width="78" height="200">',
};
const TIER_HUE = { beginner: 150, intermediate: 204, expert: 280 };
const TIER_KEY = 'codequest-pro-tier';
const lastTier = () => {
  try {
    const t = localStorage.getItem(TIER_KEY);
    return t in TIER_HUE ? t : 'beginner'; // guard: never redirect to an invalid tier
  } catch { return 'beginner'; }
};
const rememberTier = (t) => { try { localStorage.setItem(TIER_KEY, t); } catch {} };

// top-of-page tier switcher: current sprite + three tabs
function tierSwitcher(active) {
  const tabs = [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['expert', 'Expert']];
  return `
    <div class="tier-switch" style="--hue:${TIER_HUE[active]}">
      <span class="tier-sprite">${SPRITES[active]}</span>
      <div class="seg" role="tablist">
        ${tabs
          .map(
            ([id, label]) =>
              `<a class="seg-btn${id === active ? ' on' : ''}" href="#/${id}" style="--hue:${TIER_HUE[id]}" role="tab" aria-selected="${id === active}">${label}</a>`
          )
          .join('')}
      </div>
    </div>`;
}

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
  const [seg, li] = location.hash.replace(/^#\/?/, '').split('/');
  scrollTo(0, 0);

  // root → land on whichever tier you last used (no separate chooser page)
  if (!seg) {
    location.hash = `/${lastTier()}`;
    return;
  }

  // Beginner tier: switcher + lesson list (reading/quiz lessons)
  if (seg === 'beginner') {
    setHue(150);
    const i = Number(li);
    if (li !== undefined && li !== '' && beginner.lessons[i]) {
      document.body.dataset.view = 'lesson';
      return showBeginnerLesson(i);
    }
    rememberTier('beginner');
    document.body.dataset.view = 'grid';
    return showBeginnerList();
  }

  // Expert tier: switcher + chapter mosaic
  if (seg === 'expert') {
    rememberTier('expert');
    document.body.dataset.view = 'grid';
    setHue(280);
    return showExpertGrid();
  }

  // Intermediate tier: switcher + chapter mosaic
  if (seg === 'intermediate') {
    rememberTier('intermediate');
    document.body.dataset.view = 'grid';
    setHue(204);
    return showChapters();
  }

  // Any code chapter / lesson — intermediate (ch1…ch8) or expert (x1…x6)
  const ch = [...chapters, ...expertChapters].find((c) => c.id === seg);
  if (ch) {
    setHue(hueOf(ch));
    const i = Number(li);
    if (li !== undefined && li !== '' && ch.lessons[i]) {
      document.body.dataset.view = 'lesson';
      return showLesson(ch, i);
    }
    document.body.dataset.view = 'chapter';
    return showChapter(ch);
  }

  location.hash = ''; // unknown route → home
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

/* ---------- shared tier page shell (header + switcher + body) ---------- */

function tierPage(active, bodyHtml) {
  app.innerHTML = `
    <header class="pro-header">
      <h1>CodeQuest <span class="pro-mark">Pro</span></h1>
      ${statusBar()}
    </header>
    ${tierSwitcher(active)}
    ${bodyHtml}`;
}

/* ---------- Beginner tier ---------- */

function showBeginnerList() {
  const body = `
    <main class="chapter-page" style="--hue:150">
      <p class="chapter-lead">${esc(beginner.tagline)}</p>
      <ol class="lesson-list">
        ${beginner.lessons
          .map((l, i) => {
            const done = isComplete(l.id);
            return `
            <li>
              <a class="lesson-row${done ? ' done' : ''}" href="#/beginner/${i}">
                <span class="check">${done ? '✓' : ''}</span>
                <span class="lesson-title">${esc(l.title)}</span>
                <span class="lesson-xp">${l.xp} XP</span>
              </a>
            </li>`;
          })
          .join('')}
      </ol>
    </main>`;
  tierPage('beginner', body);
}

function showBeginnerLesson(i) {
  const lesson = beginner.lessons[i];
  const done = isComplete(lesson.id);
  const prev = i > 0 ? `#/beginner/${i - 1}` : null;
  const next = i + 1 < beginner.lessons.length ? `#/beginner/${i + 1}` : null;

  app.innerHTML = `
    <header class="pro-header lesson-header">
      <a class="back" href="#/beginner">← ${esc(beginner.title)}</a>
      <span class="lesson-pos">Lesson ${i + 1} / ${beginner.lessons.length}</span>
      <nav class="lesson-nav">
        ${prev ? `<a href="${prev}">‹ Prev</a>` : '<span class="dim">‹ Prev</span>'}
        ${next ? `<a href="${next}">Next ›</a>` : '<span class="dim">Next ›</span>'}
      </nav>
    </header>
    <main class="beginner-lesson" style="--hue:150">
      <h1>${esc(lesson.title)} ${done ? '<span class="done-tag">✓ done</span>' : ''}</h1>
      <div class="reading">${md(lesson.reading)}</div>
      <div class="quiz" id="quiz"></div>
      <div id="payoff"></div>
    </main>`;

  const quizEl = document.getElementById('quiz');
  const payoff = document.getElementById('payoff');
  const answered = new Array(lesson.questions.length).fill(false);

  quizEl.innerHTML = lesson.questions
    .map(
      (question, qi) => `
      <div class="q-card" data-q="${qi}">
        <p class="q-text">${md(question.q)}</p>
        <div class="choices">
          ${question.choices
            .map(
              (c, ci) =>
                `<button class="choice" data-q="${qi}" data-c="${ci}">${esc(c)}</button>`
            )
            .join('')}
        </div>
        <div class="q-why" hidden></div>
      </div>`
    )
    .join('');

  quizEl.querySelectorAll('.choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qi = Number(btn.dataset.q);
      const ci = Number(btn.dataset.c);
      if (answered[qi]) return; // one shot per question
      const question = lesson.questions[qi];
      const card = quizEl.querySelector(`.q-card[data-q="${qi}"]`);
      const correct = ci === question.answer;

      card.querySelectorAll('.choice').forEach((b, bi) => {
        b.disabled = true;
        if (bi === question.answer) b.classList.add('correct');
        else if (bi === ci) b.classList.add('wrong');
      });
      const why = card.querySelector('.q-why');
      why.innerHTML = `${correct ? '<strong class="ok">Right.</strong> ' : '<strong class="no">Not quite.</strong> '}${md(question.why)}`;
      why.hidden = false;

      answered[qi] = true;
      if (answered.every(Boolean)) celebrate();
    });
  });

  function celebrate() {
    const first = !isComplete(lesson.id);
    let html = '';
    if (first) {
      const before = rank().title;
      completeLesson(lesson.id, lesson.xp);
      const after = rank().title;
      html += `<div class="xp-pop">+${lesson.xp} XP</div>`;
      if (badgeEarned(beginner)) {
        html += `
          <div class="badge-card">
            <div class="badge-emoji">${beginner.badge.emoji}</div>
            <div><strong>Badge earned</strong><br>${esc(beginner.badge.name)} — Foundations complete!</div>
          </div>`;
      }
      if (after !== before) {
        html += `<div class="rank-banner">⬆ Rank up — you are now a <strong>${esc(after)}</strong></div>`;
      }
    }
    html += `<div class="next-row">${
      next
        ? `<a class="next-btn" href="${next}">Next lesson →</a>`
        : `<a class="next-btn" href="#/intermediate">Start Intermediate →</a>`
    }</div>`;
    payoff.innerHTML = html;
  }
}

/* ---------- code-chapter mosaic (shared by Intermediate + Expert) ---------- */

// Just the grid of chapter frames, rows of 3. `unitWord` labels the kicker.
function chapterGrid(list, unitWord) {
  const rows = [];
  for (let k = 0; k < list.length; k += 3) rows.push(list.slice(k, k + 3));
  return `
    <main class="chapter-grid">
      ${rows
        .map(
          (row) =>
            `<div class="frame-row">${row
              .map((ch) => {
                const n = list.indexOf(ch);
                const { done, total } = chapterProgress(ch);
                const earned = badgeEarned(ch);
                const pct = Math.round((done / total) * 100);
                return `
              <a class="frame${earned ? ' complete' : ''}" href="#/${ch.id}" style="--hue:${hueOf(ch)}">
                <div class="frame-bg"></div>
                <span class="ghost-num">${String(n + 1).padStart(2, '0')}</span>
                <i class="tick tl"></i><i class="tick br"></i>
                <div class="frame-body">
                  <div class="frame-kicker">
                    <span>${unitWord} ${String(n + 1).padStart(2, '0')}</span>
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

function showChapters() {
  tierPage('intermediate', chapterGrid(chapters, 'Ch'));
}

function showExpertGrid() {
  tierPage('expert', chapterGrid(expertChapters, 'Unit'));
}

/* ---------- chapter view (intro + lesson list) ---------- */

function showChapter(ch) {
  app.innerHTML = `
    <header class="pro-header">
      <a class="back" href="#/${isExpert(ch) ? 'expert' : 'intermediate'}">← ${isExpert(ch) ? 'Expert' : 'Intermediate'}</a>
      ${statusBar()}
    </header>
    <main class="chapter-page" style="--hue:${hueOf(ch)}">
      <div class="tier-tag">${isExpert(ch) ? 'Expert' : 'Intermediate'}</div>
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

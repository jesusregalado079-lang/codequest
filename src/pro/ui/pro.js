// CodeQuest Pro — whole SPA, hash-routed. Plain DOM, no framework.
import chapters from '../chapters/index.js';
import beginnerUnits from '../beginner/foundations.js';
import expertChapters from '../expert/index.js';
import studies from '../resources.js';
import careerPath, { milestones, gate } from '../career-path.js';
import { run } from '../engine/runner.js';
import { setHue } from './aether.js';
import {
  isComplete, completeLesson, hintsUsed, revealHint,
  totalXp, rank, streakCount, chapterProgress, badgeEarned,
  isStudyDone, toggleStudyDone,
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

  // Studies: curated external study links
  if (seg === 'resources') {
    document.body.dataset.view = 'chapter';
    setHue(48);
    return showResources();
  }

  // Career Path: staged, sequenced roadmap (separate from the Studies grab-bag)
  if (seg === 'career-path') {
    document.body.dataset.view = 'chapter';
    setHue(152);
    return showCareerPath();
  }

  // Career Path progress: where you are, computed from the same checkboxes
  if (seg === 'career-progress') {
    document.body.dataset.view = 'chapter';
    setHue(152);
    return showCareerProgress();
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
      <a class="studies-link" href="#/resources">Studies ↗</a>
      <a class="studies-link" href="#/career-path">Career Path ↗</a>
      ${statusBar()}
    </header>
    ${tierSwitcher(active)}
    ${bodyHtml}`;
}

/* ---------- shared: study-group cards (used by Studies and Career Path) ---------- */

// Progress keys: resources are keyed by URL; deliverables ("outputs") by `out:<key>`;
// gate conditions by `gate:<key>`. All go through the same isStudyDone/toggleStudyDone.
const outKey = (o) => `out:${o.key}`;
const gateKey = (c) => `gate:${c.key}`;

function groupItems(g) {
  // Every checkable thing in a group, in display order.
  const links = g.links.map((l) => ({ key: l.url, hours: l.hours || 0 }));
  const outs = (g.outputs || []).map((o) => ({ key: outKey(o), hours: 0 }));
  return [...links, ...outs];
}

function groupStats(g) {
  const items = groupItems(g);
  const done = items.filter((i) => isStudyDone(i.key));
  const hoursTotal = items.reduce((s, i) => s + i.hours, 0);
  const hoursDone = done.reduce((s, i) => s + i.hours, 0);
  return { done: done.length, total: items.length, hoursDone, hoursTotal, pct: items.length ? Math.round((done.length / items.length) * 100) : 0 };
}

function renderStudyGroups(groups) {
  return groups
    .map((g) => {
      const st = groupStats(g);
      const meta = [
        g.lane ? '<span class="study-lane">income lane</span>' : '',
        g.months ? `<span class="study-meta">months ${esc(g.months)}</span>` : '',
        g.hours ? `<span class="study-meta">~${g.hours[0]}–${g.hours[1]} hrs</span>` : '',
      ].join('');
      return `
      <section class="study-group${g.lane ? ' lane' : ''}">
        <h2>${esc(g.title)} <span class="study-group-progress">${st.done}/${st.total} done</span></h2>
        ${meta ? `<div class="study-metarow">${meta}</div>` : ''}
        <p class="chapter-lead">${esc(g.blurb)}</p>
        <div class="study-list">
          ${g.links
            .map((l) => {
              const done = isStudyDone(l.url);
              return `
            <div class="study-card${done ? ' done' : ''}">
              <button class="study-check" data-url="${esc(l.url)}" aria-pressed="${done}" aria-label="Mark ${esc(l.name)} as ${done ? 'not studied' : 'studied'}">${done ? '✓' : ''}</button>
              <a class="study-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
                <div class="study-by">${esc(l.by)}${l.hours ? ` <span class="study-hrs">~${l.hours}h</span>` : ''}${l.codex ? ' <span class="study-codex">codex addition</span>' : ''}</div>
                <div class="study-name">${esc(l.name)} <span class="ext">↗</span></div>
                <div class="study-note">${esc(l.note)}</div>
              </a>
            </div>`;
            })
            .join('')}
        </div>
        ${
          g.outputs && g.outputs.length
            ? `<h3 class="study-outputs-h">Output you can point at</h3>
        <div class="study-list study-outputs">
          ${g.outputs
            .map((o) => {
              const k = outKey(o);
              const done = isStudyDone(k);
              return `
            <div class="study-card output${done ? ' done' : ''}">
              <button class="study-check" data-url="${esc(k)}" aria-pressed="${done}" aria-label="Mark ${esc(o.name)} as ${done ? 'not done' : 'done'}">${done ? '✓' : ''}</button>
              <div class="study-link study-static"><div class="study-name">${esc(o.name)}</div></div>
            </div>`;
            })
            .join('')}
        </div>`
            : ''
        }
        ${
          g.source
            ? `<p class="study-source">Source: <a href="${esc(g.source.url)}" target="_blank" rel="noopener noreferrer">${esc(g.source.label)}</a></p>`
            : ''
        }
      </section>`;
    })
    .join('');
}

function wireStudyChecks(rerender) {
  app.querySelectorAll('.study-check').forEach((btn) => {
    btn.addEventListener('click', () => {
      const y = window.scrollY;
      toggleStudyDone(btn.dataset.url);
      rerender();
      window.scrollTo(0, y);
    });
  });
}

/* ---------- Studies (curated external links) ---------- */

function showResources() {
  app.innerHTML = `
    <header class="pro-header">
      <a class="back" href="#/">← Back to lessons</a>
      ${statusBar()}
    </header>
    <main class="chapter-page" style="--hue:48">
      <div class="tier-tag">Studies</div>
      <h1>Extra Studies</h1>
      <p class="chapter-lead">Hand-picked resources to study alongside the course. External links open in a new tab. Check one off once you've done it — that's saved on this device.</p>
      ${renderStudyGroups(studies)}
    </main>`;

  wireStudyChecks(showResources);
}

/* ---------- Career Path (staged, sequenced roadmap) ---------- */

function careerHeader() {
  return `
    <header class="pro-header">
      <a class="back" href="#/">← Back to lessons</a>
      <nav class="career-nav">
        <a href="#/career-path">Roadmap</a>
        <a href="#/career-progress">Progress</a>
      </nav>
      ${statusBar()}
    </header>`;
}

function showCareerPath() {
  app.innerHTML = `
    ${careerHeader()}
    <main class="chapter-page" style="--hue:152">
      <div class="tier-tag">Career Path</div>
      <h1>Operator to Engineer</h1>
      <p class="chapter-lead">Eight phases from zero cybersecurity background to a security-engineer title, designed by Codex from every resource researched, with your AI-agent skill as the operating layer of every phase. Every resource links to where it lives. Check off resources and deliverables as you go — the <a href="#/career-progress">Progress page</a> reads the same checkmarks.</p>
      <p class="chapter-lead"><strong>The one rule above everything:</strong> never outsource understanding. Every AI-generated artifact must be explainable line by line.</p>
      ${renderStudyGroups(careerPath)}
    </main>`;

  wireStudyChecks(showCareerPath);
}

/* ---------- Career Path · Progress ---------- */

function showCareerProgress() {
  const stats = careerPath.map((p) => ({ p, ...groupStats(p) }));
  const totalItems = stats.reduce((s, x) => s + x.total, 0);
  const doneItems = stats.reduce((s, x) => s + x.done, 0);
  const hoursTotal = stats.reduce((s, x) => s + x.hoursTotal, 0);
  const hoursDone = stats.reduce((s, x) => s + x.hoursDone, 0);
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const hoursLeft = Math.max(0, hoursTotal - hoursDone);
  const daysLeft = Math.ceil(hoursLeft / 2);
  const weeksLeft = Math.ceil(daysLeft / 7);
  const current = stats.find((x) => x.pct < 100) || null;
  const complete = (n) => stats.find((x) => x.p.n === n)?.pct === 100;

  const phaseRows = stats
    .map(
      (x) => `
      <a class="prog-row${x.p.lane ? ' lane' : ''}${current && current.p.n === x.p.n ? ' current' : ''}${x.pct === 100 ? ' complete' : ''}" href="#/career-path">
        <div class="prog-n">${x.p.n}</div>
        <div class="prog-body">
          <div class="prog-title">${esc(x.p.title.replace(/^Phase \d+ — /, ''))}${x.p.lane ? ' <span class="study-lane">income lane</span>' : ''}${current && current.p.n === x.p.n ? ' <span class="prog-here">you are here</span>' : ''}</div>
          <div class="prog-meta">months ${esc(x.p.months)} · ${x.done}/${x.total} done · ${x.hoursDone}/${x.hoursTotal} study hrs</div>
          <div class="prog-bar"><div class="prog-fill" style="width:${x.pct}%"></div></div>
        </div>
        <div class="prog-pct">${x.pct}%</div>
      </a>`,
    )
    .join('');

  const milestoneRows = milestones
    .map((m) => {
      const reached = m.requires.every(complete);
      return `
      <div class="ms-row${reached ? ' reached' : ''}${m.big ? ' big' : ''}">
        <div class="ms-check">${reached ? '✓' : ''}</div>
        <div class="ms-body">
          <div class="ms-when">${esc(m.when)}</div>
          <div class="ms-label">${esc(m.label)}</div>
          <div class="ms-ev">${esc(m.evidence)} · needs phase${m.requires.length > 1 ? 's' : ''} ${m.requires.join(', ')} complete</div>
        </div>
      </div>`;
    })
    .join('');

  const gateDone = gate.conditions.filter((c) => isStudyDone(gateKey(c))).length;
  const gateOpen = gateDone === gate.conditions.length;
  const gateRows = gate.conditions
    .map((c) => {
      const k = gateKey(c);
      const done = isStudyDone(k);
      return `
      <div class="study-card output${done ? ' done' : ''}">
        <button class="study-check" data-url="${esc(k)}" aria-pressed="${done}" aria-label="Mark gate condition as ${done ? 'not met' : 'met'}">${done ? '✓' : ''}</button>
        <div class="study-link study-static"><div class="study-name">${esc(c.name)}</div></div>
      </div>`;
    })
    .join('');

  app.innerHTML = `
    ${careerHeader()}
    <main class="chapter-page prog-page" style="--hue:152">
      <div class="tier-tag">Career Path · Progress</div>
      <h1>Where you are</h1>
      <p class="chapter-lead">Computed from the same checkmarks as the <a href="#/career-path">roadmap</a>. Saved on this device only.</p>

      <section class="prog-overall">
        <div class="prog-big">
          <b>${pct}%</b><span>${doneItems} of ${totalItems} items done</span>
        </div>
        <div class="prog-big">
          <b>${hoursDone}<small>/${hoursTotal}</small></b><span>study hours done</span>
        </div>
        <div class="prog-big">
          <b>${weeksLeft}<small> wks</small></b><span>~${daysLeft} days left at 2 hrs/day</span>
        </div>
        <div class="prog-big">
          <b>${current ? `Phase ${current.p.n}` : 'Done'}</b><span>${current ? esc(current.p.title.replace(/^Phase \d+ — /, '')) : 'every phase complete'}</span>
        </div>
      </section>
      <div class="prog-bar big"><div class="prog-fill" style="width:${pct}%"></div></div>

      <h2 class="prog-h2">Phases</h2>
      <div class="prog-list">${phaseRows}</div>

      <h2 class="prog-h2">Milestones <span class="study-group-progress">Codex timeline at 14 hrs/week</span></h2>
      <div class="ms-list">${milestoneRows}</div>

      <h2 class="prog-h2">Paid-cert gate <span class="study-group-progress">${gateDone}/${gate.conditions.length} conditions · ${gateOpen ? 'OPEN' : 'closed'}</span></h2>
      <p class="chapter-lead">Nothing paid until all four are true. Tick them yourself — none can be read from study progress.</p>
      <div class="study-list study-outputs">${gateRows}</div>
      <div class="gate-panel${gateOpen ? ' open' : ''}">
        <div class="gate-first">First paid cert: <a href="${esc(gate.firstUrl)}" target="_blank" rel="noopener noreferrer">${esc(gate.first)} ↗</a></div>
        <p class="study-note">${esc(gate.why)}</p>
        <p class="study-note"><strong>Buy it when the portfolio is complete and any one of these is true:</strong></p>
        <ul class="gate-ul">${gate.triggers.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="study-note"><strong>Possible second cert — one only, by the branch you're actually on:</strong></p>
        <ul class="gate-ul">${gate.second.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a> <span class="study-by">${esc(s.by)}</span> — ${esc(s.note)}</li>`).join('')}</ul>
        <p class="study-note"><strong>Ratings Codex overruled:</strong></p>
        <ul class="gate-ul">${gate.overruled.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </div>
    </main>`;

  wireStudyChecks(showCareerProgress);
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

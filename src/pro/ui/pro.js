// CodeQuest Pro — whole SPA, hash-routed. Plain DOM, no framework.
// The entry holds the router, the Beginner tier and the career pages. Lesson tiers, the exam pages (each exam's bank is
// its own chunk) and the labs load on their routes (lazy.js); summaries for the Journey and achievements come from small
// generated indexes, so no bank or lab content is needed to draw them.
import beginnerUnits from '../beginner/foundations.js';
import studies from '../resources.js';
import careerPath, { milestones, gate, extras } from '../career-path.js';
import expeditedStages from '../expedited-path.js';
import { DEFAULT_EXAM, EXAMS, examById } from '../exam/registry.js';
import { examRoute } from '../exam/routes.js';
import { examSummaries } from '../exam/summary.js';
import { labsSummary } from './labs/summary.js';
import { beginNav, isCurrentNav, lazyPage, retryImport } from './lazy.js';
import { achievements, gateKey, groupStats as groupStatsOf, heatmap, journey, outKey, passMark, quizKey } from '../career-logic.js';
import { run } from '../engine/runner.js';
import { setHue } from './aether.js';
import { careerHeaderHtml } from './career-nav.js';
import {
  isComplete, completeLesson, hintsUsed, revealHint,
  totalXp, rank, streakCount, chapterProgress, badgeEarned,
  toggleStudyDone, setStudyDone, studyDoneMap, ensureMigrated, doneDates, getSettings, setHoursPerWeek,
  applyLabBadgeMigration, getBadges, recordBadges,
  exportProgress, importProgress, requestPersistentStorage,
} from '../progress.js';

const app = document.getElementById('app');
const beginner = beginnerUnits[0]; // one Foundations unit for now

// Lazy modules. The lesson tiers fill these lists once loaded; the exam and labs UIs are kept so the router can stop
// their clocks and listeners on leave without ever importing them eagerly.
let chapters = [];
let expertChapters = [];
const ui = { exam: null, labs: null };
const loadTier = (tier) => (tier === 'expert'
  ? retryImport(() => import('../expert/index.js'), (m) => Array.isArray(m.default)).then((m) => { expertChapters = m.default; })
  : retryImport(() => import('../chapters/index.js'), (m) => Array.isArray(m.default)).then((m) => { chapters = m.default; }));
const loadExamUi = () => retryImport(() => import('./exam.js'), (m) => typeof m.showExam === 'function').then((m) => { ui.exam = m; return m; });
const loadLabsUi = () => retryImport(() => import('./labs/index.js'), (m) => typeof m.showLabs === 'function').then((m) => { ui.labs = m; return m; });

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
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

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

// Frames for a lazy page's loading or error line, so the header and tabs are already there while a chunk loads.
const frame = (head, inner) => { app.innerHTML = `${head}<main class="chapter-page lazy-page">${inner}</main>`; return app; };
const careerFrame = (active) => (inner) => frame(careerHeader(active), inner);
const tierFrame = (tier) => (inner) => { tierPage(tier, `<main class="chapter-page lazy-page">${inner}</main>`); return app; };
const lessonFrame = (inner) => frame('<header class="pro-header"><a class="back" href="#/">← Lessons</a></header>', inner);
const careerCtx = () => ({ app, header: careerHeader, esc, celebrate: withCelebration, saveWarn: showSaveWarning });

function router() {
  const token = beginNav(); // a slow chunk from an earlier navigation never renders over this one
  focusRouteHeading(token);
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [seg, li] = parts;
  scrollTo(0, 0);
  document.title = 'CodeQuest Pro';
  // career pages (Journey, Exams, Labs, Roadmap, Progress, Extra, Studies) share one layout and one link/focus hue
  const career = ['resources', 'career-journey', 'exam', 'labs', 'career-path', 'career-progress', 'career-extra'].includes(seg);
  if (career) document.body.dataset.area = 'career';
  else delete document.body.dataset.area;
  if (ui.exam) ui.exam.leaveExam(); // stop an exam clock or key listener from the page we are leaving
  if (ui.labs) ui.labs.leaveLabs(); // same for a lab runner (sprint clock, key listeners)

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
    document.title = 'Studies · CodeQuest Pro';
    setHue(48);
    return showResources();
  }

  // Career Journey: the visual map of where he is and where he is going
  if (seg === 'career-journey') {
    document.body.dataset.view = 'chapter';
    document.title = 'Career Journey · CodeQuest Pro';
    setHue(152);
    return showCareerJourney();
  }

  // Certification exam practice: #/exam (all exams), #/exam/<examId>[/domain/<n> | /session | /result/<id>].
  // Old Security+ links (#/exam/domain/<n>, #/exam/session, #/exam/result/<id>) are replaced by their new address.
  if (seg === 'exam') {
    const route = examRoute(parts.slice(1));
    if (route.redirect) { location.replace(`#${route.redirect}`); return; }
    const exam = route.hub ? null : examById(route.examId);
    document.body.dataset.view = 'chapter';
    document.title = `${exam ? `${exam.blueprint.short} ` : ''}Exam Practice · CodeQuest Pro`;
    setHue(212);
    return lazyPage({
      key: exam ? `exam:${exam.id}` : 'exam-ui',
      load: () => Promise.all([loadExamUi(), exam ? exam.load() : null]),
      render: ([m, bank]) => m.showExam(route, bank, careerCtx()),
      show: careerFrame('exam'),
      token,
      what: exam ? `${exam.blueprint.short} practice` : 'exam practice',
    });
  }

  // Hands-on labs (performance-based practice): #/labs, #/labs/<labId>, #/labs/<labId>/<caseId>
  if (seg === 'labs') {
    document.body.dataset.view = 'chapter';
    document.title = 'Hands-on Labs · CodeQuest Pro';
    setHue(176);
    return lazyPage({ key: 'labs-ui', load: loadLabsUi, render: (m) => m.showLabs(parts.slice(1), careerCtx()), show: careerFrame('labs'), token, what: 'the labs' });
  }

  // Career Path: staged, sequenced roadmap (separate from the Studies grab-bag); #/career-path/3 opens Phase 3
  if (seg === 'career-path') {
    document.body.dataset.view = 'chapter';
    document.title = 'Career Roadmap · CodeQuest Pro';
    setHue(152);
    return showCareerPath(li);
  }

  // Career Path progress: where you are, computed from the same checkboxes
  if (seg === 'career-progress') {
    document.body.dataset.view = 'chapter';
    document.title = 'Career Progress · CodeQuest Pro';
    setHue(152);
    return showCareerProgress();
  }

  // Career Path extras: optional side content, not part of the roadmap
  if (seg === 'career-extra') {
    document.body.dataset.view = 'chapter';
    document.title = 'Career Extra · CodeQuest Pro';
    setHue(152);
    return showCareerExtra();
  }

  // Expert tier: switcher + chapter mosaic
  if (seg === 'expert') {
    rememberTier('expert');
    document.body.dataset.view = 'grid';
    setHue(280);
    return lazyPage({ key: 'tier:expert', load: () => loadTier('expert'), render: () => showExpertGrid(), show: tierFrame('expert'), token, what: 'the Expert chapters' });
  }

  // Intermediate tier: switcher + chapter mosaic
  if (seg === 'intermediate') {
    rememberTier('intermediate');
    document.body.dataset.view = 'grid';
    setHue(204);
    return lazyPage({ key: 'tier:intermediate', load: () => loadTier('intermediate'), render: () => showChapters(), show: tierFrame('intermediate'), token, what: 'the Intermediate chapters' });
  }

  // Any code chapter / lesson — intermediate (ch1…ch8) or expert (x1…x6). Anything else loads both tiers to look.
  const tiers = /^ch\d+$/.test(seg) ? ['intermediate'] : /^x\d+$/.test(seg) ? ['expert'] : ['intermediate', 'expert'];
  return lazyPage({
    key: `tier:${tiers.join('+')}`,
    load: () => Promise.all(tiers.map(loadTier)),
    render: () => {
      const ch = [...chapters, ...expertChapters].find((c) => c.id === seg);
      if (!ch) { location.hash = ''; return; } // unknown route → home
      setHue(hueOf(ch));
      const i = Number(li);
      if (li !== undefined && li !== '' && ch.lessons[i]) {
        document.body.dataset.view = 'lesson';
        return showLesson(ch, i);
      }
      document.body.dataset.view = 'chapter';
      return showChapter(ch);
    },
    show: lessonFrame,
    token,
    what: 'the lesson',
  });
}
function focusRouteHeading(token) {
  const observer = new MutationObserver(() => {
    if (!isCurrentNav(token)) { observer.disconnect(); return; }
    const heading = app.querySelector('main h1');
    if (!heading) return; // a lazy page still shows its loading line
    observer.disconnect();
    if (app.contains(document.activeElement) && document.activeElement !== app) return;
    heading.tabIndex = -1;
    heading.dataset.routeFocus = '';
    heading.focus({ preventScroll: true });
  });
  observer.observe(app, { childList: true });
}
window.addEventListener('hashchange', router);
// A link to the roadmap phase already in the address bar fires no hashchange: scroll to that phase instead.
app.addEventListener('click', (event) => {
  const a = event.target.closest && event.target.closest('a[href^="#/career-path/"]');
  if (!a || a.getAttribute('href') !== location.hash || !app.querySelector('.rm-page')) return;
  event.preventDefault();
  showPhase(a.getAttribute('href').split('/').pop());
});
// Before anything renders: carry checkmarks saved under old URL keys over to the permanent ids (runs once).
ensureMigrated();
requestPersistentStorage();

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
      <a class="studies-link" href="#/resources">Studies <span aria-hidden="true">↗</span></a>
      <a class="studies-link" href="#/career-journey">Career Journey <span aria-hidden="true">↗</span></a>
      ${statusBar()}
    </header>
    ${tierSwitcher(active)}
    ${bodyHtml}`;
}

/* ---------- shared: study-group cards (used by Studies and Career Path) ---------- */

// Progress keys and per-group counts live in career-logic.js (pure, tested). Old URL keys were moved over once by
// ensureMigrated().
const groupStats = (g, done = studyDoneMap()) => groupStatsOf(g, done);

// Toggle buttons keep one label; aria-pressed says whether it is done.
const checkLabel = (name, doneWord = 'studied') => `Mark ${name} as ${doneWord}`;

// A phase's status on the roadmap, from the Journey: done, current ("you are here"), upcoming or an optional lane.
const PHASE_STATUS = {
  done: ['is-done', 'Done'],
  current: ['is-current', 'You are here'],
  ahead: ['is-upcoming', 'Upcoming'],
  lane: ['is-lane', 'Side quest · optional'],
  'active-lane': ['is-lane', 'Side quest · started'],
};
const phaseCls = (p) => (p.state === 'done' ? 'is-done' : p.state === 'current' ? 'is-current' : p.lane ? 'is-lane' : '');

function nextUpHtml(n) {
  const name = n.url
    ? `<a class="rm-next-name" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${esc(n.name)} <span aria-hidden="true">↗</span></a>`
    : `<span class="rm-next-name">${esc(n.name)}</span>`;
  return `<p class="rm-next"><span class="c-label">Next up</span>${name}</p>`;
}

// One card per group (a roadmap phase, or a Studies/Extra group): head with number badge, title, % and count, chips, a
// progress line, then the resources as checklist rows and the deliverables in their own panel.
// `road` (Roadmap only) is the Journey: it gives each phase its status and the current phase its "Next up" line.
function renderStudyGroups(groups, road = null) {
  const done = studyDoneMap();
  return groups
    .map((g, gi) => {
      const st = groupStats(g, done);
      const ph = road && g.n ? road.phases.find((p) => p.n === g.n) : null;
      const [statusCls, statusLabel] = ph ? PHASE_STATUS[ph.state] || ['', ''] : ['', ''];
      const chips = [
        ph ? `<span class="c-chip study-status ${statusCls}">${statusLabel}</span>` : '',
        g.lane ? '<span class="c-chip is-lane study-lane">income lane</span>' : '',
        g.months ? `<span class="c-chip study-meta">months ${esc(g.months)}</span>` : '',
        g.hours ? `<span class="c-chip study-meta">~${g.hours[0]}–${g.hours[1]} hrs</span>` : '',
      ].join('');
      const next = road && road.next && road.next.phase === g.n ? road.next : null;
      return `
      <section class="study-group c-card${ph ? ` ${phaseCls(ph)}` : ''}${g.lane ? ' lane' : ''}" data-gi="${gi}">
        <div class="c-card-top${g.n ? '' : ' no-badge'}">
          ${g.n ? `<div class="c-badge" aria-hidden="true">${g.n}</div>` : ''}
          <div class="c-card-title"><h2>${esc(g.title)}</h2></div>
          <div class="c-card-pct"><strong class="study-group-pct">${st.pct}%</strong><span class="study-group-progress">${st.done}/${st.total} done</span></div>
        </div>
        ${chips ? `<div class="c-chips study-metarow">${chips}</div>` : ''}
        <div class="c-bar" aria-hidden="true"><i style="width:${st.pct}%"></i></div>
        <div class="c-card-body">
          ${next ? nextUpHtml(next) : ''}
          <p class="chapter-lead">${esc(g.blurb)}</p>
          <div class="study-list">
          ${g.links
            .map((l) => {
              const isDone = done[l.id] === true;
              return `
            <div class="study-card${isDone ? ' done' : ''}">
              <button type="button" class="study-check c-check" data-key="${esc(l.id)}" data-name="${esc(l.name)}" aria-pressed="${isDone}" aria-label="${esc(checkLabel(l.name))}">${isDone ? '✓' : ''}</button>
              <div class="study-col">
                <a class="study-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
                  <div class="study-by">${esc(l.by)}${l.hours ? ` <span class="study-hrs">~${l.hours}h</span>` : ''}${l.codex ? ' <span class="study-codex">codex addition</span>' : ''}</div>
                  <div class="study-name">${esc(l.name)} <span class="ext" aria-hidden="true">↗</span></div>
                  <div class="study-note">${esc(l.note)}</div>
                </a>
                ${l.quiz ? renderMiniQuiz(l.id, l.quiz, done) : ''}
              </div>
            </div>`;
            })
            .join('')}
          </div>
          ${
            g.outputs && g.outputs.length
              ? `<div class="study-deliver c-panel is-done">
            <h3 class="study-outputs-h">Output you can point at</h3>
            <div class="study-list study-outputs">
            ${g.outputs
              .map((o) => {
                const k = outKey(o);
                const isDone = done[k] === true;
                return `
              <div class="study-card output${isDone ? ' done' : ''}">
                <button type="button" class="study-check c-check" data-key="${esc(k)}" data-name="${esc(o.name)}" aria-pressed="${isDone}" aria-label="${esc(checkLabel(o.name, 'done'))}">${isDone ? '✓' : ''}</button>
                <div class="study-link study-static"><div class="study-name">${esc(o.name)}</div></div>
              </div>`;
              })
              .join('')}
            </div>
          </div>`
              : ''
          }
          ${
            g.source
              ? `<p class="study-source">Source: <a href="${esc(g.source.url)}" target="_blank" rel="noopener noreferrer">${esc(g.source.label)}</a></p>`
              : ''
          }
        </div>
      </section>`;
    })
    .join('');
}

function renderMiniQuiz(id, quiz, done = studyDoneMap()) {
  const passed = done[quizKey(id)] === true;
  const panelId = `quiz-${id}`;
  return `
    <div class="mini-quiz-wrap">
      <button type="button" class="quiz-toggle${passed ? ' passed' : ''}" data-quiz-id="${esc(id)}" aria-expanded="false" aria-controls="${esc(panelId)}">${passed ? '✓ Passed. Review again' : 'Test yourself ↓'}</button>
      <div class="mini-quiz" id="${esc(panelId)}" data-quiz-for="${esc(id)}" hidden>
        ${quiz
          .map(
            (q, qi) => `
          <div class="q-card mini" data-q="${qi}">
            <p class="q-text">${esc(q.q)}</p>
            <div class="choices">
              ${q.choices.map((c, ci) => `<button type="button" class="choice" data-q="${qi}" data-c="${ci}">${esc(c)}</button>`).join('')}
            </div>
            <div class="q-why" hidden></div>
          </div>`,
          )
          .join('')}
        <div class="quiz-result" role="status" aria-live="polite" hidden></div>
      </div>
    </div>`;
}

// Quizzes are looked up by the id of the card they sit in, from the groups on THIS page (so the same course listed in
// two phases can never grade one quiz with the other's answers).
function wireMiniQuizzes(groups) {
  const quizzes = new Map();
  groups.forEach((g) => g.links.forEach((l) => { if (l.quiz) quizzes.set(l.id, l.quiz); }));

  app.querySelectorAll('.quiz-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = app.querySelector(`.mini-quiz[data-quiz-for="${CSS.escape(btn.dataset.quizId)}"]`);
      if (!panel) return;
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', String(!panel.hidden));
    });
  });

  app.querySelectorAll('.mini-quiz').forEach((panel) => {
    const id = panel.dataset.quizFor;
    const quiz = quizzes.get(id) || [];
    const cards = panel.querySelectorAll('.q-card');
    const result = panel.querySelector('.quiz-result');
    let answered = new Array(cards.length).fill(null);

    const reset = () => {
      answered = new Array(cards.length).fill(null);
      cards.forEach((card) => {
        card.querySelectorAll('.choice').forEach((b) => { b.disabled = false; b.classList.remove('correct', 'wrong'); });
        const why = card.querySelector('.q-why');
        why.hidden = true;
        why.innerHTML = '';
      });
      result.hidden = true;
      result.innerHTML = '';
      const first = panel.querySelector('.choice');
      if (first) first.focus();
    };

    panel.addEventListener('click', (event) => {
      if (event.target.closest('.quiz-retry')) { reset(); return; }
      const btn = event.target.closest('.choice');
      if (!btn || btn.disabled) return;
      const card = btn.closest('.q-card');
      const qi = Number(card.dataset.q);
      const question = quiz[qi];
      if (!question || answered[qi] !== null) return;
      const ci = Number(btn.dataset.c);
      const correct = ci === question.answer;
      card.querySelectorAll('.choice').forEach((b, bi) => {
        b.disabled = true;
        if (bi === question.answer) b.classList.add('correct');
        else if (bi === ci) b.classList.add('wrong');
      });
      const why = card.querySelector('.q-why');
      why.innerHTML = `${correct ? '<strong class="ok">Right.</strong> ' : '<strong class="no">Not quite.</strong> '}${esc(question.why)}`;
      why.hidden = false;
      answered[qi] = correct;

      if (answered.every((a) => a !== null)) {
        const right = answered.filter(Boolean).length;
        const need = passMark(quiz.length);
        const toggle = app.querySelector(`.quiz-toggle[data-quiz-id="${CSS.escape(id)}"]`);
        if (right >= need) {
          const saved = withCelebration(() => setStudyDone(quizKey(id), true));
          if (!saved.ok) showSaveWarning();
          result.innerHTML = `<strong class="ok">Passed: ${right} of ${quiz.length}.</strong>`;
          if (toggle) { toggle.textContent = '✓ Passed. Review again'; toggle.classList.add('passed'); }
        } else {
          result.innerHTML = `<strong class="no">${right} of ${quiz.length} right.</strong> You need ${need} to pass. <button type="button" class="quiz-retry">Try again</button>`;
        }
        result.hidden = false;
      }
    });
  });
}

// "This browser did not save that" banner, shown whenever a save fails (storage full, blocked or unavailable).
function showSaveWarning() {
  let bar = document.getElementById('pro-save-warning');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'pro-save-warning';
    bar.className = 'save-warning';
    bar.setAttribute('role', 'alert');
    bar.innerHTML = '<strong>Your last change was not saved.</strong> This browser’s storage is full or blocked. <a href="#/career-progress">Back up your progress</a> before closing this page.';
    document.body.appendChild(bar);
  }
  bar.hidden = false;
}

// Checkmarks on Studies, Roadmap and Extra update in place: the page is not redrawn, so keyboard focus, scroll
// position and any open quiz stay exactly where they were. `after(done)` lets a page refresh its own summaries
// (the Roadmap's phase status and rail); if that moves anything above the box, the page scrolls with it.
function wireStudyChecks(groups, after = null) {
  app.querySelectorAll('.study-check').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const top = btn.getBoundingClientRect().top;
      const res = withCelebration(() => toggleStudyDone(key));
      if (!res.ok) showSaveWarning();
      const done = studyDoneMap();
      app.querySelectorAll(`.study-check[data-key="${CSS.escape(key)}"]`).forEach((b) => {
        const isDone = done[key] === true;
        b.setAttribute('aria-pressed', String(isDone));
        b.textContent = isDone ? '✓' : '';
        b.closest('.study-card').classList.toggle('done', isDone);
      });
      app.querySelectorAll('.study-group[data-gi]').forEach((section) => {
        const g = groups[Number(section.dataset.gi)];
        if (!g) return;
        const st = groupStats(g, done);
        const label = section.querySelector('.study-group-progress');
        if (label) label.textContent = `${st.done}/${st.total} done`;
        const pct = section.querySelector('.study-group-pct');
        if (pct) pct.textContent = `${st.pct}%`;
        const fill = section.querySelector(':scope > .c-bar > i');
        if (fill) fill.style.width = `${st.pct}%`;
      });
      if (after) after(done);
      const moved = btn.getBoundingClientRect().top - top;
      if (Math.abs(moved) > 0.5) window.scrollBy(0, moved);
    });
  });
}

// Pages that redraw on a tick (Progress) put focus back on the same checkbox afterwards.
function refocus(key) {
  const again = app.querySelector(`.study-check[data-key="${CSS.escape(key)}"]`);
  if (again) again.focus({ preventScroll: true });
}

/* ---------- Studies (curated external links) ---------- */

function showResources() {
  app.innerHTML = `
    ${careerHeader('resources')}
    <main class="chapter-page c-page">
      <div class="c-intro">
        <div class="tier-tag c-kicker">Studies</div>
        <h1 tabindex="-1">Extra Studies</h1>
        <p class="chapter-lead">Hand-picked resources to study alongside the course. External links open in a new tab. Check one off once you've done it — that's saved on this device.</p>
      </div>
      <div class="c-groups">${renderStudyGroups(studies)}</div>
    </main>`;

  wireStudyChecks(studies);
  wireMiniQuizzes(studies);
}

/* ---------- Career Path (staged, sequenced roadmap) ---------- */

const careerHeader = (active) => careerHeaderHtml(active);

// What the career pages share: the checkmark map, its dates, the pace, today, and everything computed from them.
const todayIso = () => new Date().toLocaleDateString('en-CA');
function careerState() {
  if (!applyLabBadgeMigration().ok) showSaveWarning();
  const done = studyDoneMap();
  const doneAt = doneDates();
  const { hoursPerWeek } = getSettings();
  const j = journey({ full: careerPath, milestones, gate, stages: expeditedStages, done, doneAt, hoursPerWeek, todayIso: todayIso() });
  const exams = examSummaries(); // every exam, from the generated index (no bank loaded)
  const exam = exams[DEFAULT_EXAM]; // the original exam badges stay Security+
  const labs = labsSummary();
  const kept = getBadges();
  const ctx = { done, doneAt, full: careerPath, extras, stages: expeditedStages, gate, j, exam, exams, labs, kept };
  let badges = achievements(ctx);
  const newlyEarned = badges.filter((b) => b.earned && !Object.hasOwn(kept, b.id));
  if (newlyEarned.length) {
    const earnedToday = todayIso();
    if (!recordBadges(Object.fromEntries(newlyEarned.map((b) => [b.id, b.date || earnedToday]))).ok) showSaveWarning();
    else badges = achievements({ ...ctx, kept: getBadges() });
  }
  return { done, doneAt, j, badges, exam, exams, labs };
}

// ---------- celebrations ----------
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function confetti() {
  if (reducedMotion()) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  const colors = ['#42d6a4', '#ffd166', '#5aa9ff', '#ff7aa2', '#c084fc', '#ffffff'];
  for (let i = 0; i < 70; i += 1) {
    const bit = document.createElement('i');
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = `${Math.random() * 0.35}s`;
    bit.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    bit.style.setProperty('--drift', `${(Math.random() - 0.5) * 220}px`);
    bit.style.setProperty('--spin', `${(Math.random() - 0.5) * 1080}deg`);
    layer.appendChild(bit);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3600);
}
function celebrate(newBadges) {
  if (!newBadges.length) return;
  let stack = document.getElementById('achievement-toasts');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'achievement-toasts';
    stack.className = 'achievement-toasts';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  newBadges.forEach((b, i) => {
    const toast = document.createElement('div');
    toast.className = `achievement-toast${b.phase ? ' big' : ''}`;
    toast.style.animationDelay = `${i * 0.25}s, ${4.6 + i * 0.25}s`; // one delay per animation: in, then out
    toast.innerHTML = `<span class="at-icon" aria-hidden="true">${b.icon}</span><span><small>${b.phase ? 'Phase complete' : 'Achievement unlocked'}</small><strong>${esc(b.name)}</strong></span>`;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 5200 + i * 250);
  });
  confetti();
}
// Run a change, then celebrate whatever it unlocked.
function withCelebration(change) {
  careerState(); // persist any badges already earned before this action
  const before = new Set(Object.keys(getBadges()));
  const result = change();
  const badges = careerState().badges;
  const kept = getBadges();
  const after = badges.filter((b) => b.earned && !before.has(b.id) && Object.hasOwn(kept, b.id));
  celebrate(after);
  return result;
}

/* ---------- Career Journey: where you are, where you are going, what you have unlocked ---------- */

const fmtDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
const fmtDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function ringSvg(pct, size = 132, stroke = 12) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<svg class="jr-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="jrGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#42d6a4"/><stop offset="1" stop-color="#78e8c0"/></linearGradient></defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#jrGrad)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

function rankEmblem(level) {
  return `<svg class="jr-emblem" viewBox="0 0 100 112" aria-hidden="true">
    <defs><linearGradient id="emb" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#f08a24"/></linearGradient></defs>
    <path d="M50 4 94 29v54L50 108 6 83V29Z" fill="rgba(255,209,102,.12)" stroke="url(#emb)" stroke-width="5"/>
    <path d="M50 20 80 37v38L50 92 20 75V37Z" fill="url(#emb)" opacity=".22"/>
    <text x="50" y="66" text-anchor="middle" font-size="34" font-weight="800" fill="#ffe6a6">${level}</text>
  </svg>`;
}

function milestoneFlag(m) {
  const status = m.reached ? '<span class="flag-when done">Reached ✓</span>'
    : m.onTheJob ? `<span class="flag-when">${esc(m.when)}</span>`
      : `<span class="flag-when">ETA ${fmtDate(m.etaIso)}${m.hoursLeft === 0 ? ' · deliverables left' : ` · ${m.hoursLeft}h to go`}</span>`;
  return `<div class="jr-flag${m.reached ? ' reached' : ''}${m.big ? ' big' : ''}"><span class="flag-icon" aria-hidden="true">${m.reached ? '🏆' : '🏁'}</span><div><strong>${esc(m.label)}</strong>${status}</div></div>`;
}

function trailNode(p, j) {
  const icons = { done: '✓', current: '★', ahead: String(p.n), lane: String(p.n), 'active-lane': String(p.n) };
  const label = p.state === 'done' ? 'Complete' : p.state === 'current' ? 'You are here' : p.lane ? 'Side quest · optional' : 'Ahead';
  const flags = j.milestones.filter((m) => m.after === p.n && !/optional/i.test(m.when)).map(milestoneFlag).join('') + j.milestones.filter((m) => m.after === p.n && /optional/i.test(m.when)).map(milestoneFlag).join('');
  return `
    <li class="jr-node ${p.state}${p.lane ? ' is-lane' : ''}" style="--p:${p.pct}">
      <a class="jr-dot" href="#/career-path/${p.n}" aria-label="Phase ${p.n}, ${esc(p.short)}: ${p.pct}% done, ${label}">${icons[p.state] || p.n}${p.state === 'current' ? '<span class="you">YOU</span>' : ''}</a>
      <a class="jr-card" href="#/career-path/${p.n}">
        <span class="jr-tag">Phase ${p.n} · ${label}</span>
        <strong>${esc(p.short)}</strong>
        <span class="jr-bar"><i style="width:${p.pct}%"></i></span>
        <span class="jr-meta">${p.done}/${p.total} done · ${p.hoursDone}/${p.hoursTotal} h · months ${esc(p.months)}</span>
      </a>
      ${flags ? `<div class="jr-flags">${flags}</div>` : ''}
    </li>`;
}

function showCareerJourney() {
  const { j, badges, exams, labs } = careerState();
  const earned = badges.filter((b) => b.earned);
  const nextBadges = badges.filter((b) => !b.earned).sort((a, b) => (b.have / b.need) - (a.have / a.need)).slice(0, 3);
  const r = j.rank;
  const days = Math.max(1, Math.round(j.hoursPerWeek / 7 * 10) / 10);
  const heat = heatmap(doneDates(), todayIso(), 12);
  const firstJob = j.milestones.find((m) => /first technical role/i.test(m.label));
  const nextCard = j.next ? `
      <section class="jr-next" aria-label="Next up">
        <div class="jr-next-tag">Next up · Phase ${j.next.phase}</div>
        <h2>${esc(j.next.name)}</h2>
        <p>${j.next.kind === 'link' ? `${esc(j.next.by)}${j.next.hours ? ` · about ${j.next.hours} h` : ''}` : 'Deliverable: something you can point at'}</p>
        <div class="jr-next-actions">
          ${j.next.url ? `<a class="jr-btn c-btn" href="${esc(j.next.url)}" target="_blank" rel="noopener noreferrer">Open it <span aria-hidden="true">↗</span></a>` : ''}
          <button type="button" class="jr-btn c-btn primary" data-journey-done="${esc(j.next.id)}">Mark done <span aria-hidden="true">✓</span></button>
          <a class="jr-btn c-btn ghost" href="#/career-path/${j.next.phase}">See the phase</a>
        </div>
      </section>` : `
      <section class="jr-next done"><h2>Every core phase is complete.</h2><p>You walked the whole road. Pick a side quest or go deeper in Phase 8.</p></section>`;

  app.innerHTML = `
    ${careerHeader('career-journey')}
    <main class="journey">
      <section class="jr-hero">
        <div class="jr-rank">
          ${rankEmblem(r.level)}
          <div>
            <div class="jr-kicker">Rank ${r.level} of 9</div>
            <h1 tabindex="-1">${esc(r.title)}</h1>
            ${r.next ? `<div class="jr-rankbar" role="img" aria-label="${r.pct}% of the way to ${esc(r.next.title)}"><i style="width:${Math.max(3, r.pct)}%"></i></div><p class="jr-sub">${r.toNext} study hours to <strong>${esc(r.next.title)}</strong></p>` : '<p class="jr-sub">Top rank reached.</p>'}
          </div>
        </div>
        <div class="jr-overall">
          ${ringSvg(j.pct)}
          <div class="jr-ring-label"><b>${j.pct}%</b><span>of the core path</span></div>
        </div>
        <div class="jr-stats">
          <div class="c-stat"><b>${j.allHoursDone}<small> h</small></b><span>studied</span></div>
          <div class="c-stat"><b>${j.streak}<small> ${j.streak === 1 ? 'day' : 'days'}</small></b><span>streak${j.bestStreak > j.streak ? ` · best ${j.bestStreak}` : ''}</span></div>
          <div class="c-stat"><b>${earned.length}<small>/${badges.length}</small></b><span>achievements</span></div>
          <div class="c-stat"><b>${fmtDate(j.finishIso)}</b><span>core path done at your pace</span></div>
        </div>
      </section>

      <section class="jr-pace">
        <label for="jr-hours">My pace</label>
        <input id="jr-hours" type="number" min="1" max="100" step="1" inputmode="numeric" value="${j.hoursPerWeek}" aria-describedby="jr-pace-help"> <span>hours a week</span>
        <span id="jr-pace-help" class="jr-pace-help">About ${days} h a day. ${j.weeksLeft} weeks of core study left${firstJob && !firstJob.reached ? `. First technical role: around <strong>${fmtDate(firstJob.etaIso)}</strong>` : ''}.</span>
      </section>

      <section class="jr-exam" aria-label="Exam readiness">
        <div class="jr-exam-tag">Exam readiness <a class="jr-exam-all" href="#/exam">All exams <span aria-hidden="true">→</span></a></div>
        <ul class="jr-exam-list">
          ${EXAMS.map((e) => {
    const x = exams[e.id];
    return `<li><a class="jr-exam-line${x.ready ? ' ready' : ''}" href="#/exam/${esc(e.id)}">
            <span class="jr-exam-name"><strong>${esc(e.blueprint.short)}</strong><small>${esc(e.blueprint.code)}</small></span>
            <b>${x.avg3 === null ? 'No mock yet' : `${x.avg3}%`}</b>
            <span class="jr-exam-bar" aria-hidden="true"><i style="width:${x.avg3 ?? 0}%"></i><em style="left:${x.target}%"></em></span>
            <small class="jr-exam-meta">${x.due} due · ${x.seen}/${x.total} seen</small>
            <span class="jr-exam-go" aria-hidden="true">→</span>
          </a></li>`;
  }).join('')}
        </ul>
        <small>Readiness is the average of your last 3 full mocks; ready = 3 in a row at ${exams[DEFAULT_EXAM].target}%+.</small>
      </section>

      <a class="jr-labs${labs.total && labs.passed === labs.total ? ' done' : ''}" href="#/labs">
        <div class="jr-labs-tag">Hands-on Labs · performance-based practice</div>
        <div class="jr-labs-row">
          <b>${labs.passed}<small> of ${labs.total}</small></b>
          <span>cases passed${labs.perfect ? ` · ${labs.perfect} perfect` : ''}</span>
          <span class="jr-labs-go">Open the labs <span aria-hidden="true">→</span></span>
        </div>
        <div class="jr-labs-chips">${labs.perLab.map((l) => `<span class="jr-lab-chip${l.total && l.passed === l.total ? ' done' : l.attempted ? ' going' : ''}" title="${esc(l.name)}"><i aria-hidden="true">${l.icon}</i><span class="visually-hidden">${esc(l.name)}:</span> ${l.passed}/${l.total}</span>`).join('')}</div>
      </a>

      ${nextCard}

      <section class="jr-map" aria-label="Your road">
        <h2 class="jr-h2 c-h2">Your road</h2>
        <ol class="jr-trail">
          ${j.phases.map((p) => trailNode(p, j)).join('')}
        </ol>
      </section>

      <section class="jr-exp" aria-label="Expedited track">
        <h2 class="jr-h2 c-h2">Expedited track <a href="./expedited.html">open <span aria-hidden="true">→</span></a></h2>
        <div class="jr-exp-row">
          ${j.expedited.map((st) => {
            const [tag, name] = st.title.split(' — ');
            const gateStop = /^Employment Gate/.test(tag);
            return `<div class="jr-chip${gateStop ? ' gate' : ''}${st.pct === 100 ? ' done' : st.pct > 0 ? ' going' : ''}" style="--p:${st.pct}%"><small>${esc(gateStop ? tag.replace('Employment ', '') : tag)}</small><span>${esc(name || tag)}</span><b>${st.pct === 100 ? '✓' : `${st.pct}%`}</b></div>`;
          }).join('')}
        </div>
      </section>

      <section class="jr-badges" aria-label="Achievements">
        <h2 class="jr-h2 c-h2">Achievements <span>${earned.length} of ${badges.length}</span></h2>
        ${nextBadges.length ? `<div class="jr-closest">${nextBadges.map((b) => `<div class="jr-close"><span aria-hidden="true">${b.icon}</span><div><strong>${esc(b.name)}</strong><small>${esc(b.how)}</small><span class="jr-bar"><i style="width:${Math.round((b.have / b.need) * 100)}%"></i></span></div><em>${b.have}/${b.need}</em></div>`).join('')}</div>` : ''}
        <ul class="jr-badge-grid">
          ${badges.map((b) => `<li class="jr-badge${b.earned ? ' earned' : ''}" title="${esc(b.how)}"><span class="jb-icon" aria-hidden="true">${b.earned ? b.icon : '🔒'}</span><strong>${esc(b.name)}</strong><small>${b.earned ? (b.date ? fmtDay(b.date) : 'Unlocked') : `${b.have}/${b.need}`}</small></li>`).join('')}
        </ul>
      </section>

      <section class="jr-heat" aria-label="Study days, last 12 weeks">
        <h2 class="jr-h2 c-h2">Last 12 weeks</h2>
        <div class="jr-heat-grid">
          ${heat.map((col) => `<div class="jr-heat-col">${col.map((d) => `<i class="h${d.future ? 'f' : Math.min(4, d.count)}" title="${d.iso}: ${d.count} ticked"></i>`).join('')}</div>`).join('')}
        </div>
        <p class="jr-sub">Each square is a day; brighter means more items ticked. Items ticked before today's update have no date, so they show in your totals but not here.</p>
      </section>
    </main>`;

  const hours = app.querySelector('#jr-hours');
  hours.addEventListener('change', () => {
    if (!setHoursPerWeek(hours.value).ok) showSaveWarning();
    showCareerJourney();
    const again = app.querySelector('#jr-hours');
    if (again) again.focus();
  });
  const doneBtn = app.querySelector('[data-journey-done]');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      withCelebration(() => { if (!setStudyDone(doneBtn.dataset.journeyDone, true).ok) showSaveWarning(); });
      showCareerJourney();
      const next = app.querySelector('[data-journey-done]');
      if (next) next.focus();
    });
  }
}

// Roadmap rail: overall %, "you are here" and every phase with its %. A side column at 1200px and wider, a block above
// the phases on smaller screens.
function roadRail(j) {
  return `
      <div class="rm-rail-card c-card">
        <div class="rm-overall">
          <div class="c-ring sm" style="--p:${j.pct}"><strong>${j.pct}%</strong><span>core path</span></div>
          <div class="rm-overall-meta">
            <b>${j.coreDone}/${j.coreItems}</b><span>core items done</span>
            <b>${j.coreHoursDone}/${j.coreHoursTotal} h</b><span>core study hours</span>
          </div>
        </div>
        ${j.current
    ? `<a class="rm-here" href="#/career-path/${j.current.n}"><span class="c-label">You are here · Phase ${j.current.n}</span><strong>${esc(j.current.short)}</strong></a>`
    : '<p class="rm-here"><span class="c-label">Every core phase is complete</span></p>'}
        <nav aria-label="Phases">
          <ol class="rm-toc">
            ${j.phases.map((p) => `<li><a href="#/career-path/${p.n}" class="${phaseCls(p)}"${j.current && j.current.n === p.n ? ' aria-current="step"' : ''}><span class="c-badge sm" aria-hidden="true">${p.state === 'done' ? '✓' : p.n}</span><span class="rm-toc-name">Phase ${p.n} · ${esc(p.short)}</span><span class="rm-toc-pct">${p.pct}%</span><span class="c-bar" aria-hidden="true"><i style="width:${p.pct}%"></i></span></a></li>`).join('')}
          </ol>
        </nav>
      </div>`;
}

function roadEnd(j) {
  return `
      <section class="rm-end c-card" aria-labelledby="rm-end-h">
        <div class="c-kicker">End of the roadmap</div>
        <h2 id="rm-end-h">${j.current ? `Your next step: Phase ${j.current.n}, ${esc(j.current.short)}` : 'You walked the whole road.'}</h2>
        <p>${j.current ? `${j.current.pct}% of Phase ${j.current.n} is done. The Progress page shows every phase, the milestones and the paid-cert gate in one view.` : 'Every core phase is complete. Pick a side quest, or go deeper in Phase 8.'}</p>
        <div class="c-actions">
          ${j.current ? `<a class="c-btn primary" href="#/career-path/${j.current.n}">Go to Phase ${j.current.n} <span aria-hidden="true">→</span></a>` : ''}
          <a class="c-btn" href="#/career-progress">See your progress</a>
          <a class="c-btn" href="#/career-journey">Open your Journey</a>
          <button type="button" class="c-btn ghost" data-top>Back to top <span aria-hidden="true">↑</span></button>
        </div>
      </section>`;
}

// Bring a phase into view and put focus on it (used by #/career-path/<n>, and by links to the phase already shown).
function showPhase(n) {
  const target = app.querySelector(`#phase-${CSS.escape(String(n))}`);
  if (target) { target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true }); }
}

function showCareerPath(phase) {
  const { j } = careerState();
  app.innerHTML = `
    ${careerHeader('career-path')}
    <main class="chapter-page c-page rm-page">
      <div class="c-intro">
        <div class="tier-tag c-kicker">Career Path</div>
        <h1 tabindex="-1">Operator to Engineer</h1>
        <p class="chapter-lead">Eight phases from zero cybersecurity background to a security-engineer title, designed by Codex from every resource researched, with your AI-agent skill as the operating layer of every phase. Every resource links to where it lives. Check off resources and deliverables as you go — the <a href="#/career-progress">Progress page</a> reads the same checkmarks.</p>
        <p class="chapter-lead"><strong>The one rule above everything:</strong> never outsource understanding. Every AI-generated artifact must be explainable line by line.</p>
      </div>
      <div class="rm-layout">
        <aside class="rm-rail" aria-label="Roadmap overview">${roadRail(j)}</aside>
        <div class="rm-phases">
          ${renderStudyGroups(careerPath, j)}
          ${roadEnd(j)}
        </div>
      </div>
    </main>`;

  app.querySelectorAll('.study-group[data-gi]').forEach((section) => {
    const g = careerPath[Number(section.dataset.gi)];
    if (g) { section.id = `phase-${g.n}`; section.tabIndex = -1; }
  });
  // after a tick: phase status, the "Next up" line and the rail follow the new checkmarks
  wireStudyChecks(careerPath, () => {
    const now = careerState().j;
    app.querySelectorAll('.study-group[data-gi]').forEach((section) => {
      const g = careerPath[Number(section.dataset.gi)];
      const ph = g && now.phases.find((p) => p.n === g.n);
      if (!ph) return;
      const [cls, label] = PHASE_STATUS[ph.state] || ['', ''];
      section.classList.remove('is-done', 'is-current', 'is-lane');
      if (phaseCls(ph)) section.classList.add(phaseCls(ph));
      const chip = section.querySelector('.study-status');
      if (chip) { chip.className = `c-chip study-status ${cls}`; chip.textContent = label; }
      const line = section.querySelector('.rm-next');
      const wants = now.next && now.next.phase === g.n;
      if (line && !wants) line.remove();
      if (wants) {
        const html = nextUpHtml(now.next);
        if (line) line.outerHTML = html;
        else section.querySelector('.c-card-body').insertAdjacentHTML('afterbegin', html);
      }
    });
    const rail = app.querySelector('.rm-rail');
    if (rail) rail.innerHTML = roadRail(now);
    const end = app.querySelector('.rm-end');
    if (end) { end.outerHTML = roadEnd(now); wireRoadEnd(); }
  });
  wireMiniQuizzes(careerPath);
  wireRoadEnd();
  if (phase) showPhase(phase);
}

function wireRoadEnd() {
  const top = app.querySelector('[data-top]');
  if (top) top.addEventListener('click', () => { scrollTo(0, 0); app.querySelector('main h1').focus({ preventScroll: true }); });
}

/* ---------- Career Path · Extra (optional, off-path side content) ---------- */

function showCareerExtra() {
  app.innerHTML = `
    ${careerHeader('career-extra')}
    <main class="chapter-page c-page">
      <div class="c-intro">
        <div class="tier-tag c-kicker">Career Path · Extra</div>
        <h1 tabindex="-1">Extra Curriculum</h1>
        <p class="chapter-lead">Side content only — none of this is part of the cybersecurity-engineer roadmap, none of it counts toward any phase, milestone, or the paid-cert gate. Do it only if you want a change of pace or the subject itself interests you.</p>
      </div>
      <div class="c-groups">${renderStudyGroups(extras)}</div>
    </main>`;

  wireStudyChecks(extras);
  wireMiniQuizzes(extras);
}

/* ---------- Career Path · Progress ---------- */

const LAST_EXPORT_KEY = 'codequest-pro-last-export';
function lastExportText() {
  let at = null;
  try { at = localStorage.getItem(LAST_EXPORT_KEY); } catch { /* storage unavailable */ }
  const when = at ? new Date(at) : null;
  if (!when || Number.isNaN(when.getTime())) return 'No backup exported from this browser yet.';
  const days = Math.floor((Date.now() - when.getTime()) / 86400000);
  return `Last backup exported ${days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`} (${when.toLocaleDateString()}).`;
}

function backupHtml(status) {
  return `
      <h2 class="prog-h2 c-h2" id="backup">Back up your progress</h2>
      <p class="chapter-lead">Every checkmark is saved only in this browser on this device. Clearing browser data or switching devices would lose it, so export a backup file now and then. Import it to bring everything back, here or on another device.</p>
      <div class="backup-row">
        <button type="button" class="backup-btn c-btn" data-backup="export">Export backup file</button>
        <label class="backup-btn c-btn">Import a backup file<input type="file" accept="application/json,.json" data-backup="import" class="visually-hidden"></label>
      </div>
      <label class="backup-mode"><input type="checkbox" data-backup="replace"> Replace everything here with the file (otherwise the file is added to what is already here)</label>
      <p class="backup-status" role="status" aria-live="polite">${esc(status || lastExportText())}</p>`;
}

function wireBackup() {
  const exportBtn = app.querySelector('[data-backup="export"]');
  const input = app.querySelector('[data-backup="import"]');
  const status = app.querySelector('.backup-status');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const now = new Date();
      const blob = new Blob([exportProgress(now)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `codequest-pro-progress-${now.toLocaleDateString('en-CA')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      try { localStorage.setItem(LAST_EXPORT_KEY, now.toISOString()); } catch { /* storage unavailable */ }
      status.textContent = `Backup file saved (${a.download}). Keep it somewhere safe, like your Google Drive.`;
    });
  }
  if (input) {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const replace = app.querySelector('[data-backup="replace"]').checked;
      const result = importProgress(await file.text(), replace ? 'replace' : 'merge');
      showCareerProgress(result.ok ? `Imported. ${result.items} checkmarks are saved here now.` : result.error);
      const again = app.querySelector('.backup-status');
      if (again) again.focus();
    });
  }
}

const LOCK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="7" width="10" height="7.5" rx="2" fill="currentColor"/></svg>';
const SEAL_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.4 6.5 11.6 12.8 4.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function showCareerProgress(backupStatus) {
  const doneMap = studyDoneMap();
  const stats = careerPath.map((p) => ({ p, ...groupStats(p, doneMap) }));
  const totalItems = stats.reduce((s, x) => s + x.total, 0);
  const doneItems = stats.reduce((s, x) => s + x.done, 0);
  const hoursTotal = stats.reduce((s, x) => s + x.hoursTotal, 0);
  const hoursDone = stats.reduce((s, x) => s + x.hoursDone, 0);
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  // pace, weeks left and "you are here" come from the Journey: the core route at his saved hours a week
  const { j } = careerState();
  const current = j.current ? stats.find((x) => x.p.n === j.current.n) : null;
  const etaFor = new Map(j.milestones.map((m) => [m.label, m]));
  const complete = (n) => stats.find((x) => x.p.n === n)?.pct === 100;
  const shortTitle = (p) => p.title.replace(/^Phase \d+ — /, '');

  const phaseRows = stats
    .map((x) => {
      const here = current && current.p.n === x.p.n;
      const cls = x.pct === 100 ? 'is-done' : here ? 'is-current' : x.p.lane ? 'is-lane' : '';
      return `
      <a class="prog-row${x.p.lane ? ' lane' : ''}${here ? ' current' : ''}${x.pct === 100 ? ' complete' : ''}" href="#/career-path/${x.p.n}">
        <div class="prog-n c-badge ${cls}" aria-hidden="true">${x.pct === 100 ? '✓' : x.p.n}</div>
        <div class="prog-body">
          <div class="prog-title"><span class="visually-hidden">Phase ${x.p.n}: </span>${esc(shortTitle(x.p))}${x.p.lane ? ' <span class="c-chip is-lane study-lane">income lane</span>' : ''}${here ? ' <span class="c-chip is-current prog-here">You are here</span>' : ''}</div>
          <div class="prog-meta">months ${esc(x.p.months)} · ${x.done}/${x.total} done · ${x.hoursDone}/${x.hoursTotal} study hrs</div>
          <div class="prog-bar c-bar round" aria-hidden="true"><i class="prog-fill" style="width:${x.pct}%"></i></div>
        </div>
        <div class="prog-pct">${x.pct}%</div>
      </a>`;
    })
    .join('');

  const milestoneRows = milestones
    .map((m) => {
      const reached = m.requires.every(complete);
      const eta = !reached && etaFor.get(m.label)?.etaIso ? ` · your pace: ${fmtDate(etaFor.get(m.label).etaIso)}` : '';
      return `
      <div class="ms-row${reached ? ' reached' : ''}${m.big ? ' big' : ''}">
        <span class="c-seal${reached ? ' is-done' : ''}">${reached ? SEAL_SVG : LOCK_SVG}</span>
        <div class="ms-body">
          <div class="ms-when">${esc(m.when)}${eta}</div>
          <div class="ms-label">${esc(m.label)}<span class="visually-hidden">${reached ? ' (reached)' : ' (not reached yet)'}</span></div>
          <div class="ms-ev">${esc(m.evidence)}</div>
          <div class="c-chips ms-req"><span class="visually-hidden">Needs:</span>
            ${m.requires.map((n) => `<span class="c-chip${complete(n) ? ' is-done' : ''}">Phase ${n}${complete(n) ? ' <span aria-hidden="true">✓</span><span class="visually-hidden">complete</span>' : ''}</span>`).join('')}
          </div>
        </div>
      </div>`;
    })
    .join('');

  const gateDone = gate.conditions.filter((c) => doneMap[gateKey(c)] === true).length;
  const gateOpen = gateDone === gate.conditions.length;
  const gateRows = gate.conditions
    .map((c) => {
      const k = gateKey(c);
      const done = doneMap[k] === true;
      return `
      <div class="study-card output${done ? ' done' : ''}">
        <button type="button" class="study-check c-check" data-key="${esc(k)}" aria-pressed="${done}" aria-label="Mark gate condition ${esc(c.name)} as met">${done ? '✓' : ''}</button>
        <div class="study-link study-static"><div class="study-name">${esc(c.name)}</div></div>
      </div>`;
    })
    .join('');

  const firstPhase = careerPath[0];
  const empty = doneItems === 0 ? `
      <section class="prog-empty c-panel is-current" aria-labelledby="prog-empty-h">
        <div>
          <div class="c-kicker">Nothing ticked yet</div>
          <h2 id="prog-empty-h">Start with Phase ${firstPhase.n}: ${esc(shortTitle(firstPhase))}</h2>
          <p>Tick a resource on the roadmap when you finish it, and this page fills in: phases, milestones and your finish date.</p>
        </div>
        <div class="c-actions"><a class="c-btn primary" href="#/career-path/${firstPhase.n}">Start Phase ${firstPhase.n} <span aria-hidden="true">→</span></a><a class="c-btn" href="#/career-journey">Open your Journey</a></div>
      </section>` : '';

  app.innerHTML = `
    ${careerHeader('career-progress')}
    <main class="chapter-page c-page prog-page">
      <div class="c-intro">
        <div class="tier-tag c-kicker">Career Path · Progress</div>
        <h1 tabindex="-1">Where you are</h1>
        <p class="chapter-lead">Computed from the same checkmarks as the <a href="#/career-path">roadmap</a>. Saved on this device only.</p>
      </div>
      ${empty}
      <section class="prog-overall c-stats" aria-label="Totals">
        <div class="prog-big c-stat is-total">
          <b>${pct}%</b><span>${doneItems} of ${totalItems} items done</span>
        </div>
        <div class="prog-big c-stat">
          <b>${hoursDone}<small>/${hoursTotal}</small></b><span>study hours done</span>
        </div>
        <div class="prog-big c-stat">
          <b>${j.weeksLeft}<small> wks</small></b><span>core route left at ${j.hoursPerWeek} h/week · <a href="#/career-journey">change pace</a></span>
        </div>
        <div class="prog-big c-stat${current ? ' is-current' : ''}">
          <b>${current ? `Phase ${current.p.n}` : 'Done'}</b><span>${current ? `You are here: ${esc(shortTitle(current.p))}` : 'every phase complete'}</span>
        </div>
      </section>
      <div class="prog-bar big c-bar round" aria-hidden="true"><i class="prog-fill" style="width:${pct}%"></i></div>

      <div class="prog-cols">
        <section aria-labelledby="prog-phases-h">
          <h2 class="prog-h2 c-h2" id="prog-phases-h">Phases</h2>
          <div class="prog-list">${phaseRows}</div>
        </section>
        <section aria-labelledby="prog-ms-h">
          <h2 class="prog-h2 c-h2" id="prog-ms-h">Milestones <span class="study-group-progress">plan windows at 14 h/week · dates at your ${j.hoursPerWeek} h/week</span></h2>
          <div class="ms-list">${milestoneRows}</div>
        </section>
      </div>

      <h2 class="prog-h2 c-h2">Paid-cert gate <span class="study-group-progress">${gateDone}/${gate.conditions.length} conditions · ${gateOpen ? 'OPEN' : 'closed'}</span></h2>
      <p class="chapter-lead">Nothing paid until all four are true. Tick them yourself — none can be read from study progress.</p>
      <div class="gate-card c-card${gateOpen ? ' is-done' : ''}">
        <div class="study-list study-outputs">${gateRows}</div>
        <div class="gate-panel c-panel${gateOpen ? ' open is-done' : ''}">
          <div class="gate-first">First paid cert: <a href="${esc(gate.firstUrl)}" target="_blank" rel="noopener noreferrer">${esc(gate.first)} <span aria-hidden="true">↗</span></a></div>
          <p class="study-note">${esc(gate.why)}</p>
          <p class="study-note"><strong>Buy it when the portfolio is complete and any one of these is true:</strong></p>
          <ul class="gate-ul">${gate.triggers.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <p class="study-note"><strong>Possible second cert — one only, by the branch you're actually on:</strong></p>
          <ul class="gate-ul">${gate.second.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} <span aria-hidden="true">↗</span></a> <span class="study-by">${esc(s.by)}</span> — ${esc(s.note)}</li>`).join('')}</ul>
          <p class="study-note"><strong>Ratings Codex overruled:</strong></p>
          <ul class="gate-ul">${gate.overruled.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
        </div>
      </div>
      ${backupHtml(backupStatus)}
    </main>`;

  app.querySelectorAll('.study-check').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (!withCelebration(() => toggleStudyDone(key)).ok) showSaveWarning();
      showCareerProgress();
      refocus(key);
    });
  });
  wireBackup();
}

/* ---------- Beginner tier ---------- */

function showBeginnerList() {
  const body = `
    <main class="chapter-page" style="--hue:150">
      <h1 class="visually-hidden">Beginner lessons</h1>
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
      <h1 class="visually-hidden">${unitWord === 'Ch' ? 'Intermediate' : 'Expert'} chapters</h1>
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

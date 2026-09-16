// Computer Quest lesson screens. One idea per card; every saved change goes through lesson-logic + the hub's save.
import { checkParentPin, hasParentPin, load } from '../progress.js';
import { GEMS, LEGENDARY_CHOICES, RARITY } from './items.js';
import { chooseLegendary, equip, getCosmetic, getItem, packComplete } from './character.js';
import {
  addActiveMs, completePractice, emptyLessonState, lessonStatus, missionStepDone, normalizeLessons, openChest,
  quizQuestionsToAsk, recordParentCheck, recordQuizAttempt, recordSpotIt, recordWarmup, setPosition, setWindows,
  startLesson, tickMission,
} from './lesson-logic.js';
import { getLesson } from './lessons/pack1.js';
import { drawIcon } from './sprite.js';
import {
  esc, lessonText, PHASES, phaseLabel, plainText, shuffled, shuffledChoices, todayYmd, visibleOptions,
  windowsFromPlatformVersion, windowsLines,
} from './lesson-view.js';

const TIMED_PHASES = ['warmup', 'learn', 'mission', 'quiz', 'parent'];
const TICK_MS = 5000;
const PARENT_KINDS = ['parent', 'parent-nopin', 'parent-pin', 'parent-checks', 'not-yet'];

// Windows auto-detect runs once per page load and is only ever a hint next to the Windows 10/11 buttons.
let detectedWindows = null;
let detectionStarted = false;
let onDetected = null;
function detectWindows() {
  if (detectionStarted) return;
  const data = typeof navigator !== 'undefined' ? navigator.userAgentData : null;
  if (!data || typeof data.getHighEntropyValues !== 'function') return;
  detectionStarted = true;
  try {
    data.getHighEntropyValues(['platformVersion']).then((values) => {
      if (!values || values.platform !== 'Windows') return;
      detectedWindows = windowsFromPlatformVersion(values.platformVersion);
      if (detectedWindows && onDetected) onDetected();
    }).catch(() => { /* Hint only. */ });
  } catch { /* Hint only. */ }
}

function drawChest(canvas, open) {
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) return;
  const u = canvas.width / 16;
  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x * u, y * u, w * u, h * u); };
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (open) {
    px(4, 0, 8, 1, '#fff1b8'); px(2, 1, 1, 1, '#fff1b8'); px(13, 1, 1, 1, '#fff1b8');
    px(1, 2, 14, 3, '#a0692f'); px(1, 2, 14, 1, '#c28a45'); px(3, 2, 2, 3, '#f2b631'); px(11, 2, 2, 3, '#f2b631');
    px(1, 5, 14, 2, '#3a2410'); px(3, 6, 10, 1, '#ffd76a'); px(6, 5, 4, 1, '#fff1b8');
  } else {
    px(2, 2, 12, 1, '#c28a45'); px(1, 3, 14, 4, '#a0692f'); px(1, 6, 14, 1, '#5e3a1a');
    px(3, 2, 2, 5, '#f2b631'); px(11, 2, 2, 5, '#f2b631');
  }
  px(1, 7, 14, 6, '#8a5a2b'); px(14, 7, 1, 6, '#6b4422'); px(1, 12, 14, 1, '#5e3a1a');
  px(3, 7, 2, 6, '#f2b631'); px(11, 7, 2, 6, '#f2b631'); px(3, 12, 2, 1, '#b8862a'); px(11, 12, 2, 1, '#b8862a');
  px(6, 6, 4, 3, '#ffd76a'); px(7, 7, 2, 1, '#3a2410'); px(1, 13, 14, 1, '#0c2034');
}

export function mountLesson({ app, route: startRoute, lessonId, nickname, getCq, save, sound, onExit }) {
  const lesson = getLesson(lessonId);
  const root = document.createElement('div');
  root.className = 'cq-lesson';
  const view = document.createElement('div');
  view.className = 'cq-lesson-view';
  const live = document.createElement('p');
  live.className = 'cq-status';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  root.append(view, live);
  app.innerHTML = '';
  app.append(root);

  let route = startRoute === 'practice' ? 'practice' : 'lesson';
  let screen = null;
  let mounted = true;
  let pinBusy = false;
  let pinTimer = 0;
  let tickTimer = 0;
  let lastTick = null;

  const cqNow = () => getCq();
  const stateNow = () => (lesson && normalizeLessons(cqNow().lessons)[lesson.id]) || emptyLessonState();
  const nowIso = () => new Date().toISOString();
  const play = (name) => { try { sound(name); } catch { /* Audio is optional. */ } };
  const announce = (text) => { live.textContent = text; };
  const text = (value) => lessonText(value, nickname);
  const position = (list) => Math.min(Math.max(0, stateNow().index), list.length - 1);

  // ---------- saving + active time ----------
  function flushActive() {
    if (!mounted || !lesson || route !== 'lesson' || lastTick === null) return;
    const now = Date.now();
    const ms = now - lastTick;
    lastTick = now;
    if (ms <= 0 || !TIMED_PHASES.includes(stateNow().phase)) return;
    try { save((cq) => addActiveMs(cq, lesson.id, ms)); } catch { /* Time tracking is best-effort. */ }
  }
  function commit(change) {
    flushActive();
    try {
      save(change);
      return true;
    } catch {
      announce('Could not save that. Please try again.');
      return false;
    }
  }
  function startTicking() {
    clearInterval(tickTimer);
    lastTick = document.hidden ? null : Date.now();
    tickTimer = setInterval(flushActive, TICK_MS);
  }
  function stopTicking() {
    flushActive();
    lastTick = null;
    clearInterval(tickTimer);
    tickTimer = 0;
  }
  function clearPinTimer() {
    clearInterval(pinTimer);
    pinTimer = 0;
  }

  // ---------- screen construction ----------
  const warmupScreen = (i, answers) => ({ kind: 'warmup', i, answers, order: shuffledChoices(lesson.warmup[i].choices), picked: null });
  function quizScreen() {
    const asks = quizQuestionsToAsk(cqNow(), lesson);
    return {
      kind: 'quiz', attempt: stateNow().quizAttempts.length + 1, pos: 0, answers: [], selected: null,
      questions: shuffled(asks).map((entry) => ({ q: entry.value, order: shuffledChoices(lesson.quiz[entry.value].choices) })),
    };
  }
  const chestScreen = () => ({ kind: 'chest', pos: 0, firstTry: [], order: shuffledChoices(lesson.chest[0].choices), wrong: [], hint: '', wobble: false });
  const legendaryPending = () => { const cq = cqNow(); return packComplete(cq) && !cq.legendaryChoice; };

  function screenFromState() {
    const state = stateNow();
    switch (state.phase) {
      case 'warmup':
        if (!state.warmup.length) return warmupScreen(0, []);
        return commit((cq) => setPosition(cq, lesson.id, 'learn', 0)) ? { kind: 'learn' } : { kind: 'blocked', message: 'Could not open this lesson. Please try again.' };
      case 'learn': return { kind: 'learn' };
      case 'mission': return { kind: 'mission' };
      case 'quiz': return quizScreen();
      case 'parent': return state.parent.at ? { kind: 'not-yet' } : { kind: 'parent' };
      case 'key': return { kind: 'key' };
      case 'chest': return chestScreen();
      default: return legendaryPending() ? { kind: 'legendary', choice: null } : { kind: 'complete' };
    }
  }
  function openScreen() {
    const cq = cqNow();
    if (!lesson || lesson.track !== cq.track) return { kind: 'blocked', message: 'This lesson is not part of your quest line.' };
    const status = lessonStatus(cq, lesson);
    if (status === 'locked') return { kind: 'blocked', message: `🔒 Pass Lesson ${lesson.number - 1} first.` };
    if (route === 'practice' && (status === 'passed' || status === 'done' || status === 'not-yet')) return { kind: 'practice', result: null };
    route = 'lesson';
    if (status === 'ready' && !commit((state) => startLesson(state, lesson, nowIso()))) {
      return { kind: 'blocked', message: 'Could not start this lesson. Please try again.' };
    }
    return screenFromState();
  }

  // ---------- markup ----------
  const btn = (action, label, attrs = '', cls = '') => `<button type="button" class="cq-button ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
  const heading = (html, eyebrow, attrs = '') => `<span class="cq-eyebrow">${esc(eyebrow)}</span><h2 id="cq-lesson-heading" tabindex="-1" ${attrs}>${html}</h2>`;
  const iconSpan = (id, size) => `<span class="cq-icon" data-icon="${esc(id)}" data-size="${size}" aria-hidden="true"></span>`;
  const rarityStyle = (rarity) => `style="--rarity:${esc(RARITY[rarity] || RARITY.common)}"`;

  function choiceButtons(order, { action, picked = null, answer = null, wrong = [], selected = null, pressable = false }) {
    return `<div class="cq-choices" role="group" aria-label="Answers">${order.map((entry, pos) => {
      let state = '';
      if (picked !== null) state = entry.index === answer ? ' cq-right' : entry.index === picked ? ' cq-wrong' : '';
      else if (wrong.includes(entry.index)) state = ' cq-wrong';
      const off = picked !== null || wrong.includes(entry.index);
      return `<button type="button" class="cq-choice${state}" data-action="${action}" data-value="${entry.index}" data-key="${pos + 1}"${pressable ? ` aria-pressed="${selected === entry.index}"` : ''}${off ? ' disabled' : ''}><span class="cq-key" aria-hidden="true">${pos + 1}</span><span>${text(entry.value)}</span></button>`;
    }).join('')}</div>`;
  }

  function phaseOfScreen() {
    const kind = screen.kind;
    if (kind === 'warmup' || kind === 'learn' || kind === 'mission' || kind === 'key' || kind === 'chest') return kind;
    if (kind === 'quiz' || kind === 'quiz-results') return 'quiz';
    if (PARENT_KINDS.includes(kind)) return 'parent';
    if (kind === 'practice' || kind === 'blocked') return stateNow().phase;
    return 'done';
  }
  function topBar() {
    const back = '<button type="button" class="cq-map" data-action="exit">← Quests</button>';
    if (!lesson) return `<header class="cq-top cq-lesson-top">${back}</header>`;
    const phase = phaseOfScreen();
    const done = phase === 'done';
    const current = PHASES.indexOf(phase);
    const where = done ? 'every step done' : `step ${current + 1} of ${PHASES.length}, ${phaseLabel(phase)}`;
    return `<header class="cq-top cq-lesson-top">${back}<div class="cq-identity"><span class="cq-eyebrow">LESSON ${esc(lesson.id.toUpperCase())}</span><h1>${esc(lesson.title)}</h1></div>
      <ol class="cq-dots" aria-label="Lesson progress: ${esc(where)}">${PHASES.map((name, i) => {
        const cls = done || i < current ? 'cq-dot-done' : i === current ? 'cq-dot-now' : '';
        return `<li class="${cls}"${i === current && !done ? ' aria-current="step"' : ''}><span class="cq-dot" aria-hidden="true"></span><span class="cq-dot-label">${phaseLabel(name)}</span></li>`;
      }).join('')}</ol></header>`;
  }

  const bodies = {
    blocked: () => `${heading(esc(screen.message), 'COMPUTER QUEST')}<div class="cq-actions">${btn('exit', 'Back to Quests', '', 'cq-primary')}</div>`,

    warmup: () => {
      const q = lesson.warmup[screen.i];
      const last = screen.i === lesson.warmup.length - 1;
      const right = screen.picked === q.answer;
      const feedback = screen.picked === null ? ''
        : `<p class="cq-feedback ${right ? 'cq-good' : 'cq-miss'}">${right ? '✅ Yes!' : '❌ Not quite.'} The answer is: <strong>${text(q.choices[q.answer])}</strong></p>`;
      return `${heading(text(q.q), `${lesson.number === 1 ? 'STARTING CHECK' : 'WARM-UP'} · ${screen.i + 1} OF ${lesson.warmup.length}`)}
        <p class="cq-muted">Pick one. This is just a warm-up.</p>
        ${choiceButtons(screen.order, { action: 'warm-pick', picked: screen.picked, answer: q.answer })}${feedback}
        <div class="cq-actions">${btn('warm-next', last ? 'Start learning ▶' : 'Next ▶', screen.picked === null ? 'disabled' : '', 'cq-primary')}</div>`;
    },

    learn: () => {
      const index = position(lesson.learn);
      const card = lesson.learn[index];
      const list = card.list ? `<ul class="cq-list">${card.list.map((item) => `<li>${text(item)}</li>`).join('')}</ul>` : '';
      const win = windowsLines(card.win, cqNow().windows).map((line) => `<p class="cq-win">${line.label ? `<span class="cq-win-label">${esc(line.label)}</span> ` : ''}${text(line.text)}</p>`).join('');
      const last = index === lesson.learn.length - 1;
      return `${heading(text(card.text), `LEARN · ${index + 1} OF ${lesson.learn.length}`)}${list}${win}
        <div class="cq-actions">${index > 0 ? btn('learn-back', '◀ Back') : ''}${btn('learn-next', last ? 'Start the mission ▶' : 'Next ▶', '', 'cq-primary')}</div>`;
    },

    mission: () => {
      const cq = cqNow();
      const index = position(lesson.mission);
      const step = lesson.mission[index];
      const done = missionStepDone(cq, lesson, index);
      const last = index === lesson.mission.length - 1;
      const banner = step.grownup ? '<p class="cq-grownup" id="cq-grownup">🛑 Get a grown-up for this step</p>' : '';
      const options = step.options ? `<ul class="cq-list cq-option-list">${visibleOptions(step.options, cq.windows)
        .map((option) => `<li>${option.label ? `<span class="cq-win-label">${esc(option.label)}</span> ` : ''}${text(option.text)}</li>`).join('')}</ul>` : '';
      let middle;
      if (step.kind === 'windowsCheck') middle = windowsPicker(cq);
      else if (step.kind === 'spotIt') middle = spotIt(index, step);
      else middle = `<button type="button" class="cq-done-toggle" data-action="tick" aria-pressed="${done}">${done ? '✓ Done! <small>Tap to undo</small>' : 'I did it ✓'}</button>`;
      return `${banner}${heading(text(step.text), `MISSION · STEP ${index + 1} OF ${lesson.mission.length}`, step.grownup ? 'aria-describedby="cq-grownup"' : '')}${options}${middle}
        <div class="cq-actions">${index > 0 ? btn('mission-back', '◀ Back') : ''}${btn('mission-next', last ? 'On to the quiz ▶' : 'Next ▶', done ? '' : 'disabled', 'cq-primary')}</div>
        ${done ? '' : '<p class="cq-muted cq-hint">Finish this step to unlock Next.</p>'}`;
    },

    quiz: () => {
      const item = screen.questions[screen.pos];
      const last = screen.pos === screen.questions.length - 1;
      return `${heading(text(lesson.quiz[item.q].q), `${screen.attempt > 1 ? 'FIX-UP ROUND' : 'QUIZ'} · QUESTION ${screen.pos + 1} OF ${screen.questions.length}`)}
        ${choiceButtons(item.order, { action: 'quiz-pick', selected: screen.selected, pressable: true })}
        <div class="cq-actions">${btn('quiz-next', last ? 'Check my answers ▶' : 'Next ▶', screen.selected === null ? 'disabled' : '', 'cq-primary')}</div>`;
    },

    'quiz-results': () => {
      const solved = lesson.quiz.length - quizQuestionsToAsk(cqNow(), lesson).length;
      const rows = screen.answers.map((answer) => {
        const q = lesson.quiz[answer.q];
        const right = answer.choice === q.answer;
        return `<li class="cq-result ${right ? 'cq-good' : 'cq-miss'}"><span class="cq-result-mark">${right ? '✅ <span class="cq-sr">Right:</span>' : '❌ <span class="cq-sr">Missed:</span>'}</span><span>${text(q.q)}${right ? '' : `<small class="cq-why">${text(q.why)}</small>`}</span></li>`;
      }).join('');
      return `${heading(screen.passed ? '🎉 Quiz passed!' : 'Let’s fix the ones you missed', `QUIZ · ${solved} OF ${lesson.quiz.length} SOLVED`)}
        <p>${screen.passed ? 'Great thinking. Next, show a grown-up what you can do.' : `You have ${solved}. You need ${lesson.passScore}. Read the tips, then try those questions again.`}</p>
        <ul class="cq-results">${rows}</ul>
        <div class="cq-actions">${screen.passed ? btn('to-parent', 'Call a grown-up ▶', '', 'cq-primary') : btn('quiz-retry', 'Try the missed ones ▶', '', 'cq-primary')}</div>`;
    },

    parent: () => `${heading('Great work! Call a grown-up to check your real computer task.', 'GROWN-UP CHECK')}
      <p>Your grown-up will watch you do the mission on the real computer.</p>
      <div class="cq-actions">${btn('grownup', 'I’m the grown-up', '', 'cq-primary')}</div>`,

    'parent-nopin': () => `${heading('A grown-up needs to set a PIN first', 'GROWN-UP CHECK')}
      <p>Grown-ups: go to the map, tap <strong>for grown-ups</strong> at the bottom, and set a PIN. Then come back to this lesson.</p>
      <div class="cq-actions">${btn('parent-back', '◀ Back')}<a class="cq-button cq-primary" href="index.html">Go to the map</a></div>`,

    'parent-pin': () => `${heading('Grown-ups only', 'GROWN-UP CHECK')}
      <form class="cq-pin-form"><label for="cq-pin">Enter the grown-up PIN</label>
        <div class="cq-pin-row"><input id="cq-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" />
        <button type="submit" class="cq-button cq-primary">Unlock</button></div></form>
      <p class="cq-pin-message" aria-live="polite"></p>
      <div class="cq-actions">${btn('parent-back', '◀ Back')}</div>`,

    'parent-checks': () => {
      const state = stateNow();
      return `${heading(`Grown-up check: ${esc(lesson.title)}`, 'FOR THE GROWN-UP')}
        <p>Watch the real computer task. Tick only what you saw done.</p>
        ${lesson.parentWatch ? `<p class="cq-watch"><strong>Watch for:</strong> ${text(lesson.parentWatch)}</p>` : ''}
        <fieldset class="cq-checklist"><legend>Real computer tasks</legend>${lesson.parentChecks.map((check, i) => `<label class="cq-check"><input type="checkbox" data-check="${i}" /><span>${text(check)}</span></label>`).join('')}</fieldset>
        <label class="cq-note-label" for="cq-note">Note for the report (optional)</label>
        <textarea id="cq-note" maxlength="500" rows="3">${esc(state.parent.note)}</textarea>
        <div class="cq-actions">${btn('save-check', 'Save check', '', 'cq-primary')}</div>`;
    },

    'not-yet': () => {
      const state = stateNow();
      const missing = lesson.parentChecks.filter((_, i) => !state.parent.checks[i]);
      return `${heading('Almost! Practice this part and call your grown-up again:', 'ALMOST THERE')}
        <ul class="cq-list">${missing.map((check) => `<li>${text(check)}</li>`).join('')}</ul>
        <div class="cq-actions"><a class="cq-button" href="#practice/${esc(lesson.id)}">Practice Mission ▶</a>${btn('grownup', 'I’m the grown-up', '', 'cq-primary')}</div>`;
    },

    key: () => `<p class="cq-key-art" aria-hidden="true">🗝️</p>${heading('🗝️ You earned a key!', 'KEY')}
      <p>Your grown-up checked your real computer task. This key opens the lesson’s treasure chest.</p>
      <div class="cq-actions">${btn('key-continue', 'Continue ▶', '', 'cq-primary')}</div>`,

    chest: () => {
      const q = lesson.chest[screen.pos];
      return `<div class="cq-chest-wrap${screen.wobble ? ' cq-wobble' : ''}"><canvas class="cq-chest-art" data-chest="closed" width="128" height="112" role="img" aria-label="Locked treasure chest"></canvas></div>
        ${heading(text(q.q), `CHEST QUESTION ${screen.pos + 1} OF ${lesson.chest.length}`)}
        ${choiceButtons(screen.order, { action: 'chest-pick', wrong: screen.wrong })}
        ${screen.hint ? `<p class="cq-feedback cq-miss">🔒 Not that one. ${screen.hint}</p>` : '<p class="cq-muted">Answer to open the chest.</p>'}`;
    },

    loot: () => {
      const cq = cqNow();
      const loot = screen.loot;
      const steps = lootSteps(loot);
      const step = steps[screen.step];
      const last = screen.step === steps.length - 1;
      const item = getItem(loot.item);
      let body = '';
      if (step === 'item') {
        body = `${heading(`You found the ${esc(item.name)}!`, `TREASURE · ${screen.step + 1} OF ${steps.length}`)}
          <div class="cq-loot-card" ${rarityStyle(item.rarity)}>${iconSpan(item.id, 96)}<span class="cq-rarity">${esc(item.rarity)}</span><p>${esc(item.flavor)}</p><p class="cq-effect">${esc(item.effect)}</p></div>`;
      } else if (step === 'titles') {
        body = `${heading(loot.titles.length > 1 ? 'New titles!' : 'New title!', `TREASURE · ${screen.step + 1} OF ${steps.length}`)}
          <ul class="cq-loot-list">${loot.titles.map((id) => { const title = getCosmetic(id); return title ? `<li class="cq-loot-card" ${rarityStyle(title.rarity)}>${iconSpan(id, 56)}<strong>${esc(title.name)}</strong></li>` : ''; }).join('')}</ul>
          <p class="cq-muted">Wear a title from the Wardrobe.</p>`;
      } else if (step === 'cosmetic') {
        const bonus = getCosmetic(loot.cosmetic);
        body = bonus
          ? `${heading(`Bonus look: ${esc(bonus.name)}!`, `TREASURE · ${screen.step + 1} OF ${steps.length}`)}<div class="cq-loot-card" ${rarityStyle(bonus.rarity)}>${iconSpan(bonus.id, 96)}<span class="cq-rarity">${esc(bonus.rarity)}</span><p class="cq-muted">Wear it from the Wardrobe.</p></div>`
          : `${heading(`+${GEMS.duplicate} 💎 bonus`, `TREASURE · ${screen.step + 1} OF ${steps.length}`)}<p>You already own every chest look, so you get gems instead.</p>`;
      } else {
        body = `${heading(`+${loot.gems} 💎`, `TREASURE · ${screen.step + 1} OF ${steps.length}`)}<p>You now have <strong>${cq.gems} 💎</strong>. Spend them at the Trader.</p>`;
      }
      const equipped = item && Object.values(cq.equipped).includes(item.id);
      const actions = !last ? btn('loot-next', 'Next ▶', '', 'cq-primary')
        : `${item && !equipped ? btn('equip-loot', 'Equip it now') : item ? `<span class="cq-feedback cq-good">✓ ${esc(item.name)} equipped</span>` : ''}${legendaryPending() ? btn('to-legendary', 'Choose your legendary reward ▶', '', 'cq-primary') : btn('exit', 'Back to Quests', '', 'cq-primary')}`;
      return `<div class="cq-chest-wrap"><canvas class="cq-chest-art" data-chest="open" width="128" height="112" role="img" aria-label="Open treasure chest"></canvas></div>${body}<div class="cq-actions">${actions}</div>`;
    },

    legendary: () => `${heading('Pack 1 complete! Choose your legendary reward', 'LEGENDARY CHOICE')}
      <p>Pick one. The other two stay locked for future packs.</p>
      <div class="cq-legendary" role="group" aria-label="Legendary rewards">${LEGENDARY_CHOICES.map((id, i) => {
        const reward = getCosmetic(id);
        return `<button type="button" class="cq-legend-card" data-action="legend-pick" data-value="${esc(id)}" data-key="${i + 1}" aria-pressed="${screen.choice === id}" ${rarityStyle('legendary')}>${iconSpan(id, 96)}<strong>${esc(reward.name)}</strong><span class="cq-rarity">legendary</span></button>`;
      }).join('')}</div>
      <div class="cq-actions">${btn('legend-confirm', screen.choice ? `Choose ${esc(getCosmetic(screen.choice).name)} ▶` : 'Pick one first', screen.choice ? '' : 'disabled', 'cq-primary')}</div>`,

    champion: () => {
      const reward = getCosmetic(screen.choice);
      return `<div class="cq-loot-card" ${rarityStyle('legendary')}>${iconSpan(screen.choice, 96)}</div>${heading('🏆 Pack 1 Champion!', 'PACK 1 COMPLETE')}
        <p>You earned the <strong>${esc(reward ? reward.name : '')}</strong> and the <strong>Pack 1 Champion</strong> title. Wear them from the Wardrobe.</p>
        <div class="cq-actions">${btn('exit', 'Back to Quests', '', 'cq-primary')}</div>`;
    },

    complete: () => `${heading('✅ Lesson complete!', 'DONE')}
      <p>You already opened this chest. Practice Missions keep your skills sharp and earn gems.</p>
      <div class="cq-actions">${btn('exit', 'Back to Quests')}<a class="cq-button cq-primary" href="#practice/${esc(lesson.id)}">Practice Mission ▶</a></div>`,

    practice: () => {
      const result = screen.result;
      if (result) {
        const title = result.kind === 'gems' ? `+${result.gems} 💎` : 'Great practice!';
        const message = result.kind === 'gems' ? 'Great practice! Gems added.'
          : result.kind === 'none' ? 'Come back tomorrow for more gems.' : 'Now call your grown-up to check the real computer task again.';
        const next = result.kind === 'not-yet' ? `<a class="cq-button cq-primary" href="#lesson/${esc(lesson.id)}">Call a grown-up again ▶</a>` : '';
        return `${heading(title, `PRACTICE · LESSON ${esc(lesson.id.toUpperCase())}`)}<p>${message}</p>
          <div class="cq-actions">${btn('exit', 'Back to Quests', '', next ? '' : 'cq-primary')}${next}</div>`;
      }
      const windows = cqNow().windows;
      const steps = lesson.mission.map((step) => `<li>${step.grownup ? '🛑 ' : ''}${text(step.text)}${step.options
        ? `<ul>${visibleOptions(step.options, windows).map((option) => `<li>${option.label ? `${esc(option.label)} ` : ''}${text(option.text)}</li>`).join('')}</ul>` : ''}</li>`).join('');
      return `${heading('Practice Mission', `PRACTICE · LESSON ${esc(lesson.id.toUpperCase())}`)}
        <p class="cq-practice">${text(lesson.practice)}</p>
        <details class="cq-reminder"><summary>Need a reminder?</summary><ol class="cq-list">${steps}</ol></details>
        <div class="cq-actions">${btn('exit', 'Back to Quests')}${btn('practice-done', 'I did it ✓', '', 'cq-primary')}</div>`;
    },
  };

  function windowsPicker(cq) {
    const hint = detectedWindows ? `<p class="cq-hint-box">Auto-detected: Windows ${esc(detectedWindows)} — check it matches</p>` : '';
    return `${hint}<div class="cq-win-pick" role="group" aria-label="Which Windows does this computer have?">${['10', '11'].map((version, i) => (
      `<button type="button" class="cq-big-choice" data-action="set-windows" data-value="${version}" data-key="${i + 1}" aria-pressed="${cq.windows === version}">Windows ${version}</button>`
    )).join('')}</div>${cq.windows ? `<p class="cq-feedback cq-good">✅ Saved: Windows ${esc(cq.windows)}</p>` : ''}`;
  }

  function spotIt(index, step) {
    if (!screen.spot || screen.spot.step !== index) {
      const last = stateNow().spotIt[index];
      screen.spot = missionStepDone(cqNow(), lesson, index) && Array.isArray(last) && last.length
        ? { step: index, order: last.map((answer) => answer.card), pos: last.length, picks: last.map((answer) => ({ card: answer.card, pick: answer.pick })), finished: true }
        : newSpotRun(index, step);
    }
    const spot = screen.spot;
    if (!spot.finished) {
      const card = step.cards[spot.order[spot.pos]];
      return `<div class="cq-spot"><span class="cq-eyebrow">CARD ${spot.pos + 1} OF ${step.cards.length}</span>
        <blockquote class="cq-spot-card">${text(card.text)}</blockquote>
        <div class="cq-spot-buttons">${btn('spot-pick', '✅ OK', 'data-value="ok" data-key="1"', 'cq-spot-ok')}${btn('spot-pick', '🛑 STOP', 'data-value="stop" data-key="2"', 'cq-spot-stop')}</div></div>`;
    }
    const correct = spot.picks.filter((pick) => step.cards[pick.card].answer === pick.pick).length;
    const passed = correct >= step.pass;
    const rows = spot.picks.map((pick) => {
      const card = step.cards[pick.card];
      const right = card.answer === pick.pick;
      return `<li class="cq-result ${right ? 'cq-good' : 'cq-miss'}"><span class="cq-result-mark">${right ? '✅ <span class="cq-sr">Right:</span>' : '❌ <span class="cq-sr">Missed:</span>'}</span><span>${text(card.text)}<small class="cq-why">Right answer: ${card.answer === 'ok' ? '✅ OK' : '🛑 STOP'}</small></span></li>`;
    }).join('');
    return `<div class="cq-spot"><p class="cq-score">You got ${correct} of ${step.cards.length}.</p>
      <p>${passed ? 'Great spotting!' : `You need ${step.pass} of ${step.cards.length}. Read the right answers, then try again.`}</p>
      <ul class="cq-results">${rows}</ul>${passed ? '' : `<div class="cq-actions">${btn('spot-retry', 'Try again ▶', '', 'cq-primary')}</div>`}</div>`;
  }
  const newSpotRun = (index, step) => ({ step: index, order: shuffled(step.cards).map((entry) => entry.index), pos: 0, picks: [], finished: false });

  function lootSteps(loot) {
    return (loot.item ? ['item'] : []).concat(loot.titles.length ? ['titles'] : [], ['cosmetic', 'gems']);
  }

  function paintArt() {
    const ratio = window.devicePixelRatio || 1;
    view.querySelectorAll('[data-icon]').forEach((mount) => {
      const size = Number(mount.dataset.size);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(size * ratio); canvas.height = canvas.width;
      canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      drawIcon(ctx, 0, 0, canvas.width, mount.dataset.icon);
      mount.append(canvas);
    });
    view.querySelectorAll('canvas[data-chest]').forEach((canvas) => drawChest(canvas, canvas.dataset.chest === 'open'));
  }

  // focus: undefined → card heading (a new screen); { action, value } → that control; 'keep' → whatever had focus.
  function render(focus) {
    if (!mounted) return;
    let target = focus;
    if (focus === 'keep') {
      const current = document.activeElement;
      target = current && view.contains(current) && current.dataset && current.dataset.action
        ? { action: current.dataset.action, value: current.dataset.value } : null;
    }
    view.innerHTML = `${topBar()}<section class="cq-lesson-card cq-kind-${screen.kind}" aria-labelledby="cq-lesson-heading">${bodies[screen.kind]()}</section>`;
    paintArt();
    if (target && target.action) {
      // Card controls win over the top bar (both have an "exit" button).
      const nodes = Array.from(view.querySelectorAll('.cq-lesson-card [data-action]')).concat(Array.from(view.querySelectorAll('.cq-lesson-top [data-action]')));
      const match = nodes.find((node) => node.dataset.action === target.action
        && (target.value === undefined || node.dataset.value === String(target.value)) && !node.disabled);
      if (match) { match.focus({ preventScroll: true }); return; }
    }
    if (focus === 'keep') return;
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
    const title = view.querySelector('#cq-lesson-heading');
    if (title) title.focus({ preventScroll: true });
  }
  function go(next, focus) {
    clearPinTimer();
    screen = next;
    render(focus);
    if (screen.kind === 'parent-pin') startPinCountdown();
  }

  // ---------- grown-up PIN ----------
  function startPinCountdown() {
    clearPinTimer();
    const tick = () => {
      const input = view.querySelector('#cq-pin');
      const submit = view.querySelector('.cq-pin-form [type="submit"]');
      const message = view.querySelector('.cq-pin-message');
      if (!mounted || !input || !submit || !message) { clearPinTimer(); return false; }
      const left = Math.max(0, load().parent.lockUntil - Date.now());
      input.disabled = left > 0;
      submit.disabled = left > 0;
      if (left) { message.textContent = `Too many tries — wait ${Math.ceil(left / 1000)} seconds`; return true; }
      message.textContent = '';
      clearPinTimer();
      return false;
    };
    if (tick()) pinTimer = setInterval(tick, 250);
  }
  async function onSubmit(event) {
    const form = event.target.closest ? event.target.closest('.cq-pin-form') : null;
    if (!form) return;
    event.preventDefault();
    if (pinBusy) return; // A check is already running: no double counting, no second countdown.
    const input = form.querySelector('#cq-pin');
    pinBusy = true;
    let result;
    try {
      result = await checkParentPin(input.value);
    } catch {
      result = { ok: false, lockedMs: 0, triesLeft: null };
    } finally {
      pinBusy = false;
    }
    if (!mounted || !screen || screen.kind !== 'parent-pin') return;
    if (result.ok) { play('tap'); go({ kind: 'parent-checks' }); return; }
    const message = view.querySelector('.cq-pin-message');
    input.value = '';
    if (message) {
      message.textContent = result.lockedMs ? `Too many tries — wait ${Math.ceil(result.lockedMs / 1000)} seconds`
        : result.triesLeft === null ? 'Could not check the PIN. Please try again.'
          : `Wrong PIN — ${result.triesLeft} tries left before a 1-minute wait`;
    }
    if (result.lockedMs) startPinCountdown();
    else input.focus();
  }

  // ---------- actions ----------
  // The key screen sits between the grown-up check and the chest: battle inserts here in Phase 4.
  function showKeyScreen() {
    play('win');
    go({ kind: 'key' });
  }

  function openTheChest() {
    let loot = null;
    const firstTry = screen.firstTry.slice();
    if (!commit((cq) => { const result = openChest(cq, lesson, firstTry, nowIso(), Math.random); loot = result.loot; return result.cq; }) || !loot) return;
    play('win');
    go({ kind: 'loot', loot, step: 0 });
  }

  const actions = {
    exit: () => onExit(lesson ? lesson.id : null),

    'warm-pick': (value) => {
      if (screen.picked !== null) return;
      const choice = Number(value);
      const q = lesson.warmup[screen.i];
      screen.picked = choice;
      screen.answers = screen.answers.concat({ q: screen.i, choice });
      play(choice === q.answer ? 'collect' : 'tap');
      announce(`${choice === q.answer ? 'Yes!' : 'Not quite.'} The answer is: ${plainText(q.choices[q.answer])}`);
      render({ action: 'warm-next' });
    },
    'warm-next': () => {
      if (screen.picked === null) return;
      if (screen.i < lesson.warmup.length - 1) { play('tap'); go(warmupScreen(screen.i + 1, screen.answers)); return; }
      const answers = screen.answers;
      if (commit((cq) => setPosition(recordWarmup(cq, lesson, answers), lesson.id, 'learn', 0))) { play('tap'); go({ kind: 'learn' }); }
    },

    'learn-next': () => {
      const index = position(lesson.learn);
      const last = index === lesson.learn.length - 1;
      if (commit((cq) => setPosition(cq, lesson.id, last ? 'mission' : 'learn', last ? 0 : index + 1))) { play('tap'); go({ kind: last ? 'mission' : 'learn' }); }
    },
    'learn-back': () => {
      const index = position(lesson.learn);
      if (index > 0 && commit((cq) => setPosition(cq, lesson.id, 'learn', index - 1))) go({ kind: 'learn' });
    },

    tick: () => {
      const index = position(lesson.mission);
      const done = missionStepDone(cqNow(), lesson, index);
      if (!commit((cq) => tickMission(cq, lesson, index, !done))) return;
      play(done ? 'tap' : 'collect');
      announce(done ? 'Step not done yet' : 'Step done! Next is unlocked.');
      render(done ? { action: 'tick' } : { action: 'mission-next' });
    },
    'set-windows': (value) => {
      if (!commit((cq) => setWindows(cq, value))) return;
      play('tap');
      announce(`Windows ${value} saved. Next is unlocked.`);
      render({ action: 'mission-next' });
    },
    'spot-pick': (value) => {
      const index = position(lesson.mission);
      const step = lesson.mission[index];
      const spot = screen.spot;
      if (!spot || spot.finished || spot.step !== index) return;
      spot.picks = spot.picks.concat({ card: spot.order[spot.pos], pick: value });
      spot.pos += 1;
      if (spot.pos < step.cards.length) { play('tap'); render({ action: 'spot-pick', value }); return; }
      spot.finished = true;
      const picks = spot.picks;
      commit((cq) => recordSpotIt(cq, lesson, index, picks));
      const passed = missionStepDone(cqNow(), lesson, index);
      play(passed ? 'win' : 'tap');
      announce(passed ? 'Great spotting! Next is unlocked.' : 'Not enough right yet. Read the answers and try again.');
      render({ action: passed ? 'mission-next' : 'spot-retry' });
    },
    'spot-retry': () => {
      const index = position(lesson.mission);
      screen.spot = newSpotRun(index, lesson.mission[index]);
      play('tap');
      render();
    },
    'mission-next': () => {
      const index = position(lesson.mission);
      if (!missionStepDone(cqNow(), lesson, index)) return;
      const last = index === lesson.mission.length - 1;
      if (!commit((cq) => setPosition(cq, lesson.id, last ? 'quiz' : 'mission', last ? 0 : index + 1))) return;
      play('tap');
      go(last ? quizScreen() : { kind: 'mission' });
    },
    'mission-back': () => {
      const index = position(lesson.mission);
      if (index > 0 && commit((cq) => setPosition(cq, lesson.id, 'mission', index - 1))) go({ kind: 'mission' });
    },

    'quiz-pick': (value) => {
      screen.selected = Number(value);
      play('tap');
      render({ action: 'quiz-next' });
    },
    'quiz-next': () => {
      if (screen.selected === null) return;
      const item = screen.questions[screen.pos];
      screen.answers = screen.answers.concat({ q: item.q, choice: screen.selected });
      if (screen.pos < screen.questions.length - 1) {
        screen.pos += 1;
        screen.selected = null;
        play('tap');
        render();
        return;
      }
      const answers = screen.answers;
      if (!commit((cq) => recordQuizAttempt(cq, lesson, answers, nowIso()))) { screen.answers = answers.slice(0, -1); return; }
      const passed = Boolean(stateNow().quizPassedAt);
      play(passed ? 'win' : 'tap');
      go({ kind: 'quiz-results', answers, passed });
    },
    'quiz-retry': () => { play('tap'); go(quizScreen()); },
    'to-parent': () => { play('tap'); go({ kind: 'parent' }); },

    grownup: () => { play('tap'); go({ kind: hasParentPin() ? 'parent-pin' : 'parent-nopin' }); },
    'parent-back': () => go(stateNow().parent.at ? { kind: 'not-yet' } : { kind: 'parent' }),
    'save-check': () => {
      const checks = lesson.parentChecks.map((_, i) => {
        const box = view.querySelector(`[data-check="${i}"]`);
        return Boolean(box && box.checked);
      });
      const noteBox = view.querySelector('#cq-note');
      const note = (noteBox ? noteBox.value : '').slice(0, 500);
      if (!commit((cq) => recordParentCheck(cq, lesson, checks, note, nowIso()))) return;
      if (stateNow().passedAt) showKeyScreen();
      else { play('tap'); go({ kind: 'not-yet' }); }
    },

    'key-continue': () => {
      if (commit((cq) => setPosition(cq, lesson.id, 'chest', 0))) { play('tap'); go(chestScreen()); }
    },
    'chest-pick': (value) => {
      const choice = Number(value);
      const q = lesson.chest[screen.pos];
      const first = screen.firstTry.length === screen.pos;
      if (choice === q.answer) {
        if (first) screen.firstTry = screen.firstTry.concat(true);
        play('collect');
        if (screen.pos < lesson.chest.length - 1) {
          const pos = screen.pos + 1;
          announce('Right! Next chest question.');
          go({ ...screen, pos, order: shuffledChoices(lesson.chest[pos].choices), wrong: [], hint: '', wobble: false });
        } else openTheChest();
        return;
      }
      if (first) screen.firstTry = screen.firstTry.concat(false);
      screen.wrong = screen.wrong.concat(choice);
      screen.hint = q.why ? text(q.why) : `The answer is: <strong>${text(q.choices[q.answer])}</strong>`;
      screen.wobble = true;
      play('bump');
      announce(`Not that one. ${q.why ? plainText(q.why) : `The answer is: ${plainText(q.choices[q.answer])}`}`);
      render({ action: 'chest-pick' });
      screen.wobble = false;
    },

    'loot-next': () => { screen.step += 1; play('tap'); render(); },
    'equip-loot': () => {
      const item = getItem(screen.loot.item);
      if (!item || !commit((cq) => equip(cq, item.id))) return;
      play('collect');
      announce(`${item.name} equipped`);
      render({ action: legendaryPending() ? 'to-legendary' : 'exit' });
    },
    'to-legendary': () => { play('tap'); go({ kind: 'legendary', choice: null }); },
    'legend-pick': (value) => {
      if (!LEGENDARY_CHOICES.includes(value)) return;
      screen.choice = value;
      play('tap');
      render({ action: 'legend-confirm' });
    },
    'legend-confirm': () => {
      const choice = screen.choice;
      if (!choice || !commit((cq) => chooseLegendary(cq, choice))) return;
      play('win');
      go({ kind: 'champion', choice });
    },

    'practice-done': () => {
      if (lessonStatus(cqNow(), lesson) === 'not-yet') { play('tap'); go({ kind: 'practice', result: { kind: 'not-yet' } }); return; }
      let gems = 0;
      if (!commit((cq) => { const result = completePractice(cq, lesson, todayYmd()); gems = result.gems; return result.cq; })) return;
      play(gems ? 'collect' : 'tap');
      go({ kind: 'practice', result: { kind: gems ? 'gems' : 'none', gems } });
    },
  };

  function onClick(event) {
    const button = event.target.closest ? event.target.closest('button[data-action]') : null;
    if (!button || button.disabled || !view.contains(button)) return;
    const handler = Object.prototype.hasOwnProperty.call(actions, button.dataset.action) ? actions[button.dataset.action] : null;
    if (handler) handler(button.dataset.value);
  }
  function onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || !mounted) return;
    const target = event.target;
    const tag = target && target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (/^[1-9]$/.test(event.key)) {
      const choice = view.querySelector(`[data-key="${event.key}"]`);
      if (choice && !choice.disabled) { event.preventDefault(); choice.focus({ preventScroll: true }); choice.click(); }
      return;
    }
    if (event.key !== 'Enter') return;
    if (target && target.closest && target.closest('button, a, summary')) return; // Native activation.
    const primary = Array.from(view.querySelectorAll('.cq-primary')).find((node) => !node.disabled);
    if (primary) { event.preventDefault(); primary.click(); }
  }
  const onVisibility = () => {
    if (document.hidden) { flushActive(); lastTick = null; } else if (mounted) lastTick = Date.now();
  };
  const onPageHide = () => { stopTicking(); clearPinTimer(); };
  const onPageShow = () => {
    if (!mounted) return;
    startTicking();
    if (screen && screen.kind === 'parent-pin') startPinCountdown();
  };

  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  const redrawForDetection = () => {
    if (mounted && screen && screen.kind === 'mission' && lesson.mission[position(lesson.mission)].kind === 'windowsCheck') render('keep');
  };

  screen = openScreen();
  render();
  startTicking();
  if (lesson && !cqNow().windows) {
    onDetected = redrawForDetection;
    detectWindows();
  }

  return {
    lessonId: lesson ? lesson.id : null,
    destroy() {
      if (!mounted) return;
      stopTicking();
      clearPinTimer();
      mounted = false;
      if (onDetected === redrawForDetection) onDetected = null;
      root.removeEventListener('click', onClick);
      root.removeEventListener('submit', onSubmit);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    },
  };
}

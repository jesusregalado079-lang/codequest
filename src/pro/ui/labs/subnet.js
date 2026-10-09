// Subnet Sprint runner: one generated round of 10 questions per level (../../labs/subnet.js), one at a time, with the
// block-size explanation after each answer. Fresh round every time; the round's score is saved as subnet/<levelId>.
import { checkAnswer, makeRound } from '../../labs/subnet.js';
import { S, esc, focusResult, onLeave, record, runnerHead, scoreBanner, stopwatch, wireAgain } from './shared.js';

const ROUND = 10;
const INPUT_MODE = { ip: 'decimal', mask: 'decimal', cidr: 'numeric', number: 'numeric' };
const PLACEHOLDER = { ip: 'e.g. 10.1.1.64', mask: 'e.g. 255.255.255.224', cidr: 'e.g. 27', number: 'e.g. 30' };
let st = null;
let tick = null;
let ynKeys = null; // the Y/N key listener of the yes/no question on screen

function dropKeys() { if (ynKeys) { document.removeEventListener('keydown', ynKeys); ynKeys = null; } }

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

export function showSubnet(lab, kase) {
  stopTick();
  st = null;
  onLeave(() => { stopTick(); dropKeys(); st = null; });
  renderIntro(lab, kase);
}

function renderIntro(lab, kase) {
  const { app, header } = S.ctx;
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run sn">
      ${runnerHead(lab, kase)}
      <section class="sn-intro">
        <p>${esc(kase.blurb || '')}</p>
        <ul class="ex-facts"><li><b>${ROUND}</b> questions</li><li>a fresh round every time</li><li>pass <b>${lab.pass}%</b></li><li>the clock is just for you</li></ul>
        <p class="ex-muted">Method: find the block size (256 minus the interesting mask octet, or 2 to the power of the host bits), then count up in blocks.</p>
        <button type="button" class="ex-btn primary" data-start>Start the sprint</button>
      </section>
    </main>`;
  const b = app.querySelector('[data-start]');
  b.addEventListener('click', () => start(lab, kase));
}

function start(lab, kase) {
  // makeRound first: nothing else may draw random numbers between the click and the round (the browser test relies on it)
  const qs = makeRound(kase.id, ROUND);
  st = { qs, i: 0, answers: [], clock: stopwatch() };
  stopTick();
  tick = setInterval(() => { const el = document.getElementById('sn-clock'); if (el && st) el.textContent = fmt(st.clock.secs()); }, 1000);
  renderQuestion(lab, kase);
}

function renderQuestion(lab, kase) {
  dropKeys();
  const { app, header } = S.ctx;
  const q = st.qs[st.i];
  const a = st.answers[st.i];
  const right = st.answers.filter((x) => x && x.ok).length;
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run sn">
      ${runnerHead(lab, kase)}
      <div class="ex-runbar"><div><strong>Question ${st.i + 1} of ${st.qs.length}</strong> <span class="ex-muted">· ${right} right so far</span></div><div class="ex-timer" aria-hidden="true"><span id="sn-clock">${fmt(st.clock.secs())}</span><small>elapsed</small></div></div>
      <span class="ex-bar thin"><i style="width:${Math.round((st.answers.length / st.qs.length) * 100)}%"></i></span>
      <article class="ex-q sn-q">
        <div class="ex-obj-tag">${esc(q.kind)}</div>
        <h2 id="sn-prompt">${esc(q.prompt)}</h2>
        ${q.input === 'yesno' ? `
        <div class="sn-yesno" role="group" aria-labelledby="sn-prompt">
          <button type="button" class="ex-choice${a && a.input === 'yes' ? (a.ok ? ' right' : ' wrong') : ''}" data-yn="yes" ${a ? 'aria-disabled="true"' : ''}><span class="ex-letter">Y</span><span>Yes, same subnet</span></button>
          <button type="button" class="ex-choice${a && a.input === 'no' ? (a.ok ? ' right' : ' wrong') : ''}" data-yn="no" ${a ? 'aria-disabled="true"' : ''}><span class="ex-letter">N</span><span>No, different subnets</span></button>
        </div>` : `
        <form class="sn-form" id="sn-form" autocomplete="off">
          <label class="visually-hidden" for="sn-input">Your answer</label>
          <input id="sn-input" class="sn-input${a ? (a.ok ? ' ok' : ' no') : ''}" type="text" inputmode="${INPUT_MODE[q.input] || 'text'}" enterkeyhint="done" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="${esc(PLACEHOLDER[q.input] || '')}" value="${a ? esc(a.input) : ''}" ${a ? 'readonly' : ''}>
          ${a ? '' : '<button type="submit" class="ex-btn primary">Answer</button>'}
        </form>`}
        <div id="sn-fb" aria-live="polite">${a ? `<div class="ex-feedback ${a.ok ? 'ok' : 'no'}"><strong>${a.ok ? 'Correct.' : 'Not quite.'}</strong> ${a.ok ? '' : `The answer is <b>${esc(q.input === 'cidr' ? `/${q.answer}` : q.answer)}</b>.`}<p>${esc(q.explain)}</p></div>` : ''}</div>
      </article>
      ${a ? `<div class="ex-nav"><button type="button" class="ex-btn primary" data-next>${st.i + 1 < st.qs.length ? 'Next →' : 'See my score'}</button></div>` : ''}
      <p class="ex-keys ex-muted">Enter answers${q.input === 'yesno' ? ' · Y or N' : ''} · Enter again for the next question</p>
    </main>`;
  const answer = (val) => {
    if (st.answers[st.i]) return;
    const v = String(val ?? '').trim();
    if (!v) return;
    st.answers[st.i] = { input: v, ok: checkAnswer(q, v) };
    renderQuestion(lab, kase);
    const n = app.querySelector('[data-next]'); if (n) n.focus();
  };
  const form = app.querySelector('#sn-form');
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); answer(app.querySelector('#sn-input').value); });
  app.querySelectorAll('[data-yn]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.yn)));
  const next = app.querySelector('[data-next]');
  if (next) next.addEventListener('click', () => { if (st.i + 1 < st.qs.length) { st.i += 1; renderQuestion(lab, kase); } else finish(lab, kase); });
  const inp = app.querySelector('#sn-input');
  if (inp && !a) inp.focus();
  if (q.input === 'yesno' && !a) {
    ynKeys = (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey && /^[yn]$/i.test(e.key)) { e.preventDefault(); answer(e.key.toLowerCase() === 'y' ? 'yes' : 'no'); } };
    document.addEventListener('keydown', ynKeys);
    const f = app.querySelector('[data-yn]'); if (f) f.focus();
  }
}

function finish(lab, kase) {
  if (!st || st.finished) return; // one saved run per round
  st.finished = true;
  stopTick();
  dropKeys();
  const { app, header } = S.ctx;
  const right = st.answers.filter((x) => x && x.ok).length;
  const score = Math.round((100 * right) / st.qs.length);
  const secs = st.clock.secs();
  const r = record(lab, kase, score, secs);
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run sn">
      ${runnerHead(lab, kase)}
      <section class="lb-result" id="sn-result" aria-live="polite">
        <h2 class="lb-h3">${right} of ${st.qs.length} right in ${fmt(secs)}</h2>
        ${scoreBanner(lab, kase, r)}
        <ol class="sn-review">${st.qs.map((q, i) => { const a = st.answers[i]; return `<li class="${a && a.ok ? 'ok' : 'no'}"><span class="lb-mark" aria-hidden="true">${a && a.ok ? '✓' : '✗'}</span><div><strong>${esc(q.prompt)}</strong><small>${a && a.ok ? 'You answered' : `You said ${esc(a ? a.input : 'nothing')}; answer`} ${esc(q.input === 'cidr' ? `/${q.answer}` : q.answer)}</small></div></li>`; }).join('')}</ol>
      </section>
    </main>`;
  const box = app.querySelector('#sn-result');
  wireAgain(box, () => start(lab, kase));
  focusResult(box);
}

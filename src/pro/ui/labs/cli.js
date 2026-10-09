// Terminal Troubleshooter runner: the symptom, a terminal on the affected host (../../labs/grading.js cliRespond), then a
// diagnosis and a fix, unlocked once at least one command has been run. Check grades with gradeCli.
import { cliRespond, gradeCli } from '../../labs/grading.js';
import { S, esc, focusResult, onLeave, record, runnerHead, scoreBanner, sourceLinks, stopwatch, wireAgain } from './shared.js';

const LETTERS = ['A', 'B', 'C', 'D'];
let st = null;

export function showCli(lab, kase) {
  st = fresh();
  onLeave(() => { st = null; });
  render(lab, kase);
}
const fresh = () => ({ lines: [], hist: [], hi: 0, ran: 0, diagnosis: null, fix: null, done: false, clock: stopwatch() });
const promptOf = (kase) => (kase.os === 'windows' ? 'C:\\Users\\it>' : `it@${String(kase.host || 'host').toLowerCase()}:~$`);

function group(kase, key, title) {
  const g = kase[key] || { choices: [] };
  return `
    <fieldset class="cl-group" data-group="${key}">
      <legend>${title}</legend>
      <div class="ex-choices">
        ${g.choices.map((c, i) => `<button type="button" class="ex-choice" data-${key}="${i}" aria-pressed="false"><span class="ex-letter">${LETTERS[i]}</span><span>${esc(c)}</span></button>`).join('')}
      </div>
      <div class="cl-fb" aria-live="polite"></div>
    </fieldset>`;
}

function render(lab, kase) {
  const { app, header } = S.ctx;
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run cli">
      ${runnerHead(lab, kase)}
      <section class="cl-symptom">
        <div class="cl-ticket"><span>Ticket</span><b>${esc(kase.host || '')}</b><small>${kase.os === 'windows' ? 'Windows' : 'Linux'}</small></div>
        <p>${esc(kase.symptom || '')}</p>
      </section>
      <div class="lb-term">
        <div class="lb-term-bar"><span class="lb-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(kase.host || '')} · ${kase.os === 'windows' ? 'Command Prompt' : 'bash'}</span></div>
        <pre class="lb-term-out" id="cl-out" role="log" aria-live="polite" aria-label="Terminal output"></pre>
        <form class="lb-term-in" id="cl-form" autocomplete="off">
          <label for="cl-cmd" class="lb-prompt">${esc(promptOf(kase))}</label>
          <input id="cl-cmd" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="go" placeholder="type a command, or help">
        </form>
      </div>
      <div class="lb-chips" id="cl-chips" aria-label="Commands you can run">
        ${(kase.commands || []).map((c) => `<button type="button" class="lb-chip" data-cmd="${esc(c.cmd)}">${esc(c.cmd)}</button>`).join('')}
        <button type="button" class="lb-chip ghost" data-cmd="${kase.os === 'windows' ? 'cls' : 'clear'}">${kase.os === 'windows' ? 'cls' : 'clear'}</button>
      </div>
      <section class="cl-answer" aria-label="Your call">
        <p class="cl-lock ex-muted" id="cl-lock">Run at least one command to look at the evidence first.</p>
        ${group(kase, 'diagnosis', 'What is wrong?')}
        ${group(kase, 'fix', 'What fixes it?')}
        <div class="ex-actions"><button type="button" class="ex-btn primary" data-check disabled>Check</button></div>
      </section>
      <section class="lb-result" id="cl-result" aria-live="polite"></section>
    </main>`;
  drawOut();
  sync();
  wire(lab, kase);
}

function drawOut() {
  const out = document.getElementById('cl-out');
  out.textContent = st.lines.length ? st.lines.join('\n') : 'Type help to list the commands available on this host.';
  out.scrollTop = out.scrollHeight;
}

function sync() {
  const { app } = S.ctx;
  const locked = st.ran === 0;
  app.querySelector('#cl-lock').hidden = !locked;
  ['diagnosis', 'fix'].forEach((key) => {
    app.querySelectorAll(`[data-${key}]`).forEach((b) => {
      const on = Number(b.dataset[key]) === st[key];
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('picked', on);
      b.disabled = locked || st.done;
    });
  });
  app.querySelector('[data-check]').disabled = locked || st.done || st.diagnosis === null || st.fix === null;
}

function runCmd(kase, raw) {
  const cmd = String(raw || '').trim();
  if (!cmd) return;
  st.hist.push(cmd);
  st.hi = st.hist.length;
  if (/^(cls|clear)$/i.test(cmd)) { st.lines = []; drawOut(); return; }
  const out = cliRespond(kase, cmd);
  st.lines.push(`${promptOf(kase)} ${cmd}`, ...String(out).split('\n'), '');
  if (st.lines.length > 600) st.lines = st.lines.slice(-600);
  st.ran += 1;
  drawOut();
  sync();
}

function wire(lab, kase) {
  const { app } = S.ctx;
  const input = app.querySelector('#cl-cmd');
  app.querySelector('#cl-form').addEventListener('submit', (e) => { e.preventDefault(); runCmd(kase, input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && st.hist.length) { e.preventDefault(); st.hi = Math.max(0, st.hi - 1); input.value = st.hist[st.hi] || ''; }
    if (e.key === 'ArrowDown' && st.hist.length) { e.preventDefault(); st.hi = Math.min(st.hist.length, st.hi + 1); input.value = st.hist[st.hi] || ''; }
  });
  app.querySelector('#cl-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) runCmd(kase, b.dataset.cmd); });
  app.querySelector('.cl-answer').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diagnosis], [data-fix]');
    if (!b || b.disabled || st.done) return;
    const key = b.dataset.diagnosis !== undefined ? 'diagnosis' : 'fix';
    st[key] = Number(b.dataset[key]);
    sync();
  });
  app.querySelector('[data-check]').addEventListener('click', () => check(lab, kase));
}

function feedback(g, picked, ok) {
  const whyNot = !ok && g.whyNot ? g.whyNot[String(picked)] : '';
  return `<div class="ex-feedback ${ok ? 'ok' : 'no'}"><strong>${ok ? 'Right.' : 'Not quite.'}</strong> ${ok ? '' : `The answer is <b>${esc(g.choices[g.answer])}</b>.`}
    <p>${esc(g.why || '')}</p>${whyNot ? `<p class="ex-whynot"><b>Why not your pick:</b> ${esc(whyNot)}</p>` : ''}</div>`;
}

function check(lab, kase) {
  if (!st || st.done) return; // one graded run per attempt
  const { app } = S.ctx;
  const g = gradeCli(kase, { diagnosis: st.diagnosis, fix: st.fix });
  const r = record(lab, kase, g.score, st.clock.secs());
  st.done = true;
  sync();
  [['diagnosis', g.diagOk], ['fix', g.fixOk]].forEach(([key, ok]) => {
    const def = kase[key];
    const fs = app.querySelector(`[data-group="${key}"]`);
    fs.classList.add(ok ? 'ok' : 'no');
    fs.querySelectorAll(`[data-${key}]`).forEach((b) => {
      const i = Number(b.dataset[key]);
      b.classList.remove('picked');
      if (i === def.answer) b.classList.add('right');
      else if (i === st[key]) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    fs.querySelector('.cl-fb').innerHTML = feedback(def, st[key], ok);
  });
  const box = app.querySelector('#cl-result');
  box.innerHTML = `<h2 class="lb-h3">Diagnosis ${g.diagOk ? '✓' : '✗'} · Fix ${g.fixOk ? '✓' : '✗'}</h2>${scoreBanner(lab, kase, r)}${sourceLinks(lab, kase)}`;
  wireAgain(box, () => { st = fresh(); render(lab, kase); app.querySelector('#cl-cmd').focus(); });
  focusResult(box);
}

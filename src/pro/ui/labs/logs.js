// Log Detective runner: one card per log snippet, pick the attack it shows, Check grades with ../../labs/grading.js.
import { gradeMatch } from '../../labs/grading.js';
import { S, esc, focusResult, onLeave, record, runnerHead, scoreBanner, sourceLinks, stopwatch, wireAgain } from './shared.js';

let st = null;
let LABELS = {}; // the label names, from the log sets module (loaded with the lab's content)
const labelText = (id) => (LABELS && LABELS[id]) || id;

export function showLogs(lab, kase) {
  LABELS = lab.content?.LABELS || {};
  st = { picks: (kase.snippets || []).map(() => null), clock: stopwatch(), done: false };
  onLeave(() => { st = null; });
  render(lab, kase);
}

function render(lab, kase) {
  const { app, header } = S.ctx;
  const snippets = kase.snippets || [];
  const labels = kase.labels || [];
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run logs">
      ${runnerHead(lab, kase)}
      <p class="lb-brief lb-brief-line">Each card is a slice of a real-looking log. Name the attack it shows: one pick per card. Some labels are decoys.</p>
      <ol class="lg-list">
        ${snippets.map((sn, i) => `
        <li class="lg-card" data-sn="${i}">
          <div class="lg-head"><span class="lg-n">${i + 1}</span><span class="lg-src">${esc(sn.source || 'Log')}</span></div>
          <pre class="lg-lines" tabindex="0" aria-label="Log lines for card ${i + 1}">${(sn.lines || []).map((l) => esc(l)).join('\n')}</pre>
          <div class="lg-picks" role="group" aria-label="Card ${i + 1}: which attack is this?">
            ${labels.map((id) => `<button type="button" class="lg-pick" data-pick="${esc(id)}" aria-pressed="false">${esc(labelText(id))}</button>`).join('')}
          </div>
          <div class="lg-fb" aria-live="polite"></div>
        </li>`).join('')}
      </ol>
      <div class="ex-actions lb-checkrow"><span class="ex-muted" id="lg-count"></span><button type="button" class="ex-btn primary" data-check disabled>Check</button></div>
      <section class="lb-result" id="lg-result" aria-live="polite"></section>
    </main>`;
  sync();
  app.querySelector('.lg-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b || st.done) return;
    const i = Number(b.closest('.lg-card').dataset.sn);
    st.picks[i] = st.picks[i] === b.dataset.pick ? null : b.dataset.pick;
    sync();
  });
  app.querySelector('[data-check]').addEventListener('click', () => check(lab, kase));
}

function sync() {
  const { app } = S.ctx;
  app.querySelectorAll('.lg-card').forEach((card) => {
    const pick = st.picks[Number(card.dataset.sn)];
    card.querySelectorAll('[data-pick]').forEach((b) => {
      const on = b.dataset.pick === pick;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('on', on);
    });
  });
  const n = st.picks.filter(Boolean).length;
  app.querySelector('#lg-count').textContent = `${n} of ${st.picks.length} picked`;
  app.querySelector('[data-check]').disabled = st.done || n < st.picks.length;
}

function check(lab, kase) {
  if (!st || st.done) return; // one graded run per attempt
  const { app } = S.ctx;
  const g = gradeMatch(kase, st.picks);
  const r = record(lab, kase, g.score, st.clock.secs());
  st.done = true;
  sync();
  g.results.forEach((res) => {
    const card = app.querySelector(`.lg-card[data-sn="${res.i}"]`);
    if (!card) return;
    card.classList.add(res.pass ? 'ok' : 'no');
    card.querySelectorAll('[data-pick]').forEach((b) => {
      b.setAttribute('aria-disabled', 'true');
      if (b.dataset.pick === res.answer) b.classList.add('right');
      else if (b.dataset.pick === res.pick) b.classList.add('wrong');
    });
    const why = (kase.snippets[res.i] || {}).why || '';
    card.querySelector('.lg-fb').innerHTML = `<div class="ex-feedback ${res.pass ? 'ok' : 'no'}"><strong>${res.pass ? 'Right.' : 'Not this one.'}</strong> ${res.pass ? '' : `It shows <b>${esc(labelText(res.answer))}</b>.`}<p>${esc(why)}</p></div>`;
  });
  const box = app.querySelector('#lg-result');
  box.innerHTML = `<h2 class="lb-h3">${g.passed} of ${g.total} named right</h2>${scoreBanner(lab, kase, r)}${sourceLinks(lab, kase)}`;
  wireAgain(box, () => { st = { picks: st.picks.map(() => null), clock: stopwatch(), done: false }; render(lab, kase); const f = app.querySelector('.lg-pick'); if (f) f.focus(); });
  focusResult(box);
}

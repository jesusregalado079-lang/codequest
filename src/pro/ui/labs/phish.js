// Phish Inspector runner: an email client view where every clue is a button that toggles a 🚩 flag, links that never
// navigate (their real address shows in a status bar), then a verdict and an action. Graded by ../../labs/grading.js.
import { PHISH_ACTIONS, gradePhish, phishSpotIds } from '../../labs/grading.js';
import { S, esc, focusResult, onLeave, record, runnerHead, scoreBanner, sourceLinks, stopwatch, wireAgain } from './shared.js';

let st = null;
const fresh = () => ({ flags: new Set(), verdict: null, action: null, done: false, clock: stopwatch() });

export function showPhish(lab, kase) {
  st = fresh();
  onLeave(() => { st = null; });
  render(lab, kase);
}

// A readable name for a spot in the results list.
function spotName(kase, id) {
  const m = kase.mail || {};
  const fixed = { from: 'From (sender)', subject: 'Subject', auth: 'Authentication results', reply: 'Reply-To', return: 'Return-Path' };
  if (fixed[id]) return fixed[id];
  const att = /^att-(\d+)$/.exec(id);
  if (att) return `Attachment ${((m.attachments || [])[Number(att[1])] || {}).name || ''}`;
  for (const para of m.body || []) for (const seg of para || []) if (seg && typeof seg === 'object' && seg.spot === id) return `${seg.href ? 'Link' : 'Text'}: "${seg.text}"`;
  return id;
}

const spotBtn = (id, inner, cls = '', extra = '') => `<button type="button" class="ph-spot ${cls}" data-spot="${esc(id)}" aria-pressed="false" ${extra}>${inner}<span class="ph-flag" aria-hidden="true">🚩</span></button>`;

function render(lab, kase) {
  const { app, header } = S.ctx;
  const m = kase.mail || {};
  const a = m.auth || {};
  const body = (m.body || []).map((para) => `<p>${(para || []).map((seg) => {
    if (typeof seg === 'string') return esc(seg);
    if (!seg || typeof seg !== 'object') return '';
    if (seg.href) return spotBtn(seg.spot, esc(seg.text), 'ph-link', `data-href="${esc(seg.href)}" aria-describedby="ph-status"`);
    return spotBtn(seg.spot, esc(seg.text), 'ph-text');
  }).join('')}</p>`).join('');
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run phish">
      ${runnerHead(lab, kase)}
      <p class="lb-brief lb-brief-line">Tap everything that looks wrong to flag it 🚩 (tap again to unflag). Links do not open: hover, focus or tap one to see where it really goes. Then decide.</p>
      <article class="ph-mail" aria-label="The email">
        <header class="ph-head">
          <div class="ph-subject">${spotBtn('subject', esc(m.subject || '(no subject)'), 'ph-subj')}</div>
          <dl class="ph-rows">
            <div><dt>From</dt><dd>${spotBtn('from', `<b>${esc((m.from || {}).name || '')}</b> &lt;${esc((m.from || {}).addr || '')}&gt;`)}</dd></div>
            ${m.replyTo ? `<div><dt>Reply-To</dt><dd>${spotBtn('reply', esc(m.replyTo))}</dd></div>` : ''}
            ${m.returnPath ? `<div><dt>Return-Path</dt><dd>${spotBtn('return', esc(m.returnPath))}</dd></div>` : ''}
            <div><dt>To</dt><dd><span class="ph-plain">${esc(m.to || '')}</span></dd></div>
            <div><dt>Date</dt><dd><span class="ph-plain">${esc(m.date || '')}</span></dd></div>
          </dl>
          <div class="ph-auth">${spotBtn('auth', `<code>Authentication-Results: spf=${esc(a.spf || 'none')} dkim=${esc(a.dkim || 'none')} dmarc=${esc(a.dmarc || 'none')}</code>`, 'ph-authbtn')}</div>
        </header>
        <div class="ph-body">${body}</div>
        ${(m.attachments || []).length ? `<div class="ph-atts" aria-label="Attachments">${m.attachments.map((at, i) => spotBtn(`att-${i}`, `<span aria-hidden="true">📎</span> ${esc(at.name)} <small>${esc(at.size || '')}</small>`, 'ph-att')).join('')}</div>` : ''}
        <div class="ph-status" id="ph-status" aria-live="polite">Hover or tap a link to see its address</div>
      </article>
      <section class="ph-decide" aria-label="Your decision">
        <fieldset class="ph-verdict"><legend>Verdict</legend>
          <label><input type="radio" name="ph-verdict" value="phish"> <span>🎣 Phishing</span></label>
          <label><input type="radio" name="ph-verdict" value="legit"> <span>✅ Legitimate</span></label>
        </fieldset>
        <fieldset class="ph-action"><legend>What do you do?</legend>
          ${PHISH_ACTIONS.map((x) => `<label><input type="radio" name="ph-action" value="${esc(x.id)}"> <span>${esc(x.text)}</span></label>`).join('')}
        </fieldset>
        <div class="ex-actions lb-checkrow"><span class="ex-muted" id="ph-count"></span><button type="button" class="ex-btn primary" data-check disabled>Check</button></div>
      </section>
      <section class="lb-result" id="ph-result" aria-live="polite"></section>
    </main>`;
  sync();
  wire(lab, kase);
}

function sync() {
  const { app } = S.ctx;
  app.querySelectorAll('[data-spot]').forEach((b) => {
    const on = st.flags.has(b.dataset.spot);
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('on', on);
  });
  app.querySelector('#ph-count').textContent = `${st.flags.size} flagged`;
  app.querySelector('[data-check]').disabled = st.done || !st.verdict || !st.action;
}

function showHref(b) {
  const bar = document.getElementById('ph-status');
  if (bar && b && b.dataset.href) { bar.textContent = b.dataset.href; bar.classList.add('on'); }
}

function wire(lab, kase) {
  const { app } = S.ctx;
  const mail = app.querySelector('.ph-mail');
  mail.addEventListener('click', (e) => {
    const b = e.target.closest('[data-spot]');
    if (!b) return;
    e.preventDefault();
    showHref(b);
    if (st.done) return;
    const id = b.dataset.spot;
    if (st.flags.has(id)) st.flags.delete(id); else st.flags.add(id);
    sync();
  });
  mail.querySelectorAll('.ph-link').forEach((b) => {
    b.addEventListener('mouseenter', () => showHref(b));
    b.addEventListener('focus', () => showHref(b));
  });
  app.querySelectorAll('input[name="ph-verdict"]').forEach((r) => r.addEventListener('change', () => { st.verdict = r.value; sync(); }));
  app.querySelectorAll('input[name="ph-action"]').forEach((r) => r.addEventListener('change', () => { st.action = r.value; sync(); }));
  app.querySelector('[data-check]').addEventListener('click', () => check(lab, kase));
}

function check(lab, kase) {
  if (!st || st.done) return; // one graded run per attempt
  const { app } = S.ctx;
  const g = gradePhish(kase, { flagged: [...st.flags], verdict: st.verdict, action: st.action });
  const r = record(lab, kase, g.score, st.clock.secs());
  st.done = true;
  sync();
  app.querySelectorAll('.ph-decide input').forEach((i) => { i.disabled = true; });
  const spots = kase.spots || {};
  const found = new Set(g.found);
  const missed = new Set(g.missed);
  const falses = new Set(g.falseFlags);
  app.querySelectorAll('[data-spot]').forEach((b) => {
    const id = b.dataset.spot;
    b.classList.add(spots[id] && spots[id].bad ? 'bad' : 'fine');
    if (missed.has(id)) b.classList.add('missed');
    if (falses.has(id)) b.classList.add('false');
  });
  const actionText = (id) => (PHISH_ACTIONS.find((x) => x.id === id) || {}).text || id;
  const rows = phishSpotIds(kase).map((id) => {
    const s = spots[id] || {};
    const tag = found.has(id) ? ['ok', 'Found'] : missed.has(id) ? ['no', 'Missed'] : falses.has(id) ? ['no', 'False flag'] : ['', s.bad ? 'Suspicious' : 'Fine'];
    return `<li class="${s.bad ? 'bad' : 'fine'}"><span class="ph-tag ${tag[0]}">${tag[1]}</span><div><strong>${esc(spotName(kase, id))} · ${s.bad ? '🚩 suspicious' : 'fine'}</strong><small>${esc(s.why || '')}</small></div></li>`;
  }).join('');
  const box = app.querySelector('#ph-result');
  box.innerHTML = `
    <h2 class="lb-h3">Flags: ${g.found.length} found, ${g.missed.length} missed, ${g.falseFlags.length} false</h2>
    <div class="ex-feedback ${g.verdictOk ? 'ok' : 'no'}"><strong>Verdict ${g.verdictOk ? 'right' : 'wrong'}:</strong> this one is ${kase.verdict === 'phish' ? 'phishing' : 'legitimate'}.</div>
    <div class="ex-feedback ${g.actionOk ? 'ok' : 'no'}"><strong>Action ${g.actionOk ? 'right' : 'wrong'}:</strong> ${esc(actionText(kase.action))}.</div>
    <ul class="ph-spots">${rows}</ul>
    <div class="lb-why"><h3>The lesson</h3><p>${esc(kase.why || '')}</p></div>
    ${scoreBanner(lab, kase, r)}
    ${sourceLinks(lab, kase)}`;
  wireAgain(box, () => { st = fresh(); render(lab, kase); const f = app.querySelector('[data-spot]'); if (f) f.focus(); });
  focusResult(box);
}

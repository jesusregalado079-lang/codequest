// Detection Coder runner: a brief, the code editor (the lesson editor's behaviour: Tab = two spaces, Cmd/Ctrl+Enter
// runs, the draft kept for this browser session), Run tests through the sandboxed runner, score = % of tests passed.
import { run } from '../../engine/runner.js';
import { S, esc, focusResult, onLeave, record, runnerHead, scoreBanner, sourceLinks, stopwatch, wireAgain } from './shared.js';

let st = null;
const draftKey = (kase) => `codequest-pro-lab-draft-${kase.id}`;
const getDraft = (kase) => { try { return sessionStorage.getItem(draftKey(kase)); } catch { return null; } };
const setDraft = (kase, v) => { try { sessionStorage.setItem(draftKey(kase), v); } catch { /* optional */ } };

export function showCode(lab, kase) {
  st = { runs: 0, passedOnce: false, hint: false, sol: false, busy: false, clock: stopwatch() };
  onLeave(() => { if (st && st.abort) st.abort.abort(); st = null; });
  render(lab, kase);
}

function render(lab, kase) {
  const { app, header } = S.ctx;
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run code">
      ${runnerHead(lab, kase)}
      <div class="cd-panes">
        <section class="cd-brief">
          <h2 class="lb-h3">The brief</h2>
          <div class="cd-text">${esc(kase.brief || '')}</div>
          <p class="ex-muted cd-tests-n">${(kase.tests || []).length} tests · pass = all of them</p>
          <div class="ex-actions"><button type="button" class="ex-btn small ghost" data-hint>Hint</button><button type="button" class="ex-btn small ghost" data-showsol hidden>Show a solution</button></div>
          <div id="cd-hint" aria-live="polite"></div>
          <div id="cd-sol"></div>
        </section>
        <section class="cd-work">
          <label class="visually-hidden" for="cd-editor">Your code</label>
          <textarea id="cd-editor" class="editor cd-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea>
          <div class="ex-actions">
            <button type="button" class="ex-btn primary" data-run>▶ Run tests <kbd>⌘↵</kbd></button>
            <button type="button" class="ex-btn ghost" data-starter>Reset to starter</button>
          </div>
          <section class="lb-result" id="cd-result" aria-live="polite"></section>
        </section>
      </div>
    </main>`;
  const ed = app.querySelector('#cd-editor');
  ed.value = getDraft(kase) ?? kase.starter ?? '';
  ed.addEventListener('input', () => setDraft(kase, ed.value));
  ed.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value: v } = ed;
      ed.value = `${v.slice(0, s)}  ${v.slice(en)}`;
      ed.selectionStart = ed.selectionEnd = s + 2;
      setDraft(kase, ed.value);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); doRun(lab, kase); }
  });
  app.querySelector('[data-run]').addEventListener('click', () => doRun(lab, kase));
  app.querySelector('[data-starter]').addEventListener('click', () => { ed.value = kase.starter || ''; setDraft(kase, ed.value); ed.focus(); });
  app.querySelector('[data-hint]').addEventListener('click', (e) => {
    st.hint = true;
    app.querySelector('#cd-hint').innerHTML = `<div class="lb-hint"><strong>Hint</strong><p>${esc(kase.hint || 'Read the test names: each one is a requirement.')}</p></div>`;
    e.currentTarget.hidden = true;
  });
  app.querySelector('[data-showsol]').addEventListener('click', (e) => { e.currentTarget.hidden = true; showSolution(lab, kase); });
  syncSolButton();
}

function syncSolButton() {
  const b = S.ctx.app.querySelector('[data-showsol]');
  if (b) b.hidden = st.sol || !(st.passedOnce || st.runs >= 3);
}

function showSolution(lab, kase) {
  st.sol = true;
  const box = S.ctx.app.querySelector('#cd-sol');
  box.innerHTML = `<div class="lb-why"><h3>A solution</h3><pre class="cd-solution"><code>${esc(kase.solution || '')}</code></pre>
    <button type="button" class="ex-btn small" data-usesol>Put it in the editor</button>
    <h3>Why this detection matters</h3><p>${esc(kase.why || '')}</p>${sourceLinks(lab, kase)}</div>`;
  box.querySelector('[data-usesol]').addEventListener('click', () => { const ed = S.ctx.app.querySelector('#cd-editor'); ed.value = kase.solution || ''; setDraft(kase, ed.value); ed.focus(); });
  focusResult(box.firstElementChild);
}

async function doRun(lab, kase) {
  if (!st || st.busy) return;
  const { app } = S.ctx;
  const me = st;
  const btn = app.querySelector('[data-run]');
  const box = app.querySelector('#cd-result');
  me.busy = true;
  btn.disabled = true;
  box.innerHTML = '<div class="running">Running the tests…</div>';
  me.abort = new AbortController();
  const res = await run(app.querySelector('#cd-editor').value, kase.tests || [], { signal: me.abort.signal });
  if (st !== me) return; // he left the page while it ran
  me.busy = false;
  btn.disabled = false;
  const total = res.results.length || (kase.tests || []).length || 1;
  const passed = res.userError ? 0 : res.results.filter((t) => t.pass).length;
  const score = Math.round((100 * passed) / total);
  st.runs += 1;
  const r = record(lab, kase, score, st.clock.secs());
  if (r.scoredPass) st.passedOnce = true;
  box.innerHTML = `
    <h2 class="lb-h3">${passed} of ${total} tests passed</h2>
    ${res.userError ? `<div class="user-error">${esc(res.userError)}</div>` : ''}
    ${res.logs && res.logs.length ? `<pre class="console-out">${esc(res.logs.join('\n'))}</pre>` : ''}
    <ul class="tests">${res.results.map((t) => `<li class="${t.pass ? 'pass' : 'fail'}"><span class="mark">${t.pass ? '✓' : '✗'}</span> ${esc(t.name)}${!t.pass && t.error ? ` <span class="err">: ${esc(t.error)}</span>` : ''}</li>`).join('')}</ul>
    ${scoreBanner(lab, kase, r)}
    ${r.scoredPass ? `<div class="lb-why"><h3>Why this detection matters</h3><p>${esc(kase.why || '')}</p>${sourceLinks(lab, kase)}</div>` : ''}`;
  wireAgain(box, () => { st.clock.reset(); box.innerHTML = ''; app.querySelector('#cd-editor').focus(); });
  syncSolButton();
  focusResult(box);
}

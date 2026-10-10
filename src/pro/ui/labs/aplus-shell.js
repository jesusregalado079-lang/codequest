// A+ labs: the Command Line Fixer terminal on the shell engine (../../labs/aplus/shell.js). Prompt per OS, history
// (Up/Down), Tab completion from the engine, masked password prompts, "Run as administrator" on Windows hosts.
import { applyStep, createShell } from '../../labs/aplus/shell.js';
import { morph } from './aplus-dom.js';

let uid = 0;
const stepOf = (step) => (step && typeof step === 'object' && 'do' in step ? step.do : step);
const isElevate = (step) => { const d = stepOf(step); return !!d && typeof d === 'object' && d.action === 'elevate'; };
const MAX_LINES = 800;

export function shellEngine(kase) {
  const sh = createShell(kase);
  return { apply: (step) => applyStep(sh, step), check: () => sh.check() };
}

const winOs = (os) => os === 'windows-cmd' || os === 'powershell';
function titleOf(sh) {
  if (sh.os === 'windows-cmd') return `${sh.admin ? 'Administrator: ' : ''}Command Prompt`;
  if (sh.os === 'powershell') return `${sh.admin ? 'Administrator: ' : ''}Windows PowerShell`;
  return `${sh.user}@${sh.host}: bash`;
}

export function createShellArea({ kase, esc, demo = false, onAction = () => {} }) {
  const sh = createShell(kase);
  const id = `apt${uid += 1}`;
  const win = winOs(sh.os);
  let lines = []; // { kind: 'cmd'|'out'|'note', text }
  let hist = [];
  let hi = 0;
  let locked = false;
  let flashKey = null;
  let draft = '';
  const root = document.createElement('div');
  root.className = 'ap-shell';

  const ok = (text) => text !== undefined && text !== null && String(text).length > 0;
  function push(kind, text) {
    String(text).split('\n').forEach((t) => lines.push({ kind, text: t }));
    if (lines.length > MAX_LINES) lines = lines.slice(-MAX_LINES);
  }
  function runLine(line) {
    const secret = !!sh.awaiting?.secret;
    const prompt = sh.prompt();
    const r = sh.run(line);
    if (r.clear) lines = [];
    else {
      push('cmd', `${prompt}${secret ? '' : line}`);
      if (ok(r.out)) push('out', r.out);
    }
    if (!secret && String(line).trim()) { hist.push(String(line)); hi = hist.length; }
    // a mistyped command (not found / not recognized / bad usage) is a wrong action for the coach; a command that
    // reports a real problem (Permission denied, access denied) is evidence, not a mistake
    const wrong = [2, 127, 9009].includes(r.exit);
    return { ok: !wrong, msg: '', goalsChanged: r.goalsChanged || [], trapsHit: r.trapsHit || [], exit: r.exit };
  }
  function elevate() {
    const r = sh.elevate();
    if (win) {
      lines = [];
      push('note', 'A new window opened with Run as administrator (User Account Control approved).');
    } else if (ok(r.out)) push('out', r.out);
    return { ok: win, msg: win ? '' : r.out, goalsChanged: r.goalsChanged || [], trapsHit: r.trapsHit || [] };
  }

  const fl = (key) => (flashKey === key ? ' ap-flash' : '');
  function render() {
    const focused = root.contains(document.activeElement) ? document.activeElement?.dataset?.fk : null;
    const secret = !!sh.awaiting?.secret;
    const prompt = sh.prompt();
    morph(root, `
      <div class="lb-term ap-term${sh.admin ? ' admin' : ''}">
        <div class="lb-term-bar"><span class="lb-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(titleOf(sh))} · ${esc(sh.host)}</span>
          ${win ? `<button type="button" class="ap-elevate${fl('elevate')}" data-elevate data-fk="elevate"${sh.admin ? ' disabled aria-pressed="true"' : ''}>${sh.admin ? 'Running as administrator' : 'Run as administrator'}</button>` : ''}
        </div>
        <div class="ap-term-body" data-term-body>
          <pre class="ap-term-out" role="log" aria-live="polite" aria-label="Terminal output">${lines.length ? lines.map((l) => (l.kind === 'cmd' ? `<span class="ap-tc">${esc(l.text)}</span>` : l.kind === 'note' ? `<span class="ap-tn">${esc(l.text)}</span>` : esc(l.text))).join('\n') : `<span class="ap-tn">Type help to list the commands this host supports. Tab completes, Up and Down recall commands.</span>`}</pre>
          <form class="ap-term-line" data-termform autocomplete="off">
            <label for="${id}-in" class="ap-prompt">${esc(prompt.trimEnd())}</label>
            <input id="${id}-in" class="ap-term-input${fl('input')}" data-term-input data-fk="input" data-force type="${secret ? 'password' : 'text'}" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="go" value="${esc(draft)}" aria-label="${secret ? 'Password (hidden as you type)' : 'Command'}">
          </form>
        </div>
      </div>
      <div class="ap-term-help">
        <button type="button" class="lb-chip ghost" data-cmd="help">help</button>
        <button type="button" class="lb-chip ghost" data-cmd="${win && sh.os === 'windows-cmd' ? 'cls' : 'clear'}">${win && sh.os === 'windows-cmd' ? 'cls' : 'clear'}</button>
        <span class="ap-term-note">${win ? 'Admin tools (sfc, DISM, chkdsk, diskpart) need an elevated window: use Run as administrator.' : 'On Linux, sudo runs one command with root rights (the equivalent of Run as administrator).'}</span>
      </div>`);
    root.classList.toggle('locked', locked);
    const body = root.querySelector('[data-term-body]');
    body.scrollTop = body.scrollHeight;
    if (!demo && focused) root.querySelector(`[data-fk="${focused}"]`)?.focus({ preventScroll: true });
  }

  function submit(line) {
    draft = '';
    const r = runLine(line);
    render();
    if (!demo) root.querySelector('[data-term-input]')?.focus({ preventScroll: true });
    onAction(r);
  }

  if (!demo) {
    root.addEventListener('submit', (e) => { e.preventDefault(); if (locked) return; submit(root.querySelector('[data-term-input]').value); });
    root.addEventListener('input', (e) => { if (e.target.matches('[data-term-input]')) draft = e.target.value; });
    root.addEventListener('click', (e) => {
      if (locked) return;
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.elevate !== undefined) { flashKey = null; const r = elevate(); render(); root.querySelector('[data-term-input]')?.focus(); onAction(r); }
      if (b.dataset.cmd) submit(b.dataset.cmd);
    });
    // a click anywhere in the terminal (not a text selection) puts the cursor on the prompt, as a real terminal does
    root.addEventListener('mouseup', (e) => {
      if (locked || !e.target.closest('[data-term-body]') || String(getSelection?.() || '')) return;
      root.querySelector('[data-term-input]')?.focus({ preventScroll: true });
    });
    root.addEventListener('keydown', (e) => {
      const input = e.target.closest('[data-term-input]');
      if (!input || locked) return;
      if (e.key === 'ArrowUp' && hist.length && !sh.awaiting) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi] || ''; draft = input.value; }
      if (e.key === 'ArrowDown' && hist.length && !sh.awaiting) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; draft = input.value; }
      if (e.key === 'Tab' && !e.shiftKey && !sh.awaiting) {
        e.preventDefault();
        const c = sh.complete(input.value);
        if (c.line !== input.value) { input.value = c.line; draft = c.line; return; }
        if ((c.matches || []).length > 1) { push('cmd', `${sh.prompt()}${input.value}`); push('out', c.matches.join('  ')); draft = input.value; render(); root.querySelector('[data-term-input]')?.focus(); }
      }
      if (e.key === 'l' && e.ctrlKey && !win) { e.preventDefault(); lines = []; render(); root.querySelector('[data-term-input]')?.focus(); }
    });
  }

  function flash(key) { flashKey = key; render(); return root.querySelector(`[data-fk="${key}"]`); }
  return {
    el: root,
    render,
    check: () => sh.check(),
    apply(step) {
      if (isElevate(step)) { const r = elevate(); render(); return r; }
      const r = runLine(String(stepOf(step)));
      render();
      return r;
    },
    reset() { sh.reset(); lines = []; hist = []; hi = 0; draft = ''; flashKey = null; render(); },
    setLocked(on) { locked = !!on; root.classList.toggle('locked', locked); },
    // Show me: Run as administrator when an earlier solution step elevates and this window is not elevated yet;
    // otherwise the command that finishes the goal, typed into the prompt (not run).
    showMe(solution, upto) {
      if (win && !sh.admin && solution.slice(0, upto + 1).some(isElevate)) return flash('elevate');
      const d = stepOf(solution[upto]);
      if (isElevate(solution[upto])) return flash('elevate');
      draft = String(d);
      return flash('input');
    },
    preview(step) {
      if (isElevate(step)) return flash('elevate');
      draft = String(stepOf(step));
      return flash('input');
    },
    describe(step) { return isElevate(step) ? 'Run as administrator' : String(stepOf(step)); },
    pending: () => null,
    clearFlash() { if (flashKey) { flashKey = null; draft = demo ? '' : draft; render(); } },
    destroy() { root.remove(); },
  };
}

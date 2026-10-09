// Firewall & Network Diagram runner: the diagram (pick the terminal's host), a terminal that tests the live ACL, the
// ordered ACL editor, and "Check my rules" graded by ../../labs/firewall.js.
import { gradeFirewall, routeFlow, simulate, validateRule } from '../../labs/firewall.js';
import { S, esc, focusResult, onLeave, record, runnerHead, scoreBanner, sourceLinks, stopwatch, wireAgain } from './shared.js';

const ICONS = { internet: '🌐', firewall: '🧱', switch: '🔀', server: '🖥️', db: '🗄️', pc: '💻', admin: '🛡️' };
const ZONE_HUES = { outside: 8, dmz: 42, inside: 165, mgmt: 270, management: 270 };
const PROTOS = ['tcp', 'udp', 'icmp', 'any'];
// node coordinates (0..100) are drawn inside a margin so labels at the edges never leave the box
const PX = (x) => 7 + Number(x) * 0.86;
const PY = (y) => 9 + Number(y) * 0.8;
const clone = (rules) => (rules || []).map((r) => ({ ...r }));
// what grading depends on (not the row ids): Check stays off until this changes after a graded attempt
const snapshot = (rules) => JSON.stringify(rules.map((r) => [r.action, r.src, r.dst, r.proto, r.port]));

let st = null;

export function showFirewall(lab, kase) {
  const nodes = kase.nodes || [];
  const firstHost = nodes.find((n) => n.kind === 'internet') || nodes.find((n) => n.ip);
  st = { rules: clone(kase.rules), src: firstHost ? firstHost.id : null, lines: [], hist: [], hi: 0, trace: false, fails: 0, revealed: false, nextId: 1, lastGraded: null, clock: stopwatch() };
  onLeave(() => { st = null; });
  render(lab, kase);
}

function render(lab, kase) {
  const { app, header } = S.ctx;
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run fw">
      ${runnerHead(lab, kase)}
      <section class="lb-brief">
        <p>${esc(kase.brief || '')}</p>
        <h2 class="lb-h3">Requirements</h2>
        <ul class="lb-tasks">${(kase.tasks || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </section>
      <div class="fw-top">
        <section class="fw-map" aria-label="Network diagram">
          <h2 class="lb-h3">Network <small>tap a host to run the terminal from it</small></h2>
          <div class="fw-diagram" id="fw-diagram"></div>
        </section>
        <section class="fw-termwrap" aria-label="Terminal">
          <div class="lb-term">
            <div class="lb-term-bar"><span class="lb-dots" aria-hidden="true"><i></i><i></i><i></i></span><span id="fw-term-title"></span>
              <button type="button" class="lb-toggle" data-trace aria-pressed="${st.trace}">Trace ${st.trace ? 'on' : 'off'}</button></div>
            <pre class="lb-term-out" id="fw-out" role="log" aria-live="polite" aria-label="Terminal output"></pre>
            <form class="lb-term-in" id="fw-form" autocomplete="off">
              <label for="fw-cmd" class="lb-prompt" id="fw-prompt"></label>
              <input id="fw-cmd" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="go" placeholder="type help">
            </form>
          </div>
          <div class="lb-chips" id="fw-chips" aria-label="Quick commands"></div>
        </section>
      </div>
      <section class="fw-aclwrap" aria-label="Firewall rules">
        <h2 class="lb-h3">${esc((kase.nodes || []).find((n) => n.kind === 'firewall')?.label || 'FW1')} access list <small>top to bottom, first match wins</small></h2>
        <div class="fw-head" aria-hidden="true"><span>#</span><span>Action</span><span>Source</span><span>Destination</span><span>Protocol</span><span>Port</span><span></span></div>
        <ol class="fw-rules" id="fw-rules"></ol>
        <div class="fw-implicit"><span>∗</span> Anything not matched above: <b>deny</b> (implicit)</div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" data-add>+ Add rule</button>
          <button type="button" class="ex-btn ghost" data-reset>Reset to start</button>
          <button type="button" class="ex-btn primary" data-check>Check my rules</button>
        </div>
      </section>
      <section class="lb-result" id="fw-result" aria-live="polite"></section>
    </main>`;
  drawDiagram(kase);
  drawTerm(kase);
  drawRules();
  wire(lab, kase);
}

function nodeAt(kase, id) { return (kase.nodes || []).find((n) => n.id === id) || null; }

function drawDiagram(kase) {
  const nodes = kase.nodes || [];
  const zones = {};
  nodes.filter((n) => n.zone).forEach((n) => { (zones[n.zone] = zones[n.zone] || []).push(n); });
  const rects = Object.entries(zones).map(([z, list], i) => {
    const xs = list.map((n) => PX(n.x));
    const ys = list.map((n) => PY(n.y));
    const x0 = Math.max(0.5, Math.min(...xs) - 9);
    const x1 = Math.min(99.5, Math.max(...xs) + 9);
    const y0 = Math.max(0.5, Math.min(...ys) - 17);
    const y1 = Math.min(99.5, Math.max(...ys) + 15);
    const hue = ZONE_HUES[z] ?? (200 + i * 50) % 360;
    return { z, hue, x0, x1, y0, y1 };
  });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = (kase.links || []).filter(([a, b]) => byId[a] && byId[b]);
  document.getElementById('fw-diagram').innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" class="fw-svg">
      ${rects.map((r) => `<rect x="${r.x0}" y="${r.y0}" width="${r.x1 - r.x0}" height="${r.y1 - r.y0}" rx="2" fill="hsl(${r.hue} 70% 55% / .09)" stroke="hsl(${r.hue} 70% 60% / .45)" stroke-dasharray="1.2 1" vector-effect="non-scaling-stroke"/>`).join('')}
      ${links.map(([a, b]) => `<line x1="${PX(byId[a].x)}" y1="${PY(byId[a].y)}" x2="${PX(byId[b].x)}" y2="${PY(byId[b].y)}" class="fw-link" vector-effect="non-scaling-stroke"/>`).join('')}
    </svg>
    ${rects.map((r) => `<span class="fw-zone" style="left:${r.x0 + 0.6}%;top:${r.y0 + 0.8}%;--zh:${r.hue}">${esc(r.z)}</span>`).join('')}
    ${nodes.map((n) => {
    const inner = `<span class="fw-ico" aria-hidden="true">${ICONS[n.kind] || '▫️'}</span><span class="fw-lbl">${esc(n.label || n.id)}</span>${n.ip ? `<span class="fw-ip">${esc(n.ip)}</span>` : ''}`;
    const pos = `left:${PX(n.x)}%;top:${PY(n.y)}%`;
    return n.ip
      ? `<button type="button" class="fw-node k-${esc(n.kind)}${n.id === st.src ? ' on' : ''}" style="${pos}" data-node="${esc(n.id)}" aria-pressed="${n.id === st.src}" aria-label="Run the terminal from ${esc(n.label || n.id)}, ${esc(n.ip)}${n.zone ? `, zone ${esc(n.zone)}` : ''}">${inner}</button>`
      : `<div class="fw-node static k-${esc(n.kind)}" style="${pos}">${inner}</div>`;
  }).join('')}`;
}

function drawTerm(kase) {
  const from = nodeAt(kase, st.src);
  document.getElementById('fw-term-title').textContent = from ? `${from.label} · ${from.ip}` : 'terminal';
  document.getElementById('fw-prompt').textContent = from ? `${from.kind === 'internet' ? 'outside' : from.id}$` : '$';
  const out = document.getElementById('fw-out');
  out.textContent = st.lines.length ? st.lines.join('\n') : 'Type help, or tap a quick command below.';
  out.scrollTop = out.scrollHeight;
  const cmds = ['ipconfig'];
  (kase.goals || []).forEach((g) => {
    if (from && g.dst === from.ip) return;
    const c = g.proto === 'icmp' ? `ping ${g.dst}` : g.proto === 'udp' ? `nc -zvu ${g.dst} ${g.port}` : `nc -zv ${g.dst} ${g.port}`;
    if (!cmds.includes(c)) cmds.push(c);
  });
  const firstDst = (kase.goals || []).map((g) => g.dst).find((d) => !from || d !== from.ip);
  if (firstDst && !cmds.includes(`ping ${firstDst}`)) cmds.splice(1, 0, `ping ${firstDst}`);
  cmds.push('clear');
  document.getElementById('fw-chips').innerHTML = cmds.slice(0, 8).map((c) => `<button type="button" class="lb-chip" data-cmd="${esc(c)}">${esc(c)}</button>`).join('');
}

function runCmd(kase, raw) {
  const cmd = String(raw || '').trim();
  if (!cmd) return;
  st.hist.push(cmd);
  st.hi = st.hist.length;
  if (/^(clear|cls)$/i.test(cmd)) st.lines = [];
  else {
    const out = simulate(kase, st.rules, st.src, cmd, { trace: st.trace });
    st.lines.push(`${document.getElementById('fw-prompt').textContent} ${cmd}`, ...String(out).split('\n'), '');
    if (st.lines.length > 400) st.lines = st.lines.slice(-400);
  }
  drawTerm(kase);
}

function ruleRow(r, i, n) {
  const err = validateRule(r);
  const f = (k, label, input) => `<label class="fw-f fw-${k}"><span class="fw-cap">${label}</span>${input}</label>`;
  const sel = (k, opts) => `<select data-f="${k}" aria-label="Rule ${i + 1} ${k === 'proto' ? 'protocol' : k}">${opts.map((o) => `<option value="${o}"${r[k] === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
  const inp = (k, label, ph) => `<input data-f="${k}" type="text" value="${esc(r[k] ?? '')}" placeholder="${ph}" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Rule ${i + 1} ${label}">`;
  return `
    <li class="fw-rule${err ? ' bad' : ''} a-${r.action === 'deny' ? 'deny' : 'allow'}" data-i="${i}">
      <span class="fw-num" aria-hidden="true">${i + 1}</span>
      ${f('action', 'Action', sel('action', ['allow', 'deny']))}
      ${f('src', 'Source', inp('src', 'source', 'any, IP or CIDR'))}
      ${f('dst', 'Destination', inp('dst', 'destination', 'any, IP or CIDR'))}
      ${f('proto', 'Protocol', sel('proto', PROTOS))}
      ${f('port', 'Port', inp('port', 'port', 'any, 443, 80,443'))}
      <span class="fw-ops">
        <button type="button" data-op="up" aria-label="Move rule ${i + 1} up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-op="down" aria-label="Move rule ${i + 1} down" ${i === n - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" data-op="del" aria-label="Delete rule ${i + 1}">✕</button>
      </span>
      <p class="fw-err" aria-live="polite">${err ? `${esc(err)}. This rule is not matching anything until it is fixed.` : ''}</p>
    </li>`;
}

function drawRules(focusSel) {
  const ol = document.getElementById('fw-rules');
  ol.innerHTML = st.rules.length ? st.rules.map((r, i) => ruleRow(r, i, st.rules.length)).join('') : '<li class="fw-empty">No rules. Everything is denied by the implicit deny.</li>';
  if (focusSel) { const el = ol.querySelector(focusSel); if (el) el.focus(); }
  syncCheck();
}

// One graded run per distinct rule set: a repeat Check with nothing changed would save a duplicate run.
function syncCheck() {
  const b = S.ctx.app.querySelector('[data-check]');
  if (!b) return;
  const same = st.lastGraded !== null && snapshot(st.rules) === st.lastGraded;
  b.disabled = same;
  b.title = same ? 'Change a rule to check again' : '';
}

function goalWhy(kase, goal, res) {
  const r = routeFlow(kase, st.rules, goal);
  if (r.action === 'nohost') return 'no such host';
  if (r.via === 'switch') return 'same zone: the switch delivers it, the firewall never sees it';
  if (res.index < 0) return 'no rule matched: implicit deny';
  return `decided by rule ${res.index + 1}`;
}

function solutionHtml(kase) {
  return `
    <div class="lb-why"><h3>Why</h3><p>${esc(kase.why || '')}</p>
      <h3>One ACL that passes</h3>
      <ol class="fw-sol">${(kase.solution || []).map((r) => `<li><b class="a-${r.action === 'deny' ? 'deny' : 'allow'}">${esc(r.action)}</b> ${esc(r.proto)} ${esc(r.src)} → ${esc(r.dst)} port ${esc(r.port)}</li>`).join('')}<li class="ex-muted">implicit deny</li></ol>
      <button type="button" class="ex-btn small" data-usesol>Load this ACL into the editor</button>
    </div>`;
}

function check(lab, kase) {
  if (st.lastGraded !== null && snapshot(st.rules) === st.lastGraded) return;
  st.lastGraded = snapshot(st.rules);
  syncCheck();
  const g = gradeFirewall(kase, st.rules);
  const r = record(lab, kase, g.score, st.clock.secs());
  if (!r.scoredPass) st.fails += 1;
  if (r.scoredPass) st.revealed = true;
  st.graded = g;
  const box = document.getElementById('fw-result');
  box.innerHTML = `
    <h2 class="lb-h3">Requirement check · ${g.passed} of ${g.total}</h2>
    <ul class="lb-goals">${g.results.map((res, i) => `<li class="${res.pass ? 'ok' : 'no'}"><span class="lb-mark" aria-hidden="true">${res.pass ? '✓' : '✗'}</span><div><strong>${esc(res.text)}</strong><small>expected ${esc(res.expect)}, got ${esc(res.got)} · ${esc(goalWhy(kase, kase.goals[i], res))}</small></div></li>`).join('')}</ul>
    ${scoreBanner(lab, kase, r)}
    ${st.revealed ? solutionHtml(kase) + sourceLinks(lab, kase) : st.fails >= 2 ? '<div class="ex-actions"><button type="button" class="ex-btn ghost" data-showsol>Show a solution</button></div>' : ''}`;
  wireAgain(box, () => { st.rules = clone(kase.rules); st.lastGraded = null; st.lines = []; st.clock.reset(); render(lab, kase); document.querySelector('#fw-cmd').focus(); });
  const show = box.querySelector('[data-showsol]');
  if (show) show.addEventListener('click', () => { st.revealed = true; show.parentElement.outerHTML = solutionHtml(kase) + sourceLinks(lab, kase); wireSolution(kase, box); focusResult(box.querySelector('.lb-why')); });
  wireSolution(kase, box);
  focusResult(box);
}

function wireSolution(kase, box) {
  const use = box.querySelector('[data-usesol]');
  if (use) use.addEventListener('click', () => { st.rules = clone(kase.solution).map((r, i) => ({ id: r.id || `s${i}`, ...r })); drawRules('[data-f="action"]'); });
}

function wire(lab, kase) {
  const { app } = S.ctx;
  const input = app.querySelector('#fw-cmd');
  app.querySelector('#fw-form').addEventListener('submit', (e) => { e.preventDefault(); runCmd(kase, input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && st.hist.length) { e.preventDefault(); st.hi = Math.max(0, st.hi - 1); input.value = st.hist[st.hi] || ''; }
    if (e.key === 'ArrowDown' && st.hist.length) { e.preventDefault(); st.hi = Math.min(st.hist.length, st.hi + 1); input.value = st.hist[st.hi] || ''; }
  });
  app.querySelector('#fw-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) runCmd(kase, b.dataset.cmd); });
  app.querySelector('[data-trace]').addEventListener('click', (e) => { st.trace = !st.trace; e.currentTarget.setAttribute('aria-pressed', String(st.trace)); e.currentTarget.textContent = `Trace ${st.trace ? 'on' : 'off'}`; });
  app.querySelector('#fw-diagram').addEventListener('click', (e) => {
    const b = e.target.closest('[data-node]');
    if (!b) return;
    st.src = b.dataset.node;
    drawDiagram(kase); drawTerm(kase);
    const again = app.querySelector(`[data-node="${CSS.escape(st.src)}"]`); if (again) again.focus();
  });
  const ol = app.querySelector('#fw-rules');
  const edit = (e) => {
    const el = e.target.closest('[data-f]');
    const li = e.target.closest('.fw-rule');
    if (!el || !li) return;
    const r = st.rules[Number(li.dataset.i)];
    let v = el.value.trim();
    if (/^any$/i.test(v)) v = 'any';
    r[el.dataset.f] = el.tagName === 'SELECT' ? el.value : v;
    if (el.dataset.f === 'proto' && el.value === 'icmp' && r.port !== 'any') { r.port = 'any'; li.querySelector('[data-f="port"]').value = 'any'; }
    if (el.dataset.f === 'action') li.className = li.className.replace(/a-(allow|deny)/, `a-${r.action}`);
    const err = validateRule(r);
    li.classList.toggle('bad', !!err);
    li.querySelector('.fw-err').textContent = err ? `${err}. This rule is not matching anything until it is fixed.` : '';
    syncCheck();
  };
  ol.addEventListener('input', edit);
  ol.addEventListener('change', edit);
  ol.addEventListener('click', (e) => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    const i = Number(b.closest('.fw-rule').dataset.i);
    const op = b.dataset.op;
    if (op === 'del') { st.rules.splice(i, 1); drawRules(st.rules.length ? `.fw-rule[data-i="${Math.min(i, st.rules.length - 1)}"] [data-op="del"]` : null); if (!st.rules.length) app.querySelector('[data-add]').focus(); return; }
    const j = op === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= st.rules.length) return;
    [st.rules[i], st.rules[j]] = [st.rules[j], st.rules[i]];
    drawRules(`.fw-rule[data-i="${j}"] [data-op="${op}"]:not([disabled]), .fw-rule[data-i="${j}"] [data-op="del"]`);
  });
  app.querySelector('[data-add]').addEventListener('click', () => {
    st.rules.push({ id: `n${st.nextId++}`, action: 'allow', src: 'any', dst: '', proto: 'tcp', port: '' });
    drawRules(`.fw-rule[data-i="${st.rules.length - 1}"] [data-f="dst"]`);
  });
  app.querySelector('[data-reset]').addEventListener('click', () => { st.rules = clone(kase.rules); drawRules(); });
  app.querySelector('[data-check]').addEventListener('click', () => check(lab, kase));
}

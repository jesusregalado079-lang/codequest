// Hands-on Labs (#/labs...): practice for the exam's performance-based questions.
//   #/labs                    hub: stats, six lab cards, recent runs
//   #/labs/<labId>            one lab: its cases with best scores
//   #/labs/<labId>/<caseId>   the runner for one case (one module per lab)
// Rules live in ../../labs/ (pure); attempts are saved through progress.js as runs.
import './labs.css';
import { labSummary } from '../../labs/lab-logic.js';
import { LABS, caseOf, labOf } from '../../labs/catalog.js';
import { getLabs } from '../../progress.js';
import { S, bestLine, esc, leaveAll, levelName, objChips } from './shared.js';
import { showFirewall } from './firewall.js';
import { showLogs } from './logs.js';
import { showSubnet } from './subnet.js';
import { showCli } from './cli.js';
import { showPhish } from './phish.js';
import { showCode } from './code.js';

const RUNNERS = { firewall: showFirewall, logs: showLogs, subnet: showSubnet, cli: showCli, phish: showPhish, code: showCode };

// Called by the router before every page: no timer or listener outlives its page.
export function leaveLabs() { leaveAll(); }

// For the Journey page, the exam hub and the achievements: labSummary over the catalog.
export function labsSummary() {
  return labSummary(getLabs(), LABS);
}

// Labs whose cases practice any of these objective ids (for the exam domain pages).
export function labsForObjectives(objIds) {
  const want = new Set(objIds.map(String));
  return LABS.filter((l) => l.objs.some((o) => want.has(o)));
}

export function showLabs(parts, context) {
  S.ctx = context;
  leaveAll();
  const [labId, caseId] = parts;
  if (!labId) return showHub();
  const lab = labOf(labId);
  if (!lab) { location.hash = '/labs'; return; }
  if (!caseId) return showLab(lab);
  const meta = lab.cases.find((c) => c.id === caseId);
  const full = caseOf(lab.id, caseId);
  if (!meta || !full) { location.hash = `/labs/${lab.id}`; return; }
  return RUNNERS[lab.kind](lab, { ...full, ...meta }, S.ctx);
}

const fmtAgo = (t) => {
  const d = Math.round((Date.now() - t) / 60000);
  if (d < 1) return 'just now';
  if (d < 60) return `${d} min ago`;
  if (d < 1440) return `${Math.round(d / 60)} h ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const bar = (pct, cls = '') => `<span class="ex-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;

function showHub() {
  const sum = labsSummary();
  const per = Object.fromEntries(sum.perLab.map((p) => [p.id, p]));
  const started = sum.perLab.filter((p) => p.attempted > 0).length;
  S.ctx.app.innerHTML = `
    ${S.ctx.header('labs')}
    <main class="exam labs">
      <section class="lb-hero">
        <div class="lb-hero-text">
          <div class="ex-kicker">Security+ SY0-801 · performance-based practice</div>
          <h1>Hands-on Labs</h1>
          <p class="lb-lead">The exam's performance-based questions put you in a firewall, a terminal, a log, an inbox. Practice the moves here.</p>
        </div>
        <div class="lb-stats">
          <div><b>${sum.passed}<small>/${sum.total}</small></b><span>cases passed</span></div>
          <div><b>${sum.perfect}</b><span>perfect 100%</span></div>
          <div><b>${started}<small>/${LABS.length}</small></b><span>labs started</span></div>
        </div>
      </section>

      <section class="lb-grid" aria-label="Labs">
        ${LABS.map((lab, i) => {
    const p = per[lab.id] || { passed: 0, total: lab.cases.length, attempted: 0, nextCaseId: null };
    const pct = p.total ? Math.round((p.passed / p.total) * 100) : 0;
    const go = p.nextCaseId ? `#/labs/${lab.id}/${p.nextCaseId}` : `#/labs/${lab.id}`;
    const cta = p.nextCaseId ? (p.attempted ? 'Continue' : 'Start') : 'Review';
    return `
        <article class="lb-card${p.total && p.passed === p.total ? ' done' : ''}" style="--i:${i}">
          <a class="lb-card-head" href="#/labs/${esc(lab.id)}"><span class="lb-icon" aria-hidden="true">${lab.icon}</span><strong>${esc(lab.name)}</strong></a>
          <p>${esc(lab.blurb)}</p>
          ${objChips(lab.objs)}
          ${bar(pct, pct === 100 ? 'good' : '')}
          <div class="lb-card-foot">
            <span>${p.passed} of ${p.total} passed${lab.pass === 100 ? ' · pass 100%' : ''}</span>
            <a class="ex-btn small${p.nextCaseId ? ' primary' : ''}" href="${esc(go)}" data-go-lab="${esc(lab.id)}">${cta}${p.nextCaseId ? ' →' : ''}</a>
          </div>
        </article>`;
  }).join('')}
      </section>

      ${sum.recent.length ? `
      <section>
        <h2 class="ex-h2">Recent runs <span>${sum.runs} saved</span></h2>
        <ul class="lb-recent">${sum.recent.map((r) => {
    const lab = labOf(r.labId);
    const c = lab && lab.cases.find((x) => x.id === r.caseId);
    const ok = lab && r.score >= lab.pass;
    return `<li><a href="#/labs/${esc(r.labId)}/${esc(r.caseId)}"><span aria-hidden="true">${lab ? lab.icon : '•'}</span><span class="lb-recent-t">${esc(c ? c.title : r.itemId)}</span><strong class="${ok ? 'good' : ''}">${r.score}%</strong><span class="ex-muted">${esc(fmtAgo(r.t))}</span></a></li>`;
  }).join('')}</ul>
      </section>` : ''}

      <section class="ex-honest">
        <h2 class="ex-h2">How these work</h2>
        <ul>
          <li>Every case is original, with fictional companies, <code>.example</code> domains and documentation IP ranges. None are real exam items.</li>
          <li>Each check saves a run. A case is passed when your best score reaches the lab's pass mark (80%, or 100% for code).</li>
          <li>Objective chips link to the matching exam domain, so a weak spot in a lab can turn into question practice.</li>
        </ul>
      </section>
    </main>`;
}

function showLab(lab) {
  const sum = labsSummary();
  const p = sum.perLab.find((x) => x.id === lab.id) || { passed: 0, total: lab.cases.length, perfect: 0 };
  const pct = p.total ? Math.round((p.passed / p.total) * 100) : 0;
  S.ctx.app.innerHTML = `
    ${S.ctx.header('labs')}
    <main class="exam labs">
      <a class="ex-back" href="#/labs">← Hands-on Labs</a>
      <section class="lb-labhead">
        <span class="lb-bigicon" aria-hidden="true">${lab.icon}</span>
        <div>
          <div class="ex-kicker">${p.passed} of ${p.total} passed · ${p.perfect} perfect · pass mark ${lab.pass}%</div>
          <h1>${esc(lab.name)}</h1>
          <p class="ex-muted">${esc(lab.blurb)}</p>
          ${objChips(lab.objs)}
          ${bar(pct, pct === 100 ? 'good' : '')}
        </div>
      </section>
      <ol class="lb-cases${lab.kind === 'subnet' ? ' lb-levels' : ''}">
        ${lab.cases.map((c, i) => {
    const full = lab.kind === 'subnet' ? caseOf(lab.id, c.id) : null;
    return `
        <li class="lb-case" style="--i:${i}">
          <a href="#/labs/${esc(lab.id)}/${esc(c.id)}" data-case="${esc(c.id)}">
            <span class="lb-case-n">${i + 1}</span>
            <span class="lb-case-body">
              <strong>${esc(c.title)}</strong>
              <small>${esc(levelName(c.level))}${full && full.blurb ? ` · ${esc(full.blurb)}` : ''}</small>
              <span class="lb-case-meta">${c.objs.map((o) => `<i>Sec+ ${esc(o)}</i>`).join('')}${bestLine(lab, c)}</span>
            </span>
            <span class="lb-case-go" aria-hidden="true">→</span>
          </a>
        </li>`;
  }).join('')}
      </ol>
    </main>`;
}

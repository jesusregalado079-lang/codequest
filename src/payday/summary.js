// What a grown-up sees for each payday in Parent Mode: the date, what he earned, the bills and coins he entered, the
// three jars, whether he finished, and for each question whether he got it right the first time, needed a hint, needed
// the worked example, or got stuck. Nobody has to mark anything. It never shows what he typed for a question he missed.
import { describePieces, formatMoney } from './logic.js';
import { outcomes } from './session.js';

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export const QUESTION_LABELS = Object.freeze({
  earn: 'Typing what he earned',
  handed: 'Matching the bills and coins to what he earned',
  add: 'Adding the three jars together',
  'give.can': 'Give: can it be made with these pieces as they are?',
  'give.pick': 'Give: which piece to break',
  'give.replace': 'Give: the smaller pieces for the broken one',
  'give.build': 'Give: building the jar',
  'save.can': 'Save: can it be made with these pieces as they are?',
  'save.pick': 'Save: which piece to break',
  'save.replace': 'Save: the smaller pieces for the broken one',
  'save.build': 'Save: building the jar',
  spend: 'Spend: adding what is left in his hand',
});
export const OUTCOME_LABELS = Object.freeze({
  'first-time': 'Right the first time',
  hint: 'Needed a hint',
  example: 'Needed the worked example',
  stuck: 'Got stuck (a grown-up helped)',
  'in-progress': 'Not answered yet',
});
const ORDER = Object.keys(QUESTION_LABELS);

// Plain data for one payday (also what the tests read).
export function summarize(session) {
  const questions = outcomes(session)
    .sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key))
    .map((q) => ({ key: q.key, label: QUESTION_LABELS[q.key] || q.key, outcome: q.outcome, outcomeLabel: OUTCOME_LABELS[q.outcome], misses: q.misses }));
  return {
    id: session.id,
    startedAt: session.startedAt,
    earned: session.earned,
    handed: session.earned === null ? null : describePieces(session.handed),
    jars: session.jars,
    status: session.finishedAt ? 'finished' : session.abandoned ? 'given-up' : 'in-progress',
    questions,
    stuck: questions.filter((q) => q.outcome === 'stuck'),
  };
}

const STATUS_LABELS = { finished: 'Finished', 'given-up': 'Started a new one instead', 'in-progress': 'Not finished yet' };

function dateText(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function card(session) {
  const s = summarize(session);
  const jars = s.jars ? `<p class="cqd-payday-jars">Give ${formatMoney(s.jars.give)} · Save ${formatMoney(s.jars.save)} · Spend ${formatMoney(s.jars.spend)}</p>` : '';
  const stuck = s.stuck.length
    ? `<p class="cqd-payday-stuck"><strong>Stuck on:</strong> ${s.stuck.map((q) => esc(q.label)).join('; ')}${s.stuck.some((q) => q.key === 'handed') ? `. He had ${esc(describePieces(session.handed))} entered for ${formatMoney(session.earned)}.` : '.'}</p>` : '';
  return `<article class="cqd-payday-card" data-status="${s.status}">
    <header><h3>${esc(dateText(s.startedAt))}</h3><span class="cqd-payday-badge is-${s.status}">${STATUS_LABELS[s.status]}</span></header>
    ${s.earned === null ? '<p class="cqd-muted">He had not entered an amount yet.</p>' : `<p><strong>Earned:</strong> ${formatMoney(s.earned)}</p><p><strong>Handed:</strong> ${esc(s.handed)}</p>`}
    ${jars}
    ${s.questions.length ? `<ul class="cqd-payday-questions">${s.questions.map((q) => `<li class="is-${q.outcome}"><span>${esc(q.label)}</span><strong>${esc(q.outcomeLabel)}${q.misses ? ` (${q.misses} ${q.misses === 1 ? 'miss' : 'misses'})` : ''}</strong></li>`).join('')}</ul>` : ''}
    ${stuck}
  </article>`;
}

// The Payday Helper section of Parent Mode: newest first, ten at most.
export function paydaySummaryHtml(payday) {
  const sessions = ((payday && payday.sessions) || []).filter((s) => s.earned !== null).slice(0, 10);
  return `<section class="cqd-payday-summary" aria-label="Payday Helper"><h2>Payday Helper</h2>
    <p class="cqd-muted">The app checks his work as he goes, so there is nothing to mark. This is how each payday went.</p>
    ${sessions.length ? sessions.map(card).join('') : '<p class="cqd-muted">No paydays yet.</p>'}
  </section>`;
}

import stages, { summary } from './expedited-path.js';
import { isStudyDone, toggleStudyDone } from './progress.js';

const app = document.getElementById('expedited-app');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const keyOf = (item) => item.key || item.url;

function stageStats(stage) {
  const items = stage.items || [];
  const doneItems = items.filter((item) => isStudyDone(keyOf(item)));
  const totalHours = items.reduce((sum, item) => sum + (item.hours || 0), 0);
  const doneHours = doneItems.reduce((sum, item) => sum + (item.hours || 0), 0);
  return {
    done: doneItems.length,
    total: items.length,
    pct: items.length ? Math.round((doneItems.length / items.length) * 100) : 0,
    totalHours,
    doneHours,
  };
}

function overallStats() {
  const all = stages.flatMap((s) => s.items || []);
  const done = all.filter((item) => isStudyDone(keyOf(item)));
  const hours = all.reduce((sum, item) => sum + (item.hours || 0), 0);
  const hoursDone = done.reduce((sum, item) => sum + (item.hours || 0), 0);
  return {
    done: done.length,
    total: all.length,
    pct: all.length ? Math.round((done.length / all.length) * 100) : 0,
    hours,
    hoursDone,
  };
}

function render() {
  const overall = overallStats();
  app.innerHTML = `
    <header class="exp-header">
      <div>
        <div class="eyebrow">CODEQUEST PRO · EMPLOYMENT-FIRST TRACK</div>
        <h1>${esc(summary.title)}</h1>
        <p>${esc(summary.subtitle)}</p>
      </div>
      <nav class="exp-nav" aria-label="Roadmap navigation">
        <a class="active" href="./expedited.html">Expedited Roadmap</a>
        <a href="./pro.html#/career-path">Full Roadmap</a>
        <a href="./pro.html#/career-progress">Full Progress</a>
        <a href="./pro.html">CodeQuest Pro</a>
      </nav>
    </header>

    <main class="exp-main">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="pill">PRIMARY TRACK</span>
          <h2>Get employable first. Go deep while you wait.</h2>
          <p>${esc(summary.target)}</p>
          <p class="cost-note">${esc(summary.costNote)}</p>
        </div>
        <div class="overall">
          <div class="ring" style="--p:${overall.pct}"><strong>${overall.pct}%</strong><span>complete</span></div>
          <div class="overall-meta">
            <b>${overall.done}/${overall.total}</b><span>checkpoints</span>
            <b>${overall.hoursDone}/${overall.hours}h</b><span>planned practice</span>
          </div>
        </div>
      </section>

      <section class="budget-card">
        <div><span>A+ Core 1</span><strong>$274</strong></div>
        <div><span>A+ Core 2</span><strong>$274</strong></div>
        <div><span>Network+</span><strong>$399</strong></div>
        <div><span>Security+</span><strong>$439</strong></div>
        <div class="budget-total"><span>All CompTIA exams</span><strong>$1,386</strong></div>
      </section>

      <div class="stage-list">
        ${stages.map(renderStage).join('')}
      </div>

      <p class="footnote">Prices are planning figures, not a promise of checkout price. Look for employer funding, student discounts, voucher bundles, promotions, and approved discounts before buying. The original CodeQuest Career Path remains unchanged and is your deeper backup curriculum.</p>
    </main>`;

  app.querySelectorAll('[data-check]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleStudyDone(button.dataset.check);
      render();
    });
  });
}

function renderStage(stage) {
  const st = stageStats(stage);
  return `
    <section class="stage-card${st.pct === 100 ? ' complete' : ''}">
      <div class="stage-top">
        <div class="stage-number">${stage.n}</div>
        <div class="stage-title">
          <h2>${esc(stage.title)}</h2>
          <p>${esc(stage.blurb)}</p>
        </div>
        <div class="stage-progress"><strong>${st.pct}%</strong><span>${st.done}/${st.total} done</span></div>
      </div>
      <div class="stage-meta">
        <span>⏱ ${esc(stage.timing)}</span>
        <span>🗓 ${esc(stage.months)}</span>
        <span>💵 ${esc(stage.cost)}</span>
        <span>📚 ~${stage.hours[0]}–${stage.hours[1]} hrs</span>
      </div>
      <div class="stage-bar"><i style="width:${st.pct}%"></i></div>
      <div class="check-list">
        ${(stage.items || []).map(renderItem).join('')}
      </div>
    </section>`;
}

function renderItem(item) {
  const key = keyOf(item);
  const done = isStudyDone(key);
  const name = item.url
    ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.name)} <span aria-hidden="true">↗</span></a>`
    : `<span>${esc(item.name)}</span>`;
  return `
    <div class="check-row${done ? ' done' : ''}">
      <button type="button" class="checkbox" data-check="${esc(key)}" aria-pressed="${done}" aria-label="Mark ${esc(item.name)} ${done ? 'not complete' : 'complete'}">${done ? '✓' : ''}</button>
      <div class="check-copy">${name}${item.hours ? `<small>~${item.hours}h</small>` : '<small>milestone / exam</small>'}</div>
    </div>`;
}

render();

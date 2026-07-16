// World lesson pages: ?world=world2&view=intro (start of world)
// or view=recap (end of world — review + jump back to any level).
import { getWorld, WORLDS, levelUnlocked, worldUnlocked, levelUrl } from '../levels/index.js';
import { getActiveProfile } from '../progress.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const params = new URLSearchParams(location.search);
const world = getWorld(params.get('world')) ?? WORLDS[0];
const view = params.get('view') === 'recap' ? 'recap' : 'intro';
const worldNumber = WORLDS.indexOf(world) + 1;

// locked worlds can't be previewed via URL
if (profile && !worldUnlocked(worldNumber - 1, profile)) location.replace('index.html');

const app = document.getElementById('app');
const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
};

document.title = `CodeQuest — ${world.name}`;
app.append(el(`<h1 class="logo">${world.emoji} World ${worldNumber} · ${world.name}</h1>`));

if (view === 'intro') {
  const intro = world.intro;
  const card = el(`<div class="card lesson">
    <h2>📖 Today's lesson</h2>
    <p class="concept">${world.concept}</p>
    <h3>What you'll learn</h3>
    <ul class="learn-list">${intro.learn.map((l) => `<li>${l}</li>`).join('')}</ul>
    <h3>Your controls</h3>
    <div class="block-guide">${intro.blocks
      .map(
        (b) => `<div class="block-row"><span class="block-icon">${b.icon}</span>
          <span><b>${b.name}</b> — ${b.text}</span></div>`
      )
      .join('')}</div>
    <p class="goal">🎯 ${intro.goal}</p>
    <button class="big-btn" id="start">${world.sandbox ? "🏗️ Start building" : `Start World ${worldNumber} ▶`}</button>
    <p><button class="link-btn" id="back">← back to the map</button></p>
  </div>`);
  card.querySelector('#start').onclick = () => {
    sounds.tap();
    if (world.sandbox) return void (location.href = 'build.html');
    const firstUndone = world.levels.find((l) => !(profile.stars[l.id] > 0)) ?? world.levels[0];
    location.href = levelUrl(world, firstUndone);
  };
  card.querySelector('#back').onclick = () => { location.href = 'index.html'; };
  app.append(card);
} else {
  const card = el(`<div class="card lesson">
    <h2>🎓 What you learned</h2>
    <ul class="learn-list">${world.recap.map((l) => `<li>${l}</li>`).join('')}</ul>
    <h3>${world.sandbox ? '' : 'Go back to any step'}</h3>
    <div class="level-grid small"></div>
    <div class="recap-actions"></div>
    <p><button class="link-btn" id="back">← back to the map</button></p>
  </div>`);
  const grid = card.querySelector('.level-grid');
  (world.levels ?? []).forEach((lvl, i) => {
    const stars = profile.stars[lvl.id] ?? 0;
    const unlocked = levelUnlocked(world, i, profile);
    const b = el(`<button class="level-btn ${unlocked ? '' : 'locked'}">
      ${unlocked ? i + 1 : '🔒'}
      <span class="stars">${stars ? '⭐'.repeat(stars) : ''}</span>
    </button>`);
    b.title = lvl.name;
    b.onclick = () => { sounds.tap(); location.href = levelUrl(world, lvl); };
    grid.append(b);
  });
  const actions = card.querySelector('.recap-actions');
  if (world.quiz) {
    const quizStars = profile.stars[`${world.id}-quiz`] ?? 0;
    const qb = el(`<button class="big-btn">📝 Take the quiz ${quizStars ? '⭐'.repeat(quizStars) : ''}</button>`);
    qb.onclick = () => { sounds.tap(); location.href = `quiz.html?world=${world.id}`; };
    actions.append(qb);
  }
  const nextWorld = WORLDS[worldNumber];
  if (nextWorld) {
    const nb = el(`<button class="big-btn" style="background:#4a90d9;box-shadow:0 4px 0 #2c5e94">${nextWorld.emoji} On to World ${worldNumber + 1} ▶</button>`);
    nb.onclick = () => { sounds.tap(); location.href = `world.html?world=${nextWorld.id}&view=intro`; };
    actions.append(nb);
  }
  card.querySelector('#back').onclick = () => { location.href = 'index.html'; };
  app.append(card);
}

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');

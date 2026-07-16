// Menu: profile picker, world map, parents corner. Plain DOM, no framework.
import { WORLDS, worldUnlocked, levelUnlocked, levelUrl } from '../levels/index.js';
import {
  getProfiles, getActiveProfile, setActiveProfile, createProfile,
  deleteProfile, streakToday, exportData, importData,
} from '../progress.js';
import { sounds } from './sounds.js';
import { ARMOR, armorUnlocked, getArmor, drawHero } from './hero.js';
import { setArmor } from '../progress.js';

const app = document.getElementById('app');
const AVATARS = ['🦊', '🐸', '🦄', '🤖', '🐱', '🐼', '🦁', '🐙'];

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
};

// profile names are kid-typed (and importable from backup files) — never
// trust them in innerHTML
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function header() {
  return `<h1 class="logo">🚀 CodeQuest</h1>
    <p class="tagline">Learn real coding, one adventure at a time</p>`;
}

// ---------- profile picker ----------
function showProfiles() {
  app.innerHTML = header();
  const card = el(`<div class="card"><h2>Who's playing?</h2><div class="profile-row"></div></div>`);
  const row = card.querySelector('.profile-row');
  for (const p of getProfiles()) {
    const b = el(`<button class="profile-btn"><span class="avatar">${p.avatar}</span>${esc(p.name)}</button>`);
    b.onclick = () => { sounds.tap(); setActiveProfile(p.id); showMap(); };
    row.append(b);
  }
  const add = el(`<button class="profile-btn add"><span class="avatar">➕</span>New explorer</button>`);
  add.onclick = () => { sounds.tap(); showCreate(); };
  row.append(add);
  app.append(card);
}

function showCreate() {
  app.innerHTML = header();
  let avatar = null;
  let mode = null;
  const card = el(`<div class="card">
    <h2>New explorer</h2>
    <p><input type="text" id="name" maxlength="14" placeholder="Your name" /></p>
    <h3>Pick your buddy</h3>
    <div class="avatar-grid"></div>
    <h3>How big an explorer are you?</h3>
    <div class="mode-row">
      <button data-mode="sprout">🌱 Little<small>ages 5–7 · picture blocks</small></button>
      <button data-mode="explorer">🌳 Big<small>ages 8–10 · word blocks</small></button>
    </div>
    <button class="big-btn" id="go" disabled>Let's go!</button>
    <p><button class="link-btn" id="back">← back</button></p>
  </div>`);
  const grid = card.querySelector('.avatar-grid');
  const goBtn = card.querySelector('#go');
  const nameInput = card.querySelector('#name');
  const ready = () => { goBtn.disabled = !(nameInput.value.trim() && avatar && mode); };
  for (const a of AVATARS) {
    const b = el(`<button>${a}</button>`);
    b.onclick = () => {
      sounds.tap();
      grid.querySelectorAll('button').forEach((x) => x.classList.remove('selected'));
      b.classList.add('selected');
      avatar = a;
      ready();
    };
    grid.append(b);
  }
  card.querySelectorAll('.mode-row button').forEach((b) => {
    b.onclick = () => {
      sounds.tap();
      card.querySelectorAll('.mode-row button').forEach((x) => x.classList.remove('selected'));
      b.classList.add('selected');
      mode = b.dataset.mode;
      ready();
    };
  });
  nameInput.oninput = ready;
  goBtn.onclick = () => {
    createProfile(nameInput.value.trim(), avatar, mode);
    sounds.win();
    showMap();
  };
  card.querySelector('#back').onclick = showProfiles;
  app.append(card);
}

// ---------- world map ----------
function showMap() {
  const p = getActiveProfile();
  if (!p) return showProfiles();
  app.innerHTML = header();

  const flame = p.streak.count > 0
    ? `<span class="streak">🔥 ${p.streak.count} day${p.streak.count > 1 ? 's' : ''}${streakToday(p) ? '' : ' — play today to keep it!'}</span>`
    : `<span class="streak">Play a level to start your streak! 🔥</span>`;
  const hello = el(`<div class="card hello-bar">
    <div class="who"><span class="hero-slot"></span><span class="avatar">${p.avatar}</span>${esc(p.name)}</div>
    ${flame}
    <span>
      <button class="link-btn" id="outfits">👕 outfits</button>
      <button class="link-btn" id="switch">switch player</button>
    </span>
  </div>`);
  hello.querySelector('.hero-slot').append(heroCanvas(p.armor, 44));
  hello.querySelector('#outfits').onclick = () => { sounds.tap(); showOutfits(); };
  hello.querySelector('#switch').onclick = showProfiles;
  app.append(hello);

  WORLDS.forEach((world, wi) => {
    if (!worldUnlocked(wi, p)) {
      app.append(el(`<div class="card coming">🔒 World ${wi + 1} · ${world.name} ${world.emoji} — beat World ${wi} boss to unlock!</div>`));
      return;
    }
    const card = el(`<div class="card">
      <h2>${world.emoji} World ${wi + 1} · ${world.name}</h2>
      <p>${world.concept}</p>
      <p><button class="link-btn lesson-link">📖 lesson: what you'll learn</button></p>
      <div class="level-grid"></div>
    </div>`);
    card.querySelector('.lesson-link').onclick = () => {
      sounds.tap();
      location.href = `world.html?world=${world.id}&view=intro`;
    };
    const grid = card.querySelector('.level-grid');
    world.levels.forEach((lvl, i) => {
      const starCount = p.stars[lvl.id] ?? 0;
      const unlocked = levelUnlocked(world, i, p);
      const boss = i === world.levels.length - 1;
      const b = el(`<button class="level-btn ${unlocked ? '' : 'locked'} ${boss ? 'boss' : ''}">
        ${unlocked ? (boss ? '👑' : i + 1) : '🔒'}
        <span class="stars">${starCount ? '⭐'.repeat(starCount) : unlocked ? '· · ·' : ''}</span>
      </button>`);
      b.title = lvl.name;
      b.onclick = () => { sounds.tap(); location.href = levelUrl(world, lvl); };
      grid.append(b);
    });
    if (world.quiz) {
      const bossDone = (p.stars[world.levels.at(-1).id] ?? 0) > 0;
      const quizStars = p.stars[`${world.id}-quiz`] ?? 0;
      const qb = el(`<button class="level-btn quiz ${bossDone ? '' : 'locked'}">
        ${bossDone ? '📝' : '🔒'}
        <span class="stars">${quizStars ? '⭐'.repeat(quizStars) : bossDone ? 'quiz' : ''}</span>
      </button>`);
      qb.onclick = () => { sounds.tap(); location.href = `quiz.html?world=${world.id}`; };
      grid.append(qb);
    }
    const recapReady = (p.stars[world.levels.at(-1).id] ?? 0) > 0;
    if (recapReady) {
      const r = el(`<p><button class="link-btn">🎓 review: what you learned</button></p>`);
      r.querySelector('button').onclick = () => {
        sounds.tap();
        location.href = `world.html?world=${world.id}&view=recap`;
      };
      card.append(r);
    }
    app.append(card);
  });
  app.append(el(`<div class="card coming">World 7 · Type Real Code (JavaScript) ⌨️ — coming soon!</div>`));
  const parents = el(`<p><button class="link-btn" id="parents">for grown-ups</button></p>`);
  parents.querySelector('#parents').onclick = showParents;
  app.append(parents);
}

// ---------- outfits ----------
function heroCanvas(armorId, size = 76) {
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = size * dpr;
  cv.height = size * dpr;
  cv.style.width = `${size}px`;
  cv.style.height = `${size}px`;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  drawHero(ctx, size / 2, size * 0.58, size * 0.82, getArmor(armorId));
  return cv;
}

function showOutfits() {
  const p = getActiveProfile();
  if (!p) return showProfiles();
  app.innerHTML = header();
  const card = el(`<div class="card">
    <h2>👕 Outfits</h2>
    <p>Beat a world's boss 👑 to unlock its armor!</p>
    <div class="outfit-grid"></div>
    <p><button class="link-btn" id="back">← back to the map</button></p>
  </div>`);
  const grid = card.querySelector('.outfit-grid');
  for (const a of ARMOR) {
    const unlocked = armorUnlocked(a, p);
    const wearing = (p.armor ?? 'starter') === a.id;
    const b = el(`<button class="outfit ${unlocked ? '' : 'locked'} ${wearing ? 'selected' : ''}"></button>`);
    b.append(heroCanvas(a.id));
    b.append(el(`<span class="outfit-name">${a.name}</span>`));
    b.append(el(`<small>${wearing ? '✅ wearing it!' : unlocked ? 'tap to wear' : `🔒 ${a.unlockText}`}</small>`));
    if (unlocked && !wearing) {
      b.onclick = () => { sounds.collect(); setArmor(a.id); showOutfits(); };
    }
    grid.append(b);
  }
  card.querySelector('#back').onclick = showMap;
  app.append(card);
}

// ---------- parents corner ----------
function showParents() {
  app.innerHTML = header();
  const allLevels = WORLDS.flatMap((w) => w.levels);
  const total = allLevels.length;
  const rows = getProfiles().map((p) => {
    const done = allLevels.filter((l) => p.stars[l.id]).length;
    const stars = Object.values(p.stars).reduce((a, b) => a + b, 0);
    return `<tr><td>${p.avatar} ${esc(p.name)}</td><td>${done}/${total} levels</td><td>${stars} ⭐</td><td>🔥 ${p.streak.count}</td>
      <td><button class="link-btn del" data-id="${p.id}">remove</button></td></tr>`;
  }).join('');
  const card = el(`<div class="card">
    <h2>Grown-ups corner</h2>
    <p>Each world teaches one real programming concept — World 1 <b>sequencing</b>,
    World 2 <b>loops</b>, World 3 <b>conditionals</b>, World 4 <b>functions</b>, World 5 <b>variables</b> — the five fundamentals — with events and real typed code next.
    Every world starts with a lesson, ends with a review, and (from World 2) a quiz
    that also re-tests earlier concepts. Aim for 1–2 levels a day; the streak rewards
    showing up, not bingeing.</p>
    <table class="parents"><tr><th>Player</th><th>Progress</th><th>Stars</th><th>Streak</th><th></th></tr>${rows}</table>
    <p>
      <button class="big-btn" id="export" style="font-size:1rem">Backup progress</button>
      <button class="big-btn" id="import" style="font-size:1rem;background:#4a90d9;box-shadow:0 4px 0 #2c5e94">Restore backup</button>
    </p>
    <p><button class="link-btn" id="back">← back to the map</button></p>
  </div>`);
  card.querySelector('#back').onclick = showMap;
  card.querySelector('#export').onclick = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'codequest-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  card.querySelector('#import').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      try {
        importData(await input.files[0].text());
        showParents();
      } catch {
        alert('That file is not a CodeQuest backup.');
      }
    };
    input.click();
  };
  card.querySelectorAll('.del').forEach((b) => {
    b.onclick = () => {
      if (confirm('Remove this player and all their progress?')) {
        deleteProfile(b.dataset.id);
        showParents();
      }
    };
  });
  app.append(card);
}

getActiveProfile() ? showMap() : showProfiles();

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');

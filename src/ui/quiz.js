// End-of-world quiz: one question at a time, instant feedback with the "why",
// stars saved as <worldId>-quiz. Tests this world AND earlier ones.
import { getWorld, WORLDS } from '../levels/index.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const world = getWorld(new URLSearchParams(location.search).get('world'));
if (!world?.quiz) location.replace('index.html');
const worldNumber = WORLDS.indexOf(world) + 1;

const app = document.getElementById('app');
const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
};

let current = 0;
let correct = 0;

function showQuestion() {
  const q = world.quiz[current];
  app.innerHTML = `<h1 class="logo">📝 World ${worldNumber} Quiz</h1>
    <p class="tagline">Question ${current + 1} of ${world.quiz.length}</p>`;
  const card = el(`<div class="card lesson">
    <h2 class="quiz-q">${q.q}</h2>
    <div class="quiz-choices"></div>
    <p class="quiz-why hidden"></p>
    <div class="recap-actions hidden"><button class="big-btn" id="next">Next ▶</button></div>
  </div>`);
  const choices = card.querySelector('.quiz-choices');
  const why = card.querySelector('.quiz-why');
  const nextRow = card.querySelector('.recap-actions');
  q.choices.forEach((text, i) => {
    const b = el(`<button class="quiz-choice">${text}</button>`);
    b.onclick = () => {
      if (!nextRow.classList.contains('hidden')) return; // already answered
      const right = i === q.answer;
      if (right) { correct++; sounds.collect(); } else { sounds.bump(); }
      b.classList.add(right ? 'right' : 'wrong');
      choices.children[q.answer].classList.add('right');
      why.textContent = (right ? '✅ ' : '💡 ') + q.why;
      why.classList.remove('hidden');
      nextRow.classList.remove('hidden');
    };
    choices.append(b);
  });
  card.querySelector('#next').onclick = () => {
    sounds.tap();
    current++;
    current < world.quiz.length ? showQuestion() : showResult();
  };
  app.append(card);
}

function showResult() {
  const total = world.quiz.length;
  const stars = correct === total ? 3 : correct >= Math.ceil(total * 0.7) ? 2 : 1;
  completeLevel(`${world.id}-quiz`, stars);
  sounds.win();
  app.innerHTML = `<h1 class="logo">📝 World ${worldNumber} Quiz</h1>`;
  const card = el(`<div class="card lesson" style="text-align:center">
    <h2>${correct === total ? 'Perfect score! 🏆' : correct >= total * 0.7 ? 'Great job! 🎉' : 'Good try! 💪'}</h2>
    <div class="win-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p>You got <b>${correct} of ${total}</b> right.</p>
    <div class="recap-actions">
      ${correct < total ? '<button class="big-btn" id="retry">Try again 🔄</button>' : ''}
      <button class="big-btn" id="map" style="background:#4a90d9;box-shadow:0 4px 0 #2c5e94">Back to the map 🗺️</button>
    </div>
  </div>`);
  card.querySelector('#retry')?.addEventListener('click', () => {
    sounds.tap();
    current = 0;
    correct = 0;
    showQuestion();
  });
  card.querySelector('#map').onclick = () => { location.href = 'index.html'; };
  app.append(card);
}

showQuestion();

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');

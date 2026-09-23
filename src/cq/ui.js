import './cq.css';
import { getActiveProfile, isUnlocked, getCq, requireUnlockedProfile, updateCq } from '../progress.js';
import { sounds } from '../ui/sounds.js';
import { BASE_HEARTS, COSMETICS, DEFAULT_LOOK, GEAR_SLOTS, ITEMS, LOOK_OPTIONS, RARITY, TRACK_LESSONS } from './items.js';
import {
  buyCosmetic, equip, getCosmetic, getItem, lockedTrackItems, maxHearts, normalizeCq, normalizeLook,
  passedForTrack, randomLook, rankFor, setProgress, takeOff, trackItems, traderStock, unequip, wear,
} from './character.js';
import { characterCanvas, drawCharacter, drawIcon } from './sprite.js';
import { getLesson, trackLessons } from './lessons/pack1.js';
import { lessonStatus } from './lesson-logic.js';
import { mountLesson } from './lesson-ui.js';
import { parseLessonHash, questCard } from './lesson-view.js';
import { mountTyping } from './typing/typing-ui.js';
import { isMode, LOCK_LABEL, MODE_TITLES, modeLocked, parseTypingHash, pickerHtml } from './typing/view.js';

const SLOT_LABELS = { head: 'Head', body: 'Body', feet: 'Feet', mainHand: 'Hand', offHand: 'Off-hand', back: 'Back', magic1: 'Magic 1', magic2: 'Magic 2' };
const FIELD_LABELS = { skin: 'Skin', hairStyle: 'Hair style', hairColor: 'Hair color', eyeColor: 'Eye color', shirtStyle: 'Shirt style', shirtColor: 'Shirt color', pantsColor: 'Pants', shoesColor: 'Shoes' };
const LAYER_LABELS = { hat: 'Hats', cape: 'Capes & wings', face: 'Face', hairFx: 'Hair effects', title: 'Titles', trail: 'Trails' };
const FACINGS = ['down', 'right', 'up', 'left'];
const FACING_LABELS = ['Front', 'Right', 'Back', 'Left'];
// Daily Work used to be a sixth tab here. It moved to its own dedicated page (daily.html /
// src/daily/), on each boy's own iPad — see docs/computer-quest/daily-work.md §0a. The shared
// content/state/schedule modules under src/cq/daily-work/ stay: that page imports their pure
// functions. Only the hub's own tab, rendering and event wiring were removed.
const TABS = ['Gear', 'Wardrobe', 'Trader', 'Quests', 'Typing'];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const app = document.getElementById('app');
const active = requireUnlockedProfile();
let cq, draft, preview = false, facingIndex = 0, tab = 'Gear', selectedItem = null, pendingBuy = null;
let animation = 0, message = '';
let lessonView = null, lessonEntry = '';
let typingView = null, typingEntry = '', typingFocus = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
try { const saved = sessionStorage.getItem('cq-tab'); if (TABS.includes(saved)) tab = saved; } catch { /* Private mode. */ }

if (active) {
  cq = getCq(active.id);
  if (!cq.track) {
    app.append(el('<section class="card cq-gate"><h1>Ask a grown-up to start Computer Quest for you</h1><a class="cq-button" href="index.html">← Back to map</a></section>'));
  } else {
    if (import.meta.env.DEV) {
      if (new URLSearchParams(location.search).get('dev') === 'all') {
        preview = true;
        cq = normalizeCq({ ...cq, owned: ITEMS.map((item) => item.id), cosmetics: COSMETICS.map((item) => item.id), gems: 999,
          lessonsPassed: [...TRACK_LESSONS.guided, ...TRACK_LESSONS.standard] });
      }
    }
    draft = { ...(cq.look || DEFAULT_LOOK) };
    showRoute();
    app.addEventListener('click', onClick);
    // #lesson/<id> and #practice/<id> show a lesson screen; #typing is the hub's Typing tab (mode picker) and
    // #typing/<mode> a typing run; no hash (or '#') is the hub. Browser Back returns to the hub.
    window.addEventListener('hashchange', showRoute);
    // Another tab may change profiles or revoke this track while the hub is open.
    window.addEventListener('storage', () => {
      if (preview) return;
      const profile = getActiveProfile();
      if (!profile || profile.id !== active.id || !isUnlocked(active.id)) { location.replace('index.html'); return; }
      cq = getCq(active.id);
      if (!cq.track) { location.replace('computer.html'); return; }
      // A lesson in progress rebuilds only if this lesson's saved state actually changed and there's
      // no unsaved in-screen input; otherwise the kid keeps working undisturbed.
      // A typing run is never rebuilt: its session lives only in memory until the text is done.
      if (typingView) { if (!typingView.inProgress()) typingView.refresh(); } else if (lessonView) lessonView.refreshFromStorage(); else render();
    });
    window.addEventListener('pagehide', () => cancelAnimationFrame(animation));
    window.addEventListener('pageshow', (event) => { if (event.persisted && !lessonView && !typingView) render(); });
  }
}

function saveCq(change) {
  cq = preview ? normalizeCq(change(cq)) : updateCq(active.id, change);
  return cq;
}
function showRoute() {
  const target = parseLessonHash(location.hash);
  // Any hop other than Quests → lesson (an in-lesson link, Back/Forward) means history.back() may not reach the hub.
  if (location.hash !== lessonEntry) lessonEntry = '';
  const previous = lessonView ? lessonView.lessonId : null;
  const previousTyping = typingView ? typingView.mode : null;
  if (lessonView) { lessonView.destroy(); lessonView = null; }
  if (typingView) { typingView.destroy(); typingView = null; }
  if (location.hash !== typingEntry) typingEntry = '';
  if (!preview) cq = getCq(active.id);
  const typing = parseTypingHash(location.hash);
  if (typing && cq.look !== null) {
    if (typing.mode && !modeLocked(typing.mode, cq)) {
      cancelAnimationFrame(animation);
      tab = 'Typing';
      try { sessionStorage.setItem('cq-tab', tab); } catch { /* Private mode. */ }
      lessonEntry = '';
      typingView = mountTyping({ app, mode: typing.mode, profileId: active.id, getCq: () => cq, save: saveCq, sound, onExit: exitTyping });
      return;
    }
    // #typing (or a locked / unknown mode) shows the picker in the hub's Typing tab.
    tab = 'Typing'; pendingBuy = null;
    if (typing.mode) message = `${MODE_TITLES[typing.mode]}: ${LOCK_LABEL}`;
  }
  if (target && cq.look !== null) {
    cancelAnimationFrame(animation);
    lessonView = mountLesson({ app, route: target.route, lessonId: target.id, nickname: active.name, getCq: () => cq, save: saveCq, sound, onExit: exitLesson });
    return;
  }
  lessonEntry = '';
  typingEntry = '';
  // Leaving a lesson returns to Quests, unless the new hash asked for the Typing tab.
  if (previous && !typing) { tab = 'Quests'; message = ''; }
  if (previousTyping) { tab = 'Typing'; message = ''; }
  if (typing || previousTyping) { try { sessionStorage.setItem('cq-tab', tab); } catch { /* Private mode. */ } }
  render();
  if (previous && !typing) focusAction('open-lesson', previous);
  if (previousTyping || typingFocus) {
    const focus = typingFocus || ['tab'];
    typingFocus = null;
    if (focus[0] === 'typing-mode') focusMode(focus[1]); else focusTab('Typing');
  }
}
function exitTyping(where) {
  const mode = typingView ? typingView.mode : null;
  typingFocus = where === 'picker' ? ['typing-mode', mode] : ['tab'];
  tab = 'Typing';
  try { sessionStorage.setItem('cq-tab', tab); } catch { /* Private mode. */ }
  // Opened from the Typing tab and still on that entry: step back so history stays hub -> run.
  if (typingEntry && typingEntry === location.hash) { typingEntry = ''; history.back(); return; }
  history.replaceState(null, '', location.pathname + location.search);
  showRoute();
}
function focusMode(mode) {
  const target = Array.from(app.querySelectorAll('[data-action="typing-mode"]')).find((b) => b.dataset.mode === mode);
  if (target) target.focus({ preventScroll: true });
}
function focusTab(name) {
  const target = app.querySelector(`[data-tab="${name}"]`);
  if (target) target.focus({ preventScroll: true });
}
function exitLesson() {
  // Opened from the Quests tab and still on that entry: step back so browser history stays hub → lesson.
  if (lessonEntry && lessonEntry === location.hash) { lessonEntry = ''; history.back(); return; }
  history.replaceState(null, '', location.pathname + location.search);
  showRoute();
}
function sound(name) {
  try { sounds[name](); } catch { /* Audio may be disabled; actions still work. */ }
}
function mutate(change, feedback = 'Saved', chime = 'tap') {
  try {
    if (preview) cq = normalizeCq(change(cq));
    else cq = updateCq(active.id, change);
    message = feedback; sound(chime); render();
    return true;
  } catch {
    message = 'Could not save that change. Please try again.';
    const status = app.querySelector('.cq-status');
    if (status) status.textContent = message;
    return false;
  }
}
function icon(entry, silhouette = false, size = 56) {
  return `<span class="cq-icon" data-icon="${esc(entry.id)}" data-silhouette="${silhouette}" data-size="${size}" aria-hidden="true"></span>`;
}
function rarity(entry) { return `style="--rarity:${esc(RARITY[entry.rarity])}"`; }
function button(action, label, data = '', cls = '') {
  return `<button type="button" class="cq-button ${cls}" data-action="${action}" ${data}>${label}</button>`;
}
function editor(creator) {
  return `<section class="cq-editor" aria-label="Hero look editor">
    <div class="cq-section-head"><div><span class="cq-eyebrow">YOUR LOOK</span><h2>${creator ? 'Make it yours' : 'Change your look'}</h2></div>${button('random', '🎲 Randomize')}</div>
    ${Object.keys(LOOK_OPTIONS).map((key) => `<fieldset><legend>${FIELD_LABELS[key]}</legend><div class="cq-options">${LOOK_OPTIONS[key].map((o, i) => {
      const name = o.name || (o.id === 'darkbrown' ? 'dark brown' : o.id);
      const label = key === 'skin' ? `Skin tone ${i + 1}` : o.hex ? `${FIELD_LABELS[key]}: ${name}` : name;
      return `<button type="button" class="${o.hex ? 'cq-swatch' : 'cq-chip'}" data-action="option" data-field="${key}" data-value="${esc(o.id)}" aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${draft[key] === o.id}" ${o.hex ? `style="--swatch:${esc(o.hex)}"` : ''}>${o.hex ? '<span aria-hidden="true">✓</span>' : esc(label)}</button>`;
    }).join('')}</div></fieldset>`).join('')}
    <div class="cq-actions">${button('save-look', creator ? 'Save my hero' : 'Save look', '', 'cq-primary')}${creator ? '' : button('cancel-look', 'Cancel')}</div>
    </section>`;
}
function hero(creator) {
  const set = setProgress(cq);
  const extraHearts = maxHearts(cq) - BASE_HEARTS;
  return `<aside class="cq-hero-panel">
    <div class="cq-stage"><span class="cq-stage-label">${creator ? 'HERO PREVIEW' : 'YOUR HERO'}</span>
      <button type="button" class="cq-hero" data-action="rotate" data-step="1" aria-label="Rotate hero right"><span class="cq-canvas-mount"></span></button>
      <div class="cq-platform" aria-hidden="true"></div>
    </div>
    <div class="cq-rotation">${button('rotate', '◀', 'data-step="-1" aria-label="Rotate hero left"')}<span class="cq-facing" aria-live="polite">${FACING_LABELS[facingIndex]}</span>${button('rotate', '▶', 'data-step="1" aria-label="Rotate hero right"')}</div>
    ${creator ? '<p class="cq-muted cq-preview-note">Your hero. Your style.<br>Change your look anytime.</p>' : `<div class="cq-set"><strong>${esc(set.name)} ${set.have}/${set.total}</strong><progress max="${set.total}" value="${set.have}" aria-label="${esc(set.name)} equipped"></progress><span>${set.active ? `✨ Set bonus active: +${extraHearts} ${extraHearts === 1 ? 'heart' : 'hearts'}` : 'Equip the full set for a bonus heart.'}</span></div>`}
    ${!creator && tab === 'Gear' ? slots() : ''}
  </aside>`;
}
function slots() {
  return `<div class="cq-slots" aria-label="Equipped gear">${GEAR_SLOTS.map((slot) => {
    const item = getItem(cq.equipped[slot]);
    const contents = `${item ? icon(item, false, 36) : '<span class="cq-empty-slot" aria-hidden="true">◇</span>'}<span>${SLOT_LABELS[slot]}</span>`;
    return slot === 'body' ? `<div class="cq-slot cq-future">${contents}<small>Coming in a future quest</small></div>`
      : `<button type="button" class="cq-slot" data-action="${item ? 'select' : 'empty-slot'}" data-id="${item ? esc(item.id) : ''}" aria-label="${esc(SLOT_LABELS[slot] + ': ' + (item ? item.name : 'Empty'))}" ${item ? rarity(item) : ''}>${contents}</button>`;
  }).join('')}</div>`;
}
function itemDetails(item) {
  const equippedSlot = GEAR_SLOTS.find((slot) => cq.equipped[slot] === item.id);
  return `<section class="cq-detail" ${rarity(item)} aria-label="Item details" tabindex="-1">
    <div class="cq-detail-heading">${icon(item, false, 90)}<div><span class="cq-rarity">${esc(item.rarity)}</span><h3>${esc(item.name)}</h3></div>${button('close-item', '×', 'aria-label="Close item details"')}</div>
    <p>${esc(item.flavor)}</p><p class="cq-effect">${esc(item.effect)}</p><div class="cq-actions">
    ${equippedSlot ? button('unequip', `Unequip ${SLOT_LABELS[equippedSlot]}`, `data-slot="${equippedSlot}"`) : ''}
    ${item.slot === 'magic' ? ['magic1', 'magic2'].filter((slot) => slot !== equippedSlot).map((slot) => button('equip', `Equip ${SLOT_LABELS[slot]}`, `data-id="${esc(item.id)}" data-slot="${slot}"`, 'cq-primary')).join('')
      : equippedSlot ? '' : button('equip', 'Equip', `data-id="${esc(item.id)}"`, 'cq-primary')}
    </div></section>`;
}
function gear() {
  const selected = getItem(selectedItem);
  return `<div class="cq-section-head"><div><span class="cq-eyebrow">EARNED IN QUESTS</span><h2>Your gear</h2></div><span class="cq-muted">${cq.owned.length} owned</span></div>
    <p class="cq-muted">Pass lessons. Collect gear. Build your set.</p>
    ${selected && cq.owned.includes(selected.id) ? itemDetails(selected) : ''}
    <div class="cq-inventory">${cq.owned.map((id) => {
      const item = getItem(id);
      return `<button type="button" class="cq-tile" data-action="select" data-id="${esc(id)}" ${rarity(item)} aria-pressed="${selectedItem === id}">${icon(item)}<strong>${esc(item.name)}</strong><span class="cq-rarity">${Object.values(cq.equipped).includes(id) ? 'Equipped' : esc(item.rarity)}</span></button>`;
    }).join('')}${lockedTrackItems(cq).map(({ item, lesson }) => `<article class="cq-tile cq-locked" ${rarity(item)}>${icon(item, true)}<strong>${esc(item.name)}</strong><small>Pass Lesson ${esc(lesson.toUpperCase())} · ${esc(getLesson(lesson).title)} to unlock</small></article>`).join('')}</div>`;
}
function wardrobe() {
  return `${editor(false)}<div class="cq-section-head cq-divider"><div><span class="cq-eyebrow">COLLECTED STYLE</span><h2>Your wardrobe</h2></div></div>
    ${Object.keys(LAYER_LABELS).map((layer) => {
      const owned = cq.cosmetics.map(getCosmetic).filter((c) => c.layer === layer);
      return `<section class="cq-layer"><h3>${LAYER_LABELS[layer]}</h3>${layer === 'hat' && cq.equipped.head ? '<p class="cq-muted">Your helmet hides hats. Take it off in Gear to show your hat.</p>' : ''}${layer === 'trail' ? '<p class="cq-muted">Trails appear in battle.</p>' : ''}
        ${owned.length ? `<div class="cq-inventory">${owned.map((c) => `<article class="cq-tile" ${rarity(c)}>${icon(c)}<strong>${esc(c.name)}</strong>${c.note ? `<small>${esc(c.note)}</small>` : ''}${button(cq.worn[layer] === c.id ? 'take-off' : 'wear', cq.worn[layer] === c.id ? 'Take off' : 'Wear', `data-id="${esc(c.id)}" data-layer="${layer}" aria-pressed="${cq.worn[layer] === c.id}"`)}</article>`).join('')}</div>` : '<p class="cq-empty">Find these in chests or at the Trader</p>'}</section>`;
    }).join('')}`;
}
function trader() {
  const stock = traderStock(cq);
  return `<div class="cq-section-head"><div><span class="cq-eyebrow">LOOKS ONLY · NO BATTLE POWER</span><h2>The Trader</h2></div></div><p class="cq-muted">Spend your gems on a new look.</p>
    ${!stock.length ? '<p class="cq-empty">You own everything here!</p>' : `<div class="cq-inventory">${stock.map((c) => {
      const short = Math.max(0, c.price - cq.gems);
      return `<article class="cq-tile" ${rarity(c)}>${icon(c)}<strong>${esc(c.name)}</strong><span class="cq-rarity">${esc(c.rarity)}</span>${c.note ? `<small>${esc(c.note)}</small>` : ''}<span class="cq-price">${c.price} 💎</span>
        ${pendingBuy === c.id ? `<div class="cq-confirm" role="group" aria-label="Confirm purchase"><p>Spend ${c.price} 💎 on ${esc(c.name)}?</p><div class="cq-actions">${button('buy-yes', 'Yes', `data-id="${esc(c.id)}"`, 'cq-primary')}${button('buy-no', 'No', `data-id="${esc(c.id)}"`)}</div></div>` : button('buy', short ? `Need ${short} more 💎` : 'Buy', `data-id="${esc(c.id)}" ${short ? 'disabled' : ''}`)}
      </article>`;
    }).join('')}</div>`}`;
}
function quests() {
  const lessons = trackLessons(cq.track);
  const passed = passedForTrack(cq);
  return `<div class="cq-section-head"><div><span class="cq-eyebrow">PACK 1 · YOUR NEXT GOALS</span><h2>Quest log</h2></div><span class="cq-muted">${passed.length}/${lessons.length} passed</span></div>
    <div class="cq-quests">${lessons.map((lesson) => {
      const status = lessonStatus(cq, lesson);
      const card = questCard(status, lesson, cq.lessons[lesson.id] ? cq.lessons[lesson.id].phase : 'warmup');
      const item = getItem(lesson.item);
      return `<article class="cq-quest cq-quest-${status} ${status === 'done' ? 'cq-passed' : ''}"><span class="cq-quest-number">${lesson.number}</span><div class="cq-quest-body"><span class="cq-eyebrow">LESSON ${esc(lesson.id.toUpperCase())} · ${esc(lesson.minutes)} MIN</span><h3>${esc(lesson.title)}</h3><span class="cq-quest-state">${esc(card.state)}</span><div class="cq-reward">${icon(item, status === 'locked', 40)}<span>${esc(item.name)}</span></div>${card.button ? button('open-lesson', esc(card.button), `data-id="${esc(lesson.id)}" data-route="${card.route}" aria-label="${esc(`${card.button.replace(/[▶🗝️]/gu, '').trim()}: Lesson ${lesson.id.toUpperCase()} ${lesson.title}`)}"`, 'cq-primary cq-quest-go') : ''}</div></article>`;
    }).join('')}</div>`;
}
function render() {
  cancelAnimationFrame(animation);
  const focus = document.activeElement;
  const focusKey = focus && app.contains(focus) ? [focus.dataset.action, focus.dataset.id, focus.dataset.slot, focus.dataset.tab] : null;
  const creator = cq.look === null;
  const rank = rankFor(cq), title = getCosmetic(cq.worn.title);
  app.innerHTML = `${preview ? '<div class="cq-dev">DEV PREVIEW — nothing is saved</div>' : ''}
    <header class="cq-top"><a class="cq-map" href="index.html">← Map</a><div class="cq-identity"><span class="cq-eyebrow">COMPUTER QUEST</span><h1>${creator ? 'Create your hero' : esc(active.name)}</h1>${!creator && title ? `<p>${esc(title.name)}</p>` : ''}</div>${creator ? '' : `<div class="cq-wallet"><span class="cq-badge" ${rarity(rank)}>Hero Rank · ${esc(rank.name)}</span><strong aria-label="${cq.gems} gems">💎 ${cq.gems}</strong></div>`}</header>
    <p class="cq-status" role="status">${esc(message)}</p>
    <main class="cq-layout ${creator ? 'cq-creator' : ''}">${hero(creator)}<div class="cq-content">
    ${creator ? `<div class="cq-panel">${editor(true)}</div>` : `<nav class="cq-tabs" aria-label="Hero hub">${TABS.map((name) => `<button type="button" data-action="tab" data-tab="${name}" aria-pressed="${tab === name}" aria-controls="cq-tab-panel">${name}</button>`).join('')}</nav><section id="cq-tab-panel" class="cq-panel" aria-label="${tab}">${({ Gear: gear, Wardrobe: wardrobe, Trader: trader, Quests: quests, Typing: () => pickerHtml(cq) })[tab]()}</section>`}
    </div></main>`;
  app.querySelectorAll('[data-icon]').forEach((mount) => {
    const size = Number(mount.dataset.size), canvas = document.createElement('canvas');
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * ratio); canvas.height = canvas.width;
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    drawIcon(ctx, 0, 0, canvas.width, mount.dataset.icon, { silhouette: mount.dataset.silhouette === 'true' });
    mount.append(canvas);
  });
  const canvas = characterCanvas(320, heroOptions(0));
  app.querySelector('.cq-canvas-mount').append(canvas);
  const ctx = canvas.getContext('2d');
  const frame = (time) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCharacter(ctx, canvas.width / 2, canvas.height * 0.86, Math.max(1, Math.floor(canvas.width / 50)), heroOptions(reducedMotion.matches ? 0 : (time % 3200) / 3200));
    animation = requestAnimationFrame(frame);
  };
  animation = requestAnimationFrame(frame);
  if (focusKey) {
    const match = Array.from(app.querySelectorAll('button')).find((b) => [b.dataset.action, b.dataset.id, b.dataset.slot, b.dataset.tab].every((v, i) => v === focusKey[i]));
    if (match) match.focus({ preventScroll: true });
  }
}
function heroOptions(bob) {
  return { look: cq.look === null || tab === 'Wardrobe' ? draft : cq.look, equipped: cq.equipped, worn: cq.worn,
    facing: FACINGS[facingIndex], bob, glow: setProgress(cq).active };
}
function focusAction(action, id) {
  const target = Array.from(app.querySelectorAll('[data-action]')).find((b) => b.dataset.action === action && (!id || b.dataset.id === id));
  if (target) target.focus({ preventScroll: true });
}
async function onClick(event) {
  if (lessonView || typingView) return; // Lesson and typing screens handle their own clicks.
  const b = event.target.closest('button[data-action]');
  if (!b || b.disabled) return;
  const action = b.dataset.action, id = b.dataset.id;
  if (action === 'rotate') {
    facingIndex = (facingIndex + Number(b.dataset.step) + 4) % 4;
    app.querySelector('.cq-facing').textContent = FACING_LABELS[facingIndex]; sound('tap');
  } else if (action === 'option') {
    draft = { ...draft, [b.dataset.field]: b.dataset.value };
    app.querySelectorAll(`[data-field="${b.dataset.field}"]`).forEach((o) => o.setAttribute('aria-pressed', String(o === b))); sound('tap');
  } else if (action === 'random') { draft = randomLook(); sound('tap'); render(); }
  else if (action === 'save-look') {
    const creator = cq.look === null;
    if (mutate((state) => ({ ...state, look: normalizeLook(draft) }), 'Hero saved', creator ? 'win' : 'collect') && creator) focusAction('tab');
  } else if (action === 'cancel-look') { draft = { ...cq.look }; message = 'Look changes cancelled'; render(); }
  else if (action === 'tab') {
    tab = b.dataset.tab; pendingBuy = null;
    if (parseTypingHash(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (tab === 'Wardrobe') draft = { ...cq.look };
    try { sessionStorage.setItem('cq-tab', tab); } catch { /* Private mode. */ }
    sound('tap'); render(); focusAction('tab');
    const selected = app.querySelector(`[data-tab="${tab}"]`); if (selected) selected.focus({ preventScroll: true });
  } else if (action === 'select') { selectedItem = id; sound('tap'); render(); app.querySelector('.cq-detail').focus({ preventScroll: true }); }
  else if (action === 'close-item') { const previous = selectedItem; selectedItem = null; render(); focusAction('select', previous); }
  else if (action === 'open-lesson') {
    const hash = `#${b.dataset.route}/${id}`;
    if (!parseLessonHash(hash)) return;
    sound('tap'); lessonEntry = hash; location.hash = hash;
  } else if (action === 'typing-mode') {
    const mode = b.dataset.mode;
    if (!isMode(mode)) return;
    if (modeLocked(mode, cq)) { message = `${MODE_TITLES[mode]}: ${LOCK_LABEL}`; app.querySelector('.cq-status').textContent = message; sound('tap'); return; }
    sound('tap'); typingEntry = `#typing/${mode}`; location.hash = typingEntry;
  } else if (action === 'empty-slot') { message = 'Choose an owned item to equip it here.'; app.querySelector('.cq-status').textContent = message; }
  else if (action === 'equip') { if (mutate((state) => equip(state, id, b.dataset.slot), `${getItem(id).name} equipped`)) focusAction('unequip'); }
  else if (action === 'unequip') { if (mutate((state) => unequip(state, b.dataset.slot), 'Gear removed')) focusAction('equip', selectedItem); }
  else if (action === 'wear') { if (mutate((state) => wear(state, id), `${getCosmetic(id).name} worn`)) focusAction('take-off', id); }
  else if (action === 'take-off') { if (mutate((state) => takeOff(state, b.dataset.layer), 'Cosmetic removed')) focusAction('wear', id); }
  else if (action === 'buy') { pendingBuy = id; sound('tap'); render(); focusAction('buy-yes', id); }
  else if (action === 'buy-no') { pendingBuy = null; render(); focusAction('buy', id); }
  else if (action === 'buy-yes') {
    if (mutate((state) => buyCosmetic(state, id), `${getCosmetic(id).name} added to your wardrobe`, 'collect')) { pendingBuy = null; focusAction('buy'); }
  }
}

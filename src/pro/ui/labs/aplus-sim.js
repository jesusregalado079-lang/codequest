// A+ labs: the declarative UI simulator (../../labs/aplus/sim.js) drawn as a Windows 11 desktop, a router admin page,
// an Android phone or a printer control panel. Real buttons, inputs, selects and switches; every string escaped.
// createSimArea() is one instance (the case page has one, the solution walkthrough a second, inert one).
import { createSim } from '../../labs/aplus/sim.js';
import { morph } from './aplus-dom.js';

let uid = 0;
const optValue = (o) => (o && typeof o === 'object' ? o.value : o);
const optLabel = (o) => (o && typeof o === 'object' ? (o.label ?? o.value) : o);
const stepOf = (step) => (step && typeof step === 'object' && step.do ? step.do : step) || {};

// Replays one solution / trapDemo step on a sim.
export function playSim(sim, step) {
  const d = stepOf(step);
  if (d.type === 'launch') return sim.launch(d.query);
  if (d.type === 'open') return sim.open(d.screenId);
  if (d.type === 'set') return sim.set(d.controlId, d.value);
  return sim.act(d.controlId, d.rowId ?? undefined, d.actionId ?? undefined);
}
export function simEngine(kase) {
  const sim = createSim(kase);
  return { apply: (step) => playSim(sim, step), check: () => sim.check() };
}

const APP_ICON = { devmgmt: '🖥️', diskmgmt: '💽', eventvwr: '📋', reliability: '📈', services: '⚙️', lusrmgr: '👥', settings: '⚙️', taskmgr: '📊', security: '🛡️', taskschd: '🗓️', certmgr: '📜', gpedit: '📑', perfmon: '📈', compmgmt: '🧰' };
// Windows 11 chrome drawn with inline SVG (no images): Start logo, search, Run, tray icons, desktop icons.
const SVG = {
  win: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect x="1" y="1" width="8.5" height="8.5" rx="1" fill="#0f6cbd"/><rect x="10.5" y="1" width="8.5" height="8.5" rx="1" fill="#2b88d8"/><rect x="1" y="10.5" width="8.5" height="8.5" rx="1" fill="#2b88d8"/><rect x="10.5" y="10.5" width="8.5" height="8.5" rx="1" fill="#4aa0e6"/></svg>',
  search: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 10l4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  run: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4 6.5l2 1.5-2 1.5M7.5 10h3.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  chev: '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 7.5L6 4.5l3 3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  wifi: '<svg viewBox="0 0 16 16" width="15" height="15"><path d="M1.5 6a9.5 9.5 0 0113 0M3.8 8.6a6.2 6.2 0 018.4 0M6 11.1a3 3 0 014 0" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="13.3" r="1" fill="currentColor"/></svg>',
  vol: '<svg viewBox="0 0 16 16" width="15" height="15"><path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M10.5 5.5a3.5 3.5 0 010 5M12.5 3.5a6.3 6.3 0 010 9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  bat: '<svg viewBox="0 0 20 16" width="18" height="15"><rect x="1" y="4" width="15" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="2.8" y="5.8" width="9" height="4.4" rx="1" fill="currentColor"/><rect x="16.5" y="6.5" width="2" height="3" rx="0.8" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="4" fill="#f7b500"/><g stroke="#f7b500" stroke-width="1.6" stroke-linecap="round"><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6L16 16M4 16l1.4-1.4M14.6 5.4L16 4"/></g></svg>',
  bin: '<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><path d="M10 12h20l-2 23H12z" fill="#dfe9f5" stroke="#6b8bb0" stroke-width="1.5"/><path d="M8 12h24" stroke="#6b8bb0" stroke-width="2" stroke-linecap="round"/><path d="M16 9h8" stroke="#6b8bb0" stroke-width="2" stroke-linecap="round"/><path d="M16 16v15M20 16v15M24 16v15" stroke="#9fb6d1" stroke-width="1.3"/></svg>',
  pc: '<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><rect x="5" y="7" width="30" height="20" rx="2" fill="#1d6fb8" stroke="#0b4f8a" stroke-width="1.5"/><rect x="8" y="10" width="24" height="14" fill="#5fb3f0"/><path d="M15 33h10M20 27v6" stroke="#cfd8e3" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const DESK_ICONS = `<div class="ap-desk-icons">${[['bin', 'Recycle Bin'], ['pc', 'This PC']].map(([k, name]) => `<button type="button" class="ap-desk-icon" data-desk-icon="${name}">${SVG[k]}<span>${name}</span></button>`).join('')}</div>`;
const CLOCK = (() => { const d = new Date(); return { time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), date: d.toLocaleDateString('en-US') }; })();

const appStyle = (app) => {
  const id = `${app?.id || ''} ${app?.icon || ''}`;
  if (/settings/.test(id)) return 'settings';
  if (/security/.test(id)) return 'security';
  if (/taskmgr/.test(id)) return 'taskmgr';
  if (/reliability/.test(id)) return 'classic';
  return 'mmc';
};
const looksLikeCommand = (q) => /[.:/\\]/.test(String(q));

export function createSimArea({ kase, esc, demo = false, onAction = () => {} }) {
  const sim = createSim(kase);
  const skin = kase.skin || 'windows';
  const win = skin === 'windows';
  const id = `aps${uid += 1}`;
  const screens = new Map((kase.screens || []).map((s) => [s.id, s]));
  const apps = kase.apps || [];
  const appById = new Map(apps.map((a) => [a.id, a]));
  const home = win ? null : kase.home || kase.screens?.[0]?.id || null;
  const fresh = () => ({ desktop: true, search: false, searchText: '', run: false, runText: '', runError: '', runInfo: '', menu: null, confirm: null,
    toast: '', toastKind: '', hist: [], last: {}, pending: {}, leave: null, saved: '' });
  let ui = fresh();
  let locked = false;
  let flashKey = null;
  const root = document.createElement('div');
  root.className = `ap-sim ap-skin-${skin}`;

  // ----- static structure: per-app nav items (windows), router menu groups, the link graph for Show me -----
  const appScreens = (appId) => (kase.screens || []).filter((s) => s.app === appId);
  function navItems(appId) {
    const app = appById.get(appId);
    const items = [];
    const seen = new Set();
    const add = (screen, label) => { if (screen && screens.has(screen) && !seen.has(screen)) { seen.add(screen); items.push({ screen, label }); } };
    if (app?.home) {
      const st = appStyle(app);
      const h = screens.get(app.home);
      add(app.home, st === 'settings' || st === 'security' ? 'Home' : (h?.crumbs?.[0] && !/\{\{/.test(h.crumbs[0]) ? h.crumbs[0] : h?.title || app.name));
    }
    appScreens(appId).forEach((s) => (s.controls || []).forEach((c) => { if (c.type === 'link' && /^nav-/.test(c.id)) add(c.screen, c.label || screens.get(c.screen)?.title); }));
    return items;
  }
  function routerGroups() {
    const groups = [];
    const byKey = new Map();
    for (const s of kase.screens || []) {
      const crumbs = s.crumbs || [];
      const key = crumbs.length > 1 ? crumbs[0] : s.title;
      if (!byKey.has(key)) { const g = { key, head: null, children: [] }; byKey.set(key, g); groups.push(g); }
      if (crumbs.length > 1) byKey.get(key).children.push(s);
      else byKey.get(key).head = s;
    }
    return groups;
  }
  // Edges between screens (links, buttons and row actions that open a screen) for the Show me path.
  function edgesFrom(screenId) {
    const s = screens.get(screenId);
    const out = [];
    for (const c of s?.controls || []) {
      if (c.type === 'link' && c.screen) out.push({ to: c.screen, hop: { kind: 'ctl', controlId: c.id } });
      if (c.type === 'button' && c.action?.open && !c.action.set) out.push({ to: c.action.open, hop: { kind: 'ctl', controlId: c.id } });
      if (c.type === 'list') (c.rows || []).forEach((r) => (r.actions || []).forEach((a) => { if (a.action?.open && !a.action.set) out.push({ to: a.action.open, hop: { kind: 'row', controlId: c.id, rowId: r.id, actionId: a.id } }); }));
    }
    if (win && s?.app) navItems(s.app).forEach((n) => out.push({ to: n.screen, hop: { kind: 'nav', screen: n.screen } }));
    if (!win) (kase.screens || []).forEach((t) => { if (skin === 'router') out.push({ to: t.id, hop: { kind: 'nav', screen: t.id } }); });
    if (!win && home && skin !== 'router') out.push({ to: home, hop: { kind: 'home' } });
    return out;
  }
  function firstHop(fromId, toId) {
    if (!fromId || fromId === toId) return null;
    const seen = new Set([fromId]);
    const queue = edgesFrom(fromId).map((e) => ({ at: e.to, first: e.hop }));
    while (queue.length) {
      const { at, first } = queue.shift();
      if (at === toId) return first;
      if (seen.has(at)) continue;
      seen.add(at);
      edgesFrom(at).forEach((e) => queue.push({ at: e.to, first }));
    }
    return null;
  }
  const screenOfControl = (controlId) => {
    const cur = screens.get(sim.screenId);
    if (cur?.controls?.some((c) => c.id === controlId)) return cur.id;
    return (kase.screens || []).find((s) => (s.controls || []).some((c) => c.id === controlId))?.id || null;
  };
  const appOfQuery = (q) => {
    const want = String(q ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    for (const a of apps) for (const e of [a.name, ...(a.launch || [])]) {
      const text = e && typeof e === 'object' ? e.q : e;
      if (String(text ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === want) return a;
    }
    return null;
  };

  // ----- actions -----
  function after(r, { nav = false, prev = null, quiet = false } = {}) {
    if (r.ok && nav && prev && sim.screenId !== prev) ui.hist.push(prev);
    const s = screens.get(sim.screenId);
    if (s?.app) ui.last[s.app] = sim.screenId;
    // a plain navigation reports the new screen's title: the screen already shows it, so no toast;
    // quiet: the message is already shown where the learner typed (the Run box)
    ui.toast = quiet || (r.ok && r.msg === sim.view()?.title) ? '' : r.msg || '';
    ui.toastKind = r.info ? 'info' : r.ok ? 'ok' : 'error';
    ui.menu = null;
    flashKey = null;
    render();
    onAction(r);
    return r;
  }
  const run = (fn, opts) => after(fn(), opts);
  function navTo(screen) {
    const prev = sim.screenId;
    const cur = screens.get(prev);
    const link = cur?.controls?.find((c) => c.type === 'link' && c.screen === screen);
    const v = sim.view();
    const linkVisible = link && v?.controls?.find((c) => c.id === link.id)?.enabled;
    ui.desktop = false;
    return run(() => (linkVisible ? sim.act(link.id) : sim.open(screen)), { nav: true, prev });
  }
  function launch(query, fromRun) {
    const r = sim.launch(query);
    // r.info: a real Windows tool this case does not model. Nothing opened, so the desktop, a minimized window, the
    // Back history and the Run box stay as they were; the explanation shows in the Run box (neutral, not an error).
    if (r.info) { ui.runError = ''; ui.runInfo = fromRun && ui.run ? r.msg : ''; return after(r, { quiet: !!ui.runInfo }); }
    if (r.ok) { ui.desktop = false; ui.search = false; ui.run = false; ui.runText = ''; ui.runError = ''; ui.runInfo = ''; ui.searchText = ''; ui.hist = []; }
    else if (fromRun) { ui.runError = r.msg; ui.runInfo = ''; }
    return after(r);
  }
  function searchMatches(text) {
    const q = String(text || '').trim().toLowerCase();
    if (!q) return [];
    return apps.filter((a) => [a.name, ...(a.launch || []).map((e) => (e && typeof e === 'object' ? e.q : e))]
      .some((t) => String(t || '').toLowerCase().includes(q)));
  }
  function searchEnter() {
    const text = ui.searchText.trim();
    if (!text) return;
    if (appOfQuery(text)) return launch(text, false);
    const best = searchMatches(text)[0];
    if (best) return launch(best.name, false);
    ui.toast = `No results for "${text}".`;
    ui.toastKind = 'info';
    render();
    return null;
  }
  function setValue(controlId, value) {
    if (skin === 'router') { ui.pending = { ...ui.pending, [controlId]: value }; ui.saved = ''; render(); return null; }
    return run(() => sim.set(controlId, value));
  }
  function saveRouter() {
    const entries = Object.entries(ui.pending);
    if (!entries.length) return null;
    const merged = { ok: true, msg: 'Settings saved.', goalsChanged: [], trapsHit: [] };
    for (const [cid, value] of entries) {
      const r = sim.set(cid, value);
      merged.goalsChanged.push(...r.goalsChanged);
      merged.trapsHit.push(...r.trapsHit);
      if (!r.ok) { merged.ok = false; merged.msg = r.msg; }
    }
    ui.pending = {};
    ui.saved = merged.ok ? 'Settings saved.' : '';
    return after(merged);
  }
  // A page button acts on what the learner typed on this screen, not on the last saved value (router-05 Add domain,
  // router-03 Apply, win-07 Save). A text field that still has focus has not sent its change event (a click that does
  // not move focus), so blur it to commit it the usual way; on the router skin typed values wait in ui.pending for
  // Save, so save them now. A Cancel button commits nothing: it is there to drop the edits. Returns a failed save.
  function commitFields(c) {
    if (c?.type === 'link' || /^cancel$/i.test(String(c?.label || '').trim())) return null;
    const el = document.activeElement;
    if (root.contains(el) && el.matches('.ap-input[data-ctl]')) el.blur();
    return skin === 'router' && Object.keys(ui.pending).length ? saveRouter() : null;
  }
  // Twin buttons share a label and differ only by visibleIf (the Save that refuses and the Save that saves): once the
  // typed value is committed the clicked twin can be hidden, so the visible button with the same label runs instead.
  function twinOf(controlId) {
    const v = sim.view();
    const c = v?.controls?.find((x) => x.id === controlId);
    if (c?.type !== 'button' || (c.visible && c.enabled)) return controlId;
    return v.controls.find((x) => x.type === 'button' && x.visible && x.enabled && x.label === c.label)?.id ?? controlId;
  }
  function activate(controlId, rowId, actionId, openerKey) {
    const saved = commitFields(sim.view()?.controls?.find((x) => x.id === controlId));
    if (saved && !saved.ok) return saved;
    controlId = twinOf(controlId);
    const v = sim.view();
    const c = v?.controls?.find((x) => x.id === controlId);
    let action = null;
    if (c?.type === 'button') action = c.action;
    if (c?.type === 'list') action = c.rows?.find((r) => r.id === rowId && r.visible)?.actions?.find((a) => a.id === actionId)?.action;
    if (!demo && action?.confirm) {
      // a row action's menu item disappears with its menu, so focus goes back to the row's menu button
      const from = openerKey || (root.contains(document.activeElement) ? document.activeElement?.dataset?.fk : null);
      const opener = rowId && from && from.startsWith('act:') && root.querySelector(`[data-fk="${CSS.escape(`menu:${controlId}::${rowId}`)}"]`) ? `menu:${controlId}::${rowId}` : from;
      ui.menu = null; ui.confirm = { text: action.confirm, controlId, rowId, actionId, openerKey: opener }; render(); return null;
    }
    if (c?.type === 'link') return navTo(c.screen);
    const prev = sim.screenId;
    return run(() => sim.act(controlId, rowId, actionId), { nav: true, prev });
  }
  function back() {
    const prev = ui.hist.pop();
    if (prev) return run(() => sim.open(prev));
    if (!win && home && sim.screenId !== home) return run(() => sim.open(home));
    return null;
  }
  function goHome() {
    if (win || !home || sim.screenId === home) return null;
    ui.hist = [];
    return run(() => sim.open(home));
  }
  function switchApp(appId) {
    const target = ui.last[appId] || appById.get(appId)?.home;
    const cur = screens.get(sim.screenId);
    ui.desktop = false;
    if (cur?.app === appId) { render(); return null; }
    ui.hist = [];
    return run(() => sim.open(target));
  }

  // ----- rendering -----
  const fk = (key) => `data-fk="${esc(key)}"`;
  const flashAttr = (key) => (flashKey === key ? ' ap-flash' : '');
  const lbl = (c) => c.label || c.text || c.id;

  function infoHtml(c) {
    const head = c.label && (c.values || c.text) ? `<div class="ap-info-h">${esc(c.label)}</div>` : '';
    if (Array.isArray(c.values) && c.values.length) {
      const rows = c.values.map((v) => (Array.isArray(v) ? `<div><dt>${esc(v[0])}</dt><dd>${esc(v.slice(1).join(' '))}</dd></div>` : `<div class="wide"><dd>${esc(v)}</dd></div>`)).join('');
      return `<div class="ap-info">${head}<dl>${rows}</dl></div>`;
    }
    const text = c.text !== undefined ? c.text : c.label;
    return text ? `<p class="ap-info-t">${esc(text)}</p>` : '';
  }

  function inputHtml(c) {
    const lid = `${id}-${c.id}`;
    const pend = Object.hasOwn(ui.pending, c.id);
    const value = pend ? ui.pending[c.id] : c.value;
    const dis = c.enabled ? '' : ' disabled';
    const fl = flashAttr(`ctl:${c.id}`);
    if (c.type === 'toggle') {
      const on = !!value;
      return `<div class="ap-field ap-toggle-row${pend ? ' dirty' : ''}"><span class="ap-lbl" id="${lid}-l">${esc(lbl(c))}</span>
        <button type="button" role="switch" aria-checked="${on}" aria-labelledby="${lid}-l" class="ap-switch${fl}" data-ctl="${esc(c.id)}" data-kind="toggle" ${fk(`ctl:${c.id}`)}${dis}><span class="ap-knob" aria-hidden="true"></span><span class="ap-sw-t" aria-hidden="true">${on ? 'On' : 'Off'}</span></button></div>`;
    }
    if (c.type === 'select') {
      const opts = c.options || [];
      if (skin === 'phone') {
        return `<fieldset class="ap-radios${fl}" data-ctl="${esc(c.id)}" data-kind="radio"${dis}><legend>${esc(lbl(c))}</legend>${opts.map((o, i) => `
          <label class="ap-radio${flashAttr(`ctl:${c.id}:${i}`)}"><input type="radio" name="${lid}" value="${i}" data-opt="${i}" data-ctl="${esc(c.id)}" data-kind="radio" data-val="${esc(String(optValue(o)))}" ${fk(`ctl:${c.id}:${i}`)}${optValue(o) === value ? ' checked' : ''}${dis}><span>${esc(optLabel(o))}</span></label>`).join('')}</fieldset>`;
      }
      return `<div class="ap-field${pend ? ' dirty' : ''}"><label class="ap-lbl" for="${lid}">${esc(lbl(c))}</label>
        <select id="${lid}" class="ap-select${fl}" data-ctl="${esc(c.id)}" data-kind="select" ${fk(`ctl:${c.id}`)}${dis}>${opts.some((o) => optValue(o) === value) ? '' : '<option value="" selected disabled>(not set)</option>'}${opts.map((o, i) => `<option value="${i}"${optValue(o) === value ? ' selected' : ''}>${esc(optLabel(o))}</option>`).join('')}</select></div>`;
    }
    const type = c.type === 'password' ? 'password' : c.type === 'number' ? 'number' : 'text';
    const extra = c.type === 'number' ? `${c.min !== undefined ? ` min="${esc(c.min)}"` : ''}${c.max !== undefined ? ` max="${esc(c.max)}"` : ''} inputmode="numeric"` : ' spellcheck="false" autocapitalize="off" autocomplete="off"';
    return `<div class="ap-field${pend ? ' dirty' : ''}"><label class="ap-lbl" for="${lid}">${esc(lbl(c))}</label>
      <input id="${lid}" type="${type}" class="ap-input${fl}" data-ctl="${esc(c.id)}" data-kind="${type}" value="${esc(value ?? '')}"${extra} ${fk(`ctl:${c.id}`)}${dis}></div>`;
  }

  function columnsOf(c) {
    if (Array.isArray(c.columns) && c.columns.length) return c.columns;
    if (typeof c.label === 'string' && c.label.includes(' | ')) return c.label.split(' | ');
    return null;
  }
  const rowKey = (c, r) => `${c.id}::${r.id}`;
  function rowActions(c, r) { return (r.actions || []).filter((a) => a.visible); }
  function rowMenu(c, r) {
    const acts = rowActions(c, r);
    if (!acts.length) return '';
    const key = rowKey(c, r);
    const open = ui.menu === key;
    const name = (r.cells || []).filter(Boolean).slice(-1)[0] || r.id;
    return `<span class="ap-menuwrap"><button type="button" class="ap-rowmenu${flashAttr(`menu:${key}`)}" data-rowmenu="${esc(key)}" aria-haspopup="menu" aria-expanded="${open}" aria-label="Actions for ${esc(name)}" ${fk(`menu:${key}`)}><span aria-hidden="true">⋯</span></button>${open ? `
      <span class="ap-menu" role="menu" aria-label="${esc(name)}">${acts.map((a) => `<button type="button" role="menuitem" class="ap-menuitem${flashAttr(`act:${key}:${a.id}`)}" data-ctl="${esc(c.id)}" data-row="${esc(r.id)}" data-act="${esc(a.id)}" ${fk(`act:${key}:${a.id}`)}${a.enabled ? '' : ' disabled'}>${esc(a.label || a.id)}</button>`).join('')}</span>` : ''}</span>`;
  }
  function inlineActions(c, r) {
    return rowActions(c, r).map((a) => `<button type="button" class="ap-btn small${flashAttr(`act:${rowKey(c, r)}:${a.id}`)}" data-ctl="${esc(c.id)}" data-row="${esc(r.id)}" data-act="${esc(a.id)}" ${fk(`act:${rowKey(c, r)}:${a.id}`)}${a.enabled ? '' : ' disabled'}>${esc(a.label || a.id)}</button>`).join('');
  }
  const statusMark = (status) => {
    if (!status) return '';
    const warn = /\(Code \d+\)|not installed|problem|error/i.test(status);
    const off = /disabled/i.test(status);
    return `${warn ? '<span class="ap-bang" aria-hidden="true">!</span>' : off ? '<span class="ap-off" aria-hidden="true">↓</span>' : ''}<span class="visually-hidden">Status: ${esc(status)}</span>`;
  };
  function listHtml(c) {
    const rows = (c.rows || []).filter((r) => r.visible);
    const cols = columnsOf(c);
    const caption = cols ? (c.columns ? c.label : '') : c.label;
    if (skin === 'phone') {
      return `<div class="ap-plist">${caption ? `<div class="ap-plist-h">${esc(caption)}</div>` : ''}<ul>${rows.map((r) => {
        const acts = rowActions(c, r);
        const [main, ...rest] = (r.cells || []).map(String);
        const body = `<span class="ap-pl-main">${esc(main ?? r.id)}</span>${rest.length ? `<span class="ap-pl-sub">${esc(rest.join(' · '))}</span>` : ''}`;
        if (acts.length === 1) return `<li><button type="button" class="ap-prow${flashAttr(`act:${rowKey(c, r)}:${acts[0].id}`)}" data-ctl="${esc(c.id)}" data-row="${esc(r.id)}" data-act="${esc(acts[0].id)}" ${fk(`act:${rowKey(c, r)}:${acts[0].id}`)}${acts[0].enabled ? '' : ' disabled'}><span>${body}</span><span class="ap-chev" aria-hidden="true">›</span></button></li>`;
        return `<li><div class="ap-prow static"><span>${body}</span>${acts.length ? `<span class="ap-pl-acts">${inlineActions(c, r)}</span>` : ''}</div></li>`;
      }).join('')}</ul></div>`;
    }
    if (win && !cols && rows.length && rows.every((r) => (r.cells || []).length === 2)) {
      // Device Manager style: devices grouped under their category
      const groups = [];
      rows.forEach((r) => { const g = groups.find((x) => x.name === r.cells[0]); if (g) g.rows.push(r); else groups.push({ name: r.cells[0], rows: [r] }); });
      return `<div class="ap-tree" role="group" aria-label="${esc(c.label || '')}">${groups.map((g) => `<div class="ap-tree-g"><div class="ap-tree-cat"><span aria-hidden="true">⌄</span> ${esc(g.name)}</div><ul>${g.rows.map((r) => `
        <li class="ap-tree-row" data-rowkey="${esc(rowKey(c, r))}"><span class="ap-tree-name">${statusMark(r.status)}${esc(r.cells[1])}</span>${win ? rowMenu(c, r) : inlineActions(c, r)}</li>`).join('')}</ul></div>`).join('')}</div>`;
    }
    const head = cols ? `<thead><tr>${cols.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}${rows.some((r) => rowActions(c, r).length) ? '<th scope="col"><span class="visually-hidden">Actions</span></th>' : ''}</tr></thead>` : '';
    return `<div class="ap-tablewrap" role="region" aria-label="${esc(c.label || 'List')}" tabindex="0"><table class="ap-table">${caption ? `<caption>${esc(caption)}</caption>` : ''}${head}<tbody>${rows.length ? rows.map((r) => `
      <tr data-rowkey="${esc(rowKey(c, r))}">${(r.cells || []).map((cell, i) => (i === 0 ? `<th scope="row">${statusMark(r.status)}${esc(cell)}</th>` : `<td>${esc(cell)}</td>`)).join('')}<td class="ap-acts">${win ? rowMenu(c, r) : inlineActions(c, r)}</td></tr>`).join('') : `<tr><td class="ap-empty">Nothing to show.</td></tr>`}</tbody></table></div>`;
  }

  function controlHtml(c) {
    if (!c.visible) return '';
    if (c.type === 'info') return infoHtml(c);
    if (c.type === 'list') return listHtml(c);
    if (['toggle', 'select', 'text', 'password', 'number'].includes(c.type)) return inputHtml(c);
    if (c.type === 'link') {
      const cls = skin === 'phone' || (win && ['settings', 'security'].includes(appStyle(appById.get(screens.get(sim.screenId)?.app)))) || skin === 'printer' ? 'ap-linkrow' : 'ap-btn';
      return `<button type="button" class="${cls}${flashAttr(`ctl:${c.id}`)}" data-ctl="${esc(c.id)}" data-kind="link" data-goto="${esc(c.screen || '')}" ${fk(`ctl:${c.id}`)}${c.enabled ? '' : ' disabled'}><span>${esc(lbl(c))}</span>${cls === 'ap-linkrow' ? '<span class="ap-chev" aria-hidden="true">›</span>' : ''}</button>`;
    }
    if (c.type === 'button') {
      const danger = /forget|reset|erase|delete|remove|clear storage|factory/i.test(lbl(c)) ? ' danger' : '';
      // data-mk: twin buttons (same label, one visible at a time) are one element to the morph, so a change event that
      // swaps the visible twin on mousedown patches the button under the pointer instead of replacing it (and eating the click)
      return `<button type="button" class="ap-btn${skin === 'phone' ? ' text' : ''}${danger}${flashAttr(`ctl:${c.id}`)}" data-ctl="${esc(c.id)}" data-kind="button" data-mk="btn:${esc(lbl(c))}" ${fk(`ctl:${c.id}`)}${c.enabled ? '' : ' disabled'}>${esc(lbl(c))}</button>`;
    }
    return '';
  }
  // Buttons and links that are dialog actions (OK, Cancel, Next, Save, Apply...) gather in a footer row.
  const isFooter = (c) => (c.type === 'button' || c.type === 'link') && /^(ok|cancel|next|finish|apply|save|close|back|yes|no)$/i.test(String(c.label || '').trim());
  function controlsHtml(v, { skipNav = false } = {}) {
    const list = (v?.controls || []).filter((c) => c.visible && !(skipNav && c.type === 'link' && /^nav-/.test(c.id)));
    const body = list.filter((c) => !(win && isFooter(c)));
    const foot = win ? list.filter(isFooter) : [];
    return `<div class="ap-controls">${body.map(controlHtml).join('')}</div>${foot.length ? `<div class="ap-dlgfoot">${foot.map(controlHtml).join('')}</div>` : ''}`;
  }

  function confirmHtml() {
    if (!ui.confirm) return '';
    const okLabel = skin === 'phone' ? 'OK' : win ? 'Yes' : 'OK';
    const noLabel = skin === 'phone' ? 'Cancel' : win ? 'No' : 'Cancel';
    return `<dialog class="ap-confirm-back" role="alertdialog" aria-modal="true" aria-labelledby="${id}-cf" style="box-sizing:border-box;border:0;max-width:none;max-height:none;width:100%;height:100%;margin:0;padding:16px"><div class="ap-confirm"><p id="${id}-cf">${esc(ui.confirm.text)}</p>
      <div class="ap-dlgfoot"><button type="button" class="ap-btn primary" data-confirm-ok ${fk('confirm-ok')}>${okLabel}</button><button type="button" class="ap-btn" data-confirm-no ${fk('confirm-no')}>${noLabel}</button></div></div></dialog>`;
  }
  const toastHtml = () => (ui.toast ? `<div class="ap-toast ${ui.toastKind}" role="status">${esc(ui.toast)}</div>` : '<div class="ap-toast" role="status"></div>');

  function windowsHtml(v) {
    const cur = v ? screens.get(sim.screenId) : null;
    const app = cur ? appById.get(cur.app) : null;
    const showWin = v && !ui.desktop;
    const st = appStyle(app);
    const nav = app ? navItems(app.id) : [];
    const crumbs = (v?.crumbs || []).filter(Boolean);
    const heading = st === 'settings' ? (crumbs.length ? crumbs.filter((x, i) => !(i === 0 && x === 'Settings')).join(' › ') || v.title : v?.title) : v?.title;
    const used = sim.used.apps;
    const matches = searchMatches(ui.searchText);
    const winHtml = showWin ? `
      <div class="ap-window ap-app-${st}" role="group" aria-label="${esc(app?.name || v.title)} window">
        <div class="ap-titlebar"><span class="ap-appicon" aria-hidden="true">${APP_ICON[app?.icon] || APP_ICON[app?.id] || '🗔'}</span><span class="ap-wtitle">${esc(st === 'mmc' || st === 'classic' ? v.title : app?.name || v.title)}</span>
          <button type="button" class="ap-wbtn" data-back ${fk('back')} aria-label="Back"${ui.hist.length ? '' : ' disabled'}>←</button>
          <button type="button" class="ap-wbtn close" data-close ${fk('close')} aria-label="Close ${esc(app?.name || 'window')}">✕</button></div>
        ${st === 'mmc' ? '<div class="ap-menubar" aria-hidden="true"><span>File</span><span>Action</span><span>View</span><span>Help</span></div>' : ''}
        <div class="ap-wbody${nav.length > 1 ? ' has-nav' : ''}">
          ${nav.length > 1 ? `<nav class="ap-wnav" aria-label="${esc(app?.name || '')} navigation"><ul>${nav.map((n) => `<li><button type="button" class="ap-navitem${flashAttr(`nav:${n.screen}`)}" data-nav="${esc(n.screen)}" ${fk(`nav:${n.screen}`)}${n.screen === sim.screenId ? ' aria-current="page"' : ''}>${esc(n.label)}</button></li>`).join('')}</ul></nav>` : ''}
          <div class="ap-wmain">
            ${crumbs.length && st !== 'settings' ? `<div class="ap-crumbs">${crumbs.map(esc).join(' <span aria-hidden="true">›</span> ')}</div>` : ''}
            <h3 class="ap-wh">${esc(heading || '')}</h3>
            ${controlsHtml(v, { skipNav: nav.length > 1 && st !== 'settings' && st !== 'security' })}
          </div>
        </div>
        ${toastHtml()}
      </div>` : `${DESK_ICONS}<p class="ap-desk-tip">Start search or Run (Windows+R) opens any tool.</p>${toastHtml()}`;
    const runHtml = ui.run ? `
      <form class="ap-run" data-runform aria-labelledby="${id}-runt"><div class="ap-titlebar"><span class="ap-wtitle" id="${id}-runt">Run</span><button type="button" class="ap-wbtn close" data-run-cancel aria-label="Close Run">✕</button></div>
        <p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
        <div class="ap-field"><label class="ap-lbl" for="${id}-runq">Open:</label><input id="${id}-runq" class="ap-input ap-run-input${flashAttr('run-input')}" data-run-input value="${esc(ui.runText)}" spellcheck="false" autocapitalize="off" autocomplete="off" ${fk('run-input')}></div>
        ${ui.runError ? `<p class="ap-run-err" role="alert">${esc(ui.runError)}</p>` : ''}
        ${ui.runInfo ? `<p class="ap-run-info" role="status">${esc(ui.runInfo)}</p>` : ''}
        <div class="ap-dlgfoot"><button type="submit" class="ap-btn primary${flashAttr('run-ok')}" data-run-ok ${fk('run-ok')}>OK</button><button type="button" class="ap-btn" data-run-cancel ${fk('run-cancel')}>Cancel</button></div></form>` : '';
    const searchHtml = ui.search ? `
      <div class="ap-flyout" role="region" aria-label="Search results">${ui.searchText.trim() ? (matches.length ? `<div class="ap-fly-h">Best match</div><ul>${matches.map((a) => `<li><button type="button" class="ap-fly-item" data-launch-app="${esc(a.id)}" ${fk(`fly:${a.id}`)}><span aria-hidden="true">${APP_ICON[a.icon] || APP_ICON[a.id] || '🗔'}</span><span>${esc(a.name)}<small>App</small></span></button></li>`).join('')}</ul>` : `<p class="ap-fly-none">No apps match "${esc(ui.searchText.trim())}".</p>`) : '<p class="ap-fly-none">Type the name of a tool, a console file (devmgmt.msc) or a Settings page.</p>'}</div>` : '';
    return `<div class="ap-desktop">${winHtml}${runHtml}${searchHtml}${confirmHtml()}</div>
      <div class="ap-taskbar" role="toolbar" aria-label="Taskbar">
        <span class="ap-tb-left" aria-hidden="true"><span class="ap-weather">${SVG.sun}<span>72°F<small>Sunny</small></span></span></span>
        <span class="ap-tb-center">
          <button type="button" class="ap-start${flashAttr('start')}" data-start aria-label="Start" ${fk('start')}>${SVG.win}</button>
          <form class="ap-searchbox" data-searchform role="search"><label for="${id}-sq" class="visually-hidden">Search</label><span class="ap-search-ico" aria-hidden="true">${SVG.search}</span><input id="${id}-sq" class="ap-search-input${flashAttr('search')}" data-search placeholder="Search" value="${esc(ui.searchText)}" spellcheck="false" autocapitalize="off" autocomplete="off" ${fk('search')}></form>
          <button type="button" class="ap-runbtn${flashAttr('run')}" data-run-open ${fk('run')} title="Run (Windows+R)" aria-label="Run (Windows+R)">${SVG.run}<span>Run</span></button>
          <span class="ap-tasks">${used.map((aid) => { const a = appById.get(aid); if (!a) return ''; const on = !ui.desktop && cur?.app === aid; return `<button type="button" class="ap-task${on ? ' on' : ''}${flashAttr(`task:${aid}`)}" data-task="${esc(aid)}" aria-pressed="${on}" ${fk(`task:${aid}`)}><span aria-hidden="true">${APP_ICON[a.icon] || APP_ICON[a.id] || '🗔'}</span><span class="ap-task-t">${esc(a.name)}</span></button>`; }).join('')}</span>
        </span>
        <span class="ap-tray" aria-hidden="true"><span class="ap-tray-ico">${SVG.chev}</span><span class="ap-tray-ico">${SVG.wifi}${SVG.vol}${SVG.bat}</span><span class="ap-clock"><span>${esc(CLOCK.time)}</span><span>${esc(CLOCK.date)}</span></span></span>
      </div>`;
  }

  function routerHtml(v) {
    const dirty = Object.keys(ui.pending).length > 0;
    const hasInputs = (v?.controls || []).some((c) => c.visible && ['toggle', 'select', 'text', 'password', 'number'].includes(c.type));
    const item = (s, child) => `<li><button type="button" class="ap-rt-item${child ? ' child' : ''}${flashAttr(`nav:${s.id}`)}" data-nav="${esc(s.id)}" ${fk(`nav:${s.id}`)}${s.id === sim.screenId ? ' aria-current="page"' : ''}>${esc(s.title)}</button></li>`;
    const menu = routerGroups().map((g) => (g.head ? item(g.head, false) : `<li class="ap-rt-group">${esc(g.key)}</li>`) + g.children.map((c) => item(c, true)).join('')).join('');
    return `<div class="ap-rt">
      <div class="ap-rt-top"><span class="ap-rt-logo" aria-hidden="true">◉</span><span class="ap-rt-brand">Router admin</span><span class="ap-rt-user">Signed in as admin</span></div>
      <div class="ap-rt-body">
        <nav class="ap-rt-menu" aria-label="Router menu"><ul>${menu}</ul></nav>
        <div class="ap-rt-page">
          ${(v?.crumbs || []).length > 1 ? `<div class="ap-crumbs">${v.crumbs.map(esc).join(' <span aria-hidden="true">›</span> ')}</div>` : ''}
          <h3 class="ap-wh">${esc(v?.title || '')}</h3>
          ${ui.leave ? `<div class="ap-rt-leave" role="alertdialog" aria-labelledby="${id}-lv"><p id="${id}-lv">You have unsaved changes on this page.</p><div class="ap-dlgfoot"><button type="button" class="ap-btn primary" data-leave-save ${fk('leave-save')}>Save and continue</button><button type="button" class="ap-btn" data-leave-discard ${fk('leave-discard')}>Discard changes</button></div></div>` : ''}
          ${controlsHtml(v)}
          ${hasInputs ? `<div class="ap-rt-save"><button type="button" class="ap-btn primary${flashAttr('save')}" data-save ${fk('save')}${dirty ? '' : ' disabled'}>Save</button><button type="button" class="ap-btn" data-discard ${fk('discard')}${dirty ? '' : ' disabled'}>Cancel</button><span class="ap-rt-state" role="status">${dirty ? 'Unsaved changes' : esc(ui.saved)}</span></div>` : ''}
          ${toastHtml()}
        </div>
      </div>${confirmHtml()}</div>`;
  }

  // Phone cases: Android screens in an Android frame, iPhone screens in an iOS frame (the case's platform/os field when it
  // has one, else the place the screen names: "Dana's iPhone"), and places that are not a phone (a desk, a headset) as
  // a plain scene with Back and Home.
  function phoneKind(v) {
    const place = placeOf(v);
    const hint = String(kase.platform || kase.os || '').toLowerCase();
    if (/iphone|ipad|\bios\b/i.test(`${place} ${v?.title || ''}`)) return 'ios';
    if (/android|pixel|galaxy/i.test(place)) return 'android';
    if (/^at the desk$|\bdesk$|headset|earbuds?|speaker|\bwatch\b/i.test(place) && !/phone|tablet/i.test(place)) return 'scene';
    return hint === 'ios' || hint === 'ipados' ? 'ios' : 'android';
  }
  const homeTitle = () => { const h = screens.get(home); return h ? (/\{\{/.test(h.title) ? (h.crumbs || [])[0] || 'Home' : h.title) : 'Home'; };
  const canBack = () => ui.hist.length > 0 || sim.screenId !== home;
  function backLabel(v) {
    const prev = ui.hist.length ? screens.get(ui.hist[ui.hist.length - 1]) : null;
    if (prev) return /\{\{/.test(prev.title) ? (prev.crumbs || []).slice(-1)[0] || 'Back' : prev.title;
    const crumbs = v?.crumbs || [];
    return crumbs.length > 1 ? crumbs[crumbs.length - 2] : homeTitle();
  }
  function phoneHtml(v) {
    const kind = phoneKind(v);
    const place = `<div class="ap-ph-place"><span aria-hidden="true">📍</span> ${esc(placeOf(v))}</div>`;
    if (kind === 'scene') return `${ctxBar(v)}<div class="ap-scene" role="group" aria-label="${esc(placeOf(v) || v?.title || '')}"><h3 class="ap-wh">${esc(v?.title || '')}</h3>${controlsHtml(v)}${toastHtml()}</div>${confirmHtml()}`;
    if (kind === 'ios') {
      return `<div class="ap-phone ap-ios">${place}<div class="ap-ios-frame">
        <div class="ap-ios-status" aria-hidden="true"><span class="ap-ios-time">9:41</span><span class="ap-ios-island"></span><span class="ap-ios-icons"><i class="sig"></i><i class="sig"></i><i class="sig"></i><i class="sig"></i>${SVG.wifi}${SVG.bat}</span></span></div>
        <div class="ap-ios-nav">${canBack() ? `<button type="button" class="ap-ios-back${flashAttr('back')}" data-back ${fk('back')}><span aria-hidden="true">‹</span> ${esc(backLabel(v))}</button>` : '<span></span>'}</div>
        <h3 class="ap-wh ap-ios-title">${esc(v?.title || '')}</h3>
        <div class="ap-ios-body">${controlsHtml(v)}</div>
        ${toastHtml()}
        <button type="button" class="ap-ios-home${flashAttr('home')}" data-home ${fk('home')} aria-label="Home: ${esc(homeTitle())}"${sim.screenId === home ? ' disabled' : ''}><span aria-hidden="true"></span></button>
        ${confirmHtml()}
      </div></div>`;
    }
    return `<div class="ap-phone">${place}<div class="ap-ph-frame">
      <div class="ap-ph-status" aria-hidden="true"><span>9:41</span><span>▂▄▆ ◔ ▮</span></div>
      <div class="ap-ph-head"><button type="button" class="ap-ph-back${flashAttr('back')}" data-back ${fk('back')} aria-label="Back"${canBack() ? '' : ' disabled'}>←</button><h3 class="ap-wh">${esc(v?.title || '')}</h3></div>
      <div class="ap-ph-body">${controlsHtml(v)}</div>
      ${toastHtml()}
      <div class="ap-ph-nav"><button type="button" data-back aria-label="Back" ${fk('back2')}${canBack() ? '' : ' disabled'}>◁</button><button type="button" class="${flashAttr('home').trim()}" data-home aria-label="Home: ${esc(homeTitle())}" ${fk('home')}>○</button><span aria-hidden="true">□</span></div>
      ${confirmHtml()}
    </div></div>`;
  }

  // Printer cases move between places: the control panel (an LCD), the output tray (a printed page), the printer
  // itself (doors, tray) and the desk or PC next to it. crumbs[0] names the place.
  const placeOf = (v) => String((v?.crumbs || [])[0] || '');
  function ctxBar(v) {
    const h = screens.get(home);
    return `<div class="ap-ctxbar"><span class="ap-ctx"><span aria-hidden="true">📍</span> ${esc(placeOf(v) || v?.title || '')}</span>
      <span class="ap-ctx-keys"><button type="button" class="ap-btn small" data-back ${fk('back')}${ui.hist.length || sim.screenId !== home ? '' : ' disabled'}>← Back</button><button type="button" class="ap-btn small${flashAttr('home')}" data-home ${fk('home')}${sim.screenId === home ? ' disabled' : ''}>⌂ ${esc(h ? (/\{\{/.test(h.title) ? (h.crumbs || [])[0] || 'Home' : h.title) : 'Home')}</button></span></div>`;
  }
  function printerHtml(v) {
    const place = placeOf(v);
    const controls = (v?.controls || []).filter((c) => c.visible);
    const crumbs = (v?.crumbs || []).slice(1, -1).join(' › ');
    let body;
    if (/control panel/i.test(place)) {
      body = `<div class="ap-printer"><div class="ap-pr-body">
        <div class="ap-pr-lcd" role="group" aria-label="Printer control panel display">
          <div class="ap-pr-top"><h3 class="ap-wh">${esc(v?.title || '')}</h3>${crumbs ? `<span class="ap-crumbs">${esc(crumbs)}</span>` : ''}</div>
          <div class="ap-controls">${controls.map(controlHtml).join('')}</div>
          ${toastHtml()}
        </div>
        <div class="ap-pr-keys" aria-hidden="true"><span class="ap-led"></span><span>OK</span><span>▲</span><span>▼</span></div>
      </div></div>`;
    } else if (/output tray|printed/i.test(`${place} ${v?.title || ''}`)) {
      body = `<div class="ap-paper" role="group" aria-label="Printed page"><div class="ap-paper-h">${esc(v?.title || 'Printed page')}</div>${controls.map(controlHtml).join('')}${toastHtml()}</div>`;
    } else {
      body = `<div class="ap-scene" role="group" aria-label="${esc(place || v?.title || '')}"><h3 class="ap-wh">${esc(v?.title || '')}</h3>${crumbs ? `<div class="ap-crumbs">${esc(crumbs)}</div>` : ''}${controlsHtml(v)}${toastHtml()}</div>`;
    }
    return `${ctxBar(v)}${body}${confirmHtml()}`;
  }

  const wiredModals = new WeakSet();
  function render() {
    const v = sim.view();
    const focusKey = root.contains(document.activeElement) ? document.activeElement?.dataset?.fk : null;
    const oldModal = root.querySelector('dialog.ap-confirm-back');
    if (oldModal?.open) oldModal.close();
    const body = win ? windowsHtml(v) : skin === 'router' ? routerHtml(v) : skin === 'phone' ? phoneHtml(v) : printerHtml(v);
    morph(root, body);
    root.dataset.screen = sim.screenId || '';
    root.classList.toggle('locked', locked);
    const modal = root.querySelector('dialog.ap-confirm-back');
    if (ui.confirm && modal) {
      if (!modal.open) modal.showModal();
      if (!wiredModals.has(modal)) { wiredModals.add(modal); modal.addEventListener('cancel', (e) => { e.preventDefault(); if (ui.confirm) closeConfirm(); }); }
    }
    const want = ui.confirm ? 'confirm-ok' : ui.leave ? 'leave-save' : focusKey;
    if (!demo && want) {
      const el = root.querySelector(`[data-fk="${CSS.escape(want)}"]`);
      if (el && !el.disabled) el.focus({ preventScroll: true });
    }
    if (!demo && ui.menu) {
      const first = root.querySelector('.ap-menu [role="menuitem"]:not([disabled])');
      if (first && document.activeElement?.dataset?.rowmenu === ui.menu) first.focus({ preventScroll: true });
    }
  }

  function focusOpener(confirm) {
    if (!confirm?.openerKey) return;
    root.querySelector(`[data-fk="${CSS.escape(confirm.openerKey)}"]`)?.focus({ preventScroll: true });
  }
  function closeConfirm() {
    const confirm = ui.confirm;
    ui.confirm = null;
    ui.toast = 'Cancelled.';
    ui.toastKind = 'info';
    render();
    focusOpener(confirm);
  }

  // ----- events -----
  function valueFrom(el) {
    const v = sim.view();
    const c = v?.controls?.find((x) => x.id === el.dataset.ctl);
    if (!c) return undefined;
    if (c.type === 'select') return optValue((c.options || [])[Number(el.dataset.opt ?? el.value)]);
    if (c.type === 'number') return el.value === '' ? NaN : Number(el.value);
    return el.value;
  }
  if (!demo) {
    root.addEventListener('click', (e) => {
      if (locked) return;
      const t = e.target.closest('button, [data-launch-app]');
      if (!t || !root.contains(t) || t.disabled) {
        if (ui.menu && !e.target.closest('.ap-menu')) { ui.menu = null; render(); }
        return;
      }
      const d = t.dataset;
      if (d.confirmOk !== undefined) { const c = ui.confirm; ui.confirm = null; const prev = sim.screenId; const result = run(() => sim.act(c.controlId, c.rowId, c.actionId), { nav: true, prev }); focusOpener(c); return result; }
      if (d.confirmNo !== undefined) return closeConfirm();
      if (d.leaveSave !== undefined) { const to = ui.leave; ui.leave = null; saveRouter(); return navTo(to); }
      if (d.leaveDiscard !== undefined) { const to = ui.leave; ui.leave = null; ui.pending = {}; return navTo(to); }
      if (d.rowmenu) { ui.menu = ui.menu === d.rowmenu ? null : d.rowmenu; return render(); }
      if (d.act) return activate(d.ctl, d.row, d.act, d.fk);
      if (d.kind === 'toggle') { const cur = Object.hasOwn(ui.pending, d.ctl) ? ui.pending[d.ctl] : t.getAttribute('aria-checked') === 'true'; return setValue(d.ctl, !cur); }
      if (d.kind === 'link' || d.kind === 'button') return activate(d.ctl, undefined, undefined, d.fk);
      if (d.nav) {
        if (skin === 'router' && Object.keys(ui.pending).length && d.nav !== sim.screenId) { ui.leave = d.nav; return render(); }
        return navTo(d.nav);
      }
      if (d.save !== undefined) return saveRouter();
      if (d.discard !== undefined) { ui.pending = {}; ui.saved = ''; return render(); }
      if (d.back !== undefined) return back();
      if (d.home !== undefined) return goHome();
      if (d.close !== undefined) { ui.desktop = true; ui.toast = ''; return render(); }
      if (d.deskIcon) { ui.toast = `${d.deskIcon} opens File Explorer, which this ticket does not need. Use Start search or Run to open a tool.`; ui.toastKind = 'info'; return render(); }
      if (d.task) return switchApp(d.task);
      if (d.start !== undefined) { ui.search = !ui.search; ui.run = false; render(); if (ui.search) root.querySelector('[data-search]')?.focus(); return null; }
      if (d.runOpen !== undefined) { ui.run = true; ui.search = false; ui.runError = ''; ui.runInfo = ''; render(); root.querySelector('[data-run-input]')?.focus(); return null; }
      if (d.runCancel !== undefined) { ui.run = false; ui.runError = ''; ui.runInfo = ''; return render(); }
      if (d.launchApp) return launch(appById.get(d.launchApp)?.name, false);
      return null;
    });
    root.addEventListener('submit', (e) => {
      e.preventDefault();
      if (locked) return;
      if (e.target.matches('[data-runform]')) { ui.runText = root.querySelector('[data-run-input]').value; launch(ui.runText, true); }
      if (e.target.matches('[data-searchform]')) { ui.searchText = root.querySelector('[data-search]').value; searchEnter(); }
    });
    root.addEventListener('input', (e) => {
      if (e.target.matches('[data-search]')) {
        ui.searchText = e.target.value; ui.search = true; ui.run = false;
        const pos = e.target.selectionStart;
        render();
        const s = root.querySelector('[data-search]');
        if (s) { s.focus(); try { s.setSelectionRange(pos, pos); } catch { /* not a text field */ } }
      }
      if (e.target.matches('[data-run-input]')) ui.runText = e.target.value;
      // a router field is unsaved as soon as it is typed in (not only on blur), so Save and Cancel work on the first click
      if (skin === 'router' && !locked && e.target.matches('.ap-input[data-ctl]')) {
        const value = valueFrom(e.target);
        if (value !== undefined) setValue(e.target.dataset.ctl, value);
      }
    });
    root.addEventListener('change', (e) => {
      if (locked) return;
      const el = e.target;
      if (!el.dataset.ctl || el.dataset.kind === 'toggle') return;
      const value = valueFrom(el);
      if (value === undefined) return;
      setValue(el.dataset.ctl, value);
    });
    root.addEventListener('keydown', (e) => {
      // the confirmation is modal: Tab and Shift+Tab cycle through its buttons only
      if (e.key === 'Tab' && ui.confirm) {
        const items = [...root.querySelectorAll('dialog.ap-confirm-back[open] button:not([disabled])')];
        if (items.length) {
          e.preventDefault();
          const i = items.indexOf(document.activeElement);
          items[(i + (e.shiftKey ? items.length - 1 : 1) + items.length) % items.length].focus();
          return;
        }
      }
      if (e.key === 'Escape') {
        if (ui.confirm) { e.preventDefault(); closeConfirm(); return; }
        if (ui.menu) { const key = ui.menu; ui.menu = null; render(); root.querySelector(`[data-rowmenu="${CSS.escape(key)}"]`)?.focus(); return; }
        if (ui.run) { ui.run = false; render(); root.querySelector('[data-run-open]')?.focus(); return; }
        if (ui.search) { ui.search = false; render(); return; }
      }
      if (ui.menu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const items = [...root.querySelectorAll('.ap-menu [role="menuitem"]:not([disabled])')];
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
      }
      // Enter in a text field commits it (the change event) without leaving the field
      if (e.key === 'Enter' && e.target.matches('.ap-input[data-ctl]')) { e.preventDefault(); e.target.blur(); e.target.focus(); }
    });
    root.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('[data-rowkey]');
      if (!row || locked || !win) return;
      const btn = row.querySelector('[data-rowmenu]');
      if (!btn) return;
      e.preventDefault();
      ui.menu = row.dataset.rowkey; render();
      root.querySelector('.ap-menu [role="menuitem"]:not([disabled])')?.focus();
    });
    root.addEventListener('dblclick', (e) => {
      const row = e.target.closest('[data-rowkey]');
      if (!row || locked || e.target.closest('button')) return;
      const [cid, rid] = row.dataset.rowkey.split('::');
      const c = sim.view()?.controls?.find((x) => x.id === cid);
      const r = c?.rows?.find((x) => x.id === rid && x.visible);
      const a = r?.actions?.find((x) => x.visible && x.enabled);
      if (a) activate(cid, rid, a.id);
    });
  }

  // ----- Show me and the walkthrough -----
  function directKey(step) {
    const d = stepOf(step);
    const v = sim.view();
    if (d.type === 'launch') {
      const app = appOfQuery(d.query);
      if (app && sim.used.apps.includes(app.id) && !ui.desktop && screens.get(sim.screenId)?.app === app.id) return null;
      return looksLikeCommand(d.query) ? 'run' : 'search';
    }
    if (d.type === 'open') {
      if (d.screenId === sim.screenId) return null;
      if (root.querySelector(`[data-nav="${CSS.escape(d.screenId)}"]`)) return `nav:${d.screenId}`;
      const link = v?.controls?.find((c) => c.visible && c.enabled && c.type === 'link' && c.screen === d.screenId);
      return link ? `ctl:${link.id}` : null;
    }
    const c = v?.controls?.find((x) => x.id === d.controlId && x.visible && x.enabled);
    if (!c || ui.desktop) return null;
    if (c.type === 'list') {
      const r = c.rows?.find((x) => x.id === d.rowId && x.visible);
      const a = r?.actions?.find((x) => x.id === d.actionId && x.visible && x.enabled);
      if (!a) return null;
      return win ? `menu:${c.id}::${r.id}` : `act:${c.id}::${r.id}:${a.id}`;
    }
    if (d.type === 'set' && Object.is(c.value, d.value) && !Object.hasOwn(ui.pending, c.id)) return null;
    if (c.type === 'select' && skin === 'phone') {
      const i = (c.options || []).findIndex((o) => optValue(o) === d.value);
      return `ctl:${c.id}:${Math.max(0, i)}`;
    }
    return `ctl:${c.id}`;
  }
  function pathKey(step) {
    const d = stepOf(step);
    const target = d.type === 'open' ? d.screenId : d.type === 'launch' ? null : screenOfControl(d.controlId);
    if (!target) return null;
    const targetApp = screens.get(target)?.app;
    if (win && targetApp && !sim.used.apps.includes(targetApp)) return 'search';
    if (win && (ui.desktop || screens.get(sim.screenId)?.app !== targetApp)) return targetApp ? `task:${targetApp}` : null;
    if (skin === 'router' && Object.keys(ui.pending).length) return 'save';
    const hop = firstHop(sim.screenId, target);
    if (!hop) return null;
    if (hop.kind === 'nav') return `nav:${hop.screen}`;
    if (hop.kind === 'home') return 'home';
    if (hop.kind === 'row') return win ? `menu:${hop.controlId}::${hop.rowId}` : `act:${hop.controlId}::${hop.rowId}:${hop.actionId}`;
    return `ctl:${hop.controlId}`;
  }
  // A nav- link drawn in the window's navigation pane (not in the page) is flashed there.
  function resolveKey(key) {
    if (!key || !key.startsWith('ctl:') || root.querySelector(`[data-fk="${CSS.escape(key)}"]`)) return key;
    const c = screens.get(sim.screenId)?.controls?.find((x) => x.id === key.slice(4));
    return c?.type === 'link' && root.querySelector(`[data-nav="${CSS.escape(c.screen || '')}"]`) ? `nav:${c.screen}` : key;
  }
  function flash(key) {
    if (!key) return null;
    render();
    flashKey = resolveKey(key);
    render();
    const el = root.querySelector(`[data-fk="${CSS.escape(flashKey)}"]`);
    return el && el.matches('input[type="radio"]') ? el.closest('label') : el;
  }

  return {
    el: root,
    render,
    check: () => sim.check(),
    apply(step) { const r = playSim(sim, step); const s = screens.get(sim.screenId); if (s?.app) ui.last[s.app] = sim.screenId; ui.desktop = !sim.view(); ui.toast = r.ok && r.msg === sim.view()?.title ? '' : r.msg || ''; ui.toastKind = r.info ? 'info' : r.ok ? 'ok' : 'error'; ui.run = false; ui.search = false; render(); return r; },
    reset() { sim.reset(); ui = fresh(); flashKey = null; render(); },
    setLocked(on) { locked = !!on; root.classList.toggle('locked', locked); },
    // Show me: the control for the latest solution step (up to `upto`) reachable from the current screen, else the first
    // step on the way to the goal's step (launch, switch app, a menu item or a link).
    showMe(solution, upto) {
      for (let i = upto; i >= 0; i -= 1) {
        const key = directKey(solution[i]);
        if (key) return flash(key);
      }
      return flash(pathKey(solution[upto]) || (win ? 'search' : null));
    },
    // The walkthrough: show what the next step does before it runs (Run box filled in, menu open), then flash it.
    preview(step) {
      const d = stepOf(step);
      if (win && d.type === 'launch') { ui.run = true; ui.runText = String(d.query ?? ''); ui.search = false; return flash('run-ok'); }
      const key = directKey(step);
      if (key && key.startsWith('menu:')) { ui.menu = key.slice(5); return flash(`act:${key.slice(5)}:${d.actionId}`); }
      return flash(key || pathKey(step));
    },
    describe(step) {
      const d = stepOf(step);
      if (d.type === 'launch') return `${looksLikeCommand(d.query) ? 'Run' : 'Search'}: ${d.query}`;
      if (d.type === 'open') return `Go to ${screens.get(d.screenId)?.title || d.screenId}`;
      const scr = screens.get(screenOfControl(d.controlId));
      const c = scr?.controls?.find((x) => x.id === d.controlId);
      if (d.type === 'set') {
        const shown = c?.type === 'password' ? '•'.repeat(Math.min(12, String(d.value).length)) : c?.type === 'toggle' ? (d.value ? 'On' : 'Off') : optLabel((c?.options || []).find((o) => optValue(o) === d.value) ?? d.value);
        return `${c?.label || d.controlId}: ${shown}`;
      }
      if (c?.type === 'list') {
        const r = c.rows?.find((x) => x.id === d.rowId);
        const a = r?.actions?.find((x) => x.id === d.actionId);
        return `${(r?.cells || []).filter((x) => !/\{\{/.test(x)).slice(-1)[0] || d.rowId}: ${a?.label || d.actionId}`;
      }
      return `Select ${c?.label || d.controlId}`;
    },
    pending: () => (skin === 'router' && Object.keys(ui.pending).length ? sim.view()?.title || 'this page' : null),
    savePending() { if (Object.keys(ui.pending).length) saveRouter(); },
    discardPending() { ui.pending = {}; render(); },
    clearFlash() { if (flashKey) { flashKey = null; render(); } },
    destroy() { const modal = root.querySelector('dialog.ap-confirm-back'); if (modal?.open) modal.close(); root.remove(); },
  };
}

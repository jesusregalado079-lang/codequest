// A+ labs: PC Build Bench on the build engine (../../labs/aplus/pcbuild.js + parts.js). Slots with a filterable parts
// picker showing the specs that matter, a live compatibility panel (errors and warnings with their teaching messages)
// and an estimated load vs PSU watts meter. In Exam mode the panel stays closed until Check.
import { SLOTS, applyStep, editableSlots, evaluateBuild, startPicks } from '../../labs/aplus/pcbuild.js';
import { parts, findPart } from '../../labs/aplus/parts.js';
import { morph } from './aplus-dom.js';

let uid = 0;
const CATEGORY = { cpu: 'cpus', board: 'boards', memory: 'memory', storage: 'storage', gpu: 'gpus', psu: 'psus', case: 'cases', cooler: 'coolers' };
const SLOT_NAME = { cpu: 'CPU', board: 'Motherboard', memory: 'Memory', storage: 'Storage', gpu: 'Graphics card', psu: 'Power supply', case: 'Case', cooler: 'CPU cooler' };
const MULTI = new Set(['memory', 'storage']);
const OPTIONAL = new Set(['gpu']);
const RULE_NAME = { socket: 'CPU socket', memoryType: 'Memory generation', memoryForm: 'Memory shape', memorySlots: 'Memory slots', memoryCapacity: 'Memory capacity', boardFit: 'Board size', gpuSlot: 'Graphics slot', gpuFit: 'Graphics card fit', psuFit: 'Power supply size', psuWattage: 'Power supply wattage', gpuPower: 'Graphics power', m2Slot: 'M.2 slot', sataPorts: 'SATA ports', driveBays: 'Drive bays', coolerSocket: 'Cooler mount', coolerTdp: 'Cooler rating', coolerHeight: 'Cooler height', noVideo: 'Video output', pcieSpeed: 'PCIe speed', incomplete: 'Missing parts' };
const stepOf = (step) => (step && typeof step === 'object' && step.do ? step.do : step) || {};
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export function buildEngine(kase) {
  let picks = startPicks(kase);
  return {
    apply(step) {
      const before = evaluateBuild(kase, picks);
      const r = applyStep(kase, picks, stepOf(step));
      if (r.ok) picks = r.picks;
      return diff(r, before, evaluateBuild(kase, picks));
    },
    check: () => evaluateBuild(kase, picks),
  };
}
function diff(r, before, after) {
  return { ok: r.ok, msg: r.msg, goalsChanged: after.goals.filter((g, i) => g.pass && !before.goals[i].pass).map((g) => g.id),
    trapsHit: after.traps.filter((t, i) => t.hit && !before.traps[i].hit).map((t) => t.id) };
}

// The specs that matter, per part kind (short chips).
export function specsOf(slot, p) {
  if (!p) return [];
  const m2 = (b) => `${b.m2Slots.length} x M.2 (${b.m2Slots.map((s) => `PCIe ${s.pcieGen}.0${s.sata ? ' + SATA' : ''}`).join(', ')})`;
  switch (slot) {
    case 'cpu': return [p.socket, `${p.cores} cores`, `${p.tdp} W`, p.integratedGraphics ? 'Integrated graphics' : 'No graphics', p.memoryType];
    case 'board': return [p.socket, p.formFactor, `${p.memoryType} ${p.memoryForm} x ${p.dimmSlots}`, `max ${p.maxMemoryGB} GB`, m2(p), `${p.sataPorts} SATA`, `${p.x16Slots} x PCIe x16`, p.wifi || 'No Wi-Fi'];
    case 'memory': return [`${p.type} ${p.form}`, `${p.count} x ${p.moduleGB} GB`, `${p.speedMT} MT/s`, p.ecc ? 'ECC' : 'Non-ECC'];
    case 'storage': return [p.kind === 'nvme' ? `NVMe PCIe ${p.pcieGen}.0 M.2 ${p.size}` : p.kind === 'm2-sata' ? `SATA M.2 ${p.size} (${p.key} key)` : p.kind === 'sata-2.5' ? '2.5in SATA' : `3.5in SATA${p.rpm ? `, ${p.rpm} rpm` : ''}`, p.capacityGB >= 1000 ? `${p.capacityGB / 1000} TB` : `${p.capacityGB} GB`];
    case 'gpu': return [`${p.boardPowerW} W`, `${p.lengthMM} mm`, `${p.slotWidth}-slot`, p.power.length ? p.power.join(' + ') : 'Slot powered', ...(p.adapter ? [`adapter needs ${p.adapter.eightPin} x 8-pin`] : [])];
    case 'psu': return [`${p.watts} W`, p.formFactor, p.atx31 ? 'ATX 3.1' : 'ATX 2.x', p.native12v2x6 ? `${p.native12v2x6} x 12V-2x6` : 'No 12V-2x6', `${p.pcie8pin} x 8-pin PCIe`, p.efficiency, `${p.modular} modular`.replace('none modular', 'non-modular')];
    case 'case': return [p.boardFormFactors.join(' / '), `GPU ≤ ${p.maxGpuLengthMM} mm, ${p.maxGpuSlots} slots`, `PSU ${p.psuFormFactors.join(' or ')}`, `${p.bays25} x 2.5in, ${p.bays35} x 3.5in bays`, `cooler ≤ ${p.maxCoolerHeightMM} mm`];
    case 'cooler': return [p.sockets.join(' / '), `${p.tdpRatingW} W`, `${p.heightMM} mm tall`];
    default: return [];
  }
}

export function createBuildArea({ kase, esc, demo = false, mode = 'practice', onAction = () => {}, srcHtml = () => '' }) {
  const id = `apb${uid += 1}`;
  let picks = startPicks(kase);
  let open = null; // slot whose picker is open
  let filter = '';
  let locked = false;
  let flashKey = null;
  const editable = new Set(editableSlots(kase));
  const shownSlots = SLOTS.filter((s) => editable.has(s) || asList(picks[s]).length || !kase.slots);
  const root = document.createElement('div');
  root.className = 'ap-build';
  // On the case page the compatibility panel sits in the right column under the Coach (side); in the walkthrough copy
  // it stays inline next to the parts.
  const side = demo ? null : document.createElement('div');
  if (side) side.className = 'ap-build-side';

  function change(step) {
    const before = evaluateBuild(kase, picks);
    const r = applyStep(kase, picks, step);
    if (r.ok) picks = r.picks;
    const out = diff(r, before, evaluateBuild(kase, picks));
    flashKey = null;
    render();
    onAction(out);
    return out;
  }

  const fl = (key) => (flashKey === key ? ' ap-flash' : '');
  const chips = (slot, p) => `<span class="ap-specs">${specsOf(slot, p).map((x) => `<span>${esc(x)}</span>`).join('')}</span>`;
  function pickerHtml(slot) {
    const list = parts[CATEGORY[slot]] || [];
    const q = filter.trim().toLowerCase();
    const shown = list.filter((p) => !q || `${p.name} ${specsOf(slot, p).join(' ')}`.toLowerCase().includes(q));
    const installed = asList(picks[slot]);
    return `<div class="ap-picker" id="${id}-pk-${slot}">
      <div class="ap-pk-top"><label class="ap-lbl" for="${id}-f-${slot}">Filter ${esc(SLOT_NAME[slot].toLowerCase())} parts</label>
        <input id="${id}-f-${slot}" class="ap-input" data-filter data-fk="filter" value="${esc(filter)}" placeholder="for example DDR5, AM5, SFX, NVMe" spellcheck="false" autocomplete="off"></div>
      ${MULTI.has(slot) && installed.length ? `<button type="button" class="ap-btn small" data-clear="${slot}" data-fk="clear:${slot}">Remove all</button>` : ''}
      ${!MULTI.has(slot) && installed.length && OPTIONAL.has(slot) ? `<button type="button" class="ap-btn small${fl(`none:${slot}`)}" data-none="${slot}" data-fk="none:${slot}">No ${esc(SLOT_NAME[slot].toLowerCase())}</button>` : ''}
      <ul class="ap-pk-list">${shown.map((p) => {
    const here = installed.includes(p.id);
    const count = installed.filter((x) => x === p.id).length;
    return `<li class="${here ? 'here' : ''}"><div class="ap-pk-name"><strong>${esc(p.name)}</strong>${here ? `<span class="ap-badge">${MULTI.has(slot) && count > 1 ? `Installed x ${count}` : 'Installed'}</span>` : ''}${chips(slot, p)}</div>
        <div class="ap-pk-acts">${MULTI.has(slot)
    ? `<button type="button" class="ap-btn small${fl(`add:${slot}:${p.id}`)}" data-add="${esc(p.id)}" data-slot="${slot}" data-fk="add:${slot}:${esc(p.id)}">Add</button><button type="button" class="ap-btn small${fl(`only:${slot}:${p.id}`)}" data-only="${esc(p.id)}" data-slot="${slot}" data-fk="only:${slot}:${esc(p.id)}">Use only this</button>`
    : `<button type="button" class="ap-btn small${here ? '' : ' primary'}${fl(`pick:${slot}:${p.id}`)}" data-pick-part="${esc(p.id)}" data-slot="${slot}" data-fk="pick:${slot}:${esc(p.id)}"${here ? ' disabled' : ''}>${here ? 'Chosen' : 'Choose'}</button>`}</div></li>`;
  }).join('') || '<li class="ap-empty">No parts match that filter.</li>'}</ul></div>`;
  }
  function slotHtml(slot) {
    const ids = asList(picks[slot]);
    const can = editable.has(slot) && !locked;
    const isOpen = open === slot && editable.has(slot);
    const items = ids.length ? ids.map((pid, i) => { const p = findPart(CATEGORY[slot], pid); return `<div class="ap-slot-part"><span><strong>${esc(p?.name || pid)}</strong>${chips(slot, p)}</span>${MULTI.has(slot) && editable.has(slot) ? `<button type="button" class="ap-btn small${fl(`remove:${slot}:${pid}`)}" data-remove="${esc(pid)}" data-slot="${slot}" data-fk="remove:${slot}:${esc(pid)}:${i}" aria-label="Remove ${esc(p?.name || pid)}">Remove</button>` : ''}</div>`; }).join('')
      : `<div class="ap-slot-part empty">${OPTIONAL.has(slot) ? 'None (optional)' : 'Not chosen'}</div>`;
    return `<li class="ap-slot${isOpen ? ' open' : ''}" data-slot-row="${slot}">
      <div class="ap-slot-head"><span class="ap-slot-name">${esc(SLOT_NAME[slot])}</span>
        ${editable.has(slot) ? `<button type="button" class="ap-btn small${fl(`slot:${slot}`)}" data-slot-open="${slot}" data-fk="slot:${slot}" aria-expanded="${isOpen}" aria-controls="${id}-pk-${slot}"${can ? '' : ' disabled'}>${isOpen ? 'Close' : MULTI.has(slot) ? 'Add or change' : ids.length ? 'Change' : 'Choose'}</button>` : '<span class="ap-badge fixed">Fixed in this scenario</span>'}</div>
      ${items}
      ${isOpen ? pickerHtml(slot) : ''}
    </li>`;
  }
  function meterHtml(ev) {
    const l = ev.load;
    if (!l || (!l.cpuW && !l.gpuW)) return '';
    const max = Math.max(l.recommendedW, l.psuW || 0, 100) * 1.1;
    const pct = (w) => Math.max(0, Math.min(100, (w / max) * 100)).toFixed(1);
    const short = l.psuW && l.psuW < l.recommendedW;
    return `<div class="ap-meter${short ? ' short' : ''}">
      <div class="ap-meter-h"><strong>Power</strong><span>${l.psuW ? `PSU ${l.psuW} W` : 'No power supply chosen'}</span></div>
      <div class="ap-meter-bar" role="img" aria-label="Estimated load ${l.totalW} W, recommended ${l.recommendedW} W, power supply ${l.psuW || 0} W"><i class="load" style="width:${pct(l.totalW)}%"></i><i class="rec" style="left:${pct(l.recommendedW)}%"></i>${l.psuW ? `<i class="psu" style="left:${pct(l.psuW)}%"></i>` : ''}</div>
      <p class="ap-meter-t">CPU ${l.cpuW} W + GPU ${l.gpuW} W + ${l.otherW} W for the rest = <b>${l.totalW} W</b>; x 1.3 headroom, rounded up = <b>${l.recommendedW} W</b> recommended.</p>
    </div>`;
  }
  function issueHtml(e, kind) {
    return `<li class="ap-issue ${kind}"><span class="ap-issue-k">${esc(RULE_NAME[e.rule] || e.rule)}</span><p>${esc(e.message)}</p><p class="ap-rule"><b>Rule:</b> ${esc(e.why)}</p>${srcHtml(e.src)}</li>`;
  }
  function compatHtml() {
    if (mode === 'exam') return '<div class="ap-compat closed"><h4>Compatibility</h4><p class="ex-muted">Exam mode: the compatibility check runs when you select Check, the way a real job has no warning lights.</p></div>';
    const ev = evaluateBuild(kase, picks);
    const errs = ev.errors;
    const warns = ev.warnings;
    return `<div class="ap-compat${errs.length ? ' bad' : ' good'}"><h4>Compatibility <span class="visually-hidden" role="status">${errs.length} problem${errs.length === 1 ? '' : 's'}</span></h4>
      ${meterHtml(ev)}
      ${errs.length ? `<ul class="ap-issues">${errs.map((e) => issueHtml(e, 'err')).join('')}</ul>` : '<p class="ap-allgood">✓ No compatibility problems found.</p>'}
      ${warns.length ? `<ul class="ap-issues">${warns.map((e) => issueHtml(e, 'warn')).join('')}</ul>` : ''}
    </div>`;
  }
  function render() {
    const focused = root.contains(document.activeElement) ? document.activeElement?.dataset?.fk : null;
    const caret = document.activeElement?.matches?.('[data-filter]') ? document.activeElement.selectionStart : null;
    morph(root, `<div class="ap-bench${side ? ' solo' : ''}"><ul class="ap-slots" aria-label="Parts list">${shownSlots.map(slotHtml).join('')}</ul>${side ? '' : compatHtml()}</div>`);
    if (side) morph(side, compatHtml());
    root.classList.toggle('locked', locked);
    if (!demo && focused) {
      const el = root.querySelector(`[data-fk="${CSS.escape(focused)}"]`);
      if (el) { el.focus({ preventScroll: true }); if (caret !== null) try { el.setSelectionRange(caret, caret); } catch { /* ignore */ } }
    }
  }
  if (!demo) {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled || locked) return;
      const d = b.dataset;
      if (d.slotOpen) { open = open === d.slotOpen ? null : d.slotOpen; filter = ''; render(); root.querySelector(open ? '[data-filter]' : `[data-slot-open="${d.slotOpen}"]`)?.focus(); return; }
      if (d.pickPart) return change({ slot: d.slot, part: d.pickPart });
      if (d.add) return change({ slot: d.slot, add: d.add });
      if (d.only) return change({ slot: d.slot, part: d.only });
      if (d.remove) return change({ slot: d.slot, remove: d.remove });
      if (d.clear) return change({ slot: d.clear, parts: [] });
      if (d.none) return change({ slot: d.none, part: null });
      return null;
    });
    root.addEventListener('input', (e) => { if (e.target.matches('[data-filter]')) { filter = e.target.value; render(); } });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { const s = open; open = null; render(); root.querySelector(`[data-slot-open="${s}"]`)?.focus(); } });
  }
  function keyFor(d) {
    if (!d.slot) return null;
    if (MULTI.has(d.slot)) {
      if (d.remove) return `remove:${d.slot}:${d.remove}`;
      if (d.add) return `add:${d.slot}:${d.add}`;
      if (d.part) return `only:${d.slot}:${d.part}`;
      return `slot:${d.slot}`;
    }
    if (d.part === null) return `none:${d.slot}`;
    return `pick:${d.slot}:${d.part}`;
  }
  function flash(d) {
    const key = keyFor(d);
    if (!key) return null;
    if (!key.startsWith('remove:')) { open = d.slot; filter = ''; }
    flashKey = key;
    render();
    return root.querySelector(`[data-fk^="${CSS.escape(key)}"]`) || root.querySelector(`[data-fk="slot:${d.slot}"]`);
  }
  return {
    el: root,
    side,
    render,
    check: () => evaluateBuild(kase, picks),
    apply(step) {
      const before = evaluateBuild(kase, picks);
      const r = applyStep(kase, picks, stepOf(step));
      if (r.ok) picks = r.picks;
      render();
      return diff(r, before, evaluateBuild(kase, picks));
    },
    reset() { picks = startPicks(kase); open = null; filter = ''; flashKey = null; render(); },
    setLocked(on) { locked = !!on; render(); },
    showMe(solution, upto) {
      // the first solution step (up to the goal's) whose part is not in place yet
      for (let i = 0; i <= upto; i += 1) {
        const d = stepOf(solution[i]);
        const have = asList(picks[d.slot]);
        const done = d.remove ? !have.includes(d.remove) : d.add ? have.includes(d.add) : 'parts' in d ? JSON.stringify(have) === JSON.stringify(d.parts) : MULTI.has(d.slot) ? have.length === 1 && have[0] === d.part : picks[d.slot] === (d.part ?? null);
        if (!done) return flash(d);
      }
      return flash(stepOf(solution[upto]));
    },
    preview(step) { return flash(stepOf(step)); },
    describe(step) {
      const d = stepOf(step);
      const name = (pid) => findPart(CATEGORY[d.slot], pid)?.name || pid;
      if (d.remove) return `${SLOT_NAME[d.slot]}: remove ${name(d.remove)}`;
      if (d.add) return `${SLOT_NAME[d.slot]}: add ${name(d.add)}`;
      if ('parts' in d) return `${SLOT_NAME[d.slot]}: ${d.parts.length ? d.parts.map(name).join(' + ') : 'none'}`;
      return `${SLOT_NAME[d.slot]}: ${d.part ? name(d.part) : 'none'}`;
    },
    // After Check: every error and warning of the final build (Exam mode shows them only here).
    results() {
      const ev = evaluateBuild(kase, picks);
      if (!ev.errors.length && !ev.warnings.length) return '<h3 class="lb-h3">Compatibility</h3><p class="ap-allgood">✓ The final build has no compatibility problems.</p>';
      return `<h3 class="lb-h3">Compatibility of your final build</h3>${meterHtml(ev)}<ul class="ap-issues">${ev.errors.map((e) => issueHtml(e, 'err')).join('')}${ev.warnings.map((e) => issueHtml(e, 'warn')).join('')}</ul>`;
    },
    pending: () => null,
    clearFlash() { if (flashKey) { flashKey = null; render(); } },
    destroy() { root.remove(); side?.remove(); },
  };
}

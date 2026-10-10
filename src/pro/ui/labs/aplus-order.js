// A+ labs: Fix It In Order on the order engine (../../labs/aplus/order.js). A reorderable list: drag by the grip with a
// pointer, or with the keyboard (Space picks a step up, Up/Down moves it, Space drops it, Escape puts it back; Alt+Up
// and Alt+Down move at once), plus Move up / Move down buttons. Follow-up questions sit on the steps that have one.
import { applyStep, gradeOrder, startState } from '../../labs/aplus/order.js';
import { morph } from './aplus-dom.js';

let uid = 0;
const stepOf = (step) => (step && typeof step === 'object' && step.do ? step.do : step) || {};

export function orderEngine(kase) {
  let state = startState(kase);
  return {
    apply(step) {
      const before = gradeOrder(kase, state.ids, state.answers);
      const r = applyStep(kase, state, stepOf(step));
      if (r.ok) state = r.state;
      return diff(r, before, gradeOrder(kase, state.ids, state.answers));
    },
    check: () => gradeOrder(kase, state.ids, state.answers),
  };
}
function diff(r, before, after) {
  return { ok: r.ok, msg: r.msg, goalsChanged: after.goals.filter((g, i) => g.pass && !before.goals[i].pass).map((g) => g.id),
    trapsHit: after.traps.filter((t, i) => t.hit && !before.traps[i].hit).map((t) => t.id) };
}

export function createOrderArea({ kase, esc, demo = false, onAction = () => {} }) {
  const id = `apo${uid += 1}`;
  const items = new Map((kase.items || []).map((it) => [it.id, it]));
  let state = startState(kase);
  let grabbed = null; // { id, from: [ids] } while picked up with the keyboard
  let marks = null; // misplaced entries after Check
  let locked = false;
  let flashKey = null;
  let announce = '';
  let rendering = false;
  const root = document.createElement('div');
  root.className = 'ap-order';

  function change(step, say) {
    const before = gradeOrder(kase, state.ids, state.answers);
    const r = applyStep(kase, state, step);
    if (r.ok) state = r.state;
    const out = diff(r, before, gradeOrder(kase, state.ids, state.answers));
    flashKey = null;
    if (say) announce = say;
    render();
    onAction(out);
    return out;
  }
  const textOf = (iid) => items.get(iid)?.text || iid;
  const posSay = (iid, ids = state.ids) => `"${textOf(iid)}" is now step ${ids.indexOf(iid) + 1} of ${ids.length}.`;
  const fl = (key) => (flashKey === key ? ' ap-flash' : '');

  function askHtml(it) {
    if (!it.ask) return '';
    const chosen = state.answers[it.id];
    return `<fieldset class="ap-ask${fl(`ask:${it.id}`)}" data-fk="ask:${esc(it.id)}"><legend><span class="ap-ask-tag">Question for this step</span> ${esc(it.ask.q)}</legend>
      ${(it.ask.choices || []).map((c, i) => `<label class="ap-radio${fl(`ask:${it.id}:${i}`)}"><input type="radio" name="${id}-${esc(it.id)}" data-ask="${esc(it.id)}" data-choice="${i}" data-fk="ask:${esc(it.id)}:${i}"${chosen === c ? ' checked' : ''}${locked ? ' disabled' : ''}><span>${esc(c)}</span></label>`).join('')}</fieldset>`;
  }
  function markHtml(iid) {
    const m = marks && marks.find((x) => x.id === iid);
    if (!m) return '';
    const names = (list) => list.map((x) => `"${esc(textOf(x))}"`).join(', ');
    return `<div class="ap-omark" role="note">${m.mustComeAfter?.length ? `<p><b>Must come after</b> ${names(m.mustComeAfter)}.</p>` : ''}${m.mustComeBefore?.length ? `<p><b>Must come before</b> ${names(m.mustComeBefore)}.</p>` : ''}${m.why ? `<p><b>Because:</b> ${esc(m.why)}</p>` : ''}</div>`;
  }
  function render() {
    const focused = root.contains(document.activeElement) ? document.activeElement?.dataset?.fk : null;
    const n = state.ids.length;
    rendering = true;
    morph(root, `
      <p class="ap-order-how" id="${id}-help">Drag a step by its grip, or focus the grip and press Space to pick it up, the arrow keys to move it and Space to drop it (Escape puts it back). Move up and Move down work too.</p>
      <ol class="ap-olist" aria-label="Steps in your order">${state.ids.map((iid, i) => {
    const it = items.get(iid) || { id: iid, text: iid };
    const g = grabbed && grabbed.id === iid;
    const bad = marks && marks.some((x) => x.id === iid);
    return `<li class="ap-oitem${g ? ' grabbed' : ''}${bad ? ' misplaced' : marks ? ' placed' : ''}${fl(`item:${iid}`)}" data-item="${esc(iid)}">
        <div class="ap-orow">
          <button type="button" class="ap-grip" data-grip="${esc(iid)}" data-fk="grip:${esc(iid)}" aria-describedby="${id}-help" aria-pressed="${g}" aria-label="Step ${i + 1}: ${esc(it.text)}. Reorder"${locked ? ' disabled' : ''}><span aria-hidden="true">⠿</span></button>
          <span class="ap-onum" aria-hidden="true">${i + 1}</span>
          <span class="ap-otext">${esc(it.text)}</span>
          <span class="ap-obtns"><button type="button" class="ap-obtn${fl(`up:${iid}`)}" data-up="${esc(iid)}" data-fk="up:${esc(iid)}" aria-label="Move up: ${esc(it.text)}"${i === 0 || locked ? ' disabled' : ''}>↑</button><button type="button" class="ap-obtn${fl(`down:${iid}`)}" data-down="${esc(iid)}" data-fk="down:${esc(iid)}" aria-label="Move down: ${esc(it.text)}"${i === n - 1 || locked ? ' disabled' : ''}>↓</button></span>
        </div>
        ${markHtml(iid)}
        ${askHtml(it)}
      </li>`;
  }).join('')}</ol>
      <div class="visually-hidden" aria-live="assertive">${esc(announce)}</div>`);
    rendering = false;
    root.classList.toggle('locked', locked);
    if (!demo && focused) root.querySelector(`[data-fk="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  }

  function move(iid, to, keepFocus) {
    const r = change({ move: iid, to }, posSay(iid, (() => { const ids = state.ids.filter((x) => x !== iid); ids.splice(to, 0, iid); return ids; })()));
    if (keepFocus) root.querySelector(`[data-fk="${CSS.escape(keepFocus)}"]`)?.focus({ preventScroll: true });
    return r;
  }

  if (!demo) {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled || locked) return;
      if (b.dataset.up) { const i = state.ids.indexOf(b.dataset.up); const f = i - 1 === 0 ? `grip:${b.dataset.up}` : `up:${b.dataset.up}`; move(b.dataset.up, i - 1, f); }
      if (b.dataset.down) { const i = state.ids.indexOf(b.dataset.down); const f = i + 1 === state.ids.length - 1 ? `grip:${b.dataset.down}` : `down:${b.dataset.down}`; move(b.dataset.down, i + 1, f); }
    });
    root.addEventListener('change', (e) => {
      const r = e.target.closest('[data-ask]');
      if (!r || locked) return;
      const it = items.get(r.dataset.ask);
      const choice = it?.ask?.choices?.[Number(r.dataset.choice)];
      if (choice !== undefined) change({ answer: it.id, choice });
    });
    root.addEventListener('keydown', (e) => {
      const g = e.target.closest('[data-grip]');
      if (!g || locked) return;
      const iid = g.dataset.grip;
      const i = state.ids.indexOf(iid);
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (grabbed && grabbed.id === iid) {
          const from = grabbed.from;
          grabbed = null;
          if (from.indexOf(iid) !== i) { const ids = state.ids; state = { ...state, ids: from }; move(iid, ids.indexOf(iid), `grip:${iid}`); announce = `Dropped. ${posSay(iid)}`; render(); }
          else { announce = `Dropped at step ${i + 1}.`; render(); }
        } else { grabbed = { id: iid, from: [...state.ids] }; announce = `Picked up "${textOf(iid)}", step ${i + 1} of ${state.ids.length}. Use the arrow keys, then Space to drop.`; render(); }
        root.querySelector(`[data-fk="${CSS.escape(`grip:${iid}`)}"]`)?.focus();
        return;
      }
      if (e.key === 'Escape' && grabbed) { state = { ...state, ids: grabbed.from }; grabbed = null; announce = `Cancelled. ${posSay(iid)}`; render(); root.querySelector(`[data-fk="${CSS.escape(`grip:${iid}`)}"]`)?.focus(); return; }
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const to = e.key === 'ArrowUp' ? i - 1 : i + 1;
      if (grabbed && grabbed.id === iid) {
        if (to < 0 || to >= state.ids.length) return;
        const ids = state.ids.filter((x) => x !== iid);
        ids.splice(to, 0, iid);
        state = { ...state, ids };
        announce = posSay(iid);
        render();
        root.querySelector(`[data-fk="${CSS.escape(`grip:${iid}`)}"]`)?.focus();
        return;
      }
      if (e.altKey) { if (to >= 0 && to < state.ids.length) move(iid, to, `grip:${iid}`); return; }
      // without a step picked up, the arrows move focus between grips
      const next = state.ids[Math.max(0, Math.min(state.ids.length - 1, to))];
      root.querySelector(`[data-fk="${CSS.escape(`grip:${next}`)}"]`)?.focus();
    });
    // leaving a picked-up step (Tab, a click elsewhere) drops it where it is
    root.addEventListener('focusout', (e) => {
      const g = e.target.closest?.('[data-grip]');
      if (rendering || !g || !grabbed || grabbed.id !== g.dataset.grip || root.contains(e.relatedTarget) && e.relatedTarget?.dataset?.grip === g.dataset.grip) return;
      const iid = grabbed.id;
      const from = grabbed.from;
      grabbed = null;
      const now = state.ids;
      if (from.indexOf(iid) !== now.indexOf(iid)) { state = { ...state, ids: from }; move(iid, now.indexOf(iid)); } else render();
    });
    // pointer drag by the grip: the list reorders live under the pointer; the move is applied on release
    let drag = null;
    root.addEventListener('pointerdown', (e) => {
      const g = e.target.closest('[data-grip]');
      if (!g || locked || e.button !== 0) return;
      const li = g.closest('.ap-oitem');
      drag = { id: g.dataset.grip, li, pointer: e.pointerId, from: state.ids.indexOf(g.dataset.grip) };
      g.setPointerCapture(e.pointerId);
      li.classList.add('dragging');
      e.preventDefault();
    });
    root.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pointer) return;
      // near the window edge the page scrolls, so a step can travel past what is on screen
      if (e.clientY < 70) scrollBy(0, -14); else if (e.clientY > innerHeight - 70) scrollBy(0, 14);
      const list = drag.li.parentElement;
      const others = [...list.children].filter((x) => x !== drag.li);
      const before = others.find((x) => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
      if (before) { if (drag.li.nextElementSibling !== before) list.insertBefore(drag.li, before); } else if (list.lastElementChild !== drag.li) list.appendChild(drag.li);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.pointer) return;
      const { id: iid, li, from } = drag;
      drag = null;
      li.classList.remove('dragging');
      const to = [...li.parentElement.children].indexOf(li);
      if (to !== from) move(iid, to, `grip:${iid}`); else render();
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
  }

  function flash(key) { flashKey = key; render(); return root.querySelector(`[data-fk="${CSS.escape(key)}"]`) || root.querySelector(`.ap-flash`); }
  return {
    el: root,
    render,
    check: () => gradeOrder(kase, state.ids, state.answers),
    apply(step) {
      const before = gradeOrder(kase, state.ids, state.answers);
      const r = applyStep(kase, state, stepOf(step));
      if (r.ok) state = r.state;
      render();
      return diff(r, before, gradeOrder(kase, state.ids, state.answers));
    },
    reset() { state = startState(kase); grabbed = null; marks = null; flashKey = null; announce = ''; render(); },
    setLocked(on) { locked = !!on; if (!on) marks = null; grabbed = null; render(); },
    // After Check: mark misplaced steps in the list itself ("must come after X because ...").
    markResults(graded) { marks = graded.misplaced || []; render(); },
    showMe(solution, upto) {
      // a goal about a follow-up question: its question; otherwise the first step out of place
      const target = stepOf(solution[upto]);
      if (target.answer && state.answers[target.answer] !== target.choice) return flash(`ask:${target.answer}`);
      const mis = gradeOrder(kase, state.ids, state.answers).misplaced;
      if (mis.length) { const m = mis[0]; const i = state.ids.indexOf(m.id); const after = (m.mustComeAfter || []).some((x) => state.ids.indexOf(x) > i); return flash(after ? `down:${m.id}` : `up:${m.id}`); }
      return flash(target.move ? `grip:${target.move}` : null);
    },
    preview(step) {
      const d = stepOf(step);
      if (d.answer) { const i = items.get(d.answer)?.ask?.choices?.indexOf(d.choice) ?? 0; return flash(`ask:${d.answer}:${Math.max(0, i)}`); }
      return flash(`item:${d.move}`);
    },
    describe(step) {
      const d = stepOf(step);
      if (d.answer) return `Answer: ${d.choice}`;
      return `Move "${textOf(d.move)}" to step ${d.to + 1}`;
    },
    results(graded) {
      const fu = graded.followUps || [];
      if (!fu.length) return '';
      return `<h3 class="lb-h3">Questions at the steps</h3><ul class="lb-goals">${fu.map((f) => `<li class="${f.pass ? 'ok' : 'no'}"><span class="lb-mark">${f.pass ? '✓' : '✗'}</span><div><strong>${esc(f.q)}</strong>
        <small>${f.chosen ? `Your answer: ${esc(f.chosen)}` : 'Not answered.'}</small>
        ${f.pass ? '' : `<p class="ap-expect"><b>Answer:</b> ${esc(f.answer)}</p>`}${f.whyNot ? `<p class="ap-whynot"><b>Why not yours:</b> ${esc(f.whyNot)}</p>` : ''}<p class="ap-why">${esc(f.why || '')}</p></div></li>`).join('')}</ul>`;
    },
    pending: () => null,
    clearFlash() { if (flashKey) { flashKey = null; render(); } },
    destroy() { root.remove(); },
  };
}

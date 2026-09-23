// Bridges full HTML replacements using DOM presentation only. No store, exercise data, answers,
// grading, or input handlers belong here. Final values are already rendered before motion starts.
export function createDailyMotion(root) {
  const preference = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const calendar = new Map();
  let view = null;
  let seenVerse = '';
  const ease = 'cubic-bezier(.2,.75,.25,1)';

  function stop() {
    running.forEach((animation) => animation.cancel());
    running.clear();
  }
  // A preference change mid-animation immediately exposes the final underlying HTML/CSS.
  preference.addEventListener('change', () => { if (preference.matches) stop(); });

  function animate(node, frames, duration = 260, delay = 0) {
    if (!node || preference.matches || typeof node.animate !== 'function') return;
    const animation = node.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
    running.add(animation);
    animation.onfinish = () => running.delete(animation);
    animation.oncancel = () => running.delete(animation);
  }

  function capture() {
    const manipulatives = new Map();
    root.querySelectorAll('[data-manipulative]').forEach((element) => {
      const vessel = element.querySelector('[data-quantity-count]');
      const fill = element.querySelector('.cqd-quantity-fill');
      manipulatives.set(element.dataset.manipulative, {
        count: vessel ? Number(vessel.dataset.quantityCount) : null,
        // Read the displayed height, including an unfinished animation, so rapid taps continue
        // from the visible level instead of jumping back to the previous destination.
        height: fill ? getComputedStyle(fill).height : null,
        tally: element.querySelectorAll('.cqd-tally-bar').length,
        tokens: new Map(Array.from(element.querySelectorAll('[data-token-key]'), (token) =>
          [token.dataset.tokenKey, Number(token.dataset.tokenCount)])),
      });
    });
    const grids = new Map(Array.from(root.querySelectorAll('[data-shade-key]'), (grid) =>
      [grid.dataset.shadeKey, Array.from(grid.querySelectorAll('.cqd-shade-cell'), (cell) => cell.classList.contains('is-shaded'))]));
    const month = root.querySelector('[data-calendar-month]');
    const calendarFocus = root.querySelector('.cqd-month-nav button:focus');
    return { view, manipulatives, grids,
      month: month ? Number(month.dataset.calendarMonth) : null,
      calendarFocus: calendarFocus ? calendarFocus.dataset.action : null,
    };
  }

  function animateManipulatives(previous) {
    root.querySelectorAll('[data-manipulative]').forEach((element) => {
      const before = previous.manipulatives.get(element.dataset.manipulative);
      if (!before) return;
      const vessel = element.querySelector('[data-quantity-count]');
      const fill = element.querySelector('.cqd-quantity-fill');
      if (vessel && fill && before.height !== null && Number(vessel.dataset.quantityCount) !== before.count) {
        animate(fill, [{ height: before.height }, { height: getComputedStyle(fill).height }], 360);
      }
      const strokes = element.querySelectorAll('.cqd-tally-bar');
      strokes.forEach((stroke, index) => {
        if (index < before.tally) return;
        // Clip rather than transform: the fifth stroke keeps its diagonal orientation.
        const start = index % 5 === 4 ? 'inset(0 100% 0 0)' : 'inset(0 0 100% 0)';
        animate(stroke, [{ clipPath: start }, { clipPath: 'inset(0 0 0 0)' }], 220, Math.min(index - before.tally, 5) * 25);
      });
      element.querySelectorAll('[data-token-key]').forEach((token) => {
        const oldCount = before.tokens.get(token.dataset.tokenKey);
        const count = Number(token.dataset.tokenCount);
        if (oldCount === undefined || oldCount === count) return;
        const face = token.querySelector('[data-token-face]');
        if (count > oldCount) {
          animate(face, [
            { transform: 'translateY(-12px) rotate(-9deg)', offset: 0 },
            { transform: 'translateY(2px) rotate(3deg)', offset: .65 },
            { transform: 'translateY(0) rotate(0)', offset: 1 },
          ], 300);
        } else {
          animate(face, [{ opacity: .55 }, { opacity: 1 }], 180);
        }
        animate(token.querySelector('[data-token-readout]'), [{ opacity: .35, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], 200);
      });
    });

    root.querySelectorAll('[data-shade-key]').forEach((grid) => {
      const before = previous.grids.get(grid.dataset.shadeKey);
      if (!before) return;
      const cells = Array.from(grid.querySelectorAll('.cqd-shade-cell'));
      const changed = cells.filter((cell, index) => before[index] !== cell.classList.contains('is-shaded'));
      // Reverse the sweep when unshading. Total sweep time stays bounded even for large fields.
      if (changed.length && !changed[0].classList.contains('is-shaded')) changed.reverse();
      const colors = getComputedStyle(grid);
      const empty = colors.getPropertyValue('--cqd-shade-empty').trim();
      const ink = colors.getPropertyValue('--cqd-shade-ink').trim();
      changed.forEach((cell, index) => {
        const shaded = cell.classList.contains('is-shaded');
        animate(cell, [
          { backgroundColor: shaded ? empty : ink },
          { backgroundColor: shaded ? ink : empty },
        ], 170, index * Math.min(16, 150 / Math.max(1, changed.length - 1)));
      });
    });
  }

  function play(previous, nextView) {
    // Old nodes are detached now. Cancel their animations to avoid building up work on fast taps.
    stop();
    const entered = previous.view !== nextView;
    const month = root.querySelector('[data-calendar-month]');
    const changedMonth = month && previous.month !== null && previous.month !== Number(month.dataset.calendarMonth);
    view = nextView;
    // Full renders replace the focused navigation button. Keep keyboard month browsing usable,
    // including at a disabled end stop; this also runs when motion is reduced or unsupported.
    if (changedMonth && previous.calendarFocus) {
      const navigation = Array.from(root.querySelectorAll('.cqd-month-nav button'));
      const focused = navigation.find((button) => button.dataset.action === previous.calendarFocus && !button.disabled)
        || navigation.find((button) => !button.disabled);
      if (focused) focused.focus({ preventScroll: true });
    }
    if (entered) {
      // Never translate/scale the sheet stage or its ancestors: drawing.js sizes and maps its
      // canvas against their rectangles. An opacity reveal leaves all coordinates unchanged.
      animate(root.querySelector('.cqd-sheet-stage, .cqd-empty, .cqd-parent, .cqd-parent-gate, .cqd-track-picker'), [{ opacity: .55 }, { opacity: 1 }], 220);
      if (changedMonth) {
        const direction = Math.sign(Number(month.dataset.calendarMonth) - previous.month);
        // Move only the new page, leaving navigation and tap geometry available immediately.
        animate(root.querySelector('.cqd-month-cells'), [
          { opacity: .35, transform: `translateX(${direction * 14}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ], 300);
        animate(root.querySelector('.cqd-month-nav h1'), [
          { opacity: .3, transform: `translateX(${direction * 8}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ], 240);
        animate(root.querySelector('.cqd-robot-head'), [
          { transform: 'rotate(0)' }, { transform: `rotate(${direction * 5}deg)` }, { transform: 'rotate(0)' },
        ], 400);
      } else {
        animate(root.querySelector('.cqd-calendar-head'), [{ opacity: .4 }, { opacity: 1 }], 220);
        animate(root.querySelector('.cqd-month-cells'), [
          { opacity: .45, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' },
        ], 340, 70);
        animate(root.querySelector('.cqd-robot'), [
          { opacity: .4, transform: 'translateY(5px) rotate(-3deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0)' },
        ], 420);
        animate(root.querySelector('.cqd-robot-wave'), [
          { transform: 'rotate(0)' }, { transform: 'rotate(-18deg)' },
          { transform: 'rotate(8deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(0)' },
        ], 720, 180);
        animate(root.querySelector('.cqd-robot-eyes'), [
          { transform: 'scaleY(1)' }, { transform: 'scaleY(.1)' }, { transform: 'scaleY(1)' },
        ], 150, 650);
      }
      root.querySelectorAll('.cqd-day-tile').forEach((tile, index) => {
        animate(tile, [{ opacity: .5, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], 260, index * 30);
      });
      animate(root.querySelector('.cqd-verse-card'), [{ opacity: .5, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], 300, 100);
      const verse = root.querySelector('.cqd-verse-text');
      if (verse && verse.textContent !== seenVerse) {
        seenVerse = verse.textContent;
        verse.querySelectorAll('.cqd-verse-word').forEach((word, index) => {
          animate(word, [{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }], 380, 180 + Math.min(index, 6) * 45);
        });
      }
    } else if (!preference.matches) {
      animateManipulatives(previous);
    }
    // Remember only rendered calendar statuses, including when leaving it to do work. This does
    // not compute status. Returning to the calendar acknowledges its already-rendered change.
    root.querySelectorAll('[data-calendar-key]').forEach((tile) => {
      const key = tile.dataset.calendarKey;
      const status = tile.dataset.calendarStatus;
      if (calendar.has(key) && calendar.get(key) !== status) {
        animate(tile.querySelector('.cqd-month-dot, .cqd-day-status'), [
          { opacity: .35, transform: 'perspective(300px) rotateX(-35deg)' },
          { opacity: 1, transform: 'perspective(300px) rotateX(0)' },
        ], 300, 150);
      }
      calendar.set(key, status);
    });
  }

  return { capture, play };
}

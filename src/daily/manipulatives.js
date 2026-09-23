// Presentation primitives only. Counts describe objects placed or cells shaded, never an answer
// or progress toward a target. The caller owns units, accessible wording, and the visual skin.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// `cap` is a fixed display capacity, chosen independently of an exercise's expected answer.
// Excess objects still appear in the caller's exact count/tallies; only the drawing saturates.
export function quantityVessel({ count, cap, label, skin = '' }) {
  const level = Math.min(100, Math.round((count / cap) * 100));
  return `<div class="cqd-quantity ${esc(skin)}" data-quantity-count="${count}" role="img" aria-label="${esc(label)}" style="--cqd-quantity-level:${level}%">
    <div class="cqd-quantity-window"><div class="cqd-quantity-fill"></div></div>
  </div>`;
}

// All strokes remain in the DOM, in counting order. Motion draws only newly added strokes.
// The empty label is supplied by the skin so this works for bills, beads, blocks, and more.
export function tallyMarks(count, emptyLabel = 'Nothing added yet') {
  if (count <= 0) return `<span class="cqd-tally-empty">${esc(emptyLabel)}</span>`;
  const groups = [];
  let remaining = count;
  while (remaining > 0) {
    const n = Math.min(5, remaining);
    groups.push(n);
    remaining -= n;
  }
  return groups.map((n) => `<span class="cqd-tally-group" data-count="${n}">${'<span class="cqd-tally-bar"></span>'.repeat(n)}</span>`).join('');
}

// A visual field, not separate tap targets. Its caller supplies the ONE interactive surface,
// hit testing, storage, and accessible description. Fractions can supply a different cell count
// and --cqd-shade-columns without changing this renderer or the motion bridge.
export function shadeCells(shaded, cells = 100) {
  return Array.from({ length: cells }, (_, i) => `<span class="cqd-shade-cell ${i < shaded ? 'is-shaded' : ''}"></span>`).join('');
}

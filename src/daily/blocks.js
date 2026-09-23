// Pure logic for the adaptive "blocks" aid on percent problems (no HTML, no storage, no DOM).
// A problem "part out of whole" is drawn as a bar of equal blocks so a kid can break it down:
//   1) how many blocks make the whole?  2) what is ONE block worth (100 / blocks)?  3) count + multiply.
// The blocks fit the question: small wholes get one block per item ("6 out of 8" -> 8 blocks of
// 12.5%); big wholes are grouped so every block is a friendly percent ("6 out of 12" -> 4 blocks of 3,
// 25% each). How much the bar labels for the kid is the item's `help` level, which the authored week
// fades across days (all -> unit -> clues -> none).
//
// Neutrality: nothing here ever looks at what the kid typed or how many blocks he filled. Labels come
// only from the problem's own numbers, so no output can signal right or wrong. (The most-helpful
// level, 'all', deliberately shows the arithmetic as a worked example; it is authored for the first
// day of a skill and fades away — that is teaching, not a correctness signal about his answer.)

export const HELP_LEVELS = ['all', 'unit', 'clues', 'none'];

const GROUPINGS = [4, 5, 10, 20]; // benchmark-friendly block counts: 25%, 20%, 10%, 5% per block
const MAX_BLOCKS = 25;

// A unit is "clean" when it has at most one decimal place (12.5% is fine, 8.333...% is not).
const cleanUnit = (count) => Number.isInteger((1000 / count));

export function formatPct(value) {
  return `${Math.round(value * 100) / 100}%`;
}

// Returns { count, size } (count blocks, each standing for `size` of the whole's items) or null when
// the numbers can't be split cleanly — the caller then falls back to a plain answer box.
export function blockPlan(part, whole) {
  if (!Number.isInteger(part) || !Number.isInteger(whole) || part < 0 || whole < 1 || part > whole) return null;
  if (whole <= 10 && cleanUnit(whole)) return { count: whole, size: 1 };
  for (const count of GROUPINGS) {
    const size = whole / count;
    if (Number.isInteger(size) && size >= 1 && part % size === 0) return { count, size };
  }
  if (whole <= MAX_BLOCKS && cleanUnit(whole)) return { count: whole, size: 1 };
  return null;
}

// Small deterministic string hash (FNV-1a). Seeded by the item id so "randomized" clues are stable:
// the same problem shows the same clue blocks on every render, reload and device.
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 1-based block numbers whose running percent is shown on the 'clues' level: one or two blocks, never
// the block the answer lands on (that would just hand over the answer) and never the last block
// (which is always "100%" and teaches nothing).
export function clueBlocks(itemId, count, targetBlocks) {
  const candidates = [];
  for (let block = 1; block < count; block += 1) if (block !== targetBlocks) candidates.push(block);
  if (!candidates.length) return [];
  const wanted = count >= 5 ? 2 : 1;
  const seed = hash(`${itemId}|${count}`);
  const picked = [candidates[seed % candidates.length]];
  if (wanted === 2 && candidates.length > 1) {
    let next = candidates[(seed >>> 7) % candidates.length];
    for (let i = 0; next === picked[0] && i < candidates.length; i += 1) next = candidates[(candidates.indexOf(next) + 1) % candidates.length];
    if (next !== picked[0]) picked.push(next);
  }
  return picked.sort((a, b) => a - b);
}

// Everything the renderer needs. `filled` is how many blocks the kid has tapped (0..count).
export function blockView(item, filled) {
  const plan = blockPlan(item.part, item.whole);
  if (!plan) return null;
  const help = HELP_LEVELS.includes(item.help) ? item.help : 'none';
  const { count, size } = plan;
  const unit = 100 / count;
  const target = item.part / size;
  const fill = Math.min(count, Math.max(0, Number.isInteger(filled) ? filled : 0));
  const clues = help === 'clues' ? clueBlocks(item.id, count, target) : [];
  const labels = Array.from({ length: count }, (_, i) => {
    const block = i + 1;
    if (help === 'all' || (help === 'clues' && clues.includes(block))) return formatPct(block * unit);
    return null;
  });
  const unitText = size === 1 ? `1 block = ${formatPct(unit)}` : `1 block = ${size} of the ${item.whole} = ${formatPct(unit)}`;
  let caption;
  if (help === 'all' || help === 'unit') caption = unitText;
  else caption = `The whole is ${count} block${count === 1 ? '' : 's'} = 100%`;
  let readout = null;
  if (help === 'all') readout = fill > 0 ? `${fill} block${fill === 1 ? '' : 's'} = ${formatPct(fill * unit)}` : 'Tap the blocks to fill them in.';
  return { count, size, unit, help, labels, caption, readout, filled: fill, cols: Math.min(count, 10) };
}

// Tapping block k fills up to k; tapping the last filled block again takes it back off. Keeps the fill
// one contiguous run from the left — simple for a kid and never ambiguous.
export function nextFill(current, tapped, count) {
  const safe = Math.min(count, Math.max(0, Number.isInteger(current) ? current : 0));
  if (!Number.isInteger(tapped) || tapped < 1 || tapped > count) return safe;
  return tapped === safe ? tapped - 1 : tapped;
}

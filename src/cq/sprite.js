// Original pixel silhouettes. All artwork, including moving limbs, uses fillRect.
import { DEFAULT_LOOK, LOOK_OPTIONS } from './items.js';
import { getCosmetic, getItem, normalizeLook } from './character.js';

const INK = '#101c2e';
const shadeCache = new Map();
function shade(hex, factor = 0.68) {
  const key = `${hex}:${factor}`;
  if (!shadeCache.has(key)) {
    const n = parseInt(hex.slice(1), 16);
    shadeCache.set(key, '#' + [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) => Math.round(v * factor).toString(16).padStart(2, '0')).join(''));
  }
  return shadeCache.get(key);
}
const color = (look, key) => LOOK_OPTIONS[key].find((o) => o.id === look[key]).hex;

// Gear owns its palette and any profile/limb variant; slots never choose colors.
const GEAR_ART = {
  'start-blade': (p, box) => {
    p(7, 0, 2, 1, INK); box(6, 1, 4, 9, '#b78249');
    p(7, 1, 1, 8, '#e1b776');
    p(8, 2, 1, 7, '#ce9957');
    box(4, 9, 8, 2, '#725134'); box(7, 11, 2, 3, '#644139');
    p(6, 13, 4, 3, '#c78c43');
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) p(6 + x * 2, 13 + y * 2, 1, 1, '#fff3a3');
  },
  'switch-sword': (p, box) => {
    p(7, 0, 2, 1, INK); box(6, 1, 4, 9, '#c8e3eb');
    p(7, 1, 1, 8, '#58bfff');
    p(8, 2, 1, 7, '#f09b4b');
    box(4, 9, 8, 2, '#725134'); box(7, 11, 2, 3, '#644139');
    p(6, 13, 4, 3, '#c78c43');
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) p(6 + x * 2, 13 + y * 2, 1, 1, '#fff3a3');
  },
  'copy-crystal-staff': (p, box) => {
    box(7, 5, 2, 11, '#8b6599'); p(6, 7, 4, 1, '#f4d585');
    [[3, 1], [9, 0]].forEach(([x, y]) => {
      p(x + 1, y, 2, 1, '#e3fdff'); box(x, y + 1, 4, 4, '#66dbe0');
      p(x + 1, y + 5, 2, 1, '#4a9df0'); p(x + 1, y + 1, 1, 3, '#e3fdff');
    });
    p(5, 6, 6, 1, '#ba98ce');
  },
  'stop-sign-shield': (p, box, back) => {
    p(4, 1, 8, 14, '#e5dcd3'); p(1, 4, 14, 8, '#e5dcd3'); p(2, 2, 12, 12, '#e5dcd3');
    p(4, 2, 8, 12, '#ba3841'); p(2, 4, 12, 8, '#d94d4d'); p(3, 3, 10, 10, '#d94d4d');
    p(4, 6, 8, 3, back ? '#72483d' : '#fff2de'); p(5, 12, 6, 1, '#932a3e');
  },
  'folder-backpack': (p, box) => {
    box(3, 1, 5, 3, '#e2b654'); box(2, 3, 12, 12, '#c59545');
    p(3, 4, 10, 2, '#f2ce76'); box(4, 8, 8, 5, '#e2b654'); p(7, 8, 2, 2, '#745130');
  },
  'taskbar-boots': (p, box, back, view) => {
    if (view === 'foot') {
      p(0, 8, 4, 4, '#466384'); p(3, 8, 1, 4, '#304965');
      p(0, 9, 3, 1, '#7effe1'); p(0, 11, 4, 1, INK);
      return;
    }
    [1, 9].forEach((x) => { box(x, 3, 5, 10, '#304965'); box(x - 1, 11, 7, 4, '#466384');
      p(x, 10, 5, 1, '#7effe1'); p(x - 1, 14, 7, 1, '#101c2e'); p(x + 1, 4, 2, 4, '#6785a4'); });
  },
  'rename-rune': (p, box) => {
    p(5, 1, 6, 14, '#69469d'); box(3, 3, 10, 10, '#a278db');
    p(5, 3, 2, 8, '#cba4ff'); p(6, 5, 5, 4, '#efe0ff');
    p(5, 6, 2, 2, '#efe0ff'); p(9, 6, 1, 1, '#69469d');
  },
  'save-stone': (p, box) => {
    p(5, 1, 6, 14, '#227e89'); box(3, 3, 10, 10, '#42c6be');
    p(5, 3, 2, 8, '#9affdd'); p(7, 3, 3, 3, '#1d566b');
    p(6, 9, 5, 3, '#d3fff0'); p(7, 10, 3, 1, '#227e89');
  },
  'undo-amulet': (p, box) => {
    p(3, 0, 1, 7, '#e4bb63'); p(12, 0, 1, 7, '#e4bb63'); p(4, 6, 8, 2, '#e4bb63');
    box(4, 8, 8, 7, '#bd863e'); p(5, 8, 6, 6, '#ffe08a');
    p(6, 10, 4, 1, '#8b572d'); p(9, 10, 1, 3, '#8b572d'); p(7, 12, 3, 1, '#8b572d'); p(6, 9, 1, 3, '#8b572d');
  },
  'scam-spotter-helmet': (p, box, back, view) => {
    if (view === 'profile') {
      box(3, -1, 10, 4, '#a5bac9'); p(4, -2, 7, 1, '#d6e5eb');
      box(3, 2, 3, 5, '#667d93'); p(10, 3, 3, 2, '#512d46'); p(11, 3, 2, 1, '#f25162');
      return;
    }
    box(2, 3, 12, 9, '#a5bac9'); p(4, 1, 8, 3, '#d6e5eb'); p(3, 4, 2, 5, '#d6e5eb');
    p(2, 10, 3, 4, '#667d93'); p(11, 10, 3, 4, '#667d93');
    p(5, 7, 8, 3, back ? '#667d93' : '#512d46');
    if (!back) { p(8, 7, 4, 2, '#f25162'); p(9, 7, 2, 1, '#ffb7a1'); }
  },
};

// Each item lives in a 16-unit square, shared by the hero and inventory icons.
function art(p, entry, back = false, view = 'icon') {
  const id = typeof entry === 'string' ? entry : entry.id;
  const cosmetic = getCosmetic(id);
  const colors = cosmetic ? cosmetic.colors : ['#91b8cd'];
  const c = colors[0];
  const box = (x, y, w, h, fill) => {
    p(x, y, w, h, fill); p(x + w - 1, y, 1, h, shade(fill)); p(x, y + h - 1, w, 1, shade(fill));
  };
  if (Object.prototype.hasOwnProperty.call(GEAR_ART, id)) {
    GEAR_ART[id](p, box, back, view);
    return;
  }
  if (!cosmetic) return;
  if (cosmetic.layer === 'cape') {
    if (id === 'pixel-wings') {
      [false, true].forEach((right) => {
        const feather = (x, y, w, h, fill) => p(right ? 16 - x - w : x, y, w, h, fill);
        feather(0, 1, 2, 8, '#a66bf0'); feather(2, 3, 2, 9, '#c2a9ec'); feather(4, 6, 2, 8, c);
        feather(6, 9, 2, 5, '#dce5ff'); feather(0, 2, 1, 5, c); feather(2, 4, 1, 6, c);
      });
    } else {
      box(3, 1, 10, 13, c); p(2, 8, 12, 6, shade(c)); p(3, 3, 2, 11, c);
      if (id === 'cape-rainbow' || id === 'cape-flame') colors.forEach((v, i) => p(5, 2 + i * 11 / colors.length, 7, 11 / colors.length, v));
      else p(6, 3, 5, 10, c);
      if (id === 'cape-night') [[5, 4], [10, 6], [7, 10], [4, 12]].forEach(([x, y]) => p(x, y, 1, 1, colors[1]));
      p(5, 1, 6, 1, '#e9c36e');
    }
  } else if (cosmetic && cosmetic.layer === 'hat') {
    if (id === 'wizard-hat') { box(2, 12, 13, 3, c); box(5, 7, 7, 5, c); box(7, 3, 4, 4, c); p(8, 0, 2, 3, c); p(5, 11, 7, 1, '#e9c36e'); p(8, 6, 1, 2, '#f2db96'); }
    else if (id === 'pixel-crown') { box(2, 7, 12, 6, c); [2, 7, 12].forEach((x) => box(x, 3, 2, 5, c)); p(7, 9, 2, 2, '#5cdde0'); p(3, 8, 1, 2, '#fff1a6'); }
    else if (id === 'headphones') { p(3, 3, 10, 2, '#4a9df0'); p(2, 4, 2, 7, '#2a2a2e'); p(12, 4, 2, 7, '#2a2a2e'); box(1, 8, 4, 6, c); box(11, 8, 4, 6, c); }
    else if (id === 'bandana-blue') { box(2, 7, 12, 4, c); p(11, 11, 3, 4, c); p(4, 8, 7, 1, '#8bb1ec'); }
    else { box(3, 5, 10, 7, c); box(2, 10, 12, 3, c); p(id === 'cap-red' ? 7 : 5, 12, id === 'cap-red' ? 9 : 6, 1, shade(c)); p(5, 6, 4, 1, id === 'cap-red' ? '#eb7970' : '#a5adb6'); }
  } else if (id === 'face-stripes') {
    p(2, 5, 4, 2, c); p(10, 5, 4, 2, c); p(3, 8, 3, 2, shade(c)); p(10, 8, 3, 2, shade(c));
  } else if (id === 'sunglasses') {
    p(1, 5, 14, 2, c); box(2, 6, 5, 4, c); box(9, 6, 5, 4, c); p(3, 6, 2, 1, '#8bbed8'); p(10, 6, 2, 1, '#8bbed8');
  } else if (cosmetic && cosmetic.layer === 'hairFx') {
    box(2, 4, 12, 9, c); p(4, 2, 4, 3, c); p(10, 1, 3, 4, c);
    p(3, 8, 10, 3, colors[1] || c); p(4, 5, 3, 1, colors[1] || '#ffe7a4');
  } else if (cosmetic && cosmetic.layer === 'trail') {
    [[2, 11, 2], [6, 7, 3], [11, 2, 4]].forEach(([x, y, s]) => { box(x, y, s, s, c); p(x + 1, y - 1, 1, s + 2, colors[1] || '#a6d66a'); });
  } else {
    // Title insignia: ribbon, inset name bars, distinct rank jewel.
    box(1, 4, 14, 8, c); p(3, 6, 10, 1, '#e7f3f7'); p(5, 9, 6, 1, '#e7f3f7');
    p(3, 12, 3, 3, shade(c)); p(10, 12, 3, 3, shade(c));
  }
}

export function drawIcon(ctx, x, y, size, entry, { silhouette = false } = {}) {
  const resolved = typeof entry === 'string' ? getItem(entry) || getCosmetic(entry) : entry;
  if (!resolved) return;
  const u = size / 18;
  ctx.save();
  art((a, b, w, h, c) => {
    ctx.fillStyle = silhouette ? '#33485b' : c;
    const left = Math.round(x + (a + 1) * u), top = Math.round(y + (b + 1) * u);
    ctx.fillRect(left, top, Math.max(1, Math.round(x + (a + 1 + w) * u) - left), Math.max(1, Math.round(y + (b + 1 + h) * u) - top));
  }, resolved);
  ctx.restore();
}

// One overhand chop per swing, in limb() angles: 0 hangs down, +PI/2 points to grid -x, +-PI points up.
// Profile grid +x is the face side (mirror flips it for 'left'); front view's sword hand sits at grid x 0,
// back view's at x 12. Each pair is [raised wind-up, strike end], always on the facing side, never under
// or behind the body: profile goes overhead -> forward and a bit down (124 deg), front goes overhead-and-out ->
// down-and-out toward the viewer, clear of the idle pose (132 deg), back goes out at the side -> up-and-forward (105 deg).
const CHOP = {
  right: [-3.49, -1.32], left: [-3.49, -1.32],
  down: [2.75, 0.45], up: [-0.96, -2.79],
};
const CHOP_GRIP = 24; // Flipped 16-unit sword: pommel at local y 8, grip in the fist (y ~11), tip at y 24.
function chopAngle(facing, attack) {
  const [from, to] = CHOP[facing] || CHOP.down;
  // Hold the wind-up for the first frame, snap through the strike (ease-out cubic), then hold the end pose.
  const t = Math.max(0, Math.min(1, (attack - 0.12) / 0.38));
  return from + (to - from) * (1 - (1 - t) * (1 - t) * (1 - t));
}

export function drawCharacter(ctx, cx, cy, unit, opts = {}) {
  const look = normalizeLook(opts.look) || DEFAULT_LOOK;
  const equipped = opts.equipped || {};
  const worn = opts.worn || {};
  const facing = opts.facing || 'down';
  const back = facing === 'up';
  const side = facing === 'left' || facing === 'right';
  const mirror = facing === 'left';
  const bob = Math.round(Math.sin((opts.bob || 0) * Math.PI * 2));
  const swing = opts.walk ? Math.sin(opts.walk * Math.PI * 2) * 0.45 : 0;
  const skin = color(look, 'skin'), shirt = color(look, 'shirtColor');
  const pants = color(look, 'pantsColor'), shoes = color(look, 'shoesColor');
  const hairFx = getCosmetic(worn.hairFx);
  const hair = hairFx ? hairFx.colors[0] : color(look, 'hairColor');
  ctx.save();
  // Grid origin is top-left of the 16 × 32 figure; feet anchor never drifts.
  const p = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    const left = cx + ((mirror ? 16 - x - w : x) - 8) * unit;
    const top = cy + (y - 32 + bob) * unit;
    // Round both edges in device space; fractional accessory scales must not blur.
    ctx.fillRect(Math.round(left), Math.round(top), Math.max(1, Math.round(left + w * unit) - Math.round(left)), Math.max(1, Math.round(top + h * unit) - Math.round(top)));
  };
  const box = (x, y, w, h, c) => { p(x, y, w, h, c); p(x + w - 1, y, 1, h, shade(c)); p(x, y + h - 1, w, 1, shade(c)); };
  const item = (id, x, y, w, h, painter = p, view = 'icon') => {
    if (id) art((a, b, rw, rh, c) => painter(x + a * w / 16, y + b * h / 16, rw * w / 16, rh * h / 16, c), id, back, view);
  };
  if (opts.glow) {
    p(3, -1, 10, 10, '#f2b631'); p(side ? 5 : -1, 8, side ? 6 : 18, 13, '#f2b631'); p(side ? 5 : 3, 20, side ? 6 : 10, 13, '#f2b631');
  }
  const cape = getCosmetic(worn.cape);
  const drawCape = () => {
    if (cape) item(cape.id, cape.id === 'pixel-wings' ? (side ? -5 : -9) : side ? 1 : 0, 8, cape.id === 'pixel-wings' ? (side ? 18 : 34) : side ? 8 : 16, 21);
  };
  const backpack = () => item(equipped.back, side ? 1 : 2, 9, side ? 6 : 12, 14);
  drawCape();
  if (!back) backpack();
  // Limbs rotate by snapping each source pixel to the grid: crisp during motion.
  const limb = (x, y, angle, draw) => {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    draw((a, b, w, h, c) => {
      if (!angle) { p(x + a, y + b, w, h, c); return; }
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
        p(x + Math.round(a * cos - b * sin + i * cos - j * sin), y + Math.round(a * sin + b * cos + i * sin + j * cos), Math.min(1, w - i), Math.min(1, h - j), c);
      }
    });
  };
  const rightX = back ? 12 : 0, leftX = back ? 0 : 12;
  const arm = (right, far = false) => {
    const attack = right && opts.attack ? chopAngle(facing, opts.attack) : 0;
    const angle = attack || (right ? swing : -swing);
    const x = side ? (far ? 7 : 5) : right ? rightX : leftX;
    limb(x, opts.blocking && !right ? 6 : 8, angle, (paint) => {
      const q = (a, b, w, h, c) => paint(a, b, w, h, far ? shade(c) : c);
      q(0, 0, 4, 12, skin); q(3, 0, 1, 12, shade(skin));
      const sleeve = look.shirtStyle === 'hoodie' || look.shirtStyle === 'jacket' ? 10 : 4;
      q(0, 0, 4, sleeve, shirt); q(3, 0, 1, sleeve, shade(shirt));
      if (look.shirtStyle === 'striped') q(0, 2, 3, 2, shade(shirt));
      const gear = right ? equipped.mainHand : equipped.offHand;
      if (gear === 'stop-sign-shield') item(gear, opts.blocking ? -4 : -2, opts.blocking ? 3 : 7, 10, 11, paint);
      else if (gear && attack) {
        // Mid-chop the blade leaves the fist along the arm (grip stays in the hand) instead of lying back along it.
        item(gear, side ? (far ? -6 : -4) : -2, 0, 8, 16, (a, b, w, h, c) => paint(a, CHOP_GRIP - b - h, w, h, c));
      } else if (gear) item(gear, side ? (right ? (far ? -6 : -4) : 0) : -2, gear === 'copy-crystal-staff' ? -9 : -4, 8, gear === 'copy-crystal-staff' ? 23 : 19, paint);
    });
  };
  // Right-facing near side is the left hand; left-facing near side is the right.
  if (side) arm(!mirror, true);
  else if (back) { arm(true); arm(false); }
  const leg = (x, phase, far = false) => limb(x, 20, phase, (paint) => {
    const q = (a, b, w, h, c) => paint(a, b, w, h, far ? shade(c) : c);
    q(0, 0, 4, 12, pants); q(3, 0, 1, 12, shade(pants)); q(0, 1, 1, 5, shade(pants));
    q(0, 9, 4, 3, shoes); q(0, 11, 4, 1, shade(shoes));
    q(0, 9, 3, 1, shoes);
    item(equipped.feet, 0, 0, 16, 16, q, 'foot');
  });
  if (side) { leg(7, mirror ? swing : -swing, true); leg(5, mirror ? -swing : swing); }
  else { leg(4, swing); leg(8, -swing); }
  box(side ? 6 : 4, 8, side ? 4 : 8, 12, shirt);
  if (look.shirtStyle === 'striped') [10, 14, 18].forEach((y) => p(side ? 6 : 4, y, side ? 4 : 8, 2, shade(shirt)));
  if (look.shirtStyle === 'jacket' && !back) { p(side ? 9 : 7, 9, side ? 1 : 2, 10, '#edf2ea'); p(5, 10, 1, 8, shade(shirt)); }
  if (look.shirtStyle === 'hoodie') {
    box(side ? 5 : 3, 8, side ? 5 : 10, back ? 5 : 2, shade(shirt));
    if (!back) { box(side ? 8 : 6, 16, side ? 2 : 4, 3, shade(shirt)); p(6, 10, 1, 3, '#d9e4dd'); p(9, 10, 1, 3, '#d9e4dd'); }
  }
  if (side) arm(mirror);
  else if (!back) { arm(true); arm(false); }
  if (back) { drawCape(); backpack(); }
  p(4, 0, 8, 8, skin);
  p(side ? 4 : 11, 0, 1, 8, shade(skin));
  if (!back) {
    const eyes = side ? [10] : [5, 9];
    eyes.forEach((x) => { p(x, 3, 2, 1, '#fff5e7'); p(x + (side ? 1 : 0), 3, 1, 1, color(look, 'eyeColor')); });
    const smile = shade(skin, 0.85);
    p(side ? 10 : 7, 6, 2, 1, smile);
    p(side ? 11 : 6, 5, 1, 1, smile);
    if (!side) p(9, 5, 1, 1, smile);
    if (side) p(12, 4, 1, 1, skin);
  }
  if (look.hairStyle !== 'none') {
    const hp = (x, y, w, h) => {
      for (let row = 0; row < h; row++) p(x, y + row, w, 1, hairFx && hairFx.id === 'hair-galaxy' && y + row >= 1 ? hairFx.colors[1] : hair);
      p(x + w - 1, y, 1, h, shade(hair));
    };
    hp(4, 0, 8, look.hairStyle === 'buzz' ? 1 : 2);
    if (back) hp(4, 1, 8, look.hairStyle === 'buzz' ? 5 : 7);
    if (side) hp(4, 1, 3, 5);
    if (look.hairStyle === 'short') { hp(4, 1, 1, 3); hp(10, 1, 2, 1); }
    if (look.hairStyle === 'spiky') [[4, -2, 2, 3], [7, -3, 2, 4], [10, -1, 2, 3]].forEach((r) => hp(...r));
    if (look.hairStyle === 'curly') [[3, 0, 2, 3], [4, -1, 3, 2], [8, -1, 3, 2], [11, 0, 2, 3]].forEach((r) => hp(...r));
    if (look.hairStyle === 'long') { hp(3, 1, 2, 9); hp(11, 1, 2, 9); if (back) hp(4, 4, 8, 6); }
    if (look.hairStyle === 'swoop') { hp(3, -1, 7, 2); hp(4, 1, 4, 2); hp(4, 3, side ? 2 : 1, 1); }
  }
  if (!back && worn.face) {
    if (!side) item(worn.face, 4, worn.face === 'face-stripes' ? 3 : 0, 8, worn.face === 'face-stripes' ? 5 : 8);
    else if (worn.face === 'sunglasses') { p(6, 3, 6, 1, '#2a2a2e'); p(10, 3, 2, 2, '#2a2a2e'); p(10, 3, 1, 1, '#8bbed8'); }
    else { p(10, 5, 2, 1, '#d64545'); p(10, 6, 1, 1, '#912f2f'); }
  }
  if (equipped.head && side) item(equipped.head, 0, 0, 16, 16, p, 'profile');
  else if (equipped.head) item(equipped.head, 2, -3, 12, 12);
  else if (worn.hat) item(worn.hat, 2, worn.hat === 'wizard-hat' ? -11 : -7, 12, 12);
  [equipped.magic1, equipped.magic2].forEach((id, i) => {
    if (id === 'undo-amulet') { if (!back) item(id, 5, 9, 6, 7); }
    else if (id) item(id, i ? 17 : -8, 4 + (i ? -bob : bob), 7, 8);
  });
  ctx.restore();
}

export function characterCanvas(cssSize, opts = {}) {
  const canvas = document.createElement('canvas');
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssSize * ratio); canvas.height = Math.round(cssSize * ratio);
  canvas.style.width = `${cssSize}px`; canvas.style.height = `${cssSize}px`;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // Integer physical pixels preserve the grid even on high-density displays.
  drawCharacter(ctx, canvas.width / 2, canvas.height * 0.86, Math.max(1, Math.floor(canvas.width / 50)), opts);
  return canvas;
}

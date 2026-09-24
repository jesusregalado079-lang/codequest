// Hero alcove. All art is built from rectangles; the optional cached stone layer is
// supplied by the caller so the renderer stays deterministic and DOM independent.
const W = 320;
const H = 320;

function painter(ctx, width, height) {
  const sx = width / W, sy = height / H;
  return (x, y, w, h, color) => {
    if (x >= W || y >= H || x + w <= 0 || y + h <= 0) return;
    const left = Math.round(Math.max(0, x) * sx), top = Math.round(Math.max(0, y) * sy);
    const right = Math.round(Math.min(W, x + w) * sx), bottom = Math.round(Math.min(H, y + h) * sy);
    ctx.fillStyle = color;
    ctx.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
  };
}

export function drawHeroStageStone(ctx, { width, height }) {
  const r = painter(ctx, width, height);
  r(0, 0, 320, 320, '#10283b');
  // Courses of worn stone, with offset joints and small moss patches at the sides.
  for (let row = 0; row < 8; row += 1) {
    const y = row * 33;
    r(0, y, 320, 31, row % 2 ? '#263d4b' : '#2c4451');
    r(0, y + 29, 320, 4, '#172e3e');
    const offset = row % 2 ? -25 : 12;
    for (let x = offset; x < 320; x += 72) {
      if (x > 0) r(x, y + 2, 2, 27, '#1c3443');
      if ((row * 7 + x) % 3 === 0) r(Math.max(0, x + 9), y + 7, 18, 3, '#344d58');
    }
  }
  // Recessed arch keeps the center quiet behind the hero.
  r(74, 31, 172, 221, '#152f40');
  r(82, 35, 156, 217, '#17364a');
  r(90, 39, 140, 213, '#1c4050');
  r(98, 48, 124, 204, '#1d4250');
  r(74, 31, 172, 7, '#49616a');
  r(80, 38, 160, 4, '#354f5b');
  r(74, 31, 8, 221, '#3c5661');
  r(238, 31, 8, 221, '#263e4d');
  r(83, 48, 3, 186, '#55727a');
  r(0, 252, 320, 8, '#4d6369');
  r(0, 260, 320, 60, '#203b48');
  r(0, 261, 320, 4, '#628188');
  for (let x = 0; x < 320; x += 40) {
    r(x, 270, 38, 18, (x / 40) % 2 ? '#294551' : '#2c4854');
    r(x + 14, 290, 2, 19, '#193340');
  }
  r(0, 309, 320, 11, '#142e3d');
  // Side wall wear and moss; no decoration crosses the hero's silhouette.
  [[14, 49, 15, 4], [33, 51, 7, 3], [270, 58, 17, 4], [287, 61, 6, 3],
    [20, 135, 11, 3], [31, 138, 5, 4], [276, 204, 16, 4], [289, 207, 8, 3],
    [11, 222, 18, 3], [28, 224, 7, 5]].forEach(([x, y, w, h]) => r(x, y, w, h, '#537c57'));
  [[17, 74, 2, 17], [19, 88, 10, 2], [301, 118, 2, 16], [291, 132, 12, 2],
    [9, 183, 2, 12], [11, 193, 8, 2], [298, 229, 2, 12]].forEach(([x, y, w, h]) => r(x, y, w, h, '#142d3a'));
  // Small lesson terminal and keyboard tucked onto the right wall.
  r(262, 146, 44, 5, '#121f2d');
  r(267, 118, 34, 27, '#71858a');
  r(270, 121, 28, 20, '#193c4c');
  r(274, 125, 7, 3, '#73afa7');
  r(274, 131, 18, 2, '#569795');
  r(274, 136, 12, 2, '#3c777d');
  r(273, 150, 25, 3, '#84979a');
  r(278, 153, 16, 2, '#142f3d');
  // Torch brackets remain at the edges, behind the character.
  [38, 282].forEach((x) => {
    r(x - 4, 93, 8, 18, '#493e37');
    r(x - 9, 91, 18, 5, '#718187');
    r(x - 6, 96, 12, 3, '#354751');
    r(x - 12, 111, 24, 3, '#172c3b');
  });
  // Pedestal: broad top, stepped sides, three carved marks.
  r(64, 286, 192, 12, '#142b39');
  r(74, 276, 172, 21, '#354f5b');
  r(70, 271, 180, 9, '#718e91');
  r(76, 273, 168, 4, '#a0b1a8');
  r(82, 280, 156, 4, '#233d4a');
  r(86, 289, 148, 5, '#263f4a');
  [104, 156, 208].forEach((x) => {
    r(x, 285, 8, 2, '#597479');
    r(x + 3, 287, 2, 4, '#597479');
  });
}

export function makeHeroStageLayer({ width, height, makeCanvas }) {
  const canvas = makeCanvas(width, height);
  canvas.width = width;
  canvas.height = height;
  drawHeroStageStone(canvas.getContext('2d'), { width, height });
  return canvas;
}

export function drawHeroStage(ctx, { width, height, time = 0, reduced = false, glow = false, bob = 0, facing, stoneLayer }) {
  // `facing` is intentionally unused: the room never rotates with the hero.
  void facing;
  if (stoneLayer) ctx.drawImage(stoneLayer, 0, 0);
  else drawHeroStageStone(ctx, { width, height });
  const r = painter(ctx, width, height);
  const t = reduced ? 0 : time;
  // Small, slow torch flames. Only a few pixels change at each phase.
  [38, 282].forEach((x, i) => {
    const sway = Math.round(Math.sin(t * 3 + i * 2.4) * 2);
    const heightDelta = Math.round(Math.sin(t * 4 + i * 1.8) * 2);
    r(x - 8, 78, 16, 13, '#776856');
    r(x - 5 + sway, 77 - heightDelta, 10, 16 + heightDelta, '#df873a');
    r(x - 3 + sway, 80 - heightDelta, 6, 11 + heightDelta, '#f5b655');
    r(x - 1 + sway, 84 - heightDelta, 3, 7 + heightDelta, '#ffe19a');
  });
  // Dust stays at the sides of the arch and drifts without random state.
  for (let i = 0; i < 6; i += 1) {
    const side = i % 2 ? 1 : -1;
    const x = 160 + side * (89 + (i % 3) * 15) + Math.round(Math.sin(t * 0.7 + i * 1.9) * 4);
    const y = 72 + i * 29 + Math.round(Math.sin(t * 0.45 + i * 1.3) * 7);
    r(x, y, 2, 2, i % 3 ? '#789887' : '#b4b58b');
  }
  // The floor shadow tracks the sprite's rounded idle bob; it narrows as the hero rises.
  const rise = reduced ? 0 : Math.max(0, -Math.sin(bob * Math.PI * 2));
  const halfShadow = Math.round(53 - rise * 5);
  r(160 - halfShadow, 265, halfShadow * 2, 5, '#18323d');
  r(160 - halfShadow + 8, 269, (halfShadow - 8) * 2, 3, '#233b43');
  if (glow) {
    // A quiet set-bonus ring and sequential runes, all behind the sprite.
    r(93, 278, 134, 2, '#8d8052');
    r(98, 280, 124, 2, '#655f45');
    const lit = Math.floor(t * 0.85) % 3;
    [107, 158, 209].forEach((x, i) => {
      const color = i === lit ? '#ffe39a' : '#a59661';
      r(x, 284, 5, 2, color);
      r(x + 2, 286, 2, 3, color);
    });
  }
  // A single pedestal glint crosses one carved edge roughly once every four seconds.
  if (!reduced && t % 4 < 0.45) {
    const x = 88 + Math.floor((t % 4) / 0.45 * 132);
    r(x, 273, 4, 2, '#c6d4c0');
  }
}

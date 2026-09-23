// Small, original drawings for the Daily Work desk. Presentation only; no hub assets or state.
const svg = (body, className, viewBox = '0 0 24 24') => `<svg class="${className}" viewBox="${viewBox}" fill="none" aria-hidden="true" focusable="false">${body}</svg>`;

export function statusMark(status) {
  const marks = {
    'not-started': '<circle cx="12" cy="12" r="7"/>',
    'in-progress': '<circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 0 14Z" fill="currentColor" stroke="none"/>',
    'awaiting-check': '<circle cx="12" cy="12" r="7"/><path d="M12 8v5h4"/>',
    'needs-fixes': '<path d="M6 9a7 7 0 1 1-1 6M6 4v5h5"/>',
    complete: '<path d="m5 12 4.5 4.5L19 7"/>',
  };
  return svg(marks[status] || marks['not-started'], 'cqd-status-mark');
}

export function bookMark() {
  return svg('<path d="M12 6C9 4 5 4 2 5v14c3-1 7-1 10 1 3-2 7-2 10-1V5c-3-1-7-1-10 1Zm0 0v14M5 8h3M5 11h3M16 8h3M16 11h3"/>', 'cqd-book-mark');
}

// The same restrained gold cross appears on the small Bible and its opening cover.
// Decorative geometry only: no lettering, imitation scripture, or page numbers.
const bibleCross = '<path d="M47 39h6v14h11v6H53v23h-6V59H36v-6h11Z" fill="#ecd49a"/><path d="M48 41v14H38m11 3v22" stroke="#fff3cf" stroke-width="1" opacity=".65"/>';

export function bibleMark() {
  return svg(`<ellipse cx="48" cy="111" rx="36" ry="4" fill="#17394b" opacity=".12"/>
    <path d="M16 15h62q7 0 7 7v82q0 7-7 7H17q-7 0-7-7V23q0-8 6-8Z" fill="#1c394d"/>
    <path d="M18 91h64v13H18q-6 0-6-6t6-7Z" fill="#f5e8c7" stroke="#c6ae78"/>
    <path d="M21 96h59m-59 4h59" stroke="#d3bc88" stroke-width="1"/>
    <path d="M63 94h9v23l-4.5-4-4.5 4Z" fill="#ad5750"/>
    <path d="M18 6h61q6 0 6 6v81q0 5-6 5H18q-8 0-8-8V14q0-8 8-8Z" fill="#294e65" stroke="#1c394d" stroke-width="2"/>
    <path d="M21 7v90M15 18v67" stroke="#53768a" stroke-width="1.5"/>
    <path d="M27 15h49v73H27Z" stroke="#c6a76a" stroke-width="1" opacity=".8"/>
    <g transform="translate(15 4) scale(.72 .78)">${bibleCross}</g>
    <path d="M28 19h7m34 0h4M28 84h7m34 0h4" stroke="#ecd49a" stroke-width="1" opacity=".6"/>`, 'cqd-bible-mark', '0 0 96 120');
}

export function bibleCoverMark() {
  return svg(bibleCross, 'cqd-bible-cover-mark', '0 0 100 120');
}

export function seasonMark() {
  return svg(`<g class="cqd-season-winter"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1"/></g>
    <g class="cqd-season-spring"><path d="M12 20v-7m0 5c-4 0-6-2-6-4 4 0 6 2 6 4Zm0-3c4 0 6-2 6-4-4 0-6 2-6 4Z"/><path d="M12 3c-4-4-8 3-3 5-1 5 7 5 6 0 5-2 1-9-3-5Z"/></g>
    <g class="cqd-season-summer"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g>
    <g class="cqd-season-fall"><path d="M5 19C0 9 9 3 21 3c0 12-6 20-16 16Zm-2 3L17 8M8 17v-6m0 6h6"/></g>`, 'cqd-season-mark');
}

// Month artwork is a little illustrated almanac. These original paths only receive a month
// and a placement, never a day, status, answer, store, or interaction state. Each motif uses
// the same 64px drawing space so the header, page margins, and foot of the grid stay related.
const MONTH_MOTIFS = {
  snow: '<path d="M32 7v50M10 19l44 26M10 45l44-26M24 11l8 8 8-8M24 53l8-8 8 8M11 28l11-3-3-11M45 50l-3-11 11-3M11 36l11 3-3 11M45 14l-3 11 11 3"/><circle class="cqd-art-paper" cx="32" cy="32" r="5"/>',
  pine: '<path class="cqd-art-gold" d="M28 43h8v15h-8z"/><path class="cqd-art-leaf" d="m32 5 15 18h-7l14 17h-9l12 11H7l12-11h-9l14-17h-7Z"/><path class="cqd-art-paper" d="m32 5 10 12-10-3-10 3Z"/><path d="m22 32 10-3 10 3m-25 12 15-4 15 4"/>',
  mitten: '<path class="cqd-art-paint" d="M19 45 10 30c-5-9 4-14 10-4V17c0-17 28-17 28 0v20c0 8-5 13-12 15Z"/><path class="cqd-art-paper" d="m18 43 24-2 3 13-24 3Z"/><path d="m25 46 1 7m6-8 1 7m6-8 1 7M28 23l10 10m0-10L28 33m5-13v16m-8-8h16"/>',
  mug: '<path class="cqd-art-paint" d="M12 22h33v23c0 14-33 14-33 0Z"/><path d="M45 26h5c13 0 11 18-5 17M20 16c-7-6 7-6 0-12m12 12c-7-6 7-6 0-12"/><path class="cqd-art-paper" d="M28 34c-8-9-17 5 0 13 17-8 8-22 0-13Z"/><path d="M8 58h44"/>',
  bird: '<path class="cqd-art-paint" d="M8 38c16 3 6-20 24-20 10 0 16 8 16 18 0 22-32 25-40 2Z"/><path class="cqd-art-shade" d="M18 38q12-14 20 0-8 15-20 0Z"/><path class="cqd-art-gold" d="m48 30 10 5-10 4Z"/><circle class="cqd-art-ink" cx="38" cy="29" r="1.8"/><path d="m27 53-2 7m11-8 2 8M4 61h52"/>',
  kite: '<path d="M31 40c19 13-19 12-3 22"/><path class="cqd-art-paint" d="m31 3 22 17-22 25L9 20Z"/><path class="cqd-art-gold" d="m31 3 22 17H31Z"/><path class="cqd-art-shade" d="M9 20h22v25Z"/><path d="M31 3v42M9 20h44"/><path class="cqd-art-leaf" d="m36 49-7-5v9Zm-8 8-7-5v10Z"/>',
  sprout: '<path d="M32 55V24"/><path class="cqd-art-leaf" d="M32 39C5 42 4 17 8 13c18 1 26 9 24 26Zm0-10C31 10 45 4 57 9c0 14-11 23-25 20Z"/><path d="M14 21 32 39m0-10L49 15M17 57h29"/>',
  cloud: '<path class="cqd-art-paper" d="M15 43C-1 43 1 22 17 24 20 5 44 5 47 24c20-1 21 22 4 22H16"/><path d="M7 52h29m6 0h13M19 59h23"/>',
  umbrella: '<path class="cqd-art-paint" d="M5 31C8 2 56 2 59 31q-7-6-14 0-7-6-13 0-7-6-14 0-7-6-13 0Z"/><path class="cqd-art-shade" d="M18 31C20 4 43 4 45 31q-7-6-13 0-7-6-14 0Z"/><path d="M32 4v47c0 12 15 12 15 2M32 9v22"/><ellipse class="cqd-art-shade" cx="26" cy="60" rx="21" ry="2" stroke="none"/>',
  drop: '<path class="cqd-art-paint" d="M32 7C25 21 14 30 14 40a18 18 0 0 0 36 0c0-10-11-19-18-33Z"/><path class="cqd-art-highlight" d="M22 39q-1 9 7 11"/>',
  tulip: '<path d="M32 57V31"/><path class="cqd-art-leaf" d="M32 51C16 53 11 41 12 35c11 0 20 8 20 16Zm0-5c13 0 20-9 19-15-12 1-19 7-19 15Z"/><path class="cqd-art-paint" d="M16 10 25 17l7-12 7 12 9-7v11c0 23-32 23-32 0Z"/>',
  flower: '<path d="M32 61V32"/><path class="cqd-art-leaf" d="M32 53q-19 1-20-14 18-1 20 14Z"/><path class="cqd-art-paint" d="M32 12c-13-19-27 2-15 11-23 5-9 28 5 20 0 21 27 20 25-1 20 5 24-21 6-24C58-1 33-7 32 12Z"/><circle class="cqd-art-gold" cx="33" cy="27" r="10"/><g class="cqd-art-ink" stroke="none"><circle cx="29" cy="25" r="1.5"/><circle cx="37" cy="25" r="1.5"/><circle cx="33" cy="31" r="1.5"/></g>',
  butterfly: '<path class="cqd-art-paint" d="M30 31C-1-7-6 36 22 38-2 12 1 63 30 44Zm4 0C65-7 70 36 42 38c24-26 21 25-8 6Z"/><path d="M32 26v23m0-22-7-10m7 10 7-10"/><circle class="cqd-art-gold" cx="15" cy="25" r="5"/><circle class="cqd-art-gold" cx="49" cy="25" r="5"/>',
  leaf: '<path class="cqd-art-leaf" d="M13 50C-1 19 30 6 55 7c2 31-10 55-42 43Z"/><path d="M7 58 46 17M22 43V26m0 17h18M33 32V20m0 12h13"/>',
  boat: '<path class="cqd-art-paint" d="M6 44h52L46 57H19Z"/><path d="M33 5v39"/><path class="cqd-art-paper" d="M29 9 8 37h21Z"/><path class="cqd-art-gold" d="m37 17 18 20H37Z"/><path d="M3 61q7-5 14 0t14 0 14 0 14 0"/>',
  sun: '<circle class="cqd-art-gold" cx="32" cy="32" r="17"/><path d="M32 3v6m0 46v6M3 32h6m46 0h6M11 11l5 5m32 32 5 5M11 53l5-5m32-32 5-5"/><path class="cqd-art-highlight" d="M23 31a9 9 0 0 1 9-9"/>',
  shell: '<path class="cqd-art-paint" d="M26 55 7 30C-6 12 15 2 23 13c3-18 22-13 23 0 17-8 26 10 13 23L39 55Z"/><path class="cqd-art-paper" d="M26 50h13v8H26Z"/><path d="M23 14 29 50m17-37-9 37M13 24l16 26m24-25L38 50M33 10v40"/>',
  melon: '<path class="cqd-art-leaf" d="M5 21h54c0 47-54 47-54 0Z"/><path class="cqd-art-paper" d="M9 21h46c0 39-46 39-46 0Z"/><path class="cqd-art-paint" d="M13 21h38c0 31-38 31-38 0Z"/><path d="m22 29 1 4m18-4-1 4m-8 2v4"/>',
  pinwheel: '<path d="M32 31v31"/><path class="cqd-art-paint" d="M32 31 9 9h23Zm0 0 23-23v24Z"/><path class="cqd-art-gold" d="m32 31 22 22H32Zm0 0L9 54V31Z"/><circle class="cqd-art-paper" cx="32" cy="31" r="4"/>',
  sunflower: '<path d="M32 37v26"/><path class="cqd-art-leaf" d="M32 56q16 2 18-11-15-3-18 11Z"/><path class="cqd-art-gold" d="m32 2 6 9 11-5 1 12 12 3-7 10 6 10-12 3-1 11-11-5-7 9-6-10-11 5 1-12L3 37l8-9-6-10 12-2L19 5l10 6Z"/><circle class="cqd-art-paint" cx="32" cy="29" r="13"/><path d="m25 24 14 10m-14-2 13-9m-6-6v23"/>',
  dragonfly: '<path class="cqd-art-paper" d="M31 29C0-2-5 32 29 35-1 31 8 57 31 38Zm3 0C65-2 69 32 36 35c30-4 21 22-2 3Z"/><path d="M33 26v31m-5-39 5 7 5-7"/><circle class="cqd-art-gold" cx="33" cy="26" r="4"/>',
  apple: '<path class="cqd-art-paint" d="M32 18C8 3-3 28 14 53c7 12 15 4 18 4s12 8 20-5C69 28 56 3 32 18Z"/><path d="M31 20 29 7"/><path class="cqd-art-leaf" d="M32 14Q36-2 50 6 44 19 32 14Z"/><path class="cqd-art-highlight" d="M15 31q-3 7 2 13"/>',
  maple: '<path class="cqd-art-paint" d="m32 3 8 17 11-9-1 17 11-2-8 13 4 8-20 3-5 9-5-9-20-3 4-8-8-13 11 2-1-17 11 9Z"/><path d="M32 17v46M18 33l14 13 14-13"/>',
  acorn: '<path class="cqd-art-paint" d="M14 28h36c0 19-13 30-18 32-7-4-18-14-18-32Z"/><path class="cqd-art-gold" d="M10 30c0-27 44-27 44 0Z"/><path d="M32 10q-2-8 6-8M17 22l5 6 8-9 8 9 7-6"/><path class="cqd-art-highlight" d="M22 36q1 9 6 13"/>',
  pumpkin: '<path class="cqd-art-leaf" d="M29 20 28 8l9-3-2 16"/><path class="cqd-art-paint" d="M32 21C2 5-8 51 18 57c7 2 10-1 14-1s9 3 16 1C74 50 61 5 32 21Z"/><ellipse cx="32" cy="38" rx="13" ry="20"/><path d="M34 18q17-17 22-7t-9 6"/><path class="cqd-art-highlight" d="M13 29q-5 7-2 14"/>',
  bat: '<path class="cqd-art-ink" d="M29 25 26 18l7 4 6-4-1 8C47 11 55 14 61 20 50 24 55 31 58 34c-12-3-15 3-14 9-7-3-9 2-12 7-4-6-6-9-13-7 1-8-4-12-14-9 5-6 6-11-2-14 10-7 21-5 26 5Z"/><path class="cqd-art-highlight" d="M30 31h1m5 0h1"/>',
  moon: '<path class="cqd-art-gold" d="M43 5C0 7-1 59 43 59 21 45 21 21 43 5Z"/><path d="m50 17 2 5 6 1-5 4 1 6-5-3-5 3 1-6-4-4 6-1Z"/>',
  mushroom: '<path class="cqd-art-paper" d="m26 30-6 26c-2 8 26 8 24 0l-6-26Z"/><path class="cqd-art-paint" d="M5 34C6-7 58-7 59 34q-26 8-54 0Z"/><g class="cqd-art-paper" stroke="none"><circle cx="21" cy="20" r="5"/><circle cx="40" cy="15" r="4"/><circle cx="45" cy="30" r="4"/></g><path d="M30 44v9"/>',
  wheat: '<path d="M33 61V9"/><path class="cqd-art-gold" d="M33 18Q18 13 23 3q12 3 10 15Zm0 13Q14 30 18 16q14 2 15 15Zm0 15Q13 44 17 30q15 2 16 16Zm0-24Q48 21 46 8 33 10 33 22Zm0 15Q53 35 49 22 33 23 33 37Zm0 14Q53 50 50 37 34 38 33 51Z"/>',
  ornament: '<path d="M32 0v14"/><path class="cqd-art-gold" d="M25 13h14v10H25Z"/><circle class="cqd-art-paint" cx="32" cy="40" r="21"/><path class="cqd-art-paper" d="m32 26 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z"/>',
  star: '<path class="cqd-art-gold" d="m32 4 8 18 20 2-15 14 5 21-18-11-18 11 5-21L4 24l20-2Z"/><path class="cqd-art-highlight" d="m32 17-4 12-10 1"/>',
};

const MONTH_ART = [
  { main: 'pine', side: 'mitten', small: 'snow', ground: 'snow' },
  { main: 'mug', side: 'mitten', small: 'bird', ground: 'snow' },
  { main: 'kite', side: 'sprout', small: 'cloud', ground: 'grass' },
  { main: 'umbrella', side: 'tulip', small: 'drop', ground: 'water' },
  { main: 'flower', side: 'tulip', small: 'butterfly', ground: 'grass' },
  { main: 'boat', side: 'shell', small: 'sun', ground: 'water' },
  { main: 'melon', side: 'pinwheel', small: 'sun', ground: 'picnic' },
  { main: 'sunflower', side: 'leaf', small: 'dragonfly', ground: 'grass' },
  { main: 'apple', side: 'acorn', small: 'maple', ground: 'leaves' },
  { main: 'pumpkin', side: 'moon', small: 'bat', ground: 'leaves' },
  { main: 'mushroom', side: 'acorn', small: 'wheat', ground: 'leaves' },
  { main: 'pine', side: 'ornament', small: 'star', ground: 'snow' },
];

function motif(name, x, y, size, tilt = 0) {
  return `<g transform="translate(${x} ${y}) scale(${size / 64}) rotate(${tilt} 32 32)">${MONTH_MOTIFS[name]}</g>`;
}

function groundArt(kind) {
  const lines = {
    snow: '<path class="cqd-art-paper" d="M0 67Q30 45 66 61t67-3 77 7v15H0Z"/><path d="M16 73q26-7 43-2m96-2 30 2"/>',
    water: '<path class="cqd-art-shade" d="M0 66q18-9 35 0t35 0 35 0 35 0 35 0 35 0v14H0Z"/><path d="M7 74h25m11-3h32m63 3h28m9-4h24"/>',
    grass: '<path d="M0 73q48-12 105-4t105 0M11 70l-4-8m4 8 4-12m150 12-4-7m4 7 4-11m24 9 3-6"/>',
    picnic: '<path class="cqd-art-shade" d="m4 64 157-4 39 17H14Z"/><path d="m29 64 12 11m14-12 12 11m14-12 12 11m14-12 12 11m14-12 12 11M14 69h164"/>',
    leaves: '<path d="M0 73q49-9 105-4t105 0"/>' + motif('leaf', 7, 58, 18, -65) + motif('maple', 151, 55, 21, 42),
  };
  return lines[kind];
}

export function monthIllustration(month, placement = 'header') {
  const art = MONTH_ART[month - 1] || MONTH_ART[0];
  if (placement === 'seal') return svg(motif(art.small, 0, 0, 64), 'cqd-month-art cqd-month-seal', '0 0 64 64');
  if (placement === 'margin') {
    return svg(`<path class="cqd-art-trail" d="M16 5q-16 40 0 78t0 78 0 78 0 78v38"/>${motif(art.small, 2, 18, 28, -18)}${motif(art.side, 3, 130, 26, 14)}${motif(art.small, 2, 242, 28, 15)}`, 'cqd-month-art cqd-month-margin', '0 0 32 360');
  }
  if (placement === 'footer-left') {
    return svg(`${groundArt(art.ground)}${motif(art.side, 23, 25, 43, -12)}${motif(art.main, 70, 5, 66, 6)}${motif(art.small, 153, 9, 28, 12)}`, 'cqd-month-art cqd-month-foot-art', '0 0 210 80');
  }
  if (placement === 'footer-right') {
    return svg(`${groundArt(art.ground)}${motif(art.small, 25, 7, 34, -15)}${motif(art.side, 94, 20, 48, 10)}${motif(art.main, 142, 30, 40, -8)}`, 'cqd-month-art cqd-month-foot-art', '0 0 210 80');
  }
  return svg(`<path class="cqd-art-trail" d="M5 61q42 9 68-4t62-2 59-5"/>${motif(art.small, 5, 10, 29, -14)}${motif(art.main, 50, 2, 66, -6)}${motif(art.side, 121, 20, 43, 12)}<path class="cqd-art-trail" d="m181 23 4-6m1 18 8-1"/>`, 'cqd-month-art cqd-month-header-art', '0 0 200 74');
}

function robotAccessory(month) {
  const accessories = [
    '<path class="cqd-art-paint" d="M48 30C49 0 117 0 120 30Z"/><path class="cqd-art-paper" d="M46 26h76v9H46Z"/><circle class="cqd-art-paint" cx="84" cy="6" r="7"/><path d="M66 16v10m18-13v13m18-10v10"/>',
    '<path class="cqd-art-paint" d="M49 77q35 13 70-1v10q-35 14-70 1Z"/><path class="cqd-art-paint" d="m105 85 12 2-5 23-13-3Z"/><path d="m101 101 12 3"/>',
    motif('kite', 65, 1, 30, 14),
    '<path class="cqd-art-paint" d="M58 29 64 8h41l8 21 13 5H45Z"/><path d="M59 26h53"/>',
    motif('flower', 36, 14, 30, -22),
    '<path class="cqd-art-paint" d="M49 30q32-15 69-2l13 9H76l-27-2Z"/><path d="M83 29h29"/>',
    '<path class="cqd-art-gold" d="m60 28 5-18q19-7 36 0l8 18 18 5q-44 12-85 0Z"/><path d="M61 24q24 6 47 0"/>',
    motif('sunflower', 36, 12, 30, -22),
    motif('maple', 39, 14, 30, -25),
    '<path class="cqd-art-ink" d="m50 31 26-37 17 7-7 4 24 26 19 5q-41 11-88 0Z"/><path class="cqd-art-paint" d="m59 20 6-8 36 10 8 9Z"/><path class="cqd-art-gold" d="m78 18 10 3-2 9-10-3Z"/>',
    '<path class="cqd-art-gold" d="M49 77q35 13 70-1v10q-35 14-70 1Z"/><path class="cqd-art-gold" d="m54 84 12 3 4 23-14 1Z"/><path d="m56 102 12-1"/>',
    '<path class="cqd-art-leaf" d="M47 30Q63-5 92 6l26 13-13 7-6-9q-10 2-11 13Z"/><path class="cqd-art-paper" d="M47 26h71v10H47Z"/><circle class="cqd-art-gold" cx="116" cy="21" r="7"/>',
  ];
  return accessories[month - 1] || '';
}

export function calendarRobot(month) {
  return svg(`<ellipse class="cqd-robot-shadow" cx="84" cy="139" rx="46" ry="6"/>
    <g class="cqd-robot-body">
      <path class="cqd-robot-limb" d="m59 106-9 18m57-18 10 18"/>
      <rect class="cqd-robot-boot" x="44" y="125" width="26" height="13" rx="6"/>
      <rect class="cqd-robot-boot" x="98" y="125" width="26" height="13" rx="6"/>
      <path class="cqd-robot-limb" d="m54 88-17 13 4 15"/>
      <g class="cqd-robot-wave"><path class="cqd-robot-limb" d="m114 86 18-12 3-19"/><path class="cqd-robot-hand" d="m127 52 6 6 9-3 4-9m-13 12-1-16m5 14 5-16"/></g>
      <rect class="cqd-robot-shell" x="53" y="78" width="61" height="47" rx="17"/>
      <rect class="cqd-robot-panel" x="70" y="91" width="28" height="20" rx="6"/>
      <path class="cqd-robot-book" d="m77 96 7 2 7-2v9l-7 2-7-2Zm7 2v9"/>
      <g class="cqd-robot-head">
        <path class="cqd-robot-limb" d="M84 29V17"/>
        <circle class="cqd-robot-spark" cx="84" cy="12" r="6"/>
        <rect class="cqd-robot-ear" x="36" y="46" width="12" height="21" rx="5"/>
        <rect class="cqd-robot-ear" x="120" y="46" width="12" height="21" rx="5"/>
        <rect class="cqd-robot-shell" x="44" y="28" width="80" height="56" rx="21"/>
        <rect class="cqd-robot-face" x="53" y="37" width="62" height="38" rx="14"/>
        <g class="cqd-robot-eyes"><path d="M68 49v7m31-7v7"/></g>
        <path class="cqd-robot-smile" d="M78 62q6 6 12 0"/>
        <path class="cqd-robot-cheeks" d="M61 61h6m34 0h6"/>
        <path class="cqd-robot-shine" d="M54 32h18"/>
        <g class="cqd-robot-accessory">${robotAccessory(month)}</g>
      </g>
    </g>`, 'cqd-robot', '0 0 168 150');
}

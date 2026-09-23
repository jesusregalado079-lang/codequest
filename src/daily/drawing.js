// The ink layer for a sheet page: finger or Apple Pencil drawing directly on the worksheet via
// Pointer Events (one API for touch, pencil and mouse alike — no separate touch-event handling
// needed on iOS 27 Safari). Deliberately simple for v1: fixed-width round strokes, whole-canvas
// clear, no per-stroke undo — the boys need to be able to show their work, not use a full paint app.
const MAX_SIDE = 1600; // backing-buffer cap: keeps a saved frame's data URL well under store.js's limit

export function sizeCanvas(canvas, container) {
  const rect = container.getBoundingClientRect();
  const scale = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1));
  const longSide = Math.max(rect.width, rect.height) * scale;
  const clamp = longSide > MAX_SIDE ? MAX_SIDE / longSide : 1;
  canvas.width = Math.round(rect.width * scale * clamp);
  canvas.height = Math.round(rect.height * scale * clamp);
}

function pointFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
}

// Attaches drawing behaviour to an already-sized canvas. Returns a controller with clear()/
// toDataUrl()/detach(). onStroke fires once per completed stroke (pointerup), not per move, so
// callers can debounce their own save without drawing.js knowing anything about storage.
export function attachDrawing(canvas, { color = '#1c3d5a', lineWidth = 4, onStroke } = {}) {
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * Math.max(1, canvas.width / canvas.getBoundingClientRect().width);
  let drawing = false;

  function down(event) {
    if (event.button !== undefined && event.button !== 0) return;
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = pointFromEvent(canvas, event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    event.preventDefault();
  }
  function move(event) {
    if (!drawing) return;
    const p = pointFromEvent(canvas, event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    event.preventDefault();
  }
  function up(event) {
    if (!drawing) return;
    drawing = false;
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    if (onStroke) onStroke(canvas.toDataURL('image/webp', 0.8));
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  return {
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onStroke) onStroke(null);
    },
    toDataUrl() {
      return canvas.toDataURL('image/webp', 0.8);
    },
    detach() {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    },
  };
}

export function loadDrawing(canvas, dataUrl) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!dataUrl) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

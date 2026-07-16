// Canvas renderer + animator. Draws the level and replays a world's event
// list with tweened movement. All art is emoji/vector — no image assets.
import { drawHero, getArmor } from '../ui/hero.js';

const DIR_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; // N E S W

const DEFAULT_THEME = {
  floorA: '#cdf0ba',
  floorB: '#bfe8a8',
  wallDark: '#5b4a3f',
  wallLight: '#6d5a4c',
};

export class Renderer {
  constructor(canvas, levelDef, { theme, armor } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = levelDef;
    this.theme = { ...DEFAULT_THEME, ...theme };
    this.armor = getArmor(armor);
    this.playing = false;
    this.reset();
  }

  reset() {
    this.playing = false;
    const rows = this.level.grid;
    this.cols = Math.max(...rows.map((r) => r.length));
    this.rows = rows.length;
    this.gems = new Set();
    rows.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === 'S') this.char = { x, y, dir: this.level.startDir ?? 1 };
        if (c === 'G') this.gems.add(`${x},${y}`);
      })
    );
    this.charDraw = { x: this.char.x, y: this.char.y, angle: DIR_ANGLE[this.char.dir], squash: 1, bob: 0 };
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const box = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.floor(Math.min(box.width / this.cols, box.height / this.rows));
    this.tile = Math.max(24, size);
    this.canvas.width = this.cols * this.tile * dpr;
    this.canvas.height = this.rows * this.tile * dpr;
    this.canvas.style.width = `${this.cols * this.tile}px`;
    this.canvas.style.height = `${this.rows * this.tile}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  draw() {
    const { ctx, tile } = this;
    ctx.clearRect(0, 0, this.cols * tile, this.rows * tile);
    this.level.grid.forEach((row, y) => {
      [...row].forEach((c, x) => {
        const px = x * tile;
        const py = y * tile;
        if (c === ' ') return;
        if (c === '#') {
          ctx.fillStyle = this.theme.wallDark;
          ctx.fillRect(px, py, tile, tile);
          ctx.fillStyle = this.theme.wallLight;
          ctx.fillRect(px + 2, py + 2, tile - 4, tile / 2 - 2);
          return;
        }
        // floor (., S, G, E)
        ctx.fillStyle = (x + y) % 2 ? this.theme.floorB : this.theme.floorA;
        ctx.fillRect(px, py, tile, tile);
        if (c === 'E') {
          ctx.font = `${tile * 0.7}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏁', px + tile / 2, py + tile / 2 + 1);
        }
      });
    });
    // gems
    ctx.font = `${this.tile * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const key of this.gems) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillText('💎', x * tile + tile / 2, y * tile + tile / 2 + 1);
    }
    // character: blocky hero + a direction pointer at the tile edge
    const c = this.charDraw;
    const cx = c.x * tile + tile / 2;
    const cy = c.y * tile + tile / 2;
    drawHero(ctx, cx, cy, tile * 0.9, this.armor, { squash: c.squash, bob: c.bob });
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(c.angle);
    ctx.fillStyle = '#ffd75e';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tile * 0.38, -tile * 0.11);
    ctx.lineTo(tile * 0.53, 0);
    ctx.lineTo(tile * 0.38, tile * 0.11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Replays events sequentially. onEvent(event) fires as each starts
  // (used for block highlighting + sounds). onDone() after the last.
  play(events, { speed = 1, onEvent, onDone } = {}) {
    this.reset();
    this.playing = true;
    let i = 0;
    const stepDuration = () => 280 / speed;

    const next = () => {
      if (!this.playing) return; // reset() was pressed mid-run
      if (i >= events.length) {
        this.playing = false;
        onDone?.();
        return;
      }
      const ev = events[i++];
      onEvent?.(ev);
      if (ev.type === 'move') this.tween(stepDuration(), (t) => {
        this.charDraw.x = ev.from.x + (ev.to.x - ev.from.x) * t;
        this.charDraw.y = ev.from.y + (ev.to.y - ev.from.y) * t;
        this.charDraw.bob = t < 1 ? t : 0; // little hop while walking
      }, next);
      else if (ev.type === 'turn') {
        const from = this.charDraw.angle;
        let to = DIR_ANGLE[ev.dir];
        // rotate the short way
        while (to - from > Math.PI) to -= Math.PI * 2;
        while (from - to > Math.PI) to += Math.PI * 2;
        this.tween(stepDuration() * 0.7, (t) => {
          this.charDraw.angle = from + (to - from) * t;
        }, next);
      } else if (ev.type === 'collect') {
        this.gems.delete(`${ev.at.x},${ev.at.y}`);
        this.tween(stepDuration() * 0.6, (t) => {
          this.charDraw.squash = 1 + Math.sin(t * Math.PI) * 0.25;
        }, next);
      } else if (ev.type === 'bump') {
        const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][ev.dir];
        const { x, y } = this.charDraw;
        this.tween(stepDuration(), (t) => {
          const k = Math.sin(t * Math.PI) * 0.25;
          this.charDraw.x = x + d[0] * k;
          this.charDraw.y = y + d[1] * k;
        }, next);
      } else {
        // nogem / timeout — brief pause, no visual
        setTimeout(next, stepDuration() * 0.4);
      }
    };
    next();
  }

  stop() {
    this.playing = false;
  }

  tween(ms, apply, done) {
    const start = performance.now();
    const frame = (now) => {
      if (!this.playing) return;
      const t = Math.min(1, (now - start) / ms);
      apply(t);
      this.draw();
      if (t < 1) requestAnimationFrame(frame);
      else done();
    };
    requestAnimationFrame(frame);
  }
}

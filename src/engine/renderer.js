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
    // Fit the whole puzzle on small portrait screens; a hard minimum clipped
    // large levels and made children miss gems outside the visible frame.
    const size = Math.floor(Math.min((box.width - 20) / this.cols, (box.height - 20) / this.rows));
    this.tile = Math.max(1, size);
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
          ctx.fillRect(px + tile*.04, py + tile*.03, tile*.92, tile*.72);
          ctx.fillStyle = '#ffffff24'; ctx.fillRect(px+tile*.06,py+tile*.04,tile*.86,tile*.06);
          ctx.fillStyle = '#071c2d35'; ctx.fillRect(px+tile*.08,py+tile*.77,tile*.84,tile*.12);
          return;
        }
        // floor (., S, G, E)
        ctx.fillStyle = (x + y) % 2 ? this.theme.floorB : this.theme.floorA;
        ctx.fillRect(px, py, tile, tile);
        ctx.strokeStyle = '#1b48451c'; ctx.strokeRect(px+.5, py+.5, tile-1, tile-1);
        if (c === 'E') {
          ctx.fillStyle = '#24445c'; ctx.fillRect(px+tile*.34,py+tile*.16,tile*.055,tile*.67);
          ctx.fillStyle = '#fff7c0'; ctx.fillRect(px+tile*.39,py+tile*.17,tile*.4,tile*.3);
          ctx.fillStyle = '#3d7173'; for(let r=0;r<3;r++)for(let q=0;q<4;q++)if((r+q)%2===0)ctx.fillRect(px+tile*(.39+q*.1),py+tile*(.17+r*.1),tile*.1,tile*.1);
        }
      });
    });
    // gems
    for (const key of this.gems) {
      const [x, y] = key.split(',').map(Number);
      const gx=x*tile+tile/2, gy=y*tile+tile/2; ctx.save(); ctx.translate(gx,gy); ctx.scale(tile,tile);
      ctx.fillStyle='#16475430'; ctx.beginPath(); ctx.ellipse(0,.32,.22,.075,0,0,Math.PI*2); ctx.fill();
      const facet=(pts,color)=>{ctx.beginPath();pts.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
      facet([[-.28,-.09],[-.14,-.27],[.14,-.27],[.28,-.09],[0,.27]],'#2396b1'); facet([[-.28,-.09],[-.14,-.27],[0,-.08],[0,.27]],'#82eee1'); facet([[-.14,-.27],[.14,-.27],[0,-.08]],'#e1ffff'); facet([[.14,-.27],[.28,-.09],[0,-.08]],'#4dcabf'); ctx.restore();
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

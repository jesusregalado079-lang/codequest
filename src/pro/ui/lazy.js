// Lazy pages for the Pro router. A page whose code lives in its own chunk (exam pages, labs, lesson tiers) shows a short
// loading line, loads the chunk, then renders, unless the router has moved on meanwhile: every navigation takes a new
// token and a load only renders while its token is still the latest, so a slow chunk never paints over a newer page.
// A failed load (offline, or a deploy replaced the chunk files) shows an error line with Retry.
let navToken = 0;
export const beginNav = () => { navToken += 1; return navToken; };
export const isCurrentNav = (token) => token === navToken;

const loaded = new Map(); // key -> value, once its load resolved
const inFlight = new Map(); // key -> promise, while loading (a failed load is forgotten so Retry loads again)

export const isLoaded = (key) => loaded.has(key);

// Browsers remember a failed dynamic import (and a failed modulepreload) for that URL, so a plain retry fails again
// without even fetching. Wrap each lazy import in this: when it fails, stylesheets that failed to load are attached
// again, and the chunk named in the error is imported once more under a fresh query string. The chunk's own imports
// (the entry and shared chunks, already loaded) resolve to the same URLs as before, so nothing runs twice. When the
// error names no chunk (a stylesheet failed first, or a browser that does not say which), the import is simply re-run.
let retries = 0;
function reattachFailedStyles() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.sheet || !link.href || link.dataset.lazyRetry === 'pending') return;
    const again = link.cloneNode();
    again.href = `${link.href.split('?')[0]}?retry=${retries}`;
    again.dataset.lazyRetry = 'pending';
    again.addEventListener('load', () => { delete again.dataset.lazyRetry; }, { once: true });
    again.addEventListener('error', () => { delete again.dataset.lazyRetry; }, { once: true });
    link.replaceWith(again);
  });
}
export function retryImport(importer, valid = () => true) {
  const checked = (module) => {
    if (!valid(module)) throw new TypeError('Loaded module has the wrong shape');
    return module;
  };
  return importer().catch((error) => {
    retries += 1;
    reattachFailedStyles();
    const m = /(https?:\/\/[^\s'"]+?\.m?js)(?:\?[^\s'"]*)?(?=[\s'"]|$)/.exec(String(error && error.message));
    if (!m) return importer();
    return import(/* @vite-ignore */ `${m[1]}?retry=${retries}`).then((module) =>
      valid(module) ? module : importer());
  }).then(checked);
}

function loadOnce(key, load) {
  if (!inFlight.has(key)) {
    inFlight.set(key, Promise.resolve().then(load).then(
      (value) => { loaded.set(key, value); inFlight.delete(key); return value; },
      (error) => { inFlight.delete(key); throw error; },
    ));
  }
  return inFlight.get(key);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LOADING = (what) => `<p class="lazy-line" role="status" aria-live="polite">Loading ${esc(what)}…</p>`;
const FAILED = (what) => `
  <div class="lazy-line lazy-error" role="alert">
    <p><strong>Could not load ${esc(what)}.</strong> You may be offline, or the app was updated since this page opened.</p>
    <div class="ex-actions"><button type="button" class="ex-btn primary" data-lazy-retry>Retry</button><button type="button" class="ex-btn ghost" data-lazy-reload>Reload the app</button></div>
  </div>`;

// key: what is loaded (already-loaded keys render at once, no loading line); load: () => Promise<value>;
// render(value): draws the page; show(html): puts a loading or error line in the page frame and returns its root;
// token: from beginNav() at the start of this navigation; what: words for the loading line ('the labs').
export function lazyPage({ key, load, render, show, token, what }) {
  if (loaded.has(key)) return render(loaded.get(key));
  const attempt = () => {
    if (!isCurrentNav(token)) return;
    show(LOADING(what));
    loadOnce(key, load).then(
      (value) => { if (isCurrentNav(token)) render(value); },
      () => {
        if (!isCurrentNav(token)) return;
        const root = show(FAILED(what));
        const retry = root.querySelector('[data-lazy-retry]');
        retry.addEventListener('click', attempt);
        root.querySelector('[data-lazy-reload]').addEventListener('click', () => location.reload());
        retry.focus();
      },
    );
  };
  return attempt();
}

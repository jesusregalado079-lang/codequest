// Main-thread API for the sandboxed runner worker.
// run(userCode, tests, { signal }?) -> Promise<{ logs, results: [{name, pass, error}], timedOut, userError }>
// An optional AbortSignal stops the worker at once and resolves with userError 'Stopped.'.

const TIMEOUT_MS = 2000;

export function run(userCode, tests, { signal } = {}) {
  return new Promise((resolve) => {
    const notRun = () => tests.map((t) => ({ name: t.name, pass: false, error: 'not run' }));
    if (signal && signal.aborted) {
      resolve({ logs: [], results: notRun(), timedOut: false, userError: 'Stopped.' });
      return;
    }
    const worker = new Worker(new URL('./runner-worker.js', import.meta.url), {
      type: 'module',
    });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        logs: [],
        results: tests.map((t) => ({ name: t.name, pass: false, error: 'not run' })),
        timedOut: true,
        userError: 'Possible infinite loop — stopped after 2 seconds.',
      });
    }, TIMEOUT_MS);
    const onAbort = () => done({ logs: [], results: notRun(), timedOut: false, userError: 'Stopped.' });
    const done = (payload) => {
      clearTimeout(timer);
      worker.terminate();
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve(payload);
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    worker.onmessage = (e) => done({ ...e.data, timedOut: false });
    worker.onerror = (e) =>
      done({
        logs: [],
        results: tests.map((t) => ({ name: t.name, pass: false, error: 'not run' })),
        timedOut: false,
        userError: String(e.message || 'Worker error'),
      });
    worker.postMessage({
      userCode,
      tests: tests.map((t) => ({ name: t.name, code: t.code })),
    });
  });
}

// Main-thread API for the sandboxed runner worker.
// run(userCode, tests) -> Promise<{ logs, results: [{name, pass, error}], timedOut, userError }>

const TIMEOUT_MS = 2000;

export function run(userCode, tests) {
  return new Promise((resolve) => {
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
    const done = (payload) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(payload);
    };
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

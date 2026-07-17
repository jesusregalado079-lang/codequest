// Dedicated worker: runs user code + tests per SCHEMA.md concatenation semantics.
// One script: <userCode> ; <each test wrapped in try/catch reporting independently>.

function fmt(v) {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    try { return String(v); } catch { return '[unprintable]'; } // never let logging throw
  }
}

self.onmessage = (e) => {
  const { userCode, tests } = e.data;
  const logs = [];
  console.log = (...args) => logs.push(args.map(fmt).join(' '));

  globalThis.assert = (cond, msg) => {
    if (!cond) throw new Error(msg ?? 'assertion failed');
  };

  const results = []; // sparse; filled by __cqReport or pre-flagged below
  globalThis.__cqReport = (i, pass, error) => {
    results[i] = { name: tests[i].name, pass, error };
  };
  const finish = (userError) =>
    postMessage({
      logs,
      results: tests.map(
        (t, i) => results[i] ?? { name: t.name, pass: false, error: 'not run' }
      ),
      userError: userError ?? null,
    });

  // Syntax-check user code alone so the error is readable and clearly theirs.
  try {
    new Function(userCode);
  } catch (err) {
    return finish('Syntax error in your code: ' + err.message);
  }

  const parts = [userCode, ';'];
  tests.forEach((t, i) => {
    try {
      new Function(t.code); // a broken test must not hide the others
      parts.push(
        `try { ${t.code}\n; __cqReport(${i}, true); } catch (e) { __cqReport(${i}, false, String((e && e.message) || e)); }`
      );
    } catch (err) {
      results[i] = { name: t.name, pass: false, error: 'test has a syntax error: ' + err.message };
    }
  });

  try {
    (0, eval)(parts.join('\n')); // indirect eval: top-level bindings visible to all tests
  } catch (err) {
    // Runtime error in user code itself (tests are individually caught).
    return finish('Error in your code: ' + String((err && err.message) || err));
  }
  finish(null);
};

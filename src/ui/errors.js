// Turns raw sandbox errors into something a 9-year-old can act on.
// The sandbox is ES5, so let/const/arrows are syntax errors — call those out
// by name rather than leaving a kid staring at "Unexpected token (1:4)".
export function friendlyError(err, code = '') {
  const raw = String(err?.message ?? err);
  const at = raw.match(/\((\d+):(\d+)\)/);
  const where = at ? ` (line ${at[1]})` : '';

  const undef = raw.match(/(\w+) is not defined/);
  if (undef) {
    const name = undef[1];
    const known = ['moveForward', 'turnLeft', 'turnRight', 'collectGem', 'pathAhead', 'onGem'];
    const near = known.find((k) => k.toLowerCase() === name.toLowerCase());
    return near
      ? `🐞 The robot doesn't know "${name}" — check the CAPITAL letters: ${near}()`
      : `🐞 The robot doesn't know "${name}" — check the spelling, or did you forget to write the function?`;
  }
  if (/^(let|const)\b/m.test(code) && /Unexpected token/.test(raw)) {
    return '🐞 This robot only understands var — try var instead of let or const!';
  }
  if (/=>/.test(code) && /Unexpected token/.test(raw)) {
    return '🐞 No arrow functions here — write function name() { ... } instead';
  }
  if (/Unexpected end of input/.test(raw)) {
    return '🐞 Something was never closed — every { needs a } and every ( needs a )';
  }
  if (/is not a function/.test(raw)) {
    return `🐞 ${raw.replace(/^.*?(\w+) is not a function.*$/, '"$1" is not something the robot can do')} — check the name!`;
  }
  if (/Unexpected token|Unexpected character|Invalid|Unterminated/.test(raw)) {
    return `🐞 Something's out of place${where} — check your ( ) { } and the ; at the end of each line`;
  }
  return `🐞 ${raw}${where}`;
}

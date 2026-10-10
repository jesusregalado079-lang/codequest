// A small DOM morph for the A+ lab areas: re-rendering from an HTML string patches the live nodes in place instead of
// replacing them, so the element under the pointer survives a re-render (a change event that fires on blur cannot eat
// the click that caused the blur), focus stays put and a text field the learner is typing in keeps its value.
// Elements match by tag and data-fk (the focus key every interactive element carries), or by data-mk when an element
// sets one (twin buttons that swap with each other share a data-mk and are patched in place).
const keyOf = (n) => (n.nodeType === 1 ? `${n.nodeName}|${n.getAttribute('data-mk') || n.getAttribute('data-fk') || ''}|${n.getAttribute('type') || ''}|${n.id || ''}` : `#${n.nodeType}`);

function patchAttrs(a, b) {
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
}
function syncProps(a, b) {
  if (a.nodeName === 'INPUT') {
    const t = a.type;
    if (t === 'radio' || t === 'checkbox') a.checked = b.hasAttribute('checked');
    else if (a !== document.activeElement || b.hasAttribute('data-force')) a.value = b.getAttribute('value') ?? '';
    a.disabled = b.hasAttribute('disabled');
  } else if (a.nodeName === 'SELECT') {
    const i = [...b.querySelectorAll('option')].findIndex((o) => o.hasAttribute('selected'));
    if (i >= 0 && a.selectedIndex !== i) a.selectedIndex = i;
  }
}
function patchChildren(a, b) {
  const an = [...a.childNodes];
  const bn = [...b.childNodes];
  bn.forEach((y, i) => {
    const x = an[i];
    if (!x) { a.appendChild(y); return; }
    if (keyOf(x) !== keyOf(y)) { a.replaceChild(y, x); return; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    patchAttrs(x, y);
    patchChildren(x, y);
    syncProps(x, y);
  });
  for (let i = an.length - 1; i >= bn.length; i -= 1) an[i].remove();
}

export function morph(target, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  patchChildren(target, tpl.content);
}

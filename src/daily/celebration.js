// The celebration is authored data. Only these public-facing fields are rendered; sheets,
// answers, and parent notes never enter this module.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export function celebrationForSheet(week, sheet) {
  const message = week && week.celebration;
  return message && typeof message.id === 'string' && typeof message.trigger === 'string'
    && Array.isArray(message.blocks) && typeof message.button === 'string'
    && sheet && sheet.subject === message.trigger ? message : null;
}

export function trophyButtonHtml() {
  return '<button type="button" class="cqd-trophy-button" data-action="open-celebration" aria-label="Open celebration message"><span aria-hidden="true">🏆</span><span>Our gift</span></button>';
}

function blockHtml(block, index) {
  if (!block || typeof block !== 'object') return '';
  if (block.type === 'bullets' && Array.isArray(block.items)) {
    return `<ul class="cqd-celebration-bullets">${block.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }
  if (typeof block.text !== 'string') return '';
  if (block.type === 'quote') return `<blockquote class="cqd-celebration-quote">${esc(block.text)}</blockquote>`;
  if (block.type === 'signoff') return `<p class="cqd-celebration-signoff">${esc(block.text)}</p>`;
  if (block.type === 'p') return index === 0
    ? `<h2 id="cqd-celebration-title">${esc(block.text)}</h2>`
    : `<p>${esc(block.text)}</p>`;
  return '';
}

export function celebrationHtml(message) {
  const blocks = message.blocks.map(blockHtml).join('');
  return `<div class="cqd-celebration-overlay">
    <section class="cqd-celebration-dialog" role="dialog" aria-modal="true" aria-labelledby="cqd-celebration-title">
      <div class="cqd-celebration-art" aria-hidden="true"><span class="cqd-celebration-glow"></span><span class="cqd-celebration-trophy">🏆</span>${Array.from({ length: 16 }, (_, index) => `<i class="cqd-confetti cqd-confetti-${index + 1}"></i>`).join('')}</div>
      <div class="cqd-celebration-copy">${blocks}<button type="button" class="cqd-button cqd-primary cqd-celebration-close" data-action="close-celebration">${esc(message.button)}</button></div>
    </section>
  </div>`;
}

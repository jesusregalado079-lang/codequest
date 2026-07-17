// The level-1 tutorial. It watches what the kid actually does and moves on
// when they've done it — no slideshow, no "next next next". It never blocks
// the screen, and it never comes back once they've got it.
import { sounds } from './sounds.js';

export function startCoach(steps, { onDone } = {}) {
  if (!steps.length) return;
  const bubble = document.createElement('div');
  bubble.className = 'coach';
  bubble.innerHTML = `<span class="coach-text"></span>
    <button class="coach-next hidden">Got it!</button>
    <button class="coach-skip" title="Skip the tutorial">✕</button>`;
  document.body.append(bubble);

  const text = bubble.querySelector('.coach-text');
  const nextBtn = bubble.querySelector('.coach-next');
  let i = 0;
  let spot = null;

  const clearSpot = () => spot?.classList.remove('coach-spot');
  const finish = () => {
    clearInterval(timer);
    clearSpot();
    bubble.remove();
    onDone?.();
  };

  const show = () => {
    const step = steps[i];
    if (!step) return finish();
    text.innerHTML = step.text;
    clearSpot();
    spot = step.spot?.() ?? null;
    spot?.classList.add('coach-spot');
    // a step with no test is a "read this" step — it needs a button
    nextBtn.classList.toggle('hidden', Boolean(step.done));
  };

  const advance = () => {
    i++;
    if (i < steps.length) sounds.collect();
    show();
  };

  const timer = setInterval(() => {
    const step = steps[i];
    if (step?.done?.()) advance();
  }, 250);

  nextBtn.onclick = advance;
  bubble.querySelector('.coach-skip').onclick = finish;
  show();
  return finish;
}

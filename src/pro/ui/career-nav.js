// The one career header, shared by pro.html (career pages, exams, labs) and expedited.html.
// `prefix` is '' inside pro.html (links are '#/route') and './pro.html' on the Expedited page.
export const CAREER_TABS = [
  ['career-journey', 'Journey'],
  ['exam', 'Exams'],
  ['labs', 'Labs'],
  ['career-path', 'Roadmap'],
  ['career-progress', 'Progress'],
  ['career-extra', 'Extra'],
  ['resources', 'Studies'],
];

export function careerHeaderHtml(active, prefix = '', extraClass = '') {
  const on = (id) => (id === active ? ' aria-current="page"' : '');
  const cls = (id, base = '') => {
    const c = [base, id === active ? 'on' : ''].filter(Boolean).join(' ');
    return c ? ` class="${c}"` : '';
  };
  return `
    <header class="pro-header career-head${extraClass ? ` ${extraClass}` : ''}">
      <a class="back" href="${prefix}#/"><span aria-hidden="true">←</span> Lessons</a>
      <nav class="career-nav c-pills" aria-label="Career">
        ${CAREER_TABS.map(([id, label]) => `<a href="${prefix}#/${id}"${cls(id)}${on(id)}>${label}</a>`).join('')}
        <a${cls('expedited', 'exp-link')} href="./expedited.html"${on('expedited')}><span aria-hidden="true">⚡</span> Expedited</a>
      </nav>
    </header>`;
}

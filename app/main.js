// DealHunt ’26: routing and the toolbar. The deals live in data.js, the maths
// in filters.js, the HTML in views.js; this file only decides which page to
// show and keeps the toolbar and the list in step.
//
//   #/                        the list, with search and filters
//   #/?category=Audio&sort=discount   the list, pre-filtered (for screenshots)
//   #/deal/<id>               one deal
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from './data.js';
import { applyFilters } from './filters.js';
import { detailPage, listPage, missingPage } from './views.js';

const app = document.getElementById('app');

let state = { query: '', category: '', store: '', minOff: '0', sort: 'verdict' };

function readHashQuery() {
  const hash = location.hash.replace(/^#\/?/, '');
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return {
    query: params.get('q') ?? '',
    category: params.get('category') ?? '',
    store: params.get('store') ?? '',
    minOff: params.get('minOff') ?? '0',
    sort: params.get('sort') ?? 'verdict',
  };
}

function refreshList() {
  const shown = applyFilters(deals, state);
  const list = app.querySelector('.deals');
  if (!list) return;
  // Rebuild only the rows and the count line, so the toolbar keeps focus.
  const temp = document.createElement('div');
  temp.innerHTML = listPage(shown, deals, state);
  const freshRows = temp.querySelector('.deals');
  const freshCount = temp.querySelector('.count-line');
  list.replaceWith(freshRows);
  app.querySelector('.count-line')?.replaceWith(freshCount);
}

function wireToolbar() {
  const form = app.querySelector('#filters');
  if (!form) return;
  form.addEventListener('input', (e) => {
    state.query = form.q.value;
    if (e.target === form.q) refreshList();
  });
  form.addEventListener('change', () => {
    state.category = form.category.value;
    state.store = form.store.value;
    state.minOff = form.minOff.value;
    state.sort = form.sort.value;
    refreshList();
  });
}

function render() {
  window.__shotReady = false;
  const preset = readHashQuery();
  state = { ...state, ...preset };
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : 'Not found'} | DealHunt ’26`;
    app.innerHTML = found ? detailPage(found) : missingPage();
  } else {
    document.title = 'DealHunt ’26 — Black Friday 2026 deal finder';
    app.innerHTML = listPage(applyFilters(deals, state), deals, state);
    wireToolbar();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();

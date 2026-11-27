// HTML for each page, built from the deal data. Every value is escaped
// before it goes into the page, so a deal's text can never break the markup.

import { categories, percentOff, saved, stores, verdict } from './filters.js';

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${Number(n).toLocaleString('en-US')}`;
const when = (iso) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' }) + ' ET';

function verdictBox(d) {
  const v = verdict(d);
  return `<div class="verdict verdict-${v.key}"><b>${v.label}</b>${escape(v.text)}${d.note ? ` ${escape(d.note)}` : ''}</div>`;
}

function card(d) {
  const v = verdict(d);
  return `<li class="card">
  <div class="meta"><span class="chip">${escape(d.store)}</span><span class="chip">${escape(d.category)}</span></div>
  <h2><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h2>
  <div class="price-row"><span class="price">${usd(d.price)}</span><span class="was"><s>${usd(d.was)}</s></span><span class="off">${percentOff(d)}% off</span></div>
  <p class="save">You save ${usd(saved(d))}</p>
  <div class="verdict verdict-${v.key}"><b>${v.label}</b>${escape(v.text)}</div>
  <p class="checked">Checked ${when(d.checked)} · ${escape(d.source)}</p>
  <div class="card-actions">
    <a class="btn btn-store" href="${escape(d.url)}" rel="noopener">View at ${escape(d.store)} ↗</a>
    <a class="btn btn-detail" href="#/deal/${encodeURIComponent(d.id)}">Details</a>
  </div>
</li>`;
}

export function listPage(deals, all, f) {
  const cats = categories(all);
  const sts = stores(all);
  const opt = (v, label, sel) => `<option value="${escape(v)}"${sel ? ' selected' : ''}>${escape(label)}</option>`;
  const totalOff = all.length ? Math.round(all.reduce((s, d) => s + percentOff(d), 0) / all.length) : 0;
  const best = [...all].sort((a, b) => percentOff(b) - percentOff(a))[0];
  const rows = deals.length
    ? deals.map(card).join('\n')
    : `<li class="empty"><strong>No deal matches.</strong><br>Try clearing the search or loosening a filter.</li>`;
  return `<section class="intro">
  <h1>Black Friday 2026: ${all.length} deals checked by hand</h1>
  <p>Every deal below was read at its store on Friday 27 November 2026. Search it, filter it by category, store or discount, and sort it by what matters to you — the biggest cut, the biggest saving, or the lowest price.</p>
</section>
<ul class="stats">
  <li><b>${all.length}</b><span>verified deals</span></li>
  <li><b>${sts.length}</b><span>stores</span></li>
  <li><b>${totalOff}%</b><span>average discount</span></li>
  <li><b>${best ? `${percentOff(best)}% off` : '—'}</b><span>deepest cut${best ? `: ${escape(best.title)}` : ''}</span></li>
</ul>
<form class="toolbar" id="filters" action="#/" onsubmit="return false">
  <label class="field field-grow">Search deals
    <input type="search" name="q" value="${escape(f.query ?? '')}" placeholder="Try “headphones” or “LEGO”" autocomplete="off">
  </label>
  <label class="field">Category
    <select name="category"><option value="">All categories</option>${cats.map((c) => opt(c, c, f.category === c)).join('')}</select>
  </label>
  <label class="field">Store
    <select name="store"><option value="">All stores</option>${sts.map((s) => opt(s, s, f.store === s)).join('')}</select>
  </label>
  <label class="field">Min. discount
    <select name="minOff">
      ${opt('0', 'Any discount', (f.minOff ?? '0') === '0')}
      ${opt('25', '25% off or more', f.minOff === '25')}
      ${opt('40', '40% off or more', f.minOff === '40')}
      ${opt('50', '50% off or more', f.minOff === '50')}
    </select>
  </label>
  <label class="field">Sort by
    <select name="sort">
      ${opt('verdict', 'Best deals first', (f.sort ?? 'verdict') === 'verdict')}
      ${opt('discount', 'Biggest % off', f.sort === 'discount')}
      ${opt('saving', 'Biggest saving ($)', f.sort === 'saving')}
      ${opt('price', 'Lowest price', f.sort === 'price')}
    </select>
  </label>
</form>
<p class="count-line">Showing <b>${deals.length}</b> of ${all.length} deals · prices checked 27 Nov 2026 (ET) · links open the store’s own product page.</p>
<ul class="deals">${rows}</ul>`;
}

export function detailPage(d) {
  return `<p><a class="back" href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="meta"><span class="chip">${escape(d.store)}</span><span class="chip">${escape(d.category)}</span></div>
  <h1>${escape(d.title)}</h1>
  <div class="price-row"><span class="price">${usd(d.price)}</span><span class="was"><s>${usd(d.was)}</s></span><span class="off">${percentOff(d)}% off</span></div>
  <p class="save">You save ${usd(saved(d))} off the usual ${usd(d.was)}.</p>
  ${verdictBox(d)}
  <dl class="facts">
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Sale price</dt><dd>${usd(d.price)}</dd>
    <dt>Usual price</dt><dd>${usd(d.was)}</dd>
    <dt>Discount</dt><dd>${percentOff(d)}% off — save ${usd(saved(d))}</dd>
    <dt>Checked</dt><dd>${when(d.checked)}</dd>
    <dt>Price read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p><a class="btn btn-store" href="${escape(d.url)}" rel="noopener">View this deal at ${escape(d.store)} ↗</a></p>
  <p class="note">Prices change fast on Black Friday and stock runs out. The store’s page is the final word — if the price there differs, the deal has moved since we checked it.</p>
</article>`;
}

export function missingPage() {
  return `<h1>Not found</h1>
<p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}

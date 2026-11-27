// Deal maths and list shaping: discount, verdict, filtering and sorting.
// One job: turn the raw deal list plus the user's toolbar choices into the
// ordered list the page shows. No DOM here, so it stays easy to test.

export const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
export const saved = (d) => d.was - d.price;

// The "is it really a deal" signal. It is a claim about the two verified
// prices only: a deep cut against a genuine usual price is a true deal, and
// so is a big-ticket saving (at least 20% off and $200 saved) on a costly
// item; a mid-size cut is a strong price, and a small cut is the routine
// sale most stores run every holiday. The per-deal note in data.js carries
// the evidence behind the label (for example a lowest price seen this year).
export function verdict(d) {
  const pct = percentOff(d);
  const save = saved(d);
  if (pct >= 40 || (pct >= 20 && save >= 200)) {
    return {
      key: 'true',
      label: 'True deal',
      text:
        pct >= 40
          ? `${pct}% off the usual price — a deep cut, not a routine markdown.`
          : `$${save} off the usual price — a big-ticket saving, not a routine markdown.`,
    };
  }
  if (pct >= 25 || save >= 100) return { key: 'strong', label: 'Strong price', text: `${pct}% off the usual price — a solid saving on a wanted item.` };
  return { key: 'routine', label: 'Routine sale', text: `Only ${pct}% off the usual price — the kind of cut stores run most holidays.` };
}

export function categories(deals) {
  return [...new Set(deals.map((d) => d.category))].sort();
}

export function stores(deals) {
  return [...new Set(deals.map((d) => d.store))].sort();
}

export function applyFilters(deals, f) {
  const q = (f.query ?? '').trim().toLowerCase();
  const minOff = Number(f.minOff ?? 0);
  let out = deals.filter((d) => {
    if (f.category && d.category !== f.category) return false;
    if (f.store && d.store !== f.store) return false;
    if (percentOff(d) < minOff) return false;
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const byDiscount = (a, b) => percentOff(b) - percentOff(a) || saved(b) - saved(a);
  const bySaving = (a, b) => saved(b) - saved(a) || percentOff(b) - percentOff(a);
  const byPrice = (a, b) => a.price - b.price || percentOff(b) - percentOff(a);
  const byVerdict = (a, b) => {
    const rank = { true: 0, strong: 1, routine: 2 };
    return rank[verdict(a).key] - rank[verdict(b).key] || byDiscount(a, b);
  };
  const sorts = { discount: byDiscount, saving: bySaving, price: byPrice, verdict: byVerdict };
  out = [...out].sort(sorts[f.sort] ?? byVerdict);
  return out;
}

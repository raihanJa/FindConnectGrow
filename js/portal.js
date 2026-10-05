/* Talent portal: filters, sorting, shortlist, compare */
(function () {
  const D = window.FCG_DATA, F = window.FCG, qs = F.qs, qsa = F.qsa;
  const P = new URLSearchParams(location.search);
  const S = {
    q: P.get('q') || '',
    groups: new Set((P.get('pos') || '').split(',').filter((g) => D.GROUPS[g])),
    min: 14, max: 21,
    region: D.REGIONS[P.get('region')] ? P.get('region') : 'all',
    squad: ['m', 'f'].includes(P.get('squad')) ? P.get('squad') : 'all',
    foot: 'any',
    status: new Set((P.get('status') || '').split(',').filter((s) => s !== '' && D.STATUS[+s]).map(Number)),
    sort: 'ovr',
    view: F.store.get('view', 'grid'),
    cmp: []
  };
  const COLORS = ['#1463F3', '#0C1C36', '#7FA6F5'];

  const el = {
    q: qs('#fq'), pos: qs('#fPos'), min: qs('#ageMin'), max: qs('#ageMax'), ageOut: qs('#ageOut'), ageFill: qs('#ageFill'),
    reg: qs('#fReg'), squad: qs('#fSquad'), foot: qs('#fFoot'), status: qs('#fStatus'), sort: qs('#fSort'),
    grid: qs('#grid'), count: qs('#rCount'), label: qs('#rLabel'), active: qs('#activeF'), tray: qs('#tray'), slots: qs('#traySlots')
  };
  el.q.value = S.q;

  const match = (t, skip) => {
    if (S.q) { const q = S.q.toLowerCase(); if (!(t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || F.L(D.REGIONS[t.region].name).toLowerCase().includes(q) || F.L(D.POS[t.pos]).toLowerCase().includes(q))) return false; }
    if (skip !== 'groups' && S.groups.size && !S.groups.has(t.group)) return false;
    if (t.age < S.min || t.age > S.max) return false;
    if (S.region !== 'all' && t.region !== S.region) return false;
    if (S.squad !== 'all' && t.g !== S.squad) return false;
    if (S.foot !== 'any' && t.foot !== S.foot) return false;
    if (skip !== 'status' && S.status.size && !S.status.has(t.status)) return false;
    return true;
  };

  function renderControls() {
    el.pos.innerHTML = Object.keys(D.GROUPS).map((g) => {
      const n = D.TALENTS.filter((t) => t.group === g && match(t, 'groups')).length;
      return `<button class="chip" data-g="${g}" aria-pressed="${S.groups.has(g)}">${F.L(D.GROUPS[g])}<span class="c">${n}</span></button>`;
    }).join('');
    el.status.innerHTML = D.STATUS.map((s, i) => {
      const n = D.TALENTS.filter((t) => t.status === i && match(t, 'status')).length;
      return `<button class="chip" data-s="${i}" aria-pressed="${S.status.has(i)}">${F.L(s)}<span class="c">${n}</span></button>`;
    }).join('');
    el.reg.innerHTML = `<option value="all">${F.t('p.allreg')}</option>` + Object.keys(D.REGIONS).map((k) => `<option value="${k}" ${k === S.region ? 'selected' : ''}>${F.L(D.REGIONS[k].name)} (${D.TALENTS.filter((t) => t.region === k).length})</option>`).join('');
    qsa('button', el.squad).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.squad)));
    qsa('button', el.foot).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.foot)));
    qsa('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
    const lo = ((S.min - 14) / 7) * 100, hi = ((S.max - 14) / 7) * 100;
    el.ageFill.style.left = lo + '%'; el.ageFill.style.width = hi - lo + '%';
    el.ageOut.textContent = `${S.min}–${S.max}`;
  }

  function renderActive() {
    const chips = [];
    if (S.q) chips.push(['q', '', `“${S.q}”`]);
    S.groups.forEach((g) => chips.push(['g', g, F.L(D.GROUPS[g])]));
    if (S.min > 14 || S.max < 21) chips.push(['age', '', `${F.t('p.age')} ${S.min}–${S.max}`]);
    if (S.region !== 'all') chips.push(['reg', '', F.L(D.REGIONS[S.region].name)]);
    if (S.squad !== 'all') chips.push(['squad', '', F.t(S.squad === 'm' ? 'p.men' : 'p.women')]);
    if (S.foot !== 'any') chips.push(['foot', '', F.foot(S.foot)]);
    S.status.forEach((s) => chips.push(['st', s, F.L(D.STATUS[s])]));
    el.active.innerHTML = chips.map(([k, v, l]) => `<button data-rm="${k}" data-v="${v}">${F.esc(l)}</button>`).join('');
    const b = qs('#fBadge'); b.textContent = chips.length ? `(${chips.length})` : '';
  }

  function syncURL() {
    const u = new URLSearchParams();
    if (S.q) u.set('q', S.q);
    if (S.groups.size) u.set('pos', [...S.groups].join(','));
    if (S.region !== 'all') u.set('region', S.region);
    if (S.squad !== 'all') u.set('squad', S.squad);
    if (S.status.size) u.set('status', [...S.status].join(','));
    const s = u.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function render() {
    renderControls(); renderActive(); syncURL();
    const list = D.TALENTS.filter((t) => match(t)).sort({
      ovr: (a, b) => b.ovr - a.ovr, new: (a, b) => b.joined.localeCompare(a.joined),
      young: (a, b) => a.age - b.age || b.ovr - a.ovr, name: (a, b) => a.name.localeCompare(b.name)
    }[S.sort]);
    el.count.textContent = list.length;
    el.label.textContent = F.t(list.length === 1 ? 'p.talent' : 'p.talents');
    el.grid.classList.toggle('list', S.view === 'list');
    el.grid.innerHTML = list.length
      ? list.map((t, i) => F.card(t, { compare: true, cmpOn: S.cmp.includes(t.id), delay: Math.min(i, 12) * 0.04 })).join('')
      : `<div class="empty"><p class="display">${F.t('p.empty.t')}</p><p>${F.t('p.empty.p')}</p><button class="btn btn--ghost" data-reset>${F.t('p.reset')}</button></div>`;
    renderTray();
  }

  /* ---------- events ---------- */
  let qT;
  el.q.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { S.q = el.q.value.trim(); render(); }, 160); });
  el.pos.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (!b) return; const g = b.dataset.g; S.groups.has(g) ? S.groups.delete(g) : S.groups.add(g); render(); });
  el.status.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (!b) return; const s = +b.dataset.s; S.status.has(s) ? S.status.delete(s) : S.status.add(s); render(); });
  el.reg.addEventListener('change', () => { S.region = el.reg.value; render(); });
  el.squad.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { S.squad = b.dataset.v; render(); } });
  el.foot.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { S.foot = b.dataset.v; render(); } });
  el.sort.addEventListener('change', () => { S.sort = el.sort.value; render(); });
  qsa('[data-view]').forEach((b) => b.addEventListener('click', () => { S.view = b.dataset.view; F.store.set('view', S.view); render(); }));
  const onAge = (which) => () => {
    let a = +el.min.value, b = +el.max.value;
    if (a > b) { if (which === 'min') a = b; else b = a; el.min.value = a; el.max.value = b; }
    S.min = a; S.max = b; render();
  };
  el.min.addEventListener('input', onAge('min')); el.max.addEventListener('input', onAge('max'));
  const reset = () => { S.q = ''; el.q.value = ''; S.groups.clear(); S.status.clear(); S.min = 14; S.max = 21; el.min.value = 14; el.max.value = 21; S.region = 'all'; S.squad = 'all'; S.foot = 'any'; render(); };
  qs('#fReset').addEventListener('click', reset);
  el.grid.addEventListener('click', (e) => { if (e.target.closest('[data-reset]')) reset(); });
  el.active.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    const k = b.dataset.rm, v = b.dataset.v;
    if (k === 'q') { S.q = ''; el.q.value = ''; }
    if (k === 'g') S.groups.delete(v);
    if (k === 'age') { S.min = 14; S.max = 21; el.min.value = 14; el.max.value = 21; }
    if (k === 'reg') S.region = 'all';
    if (k === 'squad') S.squad = 'all';
    if (k === 'foot') S.foot = 'any';
    if (k === 'st') S.status.delete(+v);
    render();
  });
  const ft = qs('#fToggle'), fb = qs('#fBody');
  ft.addEventListener('click', () => { const o = !fb.classList.contains('open'); fb.classList.toggle('open', o); ft.setAttribute('aria-expanded', String(o)); });

  /* ---------- compare ---------- */
  el.grid.addEventListener('change', (e) => {
    const c = e.target.closest('[data-cmp]'); if (!c) return;
    const id = c.dataset.cmp;
    if (c.checked) {
      if (S.cmp.length >= 3) { c.checked = false; F.toast(F.t('cmp.max')); return; }
      S.cmp.push(id);
    } else S.cmp = S.cmp.filter((x) => x !== id);
    renderTray();
  });
  function renderTray() {
    el.tray.classList.toggle('on', S.cmp.length > 0);
    const slots = S.cmp.map((id, i) => `<span class="tray-slot"><i style="width:8px;height:8px;border-radius:50%;background:${COLORS[i]};display:inline-block;${i === 1 ? 'box-shadow:0 0 0 1px #fff' : ''}"></i>${F.esc(F.byId(id).name)}<button data-un="${id}" aria-label="Remove">×</button></span>`);
    for (let i = S.cmp.length; i < 3; i++) slots.push(`<span class="tray-slot empty-slot">+ ${F.t('cmp.slot')}</span>`);
    el.slots.innerHTML = slots.join('');
    qs('#cmpGo').disabled = S.cmp.length < 2;
    qs('#cmpGo').style.opacity = S.cmp.length < 2 ? 0.5 : 1;
  }
  el.slots.addEventListener('click', (e) => {
    const b = e.target.closest('[data-un]'); if (!b) return;
    S.cmp = S.cmp.filter((x) => x !== b.dataset.un);
    const box = qs(`[data-cmp="${b.dataset.un}"]`); if (box) box.checked = false;
    renderTray();
  });
  qs('#cmpGo').addEventListener('click', () => {
    if (S.cmp.length < 2) return F.toast(F.t('cmp.min'));
    const ts = S.cmp.map(F.byId);
    const rows = D.ATTR.map((a, i) => {
      const best = Math.max(...ts.map((t) => t.a[i]));
      return `<tr><th>${F.L(a)}</th>${ts.map((t) => `<td class="${t.a[i] === best ? 'best' : ''}">${t.a[i]}</td>`).join('')}</tr>`;
    }).join('');
    const extra = [
      [F.t('cmp.ovr'), (t) => t.ovr], [F.t('p.age'), (t) => t.age], [F.t('cmp.pos'), (t) => t.pos], [F.t('p.foot'), (t) => F.foot(t.foot)],
      [F.t('cmp.h'), (t) => t.h + ' cm'], [F.t('p.reg'), (t) => F.L(D.REGIONS[t.region].name)], [F.t('p.status'), (t) => F.L(D.STATUS[t.status])]
    ].map(([l, fn]) => `<tr><th>${l}</th>${ts.map((t) => `<td>${F.esc(fn(t))}</td>`).join('')}</tr>`).join('');
    const c = F.modal(`<p class="kicker"><b>●</b> ${F.t('cmp.kicker')}</p><h2 class="h2">${F.t('cmp.title')}</h2>
      <div class="cmp-grid mt-s"><div class="radar-box">${F.radar(ts.map((t, i) => ({ values: t.a, color: COLORS[i], dash: i === 2, fill: i === 0 ? 0.16 : 0.06 })), { size: 340 })}</div>
      <div style="overflow-x:auto"><table class="cmp-table"><thead><tr><th></th>${ts.map((t, i) => `<th><span class="cmp-key" style="background:${COLORS[i]}"></span><a href="talent.html?id=${t.id}" style="text-decoration:none">${F.esc(t.name)}</a></th>`).join('')}</tr></thead><tbody>${extra}${rows}</tbody></table></div></div>
      <div class="hero-ctas"><button class="btn btn--blue" id="cmpReq">${F.t('cmp.req')} <span class="arr">→</span></button><button class="btn btn--ghost" id="cmpSl">${F.t('cmp.sl')}</button></div>`, { wide: true });
    qs('#cmpReq', c).addEventListener('click', () => F.requestDossier(S.cmp));
    qs('#cmpSl', c).addEventListener('click', () => { S.cmp.forEach((id) => { if (!F.shortlist.has(id)) F.shortlist.toggle(id); }); F.toast(F.t('cmp.slok')); });
  });

  if (S.region !== 'all' || S.groups.size || S.status.size) setTimeout(() => qs('.results-bar').scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
  render();
  document.addEventListener('fcg:lang', render);
})();

/* Clubs page: process accordion, shortlist, partnership form */
(function () {
  const D = window.FCG_DATA, F = window.FCG, qs = F.qs, qsa = F.qsa;

  qs('#proc').addEventListener('click', (e) => {
    const p = e.target.closest('.proc'); if (!p) return;
    const open = !p.classList.contains('open');
    qsa('.proc').forEach((x) => x.classList.remove('open'));
    if (open) p.classList.add('open');
  });

  function renderShortlist() {
    const ids = F.shortlist.list();
    const box = qs('#slBox'), act = qs('#slActions');
    if (!ids.length) {
      box.innerHTML = `<div class="sl-empty"><p class="display" style="font-size:2rem;color:var(--ink)">${F.t('c.sl.empty')}</p><p>${F.t('c.sl.emptyp')}</p></div>`;
      act.innerHTML = `<a class="btn" href="talents.html">${F.t('c.sl.go')} <span class="arr">→</span></a>`;
      return;
    }
    box.innerHTML = ids.map((id) => {
      const t = F.byId(id);
      return `<div class="sl-row"><div class="sig">${F.signature(t.id)}</div>
        <div><a href="talent.html?id=${t.id}">${F.esc(t.name)}</a><small>${F.L(D.POS[t.pos])} · ${t.age} ${F.t('yrs')} · ${F.L(D.REGIONS[t.region].name)} · OVR ${t.ovr}</small></div>
        ${F.statusPill(t.status)}<button class="rm" data-star="${t.id}">${F.t('c.sl.rm')}</button></div>`;
    }).join('');
    act.innerHTML = `<button class="btn btn--blue" id="slReq">${F.t('c.sl.req').replace('{n}', ids.length)} <span class="arr">→</span></button><button class="btn btn--ghost" id="slClear">${F.t('c.sl.clear')}</button>`;
    qs('#slReq').addEventListener('click', () => F.requestDossier(ids));
    qs('#slClear').addEventListener('click', () => { F.shortlist.clear(); F.toast(F.t('c.sl.cleared')); });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tier]'); if (!b) return;
    const tier = b.dataset.tier;
    const c = F.modal(`<p class="kicker"><b>●</b> ${F.esc(tier)}</p><h2 class="h2">${F.t('c.f.title')}</h2><p class="muted">${F.t('c.f.intro')}</p>
      <form class="form mt-s"><div class="form-2">
        <label class="field"><span>${F.t('f.name')}</span><input required autocomplete="name"></label>
        <label class="field"><span>${F.t('f.club')}</span><input required></label>
        <label class="field"><span>${F.t('f.email')}</span><input type="email" required autocomplete="email"></label>
        <label class="field"><span>${F.t('c.f.country')}</span><input></label>
        <label class="field"><span>${F.t('c.f.level')}</span><select><option>${F.t('c.f.l1')}</option><option>${F.t('c.f.l2')}</option><option>${F.t('c.f.l3')}</option><option>${F.t('c.f.l4')}</option></select></label>
        <label class="field"><span>${F.t('c.f.need')}</span><select><option>${F.L(D.GROUPS.att)}</option><option>${F.L(D.GROUPS.mid)}</option><option>${F.L(D.GROUPS.def)}</option><option>${F.L(D.GROUPS.gk)}</option><option>${F.t('c.f.open')}</option></select></label>
      </div>
      <label class="field"><span>${F.t('f.msg')}</span><textarea></textarea></label>
      <label class="check"><input type="checkbox" required> ${F.t('c.f.charter')}</label>
      <div><button class="btn btn--blue">${F.t('c.f.send')} <span class="arr">→</span></button></div></form>`);
    qs('form', c).addEventListener('submit', (ev) => { ev.preventDefault(); c.innerHTML = F.formSuccess(F.t('c.f.ok.t'), F.t('c.f.ok.p')); });
  });

  renderShortlist();
  document.addEventListener('fcg:shortlist', renderShortlist);
  document.addEventListener('fcg:lang', renderShortlist);
})();

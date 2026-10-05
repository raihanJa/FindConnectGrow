/* Support page: impact calculator + donation flow */
(function () {
  const D = window.FCG_DATA, F = window.FCG, qs = F.qs, qsa = F.qsa;
  const S = { amt: 50, freq: 'month', dest: 'need' };
  const ITEMS = [
    { k: 'train', cost: 15 }, { k: 'boots', cost: 40 }, { k: 'docs', cost: 120 }, { k: 'kit', cost: 220 }, { k: 'trial', cost: 650 }
  ];
  const ALLOC = [['al1', 62], ['al2', 18], ['al3', 12], ['al4', 8]];
  const COLORS = ['var(--ink)', 'var(--blue)', '#6E9CF7', 'var(--paper-2)'];
  const amt = qs('#amt'), rng = qs('#amtR');
  const fmt = (n) => '€' + n.toLocaleString(F.lang === 'nl' ? 'nl-NL' : 'en-GB');

  function renderStatic() {
    qs('#presets').innerHTML = [25, 50, 100, 250, 500].map((v) => `<button class="chip" data-p="${v}" aria-pressed="${v === S.amt}">€${v}</button>`).join('');
    qs('#dest').innerHTML = `<option value="need">${F.t('s.need')}</option><optgroup label="${F.t('s.byreg')}">` +
      Object.keys(D.REGIONS).map((k) => `<option value="${k}" ${S.dest === k ? 'selected' : ''}>${F.L(D.REGIONS[k].name)}</option>`).join('') + '</optgroup>';
    qs('#dest').value = S.dest;
    qs('#alloc').innerHTML = ALLOC.map(([k, v]) => `<div style="flex:${v}" title="${F.t('s.' + k)}">${v}%</div>`).join('');
    qs('#allocLeg').innerHTML = ALLOC.map(([k, v], i) => `<div><b>${v}%</b><span><i style="background:${COLORS[i]}"></i>${F.t('s.' + k)}</span></div>`).join('');
  }

  function render() {
    qsa('#freq button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.freq)));
    qsa('#presets [data-p]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.p === S.amt)));
    const yearly = S.freq === 'month' ? S.amt * 12 : S.amt;
    qs('#per').textContent = S.freq === 'month' ? F.t('s.permonth') : '';
    qs('#outK').innerHTML = `<b>●</b> ${S.freq === 'month' ? F.t('s.outk.m').replace('{y}', fmt(yearly)) : F.t('s.outk.o')}`;
    qs('#outT').textContent = F.t('s.outt');
    qs('#impact').innerHTML = ITEMS.map((it) => {
      const n = yearly / it.cost;
      const val = n >= 1 ? Math.floor(n) : Math.round(n * 100) + '%';
      return `<div class="impact${n < 0.05 ? ' zero' : ''}"><b>${val}</b><span><strong>${F.t('s.i.' + it.k + (n < 2 ? '1' : ''))}</strong>${F.t('s.i.' + it.k + 'p').replace('{c}', fmt(it.cost))}</span></div>`;
    }).join('');
    const destName = S.dest === 'need' ? '' : ' · ' + F.L(D.REGIONS[S.dest].name);
    qs('#giveBtn').innerHTML = `${F.t('s.give')} ${fmt(S.amt)}${S.freq === 'month' ? F.t('s.pm') : ''}${destName} <span class="arr">→</span>`;
  }

  function setAmt(v, from) {
    v = Math.max(5, Math.min(5000, Math.round(+v || 5)));
    S.amt = v;
    if (from !== 'input') amt.value = v;
    if (from !== 'range') rng.value = Math.min(1000, v);
    render();
  }
  amt.addEventListener('input', () => { if (amt.value !== '') setAmt(amt.value, 'input'); });
  amt.addEventListener('blur', () => setAmt(amt.value));
  rng.addEventListener('input', () => setAmt(rng.value, 'range'));
  qs('#presets').addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) setAmt(b.dataset.p); });
  qs('#freq').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { S.freq = b.dataset.v; render(); } });
  qs('#dest').addEventListener('change', (e) => { S.dest = e.target.value; render(); });

  /* donation flow (concept) */
  qs('#giveBtn').addEventListener('click', () => {
    const destName = S.dest === 'need' ? F.t('s.need') : F.L(D.REGIONS[S.dest].name);
    const summary = `<div class="summary-box"><div><span class="kicker">${S.freq === 'month' ? F.t('s.month') : F.t('s.once')} · ${F.esc(destName)}</span></div><b>${fmt(S.amt)}${S.freq === 'month' ? F.t('s.pm') : ''}</b></div>`;
    const c = F.modal('');
    const step = (n) => {
      const ind = `<div class="steps-ind">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
      if (n === 1) {
        c.innerHTML = `${ind}<p class="kicker">${F.t('s.d.k1')}</p><h2 class="h2">${F.t('s.d.t1')}</h2>${summary}
          <form class="form"><div class="form-2"><label class="field"><span>${F.t('f.name')}</span><input required autocomplete="name"></label>
          <label class="field"><span>${F.t('f.email')}</span><input type="email" required autocomplete="email"></label></div>
          <label class="check"><input type="checkbox" checked> ${F.t('s.d.upd')}</label>
          <label class="check"><input type="checkbox"> ${F.t('s.d.anon')}</label>
          <div><button class="btn btn--blue">${F.t('s.d.next')} <span class="arr">→</span></button></div></form>`;
        qs('form', c).addEventListener('submit', (e) => { e.preventDefault(); step(2); });
      } else if (n === 2) {
        c.innerHTML = `${ind}<p class="kicker">${F.t('s.d.k2')}</p><h2 class="h2">${F.t('s.d.t2')}</h2>${summary}
          <form class="form"><div class="chips" role="radiogroup">${['iDEAL', 'Card', 'PayPal', 'SEPA'].map((m, i) => `<label class="chip" style="cursor:pointer"><input type="radio" name="pm" ${i === 0 ? 'checked' : ''} style="accent-color:var(--blue)"> ${m === 'Card' ? F.t('s.d.card') : m}</label>`).join('')}</div>
          <p class="footnote">${F.t('s.d.concept')}</p>
          <div class="hero-ctas" style="margin-top:8px"><button type="button" class="btn btn--ghost" data-back>← ${F.t('s.d.back')}</button><button class="btn btn--blue">${F.t('s.d.confirm')} <span class="arr">→</span></button></div></form>`;
        qs('[data-back]', c).addEventListener('click', () => step(1));
        qs('form', c).addEventListener('submit', (e) => { e.preventDefault(); step(3); });
      } else {
        c.innerHTML = `${ind}` + F.formSuccess(F.t('s.d.okt'), F.t('s.d.okp').replace('{a}', fmt(S.amt) + (S.freq === 'month' ? F.t('s.pm') : '')));
      }
    };
    step(1);
  });

  /* other ways to help */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-help]'); if (!b) return;
    const k = b.dataset.help;
    const c = F.modal(`<p class="kicker"><b>●</b> ${F.t('s.h.k')}</p><h2 class="h2">${F.t('s.h.' + k)}</h2>
      <form class="form mt-s"><div class="form-2"><label class="field"><span>${F.t('f.name')}</span><input required></label>
      <label class="field"><span>${F.t('f.email')}</span><input type="email" required></label></div>
      <label class="field"><span>${F.t('s.h.what')}</span><textarea required></textarea></label>
      <div><button class="btn btn--blue">${F.t('f.send')} <span class="arr">→</span></button></div></form>`);
    qs('form', c).addEventListener('submit', (ev) => { ev.preventDefault(); c.innerHTML = F.formSuccess(F.t('s.h.okt'), F.t('s.h.okp')); });
  });

  renderStatic(); render();
  document.addEventListener('fcg:lang', () => { renderStatic(); render(); });
})();

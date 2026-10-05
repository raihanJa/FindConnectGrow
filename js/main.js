/* FCG — shared runtime: i18n, chrome, shortlist, modal, generative graphics */
(function () {
  const D = window.FCG_DATA;
  const FCG = (window.FCG = window.FCG || {});
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  FCG.qs = qs; FCG.qsa = qsa;

  /* ---------- storage ---------- */
  FCG.store = {
    get(k, d) { try { const v = localStorage.getItem('fcg:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fcg:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  /* ---------- i18n ---------- */
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'nl' || urlLang === 'en') FCG.store.set('lang', urlLang);
  FCG.lang = urlLang === 'nl' || urlLang === 'en' ? urlLang : FCG.store.get('lang', 'en') === 'nl' ? 'nl' : 'en';
  FCG.L = (o) => (o ? (o[FCG.lang] != null ? o[FCG.lang] : o.en) : '');
  FCG.t = (k) => { const e = (window.FCG_TX || {})[k]; return e ? FCG.L(e) : k; };
  let enTitle = null;
  FCG.applyLang = function () {
    const nl = FCG.lang === 'nl';
    const dict = window.FCG_NL || {};
    document.documentElement.lang = FCG.lang;
    qsa('[data-i18n]').forEach((el) => {
      if (el.__en === undefined) el.__en = el.innerHTML;
      const k = el.dataset.i18n;
      el.innerHTML = nl && dict[k] != null ? dict[k] : el.__en;
    });
    qsa('[data-i18n-ph]').forEach((el) => {
      if (el.__enph === undefined) el.__enph = el.getAttribute('placeholder') || '';
      const k = el.dataset.i18nPh;
      el.setAttribute('placeholder', nl && dict[k] != null ? dict[k] : el.__enph);
    });
    if (enTitle === null) enTitle = document.title;
    const tk = 'title.' + document.body.dataset.page;
    document.title = nl && dict[tk] ? dict[tk] : enTitle;
    qsa('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === FCG.lang)));
  };
  FCG.setLang = function (l) {
    if (l === FCG.lang) return;
    FCG.lang = l; FCG.store.set('lang', l);
    FCG.applyLang();
    document.dispatchEvent(new CustomEvent('fcg:lang'));
  };

  /* ---------- helpers ---------- */
  FCG.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  FCG.byId = (id) => D.TALENTS.find((t) => t.id === id);
  FCG.foot = (f) => FCG.t('foot.' + f);
  FCG.statusPill = (s) => `<span class="pill st-${s}"><i></i>${FCG.L(D.STATUS[s])}</span>`;
  FCG.param = (k) => new URLSearchParams(location.search).get(k);
  FCG.month = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(FCG.lang === 'nl' ? 'nl-NL' : 'en-GB', { month: 'short', year: 'numeric' });
  };

  /* seeded random */
  FCG.hash = function (str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  FCG.rng = function (seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  function closedCurve(p) {
    const n = p.length; let d = `M${p[0][0].toFixed(2)},${p[0][1].toFixed(2)}`;
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
    }
    return d + 'Z';
  }

  /* Generative "signature" portrait — a unique contour fingerprint per talent.
     Replaces photos: we never publish faces of minors. */
  FCG.signature = function (id, opt = {}) {
    const r = FCG.rng(FCG.hash(id));
    const rings = opt.rings || 17;
    const cx = 50 + (r() - 0.5) * 18, cy = 50 + (r() - 0.5) * 18;
    const harm = [1, 2, 3, 4, 6].map((k) => ({ k, p: r() * 6.283, a: 0.3 + r() * 0.9 }));
    const hot = 4 + Math.floor(r() * (rings - 7));
    let out = '';
    for (let i = 0; i < rings; i++) {
      const base = 3 + i * 3.7, amp = 0.5 + i * 0.36, pts = [];
      for (let j = 0; j < 56; j++) {
        const th = (j / 56) * Math.PI * 2;
        let rr = base;
        harm.forEach((h) => { rr += Math.sin(th * h.k + h.p + i * 0.21) * amp * h.a / Math.sqrt(h.k); });
        pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
      }
      const cls = i === hot ? ' stroke="#1463F3" stroke-width="1.5" opacity="1"' : '';
      out += `<path d="${closedCurve(pts)}"${cls}/>`;
    }
    return `<svg class="sig" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#0C1C36" stroke-width=".42" opacity=".78">${out}</g></svg>`;
  };

  /* Mini pitch with position marker */
  const POSXY = { GK: [6, 50], CB: [22, 50], FB: [27, 14], DM: [40, 50], CM: [52, 50], AM: [66, 50], W: [79, 14], ST: [87, 50] };
  FCG.posXY = function (t) {
    let [x, y] = POSXY[t.pos];
    if ((t.pos === 'FB' || t.pos === 'W') && t.foot === 'R') y = 100 - y;
    return [x, y];
  };
  FCG.pitchMini = function (t) {
    const [x, y] = FCG.posXY(t);
    return `<svg class="mini" viewBox="0 0 100 64" aria-hidden="true"><g fill="none" stroke="#0C1C36" stroke-width=".9" opacity=".55">
      <rect x="1" y="1" width="98" height="62"/><line x1="50" y1="1" x2="50" y2="63"/><circle cx="50" cy="32" r="8"/>
      <rect x="1" y="16" width="15" height="32"/><rect x="84" y="16" width="15" height="32"/></g>
      <circle cx="${x}" cy="${(y * 0.64).toFixed(1)}" r="8" fill="#1463F3" opacity=".2"/>
      <circle cx="${x}" cy="${(y * 0.64).toFixed(1)}" r="4.2" fill="#1463F3"/></svg>`;
  };

  /* Radar chart */
  FCG.radar = function (sets, opt = {}) {
    const S = opt.size || 320, c = S / 2, R = S * 0.34, n = 6;
    const labels = D.ATTR.map((a) => FCG.L(a));
    const pt = (i, v) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v]; };
    let g = '';
    [0.25, 0.5, 0.75, 1].forEach((k) => { g += `<polygon class="ring" points="${[...Array(n)].map((_, i) => pt(i, k).join(',')).join(' ')}"/>`; });
    for (let i = 0; i < n; i++) {
      const [x, y] = pt(i, 1); g += `<line class="spoke" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`;
      const [lx, ly] = pt(i, 1.2);
      const anchor = Math.abs(lx - c) < 4 ? 'middle' : lx > c ? 'start' : 'end';
      g += `<text class="lbl" x="${lx}" y="${ly + 3}" text-anchor="${anchor}">${labels[i]}</text>`;
    }
    sets.forEach((s, si) => {
      const pts = s.values.map((v, i) => pt(i, v / 100));
      g += `<g class="shp" style="animation-delay:${si * 0.12}s"><polygon class="shape" points="${pts.map((p) => p.join(',')).join(' ')}" fill="${s.color}" fill-opacity="${s.fill == null ? 0.14 : s.fill}" stroke="${s.color}" ${s.dash ? 'stroke-dasharray="4 3"' : ''}/>`;
      pts.forEach((p) => { g += `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="3" fill="${s.color}"/>`; });
      if (opt.values && si === 0) s.values.forEach((v, i) => { const [x, y] = pt(i, v / 100 + 0.1); g += `<text class="val" x="${x}" y="${y + 3}" text-anchor="middle">${v}</text>`; });
      g += '</g>';
    });
    return `<svg class="radar" viewBox="0 0 ${S} ${S}" role="img" aria-label="${FCG.t('radar.aria')}">${g}</svg>`;
  };

  /* Talent card */
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3.1-5.4 3.1 1.2-6L3.3 9.8l6.1-.7z" stroke-linejoin="round"/></svg>';
  FCG.STAR = STAR;
  FCG.starBtn = (id, label = true) => {
    const on = FCG.shortlist.has(id);
    return `<button class="star" data-star="${id}" aria-pressed="${on}" aria-label="${FCG.t('sl.toggle')}">${STAR}${label ? `<span>${FCG.t(on ? 'sl.on' : 'sl.add')}</span>` : ''}</button>`;
  };
  FCG.card = function (t, opt = {}) {
    const order = t.a.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
    const bars = order.map(([v, i], k) => `<div class="bar${k === 0 ? ' hi' : ''}"><span>${FCG.L(D.ATTR[i])}</span><s><i style="--w:${v}%"></i></s><span>${v}</span></div>`).join('');
    return `<article class="tcard" data-id="${t.id}" style="${opt.delay != null ? `animation-delay:${opt.delay}s` : ''}">
      <a class="tcard-link" href="talent.html?id=${t.id}" aria-label="${FCG.esc(t.name)} — ${FCG.L(D.POS[t.pos])}"></a>
      <div class="tcard-visual">${FCG.signature(t.id)}<span class="tcard-num">${t.no}</span>
        <div class="tcard-top">${FCG.statusPill(t.status)}<span class="reg">${FCG.L(D.REGIONS[t.region].name)}</span></div></div>
      <div class="tcard-body">
        <div class="tcard-row"><div><h3>${FCG.esc(t.name)}</h3><div class="meta">${t.pos} · ${t.age} ${FCG.t('yrs')} · ${FCG.foot(t.foot)}</div></div>
          <div class="ovr" title="${FCG.t('ovr.title')}"><b>${t.ovr}</b>OVR</div></div>
        <div class="tcard-foot">${FCG.pitchMini(t)}<div class="bars">${bars}</div></div>
      </div>
      <div class="tcard-actions">${FCG.starBtn(t.id)}${opt.compare ? `<label class="cmp"><input type="checkbox" data-cmp="${t.id}" ${opt.cmpOn ? 'checked' : ''}> ${FCG.t('cmp.label')}</label>` : ''}</div>
    </article>`;
  };

  /* ---------- shortlist ---------- */
  FCG.shortlist = {
    list() { return FCG.store.get('shortlist', []).filter((id) => FCG.byId(id)); },
    has(id) { return this.list().includes(id); },
    toggle(id) {
      const l = this.list(); const i = l.indexOf(id);
      if (i >= 0) l.splice(i, 1); else l.push(id);
      FCG.store.set('shortlist', l);
      document.dispatchEvent(new CustomEvent('fcg:shortlist', { detail: { id, on: i < 0 } }));
      return i < 0;
    },
    clear() { FCG.store.set('shortlist', []); document.dispatchEvent(new CustomEvent('fcg:shortlist', { detail: {} })); }
  };
  function syncStars() {
    qsa('[data-star]').forEach((b) => {
      const on = FCG.shortlist.has(b.dataset.star);
      b.setAttribute('aria-pressed', String(on));
      const s = b.querySelector('span'); if (s) s.textContent = FCG.t(on ? 'sl.on' : 'sl.add');
    });
    const n = FCG.shortlist.list().length;
    qsa('.sl-count').forEach((c) => { c.textContent = n; c.classList.toggle('on', n > 0); });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-star]');
    if (!b) return;
    e.preventDefault();
    const t = FCG.byId(b.dataset.star);
    const on = FCG.shortlist.toggle(b.dataset.star);
    FCG.toast(on ? FCG.t('toast.sl.add').replace('{n}', t.name) : FCG.t('toast.sl.rm').replace('{n}', t.name));
    qsa('.sl-link').forEach((l) => { l.classList.remove('bump'); void l.offsetWidth; l.classList.add('bump'); });
  });
  document.addEventListener('fcg:shortlist', syncStars);
  document.addEventListener('fcg:lang', syncStars);

  /* ---------- toast ---------- */
  let toastEl, toastT;
  FCG.toast = function (msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2400);
  };

  /* ---------- modal ---------- */
  let modalEl, lastFocus, onCloseCb;
  FCG.modal = function (html, opt = {}) {
    if (!modalEl) {
      modalEl = document.createElement('div'); modalEl.className = 'modal';
      modalEl.innerHTML = '<div class="modal-bg" data-close></div><div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" data-close aria-label="Close">×</button><div class="modal-c"></div></div>';
      document.body.appendChild(modalEl);
      modalEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) FCG.closeModal(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalEl.classList.contains('open')) FCG.closeModal(); });
    }
    lastFocus = document.activeElement; onCloseCb = opt.onClose;
    const box = qs('.modal-box', modalEl);
    box.classList.toggle('wide', !!opt.wide);
    qs('.modal-c', modalEl).innerHTML = html;
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = qs('input,select,textarea,button:not(.modal-x)', box); (f || qs('.modal-x', box)).focus(); }, 60);
    return qs('.modal-c', modalEl);
  };
  FCG.closeModal = function () {
    if (!modalEl) return;
    modalEl.classList.remove('open'); document.body.style.overflow = '';
    if (onCloseCb) onCloseCb();
    if (lastFocus) lastFocus.focus();
  };
  FCG.formSuccess = (title, text) => `<div class="form-ok"><div class="tick">✓</div><h2 class="h2" style="font-size:2rem">${title}</h2><p class="muted">${text}</p><button class="btn mt-s" data-close>${FCG.t('close')}</button></div>`;

  /* Dossier request — used on profile + clubs */
  FCG.requestDossier = function (ids) {
    const names = ids.map((id) => FCG.byId(id)).filter(Boolean).map((t) => t.name);
    const c = FCG.modal(`
      <p class="kicker"><b>●</b> ${FCG.t('dos.kicker')}</p>
      <h2 class="h2">${FCG.t('dos.title')}</h2>
      <p class="muted">${FCG.t('dos.intro')}</p>
      ${names.length ? `<p class="mono" style="font-size:12px;border:1px solid var(--line);padding:10px 12px;background:var(--card)">${names.map(FCG.esc).join(' · ')}</p>` : ''}
      <form class="form mt-s">
        <div class="form-2">
          <label class="field"><span>${FCG.t('f.name')}</span><input required autocomplete="name"></label>
          <label class="field"><span>${FCG.t('f.club')}</span><input required></label>
          <label class="field"><span>${FCG.t('f.role')}</span><select><option>${FCG.t('f.role1')}</option><option>${FCG.t('f.role2')}</option><option>${FCG.t('f.role3')}</option></select></label>
          <label class="field"><span>${FCG.t('f.email')}</span><input type="email" required autocomplete="email"></label>
        </div>
        <label class="field"><span>${FCG.t('f.msg')}</span><textarea placeholder="${FCG.t('dos.ph')}"></textarea></label>
        <label class="check"><input type="checkbox" required> ${FCG.t('dos.check')}</label>
        <div><button class="btn btn--blue">${FCG.t('dos.send')} <span class="arr">→</span></button></div>
      </form>`);
    qs('form', c).addEventListener('submit', (e) => { e.preventDefault(); c.innerHTML = FCG.formSuccess(FCG.t('dos.ok.t'), FCG.t('dos.ok.p')); });
  };

  /* ---------- reveal + counters ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in'); io.unobserve(en.target);
      qsa('[data-count]', en.target).concat(en.target.matches('[data-count]') ? [en.target] : []).forEach(countUp);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  FCG.reveal = function (root = document) { qsa('.reveal:not(.in)', root).forEach((el) => (io ? io.observe(el) : el.classList.add('in'))); };
  function countUp(el) {
    if (el.__done) return; el.__done = true;
    const to = +el.dataset.count, dur = 1600, t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = to; }, dur + 150);
  }

  /* ---------- chrome ---------- */
  const NAV = [['talents', 'talents.html', 'nav.portal', 'Talent portal'], ['clubs', 'clubs.html', 'nav.clubs', 'For clubs'], ['about', 'about.html', 'nav.about', 'Mission'], ['support', 'support.html', 'nav.support', 'Support us']];
  function header(page) {
    const links = NAV.map(([k, h, i, l]) => `<li><a href="${h}" data-i18n="${i}" ${k === page ? 'aria-current="page"' : ''}>${l}</a></li>`).join('');
    const mlinks = [['home', 'index.html', 'nav.home', 'Home']].concat(NAV).map(([k, h, i, l]) => `<li><a href="${h}" data-i18n="${i}">${l}</a></li>`).join('');
    const lang = '<div class="lang" role="group" aria-label="Language"><button data-lang="en">EN</button><button data-lang="nl">NL</button></div>';
    return `<a class="skip" href="#main" data-i18n="skip">Skip to content</a>
    <div class="mast"><div class="wrap"><span data-i18n="mast.l">Issue N°01 — Talent beyond borders</span><span data-i18n="mast.m">Scouting in conflict-affected regions</span><span data-i18n="mast.r">Concept edition · 2026</span></div></div>
    <nav class="nav" aria-label="Main"><div class="wrap">
      <a class="nav-logo" href="index.html"><img src="assets/fcg-mark.png" alt="FCG — Find Connect &amp; Grow" width="96" height="35"></a>
      <ul class="nav-links">${links}</ul>
      <div class="nav-actions">${lang}
        <a class="sl-link" href="clubs.html#shortlist" aria-label="Shortlist">${STAR.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.6"')}<span class="sl-count">0</span></a>
        <a class="btn btn--blue btn--sm" href="support.html#give" data-i18n="nav.donate">Donate</a>
        <button class="burger" aria-label="Menu" aria-expanded="false"><span></span></button>
      </div></div></nav>
    <div class="mmenu" aria-hidden="true"><div class="mmenu-top"><img src="assets/fcg-mark-light.png" alt="FCG"><button class="mmenu-close" aria-label="Close">×</button></div>
      <ol>${mlinks}</ol><div class="mmenu-foot">${lang}<a class="btn btn--blue btn--sm" href="support.html#give" data-i18n="nav.donate">Donate</a></div></div>`;
  }
  function footer() {
    return `<footer class="foot"><div class="wrap">
      <div class="foot-top">
        <h2 class="display foot-claim">Find.<br>Connect.<br><span>Grow.</span></h2>
        <div class="foot-news"><p class="kicker" style="color:#8FB3FF" data-i18n="foot.newsk">The Dispatch — monthly</p>
          <p data-i18n="foot.news">A short letter from the field: new talents, stories from our scouts, and where we are heading next.</p>
          <form class="newsform"><input type="email" required placeholder="your@email.com" data-i18n-ph="foot.ph" aria-label="Email"><button data-i18n="foot.sub">Subscribe →</button></form></div>
      </div>
      <div class="foot-cols">
        <div><img class="foot-logo" src="assets/fcg-mark-light.png" alt="FCG"><p style="color:#A9B6CF;max-width:30ch;font-size:14px;margin-top:16px" data-i18n="foot.about">We find football talent in conflict-affected regions and connect them to the European game.</p></div>
        <div><h4 data-i18n="foot.h1">Explore</h4><ul><li><a href="talents.html" data-i18n="nav.portal">Talent portal</a></li><li><a href="index.html#map" data-i18n="foot.map">Where we scout</a></li><li><a href="index.html#pathway" data-i18n="foot.path">The pathway</a></li></ul></div>
        <div><h4 data-i18n="foot.h2">Clubs</h4><ul><li><a href="clubs.html#process" data-i18n="foot.how">How it works</a></li><li><a href="clubs.html#models" data-i18n="foot.models">Partnerships</a></li><li><a href="clubs.html#shortlist" data-i18n="foot.sl">Your shortlist</a></li></ul></div>
        <div><h4 data-i18n="foot.h3">Organisation</h4><ul><li><a href="about.html" data-i18n="nav.about">Mission</a></li><li><a href="about.html#safeguarding" data-i18n="foot.safe">Safeguarding</a></li><li><a href="about.html#nominate" data-i18n="foot.nom">Nominate a talent</a></li></ul></div>
        <div><h4 data-i18n="foot.h4">Contact</h4><ul><li><a href="mailto:hello@fcg.example">hello@fcg.example</a></li><li><a href="support.html" data-i18n="nav.support">Support us</a></li><li><span style="color:#7D8AA6">Amsterdam, NL</span></li></ul></div>
      </div>
      <div class="foot-bottom"><span>© 2026 Find Connect &amp; Grow</span><span data-i18n="foot.disc">Concept website — all talent profiles and figures are fictional.</span><span>Talent beyond borders</span></div>
    </div></footer>`;
  }

  function initChrome() {
    const page = document.body.dataset.page;
    const h = qs('#site-header'); if (h) h.outerHTML = header(page);
    const f = qs('#site-footer'); if (f) f.outerHTML = footer();
    const nav = qs('.nav');
    const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const mm = qs('.mmenu'), burger = qs('.burger');
    const setMenu = (open) => { mm.classList.toggle('open', open); mm.setAttribute('aria-hidden', String(!open)); burger.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; };
    burger && burger.addEventListener('click', () => setMenu(true));
    qs('.mmenu-close').addEventListener('click', () => setMenu(false));
    qsa('.mmenu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) FCG.setLang(b.dataset.lang); });
    qsa('.newsform').forEach((fm) => fm.addEventListener('submit', (e) => { e.preventDefault(); fm.reset(); FCG.toast(FCG.t('toast.news')); }));
  }

  initChrome();
  FCG.applyLang();
  syncStars();
  FCG.reveal();
})();

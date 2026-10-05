/* Home page */
(function () {
  const D = window.FCG_DATA, F = window.FCG, qs = F.qs, qsa = F.qsa;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero curve: tapered swoosh + travelling ball ---------- */
  const host = qs('#heroCurve');
  let animId;
  function quad(p0, c, p1, s) {
    const u = 1 - s;
    return [u * u * p0[0] + 2 * u * s * c[0] + s * s * p1[0], u * u * p0[1] + 2 * u * s * c[1] + s * s * p1[1]];
  }
  function buildCurve(animate) {
    cancelAnimationFrame(animId);
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const p0 = [w * -0.01, h * 1.0], c = [w * 0.4, h * 0.12], p1 = [w * 0.93, h * 0.1];
    const N = 120, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, p = quad(p0, c, p1, s), q = quad(p0, c, p1, Math.min(1, s + 0.001));
      let dx = q[0] - p[0], dy = q[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const th = 0.6 + Math.pow(s, 1.4) * Math.max(4, w / 170);
      top.push([p[0] - dy * th, p[1] + dx * th]); bot.push([p[0] + dy * th, p[1] - dx * th]);
    }
    const shape = 'M' + top.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L') + 'L' + bot.reverse().map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L') + 'Z';
    const center = `M${p0} Q${c} ${p1}`;
    const stops = [[0.18, 'h.st1'], [0.56, 'h.st2'], [1, 'h.st3']].map(([s, k], i) => {
      const [x, y] = quad(p0, c, p1, s);
      return `<g class="stop${i === 2 ? ' end' : ''}" data-s="${s}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${i === 2 ? '' : '<circle r="5"/>'}<text x="${i === 2 ? -10 : 10}" y="${i === 2 ? 46 : 22}" text-anchor="${i === 2 ? 'end' : 'start'}">${F.t(k)}</text></g>`;
    }).join('');
    const ball = Math.max(30, Math.min(64, w / 20));
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs><clipPath id="swclip"><rect id="swrect" x="${-w}" y="${-h}" width="0" height="${h * 3}"/></clipPath></defs>
      <path class="trail-ghost" d="${center}"/>
      <path d="${shape}" fill="#1463F3" clip-path="url(#swclip)"/>
      ${stops}
      <image id="ballImg" href="assets/fcg-ball.png" width="${ball}" height="${ball}" x="${-ball / 2}" y="${-ball / 2}"/></svg>`;
    const rect = qs('#swrect', host), img = qs('#ballImg', host);
    const stopEls = qsa('.stop', host);
    const place = (s) => {
      const pt = quad(p0, c, p1, s);
      rect.setAttribute('width', (pt[0] + w + (s >= 1 ? ball : 0)).toFixed(1));
      const end = s >= 1 ? ball * 0.55 : 0;
      img.setAttribute('transform', `translate(${(pt[0] + end).toFixed(1)},${(pt[1] - end * 0.12).toFixed(1)}) rotate(${(s * 720).toFixed(0)})`);
      stopEls.forEach((g) => g.classList.toggle('on', s >= +g.dataset.s - 0.02));
    };
    if (!animate || reduce) { place(1); return; }
    const dur = 2600, t0 = performance.now() + 450;
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      place(e);
      if (p < 1) animId = requestAnimationFrame(tick);
    };
    place(0); animId = requestAnimationFrame(tick);
    setTimeout(() => { if (img.isConnected) place(1); }, dur + 1200);
  }
  buildCurve(true);
  qs('#replay').addEventListener('click', () => buildCurve(true));
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => buildCurve(false), 150); });

  /* ---------- Spotlights ---------- */
  function spot(el, t, sub) {
    el.href = 'talent.html?id=' + t.id;
    el.innerHTML = `<div class="sig">${F.signature(t.id)}</div><div><span class="pill st-${t.status}"><i></i>${F.L(D.STATUS[t.status])}</span>
      <h4>${F.esc(t.name)}</h4><p>${F.L(D.POS[t.pos])} · ${t.age} ${F.t('yrs')}<br>${F.esc(t.city)}, ${F.L(D.REGIONS[t.region].name)}</p></div>`;
  }
  function renderSpots() {
    const week = Math.floor(Date.now() / 6048e5);
    const top = D.TALENTS.filter((t) => t.status >= 1).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
    spot(qs('#spot'), top[week % top.length]);
    const newest = D.TALENTS.slice().sort((a, b) => b.joined.localeCompare(a.joined))[0];
    spot(qs('#spot2'), newest);
  }

  /* ---------- Ticker ---------- */
  function renderTicker() {
    const items = Object.values(D.REGIONS).map((r) => `<span class="ticker-item"><b>${F.L(r.name)}</b>${r.place}</span>`).join('');
    qs('#ticker').innerHTML = items + items;
  }

  /* ---------- Pathway (scroll-linked) ---------- */
  const steps = qsa('.pstep'), fill = qs('#pathFill'), stepsBox = qs('#pathSteps');
  let cur = -1;
  function pathScroll() {
    const line = window.innerHeight * 0.5;
    let idx = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) idx = i; });
    steps.forEach((s, i) => s.classList.toggle('on', i <= idx));
    const r = stepsBox.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (line - r.top) / (r.height - 40)));
    fill.style.height = (p * 100).toFixed(1) + '%';
    if (idx !== cur) { cur = idx; setPathLabel(); }
  }
  function setPathLabel() {
    const s = steps[Math.max(0, cur)];
    qs('#pathNum').textContent = s.dataset.n;
    qs('#pathName').textContent = F.lang === 'nl' ? s.dataset.nameNl : s.dataset.name;
  }
  window.addEventListener('scroll', pathScroll, { passive: true }); pathScroll();

  /* ---------- Map ---------- */
  const regionKeys = Object.keys(D.REGIONS);
  let selected = 'syria', autoTimer = null, userTouched = false;
  const countFor = (k) => D.TALENTS.filter((t) => t.region === k).length;

  function renderPanel() {
    const r = D.REGIONS[selected];
    const n = countFor(selected);
    qs('#mapPanel').innerHTML = `
      <p class="kicker">${F.t('map.region')} · ${F.t('map.since')} ${r.since}</p>
      <h3 class="display">${F.L(r.name)}</h3>
      <p class="place">${r.place}</p>
      <p>${F.L(r.note)}</p>
      <div class="map-facts"><div><b>${n}</b><span>${F.t('map.f1')}</span></div><div><b>${r.scouts}</b><span>${F.t('map.f2')}</span></div><div><b>${r.since}</b><span>${F.t('map.f3')}</span></div></div>
      <div><a class="btn btn--light" href="talents.html?region=${selected}">${F.t('map.cta').replace('{r}', F.L(r.name))} <span class="arr">→</span></a></div>
      <div class="map-list" role="group" aria-label="${F.t('map.list')}">${regionKeys.map((k) => `<button data-reg="${k}" aria-pressed="${k === selected}">${F.L(D.REGIONS[k].name)}</button>`).join('')}</div>`;
  }
  function select(k, fromUser) {
    selected = k;
    if (fromUser) { userTouched = true; clearInterval(autoTimer); }
    renderPanel();
    qsa('#mapWrap .pin').forEach((p) => p.classList.toggle('sel', p.dataset.reg === k));
    qsa('#mapWrap .arc').forEach((p) => p.classList.toggle('sel', p.dataset.reg === k));
    const iso = D.REGIONS[k].iso;
    qsa('#mapWrap .land.hot').forEach((p) => p.classList.toggle('sel', iso.includes(p.dataset.id)));
  }
  qs('#mapPanel').addEventListener('click', (e) => { const b = e.target.closest('[data-reg]'); if (b) select(b.dataset.reg, true); });

  async function initMap() {
    const wrap = qs('#mapWrap');
    const fail = () => { const d = document.createElement('div'); d.className = 'map-fallback'; d.textContent = F.t('map.offline'); wrap.appendChild(d); };
    if (!window.d3 || !window.topojson) return fail();
    let world;
    try { world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'); } catch (e) { return fail(); }
    const W = 960, H = 660;
    const proj = d3.geoNaturalEarth1().fitExtent([[0, 0], [W, H]], { type: 'MultiPoint', coordinates: [[-17, -9], [73, 61]] });
    const path = d3.geoPath(proj);
    const hotIso = new Set(regionKeys.flatMap((k) => D.REGIONS[k].iso));
    const feats = topojson.feature(world, world.objects.countries).features;
    const P = (ll) => proj(ll).map((v) => +v.toFixed(1));
    const hub = P(D.HUB.ll);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${F.t('map.aria')}"><path class="grat" d="${path(d3.geoGraticule10())}"/>`;
    feats.forEach((f) => { const id = String(f.id); svg += `<path class="land${hotIso.has(id) ? ' hot' : ''}" data-id="${id}" d="${path(f) || ''}"/>`; });
    regionKeys.forEach((k, i) => {
      const a = P(D.REGIONS[k].ll), mx = (a[0] + hub[0]) / 2, my = (a[1] + hub[1]) / 2;
      const dx = hub[0] - a[0], dy = hub[1] - a[1], len = Math.hypot(dx, dy);
      const bend = len * 0.22 * (a[0] > hub[0] ? 1 : -1);
      const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
      svg += `<path id="arc-${k}" class="arc" data-reg="${k}" d="M${a} Q${cx.toFixed(1)},${cy.toFixed(1)} ${hub}"/>`;
      if (!reduce) svg += `<circle class="flow" r="2.2"><animateMotion dur="${4 + (i % 4) * 0.6}s" begin="${(i * 0.37).toFixed(2)}s" repeatCount="indefinite"><mpath href="#arc-${k}"/></animateMotion></circle>`;
    });
    D.ACADEMIES.forEach((ac) => { const p = P(ac.ll); svg += `<circle class="acad" cx="${p[0]}" cy="${p[1]}" r="4"/>`; });
    svg += `<g class="pin hub" transform="translate(${hub})"><circle class="core" r="7"/><text x="-12" y="-12" text-anchor="end">Amsterdam · FCG</text></g>`;
    const left = { southsudan: 1, gaza: 1, drc: 1 };
    regionKeys.forEach((k) => {
      const p = P(D.REGIONS[k].ll), L = left[k];
      svg += `<g class="pin" data-reg="${k}" transform="translate(${p})" tabindex="0" role="button" aria-label="${F.L(D.REGIONS[k].name)}">
        <circle class="halo" r="8"/><circle class="core" r="6"/><text x="${L ? -12 : 12}" y="4" text-anchor="${L ? 'end' : 'start'}">${F.L(D.REGIONS[k].name)}</text></g>`;
    });
    svg += '</svg>';
    wrap.insertAdjacentHTML('afterbegin', svg);
    wrap.addEventListener('click', (e) => { const p = e.target.closest('.pin[data-reg]'); if (p) select(p.dataset.reg, true); });
    wrap.addEventListener('keydown', (e) => { const p = e.target.closest('.pin[data-reg]'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(p.dataset.reg, true); } });
    select(selected);
  }
  function relabelMap() {
    qsa('#mapWrap .pin[data-reg] text').forEach((t) => { t.textContent = F.L(D.REGIONS[t.parentNode.dataset.reg].name); });
  }
  renderPanel();
  initMap();
  // gently cycle regions until the visitor interacts
  const band = qs('.mapband');
  const mio = new IntersectionObserver(([en]) => {
    clearInterval(autoTimer);
    if (en.isIntersecting && !userTouched && !reduce) autoTimer = setInterval(() => select(regionKeys[(regionKeys.indexOf(selected) + 1) % regionKeys.length]), 5000);
  }, { threshold: 0.3 });
  mio.observe(band);

  /* ---------- Featured rail ---------- */
  const rail = qs('#rail');
  function renderRail() {
    const list = D.TALENTS.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 9);
    rail.innerHTML = list.map((t) => F.card(t)).join('');
  }
  const step = () => (rail.firstElementChild ? rail.firstElementChild.getBoundingClientRect().width + 18 : 300);
  qs('#railPrev').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  qs('#railNext').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  // drag to scroll (mouse)
  let down = false, sx = 0, sl = 0, moved = false;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.target.closest('button,label')) return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; rail.classList.add('dragging'); } rail.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => rail.classList.remove('dragging'), 0); });
  rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  function renderAll() { renderSpots(); renderTicker(); renderRail(); setPathLabel(); renderPanel(); relabelMap(); }
  renderAll();
  document.addEventListener('fcg:lang', () => { renderAll(); buildCurve(false); });
})();

/* About page: scroll-lit manifesto, team, nomination form */
(function () {
  const D = window.FCG_DATA, F = window.FCG, qs = F.qs, qsa = F.qsa;
  const man = qs('#manifesto');

  // words wrapped in *asterisks* are highlighted blue
  function buildManifesto() {
    man.innerHTML = F.t('a.manifesto').split(' ').map((w) => {
      const b = /^\*.*\*[.,]?$/.test(w);
      return `<span class="w${b ? ' b' : ''}">${w.replace(/\*/g, '')}</span>`;
    }).join(' ');
    lightUp();
  }
  function lightUp() {
    const words = man.children; if (!words.length) return;
    const r = man.getBoundingClientRect(), vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const n = Math.round(p * words.length);
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
  }
  window.addEventListener('scroll', lightUp, { passive: true });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) window.removeEventListener('scroll', lightUp);

  const TEAM = [['FD', 'a.tm1'], ['HS', 'a.tm2'], ['WL', 'a.tm3'], ['PC', 'a.tm4'], ['DA', 'a.tm5']];
  function renderTeam() {
    qs('#team').innerHTML = TEAM.map(([ini, k]) => `<div class="member"><div class="ph">${F.signature('team-' + ini, { rings: 14 })}<b>${ini}</b></div>
      <h4>${F.t('a.tbd')}</h4><p>${F.t(k)}</p></div>`).join('');
  }
  function renderPos() {
    qs('#nomPos').innerHTML = Object.keys(D.POS).map((k) => `<option>${F.L(D.POS[k])}</option>`).join('') + `<option>${F.t('a.f2e')}</option>`;
  }

  qs('#nomForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    f.innerHTML = `<div class="compliance" style="display:block"><div class="form-ok"><div class="tick">✓</div><h2 class="h2" style="font-size:2rem">${F.t('a.ok.t')}</h2><p class="muted">${F.t('a.ok.p')}</p><a class="btn mt-s" href="about.html#nominate" onclick="location.reload()">${F.t('a.again')}</a></div></div>`;
  });

  function all() { buildManifesto(); renderTeam(); renderPos(); }
  all();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) qsa('.w', man).forEach((w) => w.classList.add('on'));
  document.addEventListener('fcg:lang', all);
})();

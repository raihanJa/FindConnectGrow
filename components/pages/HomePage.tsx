'use client';
/* Home page */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Talent } from '@/lib/data';
import { reducedMotion, tx } from '@/lib/fcg';
import { DocTitle, useData, useLang } from '../providers';
import { Signature, StatusPill, T, TalentCard, useReveal } from '../ui';

const PATH: [string, string, string][] = [['01', 'Find', 'Vinden'], ['02', 'Verify', 'Verifiëren'], ['03', 'Connect', 'Verbinden'], ['04', 'Grow', 'Groeien']];

type Pt = [number, number];
function quad(p0: Pt, c: Pt, p1: Pt, s: number): Pt {
  const u = 1 - s;
  return [u * u * p0[0] + 2 * u * s * c[0] + s * s * p1[0], u * u * p0[1] + 2 * u * s * c[1] + s * s * p1[1]];
}

type MapData = {
  W: number; H: number; grat: string; reduce: boolean; hub: number[];
  lands: { id: string; d: string; hot: boolean }[];
  arcs: { k: string; d: string }[];
  acads: number[][];
  pins: { k: string; p: number[] }[];
};

function Spot({ id, t }: { id: string; t: Talent | null }) {
  const { L, t: tr } = useLang();
  const { POS, REGIONS } = useData();
  if (!t) return <a className="hero-spot" id={id} href="#"></a>;
  return (
    <Link className="hero-spot" id={id} href={`/talent/${t.id}`}>
      <div className="sig"><Signature id={t.id} /></div><div><StatusPill s={t.status} />
        <h4>{t.name}</h4><p>{`${L(POS[t.pos])} · ${t.age} ${tr('yrs')}`}<br />{`${t.city}, ${L(REGIONS[t.region].name)}`}</p></div>
    </Link>
  );
}

export default function HomePage() {
  const { lang, ready, t, L } = useLang();
  const { ACADEMIES, HUB, REGIONS, TALENTS, METRICS } = useData();
  const regionKeys = Object.keys(REGIONS);
  const countFor = (k: string) => TALENTS.filter((x) => x.region === k).length;
  useReveal([]);
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  /* ---------- Hero curve: tapered swoosh + travelling ball ---------- */
  const heroRef = useRef<HTMLDivElement>(null);
  const curve = useRef({ build: (_animate: boolean) => {}, built: false });
  useEffect(() => {
    const host = heroRef.current!;
    const reduce = reducedMotion();
    let animId = 0, rT = 0;
    const timers: number[] = [];
    function build(animate: boolean) {
      cancelAnimationFrame(animId);
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      const p0: Pt = [w * -0.01, h * 1.0], c: Pt = [w * 0.4, h * 0.12], p1: Pt = [w * 0.93, h * 0.1];
      const N = 120, top: Pt[] = [], bot: Pt[] = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N, p = quad(p0, c, p1, s), q = quad(p0, c, p1, Math.min(1, s + 0.001));
        let dx = q[0] - p[0], dy = q[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const th = 0.6 + Math.pow(s, 1.4) * Math.max(4, w / 170);
        top.push([p[0] - dy * th, p[1] + dx * th]); bot.push([p[0] + dy * th, p[1] - dx * th]);
      }
      const shape = 'M' + top.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L') + 'L' + bot.reverse().map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L') + 'Z';
      const center = `M${p0} Q${c} ${p1}`;
      const stops = ([[0.18, 'h.st1'], [0.56, 'h.st2'], [1, 'h.st3']] as [number, string][]).map(([s, k], i) => {
        const [x, y] = quad(p0, c, p1, s);
        return `<g class="stop${i === 2 ? ' end' : ''}" data-s="${s}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${i === 2 ? '' : '<circle r="5"/>'}<text x="${i === 2 ? -10 : 10}" y="${i === 2 ? 46 : 22}" text-anchor="${i === 2 ? 'end' : 'start'}">${tx(langRef.current, k)}</text></g>`;
      }).join('');
      const ball = Math.max(30, Math.min(64, w / 20));
      host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs><clipPath id="swclip"><rect id="swrect" x="${-w}" y="${-h}" width="0" height="${h * 3}"/></clipPath></defs>
      <path class="trail-ghost" d="${center}"/>
      <path d="${shape}" fill="#1463F3" clip-path="url(#swclip)"/>
      ${stops}
      <image id="ballImg" href="/assets/fcg-ball.png" width="${ball}" height="${ball}" x="${-ball / 2}" y="${-ball / 2}"/></svg>`;
      const rect = host.querySelector('#swrect')!, img = host.querySelector('#ballImg')!;
      const stopEls = Array.from(host.querySelectorAll<SVGGElement>('.stop'));
      const place = (s: number) => {
        const pt = quad(p0, c, p1, s);
        rect.setAttribute('width', (pt[0] + w + (s >= 1 ? ball : 0)).toFixed(1));
        const end = s >= 1 ? ball * 0.55 : 0;
        img.setAttribute('transform', `translate(${(pt[0] + end).toFixed(1)},${(pt[1] - end * 0.12).toFixed(1)}) rotate(${(s * 720).toFixed(0)})`);
        stopEls.forEach((g) => g.classList.toggle('on', s >= +g.dataset.s! - 0.02));
      };
      if (!animate || reduce) { place(1); return; }
      const dur = 2600, t0 = performance.now() + 450;
      const tick = (now: number) => {
        const p = Math.max(0, Math.min(1, (now - t0) / dur));
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        place(e);
        if (p < 1) animId = requestAnimationFrame(tick);
      };
      place(0); animId = requestAnimationFrame(tick);
      timers.push(window.setTimeout(() => { if (img.isConnected) place(1); }, dur + 1200));
    }
    curve.current.build = build;
    const onResize = () => { clearTimeout(rT); rT = window.setTimeout(() => build(false), 150); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); clearTimeout(rT); timers.forEach(clearTimeout); window.removeEventListener('resize', onResize); };
  }, []);
  // first build animates once the visitor's language is known; later language switches redraw in place
  useEffect(() => {
    if (!ready) return;
    curve.current.build(!curve.current.built); curve.current.built = true;
  }, [ready, lang]);

  /* ---------- Spotlights ---------- */
  const [week, setWeek] = useState<number | null>(null);
  useEffect(() => { setWeek(Math.floor(Date.now() / 6048e5)); }, []);
  const topSpots = TALENTS.filter((x) => x.status >= 1).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
  const newest = TALENTS.slice().sort((a, b) => b.joined.localeCompare(a.joined))[0];

  /* ---------- Pathway (scroll-linked) ---------- */
  const stepsRef = useRef<HTMLDivElement>(null), fillRef = useRef<HTMLElement>(null);
  const [cur, setCur] = useState(-1);
  useEffect(() => {
    // capture the elements: refs are nulled on unmount before this effect's cleanup removes the listener
    const box = stepsRef.current!, fill = fillRef.current!, steps = Array.from(box.querySelectorAll<HTMLElement>('.pstep'));
    const pathScroll = () => {
      const line = window.innerHeight * 0.5;
      let idx = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) idx = i; });
      steps.forEach((s, i) => s.classList.toggle('on', i <= idx));
      const r = box.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (line - r.top) / (r.height - 40)));
      fill.style.height =(p * 100).toFixed(1) + '%';
      setCur(idx);
    };
    window.addEventListener('scroll', pathScroll, { passive: true }); pathScroll();
    return () => window.removeEventListener('scroll', pathScroll);
  }, []);
  const ps = PATH[Math.max(0, cur)];

  /* ---------- Map ---------- */
  const [selected, setSelected] = useState(() => (REGIONS.syria ? 'syria' : regionKeys[0]));
  const [map, setMap] = useState<MapData | null>(null);
  const [mapFail, setMapFail] = useState(false);
  const userTouched = useRef(false), autoTimer = useRef(0);
  const bandRef = useRef<HTMLElement>(null);
  const select = (k: string) => { setSelected(k); userTouched.current = true; clearInterval(autoTimer.current); };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ geoNaturalEarth1, geoPath, geoGraticule10 }, topojson, atlas] = await Promise.all([
          import('d3-geo'), import('topojson-client'), import('world-atlas/countries-110m.json')
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const world = ((atlas as any).default || atlas) as any;
        const W = 960, H = 660;
        const proj = geoNaturalEarth1().fitExtent([[0, 0], [W, H]], { type: 'MultiPoint', coordinates: [[-17, -9], [73, 61]] });
        const path = geoPath(proj);
        const hotIso = new Set(regionKeys.flatMap((k) => REGIONS[k].iso));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feats = (topojson.feature(world, world.objects.countries) as any).features as { id: unknown }[];
        const P = (ll: number[]) => proj(ll as [number, number])!.map((v) => +v.toFixed(1));
        const hub = P(HUB.ll);
        const data: MapData = {
          W, H, reduce: reducedMotion(), hub, grat: path(geoGraticule10()) || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lands: feats.map((f) => { const id = String(f.id); return { id, d: path(f as any) || '', hot: hotIso.has(id) }; }),
          arcs: regionKeys.map((k) => {
            const a = P(REGIONS[k].ll), mx = (a[0] + hub[0]) / 2, my = (a[1] + hub[1]) / 2;
            const dx = hub[0] - a[0], dy = hub[1] - a[1], len = Math.hypot(dx, dy);
            const bend = len * 0.22 * (a[0] > hub[0] ? 1 : -1);
            const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
            return { k, d: `M${a} Q${cx.toFixed(1)},${cy.toFixed(1)} ${hub}` };
          }),
          acads: ACADEMIES.map((ac) => P(ac.ll)),
          pins: regionKeys.map((k) => ({ k, p: P(REGIONS[k].ll) }))
        };
        if (alive) setMap(data);
      } catch { if (alive) setMapFail(true); }
    })();
    return () => { alive = false; };
  }, []);

  // gently cycle regions until the visitor interacts
  useEffect(() => {
    const reduce = reducedMotion();
    const mio = new IntersectionObserver(([en]) => {
      clearInterval(autoTimer.current);
      if (en.isIntersecting && !userTouched.current && !reduce) autoTimer.current = window.setInterval(() => setSelected((s) => regionKeys[(regionKeys.indexOf(s) + 1) % regionKeys.length]), 5000);
    }, { threshold: 0.3 });
    mio.observe(bandRef.current!);
    return () => { mio.disconnect(); clearInterval(autoTimer.current); };
  }, []);

  const R = REGIONS[selected];
  const selIso = R.iso;
  const left: Record<string, 1> = { southsudan: 1, gaza: 1, drc: 1 };

  /* ---------- Featured rail ---------- */
  const railRef = useRef<HTMLDivElement>(null);
  const railList = TALENTS.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 9);
  const step = () => { const rail = railRef.current!; return rail.firstElementChild ? rail.firstElementChild.getBoundingClientRect().width + 18 : 300; };
  useEffect(() => {
    // drag to scroll (mouse)
    const rail = railRef.current!;
    let down = false, sx = 0, sl = 0, moved = false;
    const pd = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || (e.target as Element).closest('button,label')) return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; };
    const pm = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; rail.classList.add('dragging'); } rail.scrollLeft = sl - dx; };
    const pu = () => { if (!down) return; down = false; setTimeout(() => rail.classList.remove('dragging'), 0); };
    const cc = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    rail.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); rail.addEventListener('click', cc, true);
    return () => { rail.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); rail.removeEventListener('click', cc, true); };
  }, []);

  const tickerItems = [0, 1].flatMap((n) => regionKeys.map((k) => <span className="ticker-item" key={k + n}><b>{L(REGIONS[k].name)}</b>{REGIONS[k].place}</span>));

  return (
    <main id="main"><DocTitle k={'title.home'} en={'FCG — Find Connect & Grow'} />
      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-top">
            <T className="kicker" k="h.k1" en="<b>●</b> Scouting live in 11 regions" />
            <button className="replay" id="replay" aria-label="Replay" onClick={() => curve.current.build(true)}><T k="h.replay" en="Replay the journey" /> ↻</button>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="hero-curve" id="heroCurve" aria-hidden="true" ref={heroRef}></div>
            <h1 className="display hero-title">
              <span className="line"><T k="h.t1" en="Talent has" /></span>
              <span className="line"><T k="h.t2" en="no borders." /></span>
              <span className="line"><T className="it" k="h.t3" en="Opportunity does." /></span>
            </h1>
          </div>
          <div className="hero-bottom">
            <div className="ctaswrap">
              <T as="p" className="lead" k="h.lead" en="Find Connect &amp; Grow scouts young footballers in war-torn and conflict-affected regions — and builds a safe, verified pathway to professional clubs in Europe." />
              <div className="hero-ctas">
                <Link className="btn btn--blue" href="/talents"><T k="h.cta1" en="Explore the talents" /> <span className="arr">→</span></Link>
                <T as={Link} className="btn btn--ghost" href="/clubs" k="h.cta2" en="I represent a club" />
              </div>
            </div>
            <div>
              <T as="p" className="kicker" style={{ margin: '0 0 10px' }} k="h.week" en="Spotlight of the week" />
              <Spot id="spot" t={week == null ? null : topSpots[week % topSpots.length]} />
            </div>
            <div>
              <T as="p" className="kicker" style={{ margin: '0 0 10px' }} k="h.newest" en="Newest in the portal" />
              <Spot id="spot2" t={newest} />
            </div>
          </div>
        </div>
        <div className="ticker" aria-hidden="true"><div className="ticker-track" id="ticker">{tickerItems}</div></div>
      </section>

      {/* 01 WHY */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§01</span><T k="h.s1k" en="The odds" /></span>
            <T as="h2" className="h2" k="h.s1t" en={'Scouts go where the leagues are. <span class="it blue">Not where the talent is.</span>'} />
          </div>
          <div className="split">
            <div className="reveal">
              <div className="display bigstat">1/6<T as="small" k="h.stat" en="children worldwide grows up in a conflict zone." /></div>
              <T as="p" className="footnote" k="h.src" en="Source: Save the Children, “Stop the War on Children” (2023). More than 460 million children live in areas affected by conflict." />
            </div>
            <div className="story-col reveal" data-d="1">
              <T as="p" k="h.p1" en="Every year, European clubs spend fortunes searching for the next great player. Their networks reach academies, tournaments and leagues — but they stop at the edge of the map where war begins." />
              <T as="p" k="h.p2" en="Behind that edge, kids still play. On sand, on concrete, between ruins and in refugee camps. Some of them are extraordinary. Almost none of them will ever be seen." />
              <T as="p" k="h.p3" en="FCG exists to close that gap. We train local scouts, verify talent with video and data, and walk every player — and their family — through a safe, legal route into European football." />
              <T as="p" k="h.p4" en="Not charity. Not a shortcut. <strong>A fair chance.</strong>" />
            </div>
          </div>
        </div>
      </section>

      {/* 02 PATHWAY */}
      <section className="sec" id="pathway">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§02</span><T k="h.s2k" en="The pathway" /></span>
            <T as="h2" className="h2" k="h.s2t" en={'Four steps from a dusty pitch to a <span class="it blue">professional dressing room.</span>'} />
          </div>
          <div className="path">
            <div className="path-sticky"><div>
              <div className="display path-big"><span id="pathNum">{ps[0]}</span><span className="of">/04</span></div>
              <div className="display path-name" id="pathName">{lang === 'nl' ? ps[2] : ps[1]}</div>
            </div></div>
            <div className="path-steps" id="pathSteps" ref={stepsRef}>
              <div className="path-rail"><i id="pathFill" ref={fillRef}></i></div>
              <div className="pstep" data-n="01" data-name="Find" data-name-nl="Vinden">
                <T as="p" className="kicker" k="h.ps1k" en="Step 01 · 0–3 months" />
                <T as="h3" className="h3" k="h.ps1t" en="Find — local eyes, trained" />
                <T as="p" k="h.ps1p" en="We recruit and train local coaches, teachers and NGO staff as FCG scouts. They know the neighbourhoods, the camp leagues and the street tournaments where talent hides." />
                <ul><T as="li" k="h.ps1a" en="Local scout network" /><T as="li" k="h.ps1b" en="Camp &amp; street leagues" /><T as="li" k="h.ps1c" en="Remote footage" /></ul>
              </div>
              <div className="pstep" data-n="02" data-name="Verify" data-name-nl="Verifiëren">
                <T as="p" className="kicker" k="h.ps2k" en="Step 02 · 1–2 months" />
                <T as="h3" className="h3" k="h.ps2t" en="Verify — video, data, identity" />
                <T as="p" k="h.ps2p" en="Every player is filmed in multiple matches and assessed by two independent analysts. We verify age and identity documents and get written consent from parents or guardians." />
                <ul><T as="li" k="h.ps2a" en="2× analyst review" /><T as="li" k="h.ps2b" en="Age verification" /><T as="li" k="h.ps2c" en="Guardian consent" /></ul>
              </div>
              <div className="pstep" data-n="03" data-name="Connect" data-name-nl="Verbinden">
                <T as="p" className="kicker" k="h.ps3k" en="Step 03 · 2–6 months" />
                <T as="h3" className="h3" k="h.ps3t" en="Connect — clubs meet the player" />
                <T as="p" k="h.ps3p" en="Verified profiles go live in the portal for partner clubs. Interested clubs request full dossiers and invite players for a supervised trial in Europe — visas, travel and welfare handled by FCG." />
                <ul><T as="li" k="h.ps3a" en="Club portal" /><T as="li" k="h.ps3b" en="Supervised trials" /><T as="li" k="h.ps3c" en="Visa &amp; travel support" /></ul>
              </div>
              <div className="pstep" data-n="04" data-name="Grow" data-name-nl="Groeien">
                <T as="p" className="kicker" k="h.ps4k" en="Step 04 · ongoing" />
                <T as="h3" className="h3" k="h.ps4t" en="Grow — on and off the pitch" />
                <T as="p" k="h.ps4p" en="Players who join a partner academy get education, language lessons, mental-health support and a dedicated welfare officer. We stay involved until they are settled — not just until they sign." />
                <ul><T as="li" k="h.ps4a" en="Education &amp; language" /><T as="li" k="h.ps4b" en="Welfare officer" /><T as="li" k="h.ps4c" en="Family contact" /></ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 MAP */}
      <section className="mapband" id="map" ref={bandRef}>
        <div className="wrap">
          <div className="sec-head two reveal">
            <span className="kicker"><span className="num">§03</span><T k="h.s3k" en="Where we scout" /></span>
            <T as="h2" className="h2" k="h.s3t" en={'Eleven regions. <span class="it" style="color:#8FB3FF">One destination.</span>'} />
            <T as="p" className="lead" k="h.s3l" en="Click a region to see who we work with and which talents come from there." />
          </div>
          <div className="map-grid">
            <div className="map-wrap reveal" id="mapWrap">
              {map && (
                <svg viewBox={`0 0 ${map.W} ${map.H}`} role="img" aria-label={t('map.aria')}>
                  <path className="grat" d={map.grat} />
                  {map.lands.map((f, i) => <path key={i} className={'land' + (f.hot ? ' hot' : '') + (f.hot && selIso.includes(f.id) ? ' sel' : '')} data-id={f.id} d={f.d} />)}
                  {map.arcs.map((a, i) => [
                    <path key={a.k} id={`arc-${a.k}`} className={'arc' + (a.k === selected ? ' sel' : '')} data-reg={a.k} d={a.d} />,
                    !map.reduce && <circle key={a.k + '-flow'} className="flow" r="2.2"><animateMotion dur={`${4 + (i % 4) * 0.6}s`} begin={`${(i * 0.37).toFixed(2)}s`} repeatCount="indefinite"><mpath href={`#arc-${a.k}`} /></animateMotion></circle>
                  ])}
                  {map.acads.map((p, i) => <circle key={i} className="acad" cx={p[0]} cy={p[1]} r="4" />)}
                  <g className="pin hub" transform={`translate(${map.hub})`}><circle className="core" r="7" /><text x="-12" y="-12" textAnchor="end">Amsterdam · FCG</text></g>
                  {map.pins.map(({ k, p }) => (
                    <g key={k} className={'pin' + (k === selected ? ' sel' : '')} data-reg={k} transform={`translate(${p})`} tabIndex={0} role="button" aria-label={L(REGIONS[k].name)}
                      onClick={() => select(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(k); } }}>
                      <circle className="halo" r="8" /><circle className="core" r="6" /><text x={left[k] ? -12 : 12} y="4" textAnchor={left[k] ? 'end' : 'start'}>{L(REGIONS[k].name)}</text></g>
                  ))}
                </svg>
              )}
              <div className="map-legend"><span><i style={{ background: '#fff', border: '2px solid #1463F3' }}></i><T k="h.leg1" en="Scouting region" /></span><span><i style={{ background: '#8FB3FF' }}></i><T k="h.leg2" en="FCG hub" /></span><span><i style={{ border: '1.5px solid #8FB3FF' }}></i><T k="h.leg3" en="Partner academy" /></span></div>
              {mapFail && <div className="map-fallback">{t('map.offline')}</div>}
            </div>
            <aside className="map-panel reveal" data-d="1" id="mapPanel" aria-live="polite">
              <p className="kicker">{`${t('map.region')} · ${t('map.since')} ${R.since}`}</p>
              <h3 className="display">{L(R.name)}</h3>
              <p className="place">{R.place}</p>
              <p>{L(R.note)}</p>
              <div className="map-facts"><div><b>{countFor(selected)}</b><span>{t('map.f1')}</span></div><div><b>{R.scouts}</b><span>{t('map.f2')}</span></div><div><b>{R.since}</b><span>{t('map.f3')}</span></div></div>
              <div><Link className="btn btn--light" href={`/talents?region=${selected}`}>{t('map.cta').replace('{r}', L(R.name))} <span className="arr">→</span></Link></div>
              <div className="map-list" role="group" aria-label={t('map.list')}>{regionKeys.map((k) => <button key={k} data-reg={k} aria-pressed={k === selected} onClick={() => select(k)}>{L(REGIONS[k].name)}</button>)}</div>
              <p className="mt-s"><Link className="linkarrow" href="/centres" style={{ color: '#fff' }}><T k="h.centres" en="Also in camps &amp; asylum centres in Europe" /> →</Link></p>
            </aside>
          </div>
        </div>
      </section>

      {/* 04 FEATURED */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§04</span><T k="h.s4k" en="In the portal" /></span>
            <T as="h2" className="h2" k="h.s4t" en={'Meet some of the players <span class="it blue">we believe in.</span>'} />
          </div>
          <div className="rail-head reveal">
            <T className="concept-note" k="h.fict" en="● Fictional concept profiles · no photos by design" />
            <div className="rail-ctrl"><button id="railPrev" aria-label="Previous" onClick={() => railRef.current!.scrollBy({ left: -step(), behavior: 'smooth' })}>←</button><button id="railNext" aria-label="Next" onClick={() => railRef.current!.scrollBy({ left: step(), behavior: 'smooth' })}>→</button></div>
          </div>
          <div className="rail reveal" id="rail" ref={railRef}>{railList.map((x) => <TalentCard key={x.id} t={x} />)}</div>
          <p className="mt-m reveal"><Link className="linkarrow" href="/talents"><T k="h.all" en="Open the full talent portal" /> →</Link></p>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="sec">
        <div className="wrap">
          <div className="numbers reveal">
            <div><b><span data-count={regionKeys.length}>0</span></b><T k="h.n1" en="Regions active" /></div>
            <div><b><span data-count={regionKeys.reduce((s, k) => s + REGIONS[k].scouts, 0)}>0</span></b><T k="h.n2" en="Trained local scouts" /></div>
            {['players_in_pathway', 'partner_academies'].filter((k) => METRICS[k]).map((k) => (
              <div key={k}><b><span data-count={METRICS[k].value}>0</span>{METRICS[k].suffix && <sup>{METRICS[k].suffix}</sup>}</b><span>{L(METRICS[k].label)}</span></div>
            ))}
          </div>
          <T as="p" className="footnote" k="h.nfoot" en="Concept figures for illustration purposes." />
          <div className="pull reveal">
            <T as="cite" k="h.qc" en="— Local scout, Juba" />
            <T as="blockquote" k="h.q" en="They don’t need pity. They need <em>someone with a camera</em> and a club that’s willing to watch." />
          </div>
        </div>
      </section>

      {/* 05 DOORS */}
      <section>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§05</span><T k="h.s5k" en="Get involved" /></span>
            <T as="h2" className="h2" k="h.s5t" en="Choose your way in." />
          </div>
          <div className="doors reveal">
            <Link className="door" href="/clubs"><span className="n">A</span><div><T as="h3" k="h.d1t" en="For clubs &amp; scouts" /><T as="p" k="h.d1p" en="Access verified talent from markets nobody else covers — ethically and transparently." /></div><span className="go">→</span></Link>
            <Link className="door" href="/support"><span className="n">B</span><div><T as="h3" k="h.d2t" en="Support a player" /><T as="p" k="h.d2p" en="Fund training, boots, documents and trial trips. See exactly what your money does." /></div><span className="go">→</span></Link>
            <Link className="door" href="/about#nominate"><span className="n">C</span><div><T as="h3" k="h.d3t" en="Nominate a talent" /><T as="p" k="h.d3p" en="Coach, teacher or NGO worker? Tell us about a player we should see." /></div><span className="go">→</span></Link>
            <Link className="door" href="/about"><span className="n">D</span><div><T as="h3" k="h.d4t" en="Read our mission" /><T as="p" k="h.d4p" en="Why we started, how we protect players, and where we are going next." /></div><span className="go">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

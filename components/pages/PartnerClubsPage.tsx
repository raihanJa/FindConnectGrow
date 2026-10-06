'use client';
/* Partner clubs: the European clubs where verified talents can go for a trial, a stage or a contract.
   On purpose mid-table, relegation-battling, semi-pro and amateur clubs — minutes over badges.
   Safeguarding: only the number of FCG players a club has hosted is public, never which player. */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Club } from '@/lib/data';
import { reducedMotion } from '@/lib/fcg';
import { DocTitle, useData, useLang } from '../providers';
import { T, useReveal } from '../ui';

type Squad = 'all' | 'm' | 'f';
type MapData = { W: number; H: number; grat: string; lands: { id: string; d: string }[]; hub: number[]; pins: { k: string; p: number[] }[] };

const pro = (c: Club) => c.level === 'top' || c.level === 'second';

export default function PartnerClubsPage() {
  const { lang, t, L } = useLang();
  const { CLUBS, CLUB_LEVELS, TIERS, HUB } = useData();
  const [squad, setSquad] = useState<Squad>('all');
  const [levels, setLevels] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState(() => CLUBS[0]?.key ?? '');
  const [map, setMap] = useState<MapData | null>(null);
  const [mapFail, setMapFail] = useState(false);
  const mapRef = useRef<HTMLElement>(null);
  useReveal([squad, levels]);

  const country = useMemo(() => {
    const dn = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([lang], { type: 'region' }) : null;
    return (cc: string) => { try { return dn?.of(cc) ?? cc; } catch { return cc; } };
  }, [lang]);
  const tier = (c: Club) => TIERS.find((x) => x.key === c.tier)?.name ?? t('pc.community');

  const bySquad = (c: Club) => squad === 'all' || c.squads.includes(squad);
  const list = CLUBS.filter((c) => bySquad(c) && (!levels.size || levels.has(c.level)));
  const toggleLevel = (k: string) => setLevels((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ geoNaturalEarth1, geoPath, geoGraticule10 }, topojson, atlas] = await Promise.all([
          import('d3-geo'), import('topojson-client'), import('world-atlas/countries-110m.json')
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const world = ((atlas as any).default || atlas) as any;
        const W = 960, H = 720;
        const proj = geoNaturalEarth1().fitExtent([[20, 20], [W - 20, H - 20]], { type: 'MultiPoint', coordinates: [[-10, 39], [19, 61]] });
        const path = geoPath(proj);
        const P = (ll: number[]) => proj(ll as [number, number])!.map((v) => +v.toFixed(1));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feats = (topojson.feature(world, world.objects.countries) as any).features as { id: unknown }[];
        if (alive) setMap({
          W, H, grat: path(geoGraticule10()) || '', hub: P(HUB.ll),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lands: feats.map((f) => ({ id: String(f.id), d: path(f as any) || '' })),
          pins: CLUBS.map((c) => ({ k: c.key, p: P(c.ll) }))
        });
      } catch { if (alive) setMapFail(true); }
    })();
    return () => { alive = false; };
  }, []);

  const S = CLUBS.find((c) => c.key === selected);
  const pick = (k: string, scroll = false) => {
    setSelected(k);
    if (scroll) mapRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };
  const proN = CLUBS.filter(pro).length;
  const placed = CLUBS.reduce((s, c) => s + c.placements, 0);
  const offers = (c: Club) => c.offers.length > 0 && <ul className="club-offers">{c.offers.map((o) => <li key={o}>{t('pc.o.' + o)}</li>)}</ul>;

  return (
    <main id="main"><DocTitle k="title.partners" en="Partner clubs — FCG" />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="nav.partners" en="Partner clubs" /></div>
          <T as="h1" className="display" k="pc.h1" en={'No giants. <span class="it blue">Just minutes.</span>'} />
          <div className="phead-grid">
            <T as="p" className="lead" k="pc.lead" en="These are the clubs where FCG talents can go for a trial, a stage or — one day — a contract. On purpose no top clubs: mid-table and relegation-battling sides, semi-pros and amateur clubs that actually play young players and look after them." />
            <T as="p" className="concept-note" k="pc.note" en="● Fictional concept data · club names are invented · only the number of players a club has hosted is public" />
          </div>
        </div>
      </header>

      <section className="sec" style={{ paddingTop: 'clamp(40px,6vw,72px)' }}>
        <div className="wrap">
          <div className="numbers reveal">
            <div><b><span data-count={CLUBS.length}>0</span></b><T k="pc.n1" en="Partner clubs" /></div>
            <div><b><span data-count={proN}>0</span></b><T k="pc.n2" en="Professional clubs" /></div>
            <div><b><span data-count={CLUBS.length - proN}>0</span></b><T k="pc.n3" en="Semi-pro &amp; amateur clubs" /></div>
            <div><b><span data-count={placed}>0</span></b><T k="pc.n5" en="FCG players hosted so far" /></div>
          </div>
        </div>
      </section>

      <section className="mapband ce-band" id="map" ref={mapRef}>
        <div className="wrap">
          <div className="sec-head two reveal">
            <span className="kicker"><span className="num">§01</span><T k="pc.s1k" en="The network" /></span>
            <T as="h2" className="h2" k="pc.s1t" en={'From the hub in Amsterdam <span class="it" style="color:#8FB3FF">to a pitch near you.</span>'} />
            <T as="p" className="lead" k="pc.s1l" en="Every dot is a partner club. Solid dots are professional clubs; open dots are semi-pro and amateur clubs — often a player’s very first club in Europe." />
          </div>
          <div className="map-grid">
            <div className="map-wrap reveal">
              {map && (
                <svg viewBox={`0 0 ${map.W} ${map.H}`} role="img" aria-label={t('pc.aria')}>
                  <path className="grat" d={map.grat} />
                  {map.lands.map((f, i) => <path key={i} className={'land' + (S && f.id === String(ISO_NUM[S.country] ?? -1).padStart(3, '0') ? ' hot sel' : '')} d={f.d} />)}
                  <g className="pin hub" transform={`translate(${map.hub})`}><circle className="core" r="6" /></g>
                  {map.pins.map(({ k, p }) => {
                    const c = CLUBS.find((x) => x.key === k)!, sel = k === selected;
                    return (
                      <g key={k} className={'pin' + (sel ? ' sel' : '') + (pro(c) ? '' : ' past')} transform={`translate(${p})`} tabIndex={0} role="button" aria-label={c.name}
                        onClick={() => pick(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(k); } }}>
                        <circle className="core" r={sel ? 6.5 : 5} />
                        {sel && <text x={p[0] > map.W * 0.7 ? -12 : 12} y="4" textAnchor={p[0] > map.W * 0.7 ? 'end' : 'start'}>{c.name}</text>}
                        <title>{c.name}</title>
                      </g>
                    );
                  })}
                </svg>
              )}
              <div className="map-legend"><span><i style={{ background: '#fff', border: '2px solid #1463F3' }}></i><T k="pc.leg1" en="Professional" /></span><span><i style={{ border: '1.5px solid #8C9AB8' }}></i><T k="pc.leg2" en="Semi-pro &amp; amateur" /></span><span><i style={{ background: '#8FB3FF' }}></i><T k="h.leg2" en="FCG hub" /></span></div>
              {mapFail && <div className="map-fallback">{t('map.offline')}</div>}
            </div>
            {S && (
              <aside className="map-panel reveal" data-d="1" aria-live="polite">
                <p className="kicker">{`${L(CLUB_LEVELS[S.level])} · ${S.league}`}</p>
                <h3 className="display">{S.name}</h3>
                <p className="place">{`${S.city}, ${country(S.country)}`}</p>
                <p>{L(S.note)}</p>
                <div className="map-facts"><div><b>{S.placements}</b><span>{t('pc.f1')}</span></div><div><b>{t('pc.sq.' + S.squads)}</b><span>{t('pc.f2')}</span></div><div><b>{S.since}</b><span>{t('pc.f3')}</span></div></div>
                <div className="map-list" role="group" aria-label={t('pc.list')}>{CLUBS.map((c) => <button key={c.key} aria-pressed={c.key === selected} onClick={() => pick(c.key)}>{c.name}</button>)}</div>
              </aside>
            )}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§02</span><T k="pc.s2k" en="All partner clubs" /></span>
            <T as="h2" className="h2" k="pc.s2t" en={'Eredivisie to Vierde Klasse — <span class="it blue">every step counts.</span>'} />
          </div>
          <div className="ce-tools reveal">
            <div className="seg" role="group" aria-label={t('pc.squad')}>
              {(['all', 'm', 'f'] as Squad[]).map((v) => <button key={v} aria-pressed={squad === v} onClick={() => setSquad(v)}>{t('pc.show.' + v)}</button>)}
            </div>
            <div className="chips" role="group" aria-label={t('pc.level')}>
              {Object.keys(CLUB_LEVELS).filter((k) => CLUBS.some((c) => c.level === k)).map((k) => (
                <button key={k} className="chip" aria-pressed={levels.has(k)} onClick={() => toggleLevel(k)}>{L(CLUB_LEVELS[k])}<span className="c">{CLUBS.filter((c) => c.level === k && bySquad(c)).length}</span></button>
              ))}
            </div>
          </div>
          {list.length ? (
            <div className="cgrid">
              {list.map((c) => (
                <article key={c.key} className={'ccard' + (pro(c) ? '' : ' past')} id={c.key}>
                  <div className="ccard-top"><span className={'pill ' + (c.tier ? 'st-3' : 'st-1')}><i></i>{tier(c)}</span><span className="kind">{L(CLUB_LEVELS[c.level])}</span></div>
                  <h3 className="h3">{c.name}</h3>
                  <p className="where">{`${c.league} · ${c.city}, ${country(c.country)}`}</p>
                  <p className="note">{L(c.note)}</p>
                  {offers(c)}
                  <dl className="ccard-facts">
                    <div><dt>{t('pc.f2')}</dt><dd>{t('pc.sq.' + c.squads)}</dd></div>
                    <div><dt>{t('pc.f1')}</dt><dd>{c.placements}</dd></div>
                    <div><dt>{t('pc.f3')}</dt><dd>{c.since}</dd></div>
                  </dl>
                  <button className="linkarrow ccard-map" onClick={() => pick(c.key, true)}>{t('ce.onmap')} ↑</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty"><p className="display">{t('p.empty.t')}</p><button className="btn btn--ghost" onClick={() => { setSquad('all'); setLevels(new Set()); }}>{t('p.reset')}</button></div>
          )}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§03</span><T k="pc.s3k" en="Why these clubs" /></span>
            <T as="h2" className="h2" k="pc.s3t" en={'Minutes over badges. <span class="it blue">People over prestige.</span>'} />
          </div>
          <div className="values reveal">
            <div className="value"><span className="vn">1</span><div><T as="h3" className="h3" k="pc.v1t" en="Playing time first" /><T as="p" k="pc.v1p" en="A 17-year-old on the bench of a giant learns little. At a mid-table or relegation-battling club, young players get real minutes — and real feedback." /></div></div>
            <div className="value"><span className="vn">2</span><div><T as="h3" className="h3" k="pc.v2t" en="A ladder, not a lottery" /><T as="p" k="pc.v2p" en="Amateur clubs near the asylum centres are often a player’s first team in Europe. From there the step to semi-pro and professional football is smaller, and nobody has to jump it alone." /></div></div>
            <div className="value"><span className="vn">3</span><div><T as="h3" className="h3" k="pc.v3t" en="One charter for every club" /><T as="p" k="pc.v3p" en="Every partner, from Eredivisie to Vierde Klasse, signs our safeguarding charter: a welfare contact, school or language lessons, and never a fee from a family." /></div></div>
            <div className="value"><span className="vn">4</span><div><T as="h3" className="h3" k="pc.v4t" en="Rules before contracts" /><T as="p" k="pc.v4p" en="Under-18s only move within the FIFA RSTP Article 19 exceptions. Stages are guided by FCG, and a solidarity share of any future transfer goes back to the player’s home community." /></div></div>
          </div>
          <div className="doors reveal mt-m">
            <Link className="door" href="/clubs#models"><span className="n">A</span><div><T as="h3" k="pc.d1t" en="Should your club be on this map?" /><T as="p" k="pc.d1p" en="Professional, semi-pro or amateur: see how a partnership works — for amateur clubs it is free." /></div><span className="go">→</span></Link>
            <Link className="door" href="/about#safeguarding"><span className="n">B</span><div><T as="h3" k="pc.d2t" en="Read our safeguarding charter" /><T as="p" k="pc.d2p" en="What every partner club commits to before a single FCG player visits." /></div><span className="go">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* world-atlas uses ISO 3166-1 numeric ids (3 digits, zero-padded) for the highlighted country */
const ISO_NUM: Record<string, number> = { NL: 528, BE: 56, DE: 276, FR: 250, GB: 826, SE: 752, DK: 208, AT: 40, IT: 380, ES: 724, PT: 620, GR: 300, PL: 616, CH: 756, NO: 578, IE: 372 };

'use client';
/* Centres page: asylum seekers' centres, camps, school leagues and programmes where FCG scouts or has scouted.
   Safeguarding: city level only, and only a count of talents per centre — never which talent came from where. */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Centre } from '@/lib/data';
import { reducedMotion } from '@/lib/fcg';
import { DocTitle, useData, useLang } from '../providers';
import { T, useReveal } from '../ui';

type Show = 'all' | 'now' | 'past';
type MapData = { W: number; H: number; grat: string; lands: { id: string; d: string }[]; hub: number[]; pins: { k: string; p: number[] }[] };

const active = (c: Centre) => c.until == null;

export default function CentresPage() {
  const { lang, t, L } = useLang();
  const { CENTRES, CENTRE_KINDS, REGIONS, HUB } = useData();
  const [show, setShow] = useState<Show>('all');
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState(() => CENTRES[0]?.key ?? '');
  const [map, setMap] = useState<MapData | null>(null);
  const [mapFail, setMapFail] = useState(false);
  const mapRef = useRef<HTMLElement>(null);
  useReveal([show, kinds]);

  const country = useMemo(() => {
    const dn = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([lang], { type: 'region' }) : null;
    return (cc: string) => { try { return dn?.of(cc) ?? cc; } catch { return cc; } };
  }, [lang]);
  const period = (c: Centre) => (active(c) ? `${t('ce.since')} ${c.since}` : c.since === c.until ? String(c.since) : `${c.since}–${c.until}`);

  const byShow = (c: Centre) => show === 'all' || (show === 'now') === active(c);
  const list = CENTRES.filter((c) => byShow(c) && (!kinds.size || kinds.has(c.kind)))
    .sort((a, b) => Number(active(b)) - Number(active(a)));
  const toggleKind = (k: string) => setKinds((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

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
        const proj = geoNaturalEarth1().fitExtent([[20, 20], [W - 20, H - 20]], { type: 'MultiPoint', coordinates: [[-10, -4], [48, 57]] });
        const path = geoPath(proj);
        const P = (ll: number[]) => proj(ll as [number, number])!.map((v) => +v.toFixed(1));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feats = (topojson.feature(world, world.objects.countries) as any).features as { id: unknown }[];
        if (alive) setMap({
          W, H, grat: path(geoGraticule10()) || '', hub: P(HUB.ll),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lands: feats.map((f) => ({ id: String(f.id), d: path(f as any) || '' })),
          pins: CENTRES.map((c) => ({ k: c.key, p: P(c.ll) }))
        });
      } catch { if (alive) setMapFail(true); }
    })();
    return () => { alive = false; };
  }, []);

  const S = CENTRES.find((c) => c.key === selected);
  const pick = (k: string, scroll = false) => {
    setSelected(k);
    if (scroll) mapRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };
  const nowN = CENTRES.filter(active).length;
  const countries = new Set(CENTRES.map((c) => c.country)).size;
  const azcN = CENTRES.filter((c) => c.kind === 'asylum').length;
  const talentsN = CENTRES.reduce((s, c) => s + c.talents, 0);

  return (
    <main id="main"><DocTitle k="title.centres" en="Centres — FCG" />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="nav.centres" en="Centres" /></div>
          <T as="h1" className="display" k="ce.h1" en={'From camp pitches <span class="it blue">to asylum centres.</span>'} />
          <div className="phead-grid">
            <T as="p" className="lead" k="ce.lead" en="Talent doesn’t stay in the region it fled. Besides the regions of origin, FCG scouts in refugee camps, school leagues and asylum seekers’ centres across Europe — with the same eyes, the same verification and the same fair chance." />
            <T as="p" className="concept-note" k="ce.note" en="● Fictional concept data · locations at city level only · no player is linked to a centre in public" />
          </div>
        </div>
      </header>

      <section className="sec" style={{ paddingTop: 'clamp(40px,6vw,72px)' }}>
        <div className="wrap">
          <div className="numbers reveal">
            <div><b><span data-count={nowN}>0</span></b><T k="ce.n1" en="Centres active now" /></div>
            <div><b><span data-count={azcN}>0</span></b><T k="ce.n2" en="Asylum centres in Europe" /></div>
            <div><b><span data-count={countries}>0</span></b><T k="ce.n3" en="Countries" /></div>
            <div><b><span data-count={talentsN}>0</span></b><T k="ce.n4" en="Talents in the portal scouted at a centre" /></div>
          </div>
        </div>
      </section>

      <section className="mapband ce-band" id="map" ref={mapRef}>
        <div className="wrap">
          <div className="sec-head two reveal">
            <span className="kicker"><span className="num">§01</span><T k="ce.s1k" en="The map" /></span>
            <T as="h2" className="h2" k="ce.s1t" en={'Where we scout <span class="it" style="color:#8FB3FF">— and where we have been.</span>'} />
            <T as="p" className="lead" k="ce.s1l" en="Every dot is a centre, camp or programme. Solid dots are active now; open dots are places we have scouted before." />
          </div>
          <div className="map-grid">
            <div className="map-wrap reveal">
              {map && (
                <svg viewBox={`0 0 ${map.W} ${map.H}`} role="img" aria-label={t('ce.aria')}>
                  <path className="grat" d={map.grat} />
                  {map.lands.map((f, i) => <path key={i} className={'land' + (S && f.id === String(isoNum(S.country)).padStart(3, '0') ? ' hot sel' : '')} d={f.d} />)}
                  <g className="pin hub" transform={`translate(${map.hub})`}><circle className="core" r="6" /></g>
                  {map.pins.map(({ k, p }) => {
                    const c = CENTRES.find((x) => x.key === k)!, sel = k === selected;
                    return (
                      <g key={k} className={'pin' + (sel ? ' sel' : '') + (active(c) ? '' : ' past')} transform={`translate(${p})`} tabIndex={0} role="button" aria-label={L(c.name)}
                        onClick={() => pick(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(k); } }}>
                        {active(c) && <circle className="halo" r="7" />}<circle className="core" r={sel ? 6.5 : 5} />
                        {sel && <text x={p[0] > map.W * 0.7 ? -12 : 12} y="4" textAnchor={p[0] > map.W * 0.7 ? 'end' : 'start'}>{c.city}</text>}
                        <title>{L(c.name)}</title>
                      </g>
                    );
                  })}
                </svg>
              )}
              <div className="map-legend"><span><i style={{ background: '#fff', border: '2px solid #1463F3' }}></i><T k="ce.leg1" en="Active now" /></span><span><i style={{ border: '1.5px solid #8C9AB8' }}></i><T k="ce.leg2" en="Scouted before" /></span><span><i style={{ background: '#8FB3FF' }}></i><T k="h.leg2" en="FCG hub" /></span></div>
              {mapFail && <div className="map-fallback">{t('map.offline')}</div>}
            </div>
            {S && (
              <aside className="map-panel reveal" data-d="1" aria-live="polite">
                <p className="kicker">{`${L(CENTRE_KINDS[S.kind])} · ${period(S)}`}</p>
                <h3 className="display">{L(S.name)}</h3>
                <p className="place">{`${S.city}, ${country(S.country)}`}</p>
                <p>{L(S.note)}</p>
                <div className="map-facts"><div><b>{S.talents}</b><span>{t('map.f1')}</span></div><div><b>{S.scouts}</b><span>{t('map.f2')}</span></div><div><b>{S.since}</b><span>{t('map.f3')}</span></div></div>
                {S.region && REGIONS[S.region] && <div><Link className="btn btn--light" href={`/talents?region=${S.region}`}>{t('map.cta').replace('{r}', L(REGIONS[S.region].name))} <span className="arr">→</span></Link></div>}
                <div className="map-list" role="group" aria-label={t('ce.list')}>{CENTRES.map((c) => <button key={c.key} aria-pressed={c.key === selected} onClick={() => pick(c.key)}>{c.city}</button>)}</div>
              </aside>
            )}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§02</span><T k="ce.s2k" en="All centres" /></span>
            <T as="h2" className="h2" k="ce.s2t" en={'Camps, schools, <span class="it blue">asylum centres.</span>'} />
          </div>
          <div className="ce-tools reveal">
            <div className="seg" role="group" aria-label={t('ce.show')}>
              {(['all', 'now', 'past'] as Show[]).map((v) => <button key={v} aria-pressed={show === v} onClick={() => setShow(v)}>{t('ce.show.' + v)}</button>)}
            </div>
            <div className="chips" role="group" aria-label={t('ce.kind')}>
              {Object.keys(CENTRE_KINDS).filter((k) => CENTRES.some((c) => c.kind === k)).map((k) => (
                <button key={k} className="chip" aria-pressed={kinds.has(k)} onClick={() => toggleKind(k)}>{L(CENTRE_KINDS[k])}<span className="c">{CENTRES.filter((c) => c.kind === k && byShow(c)).length}</span></button>
              ))}
            </div>
          </div>
          {list.length ? (
            <div className="cgrid">
              {list.map((c) => (
                <article key={c.key} className={'ccard' + (active(c) ? '' : ' past')} id={c.key}>
                  <div className="ccard-top"><span className={'pill ' + (active(c) ? 'st-2' : 'st-0')}><i></i>{active(c) ? t('ce.now') : t('ce.past')}</span><span className="kind">{L(CENTRE_KINDS[c.kind])}</span></div>
                  <h3 className="h3">{L(c.name)}</h3>
                  <p className="where">{`${c.city}, ${country(c.country)} · ${period(c)}`}</p>
                  <p className="note">{L(c.note)}</p>
                  <dl className="ccard-facts">
                    <div><dt>{t('map.f2')}</dt><dd>{c.scouts}</dd></div>
                    <div><dt>{t('map.f1')}</dt><dd>{c.talents}</dd></div>
                    {c.region && REGIONS[c.region] && <div><dt>{t('p.reg')}</dt><dd><Link href={`/talents?region=${c.region}`}>{L(REGIONS[c.region].name)}</Link></dd></div>}
                  </dl>
                  <button className="linkarrow ccard-map" onClick={() => pick(c.key, true)}>{t('ce.onmap')} ↑</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty"><p className="display">{t('p.empty.t')}</p><button className="btn btn--ghost" onClick={() => { setShow('all'); setKinds(new Set()); }}>{t('p.reset')}</button></div>
          )}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§03</span><T k="ce.s3k" en="How we work in a centre" /></span>
            <T as="h2" className="h2" k="ce.s3t" en={'A pitch first. <span class="it blue">A profile much later.</span>'} />
          </div>
          <div className="values reveal">
            <div className="value"><span className="vn">1</span><div><T as="h3" className="h3" k="ce.v1t" en="With the centre, never around it" /><T as="p" k="ce.v1p" en="We only work where the centre’s management, the camp authority or the school agrees — and always alongside their own staff." /></div></div>
            <div className="value"><span className="vn">2</span><div><T as="h3" className="h3" k="ce.v2t" en="Open to everyone" /><T as="p" k="ce.v2p" en="Trainings and tournaments are open to every resident, not just the most talented. Football comes before scouting." /></div></div>
            <div className="value"><span className="vn">3</span><div><T as="h3" className="h3" k="ce.v3t" en="Where a player lives stays private" /><T as="p" k="ce.v3p" en="We show centres at city level and only count the talents scouted there. Which player came from which centre is known only to FCG staff." /></div></div>
            <div className="value"><span className="vn">4</span><div><T as="h3" className="h3" k="ce.v4t" en="Status never decides" /><T as="p" k="ce.v4p" en="Residence permits and asylum procedures are never a reason to drop a player. Our lawyers make sure every next step is legal and safe." /></div></div>
          </div>
          <div className="doors reveal mt-m">
            <Link className="door" href="/about#nominate"><span className="n">A</span><div><T as="h3" k="ce.d1t" en="Working at a centre?" /><T as="p" k="ce.d1p" en="Coach, teacher or social worker? Tell us about a player we should see — or invite us for an open training." /></div><span className="go">→</span></Link>
            <Link className="door" href="/about#safeguarding"><span className="n">B</span><div><T as="h3" k="ce.d2t" en="Read our safeguarding charter" /><T as="p" k="ce.d2p" en="How we protect players — many of them minors — at every step of the pathway." /></div><span className="go">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* world-atlas uses ISO 3166-1 numeric ids (3 digits, zero-padded) for the highlighted country */
const ISO_NUM: Record<string, number> = { NL: 528, BE: 56, DE: 276, FR: 250, GB: 826, SE: 752, DK: 208, AT: 40, IT: 380, ES: 724, GR: 300, PL: 616, UA: 804, KE: 404, UG: 800, ET: 231, JO: 400, LB: 422, TR: 792, SS: 728, SD: 729, CD: 180, SO: 706, BF: 854, ML: 466, YE: 887, SY: 760, AF: 4, IQ: 368, CH: 756, NO: 578 };
const isoNum = (cc: string) => ISO_NUM[cc] ?? -1;

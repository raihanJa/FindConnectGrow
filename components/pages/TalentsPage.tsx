'use client';
/* Talent portal: filters, sorting, shortlist, compare */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ATTR, GROUPS, POS, REGIONS, STATUS, TALENTS, byId, type GroupKey, type Talent } from '@/lib/data';
import { store, DocTitle, useLang, useModal, useShortlist, useToast } from '../providers';
import { DossierForm, Radar, T, TalentCard } from '../ui';

const COLORS = ['#1463F3', '#0C1C36', '#7FA6F5'];
type Initial = { q: string; pos: string; region: string; squad: string; status: string };

function CompareModal({ ids }: { ids: string[] }) {
  const { t, L, foot } = useLang();
  const modal = useModal(), sl = useShortlist(), toast = useToast();
  const ts = ids.map((id) => byId(id)!);
  const extra: [string, (x: Talent) => string | number][] = [
    [t('cmp.ovr'), (x) => x.ovr], [t('p.age'), (x) => x.age], [t('cmp.pos'), (x) => x.pos], [t('p.foot'), (x) => foot(x.foot)],
    [t('cmp.h'), (x) => x.h + ' cm'], [t('p.reg'), (x) => L(REGIONS[x.region].name)], [t('p.status'), (x) => L(STATUS[x.status])]
  ];
  return (
    <>
      <p className="kicker"><b>●</b> {t('cmp.kicker')}</p><h2 className="h2">{t('cmp.title')}</h2>
      <div className="cmp-grid mt-s"><div className="radar-box"><Radar sets={ts.map((x, i) => ({ values: x.a, color: COLORS[i], dash: i === 2, fill: i === 0 ? 0.16 : 0.06 }))} size={340} /></div>
        <div style={{ overflowX: 'auto' }}><table className="cmp-table"><thead><tr><th></th>{ts.map((x, i) => <th key={x.id}><span className="cmp-key" style={{ background: COLORS[i] }}></span><Link href={`/talent/${x.id}`} style={{ textDecoration: 'none' }} onClick={modal.close}>{x.name}</Link></th>)}</tr></thead>
          <tbody>
            {extra.map(([l, fn]) => <tr key={l}><th>{l}</th>{ts.map((x) => <td key={x.id}>{fn(x)}</td>)}</tr>)}
            {ATTR.map((a, i) => {
              const best = Math.max(...ts.map((x) => x.a[i]));
              return <tr key={i}><th>{L(a)}</th>{ts.map((x) => <td key={x.id} className={x.a[i] === best ? 'best' : ''}>{x.a[i]}</td>)}</tr>;
            })}
          </tbody></table></div></div>
      <div className="hero-ctas"><button className="btn btn--blue" id="cmpReq" onClick={() => modal.open(<DossierForm ids={ids} />)}>{t('cmp.req')} <span className="arr">→</span></button>
        <button className="btn btn--ghost" id="cmpSl" onClick={() => { ids.forEach((id) => { if (!sl.has(id)) sl.toggle(id); }); toast(t('cmp.slok')); }}>{t('cmp.sl')}</button></div>
    </>
  );
}

export default function TalentsPage({ initial }: { initial: Initial }) {
  const { lang, t, L, s, foot } = useLang();
  const modal = useModal(), toast = useToast();

  const [qInput, setQInput] = useState(initial.q);
  const [q, setQ] = useState(initial.q);
  const [groups, setGroups] = useState(() => new Set(initial.pos.split(',').filter((g) => g in GROUPS) as GroupKey[]));
  const [min, setMin] = useState(14), [max, setMax] = useState(21);
  const [region, setRegion] = useState(REGIONS[initial.region] ? initial.region : 'all');
  const [squad, setSquad] = useState(['m', 'f'].includes(initial.squad) ? initial.squad : 'all');
  const [foot_, setFoot] = useState('any');
  const [status, setStatus] = useState(() => new Set(initial.status.split(',').filter((x) => x !== '' && STATUS[+x]).map(Number)));
  const [sort, setSort] = useState('ovr');
  const [view, setView] = useState('grid');
  const [cmp, setCmp] = useState<string[]>([]);
  const [fOpen, setFOpen] = useState(false);
  const qT = useRef(0);

  useEffect(() => { setView(store.get('view', 'grid')); }, []);

  const match = (x: Talent, skip?: 'groups' | 'status') => {
    if (q) { const ql = q.toLowerCase(); if (!(x.name.toLowerCase().includes(ql) || x.city.toLowerCase().includes(ql) || L(REGIONS[x.region].name).toLowerCase().includes(ql) || L(POS[x.pos]).toLowerCase().includes(ql))) return false; }
    if (skip !== 'groups' && groups.size && !groups.has(x.group)) return false;
    if (x.age < min || x.age > max) return false;
    if (region !== 'all' && x.region !== region) return false;
    if (squad !== 'all' && x.g !== squad) return false;
    if (foot_ !== 'any' && x.foot !== foot_) return false;
    if (skip !== 'status' && status.size && !status.has(x.status)) return false;
    return true;
  };

  /* URL mirrors the shareable filters */
  useEffect(() => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (groups.size) u.set('pos', [...groups].join(','));
    if (region !== 'all') u.set('region', region);
    if (squad !== 'all') u.set('squad', squad);
    if (status.size) u.set('status', [...status].join(','));
    const str = u.toString();
    history.replaceState(null, '', location.pathname + (str ? '?' + str : ''));
  }, [q, groups, region, squad, status]);

  useEffect(() => {
    if (region !== 'all' || groups.size || status.size) { const id = setTimeout(() => document.querySelector('.results-bar')!.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400); return () => clearTimeout(id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = TALENTS.filter((x) => match(x)).sort({
    ovr: (a: Talent, b: Talent) => b.ovr - a.ovr, new: (a: Talent, b: Talent) => b.joined.localeCompare(a.joined),
    young: (a: Talent, b: Talent) => a.age - b.age || b.ovr - a.ovr, name: (a: Talent, b: Talent) => a.name.localeCompare(b.name)
  }[sort]!);

  /* every re-render of the results replays the card entrance, as before */
  const renderKey = [q, [...groups], min, max, region, squad, foot_, [...status], sort, view, lang].join('|');

  const reset = () => { setQ(''); setQInput(''); setGroups(new Set()); setStatus(new Set()); setMin(14); setMax(21); setRegion('all'); setSquad('all'); setFoot('any'); };
  const toggleIn = <V,>(set: Set<V>, v: V) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); return n; };
  const onAge = (which: 'min' | 'max', val: number) => {
    let a = which === 'min' ? val : min, b = which === 'max' ? val : max;
    if (a > b) { if (which === 'min') a = b; else b = a; }
    setMin(a); setMax(b);
  };

  const chips: [string, string | number, string][] = [];
  if (q) chips.push(['q', '', `“${q}”`]);
  groups.forEach((g) => chips.push(['g', g, L(GROUPS[g])]));
  if (min > 14 || max < 21) chips.push(['age', '', `${t('p.age')} ${min}–${max}`]);
  if (region !== 'all') chips.push(['reg', '', L(REGIONS[region].name)]);
  if (squad !== 'all') chips.push(['squad', '', t(squad === 'm' ? 'p.men' : 'p.women')]);
  if (foot_ !== 'any') chips.push(['foot', '', foot(foot_)]);
  status.forEach((st) => chips.push(['st', st, L(STATUS[st])]));
  const removeChip = (k: string, v: string | number) => {
    if (k === 'q') { setQ(''); setQInput(''); }
    if (k === 'g') setGroups((g) => { const n = new Set(g); n.delete(v as GroupKey); return n; });
    if (k === 'age') { setMin(14); setMax(21); }
    if (k === 'reg') setRegion('all');
    if (k === 'squad') setSquad('all');
    if (k === 'foot') setFoot('any');
    if (k === 'st') setStatus((st) => { const n = new Set(st); n.delete(+v); return n; });
  };

  const onCmp = (id: string, checked: boolean) => {
    if (checked) {
      if (cmp.length >= 3) { toast(t('cmp.max')); return; }
      setCmp([...cmp, id]);
    } else setCmp(cmp.filter((x) => x !== id));
  };
  const lo = ((min - 14) / 7) * 100, hi = ((max - 14) / 7) * 100;

  return (
    <>
      <main id="main"><DocTitle k={'title.talents'} en={'Talent Portal — FCG'} />
        <header className="phead">
          <div className="wrap">
            <div className="crumbs"><Link href="/">FCG</Link> / <T k="nav.portal" en="Talent portal" /></div>
            <T as="h1" className="display" k="p.h1" en={'The Portal<span class="blue">.</span>'} />
            <div className="phead-grid">
              <T as="p" className="lead" k="p.lead" en="Every player here has been scouted on the ground and reviewed by two analysts. Filter, shortlist and compare — then request a full dossier." />
              <div>
                <T className="concept-note" k="p.note" en="● Fictional profiles · names shortened &amp; no photos for safeguarding" />
              </div>
            </div>
          </div>
        </header>

        <div className="wrap">
          <div className="portal">
            <aside className="filters" aria-label="Filters">
              <button className="btn btn--ghost btn--sm filters-toggle" id="fToggle" aria-expanded={fOpen} onClick={() => setFOpen(!fOpen)}><T k="p.ftoggle" en="Filters" /> <span id="fBadge">{chips.length ? `(${chips.length})` : ''}</span></button>
              <div className={'filters-body' + (fOpen ? ' open' : '')} id="fBody">
                <div className="fgroup">
                  <T as="label" htmlFor="fq" k="p.search" en="Search" />
                  <div className="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                    <input id="fq" type="search" placeholder={s('p.searchph', 'Name, city…')} autoComplete="off" value={qInput}
                      onChange={(e) => { const v = e.target.value; setQInput(v); clearTimeout(qT.current); qT.current = window.setTimeout(() => setQ(v.trim()), 160); }} /></div>
                </div>
                <div className="fgroup">
                  <T className="flabel" as="div" k="p.pos" en="Position" />
                  <div className="chips" id="fPos">
                    {(Object.keys(GROUPS) as GroupKey[]).map((g) => (
                      <button key={g} className="chip" data-g={g} aria-pressed={groups.has(g)} onClick={() => setGroups(toggleIn(groups, g))}>{L(GROUPS[g])}<span className="c">{TALENTS.filter((x) => x.group === g && match(x, 'groups')).length}</span></button>
                    ))}
                  </div>
                </div>
                <div className="fgroup">
                  <div className="flabel"><T k="p.age" en="Age" /><span className="mono" id="ageOut">{`${min}–${max}`}</span></div>
                  <div className="dual"><div className="track"></div><div className="fill" id="ageFill" style={{ left: lo + '%', width: hi - lo + '%' }}></div>
                    <input type="range" id="ageMin" min="14" max="21" value={min} aria-label="Min age" onChange={(e) => onAge('min', +e.target.value)} />
                    <input type="range" id="ageMax" min="14" max="21" value={max} aria-label="Max age" onChange={(e) => onAge('max', +e.target.value)} /></div>
                </div>
                <div className="fgroup">
                  <T as="label" htmlFor="fReg" k="p.reg" en="Region" />
                  <select className="sel" id="fReg" value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="all">{t('p.allreg')}</option>
                    {Object.keys(REGIONS).map((k) => <option key={k} value={k}>{`${L(REGIONS[k].name)} (${TALENTS.filter((x) => x.region === k).length})`}</option>)}
                  </select>
                </div>
                <div className="fgroup">
                  <T className="flabel" as="div" k="p.squad" en="Squad" />
                  <div className="seg" id="fSquad">
                    {([['all', 'p.all', 'All'], ['m', 'p.men', 'Men'], ['f', 'p.women', 'Women']] as const).map(([v, k, en]) => <T key={v} as="button" data-v={v} k={k} en={en} aria-pressed={squad === v} onClick={() => setSquad(v)} />)}
                  </div>
                </div>
                <div className="fgroup">
                  <T className="flabel" as="div" k="p.foot" en="Preferred foot" />
                  <div className="seg" id="fFoot">
                    {([['any', 'p.any', 'Any'], ['L', 'p.left', 'Left'], ['R', 'p.right', 'Right'], ['B', 'p.both', 'Both']] as const).map(([v, k, en]) => <T key={v} as="button" data-v={v} k={k} en={en} aria-pressed={foot_ === v} onClick={() => setFoot(v)} />)}
                  </div>
                </div>
                <div className="fgroup">
                  <T className="flabel" as="div" k="p.status" en="Pathway status" />
                  <div className="chips" id="fStatus">
                    {STATUS.map((st, i) => (
                      <button key={i} className="chip" data-s={i} aria-pressed={status.has(i)} onClick={() => setStatus(toggleIn(status, i))}>{L(st)}<span className="c">{TALENTS.filter((x) => x.status === i && match(x, 'status')).length}</span></button>
                    ))}
                  </div>
                </div>
                <div className="fgroup"><T as="button" className="reset" id="fReset" k="p.reset" en="Reset all filters" onClick={reset} /></div>
              </div>
            </aside>

            <section aria-label="Results">
              <div className="results-bar">
                <div className="count" aria-live="polite"><b id="rCount">{list.length}</b> <span id="rLabel">{t(list.length === 1 ? 'p.talent' : 'p.talents')}</span></div>
                <div className="results-tools">
                  <select className="sel" id="fSort" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="ovr">{s('p.s1', 'Highest rated')}</option>
                    <option value="new">{s('p.s2', 'Newest')}</option>
                    <option value="young">{s('p.s3', 'Youngest')}</option>
                    <option value="name">{s('p.s4', 'Name A–Z')}</option>
                  </select>
                  <div className="viewtg" role="group" aria-label="View">
                    <button data-view="grid" aria-label="Grid" aria-pressed={view === 'grid'} onClick={() => { setView('grid'); store.set('view', 'grid'); }}><svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" /><rect x="9" y="1" width="6" height="6" /><rect x="1" y="9" width="6" height="6" /><rect x="9" y="9" width="6" height="6" /></svg></button>
                    <button data-view="list" aria-label="List" aria-pressed={view === 'list'} onClick={() => { setView('list'); store.set('view', 'list'); }}><svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" /><rect x="1" y="7" width="14" height="2" /><rect x="1" y="12" width="14" height="2" /></svg></button>
                  </div>
                </div>
              </div>
              <div className="active-filters" id="activeF">{chips.map(([k, v, l]) => <button key={k + v} data-rm={k} data-v={v} onClick={() => removeChip(k, v)}>{l}</button>)}</div>
              <div className={'tgrid' + (view === 'list' ? ' list' : '')} id="grid">
                {list.length
                  ? list.map((x, i) => <TalentCard key={renderKey + x.id} t={x} compare cmpOn={cmp.includes(x.id)} onCmp={onCmp} delay={Math.min(i, 12) * 0.04} />)
                  : <div className="empty" key={renderKey}><p className="display">{t('p.empty.t')}</p><p>{t('p.empty.p')}</p><button className="btn btn--ghost" data-reset onClick={reset}>{t('p.reset')}</button></div>}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className={'tray' + (cmp.length > 0 ? ' on' : '')} id="tray" aria-live="polite">
        <T className="lbl" k="p.cmp" en="Compare" />
        <div className="tray-slots" id="traySlots">
          {cmp.map((id, i) => (
            <span className="tray-slot" key={id}><i style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block', boxShadow: i === 1 ? '0 0 0 1px #fff' : undefined }}></i>{byId(id)!.name}<button data-un={id} aria-label="Remove" onClick={() => setCmp(cmp.filter((x) => x !== id))}>×</button></span>
          ))}
          {[...Array(Math.max(0, 3 - cmp.length))].map((_, i) => <span className="tray-slot empty-slot" key={'e' + i}>+ {t('cmp.slot')}</span>)}
        </div>
        <T as="button" className="btn btn--blue btn--sm" id="cmpGo" k="p.cmpgo" en="Compare →" disabled={cmp.length < 2} style={{ opacity: cmp.length < 2 ? 0.5 : 1 }}
          onClick={() => { if (cmp.length < 2) return toast(t('cmp.min')); modal.open(<CompareModal ids={cmp} />, { wide: true }); }} />
      </div>
    </>
  );
}

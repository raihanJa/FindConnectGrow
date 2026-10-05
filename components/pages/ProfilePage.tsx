'use client';
/* Talent profile page */
import Link from 'next/link';
import { useMemo } from 'react';
import type { Talent } from '@/lib/data';
import { hash, month, posXY, rng } from '@/lib/fcg';
import { autoClips, pitchLines, type ReelClip } from '@/lib/replay';
import { DocTitle, useData, useLang, useModal, useToast } from '../providers';
import { Reel } from '../Reel';
import { DossierForm, Radar, Signature, StarButton, StatusPill, TalentCard, useReveal } from '../ui';

function heat(t: Talent) {
  const rr = rng(hash(t.id + 'heat'));
  const [px, py] = posXY(t);
  const cx = (px / 100) * 105, cy = (py / 100) * 68;
  const spread = { gk: [6, 8], def: [16, 12], mid: [22, 16], att: [20, 14] }[t.group];
  let s = '<defs><radialGradient id="hg"><stop offset="0" stop-color="#8FB3FF" stop-opacity=".9"/><stop offset=".45" stop-color="#1463F3" stop-opacity=".45"/><stop offset="1" stop-color="#1463F3" stop-opacity="0"/></radialGradient></defs><g style="mix-blend-mode:screen">';
  const blobs = [[cx, cy, 14]];
  for (let i = 0; i < 9; i++) blobs.push([cx + (rr() - 0.5) * spread[0] * 2, cy + (rr() - 0.5) * spread[1] * 2, 6 + rr() * 9]);
  blobs.forEach(([x, y, rad]) => { s += `<circle cx="${Math.max(2, Math.min(103, x)).toFixed(1)}" cy="${Math.max(2, Math.min(66, y)).toFixed(1)}" r="${rad.toFixed(1)}" fill="url(#hg)"/>`; });
  return s + '</g>';
}

function addMonths(ym: string, n: number) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

/* ---------- Page ---------- */
export default function ProfilePage({ id }: { id: string }) {
  const { ATTR, GROUPS, POS, REGIONS, STATUS, TALENTS, TRAITS, byId } = useData();
  const t = byId(id);
  const { lang, t: tr, L, foot } = useLang();
  const modal = useModal(), toast = useToast();
  useReveal([id]);

  // hand-drawn moments from the admin portal, otherwise automatic ones for the position
  const clips = useMemo<ReelClip[]>(() => (!t ? [] : t.clips.length ? t.clips.slice().sort((a, b) => a.min - b.min) : autoClips(t)), [t]);

  if (!t) {
    return <main id="main"><DocTitle en="Talent profile — FCG" /><div className="wrap" id="profile"><div className="empty" style={{ marginTop: 60 }}><p className="display">{tr('pr.nf.t')}</p><p>{tr('pr.nf.p')}</p><Link className="btn" href="/talents">{tr('pr.back')}</Link></div></div></main>;
  }

  const R = REGIONS[t.region];
  const code = 'FCG-' + (1000 + (hash(t.id) % 9000));
  const idx = TALENTS.indexOf(t);
  const prev = TALENTS[(idx - 1 + TALENTS.length) % TALENTS.length], next = TALENTS[(idx + 1) % TALENTS.length];
  const peers = TALENTS.filter((x) => x.group === t.group);
  const avg = ATTR.map((_, i) => Math.round(peers.reduce((s, x) => s + x.a[i], 0) / peers.length));
  const isGK = t.pos === 'GK';
  const stats: [string | number, string][] = isGK
    ? [[t.st.m, tr('pr.m')], [t.st.cs!, tr('pr.cs')], [t.st.sv!, tr('pr.sv')], [t.ovr, 'OVR']]
    : [[t.st.m, tr('pr.m')], [t.st.g!, tr('pr.g')], [t.st.as!, tr('pr.a')], [((t.st.g! + t.st.as!) / t.st.m).toFixed(2), tr('pr.ga')]];
  const tl: [number, string, string][] = [
    [0, tr('tl.1t').replace('{c}', t.city), tr('tl.1p')],
    [2, tr('tl.2t'), tr('tl.2p')],
    [5, tr('tl.3t').replace('{c}', t.trialCity || tr('tl.tbd')), tr('tl.3p')],
    [9, tr('tl.4t'), tr('tl.4p')]
  ];
  const similar = TALENTS.filter((x) => x.id !== t.id && x.group === t.group).sort((a, b) => Math.abs(a.ovr - t.ovr) - Math.abs(b.ovr - t.ovr)).slice(0, 3);
  const share = () => {
    const done = () => toast(tr('pr.copied'));
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  };

  return (
    <main id="main"><DocTitle en={`${t.name} — FCG`} /><div className="wrap" id="profile">
      <div className="phead" style={{ border: 0, paddingBottom: 0 }}>
        <div className="crumbs"><Link href="/">FCG</Link> / <Link href="/talents">{tr('nav.portal')}</Link> / {t.name}</div>
      </div>
      <section className="p-hero">
        <div className="p-portrait reveal"><Signature id={t.id} rings={22} /><span className="num">{t.no}</span>
          <div className="badge"><StatusPill s={t.status} /><span className="pill">{t.g === 'f' ? tr('p.women') : tr('p.men')}</span></div>
          <p className="note">{tr('pr.sig')}</p></div>
        <div className="reveal" data-d="1">
          <p className="kicker" suppressHydrationWarning><b>●</b> {`${code} · ${tr('pr.since')} ${month(lang, t.joined)}`}</p>
          <h1 className="display p-name">{t.name}</h1>
          <p className="p-sub">{`${L(POS[t.pos])} ${tr('pr.from')} ${t.city}, ${L(R.name)}`}</p>
          <div className="p-meta">
            <div><span>{tr('p.age')}</span><b>{t.age}</b></div>
            <div><span>{tr('cmp.pos')}</span><b>{t.pos}</b></div>
            <div><span>{tr('p.foot')}</span><b>{foot(t.foot)}</b></div>
            <div><span>{tr('cmp.h')}</span><b>{t.h} cm</b></div>
            <div><span>{tr('p.reg')}</span><b>{L(R.name)}</b></div>
            <div><span>{tr('cmp.ovr')}</span><b className="blue">{t.ovr}</b></div>
          </div>
          <div className="progress"><p className="kicker" style={{ margin: 0 }}>{tr('pr.path')}</p><ol>
            {STATUS.map((s, i) => (
              <li key={i} className={i < t.status ? 'done' : i === t.status ? 'now' : ''}>{L(s)}<small suppressHydrationWarning>{i <= t.status ? month(lang, addMonths(t.joined, [0, 2, 5, 9][i])) : '—'}</small></li>
            ))}
          </ol></div>
          <div className="p-actions">
            <button className="btn btn--blue" id="reqBtn" onClick={() => modal.open(<DossierForm ids={[t.id]} />)}>{tr('pr.req')} <span className="arr">→</span></button>
            <StarButton id={t.id} />
            <button className="btn btn--ghost" id="shareBtn" onClick={share}>{tr('pr.share')}</button>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-head two reveal">
          <span className="kicker"><span className="num">§01</span>{tr('pr.s1k')}</span>
          <h2 className="h2">{tr('pr.s1t')}</h2>
          <p className="lead" style={{ fontSize: '1.05rem' }}>{tr('pr.s1l')}</p>
        </div>
        <Reel t={t} clips={clips} />
      </section>

      <section className="sec">
        <div className="sec-head reveal">
          <span className="kicker"><span className="num">§02</span>{tr('pr.s2k')}</span>
          <h2 className="h2">{tr('pr.s2t')}</h2>
        </div>
        <div className="report">
          <div className="radar-box reveal"><Radar sets={[{ values: avg, color: '#6B7385', dash: true, fill: 0 }, { values: t.a, color: '#1463F3' }].reverse()} size={360} values />
            <p className="heat-cap" style={{ justifyContent: 'center', gap: 18 }}><span><span className="cmp-key" style={{ background: '#1463F3' }}></span>{t.name}</span><span><span className="cmp-key" style={{ background: '#6B7385' }}></span>{tr('pr.avg').replace('{g}', L(GROUPS[t.group]).toLowerCase())}</span></p></div>
          <div className="reveal" data-d="1">
            <p className="scoutq">{L(t.quote)}</p>
            <p className="scout-by">{`— ${tr('pr.by')} · ${L(R.name)}`}</p>
            <div className="attr-list">{ATTR.map((a, i) => <div className="attr" key={i}><span>{L(a)}</span><s><i className={t.a[i] >= 80 ? 'hi' : ''} style={{ '--w': `${t.a[i]}%` } as React.CSSProperties}></i><em style={{ left: `${avg[i]}%` }} title="avg"></em></s><b>{t.a[i]}</b></div>)}</div>
            <div className="traits">{t.traits.map((k) => <span key={k}>{L(TRAITS[k])}</span>)}</div>
            <div className="statrow">{stats.map(([v, l], i) => <div key={i}><b>{v}</b><span>{l}</span></div>)}</div>
            <p className="footnote">{tr('pr.statfoot')}</p>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-head reveal">
          <span className="kicker"><span className="num">§03</span>{tr('pr.s3k')}</span>
          <h2 className="h2">{tr('pr.s3t')}</h2>
        </div>
        <div className="twocol">
          <div className="reveal">
            <p className="lead" style={{ marginTop: 0 }}>{L(t.bio)}</p>
            <div className="heat mt-m"><svg viewBox="-3 -3 111 74" dangerouslySetInnerHTML={{ __html: pitchLines() + heat(t) }} /></div>
            <div className="heat-cap"><span>{tr('pr.heat')}</span><span>{tr('pr.dir')} →</span></div>
          </div>
          <div className="reveal" data-d="1">
            <p className="kicker" style={{ marginTop: 0 }}>{tr('pr.journey')}</p>
            <ol className="timeline mt-s">
              {tl.map(([m, h, p], i) => (
                <li key={i} className={i < t.status ? '' : i === t.status ? 'now' : 'todo'}><time suppressHydrationWarning>{i <= t.status ? month(lang, addMonths(t.joined, m)) : tr('tl.next')}</time><h4>{h}</h4><p>{p}</p></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-head reveal">
          <span className="kicker"><span className="num">§04</span>{tr('pr.s4k')}</span>
          <h2 className="h2">{tr('pr.s4t')}</h2>
        </div>
        <div className="tgrid reveal">{similar.map((x) => <TalentCard key={x.id} t={x} />)}</div>
      </section>

      <nav className="pnav" aria-label="Talents">
        <Link href={`/talent/${prev.id}`}><span>← {tr('pr.prev')}</span><b>{prev.name}</b></Link>
        <Link href={`/talent/${next.id}`}><span>{tr('pr.next')} →</span><b>{next.name}</b></Link>
      </nav>
    </div></main>
  );
}

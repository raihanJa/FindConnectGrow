'use client';
import Link from 'next/link';
import { createElement, useEffect, useState, type AllHTMLAttributes, type ElementType } from 'react';
import type { Talent } from '@/lib/data';
import { pitchMiniInner, radarInner, signaturePaths, type RadarSet } from '@/lib/fcg';
import { useData, useLang, useModal, useShortlist, useStarToggle } from './providers';

/* ---------- static, translatable markup (data-i18n equivalent) ---------- */
type TProps = Omit<AllHTMLAttributes<HTMLElement>, 'as'> & { k: string; en: string; as?: ElementType };
export function T({ k, en, as = 'span', ...rest }: TProps) {
  const { s } = useLang();
  return createElement(as, { ...rest, dangerouslySetInnerHTML: { __html: s(k, en) } });
}

/* ---------- graphics ---------- */
export function Signature({ id, rings }: { id: string; rings?: number }) {
  return (
    <svg className="sig" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="#0C1C36" strokeWidth=".42" opacity=".78" dangerouslySetInnerHTML={{ __html: signaturePaths(id, rings) }} />
    </svg>
  );
}
export function PitchMini({ t }: { t: Talent }) {
  return <svg className="mini" viewBox="0 0 100 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pitchMiniInner(t) }} />;
}
export function Radar({ sets, size, values }: { sets: RadarSet[]; size?: number; values?: boolean }) {
  const { t, L } = useLang();
  const { ATTR } = useData();
  const S = size || 320;
  return <svg className="radar" viewBox={`0 0 ${S} ${S}`} role="img" aria-label={t('radar.aria')} dangerouslySetInnerHTML={{ __html: radarInner(ATTR.map(L), sets, { size, values }) }} />;
}

export function StatusPill({ s }: { s: number }) {
  const { L } = useLang();
  const { STATUS } = useData();
  return <span className={`pill st-${s}`}><i></i>{L(STATUS[s])}</span>;
}

/* ---------- shortlist star ---------- */
export function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3.1-5.4 3.1 1.2-6L3.3 9.8l6.1-.7z" strokeLinejoin="round" /></svg>;
}
export function StarButton({ id, label = true }: { id: string; label?: boolean }) {
  const { t } = useLang();
  const sl = useShortlist();
  const toggle = useStarToggle();
  const on = sl.has(id);
  return (
    <button className="star" data-star={id} aria-pressed={on} aria-label={t('sl.toggle')} onClick={(e) => { e.preventDefault(); toggle(id); }}>
      <StarIcon />{label && <span>{t(on ? 'sl.on' : 'sl.add')}</span>}
    </button>
  );
}

/* ---------- talent card ---------- */
export function TalentCard({ t, delay, compare, cmpOn, onCmp }: { t: Talent; delay?: number; compare?: boolean; cmpOn?: boolean; onCmp?: (id: string, checked: boolean) => void }) {
  const { L, t: tr, foot } = useLang();
  const { ATTR, POS, REGIONS } = useData();
  const order = t.a.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  return (
    <article className="tcard" data-id={t.id} style={delay != null ? { animationDelay: `${delay}s` } : undefined}>
      <Link className="tcard-link" href={`/talent/${t.id}`} aria-label={`${t.name} — ${L(POS[t.pos])}`}></Link>
      <div className="tcard-visual"><Signature id={t.id} /><span className="tcard-num">{t.no}</span>
        <div className="tcard-top"><StatusPill s={t.status} /><span className="reg">{L(REGIONS[t.region].name)}</span></div></div>
      <div className="tcard-body">
        <div className="tcard-row"><div><h3>{t.name}</h3><div className="meta">{`${t.pos} · ${t.age} ${tr('yrs')} · ${foot(t.foot)}`}</div></div>
          <div className="ovr" title={tr('ovr.title')}><b>{t.ovr}</b>OVR</div></div>
        <div className="tcard-foot"><PitchMini t={t} /><div className="bars">
          {order.map(([v, i], k) => (
            <div key={i} className={'bar' + (k === 0 ? ' hi' : '')}><span>{L(ATTR[i])}</span><s><i style={{ '--w': `${v}%` } as React.CSSProperties}></i></s><span>{v}</span></div>
          ))}
        </div></div>
      </div>
      <div className="tcard-actions"><StarButton id={t.id} />
        {compare && <label className="cmp"><input type="checkbox" data-cmp={t.id} checked={!!cmpOn} onChange={(e) => onCmp && onCmp(t.id, e.target.checked)} /> {tr('cmp.label')}</label>}
      </div>
    </article>
  );
}

/* ---------- forms ---------- */
export function FormSuccess({ title, text }: { title: string; text: string }) {
  const { t } = useLang();
  const modal = useModal();
  return (
    <div className="form-ok"><div className="tick">✓</div><h2 className="h2" style={{ fontSize: '2rem' }}>{title}</h2><p className="muted">{text}</p>
      <button className="btn mt-s" data-close onClick={modal.close}>{t('close')}</button></div>
  );
}

/* Dossier request — used on profile, portal compare + clubs */
export function DossierForm({ ids }: { ids: string[] }) {
  const { t } = useLang();
  const { byId } = useData();
  const [sent, setSent] = useState(false);
  const names = ids.map((id) => byId(id)).filter(Boolean).map((x) => x!.name);
  if (sent) return <FormSuccess title={t('dos.ok.t')} text={t('dos.ok.p')} />;
  return (
    <>
      <p className="kicker"><b>●</b> {t('dos.kicker')}</p>
      <h2 className="h2">{t('dos.title')}</h2>
      <p className="muted">{t('dos.intro')}</p>
      {names.length > 0 && <p className="mono" style={{ fontSize: 12, border: '1px solid var(--line)', padding: '10px 12px', background: 'var(--card)' }}>{names.join(' · ')}</p>}
      <form className="form mt-s" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
        <div className="form-2">
          <label className="field"><span>{t('f.name')}</span><input required autoComplete="name" /></label>
          <label className="field"><span>{t('f.club')}</span><input required /></label>
          <label className="field"><span>{t('f.role')}</span><select><option>{t('f.role1')}</option><option>{t('f.role2')}</option><option>{t('f.role3')}</option></select></label>
          <label className="field"><span>{t('f.email')}</span><input type="email" required autoComplete="email" /></label>
        </div>
        <label className="field"><span>{t('f.msg')}</span><textarea placeholder={t('dos.ph')}></textarea></label>
        <label className="check"><input type="checkbox" required /> {t('dos.check')}</label>
        <div><button className="btn btn--blue">{t('dos.send')} <span className="arr">→</span></button></div>
      </form>
    </>
  );
}

/* ---------- reveal + counters ---------- */
let io: IntersectionObserver | null = null;
function countUp(el: HTMLElement & { __done?: boolean }) {
  if (el.__done) return; el.__done = true;
  const to = +el.dataset.count!, dur = 1600, t0 = performance.now();
  const step = (now: number) => { const p = Math.min(1, (now - t0) / dur); el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = String(to); }, dur + 150);
}
function observer() {
  if (io || typeof IntersectionObserver === 'undefined') return io;
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement;
      el.classList.add('in'); io!.unobserve(el);
      const counts = Array.from(el.querySelectorAll<HTMLElement>('[data-count]'));
      if (el.matches('[data-count]')) counts.push(el);
      counts.forEach(countUp);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  return io;
}
/** Fade-in `.reveal` elements (and run `[data-count]` counters) as they scroll into view. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const obs = observer();
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'));
    els.forEach((el) => (obs ? obs.observe(el) : el.classList.add('in')));
    return () => { if (obs) els.forEach((el) => obs.unobserve(el)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

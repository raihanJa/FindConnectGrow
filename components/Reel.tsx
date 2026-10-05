'use client';
/* Tactical replay player — used on the profile page and as preview in the admin replay editor */
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Loc, Talent } from '@/lib/data';
import { loc, reducedMotion, tx } from '@/lib/fcg';
import { at, pitchLines, type ReelClip } from '@/lib/replay';
import { useLang } from './providers';

export const sec = (x: number) => `0:${String(Math.floor(x)).padStart(2, '0')}`;

/* ---------- Reel engine ---------- */
const ICON_PLAY = '<svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>', ICON_PAUSE = '<svg viewBox="0 0 14 14"><rect x="2.5" y="1.5" width="3.2" height="11" fill="currentColor"/><rect x="8.3" y="1.5" width="3.2" height="11" fill="currentColor"/></svg>';

/** Animated tactical replay of a talent's moments. `t` only needs the shirt number. */
export function Reel({ t, clips, reveal = true }: { t: Pick<Talent, 'no'>; clips: ReelClip[]; reveal?: boolean }) {
  const { lang, t: tr, L } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const langRef = useRef(lang);
  const relabel = useRef<() => void>(() => {});

  useEffect(() => {
    const box = root.current!;
    const q = <E extends Element>(s: string) => box.querySelector<E>(s)!;
    const ents = q<SVGGElement>('#ents'), trail = q<SVGPolylineElement>('#trail'), scrub = q<HTMLInputElement>('#scrub'), time = q('#time'), evBox = q('#evBox'), flash = q('#flash'), play = q('#play'), capMin = q('#capMin'), spd = q('#spd'), chaps = q('#chaps');
    const st = { i: 0, t: 0, playing: false, speed: 1, last: 0, hold: 0, started: false };
    let raf = 0;
    const Lc = (o: Loc) => loc(langRef.current, o);

    function load(i: number) {
      st.i = i; st.t = 0;
      const c = clips[i];
      ents.innerHTML = c.ents.map(([team]) => team === 'me'
        ? `<g data-team="me"><circle r="3.4" fill="#1463F3" opacity=".25"><animate attributeName="r" values="2.6;4.2;2.6" dur="1.6s" repeatCount="indefinite"/></circle><circle r="2" fill="#1463F3" stroke="#fff" stroke-width=".5"/><text y="-3.4" text-anchor="middle" font-size="2.6" font-family="JetBrains Mono, monospace" fill="#fff">${t.no}</text></g>`
        : team === 'team' ? '<g data-team="team"><circle r="1.6" fill="#8FB3FF" stroke="#0A1730" stroke-width=".35"/></g>'
          : '<g data-team="opp"><circle r="1.6" fill="#F3F0E8" stroke="#0A1730" stroke-width=".35"/></g>').join('') + '<g data-ball><circle r=".95" fill="#fff" stroke="#0A1730" stroke-width=".3"/></g>';
      box.querySelectorAll<HTMLElement>('.chap').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.i! === i)));
      capMin.textContent = `${c.min}' · ${Lc(c.title)}`;
      draw();
    }
    function draw() {
      const c = clips[st.i], tt = st.t;
      const g = ents.children;
      c.ents.forEach(([, track], k) => { const [x, y] = at(track, tt, true, c.mirror); g[k].setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`); });
      const [bx, by] = at(c.ball, tt, false, c.mirror);
      g[g.length - 1].setAttribute('transform', `translate(${bx.toFixed(2)},${by.toFixed(2)})`);
      const trailPts: string[] = []; for (let s = Math.max(0, tt - 0.35); s <= tt; s += 0.02) trailPts.push(at(c.ball, s, false, c.mirror).map((v) => v.toFixed(2)).join(','));
      trail.setAttribute('points', trailPts.join(' '));
      scrub.value = String(Math.round(tt * 1000));
      time.textContent = `${sec(tt * c.dur)} / ${sec(c.dur)}`;
      const ev = c.ev.filter(([et]) => tt >= et && tt < et + 0.2).pop();
      evBox.classList.toggle('on', !!ev);
      if (ev) evBox.textContent = Lc(ev[1]);
      const fl = c.flash && tt >= c.flash[0] && tt < c.flash[0] + 0.16;
      flash.classList.toggle('on', !!fl);
      if (c.flash) flash.textContent = tx(langRef.current, 'fl.' + c.flash[1]);
      play.innerHTML = st.playing ? ICON_PAUSE : ICON_PLAY;
    }
    function loop(now: number) {
      const dt = Math.min(64, now - (st.last || now)); st.last = now;
      if (st.playing) {
        const c = clips[st.i];
        if (st.t >= 1) {
          st.hold += dt;
          if (st.hold > 900) { st.hold = 0; load((st.i + 1) % clips.length); }
        } else {
          st.t = Math.min(1, st.t + (dt / (c.dur * 1000)) * st.speed);
        }
        draw();
      }
      raf = requestAnimationFrame(loop);
    }
    const onPlay = () => { st.playing = !st.playing; if (st.t >= 1) st.t = 0; draw(); };
    const onScrub = () => { st.playing = false; st.t = +scrub.value / 1000; draw(); };
    const onSpd = () => { st.speed = st.speed === 1 ? 0.5 : st.speed === 0.5 ? 2 : 1; spd.textContent = st.speed + '×'; };
    const onChap = (e: Event) => { const b = (e.target as Element).closest<HTMLElement>('.chap'); if (b) { load(+b.dataset.i!); st.playing = true; draw(); } };
    play.addEventListener('click', onPlay); scrub.addEventListener('input', onScrub); spd.addEventListener('click', onSpd); chaps.addEventListener('click', onChap);
    relabel.current = () => { capMin.textContent = `${clips[st.i].min}' · ${Lc(clips[st.i].title)}`; draw(); };
    load(0);
    // autoplay once visible
    const reduce = reducedMotion();
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting && !reduce && !st.started) { st.started = true; st.playing = true; draw(); } }, { threshold: 0.5 });
    io.observe(q('.reel-stage'));
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      play.removeEventListener('click', onPlay); scrub.removeEventListener('input', onScrub); spd.removeEventListener('click', onSpd); chaps.removeEventListener('click', onChap);
    };
  }, [clips, t]);
  useEffect(() => { langRef.current = lang; relabel.current(); }, [lang]);

  return (
    <div className={'reel' + (reveal ? ' reveal' : '')} ref={root}>
      <div>
        <div className="reel-stage">
          <svg viewBox="-3 -3 111 74" id="pitch"><g dangerouslySetInnerHTML={{ __html: pitchLines() }} /><polyline id="trail" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".45" strokeDasharray="1 1" /><g id="ents"></g></svg>
          <div className="reel-cap"><span className="live">{tr('pr.replay')}</span><span id="capMin"></span></div>
          <div className="reel-event" id="evBox"></div>
          <div className="reel-goal" id="flash"></div>
        </div>
        <div className="reel-ctrl">
          <button className="play" id="play" aria-label="Play/pause"></button>
          <input type="range" id="scrub" min="0" max="1000" defaultValue="0" aria-label="Scrub" />
          <span className="time" id="time">0:00 / 0:00</span>
          <button className="spd" id="spd">1×</button>
        </div>
      </div>
      <div className="reel-side">
        <h4>{tr('pr.chap')}</h4>
        <div id="chaps">{clips.map((c, i) => <button className="chap" data-i={i} key={i}><span className="i">0{i + 1}</span><span><b>{L(c.title)}</b><small>{`${c.min}' · ${L(c.match)}`}</small></span><span className="d">{sec(Math.round(c.dur))}</span></button>)}</div>
        <div className="reel-lock"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="1" /><path d="M8 11V7a4 4 0 018 0v4" /></svg><span>{tr('pr.lock')} <Link href="/clubs#models">{tr('pr.lockl')}</Link></span></div>
      </div>
    </div>
  );
}

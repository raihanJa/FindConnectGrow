'use client';
/* Talent profile page + tactical replay player */
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { ATTR, GROUPS, POS, REGIONS, STATUS, TALENTS, TRAITS, byId, type Loc, type PosKey, type Talent } from '@/lib/data';
import { hash, loc, month, posXY, reducedMotion, rng, tx } from '@/lib/fcg';
import { DocTitle, useLang, useModal, useToast } from '../providers';
import { DossierForm, Radar, Signature, StarButton, StatusPill, TalentCard, useReveal } from '../ui';

/* ---------- Clip templates (pitch 105 × 68, attacking → right) ---------- */
type Track = number[][];
type Clip = { dur: number; title: Loc; flash?: [number, string]; ents: [string, Track][]; ball: Track; ev: [number, Loc][] };
const E = (en: string, nl: string): Loc => ({ en, nl });
const CLIPS: Record<string, Clip> = {
  solo: { dur: 7, title: E('Dribble & finish', 'Dribbel & afronding'), flash: [0.8, 'GOAL'],
    ents: [
      ['me', [[0, 52, 40], [0.2, 62, 38], [0.45, 76, 33], [0.62, 86, 30], [0.7, 89, 29], [1, 92, 31]]],
      ['opp', [[0, 70, 40], [0.3, 68, 37], [0.45, 75, 34], [0.6, 74, 36], [1, 78, 34]]],
      ['opp', [[0, 86, 24], [0.4, 84, 28], [0.6, 87, 31], [0.66, 86, 33], [1, 85, 32]]],
      ['opp', [[0, 102, 34], [0.7, 101, 32], [0.82, 100, 31], [1, 100, 31]]],
      ['team', [[0, 45, 18], [1, 80, 16]]], ['team', [[0, 40, 56], [1, 70, 50]]], ['opp', [[0, 80, 50], [1, 86, 45]]]
    ],
    ball: [[0, 53.5, 40], [0.2, 63.5, 38], [0.45, 77.5, 33], [0.62, 87.5, 30], [0.7, 90.5, 29.5], [0.8, 105, 32], [1, 106, 32]],
    ev: [[0.42, E('Beats the first defender', 'Passeert de eerste verdediger')], [0.6, E('Cuts inside', 'Snijdt naar binnen')], [0.74, E('Finish — far corner', 'Afronding — verre hoek')]] },
  through: { dur: 7, title: E('Key pass', 'Beslissende pass'), flash: [0.88, 'ASSIST'],
    ents: [
      ['me', [[0, 58, 35], [0.2, 59.5, 34.5], [0.4, 61, 34], [1, 68, 33]]],
      ['team', [[0, 40, 46], [1, 55, 45]]],
      ['team', [[0, 72, 13], [0.55, 86, 19], [0.75, 90, 22], [1, 94, 24]]],
      ['opp', [[0, 72, 30], [0.4, 69, 32.5], [1, 78, 30]]], ['opp', [[0, 78, 22], [0.5, 81, 22], [1, 88, 24]]],
      ['opp', [[0, 102, 34], [0.75, 99, 30], [0.88, 98, 28], [1, 98, 28]]], ['team', [[0, 75, 48], [1, 88, 42]]]
    ],
    ball: [[0, 41, 46], [0.2, 59, 35], [0.38, 61, 34.5], [0.55, 86, 20], [0.75, 90.5, 22.5], [0.88, 105, 33], [1, 106, 33]],
    ev: [[0.2, E('Receives on the half-turn', 'Neemt half gedraaid aan')], [0.4, E('Disguised through ball', 'Verdekte steekpass')], [0.82, E('Assist', 'Assist')]] },
  intercept: { dur: 6.5, title: E('Interception & transition', 'Onderschepping & omschakeling'),
    ents: [
      ['opp', [[0, 55, 25], [0.2, 54, 26], [1, 52, 32]]], ['opp', [[0, 40, 46], [0.3, 42, 44], [1, 46, 42]]],
      ['me', [[0, 50, 47], [0.28, 46, 39.5], [0.32, 45.5, 39], [0.6, 61, 37], [1, 66, 36]]],
      ['team', [[0, 70, 12], [0.85, 82, 18], [1, 88, 18]]], ['team', [[0, 60, 56], [1, 75, 48]]], ['opp', [[0, 64, 40], [1, 70, 38]]]
    ],
    ball: [[0, 55, 26], [0.28, 46.5, 38.5], [0.32, 46, 39], [0.6, 62.5, 37], [0.85, 82, 18], [1, 87, 17.5]],
    ev: [[0.28, E('Reads the pass', 'Leest de pass')], [0.55, E('Drives forward', 'Dribbelt op')], [0.85, E('Switches play', 'Verlegt het spel')]] },
  header: { dur: 6, title: E('Attacking header', 'Aanvallende kopbal'), flash: [0.78, 'GOAL'],
    ents: [
      ['team', [[0, 85, 6], [0.3, 92, 5], [1, 94, 6]]], ['me', [[0, 80, 40], [0.4, 90, 36], [0.62, 96, 33], [1, 98, 32]]],
      ['opp', [[0, 92, 30], [0.62, 95, 31.5], [1, 95, 31]]], ['opp', [[0, 88, 41], [1, 94, 38]]],
      ['opp', [[0, 103, 33], [0.7, 102, 31], [0.8, 101, 28], [1, 101, 28]]], ['team', [[0, 70, 30], [1, 85, 28]]]
    ],
    ball: [[0, 86, 6.5], [0.3, 93, 5.5], [0.62, 96.5, 32.5], [0.78, 105, 30], [1, 106, 30]],
    ev: [[0.3, E('Cross from the right', 'Voorzet van rechts')], [0.58, E('Attacks the near post', 'Duikt voor de eerste paal')], [0.76, E('Header — goal', 'Kopbal — doelpunt')]] },
  clear: { dur: 6, title: E('Aerial duel in the box', 'Kopduel in de zestien'), flash: [0.6, 'CLEARED'],
    ents: [
      ['opp', [[0, 20, 62], [0.3, 14, 63], [1, 12, 62]]], ['me', [[0, 18, 38], [0.6, 12.5, 35], [1, 14, 34]]],
      ['opp', [[0, 25, 30], [0.6, 13.5, 33.5], [1, 15, 32]]], ['team', [[0, 22, 27], [1, 18, 30]]],
      ['team', [[0, 2, 34], [1, 3, 36]]], ['opp', [[0, 30, 45], [1, 22, 42]]]
    ],
    ball: [[0, 20.5, 61], [0.3, 15, 62], [0.6, 12.5, 35], [1, 40, 18]],
    ev: [[0.3, E('Cross under pressure', 'Voorzet onder druk')], [0.58, E('Wins the aerial duel', 'Wint het kopduel')], [0.85, E('Danger cleared', 'Gevaar weggewerkt')]] },
  save: { dur: 5.5, title: E('Reflex save', 'Reflexredding'), flash: [0.55, 'SAVE'],
    ents: [
      ['opp', [[0, 30, 40], [0.3, 20, 36], [0.4, 19, 36], [1, 18, 36]]], ['me', [[0, 3, 34], [0.4, 3.5, 34], [0.55, 3, 29], [1, 4, 28]]],
      ['team', [[0, 25, 30], [0.3, 21, 33], [1, 20, 34]]], ['opp', [[0, 35, 50], [1, 15, 45]]], ['team', [[0, 18, 46], [1, 14, 42]]]
    ],
    ball: [[0, 31, 40], [0.3, 21, 36.5], [0.4, 20, 36], [0.55, 3.2, 29], [0.78, 6, 15], [1, 8, 6]],
    ev: [[0.38, E('Shot from 18 metres', 'Schot van 18 meter')], [0.55, E('Full-stretch save', 'Redding in volle strekking')], [0.8, E('Tipped wide', 'Naast getikt')]] },
  dist: { dur: 6, title: E('Distribution', 'Opbouw'),
    ents: [
      ['me', [[0, 6, 34], [0.2, 8, 34], [1, 9, 34]]], ['team', [[0, 45, 10], [0.55, 55, 12], [1, 72, 18]]],
      ['opp', [[0, 40, 22], [1, 58, 20]]], ['opp', [[0, 30, 40], [1, 40, 35]]], ['team', [[0, 20, 50], [1, 30, 48]]]
    ],
    ball: [[0, 7, 34], [0.2, 9, 34], [0.55, 55, 12.5], [0.7, 62, 14], [1, 72, 18.5]],
    ev: [[0.2, E('Quick release', 'Snelle uitworp')], [0.5, E('Pin-point long pass', 'Lange bal op maat')], [0.78, E('Counter launched', 'Counter ingezet')]] },
  press: { dur: 6, title: E('Press & win back', 'Druk zetten & heroveren'),
    ents: [
      ['opp', [[0, 60, 30], [0.3, 58, 32], [0.4, 57, 33], [1, 55, 36]]], ['me', [[0, 66, 41], [0.3, 60, 34.5], [0.4, 58, 33.5], [0.5, 59, 33], [0.75, 63, 35], [1, 66, 36]]],
      ['team', [[0, 70, 50], [0.75, 72, 40], [1, 90, 45]]], ['opp', [[0, 50, 40], [1, 55, 42]]], ['team', [[0, 75, 22], [1, 85, 25]]]
    ],
    ball: [[0, 61, 30.5], [0.3, 59, 32.5], [0.4, 58, 33.5], [0.5, 59.5, 33.5], [0.75, 72, 40], [1, 90, 45]],
    ev: [[0.28, E('Triggers the press', 'Zet de druk in')], [0.45, E('Wins it back', 'Verovert de bal')], [0.75, E('Feeds the runner', 'Bedient de diepe loper')]] }
};
const BY_POS: Record<PosKey, string[]> = { GK: ['save', 'dist', 'save'], CB: ['clear', 'intercept', 'press'], FB: ['intercept', 'press', 'through'], DM: ['press', 'intercept', 'through'],
  CM: ['through', 'press', 'intercept'], AM: ['through', 'solo', 'intercept'], W: ['solo', 'through', 'press'], ST: ['header', 'solo', 'press'] };
const MATCHES = [E('Regional U19 select', 'Regionale O19-selectie'), E('Camp league final', 'Kampcompetitie finale'), E('Street tournament', 'Straattoernooi')];
type ReelClip = Clip & { k: string; mirror: boolean; min: number };

const sm = (u: number) => u * u * (3 - 2 * u);
function at(track: Track, tt: number, smooth: boolean, mirror: boolean) {
  let i = 0; while (i < track.length - 2 && tt > track[i + 1][0]) i++;
  const a = track[i], b = track[i + 1] || a;
  const u = b[0] === a[0] ? 1 : Math.max(0, Math.min(1, (tt - a[0]) / (b[0] - a[0])));
  const e = smooth ? sm(u) : u;
  const x = a[1] + (b[1] - a[1]) * e, y = a[2] + (b[2] - a[2]) * e;
  return [x, mirror ? 68 - y : y];
}

function pitchLines() {
  let s = '';
  for (let i = 0; i < 10; i++) if (i % 2) s += `<rect class="stripe" x="${i * 10.5}" y="0" width="10.5" height="68"/>`;
  s += `<g class="pl"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><circle cx="52.5" cy="34" r=".4" fill="rgba(255,255,255,.6)"/>
      <rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/>
      <rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/>
      <rect x="-1.6" y="30.34" width="1.6" height="7.32"/><rect x="105" y="30.34" width="1.6" height="7.32"/>
      <path d="M16.5,26.7 A9.15,9.15 0 0,1 16.5,41.3"/><path d="M88.5,26.7 A9.15,9.15 0 0,0 88.5,41.3"/></g>`;
  return s;
}

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

/* ---------- Reel engine ---------- */
const ICON_PLAY = '<svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>', ICON_PAUSE = '<svg viewBox="0 0 14 14"><rect x="2.5" y="1.5" width="3.2" height="11" fill="currentColor"/><rect x="8.3" y="1.5" width="3.2" height="11" fill="currentColor"/></svg>';

function Reel({ t, clips }: { t: Talent; clips: ReelClip[] }) {
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
      const sec = (x: number) => `0:${String(Math.floor(x)).padStart(2, '0')}`;
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
    <div className="reel reveal" ref={root}>
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
        <div id="chaps">{clips.map((c, i) => <button className="chap" data-i={i} key={i}><span className="i">0{i + 1}</span><span><b>{L(c.title)}</b><small>{`${c.min}' · ${L(MATCHES[i])}`}</small></span><span className="d">0:0{Math.round(c.dur)}</span></button>)}</div>
        <div className="reel-lock"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="1" /><path d="M8 11V7a4 4 0 018 0v4" /></svg><span>{tr('pr.lock')} <Link href="/clubs#models">{tr('pr.lockl')}</Link></span></div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function ProfilePage({ id }: { id: string }) {
  const t = byId(id);
  const { lang, t: tr, L, foot } = useLang();
  const modal = useModal(), toast = useToast();
  useReveal([id]);

  const clips = useMemo<ReelClip[]>(() => {
    if (!t) return [];
    const r = rng(hash(t.id + 'reel'));
    const cs = BY_POS[t.pos].map((k, i) => ({ k, ...CLIPS[k], mirror: (i === 2 && k === BY_POS[t.pos][0]) ? true : r() > 0.5, min: 8 + Math.floor(r() * 80) }));
    return cs.sort((a, b) => a.min - b.min);
  }, [t]);

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

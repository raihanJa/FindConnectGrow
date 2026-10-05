'use client';
/* Admin: draw tactical replay moments by hand — drag players/ball to set keyframes, or record a route in real time */
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { at, CLIPS, FLASHES, pitchLines, type ReelClip, type Team, type Track } from '@/lib/replay';
import { useLang } from './providers';
import { Reel, sec } from './Reel';

export const MAX_CLIPS = 5;
const MAX_ENTS = 23;
export type DraftClip = {
  minute: string; title_en: string; title_nl: string; match_en: string; match_nl: string; duration: number;
  flash_kind: string; flash_at: number | null; ents: { team: Team; track: Track }[]; ball: Track; events: { t: number; en: string; nl: string }[];
};
type Sel = number | 'ball';
type Patch = Partial<DraftClip> | ((d: DraftClip) => Partial<DraftClip>);

const r1 = (v: number) => Math.round(v * 10) / 10, r3 = (v: number) => Math.round(v * 1000) / 1000;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const copy = (tr: Track): Track => tr.map((p) => p.slice());

/** New moment: an empty pitch, or a copy of a built-in template to adjust. */
export function newClip(template?: string): DraftClip {
  const c = template ? CLIPS[template] : null;
  if (!c) return { minute: '', title_en: '', title_nl: '', match_en: '', match_nl: '', duration: 7, flash_kind: '', flash_at: null,
    ents: [{ team: 'me', track: [[0, 52.5, 34]] }], ball: [[0, 54, 34]], events: [] };
  return { minute: '', title_en: c.title.en, title_nl: c.title.nl, match_en: '', match_nl: '', duration: c.dur,
    flash_kind: c.flash ? c.flash[1] : '', flash_at: c.flash ? c.flash[0] : null,
    ents: c.ents.map(([team, tr]) => ({ team, track: copy(tr) })), ball: copy(c.ball), events: c.ev.map(([t, l]) => ({ t, en: l.en, nl: l.nl })) };
}
export const clipComplete = (d: DraftClip) => +d.minute >= 1 && +d.minute <= 120 && !!(d.title_en.trim() && d.title_nl.trim() && d.match_en.trim() && d.match_nl.trim())
  && d.events.every((e) => e.en.trim() && e.nl.trim());
export const toReel = (d: DraftClip): ReelClip => ({
  dur: d.duration, title: { en: d.title_en, nl: d.title_nl }, match: { en: d.match_en, nl: d.match_nl }, min: +d.minute || 0, mirror: false,
  ...(d.flash_kind && d.flash_at != null ? { flash: [d.flash_at, d.flash_kind] as [number, string] } : {}),
  ents: d.ents.map((e) => [e.team, e.track]), ball: d.ball, ev: d.events.map((e) => [e.t, { en: e.en, nl: e.nl }])
});
/** Payload for create_talent(p_clips) */
export const toPayload = (d: DraftClip) => ({
  minute: +d.minute, title_en: d.title_en, title_nl: d.title_nl, match_en: d.match_en, match_nl: d.match_nl, duration: d.duration,
  flash_kind: d.flash_kind || null, flash_at: d.flash_kind ? d.flash_at ?? 0.5 : null, ents: d.ents, ball: d.ball, events: d.events
});

/** Insert or replace the keyframe at time t. */
function setKey(tr: Track, t: number, x: number, y: number): Track {
  const pt = [r3(t), r1(x), r1(y)], i = tr.findIndex((p) => Math.abs(p[0] - t) < 0.004);
  return i >= 0 ? tr.map((p, j) => (j === i ? pt : p)) : [...tr, pt].sort((a, b) => a[0] - b[0]);
}

export function ReplayEditor({ clips, setClips, no }: { clips: DraftClip[]; setClips: Dispatch<SetStateAction<DraftClip[]>>; no: string }) {
  const { s, L } = useLang();
  const [cur, setCur] = useState(0);
  const [tpl, setTpl] = useState('');
  const [preview, setPreview] = useState(false);
  const i = Math.min(cur, clips.length - 1);
  const set = (p: Patch) => setClips((cs) => cs.map((c, j) => (j === i ? { ...c, ...(typeof p === 'function' ? p(c) : p) } : c)));
  const reelT = useMemo(() => ({ no: +no || 0 }), [no]);
  const reelClips = useMemo(() => clips.map(toReel).sort((a, b) => a.min - b.min), [clips]);

  const add = () => { setClips((cs) => [...cs, newClip(tpl)]); setCur(clips.length); setPreview(false); };
  const remove = () => { if (confirm(s('adm.rp.delq', 'Delete this moment?'))) { setClips((cs) => cs.filter((_, j) => j !== i)); setCur(Math.max(0, i - 1)); } };

  return (
    <div className="rped">
      <div className="rped-tabs" role="tablist">
        {clips.map((c, j) => (
          <button type="button" role="tab" key={j} aria-selected={j === i && !preview} className={clipComplete(c) ? '' : 'todo'} onClick={() => { setCur(j); setPreview(false); }}>
            <span className="mono">0{j + 1}</span> {c.title_en || s('adm.rp.untitled', 'Untitled')}</button>
        ))}
        {clips.length > 0 && <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)}>▶ {s('adm.rp.preview', 'Preview as on profile')}</button>}
      </div>

      {clips.length < MAX_CLIPS && (
        <div className="rped-add">
          <label className="field"><span>{s('adm.rp.start', 'New moment — start from')}</span>
            <select value={tpl} onChange={(e) => setTpl(e.target.value)}>
              <option value="">{s('adm.rp.blank', 'Empty pitch')}</option>
              {Object.entries(CLIPS).map(([k, c]) => <option key={k} value={k}>{`${s('adm.rp.tpl', 'Template')}: ${L(c.title)}`}</option>)}
            </select></label>
          <button type="button" className="btn btn--ghost btn--sm" onClick={add}>+ {s('adm.rp.add', 'Add moment')}</button>
        </div>
      )}

      {preview && clips.length > 0 && <Reel t={reelT} clips={reelClips} reveal={false} />}
      {!preview && clips[i] && (
        <div className="rped-clip">
          <div className="form-2">
            <label className="field"><span>{s('adm.rp.title_en', 'Title — English')}</span><input value={clips[i].title_en} maxLength={60} onChange={(e) => set({ title_en: e.target.value })} placeholder="Dribble & finish" /></label>
            <label className="field"><span>{s('adm.rp.title_nl', 'Title — Dutch')}</span><input value={clips[i].title_nl} maxLength={60} onChange={(e) => set({ title_nl: e.target.value })} placeholder="Dribbel & afronding" /></label>
            <label className="field"><span>{s('adm.rp.match_en', 'Match — English')}</span><input value={clips[i].match_en} maxLength={60} onChange={(e) => set({ match_en: e.target.value })} placeholder="Camp league final" /></label>
            <label className="field"><span>{s('adm.rp.match_nl', 'Match — Dutch')}</span><input value={clips[i].match_nl} maxLength={60} onChange={(e) => set({ match_nl: e.target.value })} placeholder="Kampcompetitie finale" /></label>
            <label className="field"><span>{s('adm.rp.minute', 'Minute in the match')}</span><input type="number" min={1} max={120} value={clips[i].minute} onChange={(e) => set({ minute: e.target.value })} /></label>
            <label className="field"><span>{s('adm.rp.dur', 'Length (seconds)')}</span><input type="number" min={3} max={15} step={0.5} value={clips[i].duration} onChange={(e) => set({ duration: clamp(+e.target.value || 3, 3, 15) })} /></label>
          </div>
          <Board key={i} d={clips[i]} set={set} no={no} />
          <div><button type="button" className="btn btn--ghost btn--sm" onClick={remove}>{s('adm.rp.del', 'Delete this moment')}</button></div>
        </div>
      )}
    </div>
  );
}

function Board({ d, set, no }: { d: DraftClip; set: (p: Patch) => void; no: string }) {
  const { s } = useLang();
  const [t, setT] = useState(0);
  const [mode, setMode] = useState<'idle' | 'play' | 'rec'>('idle');
  const [sel, setSel] = useState<Sel>(0);
  const [tool, setTool] = useState<'move' | 'rec'>('move');
  const [speed, setSpeed] = useState(0.5);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const rec = useRef<{ target: Sel; t0: number; pos: number[]; samples: Track } | null>(null);
  const tRef = useRef(t); tRef.current = t;
  const durRef = useRef(d.duration); durRef.current = d.duration;
  const pos = useRef<{ sel: Sel; x: number; y: number }[]>([]);

  const selOk: Sel = sel === 'ball' || d.ents[sel] ? sel : 0;
  const trackOf = (c: DraftClip, w: Sel) => (w === 'ball' ? c.ball : c.ents[w].track);
  const put = (w: Sel, f: (tr: Track) => Track) => set((c) => (w === 'ball' ? { ball: f(c.ball) } : { ents: c.ents.map((e, j) => (j === w ? { ...e, track: f(e.track) } : e)) }));

  const finishRec = () => {
    const r = rec.current; if (!r) return;
    rec.current = null;
    const smp = r.samples, t0 = r.t0, t1 = smp[smp.length - 1][0];
    put(r.target, (tr) => [...tr.filter((p) => p[0] < t0 - 0.002 || p[0] > t1 + 0.002), ...smp].sort((a, b) => a[0] - b[0]));
    setMode('idle');
  };

  // clock: plays the clip, or advances time while a route is being recorded
  useEffect(() => {
    if (mode === 'idle') return;
    let raf = 0, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      const nt = Math.min(1, tRef.current + (dt / (durRef.current * 1000)) * (mode === 'rec' ? speed : 1));
      tRef.current = nt; setT(nt);
      const r = rec.current;
      if (mode === 'rec' && r && nt - r.samples[r.samples.length - 1][0] >= 0.012) r.samples.push([r3(nt), r1(r.pos[0]), r1(r.pos[1])]);
      if (nt >= 1) { if (mode === 'rec') finishRec(); else setMode('idle'); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, speed]);

  const toPitch = (e: React.PointerEvent) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse());
    return [clamp(p.x, -3, 108), clamp(p.y, -3, 71)];
  };
  const hit = (x: number, y: number): Sel | null => {
    let best: Sel | null = null, bd = 9;
    for (const e of pos.current) { const dd = (e.x - x) ** 2 + (e.y - y) ** 2; if (dd < bd) { bd = dd; best = e.sel; } }
    return best;
  };
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === 'play') setMode('idle');
    const [x, y] = toPitch(e), target = hit(x, y) ?? selOk;
    setSel(target);
    svg.current!.setPointerCapture(e.pointerId);
    if (tool === 'move') { drag.current = true; put(target, (tr) => setKey(tr, tRef.current, x, y)); return; }
    if (tRef.current >= 0.99) { tRef.current = 0; setT(0); }
    rec.current = { target, t0: r3(tRef.current), pos: [x, y], samples: [[r3(tRef.current), r1(x), r1(y)]] };
    setMode('rec');
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current && !rec.current) return;
    const [x, y] = toPitch(e);
    if (rec.current) rec.current.pos = [x, y];
    else put(selOk, (tr) => setKey(tr, tRef.current, x, y));
  };
  const up = () => {
    drag.current = false;
    const r = rec.current;
    if (r && tRef.current - r.samples[r.samples.length - 1][0] > 0.002) r.samples.push([r3(tRef.current), r1(r.pos[0]), r1(r.pos[1])]);
    finishRec();
  };
  const key = (e: React.KeyboardEvent) => {
    const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!dir[e.key] || mode !== 'idle') return;
    e.preventDefault();
    const st = e.shiftKey ? 2 : 0.5, [x, y] = at(trackOf(d, selOk), t, true, false);
    put(selOk, (tr) => setKey(tr, t, clamp(x + dir[e.key][0] * st, -3, 108), clamp(y + dir[e.key][1] * st, -3, 71)));
  };

  // entity labels + current positions
  let nTeam = 0, nOpp = 0;
  const label = (team: Team) => team === 'me' ? `#${no || '?'} ${s('adm.rp.me', 'Talent')}` : team === 'team' ? `${s('adm.rp.mate', 'Teammate')} ${++nTeam}` : `${s('adm.rp.opp', 'Opponent')} ${++nOpp}`;
  const list = d.ents.map((e, j) => ({ sel: j as Sel, team: e.team, label: label(e.team) }));
  const where = (w: Sel) => (rec.current && rec.current.target === w ? rec.current.pos : at(trackOf(d, w), t, w !== 'ball', false));
  pos.current = [...d.ents.map((_, j) => j as Sel), 'ball' as Sel].map((w) => { const [x, y] = where(w); return { sel: w, x, y }; });

  const selTrack = trackOf(d, selOk);
  const keyHere = selTrack.findIndex((p) => Math.abs(p[0] - t) < 0.004);
  const ev = d.events.filter((x) => t >= x.t && t < x.t + 0.2).pop();
  const flash = d.flash_kind && d.flash_at != null && t >= d.flash_at && t < d.flash_at + 0.16;
  const pts = (tr: Track) => tr.map((p) => `${p[1]},${p[2]}`).join(' ');
  const addEnt = (team: Team) => {
    const k = d.ents.filter((e) => e.team === team).length;
    set((c) => ({ ents: [...c.ents, { team, track: [[0, team === 'team' ? 40 : 65, 10 + ((k * 9) % 50)]] }] }));
    setSel(d.ents.length);
  };

  return (
    <div className="rped-board">
      <div className="rped-main">
        <div className="reel-stage">
          <svg ref={svg} viewBox="-3 -3 111 74" tabIndex={0} className={'rped-pitch' + (tool === 'rec' ? ' rec' : '')}
            aria-label={s('adm.rp.pitch', 'Pitch: drag a player or the ball. Arrow keys nudge the selected one.')}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
            <g dangerouslySetInnerHTML={{ __html: pitchLines() }} />
            {d.ents.map((e, j) => j !== selOk && <polyline key={'p' + j} points={pts(e.track)} className="rped-path" />)}
            {selOk !== 'ball' && <polyline points={pts(d.ball)} className="rped-path ball" />}
            <polyline points={pts(selTrack)} className="rped-path on" />
            {selTrack.map((p, j) => <circle key={'k' + j} cx={p[1]} cy={p[2]} r={Math.abs(p[0] - t) < 0.004 ? 0.9 : 0.55} className="rped-key" />)}
            {rec.current && <polyline points={pts(rec.current.samples)} className="rped-path rec" />}
            {d.ents.map((e, j) => {
              const [x, y] = where(j), on = j === selOk;
              return <g key={j} transform={`translate(${x.toFixed(2)},${y.toFixed(2)})`}>
                {on && <circle r="3.6" className="rped-sel" />}
                {e.team === 'me'
                  ? <><circle r="2.2" fill="#1463F3" stroke="#fff" strokeWidth=".5" /><text y="-3.4" textAnchor="middle" fontSize="2.6" fontFamily="JetBrains Mono, monospace" fill="#fff">{no}</text></>
                  : <circle r="1.7" fill={e.team === 'team' ? '#8FB3FF' : '#F3F0E8'} stroke="#0A1730" strokeWidth=".35" />}
              </g>;
            })}
            {(() => { const [x, y] = where('ball'); return <g transform={`translate(${x.toFixed(2)},${y.toFixed(2)})`}>{selOk === 'ball' && <circle r="2.6" className="rped-sel" />}<circle r="1" fill="#fff" stroke="#0A1730" strokeWidth=".3" /></g>; })()}
          </svg>
          <div className="reel-cap"><span className="live">{mode === 'rec' ? '● REC' : s('adm.rp.editor', 'Editor')}</span><span>{sec(t * d.duration)} / {sec(d.duration)}</span></div>
          <div className={'reel-event' + (ev ? ' on' : '')}>{ev ? ev.en : ''}</div>
          <div className={'reel-goal' + (flash ? ' on' : '')}>{d.flash_kind}</div>
        </div>
        <div className="reel-ctrl">
          <button type="button" className="play" aria-label="Play/pause" onClick={() => { if (mode === 'play') setMode('idle'); else { if (t >= 1) setT(0); setMode('play'); } }}>
            {mode === 'play' ? <svg viewBox="0 0 14 14"><rect x="2.5" y="1.5" width="3.2" height="11" fill="currentColor" /><rect x="8.3" y="1.5" width="3.2" height="11" fill="currentColor" /></svg>
              : <svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>}</button>
          <div className="rped-scrub">
            <div className="rped-ticks" aria-hidden="true">
              {selTrack.map((p, j) => <i key={'k' + j} style={{ left: `${p[0] * 100}%` }} />)}
              {d.events.map((x, j) => <i key={'e' + j} className="ev" style={{ left: `${x.t * 100}%` }} />)}
              {d.flash_kind && d.flash_at != null && <i className="fl" style={{ left: `${d.flash_at * 100}%` }} />}
            </div>
            <input type="range" min={0} max={1000} value={Math.round(t * 1000)} aria-label={s('adm.rp.time', 'Time')} onChange={(e) => { setMode('idle'); setT(+e.target.value / 1000); }} />
          </div>
          <span className="time">{sec(t * d.duration)} / {sec(d.duration)}</span>
        </div>
      </div>

      <div className="rped-side">
        <div className="seg">
          <button type="button" aria-pressed={tool === 'move'} onClick={() => setTool('move')}>{s('adm.rp.move', 'Drag')}</button>
          <button type="button" aria-pressed={tool === 'rec'} onClick={() => setTool('rec')}>● {s('adm.rp.record', 'Record route')}</button>
        </div>
        <p className="adm-hint muted">{tool === 'move'
          ? s('adm.rp.movehelp', 'Drag a player or the ball: that sets a keyframe at the current time. Move the time slider and drag again for the next position.')
          : s('adm.rp.rechelp', 'Hold and draw: the clock runs while you draw the route of the selected player (or the one you grab). Everyone else moves along so you can time passes.')}</p>
        {tool === 'rec' && <div className="seg"><button type="button" aria-pressed={speed === 0.5} onClick={() => setSpeed(0.5)}>0.5×</button><button type="button" aria-pressed={speed === 1} onClick={() => setSpeed(1)}>1×</button></div>}

        <div className="rped-ents" role="listbox" aria-label={s('adm.rp.ents', 'Players')}>
          {list.map((x) => <button type="button" role="option" key={String(x.sel)} aria-selected={selOk === x.sel} className={'t-' + x.team} onClick={() => setSel(x.sel)}><i />{x.label}<small>{trackOf(d, x.sel).length}</small></button>)}
          <button type="button" role="option" aria-selected={selOk === 'ball'} className="t-ball" onClick={() => setSel('ball')}><i />{s('adm.rp.ball', 'Ball')}<small>{d.ball.length}</small></button>
        </div>
        <div className="rped-btns">
          <button type="button" className="btn btn--ghost btn--sm" disabled={d.ents.length >= MAX_ENTS} onClick={() => addEnt('team')}>+ {s('adm.rp.mate', 'Teammate')}</button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={d.ents.length >= MAX_ENTS} onClick={() => addEnt('opp')}>+ {s('adm.rp.opp', 'Opponent')}</button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={keyHere < 0 || selTrack.length < 2} onClick={() => put(selOk, (tr) => tr.filter((_, j) => j !== keyHere))}>{s('adm.rp.delkey', 'Delete keyframe here')}</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { const [x, y] = where(selOk); put(selOk, () => [[0, r1(x), r1(y)]]); }}>{s('adm.rp.reset', 'Clear route')}</button>
          {selOk !== 'ball' && d.ents[selOk].team !== 'me' && <button type="button" className="btn btn--ghost btn--sm" onClick={() => { set((c) => ({ ents: c.ents.filter((_, j) => j !== selOk) })); setSel(0); }}>{s('adm.rp.delent', 'Remove player')}</button>}
        </div>

        <div className="rped-evs">
          <span className="rped-lbl">{s('adm.rp.flash', 'Highlight')}</span>
          <div className="rped-row">
            <select value={d.flash_kind} onChange={(e) => set({ flash_kind: e.target.value, flash_at: e.target.value ? d.flash_at ?? r3(t) : null })} aria-label={s('adm.rp.flash', 'Highlight')}>
              <option value="">—</option>{FLASHES.map((f) => <option key={f} value={f}>{f}</option>)}</select>
            {d.flash_kind && <button type="button" className="btn btn--ghost btn--sm" onClick={() => set({ flash_at: r3(t) })}>{s('adm.rp.at', 'At')} {sec((d.flash_at ?? 0) * d.duration)} → {sec(t * d.duration)}</button>}
          </div>
          <span className="rped-lbl">{s('adm.rp.evs', 'Captions')}</span>
          {d.events.map((x, j) => (
            <div className="rped-ev" key={j}>
              <button type="button" className="mono" title={s('adm.rp.jump', 'Go to this moment')} onClick={() => { setMode('idle'); setT(x.t); }}>{sec(x.t * d.duration)}</button>
              <input value={x.en} maxLength={80} placeholder="English" aria-label={s('adm.rp.ev_en', 'Caption — English')} onChange={(e) => set((c) => ({ events: c.events.map((y, k) => (k === j ? { ...y, en: e.target.value } : y)) }))} />
              <input value={x.nl} maxLength={80} placeholder="Nederlands" aria-label={s('adm.rp.ev_nl', 'Caption — Dutch')} onChange={(e) => set((c) => ({ events: c.events.map((y, k) => (k === j ? { ...y, nl: e.target.value } : y)) }))} />
              <button type="button" aria-label={s('adm.rp.evdel', 'Remove caption')} onClick={() => set((c) => ({ events: c.events.filter((_, k) => k !== j) }))}>×</button>
            </div>
          ))}
          {d.events.length < 10 && <button type="button" className="btn btn--ghost btn--sm" onClick={() => set((c) => ({ events: [...c.events, { t: r3(t), en: '', nl: '' }].sort((a, b) => a.t - b.t) }))}>+ {s('adm.rp.evadd', 'Caption at')} {sec(t * d.duration)}</button>}
        </div>
      </div>
    </div>
  );
}

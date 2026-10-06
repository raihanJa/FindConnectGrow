'use client';
/* Admin: draw the heatmap ("average activity zones") — click to add a zone, drag to move, slider for size */
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { HEAT_MAX, heatInner, type HeatSpot } from '@/lib/fcg';
import { pitchLines } from '@/lib/replay';
import { useLang } from './providers';

const r1 = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** spots = null → automatic zones for the position (auto); the first edit turns those into a custom heatmap. */
export function HeatEditor({ spots, setSpots, auto }: { spots: HeatSpot[] | null; setSpots: Dispatch<SetStateAction<HeatSpot[] | null>>; auto: HeatSpot[] }) {
  const { s } = useLang();
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const [sel, setSel] = useState(-1);
  const [size, setSize] = useState(10);
  const shown = spots ?? auto;
  const selOk = sel < shown.length ? sel : -1;
  const edit = (fn: (l: HeatSpot[]) => HeatSpot[]) => setSpots((o) => fn((o ?? auto).map((p) => p.slice() as HeatSpot)));
  const put = (i: number, x: number, y: number) => edit((l) => l.map((p, j) => (j === i ? [r1(clamp(x, 0, 105)), r1(clamp(y, 0, 68)), p[2]] : p)));

  const toPitch = (e: React.PointerEvent) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse());
    return [clamp(p.x, 0, 105), clamp(p.y, 0, 68)];
  };
  const hit = (x: number, y: number) => {
    let best = -1, bd = 9;
    shown.forEach(([px, py], j) => { const dd = (px - x) ** 2 + (py - y) ** 2; if (dd < bd) { bd = dd; best = j; } });
    return best;
  };
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = toPitch(e);
    let j = hit(x, y);
    if (j < 0) {
      if (shown.length >= HEAT_MAX) return;
      j = shown.length;
      edit((l) => [...l, [r1(x), r1(y), size]]);
    }
    setSel(j); setSize(shown[j]?.[2] ?? size);
    drag.current = true;
    svg.current!.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => { if (drag.current && selOk >= 0) { const [x, y] = toPitch(e); put(selOk, x, y); } };
  const up = () => { drag.current = false; };
  const key = (e: React.KeyboardEvent) => {
    if (selOk < 0) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(); return; }
    const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!dir[e.key]) return;
    e.preventDefault();
    const st = e.shiftKey ? 3 : 0.5, [x, y] = shown[selOk];
    put(selOk, x + dir[e.key][0] * st, y + dir[e.key][1] * st);
  };
  const resize = (v: number) => { setSize(v); if (selOk >= 0) edit((l) => l.map((p, j) => (j === selOk ? [p[0], p[1], v] : p))); };
  const remove = () => { edit((l) => l.filter((_, j) => j !== selOk)); setSel(-1); };

  return (
    <div className="rped-board">
      <div className="rped-main">
        <div className="reel-stage">
          <svg ref={svg} viewBox="-3 -3 111 74" tabIndex={0} className="rped-pitch rec"
            aria-label={s('adm.ht.pitch', 'Pitch: click to add a zone, drag a zone to move it. Arrow keys nudge the selected zone, Delete removes it.')}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
            <g dangerouslySetInnerHTML={{ __html: pitchLines() + heatInner(shown) }} />
            {shown.map(([x, y, r], j) => <g key={j} transform={`translate(${x},${y})`}>
              {j === selOk && <circle r={r} className="rped-sel" />}
              <circle r={j === selOk ? 1.1 : 0.8} fill="#fff" fillOpacity={spots ? 0.9 : 0.4} stroke="#0A1730" strokeWidth=".3" />
            </g>)}
          </svg>
          <div className="reel-cap"><span className="live">{spots ? s('adm.ht.custom', 'Drawn by hand') : s('adm.ht.auto', 'Automatic')}</span><span>{`${shown.length}/${HEAT_MAX}`}</span></div>
        </div>
      </div>

      <div className="rped-side">
        <p className="adm-hint muted">{spots && !spots.length
          ? s('adm.ht.empty', 'Click on the pitch to add zones. Saved without zones, the profile shows the automatic ones.')
          : spots ? s('adm.ht.help', 'Click on the pitch to add a zone, drag a zone to move it. Bigger zones = more time spent there.')
          : s('adm.ht.autohelp', 'These are automatic zones based on the position. Click or drag on the pitch to start adjusting them.')}</p>
        <label className="field"><span>{selOk >= 0 ? s('adm.ht.size', 'Size of selected zone') : s('adm.ht.newsize', 'Size of new zones')}</span>
          <input type="range" min={3} max={20} step={0.5} value={selOk >= 0 ? shown[selOk][2] : size} onChange={(e) => resize(+e.target.value)} /></label>
        <button type="button" className="btn btn--ghost btn--sm" disabled={selOk < 0} onClick={remove}>{s('adm.ht.del', 'Remove zone')}</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={!shown.length} onClick={() => { setSpots([]); setSel(-1); }}>{s('adm.ht.clear', 'Empty pitch')}</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={!spots} onClick={() => { setSpots(null); setSel(-1); }}>{s('adm.ht.reset', 'Back to automatic')}</button>
      </div>
    </div>
  );
}

/* FCG — pure helpers: translation lookup, seeded random, generative graphics (as SVG markup) */
import type { Loc, Talent } from './data';
import { NL, TX } from './i18n';

export type Lang = 'en' | 'nl';

/* ---------- i18n ---------- */
export const loc = (lang: Lang, o?: Partial<Loc> | null) => (o ? (o[lang] != null ? o[lang]! : o.en ?? '') : '');
export const tx = (lang: Lang, k: string) => { const e = TX[k]; return e ? loc(lang, e) : k; };
/** Static copy: English lives inline in the markup, Dutch in the NL dictionary. */
export const sx = (lang: Lang, k: string, en: string) => (lang === 'nl' && NL[k] != null ? NL[k] : en);

export const month = (lang: Lang, ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { month: 'short', year: 'numeric' });
};

/* ---------- seeded random ---------- */
export function hash(str: string) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function closedCurve(p: number[][]) {
  const n = p.length; let d = `M${p[0][0].toFixed(2)},${p[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

/* Generative "signature" portrait — a unique contour fingerprint per talent.
   Replaces photos: we never publish faces of minors. Returns the inner <path>s. */
export function signaturePaths(id: string, rings = 17) {
  const r = rng(hash(id));
  const cx = 50 + (r() - 0.5) * 18, cy = 50 + (r() - 0.5) * 18;
  const harm = [1, 2, 3, 4, 6].map((k) => ({ k, p: r() * 6.283, a: 0.3 + r() * 0.9 }));
  const hot = 4 + Math.floor(r() * (rings - 7));
  let out = '';
  for (let i = 0; i < rings; i++) {
    const base = 3 + i * 3.7, amp = 0.5 + i * 0.36, pts: number[][] = [];
    for (let j = 0; j < 56; j++) {
      const th = (j / 56) * Math.PI * 2;
      let rr = base;
      harm.forEach((h) => { rr += Math.sin(th * h.k + h.p + i * 0.21) * amp * h.a / Math.sqrt(h.k); });
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
    }
    const cls = i === hot ? ' stroke="#1463F3" stroke-width="1.5" opacity="1"' : '';
    out += `<path d="${closedCurve(pts)}"${cls}/>`;
  }
  return out;
}

/* Mini pitch with position marker */
const POSXY: Record<string, [number, number]> = { GK: [6, 50], CB: [22, 50], FB: [27, 14], DM: [40, 50], CM: [52, 50], AM: [66, 50], W: [79, 14], ST: [87, 50] };
export function posXY(t: Talent): [number, number] {
  let [x, y] = POSXY[t.pos];
  if ((t.pos === 'FB' || t.pos === 'W') && t.foot === 'R') y = 100 - y;
  return [x, y];
}
export function pitchMiniInner(t: Talent) {
  const [x, y] = posXY(t);
  return `<g fill="none" stroke="#0C1C36" stroke-width=".9" opacity=".55">
      <rect x="1" y="1" width="98" height="62"/><line x1="50" y1="1" x2="50" y2="63"/><circle cx="50" cy="32" r="8"/>
      <rect x="1" y="16" width="15" height="32"/><rect x="84" y="16" width="15" height="32"/></g>
      <circle cx="${x}" cy="${(y * 0.64).toFixed(1)}" r="8" fill="#1463F3" opacity=".2"/>
      <circle cx="${x}" cy="${(y * 0.64).toFixed(1)}" r="4.2" fill="#1463F3"/>`;
}

/* Heatmap: zones [x, y, r] in metres on a 105×68 pitch (attacking → right) */
export type HeatSpot = [number, number, number];
export const HEAT_MAX = 20;
const r1 = (v: number) => Math.round(v * 10) / 10;
/** Automatic zones around the position (used when no heatmap was drawn in the admin portal) */
export function autoHeat(t: Pick<Talent, 'id' | 'pos' | 'foot' | 'group'>): HeatSpot[] {
  const rr = rng(hash(t.id + 'heat'));
  const [px, py] = posXY(t as Talent);
  const cx = (px / 100) * 105, cy = (py / 100) * 68;
  const spread = { gk: [6, 8], def: [16, 12], mid: [22, 16], att: [20, 14] }[t.group];
  const blobs = [[cx, cy, 14]];
  for (let i = 0; i < 9; i++) blobs.push([cx + (rr() - 0.5) * spread[0] * 2, cy + (rr() - 0.5) * spread[1] * 2, 6 + rr() * 9]);
  return blobs.map(([x, y, r]) => [r1(Math.max(2, Math.min(103, x))), r1(Math.max(2, Math.min(66, y))), r1(r)]);
}
export function heatInner(spots: HeatSpot[]) {
  let s = '<defs><radialGradient id="hg"><stop offset="0" stop-color="#8FB3FF" stop-opacity=".9"/><stop offset=".45" stop-color="#1463F3" stop-opacity=".45"/><stop offset="1" stop-color="#1463F3" stop-opacity="0"/></radialGradient></defs><g style="mix-blend-mode:screen">';
  spots.forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#hg)"/>`; });
  return s + '</g>';
}

/* Radar chart */
export type RadarSet = { values: number[]; color: string; fill?: number; dash?: boolean };
export function radarInner(labels: string[], sets: RadarSet[], opt: { size?: number; values?: boolean } = {}) {
  const S = opt.size || 320, c = S / 2, R = S * 0.34, n = 6;
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v]; };
  let g = '';
  [0.25, 0.5, 0.75, 1].forEach((k) => { g += `<polygon class="ring" points="${[...Array(n)].map((_, i) => pt(i, k).join(',')).join(' ')}"/>`; });
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, 1); g += `<line class="spoke" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`;
    const [lx, ly] = pt(i, 1.2);
    const anchor = Math.abs(lx - c) < 4 ? 'middle' : lx > c ? 'start' : 'end';
    g += `<text class="lbl" x="${lx}" y="${ly + 3}" text-anchor="${anchor}">${labels[i]}</text>`;
  }
  sets.forEach((s, si) => {
    const pts = s.values.map((v, i) => pt(i, v / 100));
    g += `<g class="shp" style="animation-delay:${si * 0.12}s"><polygon class="shape" points="${pts.map((p) => p.join(',')).join(' ')}" fill="${s.color}" fill-opacity="${s.fill == null ? 0.14 : s.fill}" stroke="${s.color}" ${s.dash ? 'stroke-dasharray="4 3"' : ''}/>`;
    pts.forEach((p) => { g += `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="3" fill="${s.color}"/>`; });
    if (opt.values && si === 0) s.values.forEach((v, i) => { const [x, y] = pt(i, v / 100 + 0.1); g += `<text class="val" x="${x}" y="${y + 3}" text-anchor="middle">${v}</text>`; });
    g += '</g>';
  });
  return g;
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

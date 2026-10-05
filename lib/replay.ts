/* Tactical replay: clip model, built-in templates and drawing helpers (pitch 105 × 68, attacking → right).
   Public replays are animated reconstructions — never real footage (safeguarding). */
import type { Loc, PosKey, Talent } from './data';
import { hash, rng } from './fcg';

export type Track = number[][]; // [t 0–1, x 0–105, y 0–68]
export type Team = 'me' | 'team' | 'opp';
export type Clip = { dur: number; title: Loc; flash?: [number, string]; ents: [Team, Track][]; ball: Track; ev: [number, Loc][] };
/** A clip as shown in the reel: minute in the match, match label, optionally mirrored to the other flank. */
export type ReelClip = Clip & { mirror: boolean; min: number; match: Loc };
export const FLASHES = ['GOAL', 'ASSIST', 'SAVE', 'CLEARED'] as const;

const E = (en: string, nl: string): Loc => ({ en, nl });
export const CLIPS: Record<string, Clip> = {
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
export const BY_POS: Record<PosKey, string[]> = { GK: ['save', 'dist', 'save'], CB: ['clear', 'intercept', 'press'], FB: ['intercept', 'press', 'through'], DM: ['press', 'intercept', 'through'],
  CM: ['through', 'press', 'intercept'], AM: ['through', 'solo', 'intercept'], W: ['solo', 'through', 'press'], ST: ['header', 'solo', 'press'] };
export const MATCHES = [E('Regional U19 select', 'Regionale O19-selectie'), E('Camp league final', 'Kampcompetitie finale'), E('Street tournament', 'Straattoernooi')];

/** Automatic moments for talents without hand-drawn replays: three templates picked by position. */
export function autoClips(t: Pick<Talent, 'id' | 'pos'>): ReelClip[] {
  const r = rng(hash(t.id + 'reel'));
  const cs = BY_POS[t.pos].map((k, i) => ({ ...CLIPS[k], mirror: (i === 2 && k === BY_POS[t.pos][0]) ? true : r() > 0.5, min: 8 + Math.floor(r() * 80), match: MATCHES[0] }));
  return cs.sort((a, b) => a.min - b.min).map((c, i) => ({ ...c, match: MATCHES[i] }));
}

const sm = (u: number) => u * u * (3 - 2 * u);
/** Position on a track at time tt. Long segments (hand-placed keyframes) are eased; dense recorded routes stay linear. */
export function at(track: Track, tt: number, smooth: boolean, mirror: boolean) {
  let i = 0; while (i < track.length - 2 && tt > track[i + 1][0]) i++;
  const a = track[i], b = track[i + 1] || a;
  const u = b[0] === a[0] ? 1 : Math.max(0, Math.min(1, (tt - a[0]) / (b[0] - a[0])));
  const e = smooth && b[0] - a[0] >= 0.05 ? sm(u) : u;
  const x = a[1] + (b[1] - a[1]) * e, y = a[2] + (b[2] - a[2]) * e;
  return [x, mirror ? 68 - y : y];
}

export function pitchLines() {
  let s = '';
  for (let i = 0; i < 10; i++) if (i % 2) s += `<rect class="stripe" x="${i * 10.5}" y="0" width="10.5" height="68"/>`;
  s += `<g class="pl"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><circle cx="52.5" cy="34" r=".4" fill="rgba(255,255,255,.6)"/>
      <rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/>
      <rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/>
      <rect x="-1.6" y="30.34" width="1.6" height="7.32"/><rect x="105" y="30.34" width="1.6" height="7.32"/>
      <path d="M16.5,26.7 A9.15,9.15 0 0,1 16.5,41.3"/><path d="M88.5,26.7 A9.15,9.15 0 0,0 88.5,41.3"/></g>`;
  return s;
}

/* FCG content model — the data itself lives in Supabase (see lib/site-data.ts).
   All talent profiles are fictional. Safeguarding by design: first name + initial only, no photos. */
import type { ReelClip } from './replay';

export type Loc = { en: string; nl: string };
export type Region = { name: Loc; place: string; ll: [number, number]; iso: string[]; since: number; scouts: number; note: Loc };
export type Place = { key: string; name: string; ll: [number, number] };
export type PosKey = 'GK' | 'CB' | 'FB' | 'DM' | 'CM' | 'AM' | 'W' | 'ST';
export type GroupKey = 'gk' | 'def' | 'mid' | 'att';
export type Talent = {
  id: string; name: string; g: 'm' | 'f'; age: number; pos: PosKey; foot: 'L' | 'R' | 'B'; h: number; no: number;
  region: string; city: string; status: number; joined: string; trialCity?: string;
  a: number[]; st: { m: number; g?: number; as?: number; cs?: number; sv?: number }; traits: string[];
  bio: Loc; quote: Loc; ovr: number; group: GroupKey;
  /** hand-drawn tactical replay moments (admin portal); empty = automatic moments for the position */
  clips: ReelClip[];
};
export type Tier = { key: string; name: string; price: number | null; featured: boolean };
export type ImpactItem = { k: string; cost: number };
export type Alloc = { key: string; label: Loc; pct: number };
export type TeamMember = { initials: string; role: Loc };
export type Metric = { key: string; value: number; suffix: string; label: Loc };

/** Everything the pages render, in display order. Records keep their insertion (= DB sort) order. */
export type SiteData = {
  REGIONS: Record<string, Region>;
  HUB: Place; ACADEMIES: Place[];
  POS: Record<PosKey, Loc & { g: GroupKey }>;
  GROUPS: Record<GroupKey, Loc>;
  STATUS: Loc[]; ATTR: Loc[];
  TRAITS: Record<string, Loc>;
  TALENTS: Talent[];
  TIERS: Tier[]; IMPACT: ImpactItem[]; ALLOC: Alloc[]; TEAM: TeamMember[]; METRICS: Record<string, Metric>;
};

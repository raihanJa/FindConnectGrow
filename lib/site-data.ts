/* Server-side loader: reads all public content from Supabase and maps it onto the shapes the pages use. */
import { cache } from 'react';
import type { GroupKey, Loc, PosKey, SiteData, Talent } from './data';
import { supabase } from './supabase';

/** Pages are statically rendered and refreshed from Supabase at most every 5 minutes (ISR). */
export const REVALIDATE = 300;

const L = (o: Record<string, unknown>, f: string): Loc => ({ en: o[f + '_en'] as string, nl: o[f + '_nl'] as string });
function must<T>(r: { data: T | null; error: { message: string } | null }, what: string): T {
  if (r.error || !r.data) throw new Error(`Supabase: loading ${what} failed — ${r.error?.message ?? 'no data'}`);
  return r.data;
}

export const loadSiteData = cache(async (): Promise<SiteData> => {
  const [regions, locations, groups, positions, statuses, attrs, traits, talents, tiers, impact, alloc, team, metrics] = await Promise.all([
    supabase.from('regions').select('*').order('sort'),
    supabase.from('locations').select('*').order('sort'),
    supabase.from('position_groups').select('*').order('sort'),
    supabase.from('positions').select('*').order('sort'),
    supabase.from('statuses').select('*').order('id'),
    supabase.from('attributes').select('*').order('idx'),
    supabase.from('traits').select('*'),
    supabase.from('talents_public').select('*').order('sort'),
    supabase.from('partnership_tiers').select('*').order('sort'),
    supabase.from('donation_impact_items').select('*').order('sort'),
    supabase.from('fund_allocation').select('*').order('sort'),
    supabase.from('team_members').select('*').order('sort'),
    supabase.from('site_metrics').select('*').order('sort')
  ]);

  const places = must(locations, 'locations').map((l) => ({ key: l.key, name: l.name, ll: [l.lng, l.lat] as [number, number], kind: l.kind }));
  const hub = places.find((p) => p.kind === 'hub');
  if (!hub) throw new Error('Supabase: no hub location');

  return {
    REGIONS: Object.fromEntries(must(regions, 'regions').map((r) => [r.key, {
      name: L(r, 'name'), place: r.place, ll: [r.lng, r.lat], iso: r.iso_codes, since: r.active_since, scouts: r.scouts, note: L(r, 'note')
    }])),
    HUB: hub,
    ACADEMIES: places.filter((p) => p.kind === 'academy'),
    POS: Object.fromEntries(must(positions, 'positions').map((p) => [p.key, { ...L(p, 'label'), g: p.group_key as GroupKey }])) as SiteData['POS'],
    GROUPS: Object.fromEntries(must(groups, 'position groups').map((g) => [g.key, L(g, 'label')])) as SiteData['GROUPS'],
    STATUS: must(statuses, 'statuses').map((s) => L(s, 'label')),
    ATTR: must(attrs, 'attributes').map((a) => L(a, 'label')),
    TRAITS: Object.fromEntries(must(traits, 'traits').map((t) => [t.key, L(t, 'label')])),
    TALENTS: must(talents, 'talents').map((t): Talent => {
      const st: Talent['st'] = { m: t.matches ?? 0 };
      if (t.goals != null) st.g = t.goals;
      if (t.assists != null) st.as = t.assists;
      if (t.clean_sheets != null) st.cs = t.clean_sheets;
      if (t.saves != null) st.sv = t.saves;
      return {
        id: t.id!, name: t.name!, g: t.g as Talent['g'], age: t.age!, pos: t.pos as PosKey, foot: t.foot as Talent['foot'], h: t.h!, no: t.no!,
        region: t.region!, city: t.city!, status: t.status!, joined: t.joined!, ...(t.trial_city ? { trialCity: t.trial_city } : {}),
        a: t.a!, st, traits: t.traits ?? [], bio: L(t, 'bio'), quote: L(t, 'quote'), ovr: t.ovr!, group: t.group as GroupKey
      };
    }),
    TIERS: must(tiers, 'partnership tiers').map((t) => ({ key: t.key, name: t.name, price: t.price_eur, featured: t.featured })),
    IMPACT: must(impact, 'impact items').map((i) => ({ k: i.key, cost: i.cost_eur })),
    ALLOC: must(alloc, 'fund allocation').map((a) => ({ key: a.key, label: L(a, 'label'), pct: a.percent })),
    TEAM: must(team, 'team').map((m) => ({ initials: m.initials, role: L(m, 'role') })),
    METRICS: Object.fromEntries(must(metrics, 'site metrics').map((m) => [m.key, { key: m.key, value: m.value, suffix: m.suffix, label: L(m, 'label') }]))
  };
});

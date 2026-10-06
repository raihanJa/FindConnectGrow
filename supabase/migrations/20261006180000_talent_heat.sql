-- Heatmap ("average activity zones") per talent, drawn in the admin portal.
-- heat = [[x, y, r], …]  x 0–105 and y 0–68 metres on the pitch (attacking → right), r = zone radius in metres.
-- null = automatic zones based on position (lib/fcg.ts autoHeat).

create function public.valid_heat(h jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(h) = 'array' and jsonb_array_length(h) between 1 and 20 and not exists (
    select 1 from jsonb_array_elements(h) p
    where jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> 3
       or jsonb_typeof(p -> 0) <> 'number' or jsonb_typeof(p -> 1) <> 'number' or jsonb_typeof(p -> 2) <> 'number'
       or (p ->> 0)::numeric not between 0 and 105 or (p ->> 1)::numeric not between 0 and 68 or (p ->> 2)::numeric not between 3 and 20)
$$;

alter table public.talents add column heat jsonb check (heat is null or public.valid_heat(heat));

-- same view as 20261006120000_talent_archive.sql, plus heat (appended)
create or replace view public.talents_public with (security_invoker = true) as
select
  t.id, t.display_name as name, t.gender as g, t.age, t.position_key as pos, p.group_key as "group",
  t.foot, t.height_cm as h, t.shirt_no as no, t.region_key as region, t.city, t.status_id as status,
  to_char(t.joined_on, 'YYYY-MM') as joined, l.name as trial_city,
  array[t.pace, t.technique, t.vision, t.physical, t.work_rate, t.composure] as a,
  round(t.pace * p.ovr_weights[1] + t.technique * p.ovr_weights[2] + t.vision * p.ovr_weights[3]
      + t.physical * p.ovr_weights[4] + t.work_rate * p.ovr_weights[5] + t.composure * p.ovr_weights[6])::int as ovr,
  t.matches, t.goals, t.assists, t.clean_sheets, t.saves,
  coalesce((select array_agg(tt.trait_key order by tt.sort) from public.talent_traits tt where tt.talent_id = t.id), '{}') as traits,
  t.bio_en, t.bio_nl, t.quote_en, t.quote_nl,
  t.sort,
  t.heat
from public.talents t
join public.positions p on p.key = t.position_key
left join public.locations l on l.key = t.trial_location_key
where t.published and t.archived_at is null;

-- Set (array) or reset to automatic (null) a talent's heatmap. Called by the admin portal after create_talent / update_talent.
create function public.set_talent_heat(p_id text, p_heat jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.talents set heat = case when jsonb_typeof(p_heat) = 'array' then p_heat end, updated_at = now() where id = p_id;
  if not found then raise exception 'talent % not found', p_id using errcode = 'P0002'; end if;
end $$;
revoke all on function public.set_talent_heat from public, anon;
grant execute on function public.set_talent_heat to authenticated;

-- Display order of talents (portal default, prev/next on profiles, /talent redirect target)
alter table public.talents add column sort smallint not null default 0;
create index on public.talents (sort);

update public.talents t set sort = o.n from (values
  ('omar-h', 0), ('maksym-k', 1), ('deng-m', 2), ('grace-k', 3), ('yazan-k', 4), ('liliia-p', 5), ('mahmoud-a', 6),
  ('ammar-y', 7), ('abdelrahman-o', 8), ('peter-l', 9), ('josue-m', 10), ('farid-n', 11), ('shabnam-r', 12), ('abdi-w', 13),
  ('hodan-a', 14), ('ibrahim-t', 15), ('moussa-k', 16), ('artem-s', 17), ('karim-s', 18), ('amina-e', 19)
) as o(id, n) where t.id = o.id;

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
  t.sort
from public.talents t
join public.positions p on p.key = t.position_key
left join public.locations l on l.key = t.trial_location_key
where t.published;

-- Admin portal: archive talents (never delete) and let admins update them.
-- An archived talent is hidden from the public site (view, RLS, dossier requests) but stays in the database,
-- so it can be restored. Admins still see everything through the "admins read all" policies.

alter table public.talents add column archived_at timestamptz;
create index on public.talents (archived_at);

-- ---------- public visibility: published and not archived ----------
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
where t.published and t.archived_at is null;

alter policy "public read published" on public.talents using (published and archived_at is null);
alter policy "public read published" on public.talent_traits
  using (exists (select 1 from public.talents t where t.id = talent_id and t.published and t.archived_at is null));
alter policy "public read published" on public.talent_clips
  using (exists (select 1 from public.talents t where t.id = talent_id and t.published and t.archived_at is null));

create or replace function public.submit_dossier_request(
  p_name text, p_club text, p_role text, p_email text, p_message text,
  p_nda_accepted boolean, p_talent_ids text[], p_lang text default 'en'
) returns void
language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
  if cardinality(p_talent_ids) > 20 then raise exception 'too many talents'; end if;
  insert into public.dossier_requests (name, club, role, email, message, nda_accepted, lang)
  values (p_name, p_club, p_role, p_email, nullif(p_message, ''), p_nda_accepted, p_lang)
  returning id into rid;
  insert into public.dossier_request_talents (request_id, talent_id)
  select rid, t.id from public.talents t where t.published and t.archived_at is null and t.id = any (coalesce(p_talent_ids, '{}'));
end $$;

-- ---------- admins may update talents (no delete on talents: archiving is the only way out) ----------
grant update on public.talents to authenticated;
create policy "admins edit" on public.talents for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Archive (hide from the site, keep the data) or restore a talent.
create function public.set_talent_archived(p_id text, p_archived boolean) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.talents set archived_at = case when p_archived then coalesce(archived_at, now()) end, updated_at = now() where id = p_id;
  if not found then raise exception 'talent % not found', p_id using errcode = 'P0002'; end if;
end $$;
revoke all on function public.set_talent_archived from public, anon;
grant execute on function public.set_talent_archived to authenticated;

-- Admin: link talents to centres. Kept separate from 20261006140000_centres.sql because the Supabase MCP
-- declines SQL containing DELETE; run this file in the Supabase SQL editor.
-- Also tightens grants on the new tables (RLS already blocks writes; this mirrors the rest of the schema).

revoke insert, update, delete, truncate on public.centre_kinds, public.centres from anon, authenticated;
revoke all on public.talent_centres from anon;
revoke update, truncate on public.talent_centres from authenticated;
revoke all on function public.centre_talent_counts from public;
grant execute on function public.centre_talent_counts to anon, authenticated;

-- Replace a talent's centre links (admins only). Used by create_talent / update_talent via p.centres.
create function public.set_talent_centres(p_id text, p_centres text[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if cardinality(p_centres) > 5 then raise exception 'at most 5 centres'; end if;
  delete from public.talent_centres where talent_id = p_id;
  insert into public.talent_centres (talent_id, centre_key, sort)
  select p_id, k, min(i) - 1 from unnest(coalesce(p_centres, '{}')) with ordinality as x(k, i) group by k;
end $$;
revoke all on function public.set_talent_centres from public, anon;
grant execute on function public.set_talent_centres to authenticated;

-- create_talent / update_talent: same as before, plus p.centres (text[] of centre keys).
-- update_talent only touches the links when p contains "centres".
create or replace function public.create_talent(p jsonb, p_traits text[] default '{}') returns text
language plpgsql security invoker set search_path = '' as $$
declare base text := p ->> 'id'; tid text := p ->> 'id'; n int := 1; p_clips jsonb := coalesce(p -> 'clips', '[]');
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if cardinality(p_traits) > 4 then raise exception 'at most 4 traits'; end if;
  if jsonb_typeof(p_clips) <> 'array' or jsonb_array_length(p_clips) > 5 then raise exception 'at most 5 replay moments'; end if;
  while exists (select 1 from public.talents t where t.id = tid) loop n := n + 1; tid := base || '-' || n; end loop;
  insert into public.talents (id, display_name, gender, age, position_key, foot, height_cm, shirt_no, region_key, city, status_id,
    joined_on, trial_location_key, pace, technique, vision, physical, work_rate, composure, matches, goals, assists, clean_sheets, saves,
    bio_en, bio_nl, quote_en, quote_nl, published, sort)
  values (tid, p ->> 'display_name', p ->> 'gender', (p ->> 'age')::smallint, p ->> 'position_key', p ->> 'foot',
    (p ->> 'height_cm')::smallint, (p ->> 'shirt_no')::smallint, p ->> 'region_key', p ->> 'city', (p ->> 'status_id')::smallint,
    (p ->> 'joined_on')::date, nullif(p ->> 'trial_location_key', ''),
    (p ->> 'pace')::smallint, (p ->> 'technique')::smallint, (p ->> 'vision')::smallint, (p ->> 'physical')::smallint,
    (p ->> 'work_rate')::smallint, (p ->> 'composure')::smallint, (p ->> 'matches')::smallint, (p ->> 'goals')::smallint,
    (p ->> 'assists')::smallint, (p ->> 'clean_sheets')::smallint, (p ->> 'saves')::smallint,
    p ->> 'bio_en', p ->> 'bio_nl', p ->> 'quote_en', p ->> 'quote_nl', coalesce((p ->> 'published')::boolean, true),
    coalesce((select max(t.sort) + 1 from public.talents t), 0));
  insert into public.talent_traits (talent_id, trait_key, sort)
  select tid, k, i - 1 from unnest(coalesce(p_traits, '{}')) with ordinality as x(k, i);
  insert into public.talent_clips (talent_id, sort, minute, title_en, title_nl, match_en, match_nl, duration, flash_kind, flash_at, ents, ball, events)
  select tid, i - 1, (c ->> 'minute')::smallint, trim(c ->> 'title_en'), trim(c ->> 'title_nl'), trim(c ->> 'match_en'), trim(c ->> 'match_nl'),
    (c ->> 'duration')::numeric, nullif(c ->> 'flash_kind', ''), (c ->> 'flash_at')::real, c -> 'ents', c -> 'ball', coalesce(c -> 'events', '[]')
  from jsonb_array_elements(p_clips) with ordinality as x(c, i);
  if p ? 'centres' then
    perform public.set_talent_centres(tid, array(select jsonb_array_elements_text(p -> 'centres')));
  end if;
  return tid;
end $$;

create or replace function public.update_talent(p jsonb, p_traits text[] default '{}') returns text
language plpgsql security invoker set search_path = '' as $$
declare tid text := p ->> 'id'; p_clips jsonb := coalesce(p -> 'clips', '[]');
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if cardinality(p_traits) > 4 then raise exception 'at most 4 traits'; end if;
  if jsonb_typeof(p_clips) <> 'array' or jsonb_array_length(p_clips) > 5 then raise exception 'at most 5 replay moments'; end if;
  update public.talents set
    display_name = p ->> 'display_name', gender = p ->> 'gender', age = (p ->> 'age')::smallint, position_key = p ->> 'position_key',
    foot = p ->> 'foot', height_cm = (p ->> 'height_cm')::smallint, shirt_no = (p ->> 'shirt_no')::smallint, region_key = p ->> 'region_key',
    city = p ->> 'city', status_id = (p ->> 'status_id')::smallint, joined_on = (p ->> 'joined_on')::date,
    trial_location_key = nullif(p ->> 'trial_location_key', ''),
    pace = (p ->> 'pace')::smallint, technique = (p ->> 'technique')::smallint, vision = (p ->> 'vision')::smallint,
    physical = (p ->> 'physical')::smallint, work_rate = (p ->> 'work_rate')::smallint, composure = (p ->> 'composure')::smallint,
    matches = (p ->> 'matches')::smallint, goals = (p ->> 'goals')::smallint, assists = (p ->> 'assists')::smallint,
    clean_sheets = (p ->> 'clean_sheets')::smallint, saves = (p ->> 'saves')::smallint,
    bio_en = p ->> 'bio_en', bio_nl = p ->> 'bio_nl', quote_en = p ->> 'quote_en', quote_nl = p ->> 'quote_nl',
    published = coalesce((p ->> 'published')::boolean, published), updated_at = now()
  where id = tid;
  if not found then raise exception 'talent % not found', tid using errcode = 'P0002'; end if;
  delete from public.talent_traits where talent_id = tid;
  insert into public.talent_traits (talent_id, trait_key, sort)
  select tid, k, i - 1 from unnest(coalesce(p_traits, '{}')) with ordinality as x(k, i);
  delete from public.talent_clips where talent_id = tid;
  insert into public.talent_clips (talent_id, sort, minute, title_en, title_nl, match_en, match_nl, duration, flash_kind, flash_at, ents, ball, events)
  select tid, i - 1, (c ->> 'minute')::smallint, trim(c ->> 'title_en'), trim(c ->> 'title_nl'), trim(c ->> 'match_en'), trim(c ->> 'match_nl'),
    (c ->> 'duration')::numeric, nullif(c ->> 'flash_kind', ''), (c ->> 'flash_at')::real, c -> 'ents', c -> 'ball', coalesce(c -> 'events', '[]')
  from jsonb_array_elements(p_clips) with ordinality as x(c, i);
  if p ? 'centres' then
    perform public.set_talent_centres(tid, array(select jsonb_array_elements_text(p -> 'centres')));
  end if;
  return tid;
end $$;

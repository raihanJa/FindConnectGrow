-- Admin portal: edit an existing talent. Traits and replay moments are replaced as a whole,
-- so admins may delete those child rows (never the talent itself).
grant delete on public.talent_traits, public.talent_clips to authenticated;
create policy "admins remove" on public.talent_traits for delete to authenticated using ((select public.is_admin()));
create policy "admins remove" on public.talent_clips for delete to authenticated using ((select public.is_admin()));

-- Same payload as create_talent; p.id must exist. The id (slug, used in URLs) never changes.
-- Traits and replay moments are replaced as a whole.
create function public.update_talent(p jsonb, p_traits text[] default '{}') returns text
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
  return tid;
end $$;
revoke all on function public.update_talent from public, anon;
grant execute on function public.update_talent to authenticated;


-- Hand-drawn tactical replay moments per talent (admin portal replay editor).
-- Safeguarding: these are animated reconstructions drawn by staff, never real footage.
-- A talent without clips keeps the automatic moments for its position (lib/replay.ts).
--
-- ents   = [{ "team": "me" | "team" | "opp", "track": [[t, x, y], …] }, …]   exactly one "me" (the talent)
-- ball   = [[t, x, y], …]
-- events = [{ "t": 0.42, "en": "Beats the first defender", "nl": "Passeert de eerste verdediger" }, …]
-- t runs 0–1 over the clip, x 0–105 and y 0–68 metres on the pitch (attacking → right), a little margin allowed.

create function public.valid_track(tr jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(tr) = 'array' and jsonb_array_length(tr) between 1 and 400 and not exists (
    select 1 from jsonb_array_elements(tr) p
    where jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> 3
       or jsonb_typeof(p -> 0) <> 'number' or jsonb_typeof(p -> 1) <> 'number' or jsonb_typeof(p -> 2) <> 'number'
       or (p ->> 0)::numeric not between 0 and 1 or (p ->> 1)::numeric not between -5 and 110 or (p ->> 2)::numeric not between -5 and 73)
$$;

create function public.valid_clip_ents(e jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(e) = 'array' and jsonb_array_length(e) between 1 and 23
    and (select count(*) from jsonb_array_elements(e) x where x ->> 'team' = 'me') = 1
    and not exists (
      select 1 from jsonb_array_elements(e) x
      where jsonb_typeof(x) <> 'object' or coalesce(x ->> 'team', '') not in ('me', 'team', 'opp') or not public.valid_track(x -> 'track'))
$$;

create function public.valid_clip_events(e jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(e) = 'array' and jsonb_array_length(e) <= 10 and not exists (
    select 1 from jsonb_array_elements(e) x
    where jsonb_typeof(x) <> 'object' or jsonb_typeof(x -> 't') <> 'number' or (x ->> 't')::numeric not between 0 and 1
       or jsonb_typeof(x -> 'en') <> 'string' or jsonb_typeof(x -> 'nl') <> 'string'
       or length(x ->> 'en') not between 1 and 80 or length(x ->> 'nl') not between 1 and 80)
$$;

create table public.talent_clips (
  talent_id text not null references public.talents (id) on delete cascade,
  sort smallint not null check (sort between 0 and 4),
  minute smallint not null check (minute between 1 and 120),
  title_en text not null check (length(title_en) between 1 and 60),
  title_nl text not null check (length(title_nl) between 1 and 60),
  match_en text not null check (length(match_en) between 1 and 60),
  match_nl text not null check (length(match_nl) between 1 and 60),
  duration numeric(3, 1) not null check (duration between 3 and 15),   -- seconds at 1× speed
  flash_kind text check (flash_kind in ('GOAL', 'ASSIST', 'SAVE', 'CLEARED')),
  flash_at real check (flash_at between 0 and 1),
  ents jsonb not null check (public.valid_clip_ents(ents)),
  ball jsonb not null check (public.valid_track(ball)),
  events jsonb not null default '[]' check (public.valid_clip_events(events)),
  primary key (talent_id, sort),
  check ((flash_kind is null) = (flash_at is null))
);
alter table public.talent_clips enable row level security;
create policy "public read published" on public.talent_clips for select to anon, authenticated
  using (exists (select 1 from public.talents t where t.id = talent_id and t.published));
create policy "admins read all" on public.talent_clips for select to authenticated using ((select public.is_admin()));
create policy "admins add" on public.talent_clips for insert to authenticated with check ((select public.is_admin()));
grant insert on public.talent_clips to authenticated;

-- create_talent also takes the replay moments, as p.clips (max 5): [{ minute, title_en, title_nl, match_en, match_nl, duration, flash_kind, flash_at, ents, ball, events }]
-- (same signature as before: the function is replaced in place)
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
  return tid;
end $$;
revoke all on function public.create_talent from public, anon;
grant execute on function public.create_talent to authenticated;

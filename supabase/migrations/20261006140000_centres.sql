-- Centres: asylum seekers' centres in Europe, refugee camps, schools and community programmes where FCG scouts or has scouted.
-- Talents can be linked to the centre(s) where they were scouted.
--
-- Safeguarding by design:
--   * a centre is shown at city level only; coordinates are stored with 1 decimal (~10 km), never an address;
--   * which talent was scouted at which centre is NOT public (it would reveal where a, often minor, player lives).
--     Visitors only get the number of public talents per centre (centre_talent_counts()); admins see the links.
-- Archiving instead of deleting, like talents: archived_at set = hidden from the site, kept in the database.

create table public.centre_kinds (
  key text primary key,
  label_en text not null,
  label_nl text not null,
  sort smallint not null
);

create table public.centres (
  key text primary key check (key ~ '^[a-z0-9-]+$'),
  kind_key text not null references public.centre_kinds (key),
  name_en text not null check (length(name_en) between 1 and 120),
  name_nl text not null check (length(name_nl) between 1 and 120),
  city text not null check (length(city) between 1 and 80),          -- city / area, never an address
  country text not null check (country ~ '^[A-Z]{2}$'),               -- ISO 3166-1 alpha-2, labels via Intl.DisplayNames
  region_key text references public.regions (key),                    -- scouting region it serves (null = none, e.g. an azc)
  lng numeric(4, 1) not null check (lng between -180 and 180),        -- 1 decimal on purpose: approximate only
  lat numeric(3, 1) not null check (lat between -90 and 90),
  active_since smallint not null check (active_since between 2020 and 2100),
  active_until smallint check (active_until >= active_since),         -- null = FCG is scouting here now
  scouts smallint not null default 0 check (scouts >= 0),
  note_en text not null default '',
  note_nl text not null default '',
  published boolean not null default true,
  archived_at timestamptz,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.centres (kind_key);
create index on public.centres (region_key);
create trigger centres_touch before update on public.centres
  for each row execute function public.touch_updated_at();

create table public.talent_centres (
  talent_id text not null references public.talents (id) on delete cascade,
  centre_key text not null references public.centres (key),
  sort smallint not null default 0,
  primary key (talent_id, centre_key)
);
create index on public.talent_centres (centre_key);

-- ---------- row level security ----------
alter table public.centre_kinds enable row level security;
alter table public.centres enable row level security;
alter table public.talent_centres enable row level security;

create policy "public read" on public.centre_kinds for select to anon, authenticated using (true);
create policy "public read published" on public.centres for select to anon, authenticated using (published and archived_at is null);
create policy "admins read all" on public.centres for select to authenticated using ((select public.is_admin()));
-- links are private: admins only
create policy "admins read all" on public.talent_centres for select to authenticated using ((select public.is_admin()));
create policy "admins add" on public.talent_centres for insert to authenticated with check ((select public.is_admin()));
create policy "admins remove" on public.talent_centres for delete to authenticated using ((select public.is_admin()));

-- Public talents per public centre — counts only, never which talent.
create function public.centre_talent_counts() returns table (centre_key text, talents int)
language sql stable security definer set search_path = '' as $$
  select tc.centre_key, count(*)::int
  from public.talent_centres tc
  join public.talents t on t.id = tc.talent_id and t.published and t.archived_at is null
  join public.centres c on c.key = tc.centre_key and c.published and c.archived_at is null
  group by tc.centre_key
$$;
grant execute on function public.centre_talent_counts to anon, authenticated;

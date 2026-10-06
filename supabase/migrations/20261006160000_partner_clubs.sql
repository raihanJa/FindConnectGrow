-- Partner clubs: the European clubs FCG works with and where verified talents can go for a trial, a stage or a contract.
-- On purpose mostly mid-table and relegation-battling professional clubs plus semi-pro and amateur clubs:
-- playing minutes and a stable environment matter more than a famous badge.
--
-- Clubs are organisations, so the public sees name, city and league. Which talent trains at which club is NOT stored here;
-- the site only shows a count of placements. Archiving instead of deleting, like talents and centres.

create table public.club_levels (
  key text primary key,
  label_en text not null,
  label_nl text not null,
  sort smallint not null
);

create table public.clubs (
  key text primary key check (key ~ '^[a-z0-9-]+$'),
  name text not null check (length(name) between 1 and 120),
  city text not null check (length(city) between 1 and 80),
  country text not null check (country ~ '^[A-Z]{2}$'),               -- ISO 3166-1 alpha-2, labels via Intl.DisplayNames
  level_key text not null references public.club_levels (key),
  league text not null check (length(league) between 1 and 80),
  squads text not null default 'm' check (squads in ('m', 'f', 'mf')), -- men's and/or women's teams that take FCG talents
  tier_key text references public.partnership_tiers (key),              -- null = community partner (no fee)
  offers text[] not null default '{}' check (offers <@ array['housing', 'school', 'language', 'youth', 'trial']::text[]),
  lng numeric(5, 2) not null check (lng between -180 and 180),
  lat numeric(4, 2) not null check (lat between -90 and 90),
  partner_since smallint not null check (partner_since between 2020 and 2100),
  placements smallint not null default 0 check (placements >= 0),       -- FCG talents hosted so far (count only)
  note_en text not null default '',
  note_nl text not null default '',
  published boolean not null default true,
  archived_at timestamptz,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clubs (level_key);
create index on public.clubs (tier_key);
create trigger clubs_touch before update on public.clubs
  for each row execute function public.touch_updated_at();

alter table public.club_levels enable row level security;
alter table public.clubs enable row level security;

create policy "public read" on public.club_levels for select to anon, authenticated using (true);
create policy "public read published" on public.clubs for select to anon, authenticated using (published and archived_at is null);
create policy "admins read all" on public.clubs for select to authenticated using ((select public.is_admin()));
create policy "admins add" on public.clubs for insert to authenticated with check ((select public.is_admin()));
create policy "admins edit" on public.clubs for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

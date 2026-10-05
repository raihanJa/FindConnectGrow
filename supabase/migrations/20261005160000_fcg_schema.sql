-- FCG — Find Connect & Grow: core schema
-- Content tables are publicly readable; form submission tables are insert-only for visitors.
-- Safeguarding by design: public talent profiles carry first name + initial only, no photos, no exact locations.

-- ---------- lookups ----------
create table public.statuses (
  id smallint primary key,
  label_en text not null,
  label_nl text not null
);
comment on table public.statuses is 'Pathway status: 0 Scouted, 1 Verified, 2 EU trial, 3 Partner academy.';

create table public.position_groups (
  key text primary key check (key in ('gk', 'def', 'mid', 'att')),
  label_en text not null,
  label_nl text not null,
  sort smallint not null
);

create table public.positions (
  key text primary key,
  group_key text not null references public.position_groups (key),
  label_en text not null,
  label_nl text not null,
  -- OVR weights in attribute order (pace, technique, vision, physical, work rate, composure)
  ovr_weights numeric(4, 2)[] not null check (cardinality(ovr_weights) = 6),
  sort smallint not null
);
create index on public.positions (group_key);

create table public.attributes (
  idx smallint primary key check (idx between 0 and 5),
  key text not null unique,
  label_en text not null,
  label_nl text not null
);

create table public.traits (
  key text primary key,
  label_en text not null,
  label_nl text not null
);

-- ---------- geography ----------
create table public.regions (
  key text primary key,
  name_en text not null,
  name_nl text not null,
  place text not null,
  lng numeric(7, 3) not null,
  lat numeric(7, 3) not null,
  iso_codes text[] not null default '{}',   -- world-atlas country ids for the map
  active_since smallint not null,
  scouts smallint not null check (scouts >= 0),
  note_en text not null,
  note_nl text not null,
  sort smallint not null
);

create table public.locations (
  key text primary key,
  name text not null,
  kind text not null check (kind in ('hub', 'academy')),
  lng numeric(7, 3) not null,
  lat numeric(7, 3) not null,
  sort smallint not null
);

-- ---------- talents ----------
create table public.talents (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  -- safeguarding: first name + initial only, e.g. "Omar H."
  display_name text not null check (display_name ~ '^[^ ]+ [[:upper:]]\.$'),
  gender text not null check (gender in ('m', 'f')),
  age smallint not null check (age between 10 and 25),
  position_key text not null references public.positions (key),
  foot text not null check (foot in ('L', 'R', 'B')),
  height_cm smallint not null check (height_cm between 120 and 230),
  shirt_no smallint not null check (shirt_no between 1 and 99),
  region_key text not null references public.regions (key),
  city text not null,
  status_id smallint not null references public.statuses (id),
  joined_on date not null,                          -- month precision: first day of the month
  trial_location_key text references public.locations (key),
  pace smallint not null check (pace between 0 and 100),
  technique smallint not null check (technique between 0 and 100),
  vision smallint not null check (vision between 0 and 100),
  physical smallint not null check (physical between 0 and 100),
  work_rate smallint not null check (work_rate between 0 and 100),
  composure smallint not null check (composure between 0 and 100),
  matches smallint not null default 0 check (matches >= 0),
  goals smallint check (goals >= 0),
  assists smallint check (assists >= 0),
  clean_sheets smallint check (clean_sheets >= 0),
  saves smallint check (saves >= 0),
  bio_en text not null,
  bio_nl text not null,
  quote_en text not null,
  quote_nl text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.talents (position_key);
create index on public.talents (region_key);
create index on public.talents (status_id);
create index on public.talents (trial_location_key);

create table public.talent_traits (
  talent_id text not null references public.talents (id) on delete cascade,
  trait_key text not null references public.traits (key),
  sort smallint not null,
  primary key (talent_id, trait_key)
);
create index on public.talent_traits (trait_key);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger talents_touch before update on public.talents
  for each row execute function public.touch_updated_at();

-- Public profile with derived OVR (position-weighted) and group — never stored by hand.
create view public.talents_public with (security_invoker = true) as
select
  t.id, t.display_name as name, t.gender as g, t.age, t.position_key as pos, p.group_key as "group",
  t.foot, t.height_cm as h, t.shirt_no as no, t.region_key as region, t.city, t.status_id as status,
  to_char(t.joined_on, 'YYYY-MM') as joined, l.name as trial_city,
  array[t.pace, t.technique, t.vision, t.physical, t.work_rate, t.composure] as a,
  round(t.pace * p.ovr_weights[1] + t.technique * p.ovr_weights[2] + t.vision * p.ovr_weights[3]
      + t.physical * p.ovr_weights[4] + t.work_rate * p.ovr_weights[5] + t.composure * p.ovr_weights[6])::int as ovr,
  t.matches, t.goals, t.assists, t.clean_sheets, t.saves,
  coalesce((select array_agg(tt.trait_key order by tt.sort) from public.talent_traits tt where tt.talent_id = t.id), '{}') as traits,
  t.bio_en, t.bio_nl, t.quote_en, t.quote_nl
from public.talents t
join public.positions p on p.key = t.position_key
left join public.locations l on l.key = t.trial_location_key
where t.published;

-- ---------- organisation content ----------
create table public.partnership_tiers (
  key text primary key,
  name text not null,
  price_eur integer check (price_eur > 0),        -- null = on request
  period text not null default 'season',
  featured boolean not null default false,
  sort smallint not null
);

create table public.donation_impact_items (
  key text primary key,
  cost_eur integer not null check (cost_eur > 0),
  sort smallint not null
);

create table public.fund_allocation (
  key text primary key,
  label_en text not null,
  label_nl text not null,
  percent smallint not null check (percent between 0 and 100),
  sort smallint not null
);

create table public.team_members (
  id smallint generated always as identity primary key,
  initials text not null,
  role_en text not null,
  role_nl text not null,
  sort smallint not null
);

-- Headline figures that can't be derived (regions + scouts come from public.regions)
create table public.site_metrics (
  key text primary key,
  value integer not null,
  suffix text not null default '',
  label_en text not null,
  label_nl text not null,
  sort smallint not null
);

-- ---------- form submissions (visitors may insert, never read) ----------
create table public.dossier_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  club text not null check (length(club) between 1 and 200),
  role text not null check (role in ('scout', 'technical_director', 'academy_manager')),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text check (length(message) <= 5000),
  nda_accepted boolean not null check (nda_accepted),
  lang text not null default 'en' check (lang in ('en', 'nl')),
  status text not null default 'new' check (status in ('new', 'in_review', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create table public.dossier_request_talents (
  request_id uuid not null references public.dossier_requests (id) on delete cascade,
  talent_id text not null references public.talents (id) on delete cascade,
  primary key (request_id, talent_id)
);
create index on public.dossier_request_talents (talent_id);

create table public.partnership_applications (
  id uuid primary key default gen_random_uuid(),
  tier_key text references public.partnership_tiers (key),   -- null = intro call
  name text not null check (length(name) between 1 and 200),
  club text not null check (length(club) between 1 and 200),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  country text check (length(country) <= 120),
  level text not null check (level in ('top_division', 'second_division', 'academy_youth', 'womens_football')),
  need text not null check (need in ('gk', 'def', 'mid', 'att', 'open')),
  message text check (length(message) <= 5000),
  charter_accepted boolean not null check (charter_accepted),
  lang text not null default 'en' check (lang in ('en', 'nl')),
  status text not null default 'new' check (status in ('new', 'contacted', 'active', 'declined')),
  created_at timestamptz not null default now()
);
create index on public.partnership_applications (tier_key);

-- Nominations concern (often minor) players: strictly private, first name only.
create table public.nominations (
  id uuid primary key default gen_random_uuid(),
  nominator_name text not null check (length(nominator_name) between 1 and 200),
  nominator_role text not null check (nominator_role in ('coach', 'teacher', 'ngo_worker', 'family', 'other')),
  contact text not null check (length(contact) between 3 and 200),       -- email or WhatsApp
  country_or_camp text not null check (length(country_or_camp) between 1 and 200),
  player_first_name text not null check (length(player_first_name) between 1 and 80),
  player_age smallint not null check (player_age between 10 and 25),
  position_key text references public.positions (key),                   -- null = other
  video_url text check (video_url ~* '^https?://'),
  reason text not null check (length(reason) between 1 and 5000),
  guardian_aware boolean not null check (guardian_aware),
  lang text not null default 'en' check (lang in ('en', 'nl')),
  status text not null default 'new' check (status in ('new', 'scout_assigned', 'visited', 'family_contacted', 'closed')),
  created_at timestamptz not null default now()
);
create index on public.nominations (position_key);

create table public.help_offers (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('coach', 'gear', 'pro', 'sponsor')),
  name text not null check (length(name) between 1 and 200),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  offer text not null check (length(offer) between 1 and 5000),
  lang text not null default 'en' check (lang in ('en', 'nl')),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  lang text not null default 'en' check (lang in ('en', 'nl')),
  created_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));

-- Concept: pledges only, no payment is processed.
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  amount_eur integer not null check (amount_eur between 5 and 5000),
  frequency text not null check (frequency in ('once', 'month')),
  region_key text references public.regions (key),                       -- null = where it's needed most
  donor_name text not null check (length(donor_name) between 1 and 200),
  donor_email text not null check (donor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  wants_updates boolean not null default true,
  anonymous boolean not null default false,
  payment_method text not null check (payment_method in ('ideal', 'card', 'paypal', 'sepa')),
  status text not null default 'pledged' check (status in ('pledged', 'paid', 'failed', 'cancelled')),
  lang text not null default 'en' check (lang in ('en', 'nl')),
  created_at timestamptz not null default now()
);
create index on public.donations (region_key);

-- Dossier request + its talents in one call (visitors can't read back the generated id).
create function public.submit_dossier_request(
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
  select rid, t.id from public.talents t where t.published and t.id = any (coalesce(p_talent_ids, '{}'));
end $$;
revoke all on function public.submit_dossier_request from public;
grant execute on function public.submit_dossier_request to anon, authenticated;

-- ---------- row level security ----------
alter table public.statuses enable row level security;
alter table public.position_groups enable row level security;
alter table public.positions enable row level security;
alter table public.attributes enable row level security;
alter table public.traits enable row level security;
alter table public.regions enable row level security;
alter table public.locations enable row level security;
alter table public.talents enable row level security;
alter table public.talent_traits enable row level security;
alter table public.partnership_tiers enable row level security;
alter table public.donation_impact_items enable row level security;
alter table public.fund_allocation enable row level security;
alter table public.team_members enable row level security;
alter table public.site_metrics enable row level security;
alter table public.dossier_requests enable row level security;
alter table public.dossier_request_talents enable row level security;
alter table public.partnership_applications enable row level security;
alter table public.nominations enable row level security;
alter table public.help_offers enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.donations enable row level security;

-- public content: read-only
create policy "public read" on public.statuses for select to anon, authenticated using (true);
create policy "public read" on public.position_groups for select to anon, authenticated using (true);
create policy "public read" on public.positions for select to anon, authenticated using (true);
create policy "public read" on public.attributes for select to anon, authenticated using (true);
create policy "public read" on public.traits for select to anon, authenticated using (true);
create policy "public read" on public.regions for select to anon, authenticated using (true);
create policy "public read" on public.locations for select to anon, authenticated using (true);
create policy "public read published" on public.talents for select to anon, authenticated using (published);
create policy "public read published" on public.talent_traits for select to anon, authenticated
  using (exists (select 1 from public.talents t where t.id = talent_id and t.published));
create policy "public read" on public.partnership_tiers for select to anon, authenticated using (true);
create policy "public read" on public.donation_impact_items for select to anon, authenticated using (true);
create policy "public read" on public.fund_allocation for select to anon, authenticated using (true);
create policy "public read" on public.team_members for select to anon, authenticated using (true);
create policy "public read" on public.site_metrics for select to anon, authenticated using (true);

-- submissions: insert-only, always land as 'new'; dossier requests go through submit_dossier_request()
create policy "visitors submit" on public.partnership_applications for insert to anon, authenticated
  with check (status = 'new' and charter_accepted);
create policy "visitors submit" on public.nominations for insert to anon, authenticated
  with check (status = 'new' and guardian_aware);
create policy "visitors submit" on public.help_offers for insert to anon, authenticated
  with check (status = 'new');
create policy "visitors subscribe" on public.newsletter_subscribers for insert to anon, authenticated
  with check (email is not null);
create policy "visitors pledge" on public.donations for insert to anon, authenticated
  with check (status = 'pledged');

-- visitors never update/delete anything; content is managed via the dashboard / service role
revoke update, delete, truncate on all tables in schema public from anon, authenticated;
revoke insert on public.statuses, public.position_groups, public.positions, public.attributes, public.traits,
  public.regions, public.locations, public.talents, public.talent_traits, public.partnership_tiers,
  public.donation_impact_items, public.fund_allocation, public.team_members, public.site_metrics,
  public.dossier_requests, public.dossier_request_talents
  from anon, authenticated;
revoke select on public.dossier_requests, public.dossier_request_talents, public.partnership_applications,
  public.nominations, public.help_offers, public.newsletter_subscribers, public.donations
  from anon, authenticated;

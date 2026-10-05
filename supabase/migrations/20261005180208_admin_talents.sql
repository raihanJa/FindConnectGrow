-- Admin portal: signed-in admins (Supabase Auth) may add talents. Everyone else stays read-only.
-- Admin accounts are created in Supabase Auth and then listed here:
--   insert into public.admins (user_id) select id from auth.users where email = 'name@fcg.example';

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins read self" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
$$;
revoke all on function public.is_admin from public, anon;
grant execute on function public.is_admin to authenticated;

-- admins see unpublished talents too (needed for unique ids / sort) and may insert
grant insert on public.talents, public.talent_traits to authenticated;
create policy "admins read all" on public.talents for select to authenticated using ((select public.is_admin()));
create policy "admins read all" on public.talent_traits for select to authenticated using ((select public.is_admin()));
create policy "admins add" on public.talents for insert to authenticated with check ((select public.is_admin()));
create policy "admins add" on public.talent_traits for insert to authenticated with check ((select public.is_admin()));

-- Talent + traits in one transaction. Runs as the caller, so RLS above still applies.
-- p.id is the wanted slug; a suffix (-2, -3, …) is added when it is taken. Returns the final id.
create function public.create_talent(p jsonb, p_traits text[] default '{}') returns text
language plpgsql security invoker set search_path = '' as $$
declare base text := p ->> 'id'; tid text := p ->> 'id'; n int := 1;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if cardinality(p_traits) > 4 then raise exception 'at most 4 traits'; end if;
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
  return tid;
end $$;
revoke all on function public.create_talent from public, anon;
grant execute on function public.create_talent to authenticated;

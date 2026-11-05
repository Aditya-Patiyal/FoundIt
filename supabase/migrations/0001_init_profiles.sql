-- Step 1 (Auth): profiles table + college-domain gate (README §11).
-- Safe to run more than once.
--
-- NOTE: the allowed domain is hard-coded below ('@muj.manipal.edu') because a
-- Postgres trigger can't read the app's env var. It MUST stay in sync with
-- NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN. If the college domain ever changes, update
-- both places.

-- 1. Status enum ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_status') then
    create type public.profile_status as enum ('active', 'paused');
  end if;
end $$;

-- 2. Profiles table ---------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '',
  college_email text not null,
  hostel_block  text,
  status        public.profile_status not null default 'active',
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 3. Privileges -------------------------------------------------------------
-- Only the trigger (security definer) inserts rows. Users may read their own
-- row and update ONLY their name/hostel block — never their own status
-- (prevents a paused user un-pausing themselves, README §7/§11).
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, hostel_block) on public.profiles to authenticated;

-- 4. Row-level policies -----------------------------------------------------
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. New-user trigger: enforce domain + create profile ----------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The real college-domain gate (the UI check is just for nice errors).
  if lower(new.email) not like '%@muj.manipal.edu' then
    raise exception 'Only @muj.manipal.edu emails are allowed';
  end if;

  insert into public.profiles (id, college_email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Step 2: items, private details, and photo storage (README §5, §8, §11).
-- Safe to run more than once.

-- 1. Enums -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'item_holding') then
    create type public.item_holding as enum ('with_finder', 'at_office');
  end if;
  if not exists (select 1 from pg_type where typname = 'item_status') then
    create type public.item_status as enum
      ('open', 'claim_pending', 'returned', 'handed_to_office', 'expired');
  end if;
end $$;

-- 2. items -----------------------------------------------------------------
create table if not exists public.items (
  id                 uuid primary key default gen_random_uuid(),
  finder_id          uuid not null references public.profiles (id) on delete cascade,
  title              text not null,
  category           text not null,
  public_description text not null default '',
  zone               text not null,
  spot               text,
  found_at           timestamptz,
  holding            public.item_holding not null default 'with_finder',
  status             public.item_status  not null default 'open',
  photo_paths        text[] not null default '{}',
  reminder_sent_at   timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists items_status_created_idx on public.items (status, created_at desc);
create index if not exists items_category_idx on public.items (category);
create index if not exists items_zone_idx on public.items (zone);
create index if not exists items_finder_idx on public.items (finder_id);

alter table public.items enable row level security;

-- 3. item_private (finder-only private details) ----------------------------
create table if not exists public.item_private (
  item_id         uuid primary key references public.items (id) on delete cascade,
  private_details text not null default ''
);
alter table public.item_private enable row level security;

-- 4. Helper: is the current user an active (non-paused) profile? -----------
create or replace function public.current_profile_is_active()
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

-- 5. Privileges ------------------------------------------------------------
grant select, insert, update on public.items to authenticated;
grant select, insert, update on public.item_private to authenticated;

-- 6. items policies --------------------------------------------------------
-- Any signed-in student can browse the public item rows.
drop policy if exists "items read" on public.items;
create policy "items read" on public.items for select to authenticated using (true);

-- Insert only as yourself, and only if your profile is active (§7/§11).
drop policy if exists "items insert own" on public.items;
create policy "items insert own" on public.items for insert to authenticated
  with check (finder_id = auth.uid() and public.current_profile_is_active());

-- Update only your own items.
drop policy if exists "items update own" on public.items;
create policy "items update own" on public.items for update to authenticated
  using (finder_id = auth.uid())
  with check (finder_id = auth.uid());

-- 7. item_private policies: ONLY the item's finder (the real private gate) --
drop policy if exists "item_private read finder" on public.item_private;
create policy "item_private read finder" on public.item_private for select to authenticated
  using (exists (
    select 1 from public.items i where i.id = item_id and i.finder_id = auth.uid()
  ));

drop policy if exists "item_private insert finder" on public.item_private;
create policy "item_private insert finder" on public.item_private for insert to authenticated
  with check (exists (
    select 1 from public.items i where i.id = item_id and i.finder_id = auth.uid()
  ));

drop policy if exists "item_private update finder" on public.item_private;
create policy "item_private update finder" on public.item_private for update to authenticated
  using (exists (
    select 1 from public.items i where i.id = item_id and i.finder_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.items i where i.id = item_id and i.finder_id = auth.uid()
  ));

-- 8. Photo storage bucket (public read) ------------------------------------
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- Public read so photos display in Browse; write/delete only in your own
-- folder (path convention: "<auth uid>/<uuid>.jpg").
drop policy if exists "item photos public read" on storage.objects;
create policy "item photos public read" on storage.objects for select
  using (bucket_id = 'item-photos');

drop policy if exists "item photos insert own" on storage.objects;
create policy "item photos insert own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "item photos delete own" on storage.objects;
create policy "item photos delete own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Step 3: claims + finder review (README §6, §7, §11). Safe to re-run.

-- 1. Enum -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'claim_status') then
    create type public.claim_status as enum
      ('pending', 'accepted', 'rejected', 'withdrawn');
  end if;
end $$;

-- 2. claims -----------------------------------------------------------------
-- claimant_display_name / claimant_block are snapshotted from the claimant's
-- profile at claim time, because profiles RLS is own-row-only (the finder can't
-- read a claimant's profile, but must see their name/block to judge the claim).
create table if not exists public.claims (
  id                    uuid primary key default gen_random_uuid(),
  item_id               uuid not null references public.items (id) on delete cascade,
  claimant_id           uuid not null references public.profiles (id) on delete cascade,
  claimant_display_name text not null default '',
  claimant_block        text,
  lost_zone             text,
  lost_when_text        text,
  contents_answer       text,
  secret_answer         text,
  proof_photo_path      text,
  status                public.claim_status not null default 'pending',
  created_at            timestamptz not null default now(),
  decided_at            timestamptz
);

create index if not exists claims_item_idx on public.claims (item_id);
create index if not exists claims_claimant_idx on public.claims (claimant_id);
create index if not exists claims_item_status_idx on public.claims (item_id, status);

alter table public.claims enable row level security;

grant select, insert, update on public.claims to authenticated;

-- 3. Policies: a claim is visible to its claimant and to the item's finder ----
drop policy if exists "claims read" on public.claims;
create policy "claims read" on public.claims for select to authenticated
  using (
    claimant_id = auth.uid()
    or auth.uid() = (select finder_id from public.items i where i.id = item_id)
  );

-- Insert only as yourself. The trigger below enforces the harder rules.
drop policy if exists "claims insert own" on public.claims;
create policy "claims insert own" on public.claims for insert to authenticated
  with check (claimant_id = auth.uid());

-- Update allowed for the claimant (withdraw) and the finder (accept/reject);
-- the server actions enforce which transition each role may make.
drop policy if exists "claims update parties" on public.claims;
create policy "claims update parties" on public.claims for update to authenticated
  using (
    claimant_id = auth.uid()
    or auth.uid() = (select finder_id from public.items i where i.id = item_id)
  )
  with check (
    claimant_id = auth.uid()
    or auth.uid() = (select finder_id from public.items i where i.id = item_id)
  );

-- 4. New-claim guard: active profile, not your own item, no dup, 3/day cap ---
create or replace function public.check_new_claim()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_finder uuid;
  v_open   int;
begin
  if not exists (
    select 1 from public.profiles where id = new.claimant_id and status = 'active'
  ) then
    raise exception 'Your account is paused, so you can''t claim right now.';
  end if;

  select finder_id into v_finder from public.items where id = new.item_id;
  if v_finder is null then
    raise exception 'That item no longer exists.';
  end if;
  if v_finder = new.claimant_id then
    raise exception 'You can''t claim your own item.';
  end if;

  if exists (
    select 1 from public.claims
    where item_id = new.item_id and claimant_id = new.claimant_id
      and status in ('pending', 'accepted')
  ) then
    raise exception 'You already have a claim on this item.';
  end if;

  select count(*) into v_open from public.claims
  where claimant_id = new.claimant_id
    and status = 'pending'
    and created_at > now() - interval '24 hours';
  if v_open >= 3 then
    raise exception 'You can only have 3 open claims per day. Try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_claim_insert on public.claims;
create trigger on_claim_insert
  before insert on public.claims
  for each row execute function public.check_new_claim();

-- Step 5: return records (README §6, §7 point 5, §8 screen 9, §11). Safe to re-run.

-- 1. returns ----------------------------------------------------------------
-- One record per claim. finder_marked_at is set when the finder marks it
-- returned; claimant_confirmed_at when the claimant confirms. Once both are set
-- the row is finalized and immutable (enforced by the trigger below).
create table if not exists public.returns (
  id                   uuid primary key default gen_random_uuid(),
  item_id              uuid not null references public.items (id) on delete cascade,
  claim_id             uuid not null unique references public.claims (id) on delete cascade,
  finder_id            uuid not null references public.profiles (id) on delete cascade,
  claimant_id          uuid not null references public.profiles (id) on delete cascade,
  finder_marked_at     timestamptz not null default now(),
  claimant_confirmed_at timestamptz,
  answers_snapshot     jsonb not null default '{}'::jsonb,
  record_code          text not null default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_at           timestamptz not null default now()
);
create index if not exists returns_finder_idx on public.returns (finder_id);
create index if not exists returns_claimant_idx on public.returns (claimant_id);

alter table public.returns enable row level security;

-- 2. Privileges: both parties read; finder inserts; claimant may set ONLY
--    its own confirmation column.
grant select, insert on public.returns to authenticated;
grant update (claimant_confirmed_at) on public.returns to authenticated;

-- 3. Policies ---------------------------------------------------------------
drop policy if exists "returns read" on public.returns;
create policy "returns read" on public.returns for select to authenticated
  using (finder_id = auth.uid() or claimant_id = auth.uid());

-- Finder of the claim's item starts the record (claim must be accepted).
drop policy if exists "returns insert finder" on public.returns;
create policy "returns insert finder" on public.returns for insert to authenticated
  with check (
    finder_id = auth.uid()
    and exists (
      select 1 from public.claims c
      join public.items i on i.id = c.item_id
      where c.id = claim_id and c.status = 'accepted' and i.finder_id = auth.uid()
    )
  );

-- Only the claimant confirms.
drop policy if exists "returns confirm claimant" on public.returns;
create policy "returns confirm claimant" on public.returns for update to authenticated
  using (claimant_id = auth.uid())
  with check (claimant_id = auth.uid());

-- 4. Immutability: only claimant_confirmed_at may change, and not after final -
create or replace function public.lock_finalized_return()
returns trigger language plpgsql as $$
begin
  if old.claimant_confirmed_at is not null then
    raise exception 'This return record is finalized and cannot be changed.';
  end if;
  if new.item_id is distinct from old.item_id
     or new.claim_id is distinct from old.claim_id
     or new.finder_id is distinct from old.finder_id
     or new.claimant_id is distinct from old.claimant_id
     or new.finder_marked_at is distinct from old.finder_marked_at
     or new.answers_snapshot is distinct from old.answers_snapshot
     or new.record_code is distinct from old.record_code then
    raise exception 'Only the claimant confirmation may be updated.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_return_update on public.returns;
create trigger on_return_update
  before update on public.returns
  for each row execute function public.lock_finalized_return();

-- 5. When finalized, mark the item returned (security definer bypasses RLS) --
create or replace function public.on_return_finalized()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.claimant_confirmed_at is not null then
    update public.items set status = 'returned' where id = new.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_return_finalized_trg on public.returns;
create trigger on_return_finalized_trg
  after update on public.returns
  for each row execute function public.on_return_finalized();

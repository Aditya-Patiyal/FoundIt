-- Step 4: chat messages per accepted claim (README §8 screen 8, §11).
-- Safe to re-run.

-- Finder's name becomes visible to the claimant once accepted (README §11).
-- Set by decideClaim on accept (the finder can read their own profile).
alter table public.claims add column if not exists finder_display_name text;

-- 1. messages ---------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  claim_id   uuid not null references public.claims (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_claim_created_idx
  on public.messages (claim_id, created_at);

alter table public.messages enable row level security;
grant select, insert on public.messages to authenticated;

-- 2. Policies: only the two parties of an ACCEPTED claim ---------------------
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select to authenticated
  using (exists (
    select 1 from public.claims c
    join public.items i on i.id = c.item_id
    where c.id = claim_id
      and c.status = 'accepted'
      and (c.claimant_id = auth.uid() or i.finder_id = auth.uid())
  ));

drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.claims c
      join public.items i on i.id = c.item_id
      where c.id = claim_id
        and c.status = 'accepted'
        and (c.claimant_id = auth.uid() or i.finder_id = auth.uid())
    )
  );

-- 3. Enable Realtime on messages (idempotent) -------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- 1. COMMUNITY SPARK PROGRESS
create table public.world_progress (
  id int primary key default 1,
  total_sparks int default 0,
  target_sparks int default 1000,
  current_realm_phase int default 1,
  updated_at timestamp with time zone default now()
);
insert into public.world_progress (id, total_sparks, target_sparks) values (1, 0, 1000)
on conflict do nothing;

-- 2. DEV WISHING WELL
create table public.dev_wishes (
  id uuid default gen_random_uuid() primary key,
  author_name text default 'Anonymous Wisp',
  message text not null check (char_length(message) <= 140),
  created_at timestamp with time zone default now()
);

-- 3. PERSISTENT WORLD NOTES (Signs, Bottles, Runes)
create table public.world_notes (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('sign', 'bottle', 'rune')),
  content text not null check (char_length(content) <= 256), -- Max 100 chars text OR 256-char bitmask for 16x16 rune
  position float8[] not null, -- [x, y, z]
  author_name text default 'Drifting Wisp',
  color text default '#6ee7b7',
  created_at timestamp with time zone default now()
);

-- Index for spatial & chronological queries
create index idx_world_notes_created on public.world_notes (created_at desc);

-- FIFO Trigger: Ensure total notes never exceed 150
create or replace function enforce_note_limit()
returns trigger as $$
begin
  delete from public.world_notes
  where id in (
    select id from public.world_notes
    order by created_at desc
    offset 150
  );
  return new;
end;
$$ language plpgsql;

create trigger tr_enforce_note_limit
after insert on public.world_notes
execute function enforce_note_limit();

-- Function to increment sparks
create or replace function add_sparks(amount int)
returns void as $$
begin
  update public.world_progress
  set total_sparks = total_sparks + amount,
      updated_at = now()
  where id = 1;
end;
$$ language plpgsql;
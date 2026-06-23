-- Create the sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null default current_date,
  weapon text check (weapon in ('foil','epee','sabre')),
  session_type text check (session_type in ('lesson','open_fencing','drills','competition','conditioning','other')),
  duration_minutes int,
  club text,
  coach text,
  audio_url text,
  transcript text not null,
  summary text,
  created_at timestamptz default now()
);

create table if not exists takeaways (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  category text not null check (category in ('technique','footwork','tactics','bouts','conditioning','mental','coach_feedback','action_item','injury')),
  content text not null,
  is_action_item boolean default false,
  completed boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_takeaways_session_id on takeaways (session_id);
create index if not exists idx_takeaways_category on takeaways (category);

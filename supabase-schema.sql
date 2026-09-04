create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('film', 'games', 'books', 'tv', 'anime')),
  score numeric(3,1) not null check (score >= 0 and score <= 10),
  status text not null default 'Want to experience',
  thought text,
  review text,
  tags text[] not null default '{}',
  rewatchable boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;
drop policy if exists "Users can view their own ratings" on public.ratings;
drop policy if exists "Users can add their own ratings" on public.ratings;
drop policy if exists "Users can update their own ratings" on public.ratings;
drop policy if exists "Users can delete their own ratings" on public.ratings;
create policy "Users can view their own ratings" on public.ratings for select using (auth.uid() = user_id);
create policy "Users can add their own ratings" on public.ratings for insert with check (auth.uid() = user_id);
create policy "Users can update their own ratings" on public.ratings for update using (auth.uid() = user_id);
create policy "Users can delete their own ratings" on public.ratings for delete using (auth.uid() = user_id);

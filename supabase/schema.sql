-- profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text check (char_length(bio) <= 200),
  avatar_url text,
  is_private boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- auto-create a profile row on signup
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- avatars bucket
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users can update their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- tracks: each row = one generated audio file
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  prompt text not null,
  genre text,
  mood text,
  has_vocals boolean default false,
  duration_seconds int not null default 20,
  audio_url text not null,
  is_published boolean default true,
  play_count int default 0,
  created_at timestamptz default now()
);

create index tracks_creator_idx on public.tracks(creator_id, created_at desc);

alter table public.tracks enable row level security;

create policy "published tracks are viewable by everyone"
  on public.tracks for select using (is_published = true or auth.uid() = creator_id);

create policy "users can insert their own tracks"
  on public.tracks for insert with check (auth.uid() = creator_id);

create policy "users can update their own tracks"
  on public.tracks for update using (auth.uid() = creator_id);

create policy "users can delete their own tracks"
  on public.tracks for delete using (auth.uid() = creator_id);

-- audio bucket (public reads, scoped writes)
insert into storage.buckets (id, name, public) values ('tracks', 'tracks', true);

create policy "track audio is publicly accessible"
  on storage.objects for select using (bucket_id = 'tracks');

create policy "users can upload their own tracks"
  on storage.objects for insert with check (
    bucket_id = 'tracks' and auth.uid()::text = (storage.foldername(name))[1]
  );

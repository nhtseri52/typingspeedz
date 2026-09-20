create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique not null check(char_length(username) between 3 and 24),
 country text,
 created_at timestamptz not null default now(),
 last_login_at timestamptz
);
create table if not exists public.scores(
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 mode text not null check(mode in('normal','advanced')),
 wpm numeric not null check(wpm>=0),
 accuracy numeric not null check(accuracy between 0 and 100),
 correct int not null default 0,
 incorrect int not null default 0,
 duration int not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.community_texts(
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null,
 content text not null,
 language text not null check(language in('vi','en','fr','es','pt')),
 attempts int not null default 0,
 likes_count int not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.text_scores(
 id bigint generated always as identity primary key,
 text_id bigint not null references public.community_texts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 wpm numeric not null, accuracy numeric not null, completion_time numeric not null,
 created_at timestamptz not null default now()
);
create table if not exists public.likes(
 id bigint generated always as identity primary key,
 text_id bigint not null references public.community_texts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(text_id,user_id)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,username,country) values(
  new.id,
  coalesce(new.raw_user_meta_data->>'username','user_'||substr(new.id::text,1,8)),
  upper(nullif(new.raw_user_meta_data->>'country',''))
 ) on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.like_counter() returns trigger
language plpgsql security definer set search_path=public as $$
begin update public.community_texts set likes_count=likes_count+1 where id=new.text_id; return new; end; $$;
create or replace function public.unlike_counter() returns trigger
language plpgsql security definer set search_path=public as $$
begin update public.community_texts set likes_count=greatest(0,likes_count-1) where id=old.text_id; return old; end; $$;
drop trigger if exists likes_insert on public.likes;
create trigger likes_insert after insert on public.likes for each row execute procedure public.like_counter();
drop trigger if exists likes_delete on public.likes;
create trigger likes_delete after delete on public.likes for each row execute procedure public.unlike_counter();

create or replace function public.attempt_counter() returns trigger
language plpgsql security definer set search_path=public as $$
begin update public.community_texts set attempts=attempts+1 where id=new.text_id; return new; end; $$;
drop trigger if exists text_attempt on public.text_scores;
create trigger text_attempt after insert on public.text_scores for each row execute procedure public.attempt_counter();

alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.community_texts enable row level security;
alter table public.text_scores enable row level security;
alter table public.likes enable row level security;

create policy "profiles public read" on public.profiles for select using(true);
create policy "profiles own insert" on public.profiles for insert with check(auth.uid()=id);
create policy "profiles own update" on public.profiles for update using(auth.uid()=id);
create policy "scores public read" on public.scores for select using(true);
create policy "scores own insert" on public.scores for insert with check(auth.uid()=user_id);
create policy "community public read" on public.community_texts for select using(true);
create policy "community own insert" on public.community_texts for insert with check(auth.uid()=user_id);
create policy "community own update" on public.community_texts for update using(auth.uid()=user_id);
create policy "community own delete" on public.community_texts for delete using(auth.uid()=user_id);
create policy "text scores public read" on public.text_scores for select using(true);
create policy "text scores own insert" on public.text_scores for insert with check(auth.uid()=user_id);
create policy "likes public read" on public.likes for select using(true);
create policy "likes own insert" on public.likes for insert with check(auth.uid()=user_id);
create policy "likes own delete" on public.likes for delete using(auth.uid()=user_id);

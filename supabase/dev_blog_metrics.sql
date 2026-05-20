-- Supabase setup for globally synchronized post views and likes.
-- Run this once in the Supabase SQL editor for the project used by the blog.

create table if not exists public.dev_blog_metrics (
  post_id text primary key,
  likes_count integer not null default 0 check (likes_count >= 0),
  views_count integer not null default 0 check (views_count >= 0),
  updated_at timestamp with time zone not null default now()
);

alter table public.dev_blog_metrics enable row level security;

drop policy if exists "dev_blog_metrics_select_public" on public.dev_blog_metrics;
create policy "dev_blog_metrics_select_public"
on public.dev_blog_metrics
for select
to anon, authenticated
using (true);

drop policy if exists "dev_blog_metrics_insert_safe_rows" on public.dev_blog_metrics;
create policy "dev_blog_metrics_insert_safe_rows"
on public.dev_blog_metrics
for insert
to anon, authenticated
with check (
  char_length(btrim(post_id)) > 0
  and char_length(post_id) <= 300
  and likes_count in (0, 1)
  and views_count in (0, 1)
);

drop function if exists public.increment_post_view(text);
drop function if exists public.increment_post_like(text);

create or replace function public.increment_post_view(p_post_id text)
returns public.dev_blog_metrics
language sql
security definer
set search_path = public
as $$
  insert into public.dev_blog_metrics as metrics (post_id, likes_count, views_count)
  values (btrim(p_post_id), 0, 1)
  on conflict on constraint dev_blog_metrics_pkey
  do update set
    views_count = metrics.views_count + 1,
    updated_at = now()
  returning metrics.*;
$$;

create or replace function public.increment_post_like(p_post_id text)
returns public.dev_blog_metrics
language sql
security definer
set search_path = public
as $$
  insert into public.dev_blog_metrics as metrics (post_id, likes_count, views_count)
  values (btrim(p_post_id), 1, 0)
  on conflict on constraint dev_blog_metrics_pkey
  do update set
    likes_count = metrics.likes_count + 1,
    updated_at = now()
  returning metrics.*;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert on public.dev_blog_metrics to anon, authenticated;
revoke update, delete on public.dev_blog_metrics from anon, authenticated;
grant execute on function public.increment_post_view(text) to anon, authenticated;
grant execute on function public.increment_post_like(text) to anon, authenticated;

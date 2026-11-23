-- 장독대 데이터베이스 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하도록 작성했어요.

create extension if not exists pgcrypto with schema extensions;

-- 1. 프로필: 아이디와 복구 코드(암호화된 값)만 저장해요. 이메일·전화번호 같은 개인정보는 없어요.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{4,20}$'),
  recovery_hash text,
  created_at timestamptz not null default now()
);

-- 2. 장독 (책장)
create table if not exists public.jars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  type text not null check (type in ('book','webnovel','comic','movie','drama','musical','play')),
  broken_at timestamptz,
  position double precision not null default extract(epoch from now()),
  created_at timestamptz not null default now()
);
create index if not exists jars_user_idx on public.jars (user_id);

-- 3. 장독에 담긴 작품
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  jar_id uuid not null references public.jars on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  creator text not null default '',
  sub text not null default '',
  cover_url text,
  source_url text,
  done_at timestamptz,
  rating smallint check (rating between 1 and 5),
  memo text check (char_length(memo) <= 120),
  position double precision not null default extract(epoch from now()),
  created_at timestamptz not null default now()
);
create index if not exists items_jar_idx on public.items (jar_id);
create index if not exists items_user_idx on public.items (user_id);

-- 4. 내 데이터만 보고 고칠 수 있게 (Row Level Security)
alter table public.profiles enable row level security;
alter table public.jars enable row level security;
alter table public.items enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (id = auth.uid());

drop policy if exists "own jars" on public.jars;
create policy "own jars" on public.jars for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own items" on public.items;
create policy "own items" on public.items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.jars j where j.id = jar_id and j.user_id = auth.uid()));

-- 5. 복구 코드 저장 (로그인한 본인만). 아이디는 로그인 계정에서 꺼내요.
create or replace function public.set_recovery(p_code text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_username text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select split_part(email, '@', 1) into v_username from auth.users where id = auth.uid();
  insert into public.profiles (id, username, recovery_hash)
  values (auth.uid(), v_username, crypt(upper(replace(p_code, '-', '')), gen_salt('bf')))
  on conflict (id) do update set recovery_hash = excluded.recovery_hash;
end $$;

-- 6. 복구 코드로 비밀번호 다시 정하기 (로그인 전에 호출)
create or replace function public.reset_password_with_code(p_username text, p_code text, p_new_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_hash text;
begin
  if char_length(p_new_password) < 8 then raise exception 'password too short'; end if;
  select id, recovery_hash into v_id, v_hash from public.profiles where username = lower(p_username);
  if v_id is null or v_hash is null
     or crypt(upper(replace(p_code, '-', '')), v_hash) <> v_hash then
    perform pg_sleep(1);  -- 무작위 대입을 느리게
    return false;
  end if;
  update auth.users
     set encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
   where id = v_id;
  return true;
end $$;

revoke all on function public.set_recovery(text) from public, anon;
grant execute on function public.set_recovery(text) to authenticated;
revoke all on function public.reset_password_with_code(text, text, text) from public;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;

-- 7. 접근 권한 (최근 Supabase 프로젝트는 새 테이블에 자동으로 권한을 주지 않아요)
--    로그인 전(anon)에는 테이블에 접근할 수 없고, 로그인한 사용자는 RLS 규칙 안에서 자기 데이터만 다뤄요.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.jars, public.items to authenticated;
grant select on public.profiles to authenticated;
grant execute on function public.set_recovery(text) to authenticated;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;

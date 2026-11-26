-- 장독대 비공개 테스터 신청
-- Supabase SQL Editor 에서 역할이 postgres 인지 확인하고, 전체를 붙여넣어 Run 하세요.
-- 누구나 신청(추가)만 할 수 있고, 목록은 Supabase 대시보드(Table Editor → tester_signups)에서 운영자만 봐요.

create table if not exists public.tester_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nickname text not null check (char_length(nickname) between 1 and 40),
  email text not null check (email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' and char_length(email) <= 120),
  phone_model text check (char_length(phone_model) <= 60),
  is_android boolean not null check (is_android),
  agree_14days boolean not null check (agree_14days),
  agree_privacy boolean not null check (agree_privacy)
);
create unique index if not exists tester_signups_email_key on public.tester_signups (lower(email));

alter table public.tester_signups enable row level security;

drop policy if exists "anyone can sign up" on public.tester_signups;
create policy "anyone can sign up" on public.tester_signups for insert to anon, authenticated with check (true);
-- 읽기·수정·삭제 규칙은 일부러 만들지 않아요 → 사이트에서는 아무도 목록을 볼 수 없어요.

grant usage on schema public to anon, authenticated;
grant insert on public.tester_signups to anon, authenticated;

-- 확인용: 신청 수
select count(*) as signups from public.tester_signups;

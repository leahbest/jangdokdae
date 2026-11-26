-- 장독대 공지 띠 (화면 맨 위에 뜨는 알림)
-- 1) 처음 한 번: 아래 '설치' 부분을 SQL Editor(역할: postgres)에서 실행하세요.

-- ── 설치 ─────────────────────────────────────
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 120),
  link_url text,
  link_label text check (char_length(link_label) <= 12),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
drop policy if exists "show live announcements" on public.announcements;
create policy "show live announcements" on public.announcements for select to anon, authenticated
  using (active and starts_at <= now() and (ends_at is null or ends_at > now()));

grant usage on schema public to anon, authenticated;
grant select on public.announcements to anon, authenticated;

-- ── 테스터 모집 공지 켜기 (11/27 17~18시에 실행) ─────────
-- insert into public.announcements (message, link_url, link_label)
-- values ('📱 장독대 안드로이드 앱 테스터를 모아요! 14일 동안 같이 써주실 분', '/tester.html', '신청하기');

-- ── 공지 끄기 ───────────────────────────────
-- update public.announcements set active = false where active;

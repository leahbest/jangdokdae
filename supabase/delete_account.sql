-- 장독대 회원 탈퇴
-- Supabase SQL Editor 에서 역할이 postgres 인지 확인하고, 전체를 붙여넣어 Run 하세요.
-- 앱이 먼저 내 표지 사진들을 지운 뒤 이 함수를 불러요. 계정을 지우면 장독·작품·프로필은 함께 지워져요(cascade).

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

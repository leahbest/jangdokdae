-- 장독대 표지 사진 저장소
-- Supabase SQL Editor 에서 역할이 postgres 인지 확인하고, 전체를 붙여넣어 Run 하세요.

-- 1. 'covers' 저장소: 누구나 볼 수 있는 공개 이미지, 한 장 최대 2MB, 사진 형식만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. 로그인한 사람은 자기 폴더(사용자 id)에만 올리고 지울 수 있어요
drop policy if exists "covers: upload own" on storage.objects;
create policy "covers: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- 지우기·목록 보기는 자기 파일을 '볼 수 있어야' 해서 select 규칙도 필요해요.
drop policy if exists "covers: read own" on storage.objects;
create policy "covers: read own" on storage.objects for select to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "covers: delete own" on storage.objects;
create policy "covers: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- 확인용: covers 한 줄이 public = true 로 보이면 성공
select id, public, file_size_limit from storage.buckets where id = 'covers';

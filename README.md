# 장독대

보고 싶은 걸 담아 묵혀두고, 하나씩 꺼내 맛보는 컨텐츠 도장깨기 서비스.

- 장독(책장)을 종류별로 놓고 작품을 담아요. 안 본 작품은 흑백, 완료하면 컬러.
- 완료한 작품엔 별점(1~5)과 짧은 메모를 원할 때만 남겨요.
- 장독을 다 비우면 **장독 깨기** → '깬 장독'에 모여요. 삭제는 **장독 치우기**.
- **한 국자 뜨기**: 모든 장독의 미완료 중 하나를 무작위로 추천.
- **이달의 리포트**: 그달에 해치운 작품을 장독별로 정리.
- 아이디·비밀번호만으로 가입(이메일·전화번호 없음), 휴대폰과 PC 동기화.

## 실행

```bash
npm install
npm run dev
```

`.env`가 없으면 **체험 모드**(이 브라우저에만 저장)로 열려요.

## Supabase 연결 (계정·동기화)

1. supabase.com 에서 프로젝트를 만들어요.
2. SQL Editor 에 `supabase/schema.sql` 전체를 붙여넣고 Run.
3. Authentication → Sign In / Providers → Email 에서 **Confirm email 끄기**.
4. `.env.example` 을 `.env` 로 복사하고 Project URL 과 anon(publishable) 키를 넣어요.

`service_role`(secret) 키는 절대 넣지 마세요.

## 구조

- `src/lib/store.ts` — 저장소 (Supabase / 체험 모드 localStorage)
- `src/lib/useJangdok.ts` — 화면 상태와 저장 (낙관적 업데이트, 포커스 시 다시 불러오기)
- `src/lib/auth.ts` — 아이디 가입, 복구 코드
- `supabase/schema.sql` — 테이블, 내 데이터만 접근(RLS), 복구 코드 함수

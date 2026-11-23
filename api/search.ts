// 책 표지 검색: GET /api/search?type=book&q=데미안  (책·웹소설·웹툰/만화 → 카카오 책 검색)
// 영화·드라마·예능·공연은 검색 없이 이미지 링크로 담아요. 키는 Vercel 환경 변수 KAKAO_REST_KEY에만 둬요.
import { HttpError, decode, fetchWithTimeout, https, one, type Hit, type Req, type Res } from './_lib.js';

function need(name: string, label: string) {
  const v = process.env[name];
  if (!v) throw new HttpError(503, `${label} 키가 아직 설정되지 않았어요.`);
  return v;
}

/* ── 카카오(다음) 책 검색 ── (알라딘 OpenAPI는 2026-10-30 종료) */
type KakaoBook = { title: string; authors: string[]; translators: string[]; publisher: string; datetime: string; thumbnail: string; url: string };

/** 카카오 썸네일(120x174)에서 원본 표지 주소를 꺼내요. */
function bigCover(thumb: string) {
  if (!thumb) return null;
  try {
    const f = new URL(thumb).searchParams.get('fname');
    if (f) return https(decodeURIComponent(f));
  } catch { /* 그대로 사용 */ }
  return https(thumb);
}

async function kakaoBooks(q: string): Promise<Hit[]> {
  const key = need('KAKAO_REST_KEY', '카카오');
  const u = new URL('https://dapi.kakao.com/v3/search/book');
  u.searchParams.set('query', q);
  u.searchParams.set('size', '30');
  const r = await fetchWithTimeout(u.toString(), { headers: { Authorization: `KakaoAK ${key}` } });
  if (r.status === 401) throw new HttpError(502, '카카오 키가 맞지 않아요.');
  if (!r.ok) throw new HttpError(502, `카카오 검색 오류 (${r.status})`);
  const data = (await r.json()) as { documents?: KakaoBook[] };
  return (data.documents || []).map((b) => ({
    title: decode(b.title),
    creator: (b.authors || []).join(', '),
    sub: [b.translators?.length ? `${b.translators.join(', ')} 옮김` : '', b.publisher, (b.datetime || '').slice(0, 4)].filter(Boolean).join(' · '),
    cover: bigCover(b.thumbnail),
    link: https(b.url),
  }));
}

export default async function handler(req: Req, res: Res) {
  const type = one(req.query.type);
  const q = one(req.query.q);
  try {
    if (!q) throw new HttpError(400, '검색어를 넣어주세요.');
    if (q.length > 100) throw new HttpError(400, '검색어가 너무 길어요.');
    let hits: Hit[];
    switch (type) {
      case 'book': case 'comic': case 'webnovel': hits = await kakaoBooks(q); break;
      default: throw new HttpError(400, '이 종류는 검색 대신 이미지 링크로 담아요.');
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ hits });
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, '검색 중 문제가 생겼어요.');
    res.status(err.status).json({ error: err.message });
  }
}

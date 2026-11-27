// 표지 검색: GET /api/search?type=book&q=데미안
// 책·웹소설·웹툰/만화 → 카카오 책 검색, 영화·드라마·예능 → TMDB, 공연은 검색 없이 표지 넣기(예매 사이트 링크·사진)
// 키는 Vercel 환경 변수(KAKAO_REST_KEY, TMDB_TOKEN)에만 둬요.
import { HttpError, decode, fetchWithTimeout, https, one, type Hit, type Req, type Res } from './_lib.js';

function need(name: string, label: string) {
  const v = process.env[name];
  if (!v) throw new HttpError(503, `${label} 검색을 준비하고 있어요. 잠시만 ‘표지 넣기’ 탭으로 담아주세요.`);
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

/* ── TMDB ── */
type TmdbItem = { id: number; title?: string; name?: string; original_title?: string; original_name?: string;
  release_date?: string; first_air_date?: string; poster_path?: string | null };

async function tmdb(q: string, kind: 'movie' | 'tv'): Promise<Hit[]> {
  // 붙여넣을 때 섞여 들어가기 쉬운 공백·따옴표·'Bearer ' 접두어는 떼어내요.
  const token = need('TMDB_TOKEN', 'TMDB').trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
  const u = new URL(`https://api.themoviedb.org/3/search/${kind}`);
  u.searchParams.set('query', q);
  u.searchParams.set('language', 'ko-KR');
  u.searchParams.set('include_adult', 'false');
  const headers: Record<string, string> = { accept: 'application/json' };
  // 긴 "API Read Access Token"이면 헤더로, 짧은 "API Key"면 주소에 넣어요.
  if (token.length > 40) headers.Authorization = `Bearer ${token}`;
  else u.searchParams.set('api_key', token);
  const r = await fetchWithTimeout(u.toString(), { headers });
  if (r.status === 401) throw new HttpError(502, 'TMDB 키가 맞지 않아요.');
  if (!r.ok) throw new HttpError(502, `TMDB 오류 (${r.status})`);
  const data = (await r.json()) as { results?: TmdbItem[] };
  // 포스터가 있고 제목이 검색어와 같은 작품을 위로
  const norm = (x: string) => x.replace(/\s/g, '').toLowerCase();
  const nq = norm(q);
  const list = (data.results || []).slice().sort((a, b) => {
    const score = (it: TmdbItem) => (it.poster_path ? 2 : 0) + (norm(it.title || it.name || '') === nq ? 4 : 0);
    return score(b) - score(a);
  });
  return list.slice(0, 20).map((it) => {
    const title = it.title || it.name || '';
    const orig = it.original_title || it.original_name || '';
    const year = (it.release_date || it.first_air_date || '').slice(0, 4);
    return {
      title,
      creator: '',
      sub: [year, orig && orig !== title ? orig : ''].filter(Boolean).join(' · '),
      cover: it.poster_path ? `https://image.tmdb.org/t/p/w342${it.poster_path}` : null,
      link: `https://www.themoviedb.org/${kind}/${it.id}`,
    };
  });
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
      case 'movie': hits = await tmdb(q, 'movie'); break;
      case 'drama': case 'variety': hits = await tmdb(q, 'tv'); break;
      default: throw new HttpError(400, '이 종류는 검색 대신 표지 넣기로 담아요.');
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ hits });
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, '검색 중 문제가 생겼어요.');
    res.status(err.status).json({ error: err.message });
  }
}

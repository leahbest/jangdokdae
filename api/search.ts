// 표지·포스터 검색: GET /api/search?type=book&q=데미안
// 책·웹소설·웹툰/만화 → 알라딘, 영화·드라마 → TMDB, 뮤지컬·연극 → KOPIS
// 키는 Vercel 환경 변수(ALADIN_TTB_KEY, TMDB_TOKEN, KOPIS_KEY)에만 두고 브라우저로 보내지 않아요.
import { HttpError, decode, fetchWithTimeout, https, one, type Hit, type Req, type Res } from './_lib.js';

function need(name: string, label: string) {
  const v = process.env[name];
  if (!v) throw new HttpError(503, `${label} 키가 아직 설정되지 않았어요.`);
  return v;
}

/* ── 알라딘 ── */
type AladinItem = { title: string; author: string; publisher: string; pubDate: string; cover: string; link: string };

function splitAuthor(author: string) {
  // "오비디우스 (지은이), 이윤기 (옮긴이)" → creator: 오비디우스, translator: 이윤기
  const people = author.split(/,\s*/).map((p) => {
    const m = p.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    return m ? { name: m[1].trim(), role: m[2] } : { name: p.trim(), role: '' };
  });
  const main = people.filter((p) => !/옮긴이|번역|역자|감수|해설|엮은이/.test(p.role)).map((p) => p.name);
  const tr = people.filter((p) => /옮긴이|번역|역자/.test(p.role)).map((p) => p.name);
  return { creator: main.filter(Boolean).join(', '), translator: tr.join(', ') };
}

async function aladin(q: string, target: 'Book' | 'eBook'): Promise<Hit[]> {
  const key = need('ALADIN_TTB_KEY', '알라딘');
  const u = new URL('https://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
  Object.entries({
    ttbkey: key, Query: q, QueryType: 'Keyword', MaxResults: '20', start: '1',
    SearchTarget: target, output: 'js', Version: '20131101', Cover: 'Big',
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetchWithTimeout(u.toString());
  const text = await r.text();
  let data: { item?: AladinItem[]; errorCode?: number; errorMessage?: string };
  try {
    data = JSON.parse(text.replace(/;\s*$/, ''));
  } catch {
    throw new HttpError(502, '알라딘 응답을 읽지 못했어요.');
  }
  if (data.errorCode) throw new HttpError(502, `알라딘: ${data.errorMessage || '오류'}`);
  return (data.item || []).map((it) => {
    const { creator, translator } = splitAuthor(decode(it.author || ''));
    const year = (it.pubDate || '').slice(0, 4);
    return {
      title: decode(it.title),
      creator,
      sub: [translator && `${translator} 옮김`, decode(it.publisher || ''), year].filter(Boolean).join(' · '),
      cover: https(it.cover),
      link: https(it.link),
    };
  });
}

/* ── TMDB ── */
type TmdbItem = { id: number; title?: string; name?: string; original_title?: string; original_name?: string;
  release_date?: string; first_air_date?: string; poster_path?: string | null };

async function tmdb(q: string, kind: 'movie' | 'tv'): Promise<Hit[]> {
  const token = need('TMDB_TOKEN', 'TMDB');
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
  return (data.results || []).slice(0, 20).map((it) => {
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

/* ── KOPIS ── */
const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

async function kopis(q: string, genre: 'GGGA' | 'AAAA'): Promise<Hit[]> {
  const key = need('KOPIS_KEY', 'KOPIS');
  const now = new Date();
  const u = new URL('http://www.kopis.or.kr/openApi/restful/pblprfr');
  Object.entries({
    service: key, stdate: '20000101', eddate: ymd(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())),
    cpage: '1', rows: '30', shprfnm: q, shcate: genre,
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetchWithTimeout(u.toString());
  const xml = await r.text();
  const err = xml.match(/<returncode>([\s\S]*?)<\/returncode>[\s\S]*?<errmsg>([\s\S]*?)<\/errmsg>/);
  if (err && err[1].trim() !== '00') throw new HttpError(502, `KOPIS: ${decode(err[2])}`);
  const tag = (block: string, t: string) => decode(block.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1] || '');
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const m of xml.matchAll(/<db>([\s\S]*?)<\/db>/g)) {
    const b = m[1];
    const title = tag(b, 'prfnm');
    const from = tag(b, 'prfpdfrom').replace(/\./g, '.');
    const venue = tag(b, 'fcltynm');
    const k = `${title}|${venue}|${from}`;
    if (!title || seen.has(k)) continue;
    seen.add(k);
    hits.push({
      title,
      creator: '',
      sub: [venue, from && `${from.slice(0, 7)}~`].filter(Boolean).join(' · '),
      cover: https(tag(b, 'poster')) || null,
      link: `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${tag(b, 'mt20id')}`,
    });
  }
  return hits;
}

export default async function handler(req: Req, res: Res) {
  const type = one(req.query.type);
  const q = one(req.query.q);
  try {
    if (!q) throw new HttpError(400, '검색어를 넣어주세요.');
    if (q.length > 100) throw new HttpError(400, '검색어가 너무 길어요.');
    let hits: Hit[];
    switch (type) {
      case 'book': case 'comic': hits = await aladin(q, 'Book'); break;
      case 'webnovel': {
        const [e, b] = await Promise.allSettled([aladin(q, 'eBook'), aladin(q, 'Book')]);
        if (e.status === 'rejected' && b.status === 'rejected') throw e.reason;
        hits = [...(e.status === 'fulfilled' ? e.value : []), ...(b.status === 'fulfilled' ? b.value : [])].slice(0, 30);
        break;
      }
      case 'movie': hits = await tmdb(q, 'movie'); break;
      case 'drama': hits = await tmdb(q, 'tv'); break;
      case 'musical': hits = await kopis(q, 'GGGA'); break;
      case 'play': hits = await kopis(q, 'AAAA'); break;
      default: throw new HttpError(400, '알 수 없는 종류예요.');
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ hits });
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, '검색 중 문제가 생겼어요.');
    res.status(err.status).json({ error: err.message });
  }
}

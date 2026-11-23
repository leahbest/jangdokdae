// 링크로 표지 가져오기: GET /api/cover?url=https://ridibooks.com/books/123
// 작품 페이지의 대표 이미지(og:image)와 제목을 읽어요. 아무 주소나 열지 않도록 허용한 사이트만 받아요.
import { HttpError, decode, fetchWithTimeout, https, one, type Req, type Res } from './_lib.js';

const ALLOWED = [
  'ridibooks.com', 'lezhin.com', 'bomtoon.com', 'kyobobook.co.kr', 'aladin.co.kr', 'yes24.com',
  'comic.naver.com', 'series.naver.com', 'page.kakao.com', 'webtoon.kakao.com', 'millie.co.kr',
  'onestory.co.kr', 'toptoon.com', 'mrblue.com', 'themoviedb.org', 'watcha.com', 'kopis.or.kr',
  'interpark.com', 'nol.com', 'ticketlink.co.kr', 'playdb.co.kr',
];
const allowed = (host: string) => ALLOWED.some((d) => host === d || host.endsWith(`.${d}`));

function meta(html: string, prop: string) {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  return decode(html.match(re1)?.[1] || html.match(re2)?.[1] || '');
}

export default async function handler(req: Req, res: Res) {
  try {
    let url: URL;
    try {
      url = new URL(one(req.query.url));
    } catch {
      throw new HttpError(400, '주소 형식이 맞지 않아요.');
    }
    if (!/^https?:$/.test(url.protocol)) throw new HttpError(400, '주소는 https://로 시작해야 해요.');
    if (!allowed(url.hostname)) throw new HttpError(400, '아직 지원하지 않는 사이트예요. 표지를 직접 올려주세요.');

    // 리디: 주소의 도서 번호로 표지 주소를 바로 만들 수 있어요.
    const ridi = url.hostname.endsWith('ridibooks.com') && url.pathname.match(/\/books\/(\d+)/);
    let cover: string | null = ridi ? `https://img.ridicdn.net/cover/${ridi[1]}/xxlarge` : null;
    let title = '';

    try {
      const r = await fetchWithTimeout(url.toString(), {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; JangdokdaeCover/1.0)', 'accept-language': 'ko-KR,ko;q=0.9' },
        redirect: 'follow',
      }, 7000);
      const html = (await r.text()).slice(0, 400_000);
      title = meta(html, 'og:title') || decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
      title = title.replace(/\s*[-|:]\s*(리디|RIDI|레진코믹스|봄툰|교보문고|알라딘|YES24|네이버.*|카카오.*)$/i, '').trim();
      const og = meta(html, 'og:image');
      if (!cover && og) cover = https(new URL(og, url).toString());
    } catch {
      if (!cover) throw new HttpError(502, '페이지를 열지 못했어요. 표지를 직접 올려주세요.');
    }
    if (!cover) throw new HttpError(404, '이 페이지에서 표지를 찾지 못했어요. 표지를 직접 올려주세요.');
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.status(200).json({ cover, title });
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, '표지를 가져오는 중 문제가 생겼어요.');
    res.status(err.status).json({ error: err.message });
  }
}

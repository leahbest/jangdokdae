// 임시 진단용: 허용 사이트 페이지에서 표지 후보를 찾기 위한 요약. 확인 후 삭제 예정.
import type { Req, Res } from './_lib.js';
import { one } from './_lib.js';

const OK = ['lezhin.com', 'bomtoon.com', 'page.kakao.com', 'series.naver.com', 'ridibooks.com'];

export default async function handler(req: Req, res: Res) {
  const u = new URL(one(req.query.url));
  if (!OK.some((d) => u.hostname === d || u.hostname.endsWith('.' + d))) return res.status(400).json({ error: 'no' });
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; JangdokdaeCover/1.0)', 'accept-language': 'ko-KR' } });
  const html = await r.text();
  const imgs = [...new Set(html.match(/https?:\\?\/\\?\/[^"'\s)]+?\.(?:jpe?g|png|webp)[^"'\s)]*/gi) || [])].slice(0, 25);
  const links = [...new Set(html.match(/\/(?:ko\/comic|detail|content|comic\/detail\.series\?productNo=)[\/=][A-Za-z0-9_\-%]+/g) || [])].slice(0, 15);
  const metas = (html.match(/<meta[^>]+(?:og:|twitter:)[^>]+>/gi) || []).slice(0, 10);
  res.status(200).json({ status: r.status, final: r.url, len: html.length, title: (html.match(/<title>([^<]*)/) || [])[1], metas, imgs, links });
}

// 임시 진단용: 카카오웹툰 페이지/공개 API에서 표지 후보 확인. 확인 후 삭제 예정.
import type { Req, Res } from './_lib.js';
import { one } from './_lib.js';

export default async function handler(req: Req, res: Res) {
  const u = new URL(one(req.query.url));
  const ok = ['webtoon.kakao.com', 'gateway-kw.kakao.com', 'kko.to', 'kko.kakao.com'];
  if (!ok.includes(u.hostname)) return res.status(400).json({ error: 'no' });
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; JangdokdaeCover/1.0)', 'accept-language': 'ko-KR', 'accept': 'text/html,application/json' } });
  const body = await r.text();
  const metas = (body.match(/<meta[^>]+(?:og:|twitter:)[^>]+>/gi) || []).slice(0, 8);
  const imgs = [...new Set(body.match(/https?:\/\/[^"'\s)\\]+?\.(?:jpe?g|png|webp)/gi) || [])].slice(0, 20);
  const keys = [...new Set(body.match(/"[A-Za-z]*(?:[Ii]mage|[Tt]humbnail|[Tt]itle)[A-Za-z]*"\s*:/g) || [])].slice(0, 40);
  res.status(200).json({ status: r.status, final: r.url, len: body.length, head: body.slice(0, 300), metas, imgs, keys });
}

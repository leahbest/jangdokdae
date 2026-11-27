// 임시 진단용: 장독대 서버(서울)에서 만화규장각 접속 가능 여부. 확인 후 삭제 예정.
import type { Req, Res } from './_lib.js';

export default async function handler(_req: Req, res: Res) {
  const urls = ['https://www.kmas.or.kr/', 'https://kmas.or.kr/guide/openapi'];
  const out = await Promise.all(urls.map(async (u) => {
    const t = Date.now();
    const c = new AbortController(); const h = setTimeout(() => c.abort(), 10000);
    try { const r = await fetch(u, { signal: c.signal }); const b = await r.text(); return { u, status: r.status, ms: Date.now() - t, len: b.length }; }
    catch (e) { return { u, error: (e as Error).name, ms: Date.now() - t }; }
    finally { clearTimeout(h); }
  }));
  res.status(200).json({ region: process.env.VERCEL_REGION, out });
}

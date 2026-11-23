// 임시 진단용: KOPIS 호출 방식별 응답 시간 확인 (키 값은 응답에 넣지 않음). 확인 후 삭제 예정.
import type { Req, Res } from './_lib.js';

async function probe(label: string, url: string) {
  const t = Date.now();
  const ctrl = new AbortController();
  const h = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    const body = await r.text();
    return { label, status: r.status, ms: Date.now() - t, head: body.slice(0, 160).replace(/\s+/g, ' ') };
  } catch (e) {
    return { label, error: (e as Error).name, ms: Date.now() - t };
  } finally {
    clearTimeout(h);
  }
}

export default async function handler(_req: Req, res: Res) {
  const key = encodeURIComponent(process.env.KOPIS_KEY || '');
  const q = encodeURIComponent('레미제라블');
  const base = `service=${key}&cpage=1&rows=5&shprfnm=${q}&shcate=GGGA`;
  const out = await Promise.all([
    probe('http wide', `http://www.kopis.or.kr/openApi/restful/pblprfr?${base}&stdate=20000101&eddate=20271231`),
    probe('https wide', `https://www.kopis.or.kr/openApi/restful/pblprfr?${base}&stdate=20000101&eddate=20271231`),
    probe('http 31d', `http://www.kopis.or.kr/openApi/restful/pblprfr?${base}&stdate=20261101&eddate=20261201`),
    probe('https 31d', `https://www.kopis.or.kr/openApi/restful/pblprfr?${base}&stdate=20261101&eddate=20261201`),
    probe('https kopis.or.kr', `https://kopis.or.kr/openApi/restful/pblprfr?${base}&stdate=20261101&eddate=20261201`),
  ]);
  res.status(200).json({ hasKey: !!key, region: process.env.VERCEL_REGION, out });
}

// Vercel 서버 함수 공용 도구 (파일 이름이 _로 시작하면 주소로 노출되지 않아요)
export type Req = { query: Record<string, string | string[] | undefined> };
export type Res = {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(k: string, v: string): void;
};

export type Hit = {
  title: string;
  creator: string;
  sub: string;
  cover: string | null;
  link: string | null;
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? '').trim();

export const https = (u: string | null | undefined) => (u ? u.replace(/^http:\/\//, 'https://') : null);

export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch {
    throw new HttpError(504, '검색 서버가 응답하지 않아요. 잠시 후 다시 시도해주세요.');
  } finally {
    clearTimeout(t);
  }
}

export const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .trim();

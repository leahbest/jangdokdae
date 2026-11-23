// 예능 종류 + 표지 사진 저장소 점검: node scripts/selftest-storage.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const env = Object.fromEntries(readFileSync(new URL('../.env.production', import.meta.url), 'utf8')
  .split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const email = 'jd_selftest@jangdokdae.app', pw = 'selftest-pw-2026';
const log = (k, v) => console.log(k.padEnd(26), typeof v === 'string' ? v : JSON.stringify(v));

let r = await sb.auth.signInWithPassword({ email, password: pw });
if (r.error) { r = await sb.auth.signUp({ email, password: pw }); log('test account', r.error?.message ?? 're-created'); }
else log('test account', 'signed in');
const uid = r.data.user.id;

// 1) 예능 장독
const jarId = crypto.randomUUID();
log('variety jar insert', (await sb.from('jars').insert({ id: jarId, name: '예능 시험', type: 'variety' })).error?.message ?? 'ok');

// 2) 작은 PNG 올리기 → 공개 주소로 읽기
const w = 4, h = 6, raw = Buffer.concat(Array.from({ length: h }, () => Buffer.from([0, ...Array(w).fill([200, 80, 40]).flat()])));
const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([Buffer.from(t), d])) >>> 0); return Buffer.concat([len, Buffer.from(t), d, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 2, 0, 0, 0], 8);
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
const path = `${uid}/selftest-${Date.now()}.png`;
const up = await sb.storage.from('covers').upload(path, png, { contentType: 'image/png', upsert: false });
log('upload own folder', up.error?.message ?? 'ok');
const pub = sb.storage.from('covers').getPublicUrl(path).data.publicUrl;
const got = await fetch(pub);
log('public read', `${got.status} ${got.headers.get('content-type')}`);
const other = await sb.storage.from('covers').upload(`someone-else/x.png`, png, { contentType: 'image/png' });
log('upload other folder', other.error ? `blocked (${other.error.message})` : 'NOT BLOCKED');
const big = await sb.storage.from('covers').upload(`${uid}/x.txt`, Buffer.from('hi'), { contentType: 'text/plain' });
log('non-image upload', big.error ? `blocked (${big.error.message})` : 'NOT BLOCKED');

// 3) 정리
log('cleanup file', (await sb.storage.from('covers').remove([path])).error?.message ?? 'ok');
log('cleanup jar', (await sb.from('jars').delete().eq('id', jarId)).error?.message ?? 'ok');

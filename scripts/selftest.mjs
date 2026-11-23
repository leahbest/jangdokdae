// Supabase 연결 자가 점검: node scripts/selftest.mjs
// 시험용 계정(jd_selftest)으로 가입/로그인 → 장독·작품 쓰기/읽기 → 다른 세션에서 동기화 확인 → 정리
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(readFileSync(new URL('../.env.production', import.meta.url), 'utf8')
  .split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const mk = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const email = 'jd_selftest@jangdokdae.app';
const pw = 'selftest-' + 'pw-2026';
const log = (k, v) => console.log(k.padEnd(28), typeof v === 'string' ? v : JSON.stringify(v));

const a = mk();
let r = await a.auth.signUp({ email, password: pw });
if (r.error && /already/i.test(r.error.message)) r = await a.auth.signInWithPassword({ email, password: pw });
log('signup/signin', r.error ? r.error.message : `ok session=${!!r.data.session}`);
if (!r.data?.session) process.exit(1);

log('set_recovery (authed)', (await a.rpc('set_recovery', { p_code: 'TEST-TEST-TEST' })).error?.message ?? 'ok');
const jarId = crypto.randomUUID();
log('insert jar', (await a.from('jars').insert({ id: jarId, name: '시험 장독', type: 'book' })).error?.message ?? 'ok');
const itemId = crypto.randomUUID();
log('insert item', (await a.from('items').insert({ id: itemId, jar_id: jarId, title: '시험 작품' })).error?.message ?? 'ok');
log('update item', (await a.from('items').update({ done_at: new Date().toISOString(), rating: 5 }).eq('id', itemId)).error?.message ?? 'ok');

const b = mk();
await b.auth.signInWithPassword({ email, password: pw });
const got = await b.from('jars').select('name, items(title, rating)').eq('id', jarId);
log('other session reads', got.error?.message ?? got.data);

const anon = mk();
const anonRead = await anon.from('jars').select('id').eq('id', jarId);
log('anon reads (should be blocked)', anonRead.error?.message ?? anonRead.data);
const rpcAnon = await anon.rpc('reset_password_with_code', { p_username: 'jd_selftest', p_code: 'WRON-GCOD-EXXX', p_new_password: 'whatever12' });
log('reset wrong code (anon)', rpcAnon.error?.message ?? rpcAnon.data);
const rpcAuthed = await b.rpc('reset_password_with_code', { p_username: 'nobody_x', p_code: 'WRON-GCOD-EXXX', p_new_password: 'whatever12' });
log('reset wrong code (authed)', rpcAuthed.error?.message ?? rpcAuthed.data);

log('cleanup jar', (await a.from('jars').delete().eq('id', jarId)).error?.message ?? 'ok');

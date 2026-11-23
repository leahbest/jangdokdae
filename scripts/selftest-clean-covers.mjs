// 시험 계정(jd_selftest) 폴더에 남은 사진 정리: node scripts/selftest-clean-covers.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync(new URL('../.env.production', import.meta.url), 'utf8')
  .split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const r = await sb.auth.signInWithPassword({ email: 'jd_selftest@jangdokdae.app', password: 'selftest-pw-2026' });
if (r.error) { console.log('login', r.error.message); process.exit(1); }
const uid = r.data.user.id;
const { data, error } = await sb.storage.from('covers').list(uid);
console.log('files', error?.message ?? (data || []).length);
const paths = (data || []).map((f) => `${uid}/${f.name}`);
if (paths.length) console.log('removed', (await sb.storage.from('covers').remove(paths)).error?.message ?? paths.length);

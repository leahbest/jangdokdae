import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('/home/user/jangdokdae/.env.production','utf8').split('\n').filter(Boolean).map(l=>l.split(/=(.*)/s).slice(0,2)));
const c = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {auth:{persistSession:false}});
const r = await c.auth.signInWithPassword({email:'jd_selftest@jangdokdae.app', password:'selftest-pw-2026'});
console.log('login', r.error?.message ?? 'ok');
const d = await c.from('jars').delete().neq('id','00000000-0000-0000-0000-000000000000').select('id');
console.log('deleted jars', d.error?.message ?? d.data.length);
console.log('recovery reset', (await c.rpc('set_recovery',{p_code:'TEST-TEST-TEST'})).error?.message ?? 'ok');

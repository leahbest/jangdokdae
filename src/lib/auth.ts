import { supabase } from './supabase';

/**
 * 이메일 없이 아이디만으로 가입하기 위해, Supabase 안에서는 "아이디@도메인" 형태의
 * 가짜 주소를 계정 이름으로 써요. 이 주소로 메일이 가는 일은 없어요
 * (Supabase에서 이메일 인증을 꺼두어야 해요).
 */
const DOMAIN = (import.meta.env.VITE_AUTH_EMAIL_DOMAIN as string | undefined) || 'jangdokdae.app';
export const USERNAME_RE = /^[a-z0-9_]{4,20}$/;
export const MIN_PASSWORD = 8;

const toEmail = (username: string) => `${username.trim().toLowerCase()}@${DOMAIN}`;
export const usernameOf = (email?: string | null) => (email || '').split('@')[0];

function sb() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았어요.');
  return supabase;
}

export function makeRecoveryCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O, 1/I 제외 (32자)
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(bytes, (b) => A[b % 32]).join('');
  return s.match(/.{4}/g)!.join('-');
}

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) return '이미 누군가 쓰고 있는 아이디예요.';
  if (m.includes('invalid login credentials')) return '아이디나 비밀번호가 맞지 않아요.';
  if (m.includes('email') && m.includes('invalid')) return '가입용 주소 형식이 거부됐어요. 설정의 VITE_AUTH_EMAIL_DOMAIN 값을 확인해주세요.';
  if (m.includes('password')) return '비밀번호가 너무 짧거나 쉬워요. 8자 이상으로 정해주세요.';
  if (m.includes('rate limit')) return '잠시 후 다시 시도해주세요.';
  if (m.includes('fetch')) return '인터넷 연결을 확인해주세요.';
  return message;
}

export async function signUp(username: string, password: string) {
  const { data, error } = await sb().auth.signUp({ email: toEmail(username), password });
  if (error) throw new Error(friendly(error.message));
  if (!data.session) {
    throw new Error('Supabase에서 "Confirm email"이 켜져 있어요. 끈 뒤 다시 가입해주세요.');
  }
  const code = makeRecoveryCode();
  const r = await sb().rpc('set_recovery', { p_code: code });
  if (r.error) throw new Error(friendly(r.error.message));
  return code;
}

export async function signIn(username: string, password: string) {
  const { error } = await sb().auth.signInWithPassword({ email: toEmail(username), password });
  if (error) throw new Error(friendly(error.message));
}

export async function resetWithCode(username: string, code: string, newPassword: string) {
  const { data, error } = await sb().rpc('reset_password_with_code', {
    p_username: username.trim().toLowerCase(),
    p_code: code.trim(),
    p_new_password: newPassword,
  });
  if (error) throw new Error(friendly(error.message));
  if (!data) throw new Error('아이디나 복구 코드가 맞지 않아요.');
  await signIn(username, newPassword);
}

export async function regenerateCode() {
  const code = makeRecoveryCode();
  const { error } = await sb().rpc('set_recovery', { p_code: code });
  if (error) throw new Error(friendly(error.message));
  return code;
}

export async function signOut() {
  await sb().auth.signOut();
}

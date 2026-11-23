import { useState, type FormEvent } from 'react';
import { MIN_PASSWORD, USERNAME_RE, resetWithCode, signIn, signUp } from '../lib/auth';
import { Logo } from '../components/visuals';

type Mode = 'login' | 'signup' | 'reset';

export function AuthScreen({ onSignedUp }: { onSignedUp: (code: string) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const switchTo = (m: Mode) => { setMode(m); setErr(''); setPassword(''); setPassword2(''); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) return setErr('아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자예요.');
    if (password.length < MIN_PASSWORD) return setErr(`비밀번호는 ${MIN_PASSWORD}자 이상이에요.`);
    if (mode !== 'login' && password !== password2) return setErr('비밀번호 두 개가 서로 달라요.');
    if (mode === 'reset' && code.replace(/[^A-Za-z0-9]/g, '').length !== 12) return setErr('복구 코드는 12자리예요. (예: K7PM-2XQA-9WTD)');
    setBusy(true); setErr('');
    try {
      if (mode === 'login') await signIn(u, password);
      else if (mode === 'signup') onSignedUp(await signUp(u, password));
      else await resetWithCode(u, code, password);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth-brand"><Logo /><b>장독대</b></div>
      <p className="auth-tag">보고 싶은 걸 담아 묵혀두고, 하나씩 꺼내 맛보는 곳</p>

      <div className="auth-card">
        {mode !== 'reset' && (
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchTo('login')}>로그인</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => switchTo('signup')}>가입하기</button>
          </div>
        )}
        {mode === 'reset' && <h2 className="auth-h">비밀번호 다시 정하기</h2>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="u">아이디</label>
            <input id="u" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20}
              value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
            {mode === 'signup' && <p className="hint">영문 소문자·숫자·밑줄 4~20자. 이메일이나 전화번호는 받지 않아요.</p>}
          </div>
          {mode === 'reset' && (
            <div className="field">
              <label htmlFor="code">복구 코드</label>
              <input id="code" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX"
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </div>
          )}
          <div className="field">
            <label htmlFor="p">{mode === 'reset' ? '새 비밀번호' : '비밀번호'}</label>
            <input id="p" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode !== 'login' && (
            <div className="field">
              <label htmlFor="p2">비밀번호 한 번 더</label>
              <input id="p2" type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
            </div>
          )}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="primary wide" type="submit" disabled={busy}>
            {busy ? '잠시만요…' : mode === 'login' ? '로그인' : mode === 'signup' ? '가입하기' : '비밀번호 바꾸고 로그인'}
          </button>
        </form>

        <div className="auth-foot">
          {mode === 'login' && <button type="button" className="link" onClick={() => switchTo('reset')}>비밀번호를 잊었어요</button>}
          {mode === 'reset' && <button type="button" className="link" onClick={() => switchTo('login')}>← 로그인으로</button>}
        </div>
      </div>
    </main>
  );
}

/** 가입 직후 또는 새로 만들 때 한 번만 보여주는 복구 코드 */
export function RecoveryCode({ code, onDone }: { code: string; onDone: () => void }) {
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); } catch { /* 직접 적어두면 돼요 */ }
  };
  return (
    <main className="auth">
      <div className="auth-brand"><Logo /><b>장독대</b></div>
      <div className="auth-card">
        <h2 className="auth-h">복구 코드를 적어두세요</h2>
        <p className="lead">이메일을 받지 않기 때문에, 비밀번호를 잊으면 <b>이 코드로만</b> 되찾을 수 있어요. 지금 한 번만 보여드려요.</p>
        <div className="code-box" aria-label="복구 코드">{code}</div>
        <button className="ghost wide" type="button" onClick={copy}>{copied ? '복사했어요 ✓' : '코드 복사하기'}</button>
        <label className="check">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>캡처하거나 안전한 곳에 적어뒀어요</span>
        </label>
        <button className="primary wide" type="button" disabled={!ok} onClick={onDone}>장독대로 들어가기</button>
      </div>
    </main>
  );
}

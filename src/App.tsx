import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { LocalStore, SupabaseStore, type Store } from './lib/store';
import { regenerateCode, signOut, usernameOf } from './lib/auth';
import { useJangdok } from './lib/useJangdok';
import type { Item } from './lib/types';
import { stats } from './lib/types';
import { Sheet, ToastProvider, useToast } from './components/ui';
import { LadleIcon, Logo } from './components/visuals';
import {
  AddSheet, CrackSheet, ItemMenuSheet, JarMenuSheet, LadleSheet, MemoSheet, NewJarSheet, RatingSheet,
} from './components/sheets';
import { Home } from './screens/Home';
import { JarScreen } from './screens/JarScreen';
import { Report } from './screens/Report';
import { AuthScreen, RecoveryCode } from './screens/Auth';

export default function App() {
  return (
    <ToastProvider>
      <Root />
    </ToastProvider>
  );
}

function Root() {
  const local = useMemo(() => (supabase ? null : new LocalStore()), []);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const cloud = useMemo(() => (supabase && session ? new SupabaseStore(supabase) : null), [session?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (local) return <Main store={local} account={null} onShowCode={setCode} />;
  if (code) return <RecoveryCode code={code} onDone={() => setCode(null)} />;
  if (session === undefined) return <main className="loading">장독대를 여는 중…</main>;
  if (!session || !cloud) return <AuthScreen onSignedUp={setCode} />;
  return <Main key={session.user.id} store={cloud} account={usernameOf(session.user.email)} onShowCode={setCode} />;
}

type Route = { name: 'home'; tab: 'active' | 'broken' } | { name: 'report' } | { name: 'jar'; id: string };
function parse(h: string): Route {
  h = h.replace(/^#/, '');
  if (h === 'broken') return { name: 'home', tab: 'broken' };
  if (h === 'report') return { name: 'report' };
  if (h.startsWith('jar-')) return { name: 'jar', id: h.slice(4) };
  return { name: 'home', tab: 'active' };
}

type SheetState =
  | { k: 'newJar' } | { k: 'item'; id: string } | { k: 'rate'; id: string } | { k: 'memo'; id: string }
  | { k: 'jarMenu' } | { k: 'crack'; jarId: string } | { k: 'add' } | { k: 'ladle' } | { k: 'account' } | null;

function Main({ store, account, onShowCode }: { store: Store; account: string | null; onShowCode: (c: string) => void }) {
  const toast = useToast();
  const onError = useCallback((m: string) => toast.show(m), [toast]);
  const data = useJangdok(store, onError);
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  const [sheet, setSheetRaw] = useState<SheetState>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    const on = () => { setRoute(parse(location.hash)); setFocusId(null); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const nav = (h: string) => {
    if (location.hash.replace(/^#/, '') === h) return;
    location.hash = h;
    window.scrollTo(0, 0);
  };
  const openSheet = (s: SheetState) => { toast.clear(); setSheetRaw(s); };
  const close = () => setSheetRaw(null);

  const jars = data.jars;
  if (!jars) {
    return (
      <main className="loading">
        {data.loadError ? (
          <>
            <p>장독대를 불러오지 못했어요. 인터넷 연결을 확인해주세요.</p>
            <button className="ghost" type="button" onClick={data.reload}>다시 시도</button>
          </>
        ) : '장독대를 여는 중…'}
      </main>
    );
  }

  const findItem = (id: string) => jars.flatMap((j) => j.items).find((i) => i.id === id);
  const jar = route.name === 'jar' ? jars.find((j) => j.id === route.id) : undefined;
  const view: Route = route.name === 'jar' && !jar ? { name: 'home', tab: 'active' } : route;

  const toggle = (it: Item) => {
    const j = jars.find((x) => x.id === it.jar_id)!;
    const nowDone = !it.done_at;
    data.setDone(it.id, nowDone);
    if (j.broken_at && !nowDone) {
      data.unbreakJar(j.id);
      toast.show('남은 게 생겨서 장독대에 다시 놓았어요');
      return;
    }
    if (nowDone) {
      const left = stats(j).left - 1;
      toast.show(left ? '완료했어요!' : '장독을 다 비웠어요!', {
        label: it.rating ? '별점 바꾸기' : '별점 남기기',
        fn: () => openSheet({ k: 'rate', id: it.id }),
      });
    }
  };

  const header = (
    <header className="top">
      {view.name === 'jar' ? (
        <button className="back" type="button" onClick={() => nav(jar!.broken_at ? 'broken' : '')}>← {jar!.broken_at ? '깬 장독' : '장독대'}</button>
      ) : (
        <button className="logo" type="button" onClick={() => nav('')}><Logo /><b>장독대</b></button>
      )}
      <div className="head-actions">
        {view.name === 'home' && <button className="ghost" type="button" onClick={() => nav('report')}>이달의 리포트</button>}
        <button className="ghost" type="button" onClick={() => openSheet({ k: 'account' })}>{account ?? '체험 모드'}</button>
      </div>
    </header>
  );

  const s = sheet;
  const sItem = s && 'id' in s ? findItem(s.id) : undefined;

  return (
    <>
      {!account && (
        <div className="notice" role="note">
          <span>체험 모드예요. 계정 없이 이 기기에만 저장돼요.</span>
        </div>
      )}
      <main className="wrap">
        {view.name === 'report' ? (
          <Report jars={jars} onBack={() => nav('')} />
        ) : (
          <>
            {header}
            {view.name === 'home' ? (
              <Home jars={jars} tab={view.tab} nav={nav} onNewJar={() => openSheet({ k: 'newJar' })} />
            ) : (
              <JarScreen
                key={jar!.id}
                jar={jar!}
                focusId={focusId}
                onToggle={toggle}
                onItemMenu={(it) => openSheet({ k: 'item', id: it.id })}
                onAdd={() => openSheet({ k: 'add' })}
                onJarMenu={() => openSheet({ k: 'jarMenu' })}
                onCrack={() => { data.breakJar(jar!.id); openSheet({ k: 'crack', jarId: jar!.id }); nav(''); }}
              />
            )}
          </>
        )}
      </main>

      {view.name !== 'report' && (
        <button className="fab" type="button" onClick={() => openSheet({ k: 'ladle' })} aria-label="모든 장독에서 한 국자 뜨기">
          <LadleIcon />한 국자 뜨기
        </button>
      )}

      {s?.k === 'newJar' && (
        <NewJarSheet onClose={close} onCreate={(name, type) => { const id = data.createJar(name, type); close(); nav(`jar-${id}`); }} />
      )}
      {s?.k === 'item' && sItem && (
        <ItemMenuSheet
          it={sItem}
          jar={jars.find((j) => j.id === sItem.jar_id)!}
          onClose={close}
          onRate={() => openSheet({ k: 'rate', id: sItem.id })}
          onMemo={() => openSheet({ k: 'memo', id: sItem.id })}
          onRemove={() => { data.removeItem(sItem.id); close(); toast.show('장독에서 뺐어요'); }}
        />
      )}
      {s?.k === 'rate' && sItem && (
        <RatingSheet it={sItem} onClose={close} onRate={(n) => { data.rate(sItem.id, n); close(); toast.show(n ? `별점 ${n}점을 남겼어요` : '별점을 지웠어요'); }} />
      )}
      {s?.k === 'memo' && sItem && (
        <MemoSheet it={sItem} onClose={close} onSave={(m) => { data.memo(sItem.id, m); close(); toast.show(m ? '메모를 남겼어요' : '메모를 지웠어요'); }} />
      )}
      {s?.k === 'jarMenu' && jar && (
        <JarMenuSheet
          jar={jar}
          onClose={close}
          onRename={(name) => { data.renameJar(jar.id, name); close(); }}
          onUnbreak={() => { data.unbreakJar(jar.id); close(); nav(''); toast.show('장독대에 다시 놓았어요'); }}
          onTidy={() => { const tab = jar.broken_at ? 'broken' : ''; data.deleteJar(jar.id); close(); nav(tab); toast.show('장독을 치웠어요'); }}
        />
      )}
      {s?.k === 'crack' && jars.find((j) => j.id === s.jarId) && (
        <CrackSheet jar={jars.find((j) => j.id === s.jarId)!} onClose={close} onSee={() => { close(); nav('broken'); }} />
      )}
      {s?.k === 'add' && jar && (
        <AddSheet jar={jar} onClose={close} onAdd={(d) => data.addItem(jar.id, { ...d, cover_url: null })} />
      )}
      {s?.k === 'ladle' && (
        <LadleSheet jars={jars} onClose={close} onGo={(jarId, itemId) => { close(); setFocusId(itemId); nav(`jar-${jarId}`); setTimeout(() => setFocusId(itemId)); }} />
      )}
      {s?.k === 'account' && (
        <AccountSheet account={account} onClose={close} onShowCode={(c) => { close(); onShowCode(c); }} />
      )}
    </>
  );
}

function AccountSheet({ account, onClose, onShowCode }: { account: string | null; onClose: () => void; onShowCode: (c: string) => void }) {
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  if (!account) {
    return (
      <Sheet onClose={onClose} label="체험 모드">
        <h2>체험 모드</h2>
        <p className="lead">지금은 계정 없이 이 브라우저에만 저장하고 있어요. 서버 설정이 연결되면 아이디로 가입해서 휴대폰과 PC에서 함께 쓸 수 있어요.</p>
        <div className="sheet-actions"><button className="primary" type="button" onClick={onClose}>닫기</button></div>
      </Sheet>
    );
  }
  return (
    <Sheet onClose={onClose} label="내 계정">
      <h2>{account}</h2>
      <p className="lead">같은 아이디로 로그인하면 휴대폰과 PC에서 같은 장독대를 볼 수 있어요.</p>
      {confirm ? (
        <>
          <p>새 복구 코드를 만들면 예전 코드는 더 이상 쓸 수 없어요.</p>
          {err && <p className="err">{err}</p>}
          <div className="sheet-actions">
            <button className="ghost" type="button" onClick={() => setConfirm(false)}>그만두기</button>
            <button className="primary" type="button" onClick={async () => {
              try { onShowCode(await regenerateCode()); } catch (e) { setErr((e as Error).message); }
            }}>새로 만들기</button>
          </div>
        </>
      ) : (
        <div className="menu">
          <button type="button" onClick={() => setConfirm(true)}>복구 코드 새로 만들기</button>
          <button type="button" className="danger" onClick={() => { onClose(); signOut(); }}>로그아웃</button>
        </div>
      )}
    </Sheet>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Item, Jar, JarType } from '../lib/types';
import { RATE_LABEL, TYPES } from '../lib/types';
import { fmtDay } from '../lib/util';
import { uploadCover } from '../lib/upload';
import { Sheet } from './ui';
import { Cover, JarIcon, StarCluster } from './visuals';

export function NewJarSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, type: JarType) => void }) {
  const [type, setType] = useState<JarType>('book');
  const [name, setName] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr(true);
    onCreate(name.trim(), type);
  };
  return (
    <Sheet onClose={onClose} label="새 장독 놓기">
      <h2>새 장독 놓기</h2>
      <p className="lead">한 장독에는 한 종류만 담아요.</p>
      <form onSubmit={submit}>
        <div className="types" role="radiogroup" aria-label="종류">
          {(Object.keys(TYPES) as JarType[]).map((k) => (
            <label key={k}>
              <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} />
              <span>{TYPES[k].label}</span>
            </label>
          ))}
        </div>
        <div className="field">
          <label htmlFor="jar-name">장독 이름</label>
          <input id="jar-name" maxLength={24} placeholder="예: 올해 꼭 읽을 소설" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {err && <p className="err">장독 이름을 적어주세요.</p>}
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={onClose}>취소</button>
          <button className="primary" type="submit">놓기</button>
        </div>
      </form>
    </Sheet>
  );
}

export function ItemMenuSheet({ it, jar, onClose, onRate, onMemo, onCover, onRemove }: {
  it: Item; jar: Jar; onClose: () => void; onRate: () => void; onMemo: () => void; onCover: () => void; onRemove: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet onClose={onClose} label={it.title}>
      <h2>{it.title}</h2>
      <p className="lead">{[it.creator, it.sub].filter(Boolean).join(' · ') || jar.name}</p>
      {confirm ? (
        <>
          <p>장독에서 뺄까요? 별점과 메모도 함께 사라져요.</p>
          <div className="sheet-actions">
            <button className="ghost" type="button" onClick={() => setConfirm(false)}>그만두기</button>
            <button className="primary danger-btn" type="button" onClick={onRemove}>빼기</button>
          </div>
        </>
      ) : (
        <>
          <div className="menu">
            {it.done_at && <button type="button" onClick={onRate}>별점 {it.rating ? '바꾸기' : '남기기'}</button>}
            <button type="button" onClick={onMemo}>{it.memo ? '메모 고치기' : '메모 남기기'}</button>
            <button type="button" onClick={onCover}>표지 바꾸기</button>
            {it.source_url && <a className="menu-link" href={it.source_url} target="_blank" rel="noreferrer">작품 페이지 열기</a>}
            <button type="button" className="danger" onClick={() => setConfirm(true)}>장독에서 빼기</button>
          </div>
          {!it.done_at && <p className="hint" style={{ padding: '4px 12px 0' }}>완료하면 별점을 남길 수 있어요.</p>}
        </>
      )}
    </Sheet>
  );
}

export function RatingSheet({ it, onClose, onRate }: { it: Item; onClose: () => void; onRate: (n: number | null) => void }) {
  return (
    <Sheet onClose={onClose} label="별점 남기기">
      <h2>별점 남기기</h2>
      <p className="lead">{it.title}</p>
      <div className="rates">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="rate-btn" aria-pressed={it.rating === n} aria-label={`${n}점 ${RATE_LABEL[n]}`} onClick={() => onRate(n)}>
            <StarCluster n={n} />
            <span>{RATE_LABEL[n]}</span>
          </button>
        ))}
      </div>
      <div className="sheet-actions">
        {it.rating ? <button className="ghost" type="button" onClick={() => onRate(null)}>별점 지우기</button> : null}
        <button className="ghost" type="button" onClick={onClose}>{it.rating ? '닫기' : '나중에'}</button>
      </div>
    </Sheet>
  );
}

export function MemoSheet({ it, onClose, onSave }: { it: Item; onClose: () => void; onSave: (memo: string | null) => void }) {
  const [text, setText] = useState(it.memo || '');
  return (
    <Sheet onClose={onClose} label="메모">
      <h2>메모</h2>
      <p className="lead">{it.title} · 남기고 싶을 때만 짧게</p>
      <form onSubmit={(e) => { e.preventDefault(); onSave(text.trim() || null); }}>
        <div className="field">
          <label htmlFor="memo-text">한 줄 메모</label>
          <textarea id="memo-text" maxLength={120} placeholder="기억하고 싶은 장면, 한 줄 감상…" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <p className="hint">{text.length} / 120자. 비워두고 저장하면 메모가 지워져요.</p>
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={onClose}>취소</button>
          <button className="primary" type="submit">저장</button>
        </div>
      </form>
    </Sheet>
  );
}

export function JarMenuSheet({ jar, onClose, onRename, onUnbreak, onTidy }: {
  jar: Jar; onClose: () => void; onRename: (name: string) => void; onUnbreak: () => void; onTidy: () => void;
}) {
  const [name, setName] = useState(jar.name);
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <Sheet onClose={onClose} label="장독 치우기">
        <h2>장독을 치울까요?</h2>
        <p className="lead">‘{jar.name}’ 장독과 담긴 {jar.items.length}편이 모두 사라지고, 되돌릴 수 없어요.</p>
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={() => setConfirm(false)}>그만두기</button>
          <button className="primary danger-btn" type="button" onClick={onTidy}>치우기</button>
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet onClose={onClose} label={jar.name}>
      <h2>{jar.name}</h2>
      <p className="lead">{TYPES[jar.type].label} 장독{jar.broken_at ? ` · ${fmtDay(jar.broken_at)}에 깸` : ''}</p>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onRename(name.trim()); }}>
        <div className="field">
          <label htmlFor="rename">이름 바꾸기</label>
          <input id="rename" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sheet-actions"><button className="primary" type="submit">이름 저장</button></div>
      </form>
      <div className="menu">
        {jar.broken_at && <button type="button" onClick={onUnbreak}>장독대에 다시 놓기</button>}
        <button type="button" className="danger" onClick={() => setConfirm(true)}>장독 치우기</button>
      </div>
    </Sheet>
  );
}

export function CrackSheet({ jar, onClose, onSee }: { jar: Jar; onClose: () => void; onSee: () => void }) {
  return (
    <Sheet onClose={onClose} label="장독 깨기">
      <div className="crack-wrap">
        <JarIcon jar={jar} crackAnim />
        <h2>쨍그랑!</h2>
        <p className="lead">‘{jar.name}’ 장독을 깼어요. {jar.items.length}편을 모두 해치웠어요.</p>
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={onClose}>닫기</button>
          <button className="primary" type="button" onClick={onSee}>깬 장독 보기</button>
        </div>
      </div>
    </Sheet>
  );
}

type NewItem = { title: string; creator: string; sub: string; source_url: string | null; cover_url: string | null };
type Hit = { title: string; creator: string; sub: string; cover: string | null; link: string | null };
type AddTab = 'search' | 'link' | 'photo' | 'manual';

async function getJSON<T>(url: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error('인터넷 연결을 확인해주세요.');
  }
  const body = await r.json().catch(() => ({ error: '표지 서버에 연결하지 못했어요.' }));
  if (!r.ok) throw new Error(body.error || '문제가 생겼어요.');
  return body as T;
}

/** 담기: 검색(카카오 책·TMDB·KOPIS) / 링크로 표지 가져오기 / 직접 입력 */
export function AddSheet({ jar, onClose, onAdd }: { jar: Jar; onClose: () => void; onAdd: (d: NewItem) => void }) {
  const [tab, setTab] = useState<AddTab>('search');
  const [added, setAdded] = useState<string[]>(() => jar.items.map((i) => i.title));
  const add = (d: NewItem) => { onAdd(d); setAdded((a) => [...a, d.title]); };

  return (
    <Sheet onClose={onClose} label="담기">
      <h2>‘{jar.name}’에 담기</h2>
      <p className="lead">표지를 찾아 장독에 넣어요.</p>
      <div className="tabs" role="tablist">
        {([['search', '검색'], ['link', '링크로'], ['photo', '사진'], ['manual', '직접 입력']] as [AddTab, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'search' && <SearchPane jar={jar} added={added} onAdd={add} />}
      {tab === 'link' && <LinkPane onAdd={add} />}
      {tab === 'photo' && <PhotoPane onAdd={add} />}
      {tab === 'manual' && <ManualPane onAdd={add} />}
      <div className="sheet-actions"><button className="ghost" type="button" onClick={onClose}>다 담았어요</button></div>
    </Sheet>
  );
}

function SearchPane({ jar, added, onAdd }: { jar: Jar; added: string[]; onAdd: (d: NewItem) => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) { setHits(null); setErr(''); return; }
    const my = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await getJSON<{ hits: Hit[] }>(`/api/search?type=${jar.type}&q=${encodeURIComponent(term)}`);
        if (my === seq.current) { setHits(r.hits); setErr(''); }
      } catch (e) {
        if (my === seq.current) { setHits(null); setErr((e as Error).message); }
      } finally {
        if (my === seq.current) setBusy(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [q, jar.type]);

  return (
    <>
      <div className="field">
        <label htmlFor="q">{TYPES[jar.type].label} 찾기</label>
        <input id="q" type="search" placeholder="제목이나 만든 사람" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="src"><span>{TYPES[jar.type].src}에서 찾아요</span><span>{busy ? '찾는 중…' : hits ? `${hits.length}건` : ''}</span></div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="results">
        {hits?.map((h, k) => {
          const done = added.includes(h.title);
          return (
            <div className="result" key={`${h.link}-${k}`}>
              <Cover it={{ title: h.title, creator: h.creator, cover_url: h.cover }} />
              <div><b>{h.title}</b><small>{[h.creator, h.sub].filter(Boolean).join(' · ')}</small></div>
              <button type="button" className={done ? 'added' : ''} disabled={done}
                onClick={() => onAdd({ title: h.title, creator: h.creator, sub: h.sub, cover_url: h.cover, source_url: h.link })}>
                {done ? '담김 ✓' : '담기'}
              </button>
            </div>
          );
        })}
        {hits && !hits.length && <p className="hint" style={{ padding: '12px 4px' }}>찾는 작품이 없어요. ‘링크로’나 ‘직접 입력’으로 담아보세요.</p>}
      </div>
    </>
  );
}

function LinkPane({ onAdd }: { onAdd: (d: NewItem) => void }) {
  const [url, setUrl] = useState('');
  const [found, setFound] = useState<{ cover: string; title: string } | null>(null);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const fetchCover = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^https?:\/\//.test(url.trim())) return setErr('https://로 시작하는 주소를 넣어주세요.');
    setBusy(true); setErr(''); setFound(null);
    try {
      const r = await getJSON<{ cover: string; title: string }>(`/api/cover?url=${encodeURIComponent(url.trim())}`);
      setFound(r); setTitle(r.title);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErr('제목을 적어주세요.');
    onAdd({ title: title.trim(), creator: creator.trim(), sub: '', cover_url: found!.cover, source_url: url.trim() });
    setUrl(''); setFound(null); setTitle(''); setCreator('');
  };

  return (
    <>
      <form onSubmit={fetchCover}>
        <div className="field">
          <label htmlFor="l-url">작품 페이지 주소</label>
          <input id="l-url" type="url" placeholder="https://ridibooks.com/books/…" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <p className="hint">리디·레진·봄툰·교보·네이버·카카오 같은 곳의 작품 페이지 주소를 붙여넣어요.</p>
        {!found && <div className="sheet-actions"><button className="primary" type="submit" disabled={busy}>{busy ? '가져오는 중…' : '표지 가져오기'}</button></div>}
      </form>
      {err && <p className="err" role="alert">{err}</p>}
      {found && (
        <form onSubmit={submit} className="found">
          <div className="preview"><Cover it={{ title, creator, cover_url: found.cover }} /></div>
          <div className="field"><label htmlFor="l-title">제목</label><input id="l-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label htmlFor="l-by">만든 사람 (선택)</label><input id="l-by" maxLength={80} value={creator} onChange={(e) => setCreator(e.target.value)} /></div>
          <div className="sheet-actions"><button className="primary" type="submit">담기</button></div>
        </form>
      )}
    </>
  );
}

/** 사진 고르기 → 줄여서 올리고 주소를 받아요 */
function useCoverUpload() {
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setErr('');
    try { setCover(await uploadCover(file)); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return { cover, setCover, busy, err, setErr, pick };
}

function PhotoPane({ onAdd }: { onAdd: (d: NewItem) => void }) {
  const up = useCoverUpload();
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!up.cover) return up.setErr('표지 사진을 골라주세요.');
    if (!title.trim()) return up.setErr('제목을 적어주세요.');
    onAdd({ title: title.trim(), creator: creator.trim(), sub: '', source_url: null, cover_url: up.cover });
    up.setCover(null); setTitle(''); setCreator('');
  };
  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="u-file">표지 사진</label>
        <input id="u-file" type="file" accept="image/*" onChange={(e) => up.pick(e.target.files?.[0])} />
        <p className="hint">책 표지를 찍거나 캡처한 사진을 골라요. 자동으로 알맞은 크기로 줄여요.</p>
      </div>
      {up.busy && <p className="hint">사진 올리는 중…</p>}
      {up.cover && <div className="preview"><Cover it={{ title, creator, cover_url: up.cover }} /></div>}
      <div className="field"><label htmlFor="u-title">제목</label><input id="u-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label htmlFor="u-by">만든 사람 (선택)</label><input id="u-by" maxLength={80} value={creator} onChange={(e) => setCreator(e.target.value)} /></div>
      {up.err && <p className="err" role="alert">{up.err}</p>}
      <div className="sheet-actions"><button className="primary" type="submit" disabled={up.busy}>담기</button></div>
    </form>
  );
}

/** 이미 담긴 작품의 표지 바꾸기 */
export function CoverSheet({ it, onClose, onSave }: { it: Item; onClose: () => void; onSave: (cover: string | null) => void }) {
  const up = useCoverUpload();
  const shown = up.cover ?? it.cover_url;
  return (
    <Sheet onClose={onClose} label="표지 바꾸기">
      <h2>표지 바꾸기</h2>
      <p className="lead">{it.title}</p>
      <div className="preview"><Cover it={{ title: it.title, creator: it.creator, cover_url: shown }} /></div>
      <div className="field">
        <label htmlFor="c-file">새 표지 사진</label>
        <input id="c-file" type="file" accept="image/*" onChange={(e) => up.pick(e.target.files?.[0])} />
      </div>
      {up.busy && <p className="hint">사진 올리는 중…</p>}
      {up.err && <p className="err" role="alert">{up.err}</p>}
      <div className="sheet-actions">
        {it.cover_url && <button className="ghost" type="button" onClick={() => onSave(null)}>기본 표지로</button>}
        <button className="ghost" type="button" onClick={onClose}>취소</button>
        <button className="primary" type="button" disabled={!up.cover || up.busy} onClick={() => onSave(up.cover)}>저장</button>
      </div>
    </Sheet>
  );
}

function ManualPane({ onAdd }: { onAdd: (d: NewItem) => void }) {
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErr('제목을 적어주세요.');
    onAdd({ title: title.trim(), creator: creator.trim(), sub: '', source_url: null, cover_url: null });
    setTitle(''); setCreator(''); setErr('');
    document.getElementById('a-title')?.focus();
  };
  return (
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="a-title">제목</label><input id="a-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label htmlFor="a-by">만든 사람 (선택)</label><input id="a-by" maxLength={80} value={creator} onChange={(e) => setCreator(e.target.value)} /></div>
      <p className="hint">표지는 제목으로 만든 기본 표지가 들어가요.</p>
      {err && <p className="err">{err}</p>}
      <div className="sheet-actions"><button className="primary" type="submit">담기</button></div>
    </form>
  );
}

/** 한 국자 뜨기: 모든 장독의 미완료 중에서 하나 */
export function LadleSheet({ jars, onClose, onGo }: { jars: Jar[]; onClose: () => void; onGo: (jarId: string, itemId: string) => void }) {
  const pool = jars.filter((j) => !j.broken_at).flatMap((j) => j.items.filter((i) => !i.done_at).map((i) => ({ i, j })));
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState<(typeof pool)[number] | null>(null);
  const [final, setFinal] = useState<(typeof pool)[number] | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setFinal(null);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || pool.length === 1) { setShown(pick); setFinal(pick); return; }
    let d = 55, last = -1;
    const step = () => {
      let k: number;
      do { k = Math.floor(Math.random() * pool.length); } while (pool.length > 2 && k === last);
      last = k;
      setShown(pool[k]);
      d *= 1.13;
      timer.current = window.setTimeout(d < 360 ? step : () => { setShown(pick); setFinal(pick); }, d < 360 ? d : 260);
    };
    step();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  if (!pool.length) {
    return (
      <Sheet onClose={onClose} label="한 국자 뜨기">
        <div className="ladle">
          <h2>뜰 게 없어요</h2>
          <p className="lead">모든 장독을 다 비웠거나 아직 담은 게 없어요.</p>
          <div className="sheet-actions"><button className="primary" type="button" onClick={onClose}>닫기</button></div>
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet onClose={onClose} label="한 국자 뜨기">
      <div className="ladle">
        <h2>한 국자 뜨기</h2>
        <p className="lead">모든 장독의 미완료 {pool.length}편 중에서 하나</p>
        <div className={`slot ${final ? 'land' : 'spin'}`}>{shown && <Cover it={shown.i} />}</div>
        <div className="pick-title">{final?.i.title}</div>
        <div className="pick-from">{final && `‘${final.j.name}’ 장독에서 떴어요`}</div>
        {final && (
          <div className="sheet-actions">
            <button className="ghost" type="button" onClick={() => setRound((r) => r + 1)}>다시 뜨기</button>
            <button className="primary" type="button" onClick={() => onGo(final.j.id, final.i.id)}>이걸로 할게</button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

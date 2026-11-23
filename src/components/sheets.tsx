import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react';
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
type AddTab = 'search' | 'cover' | 'manual';

async function getJSON<T>(url: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error('인터넷 연결을 확인해주세요.');
  }
  const body = await r.json().catch(() => null);
  if (!body) throw new Error('표지 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');
  if (!r.ok) throw new Error(body.error || '문제가 생겼어요.');
  return body as T;
}

/** 담기: 검색(책 종류만, 카카오) / 표지 넣기(붙여넣기·주소·사진) / 직접 입력 */
export function AddSheet({ jar, onClose, onAdd }: { jar: Jar; onClose: () => void; onAdd: (d: NewItem) => void }) {
  const searchable = !!TYPES[jar.type].src;
  const [tab, setTab] = useState<AddTab>(searchable ? 'search' : 'cover');
  const [added, setAdded] = useState<string[]>(() => jar.items.map((i) => i.title));
  const add = (d: NewItem) => { onAdd(d); setAdded((a) => [...a, d.title]); };

  return (
    <Sheet onClose={onClose} label="담기">
      <h2>‘{jar.name}’에 담기</h2>
      <p className="lead">표지를 찾아 장독에 넣어요.</p>
      <div className="tabs" role="tablist">
        {([...(searchable ? [['search', '검색']] : []), ['cover', '표지 넣기'], ['manual', '직접 입력']] as [AddTab, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'search' && <SearchPane jar={jar} added={added} onAdd={add} />}
      {tab === 'cover' && <CoverPane onAdd={add} video={!searchable} />}
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

/** 주소가 이미지 그 자체인지 브라우저에서 직접 열어봐요. */
function loadsAsImage(u: string) {
  return new Promise<boolean>((ok) => {
    const img = new Image();
    const t = setTimeout(() => ok(false), 8000);
    img.referrerPolicy = 'no-referrer';
    img.onload = () => { clearTimeout(t); ok(img.naturalWidth > 20); };
    img.onerror = () => { clearTimeout(t); ok(false); };
    img.src = u;
  });
}

type Picked = { cover: string; source_url: string | null; title?: string; creator?: string };

/**
 * 표지 넣기 칸: 이미지 붙여넣기 · 주소 붙여넣기 · 사진 고르기 · 끌어다 놓기를 한 곳에서.
 * 이미지(복사한 그림, data: 주소, 파일)는 줄여서 저장소에 올리고, 일반 주소는 그대로 쓰거나 페이지에서 표지를 찾아요.
 */
function CoverDrop({ onPicked, hint }: { onPicked: (p: Picked) => void; hint: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (label: string, job: () => Promise<Picked>) => {
    setBusy(label); setErr('');
    try { onPicked(await job()); setText(''); } catch (e) { setErr((e as Error).message); } finally { setBusy(''); }
  };
  const fromFile = (f: File) => run('사진 올리는 중…', async () => ({ cover: await uploadCover(f), source_url: null }));
  const fromText = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (/^data:image\//i.test(t)) {
      return run('사진 올리는 중…', async () => {
        const blob = await (await fetch(t)).blob();
        return { cover: await uploadCover(new File([blob], 'paste', { type: blob.type || 'image/png' })), source_url: null };
      });
    }
    if (!/^https?:\/\//i.test(t)) { setErr('이미지나 https:// 로 시작하는 주소를 붙여넣어 주세요.'); return; }
    return run('표지 불러오는 중…', async () => {
      if (await loadsAsImage(t)) return { cover: t, source_url: null };
      const r = await getJSON<{ cover: string; title: string; creator?: string }>(`/api/cover?url=${encodeURIComponent(t)}`);
      return { cover: r.cover, source_url: t, title: r.title, creator: r.creator };
    });
  };
  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData.items).find((x) => x.kind === 'file' && x.type.startsWith('image/'))?.getAsFile();
    if (file) { e.preventDefault(); fromFile(file); return; }
    const t = e.clipboardData.getData('text');
    if (t) { e.preventDefault(); fromText(t); }
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) return fromFile(f);
    const t = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text');
    if (t) fromText(t.split('\n')[0]);
  };

  return (
    <div className={`drop ${over ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
      <label htmlFor="paste" className="drop-label">표지 넣기</label>
      <textarea
        id="paste" className="paste-box" rows={2} value={text} disabled={!!busy}
        placeholder={busy || '여기를 눌러 붙여넣기 (이미지 또는 주소)'}
        onPaste={onPaste} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fromText(text); } }}
      />
      <div className="drop-actions">
        {text.trim() && <button className="ghost" type="button" disabled={!!busy} onClick={() => fromText(text)}>불러오기</button>}
        <button className="ghost" type="button" disabled={!!busy} onClick={() => fileRef.current?.click()}>사진 고르기</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) fromFile(f); e.target.value = ''; }} />
      </div>
      <p className="hint">{hint}</p>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}

const COVER_HINT_VIDEO = '포스터를 길게 눌러(PC는 오른쪽 클릭) ‘이미지 복사’ 후 위 칸에 붙여넣으면 끝이에요. 캡처한 사진은 ‘사진 고르기’로 넣어요.';
const COVER_HINT_BOOK = '표지 이미지를 복사해 붙여넣거나, 리디·레진·네이버 웹툰·카카오웹툰·교보·YES24 작품 페이지 주소를 붙여넣어요. 사진은 ‘사진 고르기’로.';

function CoverPane({ onAdd, video }: { onAdd: (d: NewItem) => void; video: boolean }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErr('제목을 적어주세요.');
    onAdd({ title: title.trim(), creator: creator.trim(), sub: '', cover_url: picked!.cover, source_url: picked!.source_url });
    setPicked(null); setTitle(''); setCreator(''); setErr('');
  };
  if (!picked) {
    return <CoverDrop hint={video ? COVER_HINT_VIDEO : COVER_HINT_BOOK}
      onPicked={(p) => { setPicked(p); setTitle(p.title || ''); setCreator(p.creator || ''); setTimeout(() => document.getElementById('c-title')?.focus()); }} />;
  }
  return (
    <form onSubmit={submit} className="found">
      <div className="found-row">
        <div className="preview"><Cover it={{ title, creator, cover_url: picked.cover }} /></div>
        <button className="link" type="button" onClick={() => setPicked(null)}>다른 표지로</button>
      </div>
      <div className="field"><label htmlFor="c-title">제목</label><input id="c-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label htmlFor="c-by">{video ? '감독·출연 (선택)' : '만든 사람 (선택)'}</label><input id="c-by" maxLength={80} value={creator} onChange={(e) => setCreator(e.target.value)} /></div>
      {err && <p className="err">{err}</p>}
      <div className="sheet-actions"><button className="primary" type="submit">담기</button></div>
    </form>
  );
}

/** 이미 담긴 작품의 표지 바꾸기 */
export function CoverSheet({ it, onClose, onSave }: { it: Item; onClose: () => void; onSave: (cover: string | null) => void }) {
  const [cover, setCover] = useState<string | null>(null);
  const shown = cover ?? it.cover_url;
  return (
    <Sheet onClose={onClose} label="표지 바꾸기">
      <h2>표지 바꾸기</h2>
      <p className="lead">{it.title}</p>
      <div className="preview"><Cover it={{ title: it.title, creator: it.creator, cover_url: shown }} /></div>
      <CoverDrop hint="새 표지 이미지를 복사해 붙여넣거나, 주소를 붙여넣거나, ‘사진 고르기’로 골라요." onPicked={(p) => setCover(p.cover)} />
      <div className="sheet-actions">
        {it.cover_url && <button className="ghost" type="button" onClick={() => onSave(null)}>기본 표지로</button>}
        <button className="ghost" type="button" onClick={onClose}>취소</button>
        <button className="primary" type="button" disabled={!cover} onClick={() => onSave(cover)}>저장</button>
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

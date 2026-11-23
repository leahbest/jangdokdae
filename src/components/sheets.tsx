import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Item, Jar, JarType } from '../lib/types';
import { RATE_LABEL, TYPES } from '../lib/types';
import { fmtDay } from '../lib/util';
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

export function ItemMenuSheet({ it, jar, onClose, onRate, onMemo, onRemove }: {
  it: Item; jar: Jar; onClose: () => void; onRate: () => void; onMemo: () => void; onRemove: () => void;
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

/** 담기: 3단계에서 검색, 4단계에서 링크 표지·업로드가 붙어요. 지금은 직접 입력. */
export function AddSheet({ jar, onClose, onAdd }: {
  jar: Jar; onClose: () => void;
  onAdd: (d: { title: string; creator: string; sub: string; source_url: string | null }) => void;
}) {
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErr('제목을 적어주세요.');
    if (url.trim() && !/^https?:\/\//.test(url.trim())) return setErr('주소는 https://로 시작해야 해요.');
    onAdd({ title: title.trim(), creator: creator.trim(), sub: '', source_url: url.trim() || null });
    setAdded((a) => [title.trim(), ...a]);
    setTitle(''); setCreator(''); setUrl(''); setErr('');
    document.getElementById('a-title')?.focus();
  };
  return (
    <Sheet onClose={onClose} label="담기">
      <h2>‘{jar.name}’에 담기</h2>
      <p className="lead">{TYPES[jar.type].src} 표지 검색은 곧 연결돼요. 지금은 제목을 직접 적어 담아요.</p>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="a-title">제목</label><input id="a-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label htmlFor="a-by">만든 사람 (선택)</label><input id="a-by" maxLength={80} value={creator} onChange={(e) => setCreator(e.target.value)} /></div>
        <div className="field"><label htmlFor="a-url">작품 페이지 주소 (선택)</label><input id="a-url" type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
        {err && <p className="err">{err}</p>}
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={onClose}>다 담았어요</button>
          <button className="primary" type="submit">담기</button>
        </div>
      </form>
      {added.length > 0 && <p className="hint">방금 담은 것: {added.join(', ')}</p>}
    </Sheet>
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

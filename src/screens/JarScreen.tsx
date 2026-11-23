import { useEffect, useState } from 'react';
import type { Item, Jar } from '../lib/types';
import { TYPES, stats } from '../lib/types';
import { fmtDay } from '../lib/util';
import { Cover, RateBadge } from '../components/visuals';

type Filter = 'all' | 'todo' | 'done';

export function JarScreen({ jar, focusId, onToggle, onMove, onItemMenu, onAdd, onJarMenu, onCrack }: {
  jar: Jar;
  focusId: string | null;
  onToggle: (it: Item) => void;
  onMove: (itemId: string, dir: -1 | 1) => void;
  onItemMenu: (it: Item) => void;
  onAdd: () => void;
  onJarMenu: () => void;
  onCrack: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [just, setJust] = useState<string | null>(null);
  const [sorting, setSorting] = useState(false);
  const s = stats(jar);
  const items = sorting ? jar.items : jar.items.filter((i) => filter === 'all' || (filter === 'done' ? i.done_at : !i.done_at));

  useEffect(() => {
    if (!focusId) return;
    setFilter('all');
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-item="${focusId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [focusId]);

  return (
    <>
      <section className="jar-head">
        <div>
          <span className="chip">{TYPES[jar.type].label}{jar.broken_at ? ' · 깬 장독' : ''}</span>
          <h1>{jar.name}</h1>
          <div className="count">완료 {s.d} / {s.n}{s.n ? ` · 남은 ${s.left}` : ''}</div>
          <div className="bar"><i style={{ width: `${s.n ? (s.d / s.n) * 100 : 0}%` }} /></div>
        </div>
        <div className="head-actions">
          {!jar.broken_at && <button className="primary" type="button" onClick={onAdd}>+ 담기</button>}
          <button className="icon-btn" type="button" onClick={onJarMenu} aria-label="장독 설정">⋯</button>
        </div>
      </section>

      {jar.broken_at ? (
        <div className="broken-note"><span>{fmtDay(jar.broken_at)}에 깬 장독이에요. 완료를 되돌리면 장독대로 다시 놓여요.</span></div>
      ) : s.n > 0 && s.left === 0 ? (
        <div className="cleared">
          <span>장독을 다 비웠어요! 이제 깰 수 있어요.</span>
          <button className="primary crack-btn" type="button" onClick={onCrack}>장독 깨기</button>
        </div>
      ) : null}

      {s.n > 0 && (
        <nav className="filters" aria-label="보기">
          {!sorting && ([['all', '전체'], ['todo', '미완료'], ['done', '완료']] as [Filter, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
          {s.n > 1 && (
            <button type="button" className={`sort-toggle ${sorting ? 'on' : ''}`} aria-pressed={sorting} onClick={() => setSorting((v) => !v)}>
              {sorting ? '순서 바꾸기 끝' : '순서 바꾸기'}
            </button>
          )}
        </nav>
      )}

      {!s.n ? (
        <div className="empty">
          <h2>아직 담긴 게 없어요</h2>
          <p>{TYPES[jar.type].label}을(를) 찾아서 첫 작품을 담아보세요.</p>
          <button className="primary" type="button" onClick={onAdd}>+ 담기</button>
        </div>
      ) : items.length ? (
        <section className="grid">
          {items.map((it, idx) => (
            <article
              key={it.id}
              data-item={it.id}
              className={`card ${it.done_at ? 'done' : ''} ${just === it.id ? 'just' : ''} ${focusId === it.id ? 'pulse' : ''}`}
            >
              <button
                className="cover-btn"
                type="button"
                aria-label={`${it.title} ${it.done_at ? '미완료로 되돌리기' : '완료로 표시'}`}
                disabled={sorting}
                onClick={() => { setJust(it.id); onToggle(it); }}
              >
                <Cover it={it} />
                {it.rating ? <RateBadge n={it.rating} /> : null}
              </button>
              <div className="meta">
                <h3>{it.title}</h3>
                {it.creator && <p>{it.creator}</p>}
                {it.sub && <p>{it.sub}</p>}
              </div>
              {it.memo && <p className="memo">{it.memo}</p>}
              {sorting ? (
                <div className="row move-row">
                  <button type="button" className="move" disabled={idx === 0} onClick={() => onMove(it.id, -1)} aria-label={`${it.title} 앞으로`}>←</button>
                  <span className="pos">{idx + 1}</span>
                  <button type="button" className="move" disabled={idx === items.length - 1} onClick={() => onMove(it.id, 1)} aria-label={`${it.title} 뒤로`}>→</button>
                </div>
              ) : (
              <div className="row">
                <button className="status" type="button" onClick={() => { setJust(it.id); onToggle(it); }}>
                  {it.done_at ? '✓ 완료' : '미완료'}
                </button>
                <button className="more" type="button" onClick={() => onItemMenu(it)} aria-label={`${it.title} 더보기`}>⋯</button>
              </div>
              )}
            </article>
          ))}
        </section>
      ) : (
        <div className="empty"><p>{filter === 'done' ? '아직 완료한 게 없어요.' : '미완료가 없어요. 모두 꺼냈어요.'}</p></div>
      )}
    </>
  );
}

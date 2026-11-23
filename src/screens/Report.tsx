import { useState } from 'react';
import type { Jar } from '../lib/types';
import { TYPES } from '../lib/types';
import { fmtMD } from '../lib/util';
import { Cover, Logo, StarIco } from '../components/visuals';

export function Report({ jars, onBack }: { jars: Jar[]; onBack: () => void }) {
  const now = new Date();
  const [[y, m], setYM] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const start = new Date(y, m, 1).getTime();
  const end = new Date(y, m + 1, 1).getTime();
  const isThis = y === now.getFullYear() && m === now.getMonth();
  const inMonth = (iso: string | null) => !!iso && +new Date(iso) >= start && +new Date(iso) < end;

  const groups = jars
    .map((j) => ({ j, items: j.items.filter((i) => inMonth(i.done_at)).sort((a, b) => a.done_at!.localeCompare(b.done_at!)) }))
    .filter((g) => g.items.length);
  const all = groups.flatMap((g) => g.items);
  const best = all.filter((i) => i.rating === 5).length;
  const cracked = jars.filter((j) => inMonth(j.broken_at)).length;
  const move = (d: number) => {
    const t = new Date(y, m + d, 1);
    if (t <= now) setYM([t.getFullYear(), t.getMonth()]);
  };

  return (
    <>
      <header className="top">
        <button className="back" type="button" onClick={onBack}>← 장독대</button>
        <div className="month-nav">
          <button className="icon-btn" type="button" onClick={() => move(-1)} aria-label="이전 달">‹</button>
          <span>{y}년 {m + 1}월</span>
          <button className="icon-btn" type="button" onClick={() => move(1)} aria-label="다음 달" disabled={isThis}>›</button>
        </div>
      </header>
      <section className="report">
        <p className="eyebrow">{y}년 {m + 1}월 리포트</p>
        <h1>{isThis ? '이번 달' : `${m + 1}월에`} 해치운 장독대</h1>
        <div className="big">{all.length}<small>편</small></div>
        {all.length ? (
          <p className="rsum">
            장독 {groups.length}개에서 꺼냈어요{best ? ` · 최고 ${best}편` : ''}{cracked ? ` · 깬 장독 ${cracked}개` : ''}
          </p>
        ) : (
          <p className="rep-empty">{isThis ? '이번 달엔 아직 해치운 게 없어요. 한 국자 떠볼까요?' : '이 달에는 해치운 게 없어요.'}</p>
        )}
        {groups.map(({ j, items }) => (
          <div className="rgroup" key={j.id}>
            <h2>{j.name}<span className="chip">{TYPES[j.type].label}</span><span className="n">{items.length}편</span></h2>
            <ol>
              {items.map((i) => (
                <li key={i.id}>
                  <Cover it={i} />
                  <div className="rtext"><b>{i.title}</b>{i.creator && <small>{i.creator}</small>}</div>
                  {i.rating ? <span className="rate-inline" aria-label={`별점 ${i.rating}점`}><StarIco />{i.rating}</span> : null}
                  <time>{fmtMD(i.done_at!)}</time>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <div className="rep-foot"><span><Logo />장독대</span>{y}.{String(m + 1).padStart(2, '0')}</div>
      </section>
      <p className="hint rep-hint">캡처해서 간직하거나 공유해보세요.</p>
    </>
  );
}

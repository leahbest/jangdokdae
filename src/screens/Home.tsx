import type { Jar } from '../lib/types';
import { TYPES, stats } from '../lib/types';
import { fmtDay } from '../lib/util';
import { Cover, JarIcon } from '../components/visuals';

export function Home({ jars, tab, nav, onNewJar }: {
  jars: Jar[];
  tab: 'active' | 'broken';
  nav: (hash: string) => void;
  onNewJar: () => void;
}) {
  const active = jars.filter((j) => !j.broken_at);
  const broken = jars.filter((j) => j.broken_at).sort((a, b) => b.broken_at!.localeCompare(a.broken_at!));
  const totals = active.reduce((a, j) => { const s = stats(j); return { n: a.n + s.n, d: a.d + s.d }; }, { n: 0, d: 0 });
  const list = tab === 'active' ? active : broken;

  return (
    <>
      <nav className="seg" aria-label="장독 보기">
        <button type="button" aria-pressed={tab === 'active'} onClick={() => nav('')}>장독대<span>{active.length}</span></button>
        <button type="button" aria-pressed={tab === 'broken'} onClick={() => nav('broken')}>깬 장독<span>{broken.length}</span></button>
      </nav>
      <section className="hero">
        {tab === 'active' ? (
          <>
            <h1>{active.length ? `장독 ${active.length}개에 ${totals.n}편을 묵혀두었어요` : '장독대가 비어 있어요'}</h1>
            <p>{active.length ? `지금까지 ${totals.d}편을 꺼냈어요. 장독 안의 색은 남은 만큼 차 있어요.` : '보고 싶은 것을 담을 첫 장독을 놓아보세요.'}</p>
          </>
        ) : (
          <>
            <h1>{broken.length ? `깬 장독 ${broken.length}개` : '아직 깬 장독이 없어요'}</h1>
            <p>{broken.length ? '끝까지 비우고 깨뜨린 장독들이에요.' : '장독 하나를 끝까지 비우면 깰 수 있어요.'}</p>
          </>
        )}
      </section>
      <section className="jars">
        {list.map((j) => {
          const s = stats(j);
          return (
            <button key={j.id} className={`jar-card ${j.broken_at ? 'is-broken' : ''}`} type="button" onClick={() => nav(`jar-${j.id}`)}>
              <div className="jar-ill">
                <JarIcon jar={j} />
                <small>{j.broken_at ? `${s.n}편 완주` : s.left ? `남은 ${s.left}` : '다 비움'}</small>
              </div>
              <div className="jar-info">
                <span className="chip">{TYPES[j.type].label}</span>
                <h2>{j.name}</h2>
                <div className="count">{j.broken_at ? `${fmtDay(j.broken_at)}에 깼어요` : `담은 ${s.n} · 완료 ${s.d}`}</div>
                <div className="strip">
                  {j.items.slice(0, 6).map((i) => <Cover key={i.id} it={i} className={i.done_at ? '' : 'todo'} />)}
                </div>
              </div>
            </button>
          );
        })}
        {tab === 'active' && (
          <button className="new-jar" type="button" onClick={onNewJar}>
            <b>+ 새 장독 놓기</b>
            <span>책, 영화, 공연… 종류별로 하나씩</span>
          </button>
        )}
      </section>
    </>
  );
}

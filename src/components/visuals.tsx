import { useId, type CSSProperties } from 'react';
import type { Jar } from '../lib/types';
import { stats } from '../lib/types';
import { PAL, hash, starPts } from '../lib/util';

export const JAR_BODY = 'M32 20 C14 28 8 52 14 74 C18 90 30 97 50 97 C70 97 82 90 86 74 C92 52 86 28 68 20 Z';

export function Logo() {
  return (
    <svg viewBox="0 0 100 104" aria-hidden="true">
      <path d={JAR_BODY} fill="var(--brand)" />
      <rect x="31" y="11" width="38" height="10" rx="3" fill="var(--brand)" />
    </svg>
  );
}

/** 표지: 이미지가 있으면 이미지, 없으면 제목으로 만든 임시 표지 */
export function Cover({ it, className = '' }: { it: { title: string; creator: string; cover_url?: string | null }; className?: string }) {
  if (it.cover_url) {
    return (
      <div className={`art ${className}`}>
        <img src={it.cover_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    );
  }
  const h = hash(it.title);
  const [c1, c2] = PAL[h % PAL.length];
  return (
    <div className={`art gen v${(h >> 4) % 4} ${className}`} style={{ '--c1': c1, '--c2': c2 } as CSSProperties}>
      <span className="ct">{it.title}</span>
      <span className="cb">{it.creator}</span>
    </div>
  );
}

/** 옹기 그림: 남은 만큼 색이 차 있고, 깬 장독엔 금이 가 있어요 */
export function JarIcon({ jar, crackAnim = false }: { jar: Jar; crackAnim?: boolean }) {
  const clip = useId().replace(/:/g, '');
  const { n, left } = stats(jar);
  const y = 22 + (1 - (n ? left / n : 0)) * 76;
  const cracked = !!jar.broken_at || crackAnim;
  return (
    <svg className="jar" viewBox="0 0 100 104" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={JAR_BODY} />
        </clipPath>
      </defs>
      <path d={JAR_BODY} className="jar-body" />
      <rect x="0" y={y.toFixed(1)} width="100" height="104" clipPath={`url(#${clip})`} className="jar-fill" />
      <path d={JAR_BODY} className="jar-line" />
      <rect x="31" y="11" width="38" height="10" rx="3" className="jar-rim" />
      {cracked && (
        <>
          <path d="M53 21 L45 39 L57 51 L46 66 L55 80 L50 96" className={`jar-crack ${crackAnim ? 'crack-anim' : ''}`} />
          <path d="M57 51 L72 56" className={`jar-crack ${crackAnim ? 'crack-anim' : ''}`} />
        </>
      )}
    </svg>
  );
}

export function StarIco() {
  return (
    <svg className="star-ico" viewBox="0 0 20 20" aria-hidden="true">
      <polygon points={starPts(10, 10.6, 9.6)} />
    </svg>
  );
}

const STARS: Record<number, [number, number][]> = {
  1: [[50, 52]],
  2: [[37, 52], [63, 52]],
  3: [[50, 36], [36, 60], [64, 60]],
  4: [[37, 38], [63, 38], [37, 64], [63, 64]],
  5: [[50, 30], [31, 46], [69, 46], [39, 68], [61, 68]],
};
const STAR_R: Record<number, number> = { 1: 26, 2: 17, 3: 14, 4: 12.5, 5: 11 };

export function StarCluster({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {STARS[n].map(([x, y], k) => (
        <polygon key={k} points={starPts(x, y, STAR_R[n])} />
      ))}
    </svg>
  );
}

export function RateBadge({ n }: { n: number }) {
  return (
    <span className="rate-badge" aria-label={`별점 ${n}점`}>
      <StarIco />
      {n}
    </span>
  );
}

export function LadleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M20 3 L12.5 12" />
      <path d="M4 13h11a5.5 5.5 0 0 1-11 0z" fill="currentColor" fillOpacity=".18" />
    </svg>
  );
}

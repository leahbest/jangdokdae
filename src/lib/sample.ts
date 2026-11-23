import type { Item, Jar, JarType } from './types';
import { uuid } from './util';

/** 체험 모드에서 처음 보여줄 예시 장독 */
function at(monthsAgo: number, day: number) {
  const n = new Date();
  const d = new Date(n.getFullYear(), n.getMonth() - monthsAgo, 1, 21);
  d.setDate(Math.min(day, monthsAgo ? 28 : n.getDate()));
  return d.toISOString();
}

type Row = [title: string, creator?: string, sub?: string, done?: string | null, rating?: number | null, memo?: string | null];

function jar(name: string, type: JarType, rows: Row[], broken: string | null = null, order = 0): Jar {
  const id = uuid();
  const created = new Date(Date.now() - 86400000 * 60).toISOString();
  const items: Item[] = rows.map(([title, creator = '', sub = '', done = null, rating = null, memo = null], k) => ({
    id: uuid(), jar_id: id, title, creator, sub, cover_url: null, source_url: null,
    done_at: done, rating, memo, position: k, created_at: created,
  }));
  return { id, name, type, broken_at: broken, position: order, created_at: created, items };
}

export function sampleJars(): Jar[] {
  return [
    jar('세계문학 읽기', 'book', [
      ['변신 이야기 1', '오비디우스', '이윤기 옮김', at(1, 12), 5], ['데미안', '헤르만 헤세', '', at(0, 3), 4], ['1984', '조지 오웰'],
      ['이방인', '알베르 카뮈'], ['그리스인 조르바', '니코스 카잔차키스'], ['위대한 개츠비', 'F. 스콧 피츠제럴드', '', at(0, 15), 3],
    ], null, 1),
    jar('보고 싶은 영화', 'movie', [
      ['기생충', '봉준호', '2019', at(0, 9), 5, '두 번째 볼 때 계단 장면이 더 무섭다.'], ['헤어질 결심', '박찬욱', '2022'],
      ['화양연화', '왕가위', '2000', at(1, 20), 4], ['패터슨', '짐 자무시', '2016'],
    ], null, 2),
    jar('웹툰 정주행', 'comic', [
      ['미생', '윤태호', '', at(0, 21), 5], ['유미의 세포들', '이동건'], ['나빌레라', 'HUN · 지민'],
    ], null, 3),
    jar('봉준호 필모그래피', 'movie', [
      ['플란다스의 개', '봉준호', '2000', at(1, 6), 3], ['살인의 추억', '봉준호', '2003', at(1, 13), 5],
      ['괴물', '봉준호', '2006', at(1, 19), 4], ['마더', '봉준호', '2009', at(1, 24), 5],
    ], at(1, 27), 4),
  ];
}

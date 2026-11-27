export type JarType = 'book' | 'webnovel' | 'comic' | 'movie' | 'drama' | 'variety' | 'musical' | 'play';

/** src: 표지 검색처. null이면 검색 없이 이미지 링크·사진으로 담아요. */
export const TYPES: Record<JarType, { label: string; src: string | null }> = {
  book: { label: '책', src: '카카오 책' },
  webnovel: { label: '웹소설', src: '카카오 책' },
  comic: { label: '웹툰·만화', src: '카카오 책' },
  movie: { label: '영화', src: 'TMDB' },
  drama: { label: '드라마', src: 'TMDB' },
  variety: { label: '예능', src: 'TMDB' },
  musical: { label: '뮤지컬', src: null },
  play: { label: '연극', src: null },
};

export interface Item {
  id: string;
  jar_id: string;
  title: string;
  creator: string;
  sub: string;
  cover_url: string | null;
  source_url: string | null;
  done_at: string | null;
  rating: number | null;
  memo: string | null;
  position: number;
  created_at: string;
}

export interface Jar {
  id: string;
  name: string;
  type: JarType;
  broken_at: string | null;
  position: number;
  created_at: string;
  items: Item[];
}

export type JarPatch = Partial<Pick<Jar, 'name' | 'broken_at' | 'position'>>;
export type ItemPatch = Partial<Pick<Item, 'done_at' | 'rating' | 'memo' | 'position' | 'cover_url' | 'title' | 'creator'>>;

export const RATE_LABEL: Record<number, string> = { 1: '아쉬움', 2: '그럭저럭', 3: '괜찮음', 4: '좋았음', 5: '최고' };

export const stats = (j: Jar) => {
  const n = j.items.length;
  const d = j.items.filter((i) => i.done_at).length;
  return { n, d, left: n - d };
};

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Item, ItemPatch, Jar, JarPatch } from './types';
import { sampleJars } from './sample';

export interface Store {
  load(): Promise<Jar[]>;
  createJar(jar: Jar): Promise<void>;
  updateJar(id: string, patch: JarPatch): Promise<void>;
  deleteJar(id: string): Promise<void>;
  addItem(item: Item): Promise<void>;
  updateItem(id: string, patch: ItemPatch): Promise<void>;
  deleteItem(id: string): Promise<void>;
}

const byPos = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** 우리 저장소(covers)에 올린 사진 주소면 저장소 안 경로를, 아니면 null */
const coverPath = (url: string | null | undefined) => {
  const m = url?.match(/\/storage\/v1\/object\/public\/covers\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};

/* ── 계정 동기화: Supabase ───────────────────────────── */
export class SupabaseStore implements Store {
  constructor(private sb: SupabaseClient) {}

  private check({ error }: { error: { message: string } | null }) {
    if (error) throw new Error(error.message);
  }

  async load() {
    const { data, error } = await this.sb.from('jars').select('*, items(*)');
    if (error) throw new Error(error.message);
    return (data as Jar[]).map((j) => ({ ...j, items: [...(j.items || [])].sort(byPos) })).sort(byPos);
  }
  async createJar({ items: _items, ...jar }: Jar) {
    this.check(await this.sb.from('jars').insert(jar));
  }
  async updateJar(id: string, patch: JarPatch) {
    this.check(await this.sb.from('jars').update(patch).eq('id', id));
  }
  /** 사진 파일 정리는 실패해도 괜찮아요(데이터 저장이 우선). */
  private async removeCovers(urls: (string | null)[]) {
    const paths = urls.map(coverPath).filter((p): p is string => !!p);
    if (paths.length) await this.sb.storage.from('covers').remove(paths).catch(() => {});
  }
  private async coversOf(column: 'id' | 'jar_id', value: string) {
    const { data } = await this.sb.from('items').select('cover_url').eq(column, value);
    return (data || []).map((r) => r.cover_url as string | null);
  }

  async deleteJar(id: string) {
    const covers = await this.coversOf('jar_id', id);
    this.check(await this.sb.from('jars').delete().eq('id', id));
    await this.removeCovers(covers);
  }
  async addItem(item: Item) {
    this.check(await this.sb.from('items').insert(item));
  }
  async updateItem(id: string, patch: ItemPatch) {
    const old = 'cover_url' in patch ? await this.coversOf('id', id) : [];
    this.check(await this.sb.from('items').update(patch).eq('id', id));
    await this.removeCovers(old.filter((u) => u !== patch.cover_url));
  }
  async deleteItem(id: string) {
    const covers = await this.coversOf('id', id);
    this.check(await this.sb.from('items').delete().eq('id', id));
    await this.removeCovers(covers);
  }
}

/* ── 체험 모드: 이 브라우저에만 저장 ──────────────────── */
const KEY = 'jangdokdae-local-v1';

export class LocalStore implements Store {
  private jars: Jar[];

  constructor() {
    let saved: Jar[] | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      saved = null;
    }
    this.jars = Array.isArray(saved) ? saved : sampleJars();
    this.save();
  }
  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.jars));
    } catch {
      /* 저장 공간이 막혀 있어도 화면은 계속 동작 */
    }
  }
  private item(id: string) {
    for (const j of this.jars) {
      const i = j.items.find((x) => x.id === id);
      if (i) return i;
    }
  }
  async load() {
    return structuredClone(this.jars).map((j) => ({ ...j, items: j.items.sort(byPos) }));
  }
  async createJar(jar: Jar) {
    this.jars.push(structuredClone(jar));
    this.save();
  }
  async updateJar(id: string, patch: JarPatch) {
    const j = this.jars.find((x) => x.id === id);
    if (j) Object.assign(j, patch);
    this.save();
  }
  async deleteJar(id: string) {
    this.jars = this.jars.filter((x) => x.id !== id);
    this.save();
  }
  async addItem(item: Item) {
    this.jars.find((x) => x.id === item.jar_id)?.items.push(structuredClone(item));
    this.save();
  }
  async updateItem(id: string, patch: ItemPatch) {
    const i = this.item(id);
    if (i) Object.assign(i, patch);
    this.save();
  }
  async deleteItem(id: string) {
    for (const j of this.jars) j.items = j.items.filter((x) => x.id !== id);
    this.save();
  }
}

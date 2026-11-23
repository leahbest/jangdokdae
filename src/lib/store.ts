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
  async deleteJar(id: string) {
    this.check(await this.sb.from('jars').delete().eq('id', id));
  }
  async addItem(item: Item) {
    this.check(await this.sb.from('items').insert(item));
  }
  async updateItem(id: string, patch: ItemPatch) {
    this.check(await this.sb.from('items').update(patch).eq('id', id));
  }
  async deleteItem(id: string) {
    this.check(await this.sb.from('items').delete().eq('id', id));
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

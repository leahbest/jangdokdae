import { useCallback, useEffect, useRef, useState } from 'react';
import type { Store } from './store';
import type { Item, ItemPatch, Jar, JarPatch, JarType } from './types';
import { nowISO, uuid } from './util';

/**
 * 화면은 바로 바꾸고(낙관적 업데이트) 저장은 뒤에서 해요.
 * 저장에 실패하면 서버 상태를 다시 불러와 맞춰요.
 * 다른 기기에서 바꾼 내용은 앱으로 돌아올 때(포커스) 다시 불러와요.
 */
export function useJangdok(store: Store, onError: (msg: string) => void) {
  const [jars, setJars] = useState<Jar[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pending = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const reload = useCallback(async () => {
    try {
      const data = await store.load();
      if (pending.current === 0) setJars(data);
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, [store]);

  useEffect(() => {
    reload();
    const onVis = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [reload]);

  const run = useCallback(
    (local: (js: Jar[]) => Jar[], remote: () => Promise<void>) => {
      setJars((js) => (js ? local(js) : js));
      pending.current++;
      // 저장은 순서대로 하나씩: "담기" 직후 "완료"를 눌러도 담기가 먼저 끝난 뒤에 완료가 저장돼요.
      queue.current = queue.current
        .then(remote)
        .catch(() => {
          onError('저장하지 못했어요. 인터넷 연결을 확인해주세요.');
        })
        .finally(() => {
          pending.current--;
          if (pending.current === 0) reload();
        });
    },
    [reload, onError],
  );

  const patchJar = (id: string, patch: JarPatch) =>
    run((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)), () => store.updateJar(id, patch));

  const patchItem = (id: string, patch: ItemPatch) =>
    run(
      (js) => js.map((j) => ({ ...j, items: j.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      () => store.updateItem(id, patch),
    );

  return {
    jars,
    loadError,
    reload,
    createJar(name: string, type: JarType) {
      const jar: Jar = { id: uuid(), name, type, broken_at: null, position: Date.now() / 1000, created_at: nowISO(), items: [] };
      run((js) => [...js, jar], () => store.createJar(jar));
      return jar.id;
    },
    renameJar: (id: string, name: string) => patchJar(id, { name }),
    breakJar: (id: string) => patchJar(id, { broken_at: nowISO() }),
    unbreakJar: (id: string) => patchJar(id, { broken_at: null }),
    deleteJar: (id: string) => run((js) => js.filter((j) => j.id !== id), () => store.deleteJar(id)),
    addItem(jarId: string, data: Pick<Item, 'title' | 'creator' | 'sub' | 'cover_url' | 'source_url'>) {
      const item: Item = {
        id: uuid(), jar_id: jarId, ...data, done_at: null, rating: null, memo: null,
        position: Date.now() / 1000, created_at: nowISO(),
      };
      run((js) => js.map((j) => (j.id === jarId ? { ...j, items: [...j.items, item] } : j)), () => store.addItem(item));
    },
    setDone: (id: string, done: boolean) => patchItem(id, { done_at: done ? nowISO() : null }),
    rate: (id: string, rating: number | null) => patchItem(id, { rating }),
    memo: (id: string, memo: string | null) => patchItem(id, { memo }),
    setCover: (id: string, cover_url: string | null) => patchItem(id, { cover_url }),
    /** 작품을 한 칸 앞(-1)/뒤(+1)로. 바뀐 작품들의 position만 저장해요. */
    move(jarId: string, itemId: string, dir: -1 | 1) {
      const jar = jars?.find((j) => j.id === jarId);
      if (!jar) return;
      const list = [...jar.items];
      const i = list.findIndex((x) => x.id === itemId);
      const k = i + dir;
      if (i < 0 || k < 0 || k >= list.length) return;
      [list[i], list[k]] = [list[k], list[i]];
      const changed = list.map((it, n) => ({ id: it.id, position: n, old: it.position })).filter((x) => x.position !== x.old);
      run(
        (js) => js.map((j) => (j.id === jarId ? { ...j, items: list.map((it, n) => ({ ...it, position: n })) } : j)),
        async () => { for (const c of changed) await store.updateItem(c.id, { position: c.position }); },
      );
    },
    removeItem: (id: string) =>
      run((js) => js.map((j) => ({ ...j, items: j.items.filter((i) => i.id !== id) })), () => store.deleteItem(id)),
  };
}

export type Jangdok = ReturnType<typeof useJangdok>;

import { supabase } from './supabase';
import { uuid } from './util';

/** 사진을 표지 크기(가로 최대 600px) JPEG로 줄여요. 용량을 아끼고 2MB 제한을 넘지 않게. */
export async function shrinkImage(file: File, maxW = 600): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('사진 파일을 골라주세요.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => fail(new Error('이 사진은 열 수 없어요. 다른 사진을 골라주세요.'));
      i.src = url;
    });
    const w = Math.min(maxW, img.naturalWidth);
    const h = Math.round((img.naturalHeight * w) / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((ok, fail) =>
      c.toBlob((b) => (b ? ok(b) : fail(new Error('사진을 줄이지 못했어요.'))), 'image/jpeg', 0.85),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toDataURL = (b: Blob) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as string);
    r.onerror = () => fail(new Error('사진을 읽지 못했어요.'));
    r.readAsDataURL(b);
  });

/** 표지 사진을 올리고 주소를 돌려줘요. 체험 모드에선 이 기기에 그대로 저장해요. */
export async function uploadCover(file: File): Promise<string> {
  const blob = await shrinkImage(file);
  if (!supabase) return toDataURL(blob);
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('로그인이 필요해요.');
  const path = `${uid}/${uuid()}.jpg`;
  const { error } = await supabase.storage.from('covers').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) {
    if (/bucket not found/i.test(error.message)) throw new Error('사진 저장소가 아직 준비되지 않았어요. (storage.sql 실행 필요)');
    throw new Error('사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.');
  }
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
}

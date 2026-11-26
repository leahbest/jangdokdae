import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Notice = { id: string; message: string; link_url: string | null; link_label: string | null };
const KEY = 'jangdokdae-dismissed-notices';

function dismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

/** 화면 맨 위 공지 띠. Supabase의 announcements 표에서 켜진 공지 하나를 보여줘요. */
export function AnnouncementBar() {
  const [n, setN] = useState<Notice | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase
      .from('announcements')
      .select('id,message,link_url,link_label')
      .order('starts_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const first = (data as Notice[] | null)?.[0];
        if (alive && first && !dismissed().includes(first.id)) setN(first);
      }, () => { /* 공지가 없어도 앱은 그대로 */ });
    return () => { alive = false; };
  }, []);

  if (!n) return null;
  const close = () => {
    try { localStorage.setItem(KEY, JSON.stringify([...dismissed(), n.id].slice(-20))); } catch { /* 무시 */ }
    setN(null);
  };
  const safeLink = n.link_url && /^(\/|https:\/\/)/.test(n.link_url) ? n.link_url : null;
  return (
    <div className="notice-bar" role="status">
      <span className="notice-msg">{n.message}</span>
      {safeLink && <a className="notice-link" href={safeLink}>{n.link_label || '자세히'}</a>}
      <button type="button" className="notice-x" onClick={close} aria-label="공지 닫기">✕</button>
    </div>
  );
}

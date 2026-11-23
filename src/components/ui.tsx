import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/* ── 바텀 시트 ─────────────────────────────── */
export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', onKey);
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=radio]):not([type=file]), textarea');
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} ref={ref}>
        {children}
      </div>
    </div>
  );
}

/* ── 토스트 ─────────────────────────────────── */
type ToastAction = { label: string; fn: () => void };
type ToastState = { id: number; msg: string; act?: ToastAction } | null;
type ToastApi = { show: (msg: string, act?: ToastAction) => void; clear: () => void };
const ToastCtx = createContext<ToastApi>({ show: () => {}, clear: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<ToastState>(null);
  const show = useCallback((msg: string, act?: ToastAction) => setT({ id: Date.now(), msg, act }), []);
  const clear = useCallback(() => setT(null), []);
  const api = useMemo(() => ({ show, clear }), [show, clear]);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.act ? 4200 : 2200);
    return () => clearTimeout(h);
  }, [t]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      {t && (
        <div className="toast" role="status" key={t.id}>
          <span>{t.msg}</span>
          {t.act && (
            <button type="button" onClick={() => { setT(null); t.act!.fn(); }}>
              {t.act.label}
            </button>
          )}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

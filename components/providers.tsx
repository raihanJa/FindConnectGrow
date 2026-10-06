'use client';
/* FCG — shared runtime: i18n, shortlist, toast, modal, confirm */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Loc, SiteData, Talent } from '@/lib/data';
import { loc, sx, tx, type Lang } from '@/lib/fcg';

/* ---------- storage ---------- */
export const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem('fcg:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem('fcg:' + k, JSON.stringify(v)); } catch { /* private mode */ } }
};

/* ---------- site data (loaded from Supabase in the root layout) ---------- */
type DataCtx = SiteData & { byId: (id: string) => Talent | undefined };
const DataContext = createContext<DataCtx | null>(null);
export const useData = () => useContext(DataContext)!;

function DataProvider({ data, children }: { data: SiteData; children: ReactNode }) {
  const value = useMemo(() => ({ ...data, byId: (id: string) => data.TALENTS.find((t) => t.id === id) }), [data]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* ---------- i18n ---------- */
type LangCtx = {
  lang: Lang;
  /** true once the visitor's language (URL ?lang= or stored choice) has been applied */
  ready: boolean;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  L: (o?: Partial<Loc> | null) => string;
  s: (k: string, en: string) => string;
  foot: (f: string) => string;
};
const LangContext = createContext<LangCtx | null>(null);
export const useLang = () => useContext(LangContext)!;

// captured before any page effect can rewrite the URL (the portal mirrors its filters into it)
const bootUrlLang = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null;

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const urlLang = new URLSearchParams(location.search).get('lang') || bootUrlLang;
    if (urlLang === 'nl' || urlLang === 'en') store.set('lang', urlLang);
    setLangState(urlLang === 'nl' || urlLang === 'en' ? urlLang : store.get<string>('lang', 'en') === 'nl' ? 'nl' : 'en');
    setReady(true);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); store.set('lang', l); }, []);
  const value = useMemo<LangCtx>(() => ({
    lang, ready, setLang,
    t: (k) => tx(lang, k),
    L: (o) => loc(lang, o),
    s: (k, en) => sx(lang, k, en),
    foot: (f) => tx(lang, 'foot.' + f)
  }), [lang, ready, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Page <title>: Dutch from the NL dictionary, English fallback. React hoists it into <head>. */
export function DocTitle({ k, en }: { k?: string; en: string }) {
  const { s } = useLang();
  return <title>{k ? s(k, en) : en}</title>;
}

/* ---------- toast ---------- */
const ToastContext = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m); setOn(true);
    clearTimeout(timer.current); timer.current = setTimeout(() => setOn(false), 2400);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg !== null && <div className={'toast' + (on ? ' on' : '')} role="status">{msg}</div>}
    </ToastContext.Provider>
  );
}

/* ---------- shortlist ---------- */
type ShortlistCtx = { list: string[]; has: (id: string) => boolean; toggle: (id: string) => boolean; clear: () => void; bump: number; bumpNow: () => void };
const ShortlistContext = createContext<ShortlistCtx | null>(null);
export const useShortlist = () => useContext(ShortlistContext)!;
function ShortlistProvider({ children }: { children: ReactNode }) {
  const { TALENTS } = useData();
  const validIds = useCallback((l: string[]) => l.filter((id) => TALENTS.some((t) => t.id === id)), [TALENTS]);
  const [list, setList] = useState<string[]>([]);
  const [bump, setBump] = useState(0);
  useEffect(() => { setList(validIds(store.get<string[]>('shortlist', []))); }, [validIds]);
  const toggle = useCallback((id: string) => {
    const l = validIds(store.get<string[]>('shortlist', [])); const i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else l.push(id);
    store.set('shortlist', l); setList(l);
    return i < 0;
  }, [validIds]);
  const clear = useCallback(() => { store.set('shortlist', []); setList([]); }, []);
  const bumpNow = useCallback(() => setBump((b) => b + 1), []);
  const value = useMemo(() => ({ list, has: (id: string) => list.includes(id), toggle, clear, bump, bumpNow }), [list, toggle, clear, bump, bumpNow]);
  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

/** Star toggle with toast + header bump — shared by every star / remove button. */
export function useStarToggle() {
  const sl = useShortlist(), toast = useToast(), { t } = useLang(), { byId } = useData();
  return (id: string) => {
    const tal = byId(id)!;
    const on = sl.toggle(id);
    toast(on ? t('toast.sl.add').replace('{n}', tal.name) : t('toast.sl.rm').replace('{n}', tal.name));
    sl.bumpNow();
  };
}

/* ---------- modal ---------- */
type ModalOpt = { wide?: boolean; narrow?: boolean; onClose?: () => void };
type ModalCtx = { open: (content: ReactNode, opt?: ModalOpt) => void; close: () => void };
const ModalContext = createContext<ModalCtx | null>(null);
export const useModal = () => useContext(ModalContext)!;

function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; content: ReactNode; size: string; n: number }>({ open: false, content: null, size: '', n: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const onCloseCb = useRef<(() => void) | undefined>(undefined);
  const isOpen = useRef(false);

  const close = useCallback(() => {
    if (!isOpen.current) return;
    isOpen.current = false;
    setState((s) => ({ ...s, open: false }));
    document.body.style.overflow = '';
    if (onCloseCb.current) onCloseCb.current();
    if (lastFocus.current) lastFocus.current.focus();
  }, []);
  const open = useCallback((content: ReactNode, opt: ModalOpt = {}) => {
    lastFocus.current = document.activeElement as HTMLElement | null; onCloseCb.current = opt.onClose;
    isOpen.current = true;
    setState((s) => ({ open: true, content, size: opt.wide ? ' wide' : opt.narrow ? ' narrow' : '', n: s.n + 1 }));
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const id = setTimeout(() => {
      const box = boxRef.current; if (!box) return;
      const f = box.querySelector<HTMLElement>('input,select,textarea,button:not(.modal-x)');
      (f || box.querySelector<HTMLElement>('.modal-x'))!.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [state.n, state.open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen.current) close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const value = useMemo(() => ({ open, close }), [open, close]);
  return (
    <ModalContext.Provider value={value}>
      {children}
      <div className={'modal' + (state.open ? ' open' : '')}>
        <div className="modal-bg" data-close onClick={close}></div>
        <div className={'modal-box' + state.size} role="dialog" aria-modal="true" ref={boxRef}>
          <button className="modal-x" data-close aria-label="Close" onClick={close}>×</button>
          <div className="modal-c" key={state.n}>{state.content}</div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}

/* ---------- confirm: styled replacement for window.confirm ---------- */
type ConfirmOpt = { title: string; body?: string; ok: string; cancel?: string; danger?: boolean };
/** `if (!(await confirm({ title, ok }))) return;` — resolves false on cancel, Escape, × or backdrop. Focus starts on Cancel. */
export function useConfirm() {
  const modal = useModal(), { s } = useLang();
  return useCallback((o: ConfirmOpt) => new Promise<boolean>((resolve) => {
    let settled = false;
    const end = (v: boolean) => { if (settled) return; settled = true; resolve(v); if (v) modal.close(); };
    modal.open(
      <div className="confirm">
        <p className="kicker">{s('confirm.k', 'Please confirm')}</p>
        <h2 className="h2">{o.title}</h2>
        {o.body && <p className="muted">{o.body}</p>}
        <div className="confirm-act">
          <button type="button" className="btn btn--ghost" onClick={modal.close}>{o.cancel ?? s('confirm.no', 'Cancel')}</button>
          <button type="button" className={'btn ' + (o.danger ? 'btn--danger' : 'btn--blue')} onClick={() => end(true)}>{o.ok}</button>
        </div>
      </div>,
      { narrow: true, onClose: () => end(false) }
    );
  }), [modal, s]);
}

export function Providers({ data, children }: { data: SiteData; children: ReactNode }) {
  return (
    <DataProvider data={data}>
    <LangProvider>
      <ToastProvider>
        <ShortlistProvider>
          <ModalProvider>{children}</ModalProvider>
        </ShortlistProvider>
      </ToastProvider>
    </LangProvider>
    </DataProvider>
  );
}

'use client';
/* Admin portal: list, add, edit and archive talent profiles (Supabase Auth + RLS; only accounts in public.admins can write). Talents are never deleted. */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { revalidateSite } from '@/app/admin/actions';
import type { PosKey, Talent } from '@/lib/data';
import { browserSupabase } from '@/lib/supabase-browser';
import { DocTitle, useConfirm, useData, useLang, useToast } from '../providers';
import { clipComplete, ReplayEditor, toPayload, type DraftClip } from '../ReplayEditor';
import { PitchMini, Radar, Signature, StatusPill, T } from '../ui';

const MAX_TRAITS = 4, MAX_CENTRES = 5;
const thisMonth = () => new Date().toISOString().slice(0, 7);
const blank = () => ({
  first: '', init: '', gender: 'm', age: '16', no: '', h: '', foot: 'R', pos: 'CM' as PosKey, status: '0', joined: thisMonth(), trial: '',
  region: '', city: '', m: '', goals: '0', assists: '0', cs: '0', sv: '0', bio_en: '', bio_nl: '', quote_en: '', quote_nl: '',
  a: [60, 60, 60, 60, 60, 60], traits: [] as string[], centres: [] as string[], published: true, consent: false
});
type F = ReturnType<typeof blank>;
/** "Omar" + "H" → omar-h (accents stripped; non-latin names fall back to "talent-h") */
const slugify = (first: string, init: string) => {
  const s = `${first}-${init}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return /^[a-z0-9]/.test(s) && s.length > 2 ? s : `talent${init ? '-' + init.toLowerCase() : ''}`.replace(/[^a-z0-9-]/g, '');
};

/** Refresh the ISR pages right away (instead of waiting up to 5 min). Returns whether that worked. */
async function refreshSite() {
  const { data: { session } } = await browserSupabase().auth.getSession();
  return session ? revalidateSite(session.access_token).catch(() => false) : false;
}

type View = { v: 'list' | 'archive' | 'new' } | { v: 'edit'; id: string };
type Edit = { id: string; archived: boolean; f: F; clips: DraftClip[] };
const HEAD = {
  list: ['adm.h1.list', 'Manage <span class="it blue">talents.</span>'], archive: ['adm.h1.arch', 'The <span class="it blue">archive.</span>'],
  new: ['adm.h1', 'Add a <span class="it blue">talent.</span>'], edit: ['adm.h1.edit', 'Edit a <span class="it blue">talent.</span>']
} as const;

export default function AdminPage() {
  const router = useRouter();
  const { s } = useLang();
  const [gate, setGate] = useState<'loading' | 'denied' | 'ok'>('loading');
  const [email, setEmail] = useState('');
  const [view, setView] = useState<View>({ v: 'list' });
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const [hk, hen] = HEAD[view.v];

  useEffect(() => {
    const sb = browserSupabase();
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return; }
      setEmail(data.session.user.email ?? '');
      const { data: ok } = await sb.rpc('is_admin');
      setGate(ok ? 'ok' : 'denied');
    });
    const { data: sub } = sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') router.replace('/login'); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main id="main"><DocTitle k="title.admin" en="Admin — FCG" />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="login.crumb" en="Admin" /></div>
          <div className="adm-head">
            <T as="h1" className="display" key={hk} k={hk} en={hen} />
            {email && <div className="adm-who"><span className="mono">{email.replace(/@fcg\.example$/, '')}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => browserSupabase().auth.signOut()}>{s('adm.out', 'Sign out')}</button></div>}
          </div>
        </div>
      </header>
      <section className="sec" style={{ paddingTop: 'clamp(40px,5vw,64px)' }}>
        <div className="wrap">
          {gate === 'loading' && <p className="muted mono">{s('adm.loading', 'Checking access…')}</p>}
          {gate === 'denied' && <T as="p" className="form-err" k="adm.denied" en="This account has no admin rights. Ask an existing admin to add you." />}
          {gate === 'ok' && <>
            <nav className="adm-tabs" role="tablist" aria-label={s('login.crumb', 'Admin')}>
              {([['list', s('adm.tab.list', 'Talents')], ['archive', s('adm.tab.arch', 'Archive')], ['new', `+ ${s('adm.tab.new', 'New talent')}`]] as const).map(([v, lbl]) => (
                <button type="button" role="tab" key={v} aria-selected={view.v === v || (v === 'list' && view.v === 'edit')} onClick={() => go({ v })}>{lbl}</button>))}
            </nav>
            {view.v === 'list' && <TalentList key="list" archived={false} onEdit={(id) => go({ v: 'edit', id })} />}
            {view.v === 'archive' && <TalentList key="archive" archived onEdit={(id) => go({ v: 'edit', id })} />}
            {view.v === 'new' && <TalentForm key="new" onBack={() => go({ v: 'list' })} />}
            {view.v === 'edit' && <EditTalent key={view.id} id={view.id} onBack={(archived) => go({ v: archived ? 'archive' : 'list' })} />}
          </>}
        </div>
      </section>
    </main>
  );
}

const LIST_COLS = 'id, display_name, age, position_key, region_key, status_id, published, archived_at, updated_at';
type Row = { id: string; display_name: string; age: number; position_key: string; region_key: string; status_id: number; published: boolean; archived_at: string | null; updated_at: string };

/** Overview of active talents (published + unpublished), or of the archive. Archiving hides a talent from the site; it is never deleted. */
function TalentList({ archived, onEdit }: { archived: boolean; onEdit: (id: string) => void }) {
  const { L, s, t, lang } = useLang();
  const { REGIONS } = useData();
  const toast = useToast(), confirm = useConfirm();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const qb = browserSupabase().from('talents').select(LIST_COLS);
    const { data, error } = await (archived ? qb.not('archived_at', 'is', null).order('archived_at', { ascending: false }) : qb.is('archived_at', null).order('sort'));
    if (error) setErr(error.message); else setRows(data);
  }, [archived]);
  useEffect(() => { load(); }, [load]);

  const flip = async (r: Row) => {
    if (!archived && !(await confirm({
      title: s('adm.arch.qt', 'Archive {n}?').replace('{n}', r.display_name), ok: s('adm.archive', 'Archive'),
      body: s('adm.arch.q', 'The profile disappears from the website, but stays in the archive and can be restored at any time.')
    }))) return;
    setBusy(r.id); setErr('');
    const { error } = await browserSupabase().rpc('set_talent_archived', { p_id: r.id, p_archived: !archived });
    if (error) { setBusy(''); setErr(error.message); return; }
    const live = await refreshSite();
    setBusy(''); setRows((rs) => rs && rs.filter((x) => x.id !== r.id));
    toast((archived ? s('adm.arch.back', '{n} is restored.') : s('adm.arch.done', '{n} is archived.')).replace('{n}', r.display_name)
      + (live ? '' : ' ' + s('adm.arch.isr', 'The site updates within 5 minutes.')));
  };

  const date = (d: string) => new Date(d).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const needle = q.trim().toLowerCase();
  const shown = (rows ?? []).filter((r) => !needle || [r.display_name, r.id, r.position_key, REGIONS[r.region_key] ? L(REGIONS[r.region_key].name) : ''].some((x) => x.toLowerCase().includes(needle)));

  return (
    <div className="adm-listwrap">
      {archived && <T as="p" className="adm-note" k="adm.arch.intro" en="Archived talents are <b>not visible on the website</b> — not in the portal, not on a profile URL and not in dossier requests. Nothing is deleted: restore a talent to put the profile back." />}
      <div className="adm-listbar">
        <label className="field adm-search"><span>{s('adm.search', 'Search')}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={s('adm.search.ph', 'Name, position or region')} /></label>
        {rows && <p className="mono muted">{s(archived ? 'adm.n.arch' : 'adm.n', archived ? '{n} archived' : '{n} talents').replace('{n}', String(rows.length))}</p>}
      </div>
      {err && <p className="form-err" role="alert">{err}</p>}
      {!rows ? !err && <p className="muted mono">{s('adm.loading.list', 'Loading…')}</p>
        : !shown.length ? <p className="muted">{rows.length ? s('adm.none.q', 'No talents match your search.') : archived ? s('adm.none.arch', 'The archive is empty.') : s('adm.none', 'No talents yet.')}</p>
        : <ul className="adm-list">
          {shown.map((r) => (
            <li key={r.id} className={busy === r.id ? 'busy' : ''}>
              <div className="adm-sig"><Signature id={r.id} /></div>
              <div className="adm-li-main">
                <b>{r.display_name}</b>
                <span className="meta">{`${r.position_key} · ${r.age} ${t('yrs')} · ${REGIONS[r.region_key] ? L(REGIONS[r.region_key].name) : r.region_key}`}</span>
                <span className="mono adm-li-id">/talent/{r.id}</span>
              </div>
              <div className="adm-li-state">
                <StatusPill s={r.status_id} />
                {archived ? <span className="adm-vis arch">{s('adm.vis.arch', 'Archived {d}').replace('{d}', date(r.archived_at!))}</span>
                  : r.published ? <span className="adm-vis live">{s('adm.vis.live', 'Live')}</span> : <span className="adm-vis">{s('adm.vis.draft', 'Unpublished')}</span>}
              </div>
              <div className="adm-li-act">
                {!archived && r.published && <Link className="btn btn--ghost btn--sm" href={`/talent/${r.id}`} target="_blank">{s('adm.view', 'View')}</Link>}
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(r.id)}>{s('adm.edit', 'Edit')}</button>
                <button type="button" className={`btn btn--sm ${archived ? 'btn--blue' : 'btn--ghost'}`} disabled={!!busy} onClick={() => flip(r)}>
                  {archived ? s('adm.restore', 'Restore') : s('adm.archive', 'Archive')}</button>
              </div>
            </li>
          ))}
        </ul>}
    </div>
  );
}

/** Load an existing talent (incl. traits and replay moments) into the form. */
function EditTalent({ id, onBack }: { id: string; onBack: (archived: boolean) => void }) {
  const { s } = useLang();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const sb = browserSupabase();
    Promise.all([
      sb.from('talents').select('*').eq('id', id).single(),
      sb.from('talent_traits').select('trait_key').eq('talent_id', id).order('sort'),
      sb.from('talent_clips').select('*').eq('talent_id', id).order('sort'),
      sb.from('talent_centres').select('centre_key').eq('talent_id', id).order('sort')
    ]).then(([tr, tt, tc, tce]) => {
      const e = tr.error || tt.error || tc.error || tce.error;
      if (e || !tr.data) { setErr(e?.message || 'not found'); return; }
      const x = tr.data, str = (v: number | null) => String(v ?? 0);
      const [first, init] = x.display_name.split(' ');
      setEdit({
        id: x.id, archived: !!x.archived_at,
        f: {
          first, init: init.replace('.', ''), gender: x.gender, age: String(x.age), no: String(x.shirt_no), h: String(x.height_cm), foot: x.foot,
          pos: x.position_key as PosKey, status: String(x.status_id), joined: x.joined_on.slice(0, 7), trial: x.trial_location_key ?? '',
          region: x.region_key, city: x.city, m: String(x.matches), goals: str(x.goals), assists: str(x.assists), cs: str(x.clean_sheets), sv: str(x.saves),
          bio_en: x.bio_en, bio_nl: x.bio_nl, quote_en: x.quote_en, quote_nl: x.quote_nl,
          a: [x.pace, x.technique, x.vision, x.physical, x.work_rate, x.composure], traits: (tt.data ?? []).map((r) => r.trait_key), centres: (tce.data ?? []).map((r) => r.centre_key),
          published: x.published, consent: false
        },
        clips: (tc.data ?? []).map((c): DraftClip => ({
          minute: String(c.minute), title_en: c.title_en, title_nl: c.title_nl, match_en: c.match_en, match_nl: c.match_nl, duration: Number(c.duration),
          flash_kind: c.flash_kind ?? '', flash_at: c.flash_at, ents: c.ents as DraftClip['ents'], ball: c.ball as DraftClip['ball'], events: c.events as DraftClip['events']
        }))
      });
    });
  }, [id]);

  if (err) return <p className="form-err" role="alert">{err}</p>;
  if (!edit) return <p className="muted mono">{s('adm.loading.list', 'Loading…')}</p>;
  return <TalentForm edit={edit} onBack={() => onBack(edit.archived)} />;
}

function TalentForm({ edit, onBack }: { edit?: Edit; onBack: () => void }) {
  const { L, s, t, foot } = useLang();
  const { POS, GROUPS, STATUS, ATTR, REGIONS, ACADEMIES, TRAITS, CENTRES } = useData();
  const [f, setF] = useState<F>(() => edit?.f ?? blank());
  const [clips, setClips] = useState<DraftClip[]>(() => edit?.clips ?? []);
  const [weights, setWeights] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ id: string; name: string; published: boolean; live: boolean } | null>(null);
  const archived = !!edit?.archived;

  useEffect(() => {
    browserSupabase().from('positions').select('key, ovr_weights').then(({ data }) => {
      if (data) setWeights(Object.fromEntries(data.map((p) => [p.key, p.ovr_weights.map(Number)])));
    });
  }, []);

  const set = (p: Partial<F>) => setF((o) => ({ ...o, ...p }));
  const bind = (k: keyof F) => ({ value: f[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set({ [k]: e.target.value }) });
  const gk = POS[f.pos].g === 'gk';
  const name = f.first && f.init ? `${f.first} ${f.init}.` : '';
  const slug = edit ? edit.id : slugify(f.first, f.init); // the id (URL) of an existing talent never changes
  const w = weights[f.pos];
  const ovr = w ? Math.round(f.a.reduce((sum, v, i) => sum + v * w[i], 0)) : null;
  const preview = useMemo(() => ({ pos: f.pos, foot: f.foot }) as Talent, [f.pos, f.foot]);

  const toggleTrait = (k: string) => set({ traits: f.traits.includes(k) ? f.traits.filter((x) => x !== k) : f.traits.length < MAX_TRAITS ? [...f.traits, k] : f.traits });

  const toggleCentre = (k: string) => set({ centres: f.centres.includes(k) ? f.centres.filter((x) => x !== k) : f.centres.length < MAX_CENTRES ? [...f.centres, k] : f.centres });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bad = clips.findIndex((c) => !clipComplete(c));
    if (bad >= 0) { setErr(s('adm.rp.incomplete', 'Replay moment {n} is incomplete: fill in title, match and minute (both languages), and every caption.').replace('{n}', String(bad + 1))); return; }
    setBusy(true); setErr('');
    const sb = browserSupabase();
    const n = (v: string) => Number(v);
    const p = {
      id: slug, display_name: name, gender: f.gender, age: n(f.age), position_key: f.pos, foot: f.foot, height_cm: n(f.h), shirt_no: n(f.no),
      region_key: f.region, city: f.city.trim(), status_id: n(f.status), joined_on: `${f.joined}-01`, trial_location_key: n(f.status) >= 2 ? f.trial : '',
      pace: f.a[0], technique: f.a[1], vision: f.a[2], physical: f.a[3], work_rate: f.a[4], composure: f.a[5], matches: n(f.m),
      goals: gk ? null : n(f.goals), assists: gk ? null : n(f.assists), clean_sheets: gk ? n(f.cs) : null, saves: gk ? n(f.sv) : null,
      bio_en: f.bio_en.trim(), bio_nl: f.bio_nl.trim(), quote_en: f.quote_en.trim(), quote_nl: f.quote_nl.trim(), published: f.published,
      clips: clips.map(toPayload), centres: f.centres
    };
    const { data: id, error } = await sb.rpc(edit ? 'update_talent' : 'create_talent', { p, p_traits: f.traits });
    if (error || !id) { setBusy(false); setErr(error?.message || s('adm.fail', 'Saving failed.')); return; }
    const live = await refreshSite();
    setBusy(false); setDone({ id, name, published: f.published, live });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (done) return (
    <div className="form-ok adm-done"><div className="tick">✓</div>
      <h2 className="h2" style={{ fontSize: '2rem' }}>{(edit ? s('adm.ok.upd', '{n} has been updated.') : s('adm.ok.t', '{n} has been added.')).replace('{n}', done.name)}</h2>
      <p className="muted">{archived ? s('adm.ok.arch', 'This talent is archived: the changes are saved, but the profile stays hidden from the site.') : done.published
        ? (done.live ? s('adm.ok.live', 'The profile is live in the talent portal.') : s('adm.ok.isr', 'The profile will appear in the talent portal within 5 minutes.'))
        : s('adm.ok.draft', 'Saved as unpublished: the profile is not visible on the site.')}</p>
      <p className="mono" style={{ fontSize: 12 }}>/talent/{done.id}</p>
      <div className="adm-actions">
        {done.published && !archived && <Link className="btn btn--ghost" href={`/talent/${done.id}`}>{s('adm.ok.view', 'View profile')} <span className="arr">→</span></Link>}
        {edit ? <button className="btn btn--blue" onClick={onBack}>{s('adm.ok.back', 'Back to overview')}</button>
          : <button className="btn btn--blue" onClick={() => { setF(blank()); setClips([]); setDone(null); }}>{s('adm.ok.again', 'Add another talent')}</button>}
      </div>
    </div>
  );

  return (
    <form className="adm" onSubmit={submit}>
      <div className="adm-main form">
        {edit && <button type="button" className="adm-back mono" onClick={onBack}>← {s('adm.back', 'Back to overview')}</button>}
        {archived && <T as="p" className="form-err" k="adm.edit.arch" en="This talent is <b>archived</b> and not visible on the site. Restore it from the archive to put the profile back." />}
        <div className="adm-note">
          <T as="b" k="adm.safe.t" en="Safeguarding by design" />
          <T as="p" k="adm.safe.p" en="Public profiles show <b>first name + initial only</b>, no photos and no exact locations. Never enter a surname, camp name, school or address — not in the bio or quote either." />
        </div>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">01</span><T k="adm.s1" en="Player" /></legend>
          <div className="form-2">
            <label className="field"><T k="adm.first" en="First name" /><input {...bind('first')} required maxLength={40} pattern="\S+" title={s('adm.first.h', 'One word, no spaces')} autoComplete="off" /></label>
            <label className="field"><T k="adm.init" en="Initial of surname" /><input value={f.init} onChange={(e) => set({ init: e.target.value.toUpperCase().slice(0, 1) })} required pattern="\p{Lu}" maxLength={1} placeholder="H" autoComplete="off" /></label>
            <div className="field"><T k="adm.gender" en="Squad" /><div className="seg">
              {(['m', 'f'] as const).map((g) => <button type="button" key={g} aria-pressed={f.gender === g} onClick={() => set({ gender: g })}>{t(g === 'm' ? 'p.men' : 'p.women')}</button>)}</div></div>
            <label className="field"><T k="adm.age" en="Age (14–21)" /><input {...bind('age')} type="number" min={14} max={21} required /></label>
            <label className="field"><T k="adm.h" en="Height (cm)" /><input {...bind('h')} type="number" min={120} max={230} required /></label>
            <label className="field"><T k="adm.no" en="Shirt number" /><input {...bind('no')} type="number" min={1} max={99} required /></label>
          </div>
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">02</span><T k="adm.s2" en="Position" /></legend>
          <div className="form-2">
            <label className="field"><T k="adm.pos" en="Position" /><select {...bind('pos')}>
              {Object.entries(GROUPS).map(([g, gl]) => <optgroup key={g} label={L(gl)}>
                {(Object.keys(POS) as PosKey[]).filter((k) => POS[k].g === g).map((k) => <option key={k} value={k}>{`${k} — ${L(POS[k])}`}</option>)}</optgroup>)}
            </select></label>
            <div className="field"><T k="adm.foot" en="Preferred foot" /><div className="seg">
              {(['L', 'R', 'B'] as const).map((x) => <button type="button" key={x} aria-pressed={f.foot === x} onClick={() => set({ foot: x })}>{foot(x)}</button>)}</div></div>
          </div>
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">03</span><T k="adm.s3" en="Origin &amp; pathway" /></legend>
          <div className="form-2">
            <label className="field"><T k="adm.region" en="Region" /><select {...bind('region')} required>
              <option value="">{s('adm.choose', 'Choose…')}</option>
              {Object.entries(REGIONS).map(([k, r]) => <option key={k} value={k}>{L(r.name)}</option>)}</select></label>
            <label className="field"><T k="adm.city" en="City (no camp or address)" /><input {...bind('city')} required maxLength={60} placeholder={f.region ? REGIONS[f.region].place.split(' · ')[0] : ''} /></label>
            <label className="field"><T k="adm.status" en="Pathway status" /><select {...bind('status')}>
              {STATUS.map((x, i) => <option key={i} value={i}>{`${i} — ${L(x)}`}</option>)}</select></label>
            <label className="field"><T k="adm.joined" en="Joined FCG (month)" /><input {...bind('joined')} type="month" required max={thisMonth()} /></label>
            {+f.status >= 2 && <label className="field"><T k="adm.trial" en="Trial / academy" /><select {...bind('trial')}>
              <option value="">{s('adm.trial.none', 'Not decided yet')}</option>
              {ACADEMIES.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}</select></label>}
          </div>
          <div className="field mt-s"><span><T k="adm.centres" en="Scouted at (centre, camp or programme)" /> <span className="muted">{`${f.centres.length}/${MAX_CENTRES}`}</span></span>
            <div className="chips">
              {CENTRES.map((c) => {
                const on = f.centres.includes(c.key);
                return <button type="button" key={c.key} className="chip" aria-pressed={on} disabled={!on && f.centres.length >= MAX_CENTRES} onClick={() => toggleCentre(c.key)}>{`${L(c.name)} · ${c.city}`}</button>;
              })}
            </div></div>
          <T as="p" className="muted adm-hint" k="adm.centres.h" en="Private: the site only shows how many talents were scouted at a centre, never which ones." />
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">04</span><T k="adm.s4" en="Attributes" /></legend>
          <div className="adm-attrs">
            {ATTR.map((lbl, i) => (
              <label className="adm-attr" key={i}><span>{L(lbl)}</span>
                <input type="range" min={0} max={100} value={f.a[i]} onChange={(e) => set({ a: f.a.map((v, j) => (j === i ? +e.target.value : v)) })} />
                <input type="number" min={0} max={100} required value={f.a[i]} aria-label={L(lbl)} onChange={(e) => set({ a: f.a.map((v, j) => (j === i ? Math.max(0, Math.min(100, +e.target.value)) : v)) })} />
              </label>
            ))}
          </div>
          <T as="p" className="muted adm-hint" k="adm.ovr" en="OVR is calculated automatically from the attributes, weighted by position." />
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">05</span><T k="adm.s5" en="Stats" /></legend>
          <div className="form-2 adm-3">
            <label className="field"><span>{t('pr.m')}</span><input {...bind('m')} type="number" min={1} max={999} required /></label>
            {gk ? <>
              <label className="field"><span>{t('pr.cs')}</span><input {...bind('cs')} type="number" min={0} max={999} required /></label>
              <label className="field"><span>{t('pr.sv')}</span><input {...bind('sv')} type="number" min={0} max={9999} required /></label>
            </> : <>
              <label className="field"><span>{t('pr.g')}</span><input {...bind('goals')} type="number" min={0} max={999} required /></label>
              <label className="field"><span>{t('pr.a')}</span><input {...bind('assists')} type="number" min={0} max={999} required /></label>
            </>}
          </div>
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">06</span><T k="adm.s6" en="Traits" /> <span className="muted">{`${f.traits.length}/${MAX_TRAITS}`}</span></legend>
          <div className="chips">
            {Object.entries(TRAITS).map(([k, lbl]) => {
              const i = f.traits.indexOf(k);
              return <button type="button" key={k} className="chip" aria-pressed={i >= 0} disabled={i < 0 && f.traits.length >= MAX_TRAITS} onClick={() => toggleTrait(k)}>
                {L(lbl)}{i >= 0 && <span className="c">{i + 1}</span>}</button>;
            })}
          </div>
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">07</span><T k="adm.s7" en="Story" /></legend>
          <div className="form-2">
            <label className="field"><T k="adm.bio_en" en="Bio — English" /><textarea {...bind('bio_en')} required maxLength={600} /></label>
            <label className="field"><T k="adm.bio_nl" en="Bio — Dutch" /><textarea {...bind('bio_nl')} required maxLength={600} /></label>
            <label className="field"><T k="adm.q_en" en="Scout quote — English" /><textarea {...bind('quote_en')} required maxLength={400} /></label>
            <label className="field"><T k="adm.q_nl" en="Scout quote — Dutch" /><textarea {...bind('quote_nl')} required maxLength={400} /></label>
          </div>
          <T as="p" className="muted adm-hint" k="adm.story.h" en="Proof over promises: describe what the scouts saw. Never promise a contract or overhype." />
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">08</span><T k="adm.s9" en="Tactical replay" /> <span className="muted">{`${clips.length}/5`}</span></legend>
          <T as="p" className="muted adm-hint" k="adm.rp.intro" en="Draw the player’s best moments as animated reconstructions — never real footage. Without moments, the profile shows automatic ones for the position." />
          <ReplayEditor clips={clips} setClips={setClips} no={f.no} />
        </fieldset>

        <fieldset className="adm-sec"><legend className="kicker"><span className="num">09</span><T k="adm.s8" en="Publish" /></legend>
          <div className="seg adm-pub">
            <button type="button" aria-pressed={f.published} onClick={() => set({ published: true })}>{edit ? s('adm.pub.e', 'Published') : s('adm.pub', 'Publish now')}</button>
            <button type="button" aria-pressed={!f.published} onClick={() => set({ published: false })}>{edit ? s('adm.draft.e', 'Unpublished') : s('adm.draft', 'Save unpublished')}</button>
          </div>
          <label className="check"><input type="checkbox" required checked={f.consent} onChange={(e) => set({ consent: e.target.checked })} />
            <T k="adm.consent" en="The parent or guardian has given written consent, and this profile contains no surname, photo or exact location." /></label>
          {err && <p className="form-err" role="alert">{err}</p>}
          <div><button className="btn btn--blue" disabled={busy}>{busy ? s('adm.busy', 'Saving…') : edit ? s('adm.save.e', 'Save changes') : s('adm.save', 'Add talent')} <span className="arr">→</span></button></div>
        </fieldset>
      </div>

      <aside className="adm-side" aria-label={s('adm.preview', 'Preview')}>
        <T as="p" className="kicker" k="adm.preview" en="Preview" />
        <div className="tcard adm-card">
          <div className="tcard-visual"><Signature id={slug} /><span className="tcard-num">{f.no}</span>
            <div className="tcard-top"><StatusPill s={+f.status} />{f.region && <span className="reg">{L(REGIONS[f.region].name)}</span>}</div></div>
          <div className="tcard-body">
            <div className="tcard-row"><div><h3>{name || '—'}</h3><div className="meta">{`${f.pos} · ${f.age} ${t('yrs')} · ${foot(f.foot)}`}</div></div>
              <div className="ovr" title={t('ovr.title')}><b>{ovr ?? '–'}</b>OVR</div></div>
            <div className="tcard-foot"><PitchMini t={preview} /></div>
          </div>
        </div>
        <div className="radar-box"><Radar sets={[{ values: f.a, color: '#1463F3' }]} size={300} values /></div>
        <p className="mono adm-url">/talent/{slug}</p>
      </aside>
    </form>
  );
}

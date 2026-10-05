'use client';
/* Admin sign-in (Supabase Auth, username + password) */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { browserSupabase, usernameToEmail } from '@/lib/supabase-browser';
import { DocTitle, useLang } from '../providers';
import { T } from '../ui';

export default function LoginPage() {
  const { s } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // already signed in → straight to the portal
  useEffect(() => { browserSupabase().auth.getSession().then(({ data }) => { if (data.session) router.replace('/admin'); }); }, [router]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr('');
    const { error } = await browserSupabase().auth.signInWithPassword({ email: usernameToEmail(String(f.get('user'))), password: String(f.get('pw')) });
    setBusy(false);
    if (error) setErr(error.status === 400 ? s('login.bad', 'Unknown username or wrong password.') : error.message);
    else router.replace('/admin');
  };

  return (
    <main id="main"><DocTitle k="title.login" en="Sign in — FCG" />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="login.crumb" en="Admin" /></div>
          <T as="h1" className="display" k="login.h1" en={'Admin <span class="it blue">sign in.</span>'} />
        </div>
      </header>
      <section className="sec">
        <div className="wrap">
          <form className="form login-box" onSubmit={submit}>
            <T as="p" className="muted" style={{ margin: 0 }} k="login.intro" en="For FCG staff only. Talent profiles you add here are published to the talent portal." />
            <label className="field"><T k="login.user" en="Username" /><input name="user" required autoComplete="username" autoCapitalize="none" spellCheck={false} /></label>
            <label className="field"><T k="login.pw" en="Password" /><input name="pw" type="password" required autoComplete="current-password" /></label>
            {err && <p className="form-err" role="alert">{err}</p>}
            <div><button className="btn btn--blue" disabled={busy}><T k={busy ? 'login.busy' : 'login.go'} en={busy ? 'Signing in…' : 'Sign in'} /> <span className="arr">→</span></button></div>
          </form>
        </div>
      </section>
    </main>
  );
}

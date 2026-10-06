'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useLang, useShortlist, useToast } from './providers';
import { StarIcon, T } from './ui';

const NAV: [string, string, string, string][] = [['talents', '/talents', 'nav.portal', 'Talent portal'], ['centres', '/centres', 'nav.centres', 'Centres'], ['partner-clubs', '/partner-clubs', 'nav.partners', 'Partner clubs'], ['clubs', '/clubs', 'nav.clubs', 'For clubs'], ['about', '/about', 'nav.about', 'Mission'], ['support', '/support', 'nav.support', 'Support us']];

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button data-lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button data-lang="nl" aria-pressed={lang === 'nl'} onClick={() => setLang('nl')}>NL</button>
    </div>
  );
}

export function Header() {
  const page = (usePathname() || '/').split('/')[1] || 'home';
  const { list, bump } = useShortlist();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const slRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!bump || !slRef.current) return;
    const l = slRef.current; l.classList.remove('bump'); void l.offsetWidth; l.classList.add('bump');
  }, [bump]);
  const setMenuOpen = (open: boolean) => { setMenu(open); document.body.style.overflow = open ? 'hidden' : ''; };
  const n = list.length;

  return (
    <>
      <T as="a" className="skip" href="#main" k="skip" en="Skip to content" />
      <div className="mast"><div className="wrap"><T k="mast.l" en="Issue N°01 — Talent beyond borders" /><T k="mast.m" en="Scouting in conflict-affected regions" /><T k="mast.r" en="Concept edition · 2026" /></div></div>
      <nav className={'nav' + (scrolled ? ' scrolled' : '')} aria-label="Main"><div className="wrap">
        <Link className="nav-logo" href="/"><img src="/assets/fcg-mark.png" alt="FCG — Find Connect & Grow" width={96} height={35} /></Link>
        <ul className="nav-links">
          {NAV.map(([k, h, i, l]) => <li key={k}><T as={Link} href={h} k={i} en={l} aria-current={k === page ? 'page' : undefined} /></li>)}
        </ul>
        <div className="nav-actions"><LangSwitch />
          <Link className="sl-link" href="/clubs#shortlist" aria-label="Shortlist" ref={slRef}><StarIcon fill="none" stroke="currentColor" strokeWidth="1.6" /><span className={'sl-count' + (n > 0 ? ' on' : '')}>{n}</span></Link>
          <T as={Link} className="btn btn--blue btn--sm" href="/support#give" k="nav.donate" en="Donate" />
          <button className="burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenuOpen(true)}><span></span></button>
        </div></div></nav>
      <div className={'mmenu' + (menu ? ' open' : '')} aria-hidden={!menu}><div className="mmenu-top"><img src="/assets/fcg-mark-light.png" alt="FCG" /><button className="mmenu-close" aria-label="Close" onClick={() => setMenuOpen(false)}>×</button></div>
        <ol>{[['home', '/', 'nav.home', 'Home'] as [string, string, string, string]].concat(NAV).map(([k, h, i, l]) => <li key={k}><T as={Link} href={h} k={i} en={l} onClick={() => setMenuOpen(false)} /></li>)}</ol>
        <div className="mmenu-foot"><LangSwitch /><T as={Link} className="btn btn--blue btn--sm" href="/support#give" k="nav.donate" en="Donate" onClick={() => setMenuOpen(false)} /></div></div>
    </>
  );
}

export function Footer() {
  const toast = useToast();
  const { t, s } = useLang();
  return (
    <footer className="foot"><div className="wrap">
      <div className="foot-top">
        <h2 className="display foot-claim">Find.<br />Connect.<br /><span>Grow.</span></h2>
        <div className="foot-news"><T as="p" className="kicker" style={{ color: '#8FB3FF' }} k="foot.newsk" en="The Dispatch — monthly" />
          <T as="p" k="foot.news" en="A short letter from the field: new talents, stories from our scouts, and where we are heading next." />
          <form className="newsform" onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); toast(t('toast.news')); }}>
            <input type="email" required placeholder={s('foot.ph', 'your@email.com')} aria-label="Email" /><T as="button" k="foot.sub" en="Subscribe →" /></form></div>
      </div>
      <div className="foot-cols">
        <div><img className="foot-logo" src="/assets/fcg-mark-light.png" alt="FCG" /><T as="p" style={{ color: '#A9B6CF', maxWidth: '30ch', fontSize: 14, marginTop: 16 }} k="foot.about" en="We find football talent in conflict-affected regions and connect them to the European game." /></div>
        <div><T as="h4" k="foot.h1" en="Explore" /><ul><li><T as={Link} href="/talents" k="nav.portal" en="Talent portal" /></li><li><T as={Link} href="/#map" k="foot.map" en="Where we scout" /></li><li><T as={Link} href="/centres" k="foot.centres" en="Camps &amp; asylum centres" /></li><li><T as={Link} href="/#pathway" k="foot.path" en="The pathway" /></li></ul></div>
        <div><T as="h4" k="foot.h2" en="Clubs" /><ul><li><T as={Link} href="/partner-clubs" k="foot.partners" en="Our partner clubs" /></li><li><T as={Link} href="/clubs#process" k="foot.how" en="How it works" /></li><li><T as={Link} href="/clubs#models" k="foot.models" en="Partnerships" /></li><li><T as={Link} href="/clubs#shortlist" k="foot.sl" en="Your shortlist" /></li></ul></div>
        <div><T as="h4" k="foot.h3" en="Organisation" /><ul><li><T as={Link} href="/about" k="nav.about" en="Mission" /></li><li><T as={Link} href="/about#safeguarding" k="foot.safe" en="Safeguarding" /></li><li><T as={Link} href="/about#nominate" k="foot.nom" en="Nominate a talent" /></li></ul></div>
        <div><T as="h4" k="foot.h4" en="Contact" /><ul><li><a href="mailto:hello@fcg.example">hello@fcg.example</a></li><li><T as={Link} href="/support" k="nav.support" en="Support us" /></li><li><span style={{ color: '#7D8AA6' }}>Amsterdam, NL</span></li></ul></div>
      </div>
      <div className="foot-bottom"><span>© 2026 Find Connect &amp; Grow</span><T k="foot.disc" en="Concept website — all talent profiles and figures are fictional." /><span>Talent beyond borders</span></div>
    </div></footer>
  );
}

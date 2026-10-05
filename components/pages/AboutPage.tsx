'use client';
/* About page: scroll-lit manifesto, team, nomination form */
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
import { POS, type PosKey } from '@/lib/data';
import { reducedMotion } from '@/lib/fcg';
import { DocTitle, useLang } from '../providers';
import { Signature, T, useReveal } from '../ui';

const TEAM = [['FD', 'a.tm1'], ['HS', 'a.tm2'], ['WL', 'a.tm3'], ['PC', 'a.tm4'], ['DA', 'a.tm5']];
const CHECK = <svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" /></svg>;

export default function AboutPage() {
  const { lang, t, L, s } = useLang();
  useReveal([]);
  const manRef = useRef<HTMLParagraphElement>(null);
  const [sent, setSent] = useState(false);

  // words wrapped in *asterisks* are highlighted blue
  const words = t('a.manifesto').split(' ');
  useEffect(() => {
    const man = manRef.current!;
    const ws = man.children;
    if (reducedMotion()) { for (let i = 0; i < ws.length; i++) ws[i].classList.add('on'); return; }
    const lightUp = () => {
      if (!ws.length) return;
      const r = man.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const n = Math.round(p * ws.length);
      for (let i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
    };
    lightUp();
    window.addEventListener('scroll', lightUp, { passive: true });
    return () => window.removeEventListener('scroll', lightUp);
  }, [lang]);

  return (
    <main id="main"><DocTitle k={'title.about'} en={'Mission — FCG'} />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="nav.about" en="Mission" /></div>
          <T as="h1" className="display" k="a.h1" en={'Built for the kids <span class="it blue">nobody scouts.</span>'} />
        </div>
      </header>

      <section className="sec" style={{ paddingTop: 'clamp(56px,8vw,110px)' }}>
        <div className="wrap">
          <p className="kicker" style={{ marginBottom: 22 }}><b>●</b> <T k="a.mk" en="Manifesto" /></p>
          <p className="manifesto" id="manifesto" ref={manRef}>
            {words.map((w, i) => <Fragment key={i}>{i > 0 && ' '}<span className={'w' + (/^\*.*\*[.,]?$/.test(w) ? ' b' : '')}>{w.replace(/\*/g, '')}</span></Fragment>)}
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§01</span><T k="a.s1k" en="Our story" /></span>
            <T as="h2" className="h2" k="a.s1t" en={'It started with a <span class="it blue">shaky phone video.</span>'} />
          </div>
          <div className="story">
            <T as="aside" className="story-aside reveal" k="a.aside" en="FCG — Find Connect &amp; Grow<br>Founded 2025<br>Amsterdam, the Netherlands<br>Foundation (concept)" />
            <div className="story-body reveal" data-d="1">
              <T as="p" k="a.p1" en="A friend working for an aid organisation sent us a video from a camp league: a fourteen-year-old dribbling past four players on a pitch made of sand and stones. Everyone who watched it asked the same question — who is scouting this kid? The answer was: nobody." />
              <T as="p" k="a.p2" en="We started making calls. Clubs were interested, but nobody knew how to verify a player from a war zone, how to deal with missing documents, or how to protect a minor in such a vulnerable situation. Scouts simply don’t go there." />
              <T as="p" k="a.p3" en="So we decided to build the bridge ourselves. Local scouts who know the ground. Analysts who verify everything twice. Lawyers and welfare officers who make sure every step is legal and safe. And clubs who are willing to watch." />
              <T as="p" k="a.p4" en="That is FCG: <strong>find</strong> the talent, <strong>connect</strong> it to the game, and help it <strong>grow</strong> — on and off the pitch." />
            </div>
            <T as="p" className="story-pull reveal" data-d="2" k="a.pull" en="“Nobody chooses where they’re born. We just make sure it doesn’t decide who gets seen.”" />
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§02</span><T k="a.s2k" en="Principles" /></span>
            <T as="h2" className="h2" k="a.s2t" en="Four rules we never bend." />
          </div>
          <div className="values reveal">
            <div className="value"><span className="vn">1</span><div><T as="h3" className="h3" k="a.v1t" en="The player comes first" /><T as="p" k="a.v1p" en="Before the club, before the deal, before us. If a move isn’t in the player’s interest, it doesn’t happen." /></div></div>
            <div className="value"><span className="vn">2</span><div><T as="h3" className="h3" k="a.v2t" en="Proof over promises" /><T as="p" k="a.v2p" en="Video, data and verified documents. We never oversell a player, and never promise a family a contract." /></div></div>
            <div className="value"><span className="vn">3</span><div><T as="h3" className="h3" k="a.v3t" en="Local before global" /><T as="p" k="a.v3p" en="Our scouts are from the regions they work in. They are paid fairly and trained continuously." /></div></div>
            <div className="value"><span className="vn">4</span><div><T as="h3" className="h3" k="a.v4t" en="We stay until the end" /><T as="p" k="a.v4p" en="Not until the signature — until the player is settled. And if it doesn’t work out, we help them home or onwards." /></div></div>
          </div>
        </div>
      </section>

      <section className="sec" id="safeguarding">
        <div className="wrap">
          <div className="compliance reveal">
            <div>
              <p className="kicker"><b>●</b> <T k="a.s3k" en="Safeguarding charter" /></p>
              <T as="h2" className="h2" style={{ fontSize: 'clamp(1.8rem,3.4vw,2.8rem)', marginTop: 12 }} k="a.s3t" en="Why you won’t see faces on this site." />
              <T as="p" className="muted" k="a.s3p" en="Many of our players are minors in unsafe situations. Publishing their photos, full names or exact locations could put them at risk. So we don’t." />
            </div>
            <div className="comp-list">
              <div>{CHECK}<div><T as="b" k="a.c1t" en="Generated signatures instead of photos" /><T as="p" k="a.c1p" en="Every profile gets a unique contour portrait generated from its data. Recognisable, but never identifiable." /></div></div>
              <div>{CHECK}<div><T as="b" k="a.c2t" en="First name and initial only" /><T as="p" k="a.c2p" en="Full identities are only shared with verified clubs, under NDA, after guardian consent." /></div></div>
              <div>{CHECK}<div><T as="b" k="a.c3t" en="Tactical replays in public" /><T as="p" k="a.c3p" en="Public highlights are animated reconstructions. Real footage stays behind the club login." /></div></div>
              <div>{CHECK}<div><T as="b" k="a.c4t" en="Independent welfare lead" /><T as="p" k="a.c4p" en="Our welfare lead reports to the board, not to the scouting team — and can stop any process at any time." /></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head two reveal">
            <span className="kicker"><span className="num">§03</span><T k="a.s4k" en="The team" /></span>
            <T as="h2" className="h2" k="a.s4t" en={'Small team. <span class="it blue">Long reach.</span>'} />
            <T className="concept-note" k="a.s4n" en="● Placeholder roles" />
          </div>
          <div className="team reveal" id="team">
            {TEAM.map(([ini, k]) => (
              <div className="member" key={ini}><div className="ph"><Signature id={'team-' + ini} rings={14} /><b>{ini}</b></div>
                <h4>{t('a.tbd')}</h4><p>{t(k)}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§04</span><T k="a.s5k" en="Roadmap" /></span>
            <T as="h2" className="h2" k="a.s5t" en="Where we’re going." />
          </div>
          <div className="roadmap reveal">
            <div className="rmap"><time>2025</time><T className="kicker" k="a.r1k" en="Founded" /><ul><T as="li" k="a.r1a" en="First 6 regions" /><T as="li" k="a.r1b" en="20 local scouts trained" /><T as="li" k="a.r1c" en="First trials in NL &amp; BE" /></ul></div>
            <div className="rmap now"><time>2026</time><T className="kicker" k="a.r2k" en="Now" /><ul><T as="li" k="a.r2a" en="11 regions, 41 scouts" /><T as="li" k="a.r2b" en="Talent portal launch" /><T as="li" k="a.r2c" en="First academy placements" /></ul></div>
            <div className="rmap"><time>2027</time><T className="kicker" k="a.r3k" en="Next" /><ul><T as="li" k="a.r3a" en="Women’s programme ×2" /><T as="li" k="a.r3b" en="25 partner clubs" /><T as="li" k="a.r3c" en="Remote coaching app" /></ul></div>
            <div className="rmap"><time>2028</time><T className="kicker" k="a.r4k" en="Ambition" /><ul><T as="li" k="a.r4a" en="FCG residence &amp; school hub" /><T as="li" k="a.r4b" en="Regional showcase tournaments" /><T as="li" k="a.r4c" en="First pro debut" /></ul></div>
          </div>
        </div>
      </section>

      <section className="sec" id="nominate">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§05</span><T k="a.s6k" en="Nominate a talent" /></span>
            <T as="h2" className="h2" k="a.s6t" en={'Know a player <span class="it blue">we should see?</span>'} />
          </div>
          <div className="twocol">
            <div className="reveal">
              <T as="p" className="lead" style={{ marginTop: 0 }} k="a.nl" en="Coaches, teachers, NGO workers and family members can nominate a player. A local FCG scout will follow up within four weeks." />
              <ol className="timeline mt-m">
                <li><time>01</time><T as="h4" k="a.n1" en="You send a nomination" /><T as="p" k="a.n1p" en="A short description and, if possible, a video link." /></li>
                <li><time>02</time><T as="h4" k="a.n2" en="A scout visits" /><T as="p" k="a.n2p" en="We watch the player in at least two matches." /></li>
                <li><time>03</time><T as="h4" k="a.n3" en="We talk to the family" /><T as="p" k="a.n3p" en="Nothing is published without their consent." /></li>
              </ol>
            </div>
            <form className="form reveal" data-d="1" id="nomForm" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              {sent ? (
                <div className="compliance" style={{ display: 'block' }}><div className="form-ok"><div className="tick">✓</div><h2 className="h2" style={{ fontSize: '2rem' }}>{t('a.ok.t')}</h2><p className="muted">{t('a.ok.p')}</p><a className="btn mt-s" href="#nominate" onClick={() => setSent(false)}>{t('a.again')}</a></div></div>
              ) : (
                <>
                  <div className="form-2">
                    <label className="field"><T k="a.f1" en="Your name" /><input required autoComplete="name" /></label>
                    <label className="field"><T k="a.f2" en="Your role" /><select><option>{s('a.f2a', 'Coach')}</option><option>{s('a.f2b', 'Teacher')}</option><option>{s('a.f2c', 'NGO worker')}</option><option>{s('a.f2d', 'Family member')}</option><option>{s('a.f2e', 'Other')}</option></select></label>
                    <label className="field"><T k="a.f3" en="Email or WhatsApp" /><input required /></label>
                    <label className="field"><T k="a.f4" en="Country / camp" /><input required /></label>
                    <label className="field"><T k="a.f5" en="Player’s first name" /><input required /></label>
                    <label className="field"><T k="a.f6" en="Player’s age" /><input type="number" min="10" max="25" required /></label>
                  </div>
                  <label className="field"><T k="a.f7" en="Position" /><select id="nomPos">{(Object.keys(POS) as PosKey[]).map((k) => <option key={k}>{L(POS[k])}</option>)}<option>{t('a.f2e')}</option></select></label>
                  <label className="field"><T k="a.f8" en="Video link (optional)" /><input type="url" placeholder="https://" /></label>
                  <label className="field"><T k="a.f9" en="Why should we see this player?" /><textarea required></textarea></label>
                  <label className="check"><input type="checkbox" required /> <T k="a.f10" en="The player’s parent or guardian knows about this nomination." /></label>
                  <div><button className="btn btn--blue"><T k="a.fsend" en="Send nomination" /> <span className="arr">→</span></button></div>
                </>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';
/* Clubs page: process accordion, shortlist, partnership form */
import Link from 'next/link';
import { useState } from 'react';
import type { Tier } from '@/lib/data';
import { DocTitle, useData, useLang, useModal, useShortlist, useStarToggle, useToast } from '../providers';
import { DossierForm, FormSuccess, Signature, StatusPill, T, useReveal } from '../ui';

function PartnerForm({ tier }: { tier: string }) {
  const { t, L } = useLang();
  const { GROUPS } = useData();
  const [sent, setSent] = useState(false);
  if (sent) return <FormSuccess title={t('c.f.ok.t')} text={t('c.f.ok.p')} />;
  return (
    <>
      <p className="kicker"><b>●</b> {tier}</p><h2 className="h2">{t('c.f.title')}</h2><p className="muted">{t('c.f.intro')}</p>
      <form className="form mt-s" onSubmit={(e) => { e.preventDefault(); setSent(true); }}><div className="form-2">
        <label className="field"><span>{t('f.name')}</span><input required autoComplete="name" /></label>
        <label className="field"><span>{t('f.club')}</span><input required /></label>
        <label className="field"><span>{t('f.email')}</span><input type="email" required autoComplete="email" /></label>
        <label className="field"><span>{t('c.f.country')}</span><input /></label>
        <label className="field"><span>{t('c.f.level')}</span><select><option>{t('c.f.l1')}</option><option>{t('c.f.l2')}</option><option>{t('c.f.l3')}</option><option>{t('c.f.l4')}</option></select></label>
        <label className="field"><span>{t('c.f.need')}</span><select><option>{L(GROUPS.att)}</option><option>{L(GROUPS.mid)}</option><option>{L(GROUPS.def)}</option><option>{L(GROUPS.gk)}</option><option>{t('c.f.open')}</option></select></label>
      </div>
        <label className="field"><span>{t('f.msg')}</span><textarea></textarea></label>
        <label className="check"><input type="checkbox" required /> {t('c.f.charter')}</label>
        <div><button className="btn btn--blue">{t('c.f.send')} <span className="arr">→</span></button></div></form>
    </>
  );
}

const PROC: [string, string, string, string, string, string, string][] = [
  ['01', 'c.p1t', 'Your brief', 'c.p1d', 'Week 1', 'c.p1p', 'Tell us the profile you need: position, age band, physical and tactical requirements. We translate it into a search across our regions.'],
  ['02', 'c.p2t', 'Curated shortlist', 'c.p2d', 'Weeks 2–4', 'c.p2p', 'You receive a shortlist of 3–8 verified players with scouting reports, data and tactical replays. You can also build your own shortlist in the portal.'],
  ['03', 'c.p3t', 'Full dossier &amp; footage', 'c.p3d', 'Weeks 4–6', 'c.p3p', 'For players you are serious about, we unlock full match footage, medical baseline, verified documents and a family background report — under NDA.'],
  ['04', 'c.p4t', 'Supervised trial', 'c.p4d', 'Months 2–6', 'c.p4p', 'We organise visas, travel and accommodation. An FCG welfare officer accompanies every player during the trial — and a guardian joins for minors.'],
  ['05', 'c.p5t', 'Integration &amp; aftercare', 'c.p5d', '12+ months', 'c.p5p', 'After signing we stay involved: language and school, housing, mental-health support and regular check-ins with family back home.']
];
const CHECK = <svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" /></svg>;
/* €1900 → "€1.9k"; no price = on request */
const Price = ({ tier }: { tier?: Tier }) => (
  <div className="price">{tier?.price ? <><b>{`€${+(tier.price / 1000).toFixed(1)}k`}</b><T k="c.season" en="/ season" /></> : <T as="b" k="c.onreq" en="On request" />}</div>
);

export default function ClubsPage() {
  const { t, L } = useLang();
  const { POS, REGIONS, TIERS, byId } = useData();
  const tier = (k: string) => TIERS.find((x) => x.key === k);
  const [scout, academy, founding] = [tier('scout_access'), tier('academy_partner'), tier('founding_partner')];
  const modal = useModal(), toast = useToast(), sl = useShortlist(), toggleStar = useStarToggle();
  useReveal([]);
  const [openProc, setOpenProc] = useState(0);
  const tierForm = (tier: string) => modal.open(<PartnerForm tier={tier} />);
  const ids = sl.list;

  return (
    <main id="main"><DocTitle k={'title.clubs'} en={'For clubs — FCG'} />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="nav.clubs" en="For clubs" /></div>
          <T as="h1" className="display" k="c.h1" en={'Scout where <span class="it blue">nobody</span> else looks.'} />
          <div className="phead-grid">
            <T as="p" className="lead" k="c.lead" en="Verified players from markets your scouting network can’t reach — delivered with the legal, ethical and welfare work already done." />
            <div className="hero-ctas" style={{ margin: 0 }}>
              <a className="btn btn--blue" href="#models"><T k="c.cta1" en="View partnerships" /> <span className="arr">→</span></a>
              <T as={Link} className="btn btn--ghost" href="/talents" k="c.cta2" en="Browse the portal" />
            </div>
          </div>
        </div>
      </header>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§01</span><T k="c.s1k" en="Why FCG" /></span>
            <T as="h2" className="h2" k="c.s1t" en={'An unfair advantage — <span class="it blue">earned fairly.</span>'} />
          </div>
          <div className="why reveal">
            <div><span className="n">01</span><T as="h3" className="h3" k="c.w1t" en="Untapped markets" /><T as="p" k="c.w1p" en="Eleven regions where traditional scouting has stopped. No bidding wars, no agents circling — just talent that has never been seen." /></div>
            <div><span className="n">02</span><T as="h3" className="h3" k="c.w2t" en="Verified, not hyped" /><T as="p" k="c.w2p" en="Two independent analysts per player, multiple full matches on video, verified age and identity. You get data you can trust." /></div>
            <div><span className="n">03</span><T as="h3" className="h3" k="c.w3t" en="Ethics built in" /><T as="p" k="c.w3p" en="FIFA-compliant pathways, guardian consent, education and a welfare officer. Your club’s reputation is protected along with the player." /></div>
          </div>
        </div>
      </section>

      <section className="sec" id="process">
        <div className="wrap">
          <div className="sec-head two reveal">
            <span className="kicker"><span className="num">§02</span><T k="c.s2k" en="How it works" /></span>
            <T as="h2" className="h2" k="c.s2t" en="From brief to dressing room." />
            <T as="p" className="lead" style={{ fontSize: '1.05rem' }} k="c.s2l" en="Click a step to see what happens and who is responsible." />
          </div>
          <div className="process reveal" id="proc">
            {PROC.map(([n, tk, ten, dk, den, pk, pen], i) => (
              <div key={n} className={'proc' + (openProc === i ? ' open' : '')} onClick={() => setOpenProc(openProc === i ? -1 : i)}><span className="pn">{n}</span><div className="proc-h"><T as="h3" className="h3" k={tk} en={ten} /><T className="dur" k={dk} en={den} /></div>
                <div className="proc-b"><div><T as="p" k={pk} en={pen} /></div></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="compliance reveal">
            <div>
              <p className="kicker"><b>●</b> <T k="c.s3k" en="Compliance &amp; safeguarding" /></p>
              <T as="h2" className="h2" style={{ fontSize: 'clamp(1.8rem,3.4vw,2.8rem)', marginTop: 12 }} k="c.s3t" en="We do the hard part properly." />
            </div>
            <div className="comp-list">
              <div>{CHECK}<div><T as="b" k="c.c1t" en="FIFA RSTP Article 19" /><T as="p" k="c.c1p" en="International moves of under-18s only happen within FIFA’s exceptions. Younger players develop remotely until eligible." /></div></div>
              <div>{CHECK}<div><T as="b" k="c.c2t" en="Guardian consent" /><T as="p" k="c.c2p" en="Written, informed consent from parents or legal guardians — in their own language — before any profile goes live." /></div></div>
              <div>{CHECK}<div><T as="b" k="c.c3t" en="No fees from families" /><T as="p" k="c.c3p" en="Players and families never pay FCG. Ever. Our work is funded by club partnerships and donations." /></div></div>
              <div>{CHECK}<div><T as="b" k="c.c4t" en="Solidarity share" /><T as="p" k="c.c4p" en="A share of any future transfer income flows back into football programmes in the player’s home community." /></div></div>
              <div>{CHECK}<div><T as="b" k="c.c5t" en="Data protection" /><T as="p" k="c.c5p" en="Public profiles are anonymised. Full identities and footage are only shared with verified clubs under NDA." /></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="models">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§03</span><T k="c.s4k" en="Partnerships" /></span>
            <T as="h2" className="h2" k="c.s4t" en={'Three ways to <span class="it blue">work with us.</span>'} />
          </div>
          <div className="tiers reveal">
            <div className="tier">
              <T as="p" className="kicker" k="c.t1k" en="For scouting departments" />
              <h3 className="h3">{scout?.name}</h3>
              <Price tier={scout} />
              <ul><T as="li" k="c.t1a" en="Full portal access to verified profiles" /><T as="li" k="c.t1b" en="Unlocked match footage" /><T as="li" k="c.t1c" en="Monthly curated shortlist" /><T as="li" k="c.t1d" en="2 dossier requests per month" /></ul>
              <T as="button" className="btn btn--ghost" data-tier={scout?.name} k="c.apply" en="Apply" onClick={() => tierForm(scout?.name ?? '')} />
            </div>
            <div className="tier feat">
              <T className="flag" k="c.pop" en="Most chosen" />
              <T as="p" className="kicker" style={{ color: '#8FB3FF' }} k="c.t2k" en="For academies" />
              <h3 className="h3">{academy?.name}</h3>
              <Price tier={academy} />
              <ul><T as="li" k="c.t2a" en="Everything in Scout Access" /><T as="li" k="c.t2b" en="Unlimited dossier requests" /><T as="li" k="c.t2c" en="Priority trials hosted at your club" /><T as="li" k="c.t2d" en="FCG welfare officer on site" /><T as="li" k="c.t2e" en="Joint education &amp; language plan" /></ul>
              <T as="button" className="btn btn--light" data-tier={academy?.name} k="c.apply" en="Apply" onClick={() => tierForm(academy?.name ?? '')} />
            </div>
            <div className="tier">
              <T as="p" className="kicker" k="c.t3k" en="For clubs that want to lead" />
              <h3 className="h3">{founding?.name}</h3>
              <Price tier={founding} />
              <ul><T as="li" k="c.t3a" en="Co-fund a full scouting region" /><T as="li" k="c.t3b" en="First look at every new talent" /><T as="li" k="c.t3c" en="Named regional programme" /><T as="li" k="c.t3d" en="Seat on our advisory council" /></ul>
              <T as="button" className="btn btn--ghost" data-tier={founding?.name} k="c.talk" en="Let’s talk" onClick={() => tierForm(founding?.name ?? '')} />
            </div>
          </div>
          <T as="p" className="footnote" k="c.tfoot" en="Concept pricing for illustration. All fees go to scouting, verification and player welfare." />
        </div>
      </section>

      <section className="sec" id="shortlist">
        <div className="wrap">
          <div className="sec-head two reveal">
            <span className="kicker"><span className="num">§04</span><T k="c.s5k" en="Your shortlist" /></span>
            <T as="h2" className="h2" k="c.s5t" en="Players you’re following." />
            <T as="p" className="lead" style={{ fontSize: '1.05rem' }} k="c.s5l" en="Saved in this browser. Star players in the portal to add them here." />
          </div>
          <div className="shortlist-box reveal" id="slBox">
            {!ids.length
              ? <div className="sl-empty"><p className="display" style={{ fontSize: '2rem', color: 'var(--ink)' }}>{t('c.sl.empty')}</p><p>{t('c.sl.emptyp')}</p></div>
              : ids.map((id) => {
                const x = byId(id)!;
                return (
                  <div className="sl-row" key={id}><div className="sig"><Signature id={x.id} /></div>
                    <div><Link href={`/talent/${x.id}`}>{x.name}</Link><small>{`${L(POS[x.pos])} · ${x.age} ${t('yrs')} · ${L(REGIONS[x.region].name)} · OVR ${x.ovr}`}</small></div>
                    <StatusPill s={x.status} /><button className="rm" data-star={x.id} onClick={() => toggleStar(x.id)}>{t('c.sl.rm')}</button></div>
                );
              })}
          </div>
          <div className="hero-ctas" id="slActions">
            {!ids.length
              ? <Link className="btn" href="/talents">{t('c.sl.go')} <span className="arr">→</span></Link>
              : <><button className="btn btn--blue" id="slReq" onClick={() => modal.open(<DossierForm ids={ids} />)}>{t('c.sl.req').replace('{n}', String(ids.length))} <span className="arr">→</span></button>
                <button className="btn btn--ghost" id="slClear" onClick={() => { sl.clear(); toast(t('c.sl.cleared')); }}>{t('c.sl.clear')}</button></>}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§05</span>FAQ</span>
            <T as="h2" className="h2" k="c.s6t" en="Questions clubs ask us." />
          </div>
          <div className="faq reveal">
            <details><T as="summary" k="c.q1" en="Can you move minors to European clubs?" /><T as="p" k="c.a1" en="Only within FIFA’s rules. Article 19 of the Regulations on the Status and Transfer of Players generally prohibits international transfers of under-18s, with limited exceptions — including specific provisions for refugee minors. We never look for loopholes. Younger players are developed remotely, through scholarships and supervised showcase events, until a legal pathway exists." /></details>
            <details><T as="summary" k="c.q2" en="How do you verify age and identity?" /><T as="p" k="c.a2" en="We combine official documents (where available), school and NGO records, guardian statements and — when needed — independent medical age assessment. Every check is documented in the dossier." /></details>
            <details><T as="summary" k="c.q3" en="Who pays for trials and travel?" /><T as="p" k="c.a3" en="For Academy and Founding Partners, trial costs are included. Scout Access partners share the costs of trials they request. Players and families never pay anything." /></details>
            <details><T as="summary" k="c.q4" en="What does our club commit to?" /><T as="p" k="c.a4" en="To our player charter: education, a safe living situation, a welfare contact person and honest communication with the player and family — whether or not a contract follows." /></details>
            <details><T as="summary" k="c.q5" en="Can we request scouting in a specific region?" /><T as="p" k="c.a5" en="Yes. Founding Partners can co-fund new regions. We only open a region when we can guarantee the safety of our local scouts and the players." /></details>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap">
          <T as="h2" className="h2" k="c.ctat" en={'The next great player is already playing. <span class="it">Somewhere you haven’t looked.</span>'} />
          <div><T as="p" k="c.ctap" en="Book a 30-minute introduction with our head of scouting." /><button className="btn btn--light" data-tier="Intro call" onClick={() => tierForm('Intro call')}><T k="c.ctab" en="Book an intro" /> <span className="arr">→</span></button></div>
        </div>
      </section>
    </main>
  );
}

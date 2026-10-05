'use client';
/* Support page: impact calculator + donation flow */
import Link from 'next/link';
import { useState } from 'react';
import { DocTitle, useData, useLang, useModal } from '../providers';
import { FormSuccess, T, useReveal } from '../ui';

const COLORS = ['var(--ink)', 'var(--blue)', '#6E9CF7', 'var(--paper-2)'];
type Gift = { amt: number; freq: string; dest: string };

function useFmt() {
  const { lang } = useLang();
  return (n: number) => '€' + n.toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB');
}

/* donation flow (concept) */
function DonationFlow({ amt, freq, dest }: Gift) {
  const { t, L } = useLang();
  const { REGIONS } = useData();
  const fmt = useFmt();
  const [n, setN] = useState(1);
  const destName = dest === 'need' ? t('s.need') : L(REGIONS[dest].name);
  const summary = <div className="summary-box"><div><span className="kicker">{`${freq === 'month' ? t('s.month') : t('s.once')} · ${destName}`}</span></div><b>{fmt(amt)}{freq === 'month' ? t('s.pm') : ''}</b></div>;
  const ind = <div className="steps-ind">{[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'on' : ''}></i>)}</div>;
  if (n === 1) return (
    <>{ind}<p className="kicker">{t('s.d.k1')}</p><h2 className="h2">{t('s.d.t1')}</h2>{summary}
      <form className="form" onSubmit={(e) => { e.preventDefault(); setN(2); }}><div className="form-2"><label className="field"><span>{t('f.name')}</span><input required autoComplete="name" /></label>
        <label className="field"><span>{t('f.email')}</span><input type="email" required autoComplete="email" /></label></div>
        <label className="check"><input type="checkbox" defaultChecked /> {t('s.d.upd')}</label>
        <label className="check"><input type="checkbox" /> {t('s.d.anon')}</label>
        <div><button className="btn btn--blue">{t('s.d.next')} <span className="arr">→</span></button></div></form></>
  );
  if (n === 2) return (
    <>{ind}<p className="kicker">{t('s.d.k2')}</p><h2 className="h2">{t('s.d.t2')}</h2>{summary}
      <form className="form" onSubmit={(e) => { e.preventDefault(); setN(3); }}><div className="chips" role="radiogroup">{['iDEAL', 'Card', 'PayPal', 'SEPA'].map((m, i) => <label key={m} className="chip" style={{ cursor: 'pointer' }}><input type="radio" name="pm" defaultChecked={i === 0} style={{ accentColor: 'var(--blue)' }} /> {m === 'Card' ? t('s.d.card') : m}</label>)}</div>
        <p className="footnote">{t('s.d.concept')}</p>
        <div className="hero-ctas" style={{ marginTop: 8 }}><button type="button" className="btn btn--ghost" data-back onClick={() => setN(1)}>← {t('s.d.back')}</button><button className="btn btn--blue">{t('s.d.confirm')} <span className="arr">→</span></button></div></form></>
  );
  return <>{ind}<FormSuccess title={t('s.d.okt')} text={t('s.d.okp').replace('{a}', fmt(amt) + (freq === 'month' ? t('s.pm') : ''))} /></>;
}

/* other ways to help */
function HelpForm({ k }: { k: string }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  if (sent) return <FormSuccess title={t('s.h.okt')} text={t('s.h.okp')} />;
  return (
    <>
      <p className="kicker"><b>●</b> {t('s.h.k')}</p><h2 className="h2">{t('s.h.' + k)}</h2>
      <form className="form mt-s" onSubmit={(e) => { e.preventDefault(); setSent(true); }}><div className="form-2"><label className="field"><span>{t('f.name')}</span><input required /></label>
        <label className="field"><span>{t('f.email')}</span><input type="email" required /></label></div>
        <label className="field"><span>{t('s.h.what')}</span><textarea required></textarea></label>
        <div><button className="btn btn--blue">{t('f.send')} <span className="arr">→</span></button></div></form>
    </>
  );
}

export default function SupportPage() {
  const { t, L } = useLang();
  const { REGIONS, IMPACT, ALLOC } = useData();
  const modal = useModal();
  const fmt = useFmt();
  useReveal([]);
  const [amt, setAmtN] = useState(50);
  const [amtText, setAmtText] = useState('50');
  const [rngVal, setRngVal] = useState(50);
  const [freq, setFreq] = useState('month');
  const [dest, setDest] = useState('need');

  function setAmt(v: string | number, from?: 'input' | 'range') {
    const n = Math.max(5, Math.min(5000, Math.round(+v || 5)));
    setAmtN(n);
    if (from !== 'input') setAmtText(String(n));
    if (from !== 'range') setRngVal(Math.min(1000, n));
  }

  const yearly = freq === 'month' ? amt * 12 : amt;
  const destName = dest === 'need' ? '' : ' · ' + L(REGIONS[dest].name);
  const helpBtn = { background: 'none', borderWidth: '0 0 1.5px' };
  const help = (k: string) => modal.open(<HelpForm k={k} />);

  return (
    <main id="main"><DocTitle k={'title.support'} en={'Support us — FCG'} />
      <header className="phead">
        <div className="wrap">
          <div className="crumbs"><Link href="/">FCG</Link> / <T k="nav.support" en="Support us" /></div>
          <T as="h1" className="display" k="s.h1" en={'Give a talent <span class="it blue">a real chance.</span>'} />
          <div className="phead-grid">
            <T as="p" className="lead" k="s.lead" en="Boots, coaching, documents, a plane ticket to a trial. Small things decide whether a gifted kid is ever seen. You can see exactly what your support does." />
            <div><T className="concept-note" k="s.note" en="● Concept — no real payments are processed" /></div>
          </div>
        </div>
      </header>

      <section className="sec" id="give" style={{ paddingTop: 'clamp(48px,6vw,80px)' }}>
        <div className="wrap">
          <div className="calc reveal">
            <div className="calc-in">
              <p className="kicker"><b>●</b> <T k="s.ck" en="Your contribution" /></p>
              <div className="seg mt-s" id="freq" style={{ maxWidth: 300 }}>
                <T as="button" data-v="once" k="s.once" en="One-time" aria-pressed={freq === 'once'} onClick={() => setFreq('once')} />
                <T as="button" data-v="month" k="s.month" en="Monthly" aria-pressed={freq === 'month'} onClick={() => setFreq('month')} />
              </div>
              <div className="amount-big"><span>€</span><input id="amt" type="number" inputMode="numeric" min="5" max="5000" value={amtText} aria-label="Amount"
                onChange={(e) => { setAmtText(e.target.value); if (e.target.value !== '') setAmt(e.target.value, 'input'); }} onBlur={() => setAmt(amtText)} /><small id="per">{freq === 'month' ? t('s.permonth') : ''}</small></div>
              <input type="range" className="big" id="amtR" min="5" max="1000" step="5" value={rngVal} aria-label="Amount slider" onChange={(e) => { setRngVal(+e.target.value); setAmt(e.target.value, 'range'); }} />
              <div className="presets chips" id="presets">{[25, 50, 100, 250, 500].map((v) => <button key={v} className="chip" data-p={v} aria-pressed={v === amt} onClick={() => setAmt(v)}>€{v}</button>)}</div>
              <div className="fgroup" style={{ marginTop: 22 }}>
                <T as="label" htmlFor="dest" k="s.dest" en="Where should it go?" />
                <select className="sel" id="dest" value={dest} onChange={(e) => setDest(e.target.value)}>
                  <option value="need">{t('s.need')}</option>
                  <optgroup label={t('s.byreg')}>{Object.keys(REGIONS).map((k) => <option key={k} value={k}>{L(REGIONS[k].name)}</option>)}</optgroup>
                </select>
              </div>
              <button className="btn btn--blue mt-s" id="giveBtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => modal.open(<DonationFlow amt={amt} freq={freq} dest={dest} />)}>
                {`${t('s.give')} ${fmt(amt)}${freq === 'month' ? t('s.pm') : ''}${destName}`} <span className="arr">→</span></button>
              <T as="p" className="footnote" k="s.tax" en="FCG is a concept foundation. In a real setup, donations could be tax-deductible (ANBI status in the Netherlands)." />
            </div>
            <div className="calc-out">
              <p className="kicker" id="outK"><b>●</b> {freq === 'month' ? t('s.outk.m').replace('{y}', fmt(yearly)) : t('s.outk.o')}</p>
              <h2 className="h3 mt-s" id="outT" style={{ fontSize: 'clamp(1.5rem,2.6vw,2.2rem)' }}>{t('s.outt')}</h2>
              <div className="impact-list" id="impact">
                {IMPACT.map((it) => {
                  const n = yearly / it.cost;
                  const val = n >= 1 ? Math.floor(n) : Math.round(n * 100) + '%';
                  return <div key={it.k} className={'impact' + (n < 0.05 ? ' zero' : '')}><b>{val}</b><span><strong>{t('s.i.' + it.k + (n < 2 ? '1' : ''))}</strong>{t('s.i.' + it.k + 'p').replace('{c}', fmt(it.cost))}</span></div>;
                })}
              </div>
              <T as="p" className="kicker" k="s.alk" en="How every euro is split" />
              <div className="alloc" id="alloc">{ALLOC.map((a) => <div key={a.key} style={{ flex: a.pct }} title={L(a.label)}>{a.pct}%</div>)}</div>
              <div className="alloc-leg" id="allocLeg">{ALLOC.map((a, i) => <div key={a.key}><b>{a.pct}%</b><span><i style={{ background: COLORS[i % COLORS.length] }}></i>{L(a.label)}</span></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker"><span className="num">§01</span><T k="s.s1k" en="Beyond money" /></span>
            <T as="h2" className="h2" k="s.s1t" en={'Other ways to <span class="it blue">get on the pitch.</span>'} />
          </div>
          <div className="ways reveal">
            <div><span className="kicker blue">01</span><T as="h3" className="h3" k="s.w1t" en="Coach remotely" /><T as="p" k="s.w1p" en="UEFA-licensed coach? Run monthly video sessions with our local coaches." /><T as="button" className="linkarrow" style={helpBtn} data-help="coach" k="s.w1b" en="Volunteer →" onClick={() => help('coach')} /></div>
            <div><span className="kicker blue">02</span><T as="h3" className="h3" k="s.w2t" en="Donate gear" /><T as="p" k="s.w2p" en="Boots, balls, goalkeeper gloves, kits. Clubs: your last-season stock is gold in Juba or Goma." /><T as="button" className="linkarrow" style={helpBtn} data-help="gear" k="s.w2b" en="Offer gear →" onClick={() => help('gear')} /></div>
            <div><span className="kicker blue">03</span><T as="h3" className="h3" k="s.w3t" en="Lend your expertise" /><T as="p" k="s.w3p" en="Immigration law, translation, sports medicine, data analysis — we need pro bono specialists." /><T as="button" className="linkarrow" style={helpBtn} data-help="pro" k="s.w3b" en="Join the network →" onClick={() => help('pro')} /></div>
            <div><span className="kicker blue">04</span><T as="h3" className="h3" k="s.w4t" en="Become a sponsor" /><T as="p" k="s.w4p" en="Companies can sponsor a region, a tournament or the kit of a whole scouting programme." /><T as="button" className="linkarrow" style={helpBtn} data-help="sponsor" k="s.w4b" en="Sponsor →" onClick={() => help('sponsor')} /></div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="pull reveal">
            <T as="cite" k="s.qc" en="— Grace K., 17, now on trial in Antwerp (fictional)" />
            <T as="blockquote" k="s.q" en="The first time I wore real boots I couldn’t stop looking at my feet. <em>Then I couldn’t stop scoring.</em>" />
          </div>
        </div>
      </section>
    </main>
  );
}

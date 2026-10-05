# CLAUDE.md

## Over het project

**FCG — Find Connect & Grow** is een (concept)website voor een stichting die voetbaltalenten uit oorlogs- en conflictgebieden een eerlijke kans geeft om door te breken bij clubs in Europa. Slogan: *"Talent has no borders. Opportunity does."* / *"Talent beyond borders"*.

### Missie
- **Scouten waar niemand scout**: FCG gaat naar gebieden waar talenten weinig kansen hebben (oorlogsgebieden, vluchtelingenkampen) en traint daar lokale scouts (trainers, leraren, ngo-medewerkers).
- **Asielzoekerscentra in Europa**: FCG wil ook in Europese asielzoekerscentra (azc's) scouten en die talenten gelijke kansen geven. ⚠️ Dit onderdeel staat nog **niet** op de website — de huidige content gaat alleen over scouting in de herkomstregio's.
- **Verbinden met profclubs**: geverifieerde talenten worden via een talentenportaal aan partnerclubs/academies gekoppeld.
- **Begeleiden tot ze gesetteld zijn**: onderwijs, taal, welzijn — niet alleen tot de handtekening.

### Het traject (4 stappen)
1. **Find** (0–3 mnd) — lokaal scoutnetwerk, kamp- en straatcompetities, beelden op afstand.
2. **Verify** (1–2 mnd) — 2 onafhankelijke analisten, leeftijds-/identiteitsverificatie, schriftelijke toestemming ouders/voogd.
3. **Connect** (2–6 mnd) — profiel live in het portaal, clubs vragen dossier op, begeleide stage in Europa (visum/reis door FCG).
4. **Grow** (doorlopend) — onderwijs, taallessen, mentale steun, welzijnsfunctionaris, contact met familie.

### Kernprincipes (belangrijk bij nieuwe content)
- De speler gaat altijd voor; families betalen **nooit** iets.
- *Proof over promises*: nooit spelers overhypen of contracten beloven.
- Lokale scouts, eerlijk betaald.
- **Safeguarding by design**: veel spelers zijn minderjarig in onveilige situaties. Daarom op de publieke site:
  - **Geen foto's** — elk profiel krijgt een gegenereerde "signature" (contourportret) i.p.v. een foto.
  - **Alleen voornaam + initiaal** (bijv. "Omar H."), geen exacte locaties.
  - Publieke highlights zijn geanimeerde tactische reconstructies, geen echte beelden.
  - Volledige identiteit alleen voor geverifieerde clubs onder NDA na toestemming voogd.
- Compliance: FIFA RSTP Artikel 19 (geen internationale transfers onder 18 buiten de uitzonderingen), solidariteitsbijdrage van toekomstige transfers terug naar de thuisgemeenschap.

Houd je bij nieuwe features/content altijd aan deze safeguarding-regels.

### Status
Het is een **conceptwebsite**: alle talentprofielen, cijfers, teamleden, prijzen en het contactadres (`hello@fcg.example`) zijn fictief. Formulieren (dossieraanvraag, voordracht, partnerschap, nieuwsbrief, donatie) versturen niets — ze tonen alleen een succesmelding/toast. Er worden geen echte betalingen verwerkt. HQ (fictief): Amsterdam, opgericht 2025.

## Pagina's

| Route | Component | Inhoud |
|---|---|---|
| `/` | `HomePage` | Hero met "Spotlight of the week", statistiek (1 op 6 kinderen groeit op in conflictgebied), het 4-stappen traject, interactieve wereldkaart (d3-geo) met scoutingregio's → hub Amsterdam → partneracademies, nieuwste talenten, kerncijfers, "Get involved" |
| `/talents` | `TalentsPage` | **Talentenportaal**: zoeken, filters (positie, leeftijd 14–21, regio, squad m/v, voorkeursbeen, status), sorteren, shortlist (ster), vergelijken (radarchart) en dossier aanvragen. Filters worden gespiegeld in de URL (`?q=&pos=&region=&squad=&status=`) |
| `/talent/[id]` | `ProfilePage` | Spelersprofiel: signature, OVR, attributen-radar, stats, heatmap, mini-veld met positie, bio, scoutquote, tijdlijn in het traject, geanimeerde "tactical replay" (canvas/SVG reel), dossier aanvragen, delen. Statisch gegenereerd via `generateStaticParams` |
| `/talent` | — | Redirect naar het eerste talent |
| `/clubs` | `ClubsPage` | Voor clubs: waarom FCG, procesaccordeon, compliance & safeguarding, partnerschappen (**Scout Access** €1.9k/seizoen, **Academy Partner** €7.5k/seizoen, **Founding Partner** op aanvraag), jouw shortlist (`#shortlist`), FAQ |
| `/about` | `AboutPage` | Missie: manifest/verhaal, 4 principes, safeguarding-charter (`#safeguarding`), team (placeholder-rollen), roadmap, talent voordragen (`#nominate`) |
| `/login` | `LoginPage` | Inloggen voor beheerders (Supabase Auth, gebruikersnaam + wachtwoord). `noindex` |
| `/admin` | `AdminPage` | **Beheerportaal**: nieuw talent toevoegen (alle profielvelden, live preview met signature/OVR/radar) incl. zelf getekende tactical replays ([ReplayEditor](components/ReplayEditor.tsx)). Alleen voor accounts in `admins`; bewerken van bestaande profielen volgt later. `noindex` |
| `/support` | `SupportPage` | Doneren (`#give`): eenmalig/maandelijks, bestemming, verdeling (62% programma's, 18% traject, 12% safeguarding & onderwijs, 8% operatie); andere manieren van helpen (coachen op afstand, materiaal, expertise, sponsoring) |

Oude statische URL's (`/talents.html`, `/talent.html?id=…`, etc.) worden geredirect in [next.config.ts](next.config.ts).

## Data

Alle content staat in **Supabase** (project `fcg-find-connect-grow`, ref `ersoactjwudfbpjqycav`, org *FindConnectandGrow*, eu-central-1). **Niet** het Dentavio-project (org Cartura) gebruiken.

- **Hoe de site leest**: de root layout roept `loadSiteData()` aan ([lib/site-data.ts](lib/site-data.ts)) en geeft alles via `Providers` door; client-componenten pakken het met `useData()` (`TALENTS`, `REGIONS`, `POS`, `GROUPS`, `STATUS`, `ATTR`, `TRAITS`, `HUB`, `ACADEMIES`, `TIERS`, `IMPACT`, `ALLOC`, `TEAM`, `METRICS`, `byId`). Types staan in [lib/data.ts](lib/data.ts). Pagina's zijn statisch met ISR (`revalidate = 300`): een wijziging in Supabase staat binnen ~5 min live.
- **Inhoud**: 11 regio's (`regions`), hub Amsterdam + 6 partneracademies (`locations`), 20 fictieve talenten (`talents` + `talent_traits`, volgorde via `sort`), posities met OVR-gewichten, statussen (0 Scouted, 1 Verified, 2 EU trial, 3 Partner academy), pakketten/prijzen, donatie-items, fondsverdeling, team, kerncijfers (`site_metrics`; regio's en scouts worden geteld uit `regions`).
- Lees talenten altijd via de view `talents_public` — die berekent `ovr`/`group`; nooit handmatig invullen.
- Tweetalige velden staan als `*_en`/`*_nl` kolommen en worden in de loader omgezet naar `Loc` (`{ en, nl }`). UI-teksten blijven in `lib/i18n.ts`.
- Schema: [supabase/migrations/](supabase/migrations/), demodata: [supabase/seed.sql](supabase/seed.sql). Client: [lib/supabase.ts](lib/supabase.ts), types: [lib/database.types.ts](lib/database.types.ts) (bij schemawijziging opnieuw genereren), env in `.env.local` (zie `.env.example`).
- **RLS**: content is publiek leesbaar, niet schrijfbaar. Formuliertabellen (`nominations`, `partnership_applications`, `help_offers`, `newsletter_subscribers`, `donations`) zijn **insert-only** voor bezoekers; dossieraanvragen via RPC `submit_dossier_request`. Nooit SELECT voor anon toevoegen: nominaties gaan over minderjarigen.
- **Beheer**: login via Supabase Auth; een gebruikersnaam wordt intern `<naam>@fcg.example` ([lib/supabase-browser.ts](lib/supabase-browser.ts), sessie in localStorage `fcg:auth`). Schrijfrechten alleen als `auth.uid()` in `public.admins` staat (`is_admin()`); talenten worden aangemaakt via RPC `create_talent(p jsonb, p_traits text[])` (security invoker, maakt unieke slug, zet `sort` achteraan). Na opslaan ververst de server action [app/admin/actions.ts](app/admin/actions.ts) de ISR-cache (na admin-check op het token). Nieuwe beheerder: user aanmaken in Supabase Auth en `insert into public.admins (user_id) …`.
- **Tactical replays**: sjablonen, types en helpers in [lib/replay.ts](lib/replay.ts), speler in [components/Reel.tsx](components/Reel.tsx). Getekende momenten staan in `talent_clips` (max 5 per talent; `ents`/`ball`/`events` als JSON, vorm gevalideerd door check-functies `valid_track`/`valid_clip_ents`/`valid_clip_events`) en komen als `Talent.clips` binnen. Talent zonder clips → `autoClips()` op basis van positie. `create_talent` krijgt de clips mee als `p.clips`.
- **Supabase MCP**: migraties met `drop`/destructieve SQL worden in deze omgeving automatisch geweigerd ("declined") — gebruik `create or replace` waar mogelijk.
- Safeguarding zit ook in de DB: `display_name` moet "Voornaam I." zijn (check constraint).
- Formulieren zijn nog **niet** aangesloten: ze tonen alleen een succesmelding. De shortlist blijft in localStorage.

## Tech stack

- **Next.js 16 (App Router)**, React 19, TypeScript (strict). Geen Tailwind, geen UI-library, geen tests/linter geconfigureerd.
- `d3-geo` + `topojson-client` + `world-atlas` voor de kaart op de homepage.
- Fonts via Google Fonts: Archivo (display), Newsreader (serif), JetBrains Mono.
- Path alias `@/*` → projectroot.

### Commando's
```
npm run dev     # dev server
npm run build   # productie build (doet ook de typecheck)
npm start
```

### Structuur
- `app/` — dunne route-bestanden die alleen een pagina-component renderen (+ metadata/params).
- `components/pages/*` — de echte pagina's, allemaal `'use client'`.
- [components/providers.tsx](components/providers.tsx) — contexts: data (`useData`), taal (`useLang`), toast (`useToast`), shortlist (`useShortlist`, `useStarToggle`), modal (`useModal`), `DocTitle`, `store` (localStorage met prefix `fcg:`).
- [components/Chrome.tsx](components/Chrome.tsx) — header (masthead, nav, taalswitch, shortlistteller, mobiel menu) en footer (nieuwsbrief).
- [components/ui.tsx](components/ui.tsx) — gedeelde UI: `T`, `Signature`, `PitchMini`, `Radar`, `StatusPill`, `StarButton`, `TalentCard`, `DossierForm`, `FormSuccess`, `useReveal` (scroll-fade-in + `data-count` tellers).
- [lib/fcg.ts](lib/fcg.ts) — pure helpers: vertaling (`loc`, `tx`, `sx`), seeded random (`hash`, `rng`), SVG-generators (`signaturePaths`, `pitchMiniInner`, `radarInner`). Geen data-imports: labels worden als parameter meegegeven.
- [lib/i18n.ts](lib/i18n.ts) — vertalingen.
- [app/globals.css](app/globals.css) — één groot handgeschreven CSS-bestand ("editorial design system") met CSS-variabelen: papier `--paper #F3F0E8`, inkt `--ink #0C1C36`, accent `--blue #1463F3`, donker `--night #0A1730`.
- `public/assets/` — FCG-logo's.

## Conventies

### Tweetaligheid (EN/NL) — altijd beide talen bijwerken
- Taal komt uit `?lang=nl|en` of localStorage, default `en`.
- **Statische tekst**: Engels inline via `<T k="sleutel" en="English text" />`; de Nederlandse versie hoort in het `NL` dictionary in `lib/i18n.ts` onder dezelfde sleutel. `T` rendert via `dangerouslySetInnerHTML`, dus kleine HTML (`<b>`, `<span class="it blue">`) mag in de strings.
- **Dynamische tekst**: `t('sleutel')` met beide talen in het `TX` dictionary.
- **Data**: `L(obj)` op een `{ en, nl }` object (uit `useData()`).
- Sleutels per pagina geprefixt: `h.` home, `p.` portaal, `pr.` profiel, `c.` clubs, `a.` about, `s.` support, `foot.`/`nav.`/`mast.` chrome.

### Overig
- Code-stijl: compact, veel one-liners, korte variabelenamen — volg de bestaande stijl.
- Graphics (signatures, radar, veldjes, heatmap) worden als SVG-strings gegenereerd en via `dangerouslySetInnerHTML` ingevoegd; deterministisch op basis van talent-id.
- Respecteer `prefers-reduced-motion` (`reducedMotion()`) bij animaties.
- Shortlist leeft alleen in localStorage van de bezoeker.

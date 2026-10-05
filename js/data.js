/* FCG concept data — all talent profiles are fictional.
   Safeguarding by design: first name + initial only, no photos. */

window.FCG_DATA = (function () {
  const REGIONS = {
    ukraine: {
      name: { en: 'Ukraine', nl: 'Oekraïne' }, place: 'Kharkiv · Dnipro · Zaporizhzhia',
      ll: [35.5, 48.8], iso: ['804'], since: 2025, scouts: 6,
      note: { en: 'Youth academies disrupted by the war. Many players train in temporary halls or have been displaced inside the country.', nl: 'Jeugdopleidingen zijn ontwricht door de oorlog. Veel spelers trainen in tijdelijke hallen of zijn ontheemd binnen het land.' }
    },
    syria: {
      name: { en: 'Syria', nl: 'Syrië' }, place: 'Aleppo · Idlib',
      ll: [37.0, 36.0], iso: ['760'], since: 2025, scouts: 5,
      note: { en: 'Over a decade of conflict left a generation without structured football. We work with community coaches in Aleppo and Idlib.', nl: 'Ruim tien jaar conflict liet een generatie zonder georganiseerd voetbal. We werken samen met buurttrainers in Aleppo en Idlib.' }
    },
    gaza: {
      name: { en: 'Gaza', nl: 'Gaza' }, place: 'Gaza Strip',
      ll: [34.4, 31.4], iso: ['275'], since: 2025, scouts: 2,
      note: { en: 'Scouting is done remotely: local coaches share match footage, our analysts verify. Players are supported by remote coaching.', nl: 'Scouting gebeurt op afstand: lokale trainers delen wedstrijdbeelden, onze analisten verifiëren. Spelers krijgen coaching op afstand.' }
    },
    yemen: {
      name: { en: 'Yemen', nl: 'Jemen' }, place: 'Aden',
      ll: [45.0, 12.9], iso: ['887'], since: 2026, scouts: 3,
      note: { en: 'A football-mad country with almost no youth infrastructure left. Street tournaments are our main scouting ground.', nl: 'Een voetbalgek land met vrijwel geen jeugdinfrastructuur meer. Straattoernooien zijn onze belangrijkste scoutingplek.' }
    },
    sudan: {
      name: { en: 'Sudan', nl: 'Soedan' }, place: 'Port Sudan · Kassala',
      ll: [35.5, 17.5], iso: ['729'], since: 2025, scouts: 4,
      note: { en: 'Millions displaced since 2023. We scout in safer eastern cities where displaced families have settled.', nl: 'Miljoenen ontheemden sinds 2023. We scouten in veiligere oostelijke steden waar ontheemde gezinnen zich hebben gevestigd.' }
    },
    southsudan: {
      name: { en: 'South Sudan', nl: 'Zuid-Soedan' }, place: 'Juba',
      ll: [31.6, 6.5], iso: ['728'], since: 2025, scouts: 4,
      note: { en: 'Exceptional athletic talent, very few scouting networks. Partnered with a local school league in Juba.', nl: 'Uitzonderlijk atletisch talent, nauwelijks scoutingnetwerken. Samenwerking met een lokale scholencompetitie in Juba.' }
    },
    kakuma: {
      name: { en: 'Kakuma camp', nl: 'Kamp Kakuma' }, place: 'Kenya · refugee camp',
      ll: [34.85, 3.72], iso: [], since: 2026, scouts: 3,
      note: { en: 'One of the largest refugee camps in the world, home to many South Sudanese and Congolese families. Camp leagues run every weekend.', nl: 'Een van de grootste vluchtelingenkampen ter wereld, met veel Zuid-Soedanese en Congolese gezinnen. Elk weekend worden er kampcompetities gespeeld.' }
    },
    drc: {
      name: { en: 'DR Congo', nl: 'DR Congo' }, place: 'Goma · Bukavu',
      ll: [28.9, -1.9], iso: ['180'], since: 2025, scouts: 5,
      note: { en: 'Eastern Congo has been unstable for decades. We partner with NGOs running boys’ and girls’ teams around Goma.', nl: 'Oost-Congo is al decennia instabiel. We werken met ngo’s die jongens- en meisjesteams rondom Goma begeleiden.' }
    },
    afghanistan: {
      name: { en: 'Afghanistan', nl: 'Afghanistan' }, place: 'Kabul · Herat · diaspora',
      ll: [67.5, 34.0], iso: ['004', '4'], since: 2026, scouts: 2,
      note: { en: 'Girls are barred from playing. Our women’s programme focuses on displaced Afghan players who continue training abroad.', nl: 'Meisjes mogen er niet voetballen. Ons vrouwenprogramma richt zich op ontheemde Afghaanse speelsters die in het buitenland doortrainen.' }
    },
    somalia: {
      name: { en: 'Somalia', nl: 'Somalië' }, place: 'Mogadishu',
      ll: [45.3, 3.5], iso: ['706'], since: 2026, scouts: 3,
      note: { en: 'Football is returning to Mogadishu’s streets. We support a mixed youth programme near the old stadium.', nl: 'Voetbal keert terug in de straten van Mogadishu. We steunen een gemengd jeugdprogramma bij het oude stadion.' }
    },
    sahel: {
      name: { en: 'Sahel', nl: 'Sahel' }, place: 'Burkina Faso · Mali',
      ll: [-1.6, 13.4], iso: ['854', '466'], since: 2026, scouts: 4,
      note: { en: 'Armed groups have closed schools and pitches in the north. We scout in cities hosting displaced families.', nl: 'Gewapende groepen hebben scholen en velden in het noorden gesloten. We scouten in steden die ontheemde gezinnen opvangen.' }
    }
  };

  const HUB = { name: 'Amsterdam', ll: [4.9, 52.37] };
  const ACADEMIES = [
    { name: 'Utrecht', ll: [5.12, 52.09] }, { name: 'Antwerpen', ll: [4.4, 51.22] },
    { name: 'Düsseldorf', ll: [6.77, 51.22] }, { name: 'Porto', ll: [-8.61, 41.15] },
    { name: 'Lyon', ll: [4.83, 45.76] }, { name: 'Kopenhagen', ll: [12.57, 55.68] }
  ];

  const POS = {
    GK: { en: 'Goalkeeper', nl: 'Keeper', g: 'gk' },
    CB: { en: 'Centre-back', nl: 'Centrale verdediger', g: 'def' },
    FB: { en: 'Full-back', nl: 'Back', g: 'def' },
    DM: { en: 'Defensive midfielder', nl: 'Verdedigende middenvelder', g: 'mid' },
    CM: { en: 'Central midfielder', nl: 'Centrale middenvelder', g: 'mid' },
    AM: { en: 'Attacking midfielder', nl: 'Aanvallende middenvelder', g: 'mid' },
    W:  { en: 'Winger', nl: 'Vleugelspeler', g: 'att' },
    ST: { en: 'Striker', nl: 'Spits', g: 'att' }
  };
  const GROUPS = {
    gk: { en: 'Goalkeepers', nl: 'Keepers' },
    def: { en: 'Defenders', nl: 'Verdedigers' },
    mid: { en: 'Midfielders', nl: 'Middenvelders' },
    att: { en: 'Attackers', nl: 'Aanvallers' }
  };
  const STATUS = [
    { en: 'Scouted', nl: 'Gescout' },
    { en: 'Verified', nl: 'Geverifieerd' },
    { en: 'EU trial', nl: 'Stage in Europa' },
    { en: 'Partner academy', nl: 'Partneracademie' }
  ];
  const ATTR = [
    { en: 'Pace', nl: 'Snelheid' },
    { en: 'Technique', nl: 'Techniek' },
    { en: 'Vision', nl: 'Inzicht' },
    { en: 'Physical', nl: 'Fysiek' },
    { en: 'Work rate', nl: 'Werklust' },
    { en: 'Composure', nl: 'Rust' }
  ];
  const TRAITS = {
    vision: { en: 'Vision', nl: 'Spelinzicht' }, set: { en: 'Set pieces', nl: 'Standaardsituaties' },
    dribble: { en: '1v1 dribbling', nl: '1-tegen-1 dribbel' }, leader: { en: 'Leadership', nl: 'Leiderschap' },
    aerial: { en: 'Aerial duels', nl: 'Kopduels' }, calm: { en: 'Composure on the ball', nl: 'Rust aan de bal' },
    speed: { en: 'Acceleration', nl: 'Acceleratie' }, finisher: { en: 'Clinical finishing', nl: 'Koele afwerking' },
    engine: { en: 'Engine', nl: 'Loopvermogen' }, tackle: { en: 'Ball winning', nl: 'Balverovering' },
    reflexes: { en: 'Reflexes', nl: 'Reflexen' }, distribution: { en: 'Distribution', nl: 'Opbouw vanuit achteren' },
    weakfoot: { en: 'Two-footed', nl: 'Tweebenig' }
  };

  const T = (o) => o; // marker for readability
  const TALENTS = [
    { id: 'omar-h', name: 'Omar H.', g: 'm', age: 17, pos: 'AM', foot: 'L', h: 174, no: 10, region: 'syria', city: 'Aleppo', status: 2, joined: '2025-03', trialCity: 'Utrecht',
      a: [78, 86, 88, 62, 74, 80], st: { m: 24, g: 9, as: 14 }, traits: ['vision', 'set', 'dribble'],
      bio: T({ en: 'Learned the game on a concrete square between apartment blocks in Aleppo. Plays between the lines and sees passes nobody else does.', nl: 'Leerde voetballen op een betonnen pleintje tussen flatgebouwen in Aleppo. Speelt tussen de linies en ziet passes die niemand anders ziet.' }),
      quote: T({ en: 'His first touch already sets up his next action. With proper coaching he could run a midfield at a high level.', nl: 'Zijn eerste aanname zet zijn volgende actie al klaar. Met goede begeleiding kan hij op hoog niveau een middenveld dirigeren.' }) },
    { id: 'maksym-k', name: 'Maksym K.', g: 'm', age: 18, pos: 'CB', foot: 'R', h: 188, no: 4, region: 'ukraine', city: 'Kharkiv', status: 3, joined: '2025-01', trialCity: 'Düsseldorf',
      a: [70, 72, 74, 84, 82, 85], st: { m: 31, g: 3, as: 2 }, traits: ['aerial', 'leader', 'calm'],
      bio: T({ en: 'Captained his youth team through two seasons of interrupted training. Commanding in the air and calm on the ball under pressure.', nl: 'Was aanvoerder van zijn jeugdteam tijdens twee seizoenen vol onderbroken trainingen. Dominant in de lucht en rustig aan de bal onder druk.' }),
      quote: T({ en: 'Organises the back line like a 25-year-old. Reads danger early and rarely needs to go to ground.', nl: 'Organiseert de achterlinie als een 25-jarige. Ziet gevaar vroeg aankomen en hoeft zelden naar de grond.' }) },
    { id: 'deng-m', name: 'Deng M.', g: 'm', age: 16, pos: 'ST', foot: 'R', h: 186, no: 9, region: 'southsudan', city: 'Juba', status: 1, joined: '2025-09',
      a: [88, 74, 66, 80, 78, 72], st: { m: 18, g: 21, as: 4 }, traits: ['speed', 'finisher', 'aerial'],
      bio: T({ en: 'A late growth spurt turned a quick winger into a powerful number nine. Scored 21 goals in 18 matches on dirt pitches around Juba.', nl: 'Een late groeispurt maakte van een snelle buitenspeler een krachtige nummer negen. Scoorde 21 keer in 18 wedstrijden op zandvelden rond Juba.' }),
      quote: T({ en: 'Raw, but the explosiveness is rare. Attacks the space behind the defence with every single run.', nl: 'Nog ruw, maar die explosiviteit is zeldzaam. Valt bij elke loopactie de ruimte achter de verdediging aan.' }) },
    { id: 'grace-k', name: 'Grace K.', g: 'f', age: 17, pos: 'W', foot: 'L', h: 165, no: 11, region: 'drc', city: 'Goma', status: 2, joined: '2025-05', trialCity: 'Antwerpen',
      a: [92, 82, 74, 64, 80, 76], st: { m: 20, g: 12, as: 9 }, traits: ['speed', 'dribble', 'engine'],
      bio: T({ en: 'Plays for a girls’ team run by a local NGO near Goma. Fearless in one-v-ones and relentless when tracking back.', nl: 'Speelt in een meidenteam van een lokale ngo bij Goma. Onbevreesd in een-tegen-een situaties en onvermoeibaar in het terugverdedigen.' }),
      quote: T({ en: 'Changes direction at full speed without losing the ball. The kind of winger defenders hate to face.', nl: 'Verandert op topsnelheid van richting zonder de bal te verliezen. Het type vleugelspeler waar verdedigers een hekel aan hebben.' }) },
    { id: 'yazan-k', name: 'Yazan K.', g: 'm', age: 15, pos: 'CM', foot: 'B', h: 170, no: 8, region: 'syria', city: 'Idlib', status: 0, joined: '2026-06',
      a: [72, 80, 82, 58, 86, 74], st: { m: 11, g: 2, as: 6 }, traits: ['engine', 'vision', 'weakfoot'],
      bio: T({ en: 'Grew up in a displacement camp where his father organised the only weekly match. Plays with both feet and never stops moving.', nl: 'Groeide op in een ontheemdenkamp waar zijn vader de enige wekelijkse wedstrijd organiseerde. Speelt met beide benen en staat nooit stil.' }),
      quote: T({ en: 'Very young, very clever. Scans before every reception — something you rarely see without academy coaching.', nl: 'Heel jong, heel slim. Kijkt om zich heen vóór elke aanname — iets wat je zelden ziet zonder academie-opleiding.' }) },
    { id: 'liliia-p', name: 'Liliia P.', g: 'f', age: 18, pos: 'CM', foot: 'R', h: 170, no: 6, region: 'ukraine', city: 'Dnipro', status: 3, joined: '2025-02', trialCity: 'Kopenhagen',
      a: [74, 84, 86, 70, 88, 84], st: { m: 27, g: 6, as: 11 }, traits: ['leader', 'vision', 'set'],
      bio: T({ en: 'Kept her women’s youth team together after their club stopped operating. Now training with a partner academy in Copenhagen.', nl: 'Hield haar vrouwenjeugdteam bij elkaar toen hun club stopte. Traint nu bij een partneracademie in Kopenhagen.' }),
      quote: T({ en: 'A natural organiser with excellent passing range. Already speaks to teammates like a captain.', nl: 'Een natuurlijke organisator met een uitstekend passbereik. Spreekt ploeggenoten nu al toe als een aanvoerder.' }) },
    { id: 'mahmoud-a', name: 'Mahmoud A.', g: 'm', age: 16, pos: 'GK', foot: 'R', h: 185, no: 1, region: 'gaza', city: 'Gaza Strip', status: 1, joined: '2025-07',
      a: [60, 70, 72, 76, 74, 86], st: { m: 15, cs: 6, sv: 48 }, traits: ['reflexes', 'distribution', 'calm'],
      bio: T({ en: 'Trained on sand pitches, often without nets or proper gloves. Now supported remotely by an FCG goalkeeper coach.', nl: 'Trainde op zandvelden, vaak zonder netten of goede handschoenen. Krijgt nu begeleiding op afstand van een FCG-keeperstrainer.' }),
      quote: T({ en: 'Brave, vocal and quick off his line. His footwork is already ahead of most keepers his age.', nl: 'Moedig, communicatief en snel van zijn lijn. Zijn voetenwerk loopt al voor op de meeste keepers van zijn leeftijd.' }) },
    { id: 'ammar-y', name: 'Ammar Y.', g: 'm', age: 17, pos: 'DM', foot: 'R', h: 178, no: 5, region: 'yemen', city: 'Aden', status: 1, joined: '2026-01',
      a: [68, 78, 80, 74, 86, 82], st: { m: 19, g: 1, as: 5 }, traits: ['tackle', 'calm', 'engine'],
      bio: T({ en: 'Spotted at a Ramadan street tournament in Aden. Shields the back four and keeps the ball moving with simple, clever passes.', nl: 'Ontdekt tijdens een ramadan-straattoernooi in Aden. Beschermt de verdediging en houdt de bal in beweging met simpele, slimme passes.' }),
      quote: T({ en: 'Always in the right place. Teams with him in midfield simply concede fewer chances.', nl: 'Staat altijd op de juiste plek. Teams met hem op het middenveld krijgen simpelweg minder kansen tegen.' }) },
    { id: 'abdelrahman-o', name: 'Abdelrahman O.', g: 'm', age: 19, pos: 'FB', foot: 'L', h: 176, no: 3, region: 'sudan', city: 'Port Sudan', status: 2, joined: '2025-04', trialCity: 'Porto',
      a: [86, 74, 70, 72, 88, 72], st: { m: 26, g: 2, as: 8 }, traits: ['speed', 'engine', 'tackle'],
      bio: T({ en: 'Fled Khartoum with his family in 2023 and kept playing in Port Sudan. An overlapping left-back with endless stamina.', nl: 'Vluchtte in 2023 met zijn familie uit Khartoem en bleef voetballen in Port Sudan. Een opkomende linksback met eindeloos uithoudingsvermogen.' }),
      quote: T({ en: 'Covers the whole flank for ninety minutes. Crossing needs work, but the engine is elite.', nl: 'Bestrijkt negentig minuten lang de hele flank. Zijn voorzetten kunnen beter, maar zijn motor is topniveau.' }) },
    { id: 'peter-l', name: 'Peter L.', g: 'm', age: 17, pos: 'CB', foot: 'L', h: 191, no: 15, region: 'kakuma', city: 'Kakuma', status: 1, joined: '2026-03',
      a: [72, 66, 68, 88, 80, 78], st: { m: 16, g: 4, as: 1 }, traits: ['aerial', 'tackle', 'leader'],
      bio: T({ en: 'Born in Kakuma refugee camp. The tallest player in the camp league and its most feared defender.', nl: 'Geboren in vluchtelingenkamp Kakuma. De langste speler van de kampcompetitie en de meest gevreesde verdediger.' }),
      quote: T({ en: 'Left-footed centre-backs with this frame are rare anywhere in the world. Needs games at a higher level.', nl: 'Linksbenige centrale verdedigers met dit postuur zijn overal ter wereld zeldzaam. Heeft wedstrijden op hoger niveau nodig.' }) },
    { id: 'josue-m', name: 'Josué M.', g: 'm', age: 18, pos: 'ST', foot: 'L', h: 180, no: 19, region: 'drc', city: 'Bukavu', status: 1, joined: '2025-11',
      a: [82, 84, 72, 76, 74, 82], st: { m: 22, g: 17, as: 6 }, traits: ['finisher', 'dribble', 'calm'],
      bio: T({ en: 'Plays in Bukavu’s lakeside youth league. Ice-cold in front of goal and capable of creating his own chances.', nl: 'Speelt in de jeugdcompetitie aan het meer van Bukavu. IJskoud voor de goal en in staat zelf kansen te creëren.' }),
      quote: T({ en: 'Finishes with both power and placement. One of the most complete strikers we have seen in the region.', nl: 'Werkt af met kracht én precisie. Een van de meest complete spitsen die we in de regio hebben gezien.' }) },
    { id: 'farid-n', name: 'Farid N.', g: 'm', age: 18, pos: 'W', foot: 'R', h: 172, no: 7, region: 'afghanistan', city: 'Kabul', status: 2, joined: '2026-02', trialCity: 'Antwerpen',
      a: [90, 84, 76, 62, 78, 74], st: { m: 17, g: 10, as: 7 }, traits: ['speed', 'dribble', 'finisher'],
      bio: T({ en: 'Futsal player turned winger. His close control comes from years of playing in tight concrete courts in Kabul.', nl: 'Zaalvoetballer die vleugelspeler werd. Zijn balbeheersing komt van jaren spelen op krappe betonnen veldjes in Kabul.' }),
      quote: T({ en: 'Inverted winger with a lethal cut inside. Quick feet in small spaces — very futsal, very modern.', nl: 'Buitenspeler op de verkeerde vleugel met een dodelijke actie naar binnen. Snelle voeten in kleine ruimtes — heel futsal, heel modern.' }) },
    { id: 'shabnam-r', name: 'Shabnam R.', g: 'f', age: 19, pos: 'ST', foot: 'R', h: 168, no: 9, region: 'afghanistan', city: 'Herat', status: 3, joined: '2025-01', trialCity: 'Utrecht',
      a: [80, 82, 78, 70, 84, 86], st: { m: 29, g: 23, as: 8 }, traits: ['finisher', 'leader', 'calm'],
      bio: T({ en: 'Had to stop playing in Herat in 2021. Kept training in secret, then abroad. Now part of a partner academy in the Netherlands.', nl: 'Moest in 2021 stoppen met voetballen in Herat. Bleef in het geheim en later in het buitenland trainen. Nu onderdeel van een partneracademie in Nederland.' }),
      quote: T({ en: 'Smart movement, two-touch finishing, and a mentality that is impossible to coach. A true leader.', nl: 'Slimme loopacties, afwerking in twee keer raken en een mentaliteit die je niet kunt aanleren. Een echte leider.' }) },
    { id: 'abdi-w', name: 'Abdi W.', g: 'm', age: 16, pos: 'AM', foot: 'R', h: 171, no: 14, region: 'somalia', city: 'Mogadishu', status: 0, joined: '2026-07',
      a: [80, 82, 80, 60, 72, 76], st: { m: 9, g: 5, as: 6 }, traits: ['dribble', 'vision', 'set'],
      bio: T({ en: 'Known on his street as “the magician”. Plays barefoot on sand most of the week and in borrowed boots on match days.', nl: 'Op straat bekend als “de tovenaar”. Speelt het grootste deel van de week op blote voeten in het zand, op wedstrijddagen in geleende schoenen.' }),
      quote: T({ en: 'Pure creativity. Still needs structure and strength, but you cannot teach this kind of imagination.', nl: 'Pure creativiteit. Heeft nog structuur en kracht nodig, maar deze verbeelding kun je niet aanleren.' }) },
    { id: 'hodan-a', name: 'Hodan A.', g: 'f', age: 16, pos: 'FB', foot: 'R', h: 163, no: 2, region: 'somalia', city: 'Mogadishu', status: 1, joined: '2026-04',
      a: [84, 72, 70, 66, 90, 72], st: { m: 12, g: 1, as: 4 }, traits: ['engine', 'tackle', 'speed'],
      bio: T({ en: 'One of the first girls in Mogadishu’s mixed youth programme. Wins her duels and never gives up on a run.', nl: 'Een van de eerste meisjes in het gemengde jeugdprogramma van Mogadishu. Wint haar duels en geeft een loopactie nooit op.' }),
      quote: T({ en: 'Fierce in the tackle and a constant outlet on the right. Huge room to grow with proper coaching.', nl: 'Fel in de duels en altijd aanspeelbaar op rechts. Enorme groeiruimte met goede begeleiding.' }) },
    { id: 'ibrahim-t', name: 'Ibrahim T.', g: 'm', age: 17, pos: 'DM', foot: 'R', h: 183, no: 6, region: 'sahel', city: 'Ouagadougou', status: 2, joined: '2025-06', trialCity: 'Lyon',
      a: [70, 80, 84, 82, 84, 84], st: { m: 23, g: 3, as: 7 }, traits: ['tackle', 'vision', 'leader'],
      bio: T({ en: 'His family left the north of Burkina Faso when his school closed. A tall, elegant six who dictates the tempo.', nl: 'Zijn familie verliet het noorden van Burkina Faso toen zijn school sloot. Een lange, elegante zes die het tempo bepaalt.' }),
      quote: T({ en: 'Rare combination of physical presence and passing quality. Looks unhurried in every situation.', nl: 'Zeldzame combinatie van fysieke aanwezigheid en passkwaliteit. Oogt in elke situatie ontspannen.' }) },
    { id: 'moussa-k', name: 'Moussa K.', g: 'm', age: 15, pos: 'W', foot: 'L', h: 167, no: 17, region: 'sahel', city: 'Mopti', status: 0, joined: '2026-08',
      a: [88, 80, 70, 56, 76, 68], st: { m: 8, g: 6, as: 3 }, traits: ['speed', 'dribble'],
      bio: T({ en: 'The youngest player in our Sahel group. Plays in a riverside league in Mopti and is already the fastest on the pitch.', nl: 'De jongste speler in onze Sahel-groep. Speelt in een competitie aan de rivier in Mopti en is nu al de snelste op het veld.' }),
      quote: T({ en: 'Early days, but the acceleration over five metres is outstanding. One to follow closely.', nl: 'Nog vroeg, maar zijn acceleratie over vijf meter is uitzonderlijk. Iemand om nauw te volgen.' }) },
    { id: 'artem-s', name: 'Artem S.', g: 'm', age: 16, pos: 'GK', foot: 'L', h: 190, no: 12, region: 'ukraine', city: 'Zaporizhzhia', status: 0, joined: '2026-05',
      a: [58, 66, 70, 80, 72, 78], st: { m: 12, cs: 4, sv: 37 }, traits: ['reflexes', 'aerial'],
      bio: T({ en: 'Kept training after his club’s stadium was damaged. Big frame, big reach, and a very calm voice behind the defence.', nl: 'Bleef trainen nadat het stadion van zijn club beschadigd raakte. Groot postuur, groot bereik en een rustige stem achter de verdediging.' }),
      quote: T({ en: 'Commands his box on crosses. Needs specialist coaching on footwork — the base is very promising.', nl: 'Beheerst zijn zestien bij voorzetten. Heeft specialistische training nodig op voetenwerk — de basis is veelbelovend.' }) },
    { id: 'karim-s', name: 'Karim S.', g: 'm', age: 18, pos: 'FB', foot: 'R', h: 177, no: 22, region: 'gaza', city: 'Gaza Strip', status: 1, joined: '2025-08',
      a: [82, 76, 72, 70, 84, 74], st: { m: 14, g: 1, as: 6 }, traits: ['engine', 'speed', 'weakfoot'],
      bio: T({ en: 'Verified through footage shared by his former coach. A modern full-back who is comfortable on both flanks.', nl: 'Geverifieerd via beelden die zijn voormalige trainer deelde. Een moderne back die zich op beide flanken thuis voelt.' }),
      quote: T({ en: 'Two-footed, quick and brave. Would benefit enormously from a stable training environment.', nl: 'Tweebenig, snel en moedig. Zou enorm profiteren van een stabiele trainingsomgeving.' }) },
    { id: 'amina-e', name: 'Amina E.', g: 'f', age: 17, pos: 'CB', foot: 'R', h: 172, no: 5, region: 'sudan', city: 'Kassala', status: 0, joined: '2026-08',
      a: [70, 70, 72, 80, 82, 80], st: { m: 10, g: 1, as: 0 }, traits: ['aerial', 'leader', 'tackle'],
      bio: T({ en: 'Plays in a girls’ team set up by displaced teachers in Kassala. Strong in the air and the team’s natural captain.', nl: 'Speelt in een meidenteam dat door ontheemde leraren in Kassala is opgezet. Sterk in de lucht en de natuurlijke aanvoerder van het team.' }),
      quote: T({ en: 'Reads the game well and organises loudly. Exactly the profile women’s academies are looking for.', nl: 'Leest het spel goed en coacht luid. Precies het profiel waar vrouwenacademies naar zoeken.' }) }
  ];

  TALENTS.forEach((t) => {
    const w = { GK: [0, .1, .2, .25, .15, .3], CB: [.12, .1, .13, .25, .2, .2], FB: [.25, .15, .1, .15, .25, .1],
      DM: [.08, .2, .22, .18, .17, .15], CM: [.12, .22, .25, .1, .18, .13], AM: [.15, .3, .28, .05, .1, .12],
      W: [.3, .28, .15, .05, .12, .1], ST: [.22, .22, .1, .16, .1, .2] }[t.pos];
    t.ovr = Math.round(t.a.reduce((s, v, i) => s + v * w[i], 0));
    t.group = POS[t.pos].g;
  });

  return { REGIONS, HUB, ACADEMIES, POS, GROUPS, STATUS, ATTR, TRAITS, TALENTS };
})();

import type { BrandGenome } from "./brand";
import type { ShootBrief, Word } from "./types";

/**
 * Hand-written so the UI can be built and demoed with no API keys and no network.
 * The cached demo path depends on this too.
 */
export const FIXTURE_BRIEF: ShootBrief = {
  id: "brief-fixture",
  topic: "Warum unsere Espressomischung dreimal geröstet wird",
  hook: "Die meisten Röstereien rösten einmal. Wir dreimal — und das hat einen unangenehmen Grund.",
  totalSeconds: 28,
  shots: [
    {
      n: 1,
      label: "Hook",
      seconds: 4,
      say: "Die meisten rösten einmal. Wir dreimal. Und das ist eigentlich Faulheit — nur andersrum.",
      camera:
        "Handy vertikal auf Brusthöhe, Arm ausgestreckt, du stehst direkt vor der Trommel. Gesicht füllt das obere Drittel.",
      onScreen: "3× geröstet",
    },
    {
      n: 2,
      label: "Problem",
      seconds: 8,
      say: "Einmal rösten heißt: du entscheidest dich für einen Kompromiss. Die Bohne, die Süße braucht, kriegt dieselbe Hitze wie die, die Säure braucht.",
      camera:
        "Handy auf die Bohnenschale legen, langsam hochziehen bis auf Augenhöhe. Eine Bewegung, nicht schneiden.",
    },
    {
      n: 3,
      label: "Beweis",
      seconds: 10,
      say: "Also trennen wir. Jede Sorte kommt einzeln rein, mit eigener Kurve. Erst danach mischen wir. Das dauert dreimal so lang und kostet dreimal so viel Gas.",
      camera:
        "Nah auf die Hände, während du drei getrennte Schalen nebeneinander schiebst. Handy auf Tischhöhe, leicht schräg von oben.",
      onScreen: "3 Kurven, 1 Mischung",
    },
    {
      n: 4,
      label: "Payoff",
      seconds: 6,
      say: "Deswegen schmeckt der Espresso auch mit Milch noch nach irgendwas. Probier's, und wenn du keinen Unterschied merkst, sag's mir ehrlich.",
      camera:
        "Zurück auf Augenhöhe, Tasse ins Bild halten, direkt in die Kamera sprechen. Letzte Sekunde still stehen bleiben.",
    },
  ],
  caption:
    "Dreimal rösten klingt nach Angeberei. Ist aber nur die Konsequenz aus einem Problem, das die meisten wegmischen.\n\nJede Sorte bekommt ihre eigene Kurve, gemischt wird erst danach. Dauert länger, kostet mehr Gas, schmeckt aber auch durch Milch durch.",
  hashtags: ["#espresso", "#kaffeerösterei", "#specialtycoffee", "#handwerk", "#stuttgart"],
  cta: "Sag mir in den Kommentaren, ob du den Unterschied merkst.",
  soundIdea: "Originalton — Trommelgeräusch im Hintergrund ist das halbe Video.",
  bestPostTime: "Di–Do 18:30–20:00",
  createdAt: "2026-07-25T08:00:00.000Z",
};

/**
 * The brand behind the fixture brief, so the cached demo path tells one story
 * end to end: genome → brief → clip. Written from the same voice as
 * FIXTURE_BRIEF rather than a second brand, because a fallback that contradicts
 * itself is worse than no fallback.
 *
 * Shipped to the browser as public/demo/genome.json.
 */
const GENOME_FIELDS: Omit<BrandGenome, "context"> = {
  sourceUrl: "https://roestwerk-sued.de",
  name: "Röstwerk Süd",
  tagline: "Dreimal rösten. Einmal mischen.",
  voice: {
    adjectives: ["direkt", "trocken", "unangeberisch"],
    petPhrases: [
      "Die meisten rösten einmal. Wir dreimal.",
      "Das ist eigentlich Faulheit — nur andersrum.",
      "Jede Sorte kriegt ihre eigene Kurve.",
      "Gemischt wird erst danach.",
      "Dauert länger, kostet mehr Gas.",
      "Schmeckt auch durch Milch durch.",
      "Probier's, und wenn du keinen Unterschied merkst, sag's mir ehrlich.",
      "Originalton — das Trommelgeräusch ist das halbe Video.",
    ],
    forbidden: [
      "Kaffeegenuss",
      "Genussmoment",
      "handverlesen",
      "Premium",
      "einzigartig",
      "Geschmackserlebnis",
      "revolutionär",
    ],
    sentenceStyle:
      "Kurze Hauptsätze. Zahl statt Adjektiv. Oft ein Widerspruch im ersten Satz, aufgelöst im zweiten. Duzt konsequent, gibt Nachteile zuerst zu.",
    emojiPolicy: "sparing",
  },
  look: {
    palette: ["#1A120B", "#E8DCC8", "#C1440E", "#5C4033", "#F5F1E8"],
    typographyVibe:
      "Schmale Grotesk in Versalien auf den Tüten, sonst Serife im Fließtext. Viel Weißraum, kaum Rahmen.",
    imageryStyle:
      "Werkstattfotos bei Kunstlicht: Trommel, Hände, Bohnen im Halbschatten. Kein Latte-Art-Stock.",
  },
  substance: {
    pillars: [
      "Getrennte Röstkurven pro Sorte",
      "Warum erst nach dem Rösten gemischt wird",
      "Espresso, der durch Milch durchkommt",
      "Direktbezug und was er wirklich kostet",
      "Mahlgrad und Wasser zu Hause",
      "Handwerk ohne Küchenlatein",
    ],
    icp: "Der Gastronom oder Vielkoch, der schon guten Kaffee kauft und sich trotzdem fragt, warum der Espresso zu Hause nach nichts schmeckt.",
    proofPoints: [
      "Drei getrennte Röstkurven pro Blend, gemischt wird erst danach",
      "Dreifacher Gasverbrauch gegenüber einem einzelnen Durchgang",
      "Trommelröstung in Stuttgart, keine Heißluft",
    ],
  },
  hooks: [
    "Die meisten {branche} machen {üblicher_weg}. Wir {abweichung} — und das hat einen unangenehmen Grund.",
    "{zahl}× {vorgang} klingt nach Angeberei. Ist aber nur die Konsequenz aus {problem}.",
    "Dauert länger, kostet mehr {ressource}. Dafür {ergebnis}.",
    "Probier's, und wenn du {kein_unterschied} merkst, sag's mir ehrlich.",
    "Das ist eigentlich {vorwurf} — nur andersrum.",
  ],
};

/**
 * Mirrors `toContext` in lib/brand.ts — same shape, so a cached genome and a
 * freshly crawled one ground the brief prompt identically.
 */
function toContext(g: Omit<BrandGenome, "context">): string {
  const { voice, substance } = g;
  return [
    `Marke: ${g.name}${g.tagline ? ` — ${g.tagline}` : ""}`,
    `Tonalität: ${voice.adjectives.join(", ")}`,
    `Satzbau: ${voice.sentenceStyle}`,
    `Emojis: ${voice.emojiPolicy}`,
    `Zielperson: ${substance.icp}`,
    `Formulierungen, die die Marke wirklich benutzt — übernimm davon, wo es passt:`,
    ...voice.petPhrases.map((p) => `- "${p}"`),
    `Wörter, die NIE vorkommen dürfen: ${voice.forbidden.join(", ")}`,
    `Belegbare Fakten, nichts dazuerfinden: ${substance.proofPoints.join(" · ")}`,
    `Themenfelder: ${substance.pillars.join(" · ")}`,
    `\nBewährte Hook-Muster:\n${g.hooks.map((h) => `- ${h}`).join("\n")}`,
  ].join("\n");
}

export const FIXTURE_GENOME: BrandGenome = {
  ...GENOME_FIELDS,
  context: toContext(GENOME_FIELDS),
};

/**
 * Stand-in transcript with a dead pause and a hesitation, so the cut logic has
 * something real to chew on when no transcription key is configured.
 */
export const FIXTURE_WORDS: Word[] = [
  ["Die", 0.8, 1.0], ["meisten", 1.0, 1.4], ["rösten", 1.4, 1.8], ["einmal.", 1.8, 2.3],
  ["ähm", 3.1, 3.5],
  ["Wir", 5.9, 6.15], ["dreimal.", 6.15, 6.8],
  ["Und", 7.0, 7.2], ["das", 7.2, 7.4], ["ist", 7.4, 7.6],
  ["eigentlich", 7.6, 8.1], ["Faulheit", 8.1, 8.7],
  ["nur", 9.9, 10.1], ["andersrum.", 10.1, 10.9],
].map(([text, start, end]) => ({
  text: text as string,
  start: start as number,
  end: end as number,
  type: "word" as const,
}));

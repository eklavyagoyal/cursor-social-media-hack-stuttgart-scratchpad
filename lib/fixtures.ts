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

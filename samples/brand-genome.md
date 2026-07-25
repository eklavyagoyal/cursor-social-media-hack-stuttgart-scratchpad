# Brand Genome — Legacy AI

Read from **https://legacy-ai.de**. Source: `public/demo/genome.json`.

> Don't let the answer retire with the expert.

**Voice:** plain · uncompromising · technically exact  
**Emoji policy:** none

## The 8 phrases the brand actually uses

Verbatim from their own pages. This is the field that makes a script sound like
them rather than like every other AI tool.

> Don't let the answer retire with the expert.

> answers carry citations, or none at all

> Cited, or nothing.

> Honesty is the default, not a setting.

> And when it doesn't know, it says so.

> Every company runs on knowledge that was never written down.

> once they're gone, it's gone

> One brain. Many senses.

## Palette

Taken from the site's own markup, not guessed.

- `#000000`
- `#FFFFFF`
- `#9A9DA1`
- `#C7973E`
- `#201F23`

**Typography:** Display face for statements, mono for technical labels and source citations.  
**Imagery:** Near-black surfaces, industrial detail, anatomical metaphor (Cortex, Lens, Atlas, Larynx, Pharynx, Thalamus). No stock photography.

## Substance

**Who they talk to**  
A production engineering lead at an industrial manufacturer whose most experienced people are retiring faster than they can be replaced.

**Pillars**

1. Knowledge that was never written down
2. The retirement wave in industrial expertise
3. Cited answers versus confident invention
4. Permission-aware by construction, not bolted on
5. EU hosting and GDPR-first governance
6. Human-in-the-loop review before anything is stored

**Proof points**

- Roughly 70% of what an organisation knows is tacit, held in people and not documents
- Voice-first expert interviews, 30 to 60 minutes, capturing the reasoning and not just the result
- Permissions enforced in Postgres row-level security, not in application code that can be bypassed
- Hosted in Germany, GDPR-first, append-only audit trail, per-person export and deletion
- In use with a Production Engineering Lead at a major automotive OEM

## Hook patterns

- `Don't let {valuable thing} retire with {person}.`
- `Every company runs on {thing} that was never written down.`
- `Most tools {do the easy thing}. The hard part is {the real thing}.`
- `{Claim}, or nothing.`
- `And when it doesn't know, it says so.`

## Guardrails

**Never says:** revolutionary, game-changing, seamless, leverage, cutting-edge, unlock, AI-powered, empower

**Sentence style:** Short declaratives. Headline is a full sentence with a hard full stop. Parenthetical aside for the honest caveat. Refuses superlatives entirely — states the limitation before the benefit.

## The grounding block

This is the exact string passed to `POST /api/brief` as `context`. It is what
makes the shoot brief come back in the brand's own language.

```
Marke: Legacy AI — Don't let the answer retire with the expert.
Tonalität: plain, uncompromising, technically exact
Satzbau: Short declaratives. Headline ist ein vollständiger Satz mit hartem Punkt. Klammer-Einschub für den ehrlichen Vorbehalt. Verweigert Superlative komplett — nennt die Einschränkung vor dem Nutzen.
Emojis: none
Zielperson: A production engineering lead at an industrial manufacturer whose most experienced people are retiring faster than they can be replaced.

Formulierungen, die die Marke wirklich benutzt — übernimm davon, wo es passt. Sie sind englisch, weil die Marke so schreibt: im deutschen Skript darfst du sie als Zitat stehen lassen oder eng am Original übersetzen, aber erfinde keine neuen Slogans dazu.
- "Don't let the answer retire with the expert."
- "answers carry citations, or none at all"
- "Cited, or nothing."
- "Honesty is the default, not a setting."
- "And when it doesn't know, it says so."
- "Every company runs on knowledge that was never written down."
- "once they're gone, it's gone"
- "One brain. Many senses."

Wörter, die NIE vorkommen dürfen: revolutionary, game-changing, seamless, leverage, cutting-edge, unlock, AI-powered, empower
Belegbare Fakten, nichts dazuerfinden: rund 70% des Firmenwissens ist tacit, steckt in Menschen statt Dokumenten · Voice-first Experten-Interviews, 30 bis 60 Minuten · Postgres row-level security statt Anwendungscode · in Deutschland gehostet, GDPR-first, append-only audit trail · im Einsatz bei einem Production Engineering Lead eines großen Automotive-OEM
Themenfelder: Wissen, das nie aufgeschrieben wurde · die Verrentungswelle industrieller Expertise · zitierte Antworten statt selbstsicherer Erfindung · Permissions by construction · EU-Hosting und GDPR · Human-in-the-loop vor dem Speichern

Bewährte Hook-Muster:
- Don't let {valuable thing} retire with {person}.
- Every company runs on {thing} that was never written down.
- Most tools {do the easy thing}. The hard part is {the real thing}.
- {Claim}, or nothing.
- And when it doesn't know, it says so.
```

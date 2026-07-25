# Samples

Output from the pipeline in this repo, copied out of `public/demo/` so it can be read
without running anything. Provenance is listed per file rather than in one blanket
sentence, because two of these four are machine output and two are fixtures — and the
difference matters if you are judging whether the thing works.

| File | What it is | Produced by |
|---|---|---|
| [`cut-report.md`](cut-report.md) | Silence and filler detection, the cut plan, and caption timings on the output timeline | **Machine output.** `npm run seed:demo` → `lib/cut.ts` + `lib/render.ts` |
| [`reel.mp4`](reel.mp4) | The rendered vertical video, 1080×1920, captions burned in | **Machine output.** `npm run seed:demo` → ffmpeg + `@napi-rs/canvas` |
| [`shoot-brief.md`](shoot-brief.md) | The shot list a creator films from | Fixture in `lib/fixtures.ts`, matching the `ShootBrief` contract. Regenerate live with `POST /api/brief` |
| [`brand-genome.md`](brand-genome.md) | Voice, verbatim phrases, palette and grounding block read off a brand's website | Grounded in the real copy at [legacy-ai.de](https://legacy-ai.de), assembled by hand. Regenerate live with `POST /api/brand` |

Both fixtures exist because `OPENAI_API_KEY` was not configured on the machine that
produced this cache. They match the contracts in `lib/types.ts` and `lib/brand.ts` field
for field — `npx tsx scripts/smoke.mts` asserts exactly that — so the UI and the live
routes cannot tell them apart. Nothing in them is invented: the brand genome quotes only
sentences that appear on legacy-ai.de, and the palette is the site's own.

`reel.mp4` is built from a synthetic 12-second ffmpeg test clip, not from phone footage,
so it is colour bars with real captions over them. That is the honest state of the cached
path: the cutting, the caption timing and the encode are real work on a real file; the
subject in frame is a test pattern. Point the seeder at your own clip to see it with a
face in it:

```bash
npm run seed:demo -- your-clip.mov
```

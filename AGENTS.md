# ⚠️ TWO PEOPLE AND MULTIPLE AGENTS ARE WRITING TO THIS REPO RIGHT NOW

Read this before your first edit. Violating it costs the team work, and today there is no time to
recover lost work.

## Push constantly. This is the most important rule in this repo.

```bash
git pull --rebase origin main      # ALWAYS before you push
git add <only your own files>
git commit -m "..."
git push origin main
```

- **Commit and push every 15 minutes, minimum.** Not at the end. Not "when it's clean."
- **Push after every unit that works.** One component done → push. One route wired → push.
- **Never hold work locally for more than 15 minutes.** Unpushed work is invisible to everyone else,
  and two agents unaware of each other will write the same file twice.
- **Always `git pull --rebase origin main` before pushing.** Not a plain merge — it keeps the history
  readable, and history is our evidence that the work was built at the event.
- **Small commits.** One concern each. A 40-file commit is impossible for anyone else to review or revert.
- **Never force-push `main`. Never rewrite pushed history.** Someone else has already based work on it.

## Stay in your lane

Every agent is given an explicit list of files it owns. **Only edit those.** If you believe you need
to change a file outside your lane:

1. Don't.
2. Say what you need and why, and let the owner do it.

The common failure is a well-meaning agent "fixing" a type or a route in someone else's lane. That
produces a conflict on a file two people are mid-edit on, and resolving it costs more than the fix saved.

## If you hit a conflict

Do **not** resolve it blind, and do **not** pick "yours" by default. Look at both sides. If the other
side renamed or restructured something, **their naming wins** — adapt to it rather than reverting it.
If you can't tell which side is right, stop and ask.

## Before you push, always

```bash
npx tsc --noEmit     # must be clean — a broken main blocks the other person
```

A red `main` is worse than no commit. If you break it, fix it or revert it immediately — never
"I'll fix it after lunch."

## Context

Hackathon, judged today. Submission deadline **16:30**, coding stops **15:00**, hard feature freeze
**14:45**. The plan lives in `docs/` — `docs/00-WIN-CONDITIONS.md` for how it's scored,
`docs/10-TEAM-LANES.md` for who owns what.

This repo uses **npm**, not pnpm.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

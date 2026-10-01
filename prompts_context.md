# FinTrack — AI Assistant Context (Read This First)

This file is the entry point. Read this, then `architecture.md`, `features.md`,
`conventions.md`, `database-schema.md`, and `progress.md` before writing any code.

## What this project is

FinTrack is a full-stack personal finance management web app built for a
college Software Engineering course project (SEPM), but engineered to a real
production standard — it will also be used as a portfolio/resume project.

Users track income/expenses, set budgets, track savings goals, track
subscriptions, define auto-categorization rules, see spend forecasts, and get
AI-assisted insights (categorization suggestions, summary narratives, anomaly
explanations) layered on top of deterministic calculations.

## Non-negotiable engineering principles

1. **Business logic lives in `services/`, never in controllers or routes.**
   Controllers only parse requests and call services. This is required for
   unit testing and is graded as a non-functional requirement (NFR-MNT-01).
2. **Money is always stored and calculated as integers (smallest currency
   unit — paise).** Never use floats for money. See `conventions.md` for the
   exact pattern.
3. **AI is additive, never load-bearing.** Every AI call (Groq) must have a
   deterministic fallback path. If Groq is down, slow, or returns malformed
   output, the feature must degrade gracefully (e.g., show uncategorized
   instead of crashing). Never let an AI call block or corrupt a core
   financial calculation.
4. **Budget updates must be concurrency-safe.** Use atomic database
   operations (`UPDATE budgets SET spent = spent + $1 WHERE id = $2`, not
   read-then-write) so two simultaneous transactions can never produce a
   wrong total. This is tested explicitly — see `database-schema.md` and
   `progress.md` test notes.
5. **Transaction creation must be idempotent.** Every write request to
   create a transaction accepts an `Idempotency-Key` header. If a key has
   been seen before, return the original result instead of creating a
   duplicate. See `conventions.md`.
6. **No feature may require infrastructure that isn't free.** No in-process
   cron, no paid APIs, no paid hosting tier. Everything must run on
   Vercel (frontend) + Render (backend) + Neon/Supabase (Postgres) + Groq
   (AI), all free tiers.
7. **Every service function must be unit-testable without a running
   server or live database connection** (mock Prisma client / mock Groq
   client in tests).

## Where to find what

| Need to know... | Read |
|---|---|
| What features exist and their priority (Must/Should/Could/Won't) | `features.md` |
| System architecture, request flow, module boundaries | `architecture.md` |
| Naming conventions, folder structure, code style, commit style | `conventions.md` |
| Full database schema, relationships, constraints | `database-schema.md` |
| What's built, what's in progress, what's not started | `progress.md` |

## How to work in this repo

- Before implementing a feature, check `progress.md` to see if it's already
  done or in progress elsewhere in the codebase.
- After completing a feature, **update `progress.md`** — move it from
  "Not Started"/"In Progress" to "Done", and note any deviation from the
  original plan and why.
- If you must deviate from `architecture.md` or `conventions.md` (e.g., a
  library doesn't support something), document the deviation at the bottom
  of the relevant file under a `## Deviations` section — don't silently
  diverge.
- Always write/update tests alongside the feature, in the same change, per
  `conventions.md` testing rules.
- Never add a new top-level dependency without checking it has a free tier
  / is free to use, per principle 6 above.

## Current phase

See `progress.md` for the authoritative current state. As of project start,
the team is sequencing work as: Foundation → Transactions → Budgets → Goals →
Dashboard → Subscriptions → Rule Engine → Forecasting → Reports → AI
Enhancements → Hardening/Testing → Deployment.

The **mid-semester evaluation checkpoint** requires one fully working
end-to-end feature (not all features) — confirm current mid-sem scope in
`progress.md` before assuming the full feature set must be done by a given
date.

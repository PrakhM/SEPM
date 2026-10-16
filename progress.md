# FinTrack — Progress Tracker

**Instructions for AI assistant:** update this file every time a feature
moves between states. Do not mark something "Done" unless it has passing
tests per `conventions.md`. Keep entries short — this is a status board, not
a changelog (Git history is the changelog).

## Mid-semester evaluation target

Chosen end-to-end demo flow (fill in once decided with the team):
`Login → add transaction → budget reflects update → view on dashboard`

Mid-sem scope = Increments 1–4 below, at minimum. Everything past that is
"remaining semester" work for the report.

## Increment status

| # | Increment | Status | Notes |
|---|---|---|---|
| 1 | Foundation (auth, skeleton, DB, deploy pipeline) | In Progress | Design tokens + AppShell layout route done; auth endpoints, DB and deploy pipeline still open |
| 2 | Transactions (CRUD, idempotency) | Not Started | |
| 3 | Budgets (utilization, concurrency-safe update) | Not Started | |
| 4 | Savings Goals | Not Started | |
| 5 | Dashboard | Not Started | |
| 6 | Subscriptions | Not Started | |
| 7 | Rule Engine | Not Started | |
| 8 | Forecasting | Not Started | |
| 9 | Anomaly Flagging | Not Started | |
| 10 | Reports | Not Started | |
| 11 | AI Enhancements (categorization, summary, anomaly text) | Not Started | |
| 12 | Hardening & Testing | Not Started | |
| 13 | Deployment & Demo Prep | Not Started | |

Status values: `Not Started`, `In Progress`, `Done`, `Blocked` (note why).

## Feature-level detail (update as work happens)

### Auth
- [ ] Register endpoint
- [ ] Login endpoint + JWT issuance
- [ ] Auth middleware
- [ ] Frontend login/register pages (placeholder `/login` route exists so the
      shell's logout has somewhere to land; `authStore.js` is still a
      placeholder identity with a demo sign-in)
- [ ] Tests: auth integration test

### Layout / shell (design tokens + AppShell)
- [x] Tailwind v4 token set, light + dark (`client/tailwind.config.js`,
      `client/src/index.css`)
- [x] `ThemeToggle` + `uiStore` theme persistence with no flash of wrong theme
- [x] `AppShell` layout route: collapsible sidebar (icon-only rail) + mobile
      slide-over drawer, sticky top bar, 1280px capped content column
- [x] Nav config driving sidebar links, active state and page titles together
- [x] Per-page primary action in the top bar via `usePageHeader()`
- [x] Placeholder routes for all seven feature pages (Dashboard, Transactions,
      Budgets, Goals, Subscriptions, Rules, Reports)
- [ ] Replace `DesignSystemPage.jsx` once real pages cover the tokens
- [ ] No component tests yet — shell has only lint + build coverage

### Transactions
- [ ] Prisma model
- [ ] `transactionService.createTransaction` with idempotency check
- [ ] CRUD routes/controllers
- [ ] Frontend transaction list + form
- [ ] Tests: idempotency test, CRUD integration test

### Budgets
- [ ] Prisma model
- [ ] `budgetService` atomic increment logic
- [ ] Threshold alert logic
- [ ] Frontend budget view
- [ ] Tests: concurrency test (parallel requests → correct total), unit test
      for utilization calc

### Savings Goals
- [ ] Prisma model
- [ ] `goalService.calculateRequiredContribution`
- [ ] Frontend goal view
- [ ] Tests: unit test for contribution math

### Dashboard
- [ ] Aggregation query/service
- [ ] Recharts integration
- [ ] Frontend page

### Subscriptions
- [ ] Prisma model
- [ ] CRUD + rollup calculation
- [ ] Frontend view

### Rule Engine
- [ ] Prisma model
- [ ] `ruleEngineService.evaluate(transaction, rules)`
- [ ] Priority ordering + first-match logic
- [ ] Frontend rule management UI
- [ ] Tests: priority/tie-break unit tests

### Forecasting
- [ ] `forecastService` (moving average / regression)
- [ ] Frontend chart
- [ ] Tests: known-series unit test

### Anomaly Flagging
- [ ] `anomalyService` threshold check
- [ ] Integration with AI explanation text
- [ ] Tests: unit test for threshold logic

### Reports
- [ ] `reportService` (each report type)
- [ ] Frontend report pages

### AI Enhancements
- [ ] `aiService` Groq client setup
- [ ] Categorization suggestion endpoint + fallback
- [ ] Summary narrative endpoint + fallback
- [ ] Anomaly explanation endpoint + fallback
- [ ] Tests: mocked-Groq contract tests for each (success + malformed-output
      cases)

### Hardening & Testing
- [ ] Full test suite passing
- [ ] Rate limiting on write + AI endpoints
- [ ] Security review (no secrets committed, helmet configured, etc.)

### Deployment
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Database provisioned on Neon/Supabase
- [ ] Seed script for demo data
- [ ] Demo video recorded

## Known deviations from the original plan

(List anything the team decided to change from `features.md` /
`architecture.md` / `database-schema.md`, with date and reason — e.g. a
feature descoped, a different library used, a schema field renamed.)

- None yet.

- 2026-10-16 — Mobile navigation is a **slide-over drawer** behind a hamburger,
  not a bottom tab bar. The prompt allowed either; the drawer was chosen
  because seven nav items plus a user section do not fit in a 375px bottom bar.
- 2026-10-16 — The mobile drawer's scrim uses the static `neutral-900/60`
  palette step rather than a semantic token. The `bg-inverse` token inverts
  per mode (near-white in dark mode), so a scrim built from it would flash the
  screen white when opening the drawer at night.
- 2026-10-16 — A placeholder `/login` route (`LoginPage.jsx`) was added ahead
  of Increment 1, plus a `signInAsDemoUser` action in `authStore.js`. Reason:
  `AppShell` redirects unauthenticated visitors to `/login`, and with no route
  there the wildcard route bounced them back into the shell in a redirect loop.
  Both are marked PLACEHOLDER in-file and should be deleted with Increment 1.
- 2026-10-16 — `index.css` duplicates the palette hexes as literal values rather
  than referencing `--color-*`, because Tailwind v4 inlines config colours
  instead of emitting those custom properties. `tailwind.config.js` stays the
  source of truth and the two must be kept in sync.
- 2026-10-16 — Colour keys in `tailwind.config.js` must be **quoted kebab-case**
  (`'on-subtle':`) if more than one word. Tailwind v4's `@config` compat layer
  does not kebab-case camelCase keys: a key `onSubtle` only ever matches
  `text-primary-onSubtle`, and `text-primary-on-subtle` silently generates no
  CSS at all. Verify a new token actually emits by grepping the built CSS —
  a missing utility fails silently and the element just inherits a colour.
- 2026-10-16 — Added `--c-primary-on-subtle` for text/icons drawn on a
  `primary-subtle` fill. Dark mode reused the base `--c-primary` here, which
  is only 3.81:1 on the dark subtle fill — below WCAG AA 4.5:1 for the 14px nav
  labels. It now steps up to primary-300 (6.41:1); light mode is unchanged at
  5.25:1. The active nav item is also `font-semibold` (inactive stays
  `font-medium`) so the active page stays identifiable without colour.

## Open questions / decisions still needed

- Final team task allocation (names against modules)
- Exact mid-sem demo script/order for the video

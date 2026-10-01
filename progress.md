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
| 1 | Foundation (auth, skeleton, DB, deploy pipeline) | Not Started | |
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
- [ ] Frontend login/register pages
- [ ] Tests: auth integration test

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

## Open questions / decisions still needed

- Final team task allocation (names against modules)
- Exact mid-sem demo script/order for the video

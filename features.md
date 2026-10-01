# FinTrack — Features & Backlog

Priority key: **Must** (mid-sem MVP candidate) / **Should** / **Could** /
**Won't** (explicitly out of scope).

## 1. Authentication & Profile — Must
- Register, login, JWT-protected routes
- View/edit basic profile (name, email)
- FR-AUTH-01: system shall authenticate a user with valid credentials and
  reject invalid credentials with a clear error message.

## 2. Transactions — Must
- Create/edit/delete income, expense, transfer entries
- Categorize (manual, rule-based, or AI-suggested fallback)
- Filter/search by date range, category, payment method
- **Idempotent creation** via `Idempotency-Key` header
- FR-TRANS-01: record a transaction with payer/amount/description/category
- FR-TRANS-02: categorize a transaction
- FR-TRANS-03: duplicate submission (same idempotency key) returns original
  result, never creates a second record

## 3. Budgets — Must
- Create monthly budget per category
- Track utilization (spent / budget %)
- Threshold alerts at 80% and 100%
- **Concurrency-safe spent-increment** (atomic update)
- FR-BUD-01: define a monthly budget for a category
- FR-BUD-02: calculate utilization from recorded transactions
- NFR-REL-02: budget updates safe under concurrent writes (no lost updates)

## 4. Savings Goals — Must
- Create goal (target amount, deadline)
- Auto-calculate required monthly contribution:
  `remaining / months_until_deadline`
- FR-GOAL-01: create a savings goal with target and deadline

## 5. Dashboard — Should
- Aggregated summary: total balance, income, expenses, savings
- Category breakdown chart

## 6. Subscriptions — Should
- Track recurring subscriptions (name, amount, frequency)
- Monthly/annual cost rollup
- Renewal reminders
- FR-SUB-01: track subscriptions and compute cost rollups

## 7. Rule Engine — Should (stretch to Must if time allows)
- User-defined rules: condition (e.g., description contains X, or amount >
  Y) → action (assign category)
- Rules have a priority; evaluated in priority order, first match wins
- FR-RULE-01: evaluate rules in priority order; first match applies

## 8. Spend Forecasting — Should
- Predict next period's spend per category using moving average or simple
  linear regression over historical transactions
- FR-FCST-01: forecast next-period spend per category from history

## 9. Anomaly Flagging — Could
- Deterministic check: current period spend vs. historical average
  (e.g., past 3 months) per category; flag if it exceeds a threshold
  (e.g., 2x–3x average)
- AI writes the human-readable explanation only; the flag/threshold decision
  itself is deterministic

## 10. Reports — Could
- Monthly income/expense report
- Category-wise spending report
- Income vs. expenditure
- Savings rate: `(income - expenses) / income × 100`
- Budget utilization report
- Yearly comparison

## 11. AI Enhancements — Could
All via Groq, all with mandatory deterministic fallback (see
`conventions.md` AI rules):
- **Smart categorization suggestion** — used when no rule matches a new
  transaction
- **AI monthly summary narrative** — phrasing over already-calculated report
  numbers (never calculates anything itself)
- **Anomaly explanation text** — phrasing over the deterministic anomaly
  flag from Feature 9

## Explicitly Won't (out of scope, with reason)

- **Recurring-transaction auto-generation** — would require an in-process
  scheduler (node-cron) that doesn't survive on free-tier serverless/sleeping
  hosts (Vercel/Render free tier). Deliberately dropped rather than solved
  with an external cron pinger, to keep scope bounded.
- **Natural-language search/filtering** — considered, deferred indefinitely;
  not required for the core product story.
- Any feature requiring a paid API tier, paid hosting, or paid third-party
  service.

## Mapping to the mid-semester evaluation rubric

(For the report sections — see the course's mid-sem evaluation PDF for the
full rubric this maps to.)

| Rubric item | Covered by |
|---|---|
| Problem statement & objectives | See project brief / report §2 |
| Stakeholders & scope | Students/individual users (primary); this feature list is the scope |
| Functional & non-functional requirements | FR/NFR IDs scattered through this file; consolidate into SRS for report |
| Prioritised backlog | The Must/Should/Could/Won't structure above |
| Use-case diagram / user stories | Derive one use case per Must + Should feature above |
| System architecture & DB design | `architecture.md`, `database-schema.md` |
| UI prototype | Wireframe each page listed in `conventions.md` folder structure under `client/src/pages/` |
| Working end-to-end feature | See `progress.md` for the chosen mid-sem demo flow |
| Testing | See `conventions.md` required test cases |
| Project plan & contribution | See `progress.md` and team's own task-allocation doc |

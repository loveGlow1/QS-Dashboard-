# QuickStark Investment

The QuickStark investment platform: a public landing page, account creation,
sign-in and a customer dashboard, backed by a real Postgres database with real
authentication.

> **Nothing in this codebase is fabricated.** Every figure on screen is read
> from the database. A new account is genuinely empty and says so; the landing
> page shows real platform totals, which are zero until the first investment is
> placed.

---

## Status

| Area | Today | Next |
| --- | --- | --- |
| Landing page | ✅ Live platform aggregates | — |
| Account creation | ✅ Supabase Auth, real accounts | Email verification flow polish |
| Sign in / out / password reset | ✅ Built | — |
| Customer dashboard | ✅ Reads the customer's own records | — |
| Investments / Transactions / Withdraw / Profile / Security / Help | ✅ Built | — |
| Admin portal | Not built | Separate interface, separate authorization |
| Payments | Provider-agnostic boundary, no provider registered | Paystack / Stripe adapters + webhooks |
| Funds movement | **Not enabled** — see *Money* below | Requires a payment provider and the compliance that goes with it |

A **vanilla HTML / CSS / JavaScript** front end (classic `<script>` tags, no
build step) on **Supabase** (Postgres + GoTrue).

---

## Running it

Any static file server works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

It talks to the Supabase project configured in `assets/js/core/config.js`.
Override per deployment with attributes on `<html>`:

```html
<html lang="en"
      data-qs-supabase-url="https://your-project.supabase.co"
      data-qs-supabase-key="sb_publishable_...">
```

The publishable key is **designed to ship in the browser**. It grants nothing
on its own: every table is behind row level security, so a caller reads only
their own rows, and no client role can write a financial row at all.

`assets/vendor/supabase.js` is the Supabase JS client (v2, MIT), vendored
deliberately. A financial app should not fetch its authentication code from a
third-party CDN at page load.

---

## Money

This is the part to read before shipping.

**The browser never computes a balance.** `portfolio_totals` is a database view
that derives every figure — invested, growth, available cash, total value —
from the ledger and the customer's investments. The front end renders what it
is given and nothing else.

**No client role can write a financial row.** `investments`, `transactions` and
`portfolio_snapshots` have RLS enabled with a `select` policy and *no* insert,
update or delete policy. A signed-in customer cannot credit themselves, inflate
an investment, promote their own account tier, or touch another customer's
records. Verified in the live database; see *Verifying the rules* below.

**The ledger is signed and constrained.** Deposits and returns are positive,
withdrawals and money moved into an investment are negative, enforced by a
check constraint. Balances are derived from these entries, so a balance can
never disagree with the entries behind it.

**No funds actually move.** `QS.payments` has no provider registered, so
deposits and withdrawals resolve to `provider_unavailable` and the UI reports
exactly that. Money enters an account only through the service role — a
back-office or job you write. Wiring a real payment provider is a licensing and
compliance matter as much as a technical one.

---

## Data model

```
profiles              id → auth.users, first_name, full_name, tier, verified
plans                 public catalogue: minimum, term, status, eligibility, features
investments           user_id, plan_id, principal, current_value, dates, status
transactions          signed ledger: type, amount, status, occurred_at
portfolio_snapshots   (user_id, as_of) → end-of-day portfolio value
notifications         user_id, title, body, unread

portfolio_totals      VIEW, security_invoker — derived balances, per caller
platform_metrics      TABLE — public aggregates (members, total invested, …)
platform_monthly      TABLE — public cumulative invested by month
```

### Who can read and write what

| | anon | signed-in customer | service role |
| --- | --- | --- | --- |
| `plans` | read | read | full |
| `platform_metrics`, `platform_monthly` | read | read | full |
| `profiles` | — | read own; rename self only | full |
| `investments`, `transactions`, `portfolio_snapshots` | — | **read own only** | full |
| `notifications` | — | read own, mark read | full |
| `portfolio_totals` | — | own row only | full |

`tier` and `verified` are excluded from the customer's `UPDATE` grant at the
column level, so an account cannot promote itself into a plan's eligibility.

The public aggregates are plain tables refreshed by triggers, not views over
the customer tables. An anonymous read therefore never touches `profiles`,
`investments` or the ledger — not even indirectly through a view.

### Customer actions

These are the only ways an account's money moves from the browser. Each is a
database function that revalidates every precondition before writing, so the
client cannot skip a check by calling the API directly.

| Function | Refuses when |
| --- | --- |
| `place_investment(plan_id, amount)` | not verified · plan unknown or not open · below the plan minimum · more than the available balance |
| `request_withdrawal(amount, destination)` | not verified · amount not positive · no destination · more than the available balance |
| `cancel_withdrawal(id)` | the request is not the caller's own, or is no longer pending |

A withdrawal is recorded as `pending` and counted against the balance
immediately, so the same money cannot be requested twice. It settles only when
a payout actually completes, which needs a payment provider.

A new investment starts at its principal: no return is credited at purchase
time. Growth is recorded by the back office as it is actually earned.

### Server-side jobs

- `record_daily_snapshots(date)` — writes each customer's end-of-day portfolio
  value. This is what gives the dashboard chart its history. Run it daily as
  the service role (pg_cron or an edge function). `EXECUTE` is revoked from
  `anon` and `authenticated`.
- `refresh_platform_metrics()` — recomputes the public aggregates. Called
  automatically by triggers on `profiles`, `investments` and `plans`.

---

## Verifying the rules

The access rules are tested by impersonating roles in the database rather than
by trusting the client. Run this against the project and every write must be
refused:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<a real user id>","role":"authenticated"}';

insert into public.transactions (user_id, type, label, amount, status)
values ('<same id>', 'deposit', 'self-credit', 999999, 'completed');   -- must fail

update public.investments set current_value = 9999999;                -- must affect 0 rows
update public.profiles set tier = 'Premium' where id = '<same id>';   -- must fail
update public.profiles set full_name = 'New Name' where id = '<same id>'; -- must succeed
```

Supabase's own linter should also report no security findings:
`get_advisors(type: "security")`.

---

## Routes

| Route | File |
| --- | --- |
| `/` | `index.html` |
| `/signup` | `pages/signup.html` |
| `/login` | `pages/login.html` |
| `/dashboard` | `pages/dashboard.html` |
| `/investments` | `pages/investments.html` |
| `/transactions` | `pages/transactions.html` |
| `/withdraw` | `pages/withdraw.html` |
| `/profile` | `pages/profile.html` |
| `/security` | `pages/security.html` |
| `/help` | `pages/help.html` |

The sidebar, topbar and mobile bottom bar are rendered by `app-shell.js` from
one navigation definition, so a route cannot drift between them.

`vercel.json` maps the short paths (`/login`, `/withdraw`, …) onto these files
and sets the security headers.

Every link resolves through `QS.config.routes` rather than being hard-coded, so
moving to clean URLs — or to a framework router — is a single-file change.

---

## Deploying

The site is static, so Vercel needs no build step: **Framework preset: Other,
Build command: none, Output directory: `.`**

**Set the Supabase URLs before the first real sign-up.** Confirmation and
password-reset emails link back to whatever is configured here, so a wrong
value silently breaks account creation. In the Supabase dashboard under
*Authentication → URL Configuration*:

| Setting | Value |
| --- | --- |
| Site URL | `https://<your-domain>` |
| Redirect URLs | `https://<your-domain>/**` |

Add the Vercel preview domain to Redirect URLs too if you want sign-up to work
on preview deployments.

### About environment variables

This is a static site with no build step, so nothing substitutes an env var at
deploy time. The Supabase URL and publishable key live in
`assets/js/core/config.js`, which is correct: the publishable key is designed
to be public and grants nothing on its own — every table is behind row level
security and no client role can write a financial row.

To point a deployment at a different project without editing that file,
override it per page with attributes on `<html>`:

```html
<html lang="en"
      data-qs-supabase-url="https://your-project.supabase.co"
      data-qs-supabase-key="sb_publishable_...">
```

**Never put the service role key in this repository or in a Vercel environment
variable read by the browser.** It bypasses row level security entirely. It
belongs only in a server-side back office or a scheduled job.

---

## Project structure

```
index.html                      Landing page
pages/
  signup.html                   Account creation
  login.html                    Sign in
  dashboard.html                Customer dashboard

assets/vendor/
  supabase.js                   Supabase JS client v2 (MIT), vendored

assets/css/
  base.css                      Design tokens, reset, shared primitives
  chart.css                     Portfolio chart
  landing.css                   Landing page
  auth.css                      Sign in / sign up
  dashboard.css                 Dashboard

assets/js/core/
  config.js                     Project config, routes, and the shared QS.db client
  utils.js                      Money/date formatting, DOM helpers
  icons.js                      One icon family, 24px grid, 1.6 stroke
  api.js                        Data access layer — the only way views read data
  auth.js                       Session handling over Supabase Auth
  payments.js                   Payment provider boundary (no provider registered)
  bootstrap.js                  Resolves declarative attributes on each page

assets/js/components/
  brand.js                      QuickStark mark + wordmark
  chart.js                      SVG line chart (monotone cubic, hover readout)
  site-nav.js                   Public header, mobile drawer, active section
  app-shell.js                  Sidebar drawer, popovers, sign out
  accordion.js                  FAQ
  toast.js                      Transient notices
  reveal.js                     Scroll entrance

assets/js/pages/
  _page.js                      Shared boot: session gate, shell, identity
  landing.js  signup.js  login.js
  dashboard.js  investments.js  transactions.js  withdraw.js
  profile.js  security.js  help.js
```

### Conventions

- **Views never touch data directly.** Everything reads through `QS.api`, so
  loading, empty and error states are real code paths rather than decoration.
- **The browser never computes money.** Balances arrive derived from the
  server. The database is the only source of truth for financial records.
- **Nothing is fabricated.** No screen fills a gap with an invented figure. An
  empty portfolio shows zeros and `—` for its composition, because a share of
  nothing is undefined, not 100%.
- **Claims are backed by data.** The account badge reads "Verified" only when
  the server says the account is, and cannot be set by the account holder.
- **Markup stays declarative.** `data-icon`, `data-route`, `data-qs-logo` and
  `data-placeholder` are resolved by `bootstrap.js`.

---

## Payments

`QS.payments` is a provider-agnostic boundary. No screen talks to a payment
provider directly:

```js
QS.payments.use(PaystackAdapter);   // or Stripe, or anything else
```

An adapter implements `initDeposit`, `initWithdrawal` and `verify`. Until one
is registered, every call resolves to a `provider_unavailable` result that the
UI reports as unavailable — never as a completed transaction.

## Admin portal

Not built in this phase, and deliberately not entangled with the customer app.
The intended split is one secure back-end behind two interfaces with separate
authorization:

```
app.quickstark.tech     → customer portal (this build)
admin.quickstark.tech   → admin portal (later)
```

---

## Design notes

- **Palette.** Deep navy surfaces, blue-gray elevation, one restrained cool
  blue accent (`#4d7cf3`). Green and red appear only as directional indicators
  on financial values, never as decoration. The bright green of the QuickStark
  AI builder is deliberately absent — this product has its own identity.
- **Type.** Inter, loaded from Google Fonts with a system fallback. Tight
  tracking on headings, tabular figures on every number.
- **Motion.** One entrance per element, one chart draw-in, nothing repeating.
  `prefers-reduced-motion` disables all of it.
- **Logo.** An original geometric monogram rendered as inline SVG. If an
  official logo file is supplied, swap the body of `markup()` in
  `components/brand.js` and every call site picks it up.
- **Responsive.** Three layouts, not one design scaled down. The dashboard
  sidebar becomes a drawer plus a bottom navigation bar on phones, quick
  actions become a single scrolling row, and transactions stay a list rather
  than a squeezed table.

---

## Compliance guardrails

The copy states no promised or guaranteed returns, invents no company facts,
and makes no regulatory claims. Plan cards describe minimums, durations,
eligibility and availability only. Please keep it that way — any figure that
could read as a promised return needs sign-off before it ships.

# QuickStark Investment — MVP (v1)

The first visual MVP of the QuickStark investment platform: a public landing
page, a login screen and a customer dashboard.

> **This is a preview build.** It runs entirely on sample data with a mocked
> sign-in. No real funds, accounts, investments, transactions or payments
> exist anywhere in this codebase.

---

## Status of this version

| Area | v1 (this build) | Next |
| --- | --- | --- |
| Landing page | ✅ Built | — |
| Login | ✅ Built (mocked, client-side) | Server-side authentication |
| Customer dashboard | ✅ Built (sample data) | Live data from the API |
| Investments / Transactions / Withdraw / Profile pages | Navigation placeholders | To be built |
| Admin portal | Not built | Separate interface, separate authorization |
| Payments | Provider-agnostic boundary, no provider registered | Paystack / Stripe adapters + webhooks |

v1 is a **vanilla HTML / CSS / JavaScript** build, used to settle the visual
language and the screen structure before the stack decision is applied.

---

## Running it

Any static file server works. The pages use classic `<script>` tags rather
than ES modules, so they also open directly from disk if you need that.

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

### Signing in

Sign-in is **simulated**. The preview credentials are shown on the login page
itself and can be filled with one click:

```
demo@quickstark.tech
quickstark
```

This exists so the login → dashboard → sign out journey can be reviewed. It is
not authentication and provides no security. It is replaced wholesale when the
real back-end lands (see *Replacing the mocks* below).

---

## Routes

| Route | File |
| --- | --- |
| `/` | `index.html` |
| `/login` | `pages/login.html` |
| `/dashboard` | `pages/dashboard.html` |

Every link in the app is resolved through `QS.config.routes`
(`assets/js/core/config.js`) rather than hard-coded, so moving to clean URLs —
or to a framework router — is a single-file change.

Planned routes (`/investments`, `/transactions`, `/withdraw`, `/profile`,
`/admin`) are already named in that same map. Their nav entries currently
respond with a "not in this preview" notice instead of dead links.

---

## Project structure

```
index.html                      Landing page
pages/
  login.html                    Login
  dashboard.html                Customer dashboard

assets/css/
  base.css                      Design tokens, reset, shared primitives
  chart.css                     Portfolio chart (shared by landing + dashboard)
  landing.css                   Landing page
  auth.css                      Login
  dashboard.css                 Dashboard

assets/js/core/
  config.js                     Environment, routes, currency, demo flag
  utils.js                      Money/date formatting, DOM helpers
  icons.js                      One icon family, 24px grid, 1.6 stroke
  demo-data.js                  ⚠ All sample data. Deleted when the API lands.
  api.js                        Data access layer — the only way views read data
  auth.js                       Session handling (mocked)
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
  landing.js  login.js  dashboard.js
```

### Conventions

- **Views never touch data directly.** Everything reads through `QS.api`, which
  returns promises and simulates latency, so loading, empty and error states
  are real code paths rather than decoration.
- **The browser never computes money.** Balances, growth and ledger entries are
  rendered exactly as the service layer supplies them. This contract must hold
  once the API is real: the server is the only source of truth for financial
  records.
- **Markup stays declarative.** `data-icon`, `data-route`, `data-qs-logo` and
  `data-placeholder` are resolved by `bootstrap.js`, keeping inline SVG and
  hard-coded URLs out of the HTML.

---

## Replacing the mocks

Three files are the entire seam between this preview and a real back-end:

| File | What changes |
| --- | --- |
| `assets/js/core/api.js` | Rewrite each method body as `fetch(config.apiBaseUrl + …)`. Signatures and payload shapes stay. No view code changes. |
| `assets/js/core/auth.js` | Move `signIn` to a server call that sets an httpOnly session cookie; have `currentUser` read a `/me` endpoint. |
| `assets/js/core/demo-data.js` | Delete. |

Then set `demoMode: false` in `config.js`. The preview banners, the "Demo"
tags and the sample-data footnotes are all driven by that flag.

The payload shapes in `demo-data.js` deliberately mirror the planned API
resources — `users`, `investment_plans`, `investments`, `ledger_entries`,
`portfolio_snapshots`, `notifications` — so the dashboard does not need
reshaping when the data becomes real.

### Payments

`QS.payments` is a provider-agnostic boundary. No screen talks to a payment
provider directly:

```js
QS.payments.use(PaystackAdapter);   // or Stripe, or anything else
```

An adapter implements `initDeposit`, `initWithdrawal` and `verify`. Until one
is registered, every call resolves to a `demo_unavailable` result that the UI
surfaces as a placeholder — never as a completed transaction.

### Admin portal

Not built in this phase, and deliberately not entangled with the customer app.
The intended split is a shared secure back-end behind two separate interfaces
with separate authorization:

```
app.quickstark.tech     → customer portal (this build)
admin.quickstark.tech   → admin portal (later)
```

---

## Sample data

All sample figures live in `assets/js/core/demo-data.js` and are pinned to a
fixed snapshot date (**19 Nov 2026**) so the portfolio, its investment term and
its activity history stay internally consistent. The demo ledger balances:

```
deposits      1,260,000
investments  -1,200,000
withdrawal      -60,000
              ─────────
cash                  0   → "Available balance"

returns          84,500   → portfolio growth (35,000 + 28,500 + 21,000)
investment value            1,200,000 principal + 84,500 growth = 1,284,500
```

Sample figures are marked wherever they appear: a dismissible banner on the
dashboard, "Demo" tags on portfolio values, and footnotes under the charts.

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
- **Logo.** An original geometric monogram rendered as inline SVG — no
  background plate, no container, correct proportions at every size. If an
  official logo file is supplied, swap the body of `markup()` in
  `components/brand.js` and every call site picks it up.
- **Responsive.** Three layouts, not one design scaled down. The dashboard
  sidebar becomes a drawer plus a bottom navigation bar on phones, quick
  actions become a single scrolling row, and transactions stay a list rather
  than a squeezed table.

---

## Compliance guardrails

The copy in this build states no promised or guaranteed returns, invents no
company facts, and makes no regulatory claims. Plan cards describe minimums,
durations, eligibility and availability only. Please keep it that way — any
figure that could read as a promised return needs sign-off before it ships.

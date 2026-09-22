# QuickStark Investment

The QuickStark investment platform front end: a public landing page, a login
screen and a customer dashboard.

> **This front end holds no data of its own.** Every figure it shows comes from
> the API at `QS.config.apiBaseUrl`. Until that API is serving, the screens
> render their loading and error states — they do not invent numbers.

---

## Status

| Area | Today | Next |
| --- | --- | --- |
| Landing page | ✅ Built | — |
| Login | ✅ Built, against `POST /auth/login` | — |
| Customer dashboard | ✅ Built, against the API | — |
| Investments / Transactions / Withdraw / Profile pages | Navigation placeholders | To be built |
| Admin portal | Not built | Separate interface, separate authorization |
| Payments | Provider-agnostic boundary, no provider registered | Paystack / Stripe adapters + webhooks |

A **vanilla HTML / CSS / JavaScript** build, used to settle the visual language
and the screen structure before the stack decision is applied.

---

## Running it

Any static file server works. The pages use classic `<script>` tags rather
than ES modules, so they also open directly from disk if you need that.

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

The app expects the API to be reachable at `/api/v1` on the same origin. Point
it elsewhere either by editing `apiBaseUrl` in `assets/js/core/config.js`, or
per-deployment with an attribute on `<html>`:

```html
<html lang="en" data-qs-api="https://api.quickstark.tech/v1">
```

Served without a back-end, the landing page shows "Plans could not be loaded"
and the dashboard sends you to the login screen. That is the intended
behaviour, not a broken build.

---

## API contract

`QS.api` (`assets/js/core/api.js`) is the only place the app talks to the
server. Every request sends `Accept: application/json` and, when a session
exists, `Authorization: Bearer <token>`. A non-2xx response is expected to
carry `{ "code": "...", "message": "..." }`, which is what the UI displays.

| Method | Request | Response |
| --- | --- | --- |
| `POST /auth/login` | `{ email, password }` | `{ token, expiresAt, user }` |
| `POST /auth/logout` | — | any 2xx |
| `GET /me` | — | the signed-in user |
| `GET /portfolio` | — | totals, `ranges`, and `series` keyed by range |
| `GET /portfolio/series?range=6M` | — | `{ range, series: { points, change } }` |
| `GET /investments` | `?status=`, `?limit=` | array of investments |
| `GET /transactions` | `?type=`, `?limit=` | array of ledger entries, newest first |
| `GET /notifications` | — | array of notifications |
| `GET /plans` | — | array of investment plans (public, no session) |

Notes on behaviour the front end relies on:

- **Sorting, filtering and limiting happen server-side.** `getTransactions`
  passes `type` and `limit` through and renders what comes back in order.
- **`401` ends the session.** Any authenticated request that returns 401 clears
  the stored session, so a revoked or expired token cannot keep a stale screen
  alive.
- **Requests time out.** After `config.requestTimeout` (15s) a request is
  aborted and surfaced as an error rather than an indefinite spinner.
- **Partial payloads degrade.** A portfolio with no `series` renders an empty
  chart state; an empty list renders an empty state, not a blank panel.

---

## Authentication

`assets/js/core/auth.js` posts credentials to `POST /auth/login` and stores
whatever session the server issues. Nothing about identity is decided in the
browser — the server alone validates credentials, and the client discards a
token as soon as it expires or is rejected.

The password is never stored. The token is held in `localStorage` under
`qs.session` for the lifetime the server stated. If the API moves to an
httpOnly session cookie, `signIn` keeps its signature and simply stops storing
a token; requests already send `credentials: "same-origin"`.

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
`/admin`) are already named in that same map. Their nav entries respond with a
"not available yet" notice instead of dead links.

---

## Project structure

```
index.html                      Landing page
pages/
  login.html                    Login
  dashboard.html                Customer dashboard

assets/css/
  base.css                      Design tokens, reset, shared primitives
  chart.css                     Portfolio chart
  landing.css                   Landing page
  auth.css                      Login
  dashboard.css                 Dashboard

assets/js/core/
  config.js                     API base URL, routes, currency, timeouts
  utils.js                      Money/date formatting, DOM helpers
  icons.js                      One icon family, 24px grid, 1.6 stroke
  api.js                        Data access layer — the only way views read data
  auth.js                       Session handling
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
  returns promises, so loading, empty and error states are real code paths
  rather than decoration.
- **The browser never computes money.** Balances, growth and ledger entries are
  rendered exactly as the API supplies them. The server is the only source of
  truth for financial records.
- **Nothing is fabricated.** No screen fills a gap with an invented figure. A
  region with no data says so.
- **Markup stays declarative.** `data-icon`, `data-route`, `data-qs-logo` and
  `data-placeholder` are resolved by `bootstrap.js`, keeping inline SVG and
  hard-coded URLs out of the HTML.

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
The intended split is a shared secure back-end behind two separate interfaces
with separate authorization:

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

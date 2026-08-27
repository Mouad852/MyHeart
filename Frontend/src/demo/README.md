# Demo mode

The hosted demo is this front end, built with `VITE_DEMO_MODE=true`, answering
its own requests.

It exists because the real MedCore is sixteen containers and nobody evaluating a
portfolio is going to start sixteen containers. A static build costs nothing to
host permanently; a static build that can answer its own requests is the whole
product, clickable, at a URL.

## How it works

An **axios adapter**, installed where the network would be. Nothing above it
changes — the service modules, React Query, the interceptors and every screen
run unmodified and unaware. There is no second implementation of anything.

```
src/demo/
├── config.js       IS_DEMO, and the seven accounts
├── dataset.js      the clinic, mirroring V900__demo_seed.sql
├── store.js        mutable state, the state machines, the outage switches
├── adapter.js      the gateway's rules and six services' routes
├── useDemoAuth.js  the auth context, without an identity provider
└── DemoBar.jsx     role switcher and outage switches
```

## What is reproduced faithfully

- **The dataset.** The same fourteen patients, six doctors, fifty-four
  appointments, forty-nine invoices, twelve prescriptions and sixteen laboratory
  requests as the SQL seed, with the same ids and the same dates relative to
  now. Somebody who sees the demo and then runs the real stack finds the same
  clinic, which is the point.
- **The gateway's authorization**, transcribed from `SecurityConfig` method by
  method. A lab technician cannot read the patient register; a doctor cannot
  open the ledger; both get 403, as they would.
- **Ownership**, decided the way `CallerIdentity` decides it. A patient reads
  the record matching their claim and no other, and collections are narrowed to
  them rather than filtered afterwards.
- **The state machines.** `AppointmentStatus.ALLOWED` and
  `PaymentStatus.ALLOWED`, copied. Every row's actions come from
  `allowedTransitions`, so the demo never offers a button the real system would
  refuse.
- **The response shapes**, checked against the running stack rather than
  assumed — `/appointments/my-day` returns a page envelope while `/appointments`
  returns a bare array, and getting that wrong renders an empty day rather than
  an error.
- **Writes.** Confirming a slot, paying an invoice, registering a patient and
  booking an appointment all work and persist for the life of the tab. A demo
  whose buttons do nothing teaches a visitor that the buttons do nothing.
  Booking still refuses an overlap on half-open intervals, and a patient's own
  booking still begins `REQUESTED` rather than `CONFIRMED`.

## What is not

- **There is no security boundary here, and none is claimed.** There is no
  server to defend and every record is fictional. The rules above are
  reproduced so the screens behave honestly, not enforced.
- **The printed prescription is text, not PDF.** The real document is rendered
  server-side by OpenPDF; shipping a PDF library for one button is not worth it,
  so the demo hands back the same document as text and says what it is.
- **Uploaded report files live in memory** for the tab that uploaded them.
- **Reload is the reset.** Which is also how the hosted demo stays tidy with
  nobody administering it.

## The outage switches

The product treats partial failure as a designed state: one service down names
itself in place with a retry, the rest of the screen keeps working, and a failed
source's count reads as unknown rather than as zero. Against a running backend
none of that can be shown without breaking something on purpose.

Take **Billing** down on a patient record and the history says "Billing
temporarily unavailable · This patient's invoices are missing from the history
below. Everything else is current.", the rail's billing count reads `—`, and the
sidebar's health indicator turns to "Some services degraded". Everything else on
the screen stays usable.

## Running it locally

```bash
cd Frontend
VITE_DEMO_MODE=true npm run dev      # or npm run build && npm run preview
```

## Deploying it

Cloudflare Pages, free tier, no card:

| Setting | Value |
|---|---|
| Root directory | `Frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_DEMO_MODE` = `true` |

`public/_redirects` carries `/* /index.html 200`, without which every route
except `/` is a 404 on refresh. Netlify and Vercel work the same way with the
same settings.

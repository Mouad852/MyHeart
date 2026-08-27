# MedCore — a clinic management system

A full-stack clinic system built as eight Spring Boot microservices behind a
Spring Cloud Gateway, with a React front end. It covers the work an outpatient
clinic actually does: registering patients, booking and running a clinic day,
invoicing from a priced catalogue, issuing prescriptions and filing laboratory
results.

Authentication is Keycloak with OpenID Connect. Every service validates its own
tokens, and record ownership is decided from claims in the token rather than
from anything the browser sends.

> Every record in this deployment is fictional. This is a portfolio project and
> is not certified for real medical data.

---

## Contents

- [Screens](#screens)
- [Design system](#design-system)
- [Front-end architecture](#front-end-architecture)
- [Back-end architecture](#back-end-architecture)
- [Authorization](#authorization)
- [Running it](#running-it)
- [API reference](#api-reference)
- [Repository layout](#repository-layout)
- [What is not here yet](#what-is-not-here-yet)

---

## Screens

Each role lands somewhere different after signing in, because a shared home
page is a dead end for most of them. Doctors land on **Today**, patients on
**My health**, everybody else on the **Overview**.

### Sign in — `/login`

There is no password field. Authentication uses the Authorization Code Flow
with PKCE, so credentials are typed on Keycloak's own screen and this
application never handles them. The page lists the four demo accounts with a
copy button on each, and states plainly that the data is fictional.

Two panels: a typographic statement on the left, the sign-in on the right.
There are no figures on it. An earlier version reported "6 clinical services ·
5 staff roles · 1 patient record", which described the architecture rather than
anything a user of the clinic needed to know.

### Overview — `/` · admin, doctor, receptionist, billing, nurse

The clinic's operations screen, ordered by the questions the person running a
clinic actually asks.

- **Is today under control** — booked, still to see, seen, did not attend, and
  who is next through the door.
- **What needs a decision** — the slots patients have asked for that nobody has
  answered, each with a Confirm button that appears only when the server says
  that transition is legal.
- **Where is the money** — outstanding against collected, with overdue given
  its own block because it is the only figure on the panel anyone has to act on.

The three are deliberately not equal. The queue is the widest block and the
only one carrying a count at display size, because it is the only region where
looking at the screen is supposed to end in a click; the money panel is a quiet
ledger below it. A grid of equally sized statistic cards would say that nothing
on the page is more urgent than anything else, which is never true of a clinic.

Figures sit on hairlines rather than in cards: at this density a card around
every number is chrome competing with the number inside it. Every panel is
gated on the roles the gateway will actually serve, so a doctor never fires the
billing request that would come back 403, and a nurse is not shown an empty
money panel.

The title carries the state of the day in one sentence — "Next at 14:00 —
Yasmine Belkacem. 3 still to be seen." — in place of a greeting, which is the
one line on an operations screen guaranteed to read the same every morning.

Five bounded requests back the whole screen. Today arrives as one day-windowed
page and the wide numbers come from page envelopes and a database-side billing
summary, rather than by downloading every row and counting in the browser.

### Today — `/today` · doctor, admin

The doctor's working day rather than a report. The composition rests on one
idea: the day is a line, and the doctor is somewhere along it.

Appointments hang off a single vertical rule in time order, and where the clock
has reached is drawn on that rule as a marked line — consultations above it
dimmed, the rest still to come. The next patient's row is opened out, with a
larger time, the reason for the visit and the actions, so the question a doctor
has between patients is answered without reading anything else.

Marking a patient seen or a no-show is offered only when the appointment's
`allowedTransitions` permits it, so the UI never has to guess the rules.

The day is scoped server-side from the `doctorId` claim in the token, so it
cannot be pointed at a colleague's calendar. A day navigator steps forward and
back with a "Back to today" shortcut.

### My health — `/my-health` · patient

The one screen not built for staff, and built to a different brief. A
receptionist wants density; a patient wants one answer, and nine times out of
ten the answer is when their next appointment is — so that is the largest thing
on the page, given as "In three days · Thursday 27 August · 09:00". Everything
else follows beneath it, and past appointments are folded away behind a
disclosure.

It also carries their **prescriptions and test results**, read-only, each with
the one action that matters: the printed prescription, and the report file. The
API has served both to a patient since the ownership checks went in — the
services narrow to the `patientId` claim and refuse anything that is not the
caller's own — but nothing in the interface admitted it. They are surfaced here
rather than by letting a patient onto the staff screens, which carry controls
they cannot use and a filter over a register they cannot read.

The clinic's lifecycle is renamed on the way out: `REQUESTED` is how the state
machine describes a slot nobody has answered, and "Awaiting confirmation" is
what that means to the person who asked for it. A laboratory request is
"Waiting for your sample", "At the laboratory" or "Result ready". Where the doctor's name cannot
be read — the gateway does not serve the doctor register to a patient — the
line is omitted rather than printing the circuit breaker's fallback string.

Everything is narrowed server-side to the `patientId` claim; nothing is
filtered in the browser.

### Patients — `/patients` · admin, doctor, receptionist, nurse

The register, built around search, scan, identify, open. The search field
queries the database rather than the loaded page, debounced, so the list stays
the same size whatever the clinic's does; rows are dense enough to scan a
screenful; the patient's name is the link, so the thing you read is the thing
you click. Columns fold into the name cell as the viewport narrows rather than
disappearing.

Editing and deleting live in the row menu. They previously sat in an actions
column as a pencil and a red bin on every row — a column of destructive buttons
on a screen nobody opens in order to delete anybody.

### Patient record — `/patients/:id` · admin, doctor, receptionist, nurse

One patient and everything that has happened to them, so a clinician stops
opening four tabs. Appointments, prescriptions, laboratory work and billing are
merged into a single thread in time order, grouped by month.

Identity sits in a **Storyboard rail** that never leaves the screen. That is
Epic's pattern, adopted for Epic's stated reason rather than for the look of it:
it removes scrolling and page jumps and keeps the clinician oriented while they
work inside a sub-view. This record runs to forty-five events, and the band the
rail replaces was gone by the second screenful — a clinician reading an invoice
from March had no way to check whose invoice it was without scrolling back.

The rail's counts are also the filter, so the tabs that used to duplicate them
are gone.

Colour is not how you tell an appointment from a lab test: each kind carries a
small glyph on the rule and its name in words, and the colour on a row belongs
to the *status* — the part that might need something from the reader.

The merge happens in the browser deliberately: a timeline endpoint would have
to call all four services anyway, and putting it inside one of them would make
that service depend on the other three for a screen only the front end uses.
Each source is fetched independently, so one service being down names itself —
"Billing temporarily unavailable" — in place, with a retry, while the rest of
the record stays usable. A failed source's count reads as unknown rather than
as zero, which would be a lie about the patient.

### Doctors — `/doctors` · admin, doctor, receptionist

The medical register: the same table as the patient register, deliberately,
because two lists of people in one product should not be two designs. What
differs is what the list is for — a doctor is looked up by what they do, so
specialty is a column and the list narrows to one specialty in a click.

Specialties are not colour-coded. Assigning each one an accent produced a
column of violet, amber, blue and rose saying nothing about urgency or state.

Creating, editing and removing a doctor is admin-only at the gateway.

### Appointments — `/appointments` · admin, doctor, receptionist

The diary, in two views. The **list** is grouped by day, sorted within the day,
and opens on what is ahead — a receptionist arriving here is almost never asking
about a consultation from four months ago.

The **day** draws one clinic day to scale, with each booked slot at its real
height and the clock marked across it. A list cannot answer "where is the gap",
because a list has no idea how long anything takes: five appointments look
identical whether they fill the morning or overlap each other. Both views exist
because neither can do the other's job. The lifecycle is a row of tabs carrying live counts, so
"Requested · 3" says there is work waiting before anything has been clicked.

Actions come from `allowedTransitions`, which the server returns on every
appointment: the move a row is actually waiting for is promoted inline, and the
rest sit behind one quiet row menu with the destructive item marked and
separated. Cancelling was previously a red button repeated down thirty rows,
which made the most destructive action in the product the easiest to hit and
taught people to stop seeing red. It now asks for confirmation by naming the
patient, the day and the time.

Slots are checked for conflicts server-side using half-open intervals, so a
booking that merely touches the end of another is allowed and one that overlaps
is refused.

Appointments move through `REQUESTED → CONFIRMED → COMPLETED`, with `CANCELLED`
and `NO_SHOW` as the other terminal states. Who books decides where it starts:
the desk books a slot directly and it begins confirmed, a patient can only ask
and theirs begins requested.

### Billing — `/billing` · admin, billing, receptionist

The clinic's ledger — every invoice, oldest debt first, with the totals across
the top and the patient filter demoted to one filter among several. It used to
show nothing at all until a patient had been chosen from a dropdown, which is
backwards: the question a billing clerk arrives with is *who owes us money*,
and no single patient answers it.

Money is set in the identifier face, aligned right, and never abbreviated.
Amber marks what is owed and rose marks what is late; a paid invoice is plain
grey, because a settled invoice needs nothing from anybody.

Invoices are priced from the clinic's service catalogue rather than
from a number typed into the code. An invoice runs `ISSUED → PAID → REFUNDED`
or `ISSUED → VOID`. There is deliberately no overdue state: being overdue is
what an unpaid invoice becomes once its due date passes, so it is derived on
read rather than stored and kept honest by a scheduled job.

Paying, refunding and voiding are all offered from the row, gated on
`allowedTransitions`; the two that move money confirm by amount and patient
name first. On a phone the amount folds into the reference cell and the columns
that will not fit are dropped, rather than the table scrolling sideways under
the reader's thumb.

Invoice creation is idempotent by appointment, enforced by a unique constraint,
so a retried billing call finds the existing invoice instead of charging twice.

### Prescriptions — `/prescriptions` · admin, doctor, receptionist

Everything written, most recent first, expandable to the medicines on each, and
filterable by patient — not gated behind choosing one, so "what did I write
this week" is answerable.

Prescriptions name people. The rows previously read "Patient #4 · Dr. #3",
which is what the database stores rather than what anybody needs.

Printing is treated as the workflow it is. Every row carries a labelled
**Print** button that fetches a rendered A4 PDF: letterhead, who it is for, who
wrote it, a medication table with the "how to take it" line running full width
underneath each drug, and the line the prescriber signs.

The document carries a notice on its face that it is a demonstration produced
by a portfolio project and is not a valid prescription.

### Labs — `/labs` · admin, doctor, receptionist

Laboratory information has a shape, and the screen is built around it:
**request, then result, then report.**

A doctor asks for a test; the laboratory writes a finding against it; a scan or
an exported PDF may be attached to that finding. Each stage exists without the
next, so results hang off the request on the same rule the day and the patient
timeline use, and the attached report hangs off the result.

Requests are filtered by state and by patient, and the screen falls through to
everything when nothing is open, rather than landing on an empty tab.

Uploading is offered to doctors, admins and lab technicians only — the roles
the gateway will actually accept a file from — so nobody is given a button that
can only produce a 403. Writing the finding itself is doctors and admins: the
gateway serves `POST /labs/results/*/file` to a technician and every other
`POST /labs/**` only to those two, so the two permissions are tracked
separately.

**This is where a `LAB_TECHNICIAN` lands**, and the only place they can act. The
patient register is not served to them, so they see the patient number rather
than the name, and the filter and the link into a record are both withheld.

Accepted formats and the size limit are stated next to the control rather than
discovered by having a file rejected.

### Not found — `*`

Renders inside the layout, so the sidebar and a way out are still there. It
names the address that failed and links to the signed-in role's own home, not
to a dashboard a patient cannot open. There is no 96px "404": set at display
size that is a decoration of a dead end.

### Access denied

Reached when a role does not cover a route. It renders **inside** the layout
too, and always offers a route home. An earlier version rendered outside it and
left a patient looking at a refusal with no navigation and no way to sign out.

---

## Design system

Named **Ledger**, and arrived at by research rather than by taste. Twelve
references were studied before anything was drawn — shipping clinical software
(Epic, Oracle Health), published healthcare design systems (the NHS digital
service manual, Cerner's Terra), peer-reviewed guidance on clinical interface
design, and the non-healthcare products that solve one of MedCore's problems
better than healthcare does (Stripe on dense financial tables, Linear on
theming and restraint).

Three findings did most of the work.

### Light by default, dark as a real option

The positive-polarity advantage is well established: text on a light ground is
read faster and with **more errors caught**, and the advantage grows as type
gets smaller. MedCore is made of 14px names, doses, dates and amounts, which is
exactly where it bites hardest.

The counter-argument is genuine and is not cosmetic — a clinician spends tens of
thousands of hours in front of this, and for anyone with early lens clouding
less display light means less scatter. So dark is offered properly. Both themes
are generated from the same tokens, `system` is a first-class third state, and
no colour in the product is defined in only one of them.

### Four colours, four meanings

The peer-reviewed guidance on clinical interface colour coding caps it at four
with fixed meanings, and requires colour to be paired with a word or symbol,
because a hue on its own is nothing to a colour-blind reader.

| Meaning | Light | Dark | Used for |
|---|---|---|---|
| **Attention** | `#9A5B00` | `#E0A34A` | a decision is owed, or money is |
| **Critical** | `#C4342B` | `#F08379` | late, failed, destructive |
| **Settled** | `#1F7A47` | `#5EC48A` | paid, confirmed, complete |
| **Closed** | `#616977` | `#828A96` | correctly finished; nothing expected |

Laboratory lost its blue — a lab request is a kind of record, not a state, and
the glyph and the word already say so. A patient who did not attend lost its
orange and became attention, because somebody has to deal with it. States that
are genuinely in flight get a hollow dot and no colour at all, so the palette
holds at four while the state machine has more states than that.

### The rest of the palette

| Token | Light | Dark | Role |
|---|---|---|---|
| Ground | `#F0EFEC` | `#131417` | the page and the chrome |
| Surface | `#FFFFFF` | `#1A1C20` | panels, rows, inputs |
| Raised | `#F7F6F3` | `#212429` | a hovered row, a menu |
| Ink | `#16181D` | `#ECEEF1` | the subject of a row |
| Ink secondary | `#5A6270` | `#A3ABB7` | supporting detail |
| Ink muted | `#616977` | `#828A96` | metadata, timestamps |
| Rule | `#E2E1DC` | `#2A2D33` | hairlines and gridlines |
| Primary | `#12518A` | `#78B4EE` | interaction, links, focus |

The ground is a hair warm rather than clinical white. It is the thing on screen
a reader looks at constantly, and it is the cheapest way to stop the product
reading as a hospital login. The primary is a deep institutional blue rather
than the default SaaS blue: dark enough that it never fluoresces against white,
and it is the only colour on the page that *does* something.

**Every text colour clears WCAG AA against both the ground and a panel, and the
ratios were measured in the browser rather than worked out on paper.** That
distinction earned its place: the muted token was first set to `#767E8B`,
calculated as 4.6:1 and actually reading 3.6:1, while carrying every timestamp
and section label in the product.

### Typography

One family, two cuts.

| Face | Where |
|---|---|
| **IBM Plex Sans** | everything that is read |
| **IBM Plex Mono** | everything that is identified — clock times, invoice and result numbers, amounts, phone numbers |

Plex was drawn for technical and enterprise data, and it does the thing the
medical-typography literature actually asks for: `0` is distinguishable from
`O`, and `1` from `l` from `I`. In a product where a dose and a reference number
are read at speed, that is a safety property rather than a preference.

Staff screens sit at **14px**, the size the clinical guidance names as optimal.
The patient portal steps to **16px** — the same system, read by somebody who is
not paid to be fluent in it. Syne is gone: it was a display face doing work at
12px, where none of its character survives.

**Everything is sentence case.** Both the NHS manual and the peer-reviewed alert
guidance name all-caps as measurably harming comprehension, and it was doing
most of the labelling in this product. No italics, no underline outside links,
bold used sparingly.

### Shape, surface and density

The radius scale tops out at **4px** and the only round things are status dots
and avatars. A clinical record is a ruled sheet. There is one shadow token and
it is used only by things that genuinely float: a menu, a dialog, the mobile
drawer.

The signature motif is **the spine** — a left rule with content hanging off it,
markers sitting on the line. The doctor's day, the patient's history and the
laboratory's request → result → report chain all use it, so a clinician moving
between them reads the same shape each time.

**Row height is a setting**, comfortable or compact, because a receptionist
working a register and a doctor glancing between patients want different ones
and choosing for both is choosing wrong for one. It sits in the account menu
beside the theme.

### Ten rules every screen follows

1. **The subject is the largest thing.** A row is about a person or a record.
2. **Four colours, four meanings.** Everything else is ink on a neutral.
3. **Colour never travels alone.** Every coloured state carries a word.
4. **Sentence case everywhere.** Bold sparingly; no italics or underline.
5. **Numbers are mono, tabular, right-aligned in columns.** Money in full.
6. **One primary action per region.** A control repeated down every row is quiet.
7. **Destructive actions are never the default.** Behind a menu, marked, and
   confirmed by naming the record.
8. **Layer by priority, not category.** Critical first, detail one step deeper.
9. **Never offer what the server will refuse.** Roles and `allowedTransitions`
   decide what renders.
10. **Partial failure is a designed state.** One service down names itself; the
    rest of the screen keeps working.

---

## Front-end architecture

React 18 with Vite 8, Tailwind 3, React Router 6 and TanStack Query 5.

```text
Frontend/src/
├── auth/
│   ├── keycloak.js          # keycloak-js instance
│   ├── AuthProvider.jsx     # init, token refresh, roles and claims in context
│   ├── ProtectedRoute.jsx   # ProtectedRoute (session) + RequireRole (role)
│   └── roles.js             # role names, per-route rules, landing pages
├── components/
│   ├── layout/              # Layout, Sidebar, Header, PatientSearch
│   └── ui/                  # Page, Panel, Figures, Segmented, Menu, Modal,
│                            # ConfirmDialog, StatusBadge, EmptyState,
│                            # ErrorBanner, LoadingSpinner, Pagination,
│                            # Avatar, selectors
├── hooks/                   # one module per domain, plus useClinicOverview
│                            # and usePatientTimeline which compose several
├── pages/                   # one directory per area, forms beside their page
├── services/                # axiosInstance + one API module per service
└── utils/                   # dates, initials, validation
```

**Server state lives in React Query, not in components.** Caching,
invalidation, loading and error states come from there; `useState` is used for
local UI only. Queries are stale after 30 seconds and do not refetch on window
focus, which is deliberate for clinical data.

**One axios instance, one request interceptor and one response interceptor.**
The token is attached on the way out; on the way back 401 clears the session and
bounces to login with a `returnTo`, and 403 is handled separately because
signing someone out for lacking a role would be a bug.

**Route guards are a usability layer, not a security boundary.** The gateway and
the services enforce the real rules; `roles.js` exists so people are not shown
doors that will not open. Paths carrying an id are matched back to their route
pattern rather than compared as strings, because an unmatched path falls through
to "authenticated only".

**The dev server proxies `/api` to the gateway**, so there is no CORS setup in
development. Point `VITE_API_PROXY_TARGET` elsewhere if the gateway moves.

**The shell is one component, and navigation is role-ordered.** The sidebar
groups links by the kind of work rather than by which microservice serves them,
and orders the groups by who is signed in: a doctor's day starts with clinical
work, a billing clerk opens the product to do money. Everyone sees the links
their role reaches, in the order that matches their job.

The header carries only what belongs to the whole application — a search across
the register, reachable from anywhere with `/`, and who is signed in. It used
to carry a page title that every page then repeated in its own words, larger,
twenty pixels below; the title now lives with the page that owns it. The search
replaces a button whose tooltip read "Search is not available yet".

**Below 1024px the sidebar is an off-canvas drawer.** Before, a 240px panel
held its width at every viewport, so on a phone it took two thirds of the
screen and clipped the work into what was left.

---

## Back-end architecture

Database-per-service, service discovery through Eureka, one gateway in front,
and OpenFeign with Resilience4j circuit breakers between services.

| Service | Port | Database | Responsibility |
|---|---|---|---|
| API Gateway | `8080` | none | Single entry point; validates JWTs and applies path and role rules |
| Eureka Server | `8761` | none | Service registry |
| Patient Service | `8001` | `patientdb` | The patient register |
| Billing Service | `8002` | `billingdb` | Invoices, lifecycle and the priced service catalogue |
| Doctor Service | `8003` | `doctordb` | The medical register |
| Prescription Service | `8004` | `prescriptiondb` | Prescriptions and the printable document |
| Lab Service | `8005` | `labdb` | Laboratory requests, results and report files |
| Appointment Service | `8006` | `appointmentdb` | Booking rules, lifecycle, and orchestration across patient, doctor and billing |
| Keycloak | `8480` host → `8080` internal | `keycloakdb` | Identity provider |

All databases are PostgreSQL 16, migrated with Flyway.

Some decisions worth knowing before reading the code:

- **Fallbacks are cause-aware.** A `FeignException.NotFound` becomes a 404, not
  a 503, so a doctor who simply does not exist is not reported as an outage.
- **Lists are paged and searched server-side** and enriched in batches. Building
  a page of appointments costs two remote calls in total, not two per row.
- **Invoices are raised on confirmation**, not on request, so a slot the clinic
  never agrees to does not leave a void invoice behind.
- **Uploaded files are typed by reading their bytes**, never by trusting the
  declared content type or the file name, and are stored under generated keys so
  nothing a client sends reaches the filesystem.

---

## Authorization

Three layers, each of which would be enough on a good day and none of which is
trusted to be the only one.

**1. The gateway** validates the token and applies coarse path and role rules,
mapping Keycloak's `realm_access.roles` claim onto Spring authorities. Every
path prefix ends in a rule matching all remaining methods, rather than an
allow-list of verbs that leaves the rest to fall through.

**2. Each service validates the token again for itself.** Any container on the
Docker network, and anything on the host given the published ports, can call a
service directly. A bypassed gateway is not a breach.

**3. Ownership is decided per record**, after the row is read, against the
claims in the token. A patient may read the record whose id matches their
`patientId` claim and no other; changing the number in the URL returns 403, not
somebody else's data. Where a patient asks for a collection, the query is
narrowed rather than the response filtered, so nothing that is not theirs is
ever loaded.

### Roles

`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `BILLING`, `NURSE`, `LAB_TECHNICIAN`,
`PATIENT`.

### Demo accounts

The realm, its roles and these users are imported from
`Backend/keycloak/realm-export.json` on first start, so a fresh clone gets an
identical working setup with no console steps.

| Account | Role | Lands on | Sees |
|---|---|---|---|
| `admin.demo` | Administrator | Overview | Everything |
| `doctor.demo` | Doctor | Today | Patients, appointments, prescriptions, labs |
| `reception.demo` | Receptionist | Overview | Registration, scheduling, invoices |
| `patient.demo` | Patient | My health | Only their own records |
| `lab.demo` | Lab technician | Laboratory | Laboratory requests and results only |

Password for all five: `DemoPass123!`

`doctor.demo` carries a `doctorId` claim and `patient.demo` a `patientId`
claim; those are what the ownership checks read.

---

## Running it

### Prerequisites

- Docker and Docker Compose
- Node.js 18 or newer
- JDK 17 to 21 if building the services outside Docker. The build enforces this:
  Lombok does not support JDK 22 or later, and the failure without the enforcer
  is around ninety confusing "cannot find symbol" errors.

### 1. Back end

```bash
cd Backend

# Create your local environment file and fill in the credentials
cp .env.example .env

docker compose up --build -d
```

Compose reads `.env` for every database and Keycloak credential and fails fast
with a clear message if one is missing. `.env` is gitignored and should never be
committed.

Sixteen containers come up: eight Spring Boot services, seven PostgreSQL
databases and Keycloak. Give them a minute or two; `api-gateway` and
`appointment-service` are the last to report healthy. The Eureka dashboard at
`http://localhost:8761` shows what has registered.

### 2. Front end

```bash
cd Frontend

cp .env.example .env
npm install
npm run dev
```

The application runs at **`http://localhost:3000`**. That port is fixed in
`vite.config.js` because it is one of the redirect URIs registered for the
Keycloak client; changing it means updating the realm too.

### 3. Sign in

Open `http://localhost:3000`, pick a demo account from the login page and sign
in through Keycloak. The Keycloak admin console is at `http://localhost:8480`
with the credentials from `.env`.

### Useful commands

```bash
# Front end
npm run dev              # dev server on :3000
npm run build            # production build
npm run lint             # eslint, zero warnings tolerated

# Back end
cd Backend/<service> && mvn clean package
docker compose logs -f <service>
docker compose up -d --build <service>    # rebuild one service
```

---

## API reference

Everything is reached through the gateway on `:8080` with a bearer token.

### Patients — `/patients`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/patients` | Paged and searchable (`page`, `size`, `q`) |
| `GET` | `/patients/batch?ids=` | Batch fetch, used to enrich lists in one call |
| `GET` | `/patients/{id}` | Ownership checked |
| `POST` `PUT` `DELETE` | `/patients`, `/patients/{id}` | Delete is admin only |

### Doctors — `/doctors`

Same shape: paged list, `/batch`, `/{id}`, and writes restricted to admin.

### Appointments — `/appointments`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/appointments/search` | Filter by doctor, patient, status and date window; a patient is forced to their own id |
| `GET` | `/appointments/my-day?day=` | The signed-in doctor's calendar, taken from the token |
| `GET` | `/appointments/{id}` | Ownership checked |
| `POST` | `/appointments` | Staff booking starts `CONFIRMED`, a patient's request starts `REQUESTED` |
| `PATCH` | `/appointments/{id}/confirm` `/complete` `/no-show` `/cancel` | Illegal transitions are refused by the state machine |

### Billing — `/billing`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/billing/summary` | Counts and totals computed by the database, not by loading rows |
| `GET` | `/billing/patient/{patientId}` | |
| `GET` | `/billing/services` | The priced catalogue |
| `POST` | `/billing/create` | Idempotent by appointment |
| `PUT` | `/billing/pay/{id}` `/void/{id}` `/refund/{id}` `/cancel/{id}` | |
| `PATCH` | `/billing/services/{code}` | Change a price without a redeploy |

### Prescriptions — `/prescriptions`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/prescriptions` | Narrowed to their own for a patient |
| `GET` | `/prescriptions/{id}/document` | Rendered PDF |
| `GET` | `/prescriptions/patient/{patientId}` `/doctor/{doctorId}` | |
| `POST` | `/prescriptions` | Doctor or admin |

### Labs — `/labs`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/labs/requests` | Narrowed to their own for a patient |
| `GET` | `/labs/{id}` `/labs/{id}/results` `/labs/patient/{patientId}` | |
| `POST` | `/labs/requests` `/labs/result` | |
| `POST` | `/labs/results/{resultId}/file` | Multipart. PDF, PNG or JPEG up to 10 MB, checked by signature |
| `GET` | `/labs/results/{resultId}/file` | Served as an attachment with `nosniff` and a restrictive CSP |

---

## Repository layout

```text
My_Heart_Project/
├── Backend/
│   ├── api-gateway/            # Routing, JWT validation, path and role rules
│   ├── eureka-server/          # Service discovery
│   ├── patient-service/
│   ├── doctor-service/
│   ├── appointment-service/    # Booking rules and lifecycle
│   ├── billing-service/        # Invoices and the service catalogue
│   ├── prescription-service/   # Prescriptions and PDF rendering
│   ├── lab-service/            # Requests, results and report storage
│   ├── keycloak/
│   │   └── realm-export.json   # Realm, roles, clients and demo users
│   └── docker-compose.yml
├── Frontend/
│   ├── src/                    # See front-end architecture above
│   ├── public/
│   ├── tailwind.config.js      # Design tokens
│   └── vite.config.js          # Dev server on :3000, /api proxy
└── PORTFOLIO_UPGRADE_PLAN.md   # Roadmap and what is deliberately deferred
```

---

## What is not here yet

Stated plainly, because a README that only lists strengths is not much use.

- **Automated tests are thin.** Behaviour has been verified against a running
  stack rather than by a suite. That is the largest gap.
- **`KeycloakRoleConverter` is copied into six services** and `CallerIdentity`
  into three. A shared `common-lib` module is the next piece of work, and until
  it exists a security fix has to be applied correctly in several places.

  This is no longer hypothetical. The three copies of `CallerIdentity` each hold
  a `STAFF_ROLES` array, and lab-service's had drifted: it omitted
  `LAB_TECHNICIAN`, so the one role whose entire job is filing laboratory
  reports was treated as a member of the public and refused every result. It had
  never been caught because the role had no account to exercise it.
- **No OpenAPI documents and no CI pipeline yet.**
- **No deployment.** The system runs locally under Docker Compose; hosting is
  deliberately deferred to the end of the project.
- **One report file per laboratory result.** Several attachments per result
  would need a separate table.
- **Search is a `LIKE` query.** Fine at this size, wrong at a real one.
- **The interface is verified by screenshot, not by test.** Every screen has
  been rendered in Chrome against the running stack at 375, 768, 1024 and 1440,
  in both themes, for the admin, doctor, receptionist and patient accounts, and
  checked for horizontal overflow, focus behaviour and text contrast. None of
  that is automated, so nothing stops it regressing.
- **The dark theme is generated, not separately designed.** It is derived from
  the same tokens and measured for contrast, but it has had less time in front
  of a human eye than the light one.
- **Two roles have no seeded data to render.** `NURSE` and `BILLING` have route
  rules and a navigation order but no demo account, so their screens have been
  reasoned about rather than looked at.

---

## Technologies

**Back end** — Java 17 to 21, Spring Boot 3.2, Spring Cloud 2023 (Gateway,
Eureka, OpenFeign), Spring Security with OAuth2 resource servers, Spring Data
JPA, Flyway, Resilience4j, PostgreSQL 16, OpenPDF, Lombok, Maven, Docker
Compose.

**Front end** — React 18, Vite 8, Tailwind CSS 3, React Router 6, TanStack
Query 5, Axios, keycloak-js, date-fns, lucide-react, react-hot-toast.

**Identity** — Keycloak 24, OpenID Connect Authorization Code Flow with PKCE.

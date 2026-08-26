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

Figures sit on hairlines rather than in cards: at this density a card around
every number is chrome competing with the number inside it. Every panel is
gated on the roles the gateway will actually serve, so a doctor never fires the
billing request that would come back 403, and a nurse is not shown an empty
money panel.

Five bounded requests back the whole screen. Today arrives as one day-windowed
page and the wide numbers come from page envelopes and a database-side billing
summary, rather than by downloading every row and counting in the browser.

### Today — `/today` · doctor, admin

The doctor's working day rather than a report: the day's appointments in time
order, with the actions taken during a clinic. Marking a patient seen or a
no-show is offered only when the appointment's `allowedTransitions` permits it,
so the UI never has to guess the rules.

The day is scoped server-side from the `doctorId` claim in the token, so it
cannot be pointed at a colleague's calendar. A day navigator steps forward and
back with a "Back to today" shortcut.

### My health — `/my-health` · patient

The patient's own view: their details and their appointments, upcoming
separated from past. Everything is narrowed server-side to the `patientId`
claim; nothing is filtered in the browser.

### Patients — `/patients` · admin, doctor, receptionist, nurse

The register, searched and paged server-side with a debounced query, so the
list stays the same size whatever the clinic's does. Create, edit and delete
run through modals with a confirmation step on delete.

### Patient record — `/patients/:id` · admin, doctor, receptionist, nurse

One patient and everything that has happened to them, so a clinician stops
opening four tabs. Appointments, prescriptions, laboratory work and billing are
merged into a single thread in time order, with identity and counts alongside.

The merge happens in the browser deliberately: a timeline endpoint would have
to call all four services anyway, and putting it inside one of them would make
that service depend on the other three for a screen only the front end uses.
Each source is fetched independently, so one service being down names itself
above the thread instead of blanking the page.

### Doctors — `/doctors` · admin, doctor, receptionist

The medical register, searched and paged the same way, with specialty badges.
Creating, editing and removing a doctor is admin-only at the gateway.

### Appointments — `/appointments` · admin, doctor, receptionist

Booking and the full lifecycle. Slots are checked for conflicts server-side
using half-open intervals, so a booking that merely touches the end of another
is allowed and one that overlaps is refused. Status filtering and search sit
above the list; cancelling asks for confirmation.

Appointments move through `REQUESTED → CONFIRMED → COMPLETED`, with `CANCELLED`
and `NO_SHOW` as the other terminal states. Who books decides where it starts:
the desk books a slot directly and it begins confirmed, a patient can only ask
and theirs begins requested.

### Billing — `/billing` · admin, billing, receptionist

Invoices per patient, priced from the clinic's service catalogue rather than
from a number typed into the code. An invoice runs `ISSUED → PAID → REFUNDED`
or `ISSUED → VOID`. There is deliberately no overdue state: being overdue is
what an unpaid invoice becomes once its due date passes, so it is derived on
read rather than stored and kept honest by a scheduled job.

Invoice creation is idempotent by appointment, enforced by a unique constraint,
so a retried billing call finds the existing invoice instead of charging twice.

### Prescriptions — `/prescriptions` · admin, doctor, receptionist

Prescriptions per patient, expandable to the medicines on each. Every row has a
**Print** button that fetches a rendered A4 PDF: letterhead, who it is for, who
wrote it, a medication table with the "how to take it" line running full width
underneath each drug, and the line the prescriber signs.

The document carries a notice on its face that it is a demonstration produced
by a portfolio project and is not a valid prescription.

### Labs — `/labs` · admin, doctor, receptionist

Laboratory requests per patient, expanding to the results filed against each.
A result carries a report file — a scan or an exported PDF — uploaded by
doctors, admins and lab technicians. The control is hidden from roles the
gateway would refuse, so nobody is offered a button that can only produce a 403.

Accepted formats and the size limit are stated next to the control rather than
discovered by having a file rejected.

> The API lets a patient read and download their own prescriptions and lab
> reports, but no screen exposes that yet: both pages are staff-only, and the
> patient portal shows appointments and details only. See
> [what is not here yet](#what-is-not-here-yet).

### Not found — `*`

Renders inside the layout, so the sidebar and a way out are still there.

### Access denied

Reached when a role does not cover a route. It renders **inside** the layout
too, and always offers a route home. An earlier version rendered outside it and
left a patient looking at a refusal with no navigation and no way to sign out.

---

## Design system

A dark, dense working interface rather than a marketing page. Clinic staff use
this all day, so contrast and information density matter more than atmosphere.

| Token | Value |
|---|---|
| Display face | Syne |
| Body face | DM Sans |
| Surfaces | `navy-950 #070B14`, `navy-900 #0D1424`, `navy-800 #111D35`, `navy-700 #162340` |
| Accent | `teal-400 #2DD4BF`, `teal-500 #14B8A6`, `teal-600 #0D9488` |
| Semantic | amber for outstanding, rose for overdue, orange for no-shows, blue for laboratory |
| Elevation | one `shadow-card` token, no nested cards |

Conventions the screens follow:

- **Numbers are tabular and monospaced** so columns line up down a page.
- **One accent.** Other colours appear only for genuine semantic state, never
  for decoration.
- **Hairlines over cards** wherever a card would only be a box around a number.
- **Loading states are skeletons shaped like the content**, not spinners, so
  the layout does not jump when data lands.
- **Empty states say what will appear here**, and an empty work queue reads as
  reassurance rather than as missing data.
- **Focus is always visible**: every interactive element carries a teal focus
  ring offset against its own surface.

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
│   ├── layout/              # Layout, Sidebar, Header
│   └── ui/                  # Avatar, Modal, ConfirmDialog, EmptyState,
│                            # ErrorBanner, StatusBadge, Pagination, selectors
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

Password for all four: `DemoPass123!`

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
- **`KeycloakRoleConverter` is copied into six services** and the ownership
  helper into four. A shared `common-lib` module is the next piece of work, and
  until it exists a security fix has to be applied correctly in several places.
- **No OpenAPI documents and no CI pipeline yet.**
- **No deployment.** The system runs locally under Docker Compose; hosting is
  deliberately deferred to the end of the project.
- **One report file per laboratory result.** Several attachments per result
  would need a separate table.
- **Search is a `LIKE` query.** Fine at this size, wrong at a real one.
- **The front end has not caught up with two back-end permissions.** A patient
  may fetch their own prescriptions and laboratory reports through the API, but
  neither page admits them and the portal does not surface either. The rules
  live in `Frontend/src/auth/roles.js`.
- **`LAB_TECHNICIAN` has no screen at all.** The role exists in the realm and
  now carries permissions on laboratory uploads, but it appears in no route rule
  and no sidebar entry, so an account holding only that role signs in and lands
  on a refusal. There is no demo user for it, which is why this is latent rather
  than visible.
- **Screens have been checked by build and by contract, not by eye.** Several
  were written without a rendered screenshot to check them against.

---

## Technologies

**Back end** — Java 17 to 21, Spring Boot 3.2, Spring Cloud 2023 (Gateway,
Eureka, OpenFeign), Spring Security with OAuth2 resource servers, Spring Data
JPA, Flyway, Resilience4j, PostgreSQL 16, OpenPDF, Lombok, Maven, Docker
Compose.

**Front end** — React 18, Vite 8, Tailwind CSS 3, React Router 6, TanStack
Query 5, Axios, keycloak-js, date-fns, lucide-react, react-hot-toast.

**Identity** — Keycloak 24, OpenID Connect Authorization Code Flow with PKCE.

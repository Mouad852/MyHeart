# MedCore Clinic Operations Platform — Portfolio Upgrade Plan

## Purpose

Transform **My Heart Project** from a technically capable healthcare CRUD application into a polished, secure, demonstrable clinic operations platform that can be shown confidently to freelance clients.

The goal is not to add microservices for their own sake. The goal is a product a clinic owner can understand in two minutes: staff can manage care, doctors can manage clinical work, and patients can manage their own journey.

> **Important:** This is a portfolio/demo system. Use fictional data only. Do not describe it as production-ready for real medical records until legal, privacy, security, and compliance requirements have been separately addressed.

## Current Baseline

### What already makes this project valuable

- React, Vite, Tailwind CSS, React Query, and Axios frontend.
- Spring Boot microservices for patients, doctors, appointments, billing, prescriptions, and laboratory workflows.
- API Gateway, Eureka service discovery, PostgreSQL database per service, Flyway migrations, Docker Compose, and Actuator health checks.
- A visually consistent dashboard and management screens for the major clinic domains.
- Keycloak and gateway role rules have started to be introduced.

### Gaps to close before presenting it as a finished project

- **The application is currently unusable end to end.** The gateway requires a JWT on every route, but the React app has no login. Every request returns 401, and the redirect target `/login` is not a route in `App.jsx`, so the user lands on `NotFoundPage`. This is the single most urgent task in the whole plan.
- Bearer token injection *already exists* in `axiosInstance.js`, but the file registers **two** request interceptors and **two** response interceptors. Consolidate them into one of each, then add the missing `/login` route, logout, and token refresh.
- Keycloak needs a reproducible realm import, roles, demo users, and environment-specific configuration. Containers should use Keycloak's internal port (`8080`), while a browser may use the exposed host port (`8480`). The gateway currently points at `keycloak:8480`, which does not exist inside the Docker network.
- No `JwtAuthenticationConverter` maps Keycloak's `realm_access.roles` claim onto Spring's `ROLE_*` authorities. Without it, every `hasRole(...)` rule in `SecurityConfig` fails **even with a valid token**. This is the most common multi-day trap in a Keycloak + Spring integration.
- There are no Java test source files, despite test dependencies being present.
- Docker credentials and admin passwords are development defaults; they must become environment variables and never be committed in real deployment configuration.
- Gateway CORS currently allows every origin and must be restricted in deployed environments.
- The README is stale: it claims 14 containers (6 databases + 8 applications) while Docker Compose actually defines **16** (7 databases including `keycloak-db`, 8 applications, and Keycloak). It also lacks screenshots, demo instructions, and an architecture explanation. *Encoding is fine — the file is clean UTF-8; no fix needed.*
- The sidebar's service-health message is static rather than based on a real health check.
- Appointment-to-invoice creation uses a hard-coded consultation price and no visible retry/idempotency strategy.
- **The circuit-breaker fallbacks are dead code.** `appointment-service` ships `PatientClientFallback`, `DoctorClientFallback`, and `BillingClientFallback` and sets `spring.cloud.openfeign.circuitbreaker.enabled=true`, but its `pom.xml` is missing `spring-cloud-starter-circuitbreaker-resilience4j`. The fallbacks never execute. One-line fix, high demo value.
- **Network N+1 in `getAllAppointments()`:** two remote Feign calls are made per appointment row to enrich patient and doctor details. Pagination alone will not fix this; a batch lookup endpoint is required.
- **Port drift across four sources.** `billing-service` declares `8007` in properties, `8002` in Compose, and `EXPOSE 8084` in its Dockerfile, while the README says `8084`. Lab and prescription have the same problem. It only works because Compose environment variables win at runtime.
- **Duplicated cross-cutting code.** `ErrorResponse`, `ResourceNotFoundException`, and `GlobalExceptionHandler` are near-identical copies in six services, with no shared module.
- **Stale platform version.** All eight modules are on Spring Boot 3.2.3 / Java 17. Leftover `java-upgrade` hook scaffolding sits unused in `.github/`, suggesting an abandoned upgrade attempt.
- **Only the gateway is secured.** Downstream services will serve any request that reaches them on the Docker network; there is no service-level authorization or service-to-service authentication.

## Product Vision

**MedCore** is a role-based clinic operations platform for small and medium healthcare practices. It brings scheduling, patient administration, clinical documentation, laboratory workflows, and billing into one simple experience.

### Core user journey

```text
Receptionist registers a patient
  → books an appointment with an available doctor
  → appointment is confirmed and invoice is issued
  → doctor completes consultation
  → doctor creates a prescription and/or lab request
  → laboratory uploads result
  → patient receives notification and views their own records
```

This one coherent workflow should be the centre of the product demo, tests, screenshots, and walkthrough video.

## 1. Make the Frontend Genuinely Professional

This is the highest-value improvement. The interface should feel like a real SaaS product, not a collection of generic admin pages.

### Create separate role experiences

| Role | Main experience | Main capabilities |
|---|---|---|
| **Admin** | Operations overview | Dashboard, staff/doctors, patients, appointments, billing, laboratory, prescriptions, analytics, settings |
| **Doctor** | Clinical workspace | Today's appointments, patient records, consultation notes, prescriptions, lab requests and results |
| **Patient** | Self-service portal | Book appointment, view appointments, prescriptions, lab results, billing, profile |
| **Receptionist** | Front-desk workspace | Patient registration, calendar, appointment booking, confirmations, invoices |
| **Billing staff** | Financial workspace | Invoices, payments, overdue balances, exports |
| **Laboratory staff** *(optional)* | Laboratory queue | Pending requests, result upload, result status |

Do not merely hide navigation links. Each role should have a dedicated landing page, focused quick actions, and only the information needed for its work.

**Scope note for v1: build three roles, not six.** Admin (absorbing receptionist and billing duties), Doctor, and Patient. Six role experiences means six sets of screens to design, build, test, and screenshot, and nobody clicking through a demo will visit all six. Split Admin into dedicated receptionist, billing, and laboratory workspaces only once the three core roles are polished.

### Professional UX requirements

- Responsive sidebar that becomes a mobile drawer.
- Dedicated empty states with a helpful call to action, not blank tables.
- Skeleton loaders, error recovery, clear toast messages, and confirmation dialogs for destructive actions.
- Consistent design tokens for colour, type, spacing, elevation, radii, and status badges.
- Accessible forms: labels, keyboard navigation, visible focus states, readable error messages, and sufficient contrast.
- Search, filters, sorting, date-range filters, and pagination on data-heavy views.
- Patient and doctor detail pages rather than making users work only from tables.
- A real health indicator backed by a gateway health endpoint.
- A small in-product demo banner explaining that all displayed records are fictional.

### Recommended information architecture

```text
Admin
├── Dashboard
├── Patients
├── Doctors & Staff
├── Appointments
├── Billing
├── Laboratory
├── Prescriptions
├── Analytics
└── Settings

Doctor
├── Today
├── My Appointments
├── Patients
├── Prescriptions
└── Laboratory

Patient
├── Home
├── Book Appointment
├── My Appointments
├── Prescriptions
├── Lab Results
├── Billing
└── Profile
```

## 2. Add Authentication and Authorization

Keycloak is the right choice because it complements the existing Spring Cloud, gateway, Docker, and role-based security direction.

### Access model

```text
ADMIN
  → full platform access

DOCTOR
  → assigned patients, appointments, prescriptions, lab requests/results

PATIENT
  → only their own appointments, prescriptions, lab results, and invoices
```

Also support `RECEPTIONIST`, `BILLING`, and optionally `LAB_TECHNICIAN` for a more credible real-world workflow.

### Implementation checklist

- Create a Keycloak realm export that Docker imports on startup (`--import-realm`), and correct the gateway issuer URI to Keycloak's **internal** port `8080`.
- Add a `JwtAuthenticationConverter` that maps `realm_access.roles` to `ROLE_*` authorities. Do this before writing any UI: without it, all existing gateway role rules silently reject valid tokens.
- Include demo users for every role and document their credentials in a safe local-only example file.
- Add a React login page using OpenID Connect Authorization Code Flow with PKCE.
- Store and refresh tokens safely through a maintained OIDC client approach.
- Consolidate the duplicated Axios interceptors (two request and two response handlers are currently registered) into a single pair, and add the missing `/login` route so the 401 redirect resolves.
- Add protected routes and role-aware navigation in React.
- Enforce the same permissions in the gateway and service layer; frontend checks are a usability feature, not a security boundary.
- Enforce ownership: a patient must never access another patient's ID just by changing a URL or API request.
- Add a logout flow and an expired-session experience.
- Use separate development and production environment configuration.

### Security hardening

- Move all credentials, URLs, and secrets into environment variables and provide `.env.example` files without real values.
- Restrict CORS to known frontend origins in production.
- Do not expose database ports publicly in production unless there is a specific administrative need.
- Do not expose detailed Actuator health information publicly.
- Add rate limits at the gateway for public/patient endpoints.
- Validate every request and return consistent problem-detail error responses.
- Add audit events for viewing or changing important clinical and billing data.
- Secure the services themselves, not only the gateway. Today any caller on the Docker network can reach `patient-service` and its siblings directly with no credentials.

## 3. Improve the Appointment Workflow

An appointment should be a business process, not simply `POST /appointments`.

### Recommended lifecycle

```text
REQUESTED
  ↓  (staff confirmation or approved patient request)
CONFIRMED
  ↓  (appointment time passes and consultation is completed)
COMPLETED

REQUESTED or CONFIRMED
  ↓
CANCELLED

CONFIRMED
  ↓  (patient does not attend)
NO_SHOW
```

Optional additions: `CHECKED_IN`, `RESCHEDULED`, and `PENDING_PAYMENT`.

### Workflow rules

- A doctor cannot have overlapping appointments.
- A patient cannot book overlapping appointments unless an administrator explicitly overrides the rule.
- Appointments must be inside the doctor's configured availability and appointment duration.
- Cancellation and rescheduling should record a reason and timestamp.
- Only allowed status transitions may occur; reject invalid transitions.
- Invoice generation should be linked to a defined event, such as confirmation or completion.
- Patient notifications should be triggered on confirmation, rescheduling, cancellation, and result availability.
- Every transition should appear in an audit timeline.

### Important engineering improvement

When appointment creation triggers invoice creation, do not rely only on a best-effort synchronous request. The complete solution is an idempotency key plus an outbox/retry process, so an invoice is created exactly once even when billing is temporarily unavailable.

**Scope note:** the full outbox pattern is excellent engineering but is invisible in a demo. For v1, ship the idempotency key, a bounded retry, and a visible “invoice pending” state instead of the currently swallowed failure — roughly 90% of the credit for 10% of the work. Defer the outbox table and its relay to v2, and say so in the case study.

## 4. Add Realistic Business Features

These features are more meaningful to potential clients than more generic CRUD endpoints.

### Priority business features

- Doctor availability, recurring schedules, leave, and appointment slot generation.
- Conflict prevention for doctors, rooms, and patients.
- Global search for patient name, phone number, record number, invoice, and appointment.
- Server-side pagination and filtering for all large lists.
- Configurable services and prices instead of a hard-coded consultation fee.
- Invoice lifecycle: draft, issued, paid, overdue, voided/refunded.
- Payment recording, receipt generation, and CSV/PDF export.
- Prescription PDF with clinic, doctor, patient, medication, dosage, and issue date.
- Lab-result file upload with secure object storage (S3, Cloudinary, or MinIO), file-type validation, and signed download links.
- Dashboard analytics: visits today, upcoming appointments, unpaid invoices, pending laboratory work, no-shows, and revenue trends.
- Notification centre plus email/SMS reminder abstraction. A fake/demo notification provider is acceptable initially.
- Patient timeline joining appointments, invoices, prescriptions, and laboratory results.

### Avoid for the first polished release

- Adding more microservices without a user-facing need.
- Building a payment gateway before basic invoice states and receipt generation work well.
- Claiming legal/medical compliance without a real compliance review.
- Storing uploaded lab documents directly in source code, public directories, or database path strings.

### Explicitly deferred to v2

List these in the README as planned work — a visible, reasoned roadmap reads as maturity, not as omission.

- The full transactional outbox and event relay (ship idempotency plus retry first).
- A notification centre and the email/SMS provider abstraction.
- Cloud object storage (S3/MinIO); a mounted volume with validated file types is sufficient for a demo.
- Full audit-event infrastructure.
- Dedicated receptionist, billing, and laboratory role experiences.
- Kubernetes and Helm manifests.

## 5. Data, API, and Backend Quality

### APIs

- Add OpenAPI/Swagger documentation to every service or publish an aggregated gateway specification.
- Use a consistent API error contract throughout services.
- Add request validation to all create/update endpoints.
- Add pagination metadata (`page`, `size`, `totalElements`, `totalPages`) rather than returning unbounded lists. Every service currently returns an unbounded `findAll()`.
- Add batch lookup endpoints (`GET /patients?ids=1,2,3`) so cross-service enrichment does not issue one remote call per row.
- Version public API contracts if you expect them to evolve.
- Add idempotency handling for creation endpoints that may be retried.
- Document ownership and role permissions per endpoint.

### Codebase structure

- Extract `ErrorResponse`, `ResourceNotFoundException`, and the `GlobalExceptionHandler` into a shared `common-lib` module. Six near-identical copies exist today, and demonstrating the refactor is a stronger seniority signal than the error contract itself.
- Upgrade to Java 21 and Spring Boot 3.5. All modules sit on Boot 3.2.3 / Java 17, and a client reading `pom.xml` sees a stack over a year old. Remove or finish the abandoned `java-upgrade` scaffolding in `.github/`.
- Normalize ports so each service uses one number consistently across `application.properties`, its Dockerfile, Compose, and the README.

### Data model enhancements

- Add immutable patient record numbers instead of relying only on numeric IDs.
- Associate a patient account/user ID with Keycloak subject IDs for ownership enforcement.
- Model doctor availability and appointment slots.
- Add configurable clinic services, duration, and prices.
- Store timestamps in UTC and display them using the user's locale/time zone.
- Add `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` where appropriate.
- Use soft deletion or archival for entities where deletion would damage clinical/billing history.

### Reliability and observability

- Add correlation IDs from gateway to downstream services and structured logs.
- Keep health, readiness, and liveness probes meaningful.
- Make frontend status indicators consume real health information.
- Add retries/timeouts/circuit-breaker policies intentionally, with fallback behaviour visible to users. Start by adding the missing `spring-cloud-starter-circuitbreaker-resilience4j` dependency so the fallbacks that already exist actually run.
- Capture failed domain events for retry or support review.
- Add centralized log aggregation only after the local developer experience is stable.

## 6. Testing and Continuous Integration

This is essential for a strong technical portfolio.

### Test strategy

| Layer | What to test | Suggested tools |
|---|---|---|
| Service unit tests | Status transitions, conflict rules, invoice totals, permissions | JUnit 5, Mockito |
| Repository tests | Queries, migrations, constraints | Testcontainers PostgreSQL |
| Controller/API tests | Validation, error format, authorization responses | Spring Boot Test, MockMvc/WebTestClient |
| Integration tests | Appointment → billing workflow and failure/retry behaviour | Testcontainers, WireMock |
| Frontend tests | Role navigation, forms, status views | Vitest, React Testing Library |
| End-to-end tests | Login and the complete clinic journey | Playwright or Cypress |

### First tests to implement

1. A booking outside doctor availability is rejected.
2. A double booking is rejected.
3. Only valid appointment status transitions succeed.
4. A patient cannot retrieve another patient's records.
5. Invoice generation is idempotent.
6. A lab result changes the request status correctly.
7. A doctor can create prescriptions but a patient cannot.

### CI pipeline

Run on every pull request:

1. Frontend lint and production build.
2. Backend compilation and unit tests.
3. Integration tests where practical.
4. Docker Compose configuration validation.
5. Dependency/security scan.

Add status badges to the README once CI exists.

## 7. Deployment and Developer Experience

### Local development

- Provide one root-level quick-start command or documented sequence.
- Add `.env.example` files for frontend and backend.
- Include a seed-data command and an idempotent demo dataset.
- Provide a `Makefile`, npm scripts, or PowerShell script for common actions: start, stop, logs, reset demo data, test, and build.
- Clearly document required versions of Java, Node.js, Docker, and Docker Compose.

### Deployment

- Deploy the frontend separately from the API gateway, with environment-specific API URLs.
- Use managed PostgreSQL or a secure cloud database for any public demo; never use local development credentials.
- Configure HTTPS, environment secrets, backups, and restricted network access.
- Start with a simple deployment platform before Kubernetes. Docker Compose on a small VM or a managed container platform is enough for a portfolio demo.
- Add a safe public demo mode with fake data and resettable accounts.

## 8. Documentation and Portfolio Presentation

The repository should explain the project before someone has to run it.

### README checklist

- Current architecture and container information (16 containers: 7 databases, 8 applications, Keycloak).
- One-sentence product description and target users.
- Screenshots for Admin, Doctor, and Patient experiences.
- Architecture diagram showing frontend, gateway, Keycloak, services, and databases.
- Feature list grouped by role.
- Local setup and environment variables.
- Demo credentials for non-production accounts.
- API documentation link.
- Test and CI instructions.
- Deployed demo and 60–90 second walkthrough video link.
- Explicit fictional-data / non-production disclaimer.

### Case study outline

1. **Problem:** clinics often manage scheduling, billing, and follow-up work in disconnected tools.
2. **Solution:** role-based clinic operations platform.
3. **Users:** administrator, receptionist, doctor, patient, billing staff.
4. **Key workflow:** register → schedule → consult → prescribe/request lab → result → billing.
5. **Technical decisions:** microservices, API gateway, Keycloak, PostgreSQL-per-service, Docker.
6. **Challenges and trade-offs:** cross-service consistency, authorization, upload security, and observability.
7. **Outcome:** a usable, deployable product demonstration—not merely code samples.

## Delivery Roadmap

**On estimates:** the durations below assume focused solo work and are deliberately more conservative than a first pass suggests. Milestone 2 in particular bundles three role experiences, appointment lifecycle, availability modelling, billing rework, PDF generation, file upload, and search/pagination across six domains — that is a month of work, not one week. A schedule you fall behind on in week two gets abandoned; plan for roughly 2.5 to 3 months part-time overall.

### Milestone 0 — Stabilize the baseline (2–4 days)

- [ ] Fix the gateway issuer URI to Keycloak's internal port `8080`.
- [ ] Add `spring-cloud-starter-circuitbreaker-resilience4j` to `appointment-service` so the existing fallbacks execute.
- [ ] Consolidate the duplicated Axios interceptors into one request and one response handler.
- [ ] Normalize service ports across properties, Dockerfiles, Compose, and the README.
- [ ] Finish and commit the current in-progress security/migration work.
- [ ] Verify every service starts cleanly with Docker Compose and reaches a healthy state.
- [ ] Fix the outdated setup and container details in the README (16 containers, not 14).
- [ ] Add `.env.example` files and remove hard-coded secrets from deployable configuration.

### Milestone 1 — Secure role-based platform + first deployment (1.5–2 weeks)

- [ ] Add the Keycloak realm import, roles, demo users, and setup documentation.
- [ ] Add the `JwtAuthenticationConverter` mapping `realm_access.roles` to `ROLE_*`. **Do this first** — nothing else in this milestone works without it.
- [ ] Build the React login/logout flow, the `/login` route, and authenticated Axios requests.
- [ ] Add protected routes and role-aware navigation.
- [ ] Enforce patient record ownership server-side.
- [ ] Restrict production CORS and management endpoints.
- [ ] **Deploy publicly and record a rough walkthrough, even though the app is still plain.**

> **Why deploy this early rather than at the end:** a live URL is the thing that converts a viewer into a client, and deploying now surfaces the configuration problems — environment variables, CORS origins, HTTPS, and Keycloak's hostname behaviour behind a reverse proxy — while the application is still small enough to debug. Discovering those in week six on top of a full feature set is considerably more painful.

### Milestone 2 — Excellent clinic workflow (4–5 weeks)

- [ ] Build the Admin, Doctor, and Patient landing experiences (three roles for v1, not six).
- [ ] Add the appointment lifecycle, availability, status transitions, and conflict prevention.
- [ ] Build the patient detail timeline.
- [ ] Improve the billing lifecycle and replace hard-coded pricing.
- [ ] Add idempotency plus bounded retry on invoice creation, with a visible “invoice pending” state.
- [ ] Add the prescription PDF and secure lab-result upload.
- [ ] Add search, filtering, server-side pagination, and better empty/error states.
- [ ] Add batch lookup endpoints and remove the network N+1 in appointment enrichment.

### Milestone 3 — Quality and trust (1.5–2 weeks)

- [ ] Add backend unit, integration, and API authorization tests.
- [ ] Add key frontend and end-to-end workflow tests.
- [ ] Add OpenAPI documentation across the services.
- [ ] Add GitHub Actions CI with status badges.
- [ ] Extract the shared `common-lib` module for error handling.
- [ ] Upgrade to Java 21 and Spring Boot 3.5.
- [ ] Replace the hardcoded “All services operational” sidebar text with real health data, and add audit events, structured logging, and correlation IDs.

### Milestone 4 — Portfolio launch (3–5 days)

- [ ] Harden the demo deployment from Milestone 1: seeded, resettable, fictional data.
- [ ] Capture polished screenshots and a 60–90 second product walkthrough.
- [ ] Publish the README and case study.
- [ ] Add the project to your personal portfolio with the live demo, repository, and video.

## Definition of Done for the Portfolio Version

The project is ready to promote when a visitor can:

- Log in with a demo account for Admin, Doctor, or Patient.
- Complete the end-to-end clinic workflow without manual database changes.
- See only role-appropriate data and actions.
- Use a responsive, polished interface with clear states and feedback.
- View documented APIs and a clear architecture explanation.
- Run it locally from documented instructions.
- See automated checks passing in CI.
- Understand from the README and video why the project solves a real business problem.

## Recommended First Sprint

If time is limited, build this first:

0. The four one-line fixes from Milestone 0: the Keycloak issuer port, the missing resilience4j dependency, the duplicated Axios interceptors, and the port drift. Together they take under an hour and unblock everything else.
1. Keycloak login with Admin, Doctor, and Patient demo users, including the `realm_access.roles` converter.
2. Role-specific dashboards and navigation.
3. Appointment lifecycle plus doctor conflict prevention.
4. Patient timeline and doctor “Today” workspace.
5. Search, filters, pagination, and professional empty/error states.
6. A clean README with screenshots and a seeded demo.

That sprint alone will change the project from “advanced university microservices work” to a much more compelling freelance portfolio product.

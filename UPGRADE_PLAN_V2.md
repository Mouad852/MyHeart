# MedCore — Upgrade Plan v2

Written 27 August 2026, after the v1 plan (`PORTFOLIO_UPGRADE_PLAN.md`) was
substantially delivered. That document is now history: it described a project
that did not have authentication. This one describes a project that has it, and
asks a different question — **what separates MedCore from the clinic software
that real clinics actually pay for?**

The answer came out of reading the field rather than guessing: commercial
practice-management products, the open-source EHR world, the HL7 standard, the
compliance literature, and the Moroccan clinic-software market specifically.
Sources are listed at the end.

---

## Part 1 — What the real systems look like

### 1.1 The commercial products (SimplePractice, Jane, Tebra, athenahealth)

Every one of them sells the same four things fused into one product:
**scheduling → charting → billing → patient engagement.** None of them sells a
scheduler alone, because a clinic that books a patient then writes the note in
Word has not bought software, it has bought a calendar.

Two things have become table stakes since 2024:

- **Telehealth inside the product** — book a virtual visit, complete intake,
  join the call, review the summary, request a refill, without changing app.
- **AI documentation** — Tebra's charting AI, athenahealth's Ambient Notes,
  SimplePractice's AI Note Taker. In 2026 an EHR with no assisted-note story
  reads as dated.

The depth that separates them is **revenue cycle management**, not feature
count. athenahealth wins larger practices on RCM infrastructure; SimplePractice
wins solo practices on setup simplicity.

**What MedCore should take:** the fusion. MedCore has scheduling, billing,
prescriptions and labs — and **no charting at all**. That is the largest
product-shaped hole in it.

### 1.2 The open-source EHRs (OpenEMR, OpenMRS, Bahmni, HospitalRun)

- **OpenEMR** — integrated EHR, scheduling and electronic billing, 30+
  languages, ONC-certified. Its lesson is *certification and i18n*.
- **OpenMRS** — the "concept dictionary": clinicians define what they collect
  without a developer changing the schema. Plus REST **and FHIR** APIs, which is
  why people build custom front ends on top of it.
- **Bahmni** — OpenMRS + OpenELIS + Odoo, deployed in 50+ countries, built for
  low-resource clinics. Registration → point of care → investigations → billing
  as one continuous flow.
- **HospitalRun** — offline-first, for clinics without reliable internet.

**What MedCore should take:** the *investigations* flow it already models well
(request → result → report is exactly OpenELIS's shape), plus the recognition
that a serious EHR exposes **FHIR**, not only a private REST API.

### 1.3 The standard: HL7 FHIR R4

R4 remains the production and regulatory reference version. The resources map
onto MedCore's domain almost one to one:

| MedCore today | FHIR R4 resource |
|---|---|
| `Patient` | `Patient` |
| `Doctor` | `Practitioner` + `PractitionerRole` |
| *(missing)* availability | `Schedule` + `Slot` |
| `Appointment` | `Appointment` |
| *(missing)* the visit itself | `Encounter` |
| *(missing)* vitals, findings | `Observation` |
| `LabRequest` | `ServiceRequest` |
| `LabResult` + report file | `DiagnosticReport` + `DocumentReference` |
| `Prescription` / `PrescriptionItem` | `MedicationRequest` |
| `Invoice` / `ClinicService` | `Invoice` / `ChargeItem` / `ChargeItemDefinition` |
| *(missing)* problem list, allergies | `Condition`, `AllergyIntolerance` |

**HAPI FHIR** is the Java implementation and there are Spring Boot starters for
it. The gaps in that table are the roadmap — and the fact that they are gaps in
*a standard* rather than gaps in an opinion is what makes them worth closing.

### 1.4 Scheduling, as clinics actually experience it

Outpatient no-show rates run **23–33%**. Automated SMS reminders with two-way
confirmation cut them by **30–40%**. That is the highest-return feature in the
entire category, and it costs less to build than the billing screen.

The standard feature set is now: online self-booking against real availability,
automated multi-channel reminders (at booking, 24h, 1h), **waitlist auto-fill of
cancelled slots**, and **recall campaigns** for follow-ups that are due.

MedCore has none of these. It has appointments but no model of *when a doctor is
available*, so booking is a free-text time rather than a slot.

### 1.5 Clinical documentation

The unit of clinical work is the **encounter**, and its documentation shape is
the **SOAP note** (Subjective, Objective, Assessment, Plan) — near-universal in
outpatient primary care and most specialties.

Around it sit the four lists every EHR keeps: **vitals**, **problem list**,
**allergies**, **current medications**. Their point is not storage — it is
**safety checks at the moment of prescribing**: drug–allergy and drug–drug
alerting before a prescription is signed, and medication reconciliation to catch
omissions, duplications and dosing errors.

MedCore issues prescriptions today with no allergy list to check them against.
That is the gap a clinician would notice in the first thirty seconds.

### 1.6 Billing beyond the invoice

The real cycle: eligibility verification *before* the visit → charge capture →
**coding (ICD-10 diagnosis + CPT procedure)** → claim generation and scrubbing →
submission → payment posting → denial management → patient statement.

The **superbill** is the artefact: patient identity, provider identifier, ICD-10
and CPT codes, charges. Coding errors cause most preventable denials.

MedCore prices from a service catalogue — already a step above a hard-coded fee
— but has no diagnosis coding, no payer, and no concept of anybody paying other
than the patient.

### 1.7 Compliance and audit

HIPAA requires audit controls that record and permit examination of activity in
systems holding ePHI, and requires that those logs are actually *reviewed*. What
must be captured: user and role, patient record id, action, timestamp from a
trusted source, outcome, device and network, **reason codes for break-glass
access**, and integrity metadata. Retention: **six years**. Break-the-glass
should alert immediately and demand a written justification.

MedCore enforces authorization in three layers and records **none** of it.

### 1.8 The Moroccan market — because this is a freelance portfolio

This matters more than everything above if the buyer is a Casablanca clinic.
Local products (Clinavi at 299 MAD/month, WinPlus Med at 399–699, TabibDoc,
GestiCab, CABIDOC, Odoo Health) compete on things a generic clinic system does
not have:

- **AMO / CNSS / CNOPS third-party payment (tiers-payant)** and national fee
  schedules. AMO now covers the whole population, so this is the normal case,
  not an edge case.
- **Feuille de soins électronique (FSE)** filed to CNSS.
- **Moroccan invoice fields** — ICE, IF, TVA.
- **WhatsApp notifications, in darija.** Not SMS. Not email.
- **Loi 09-08 / CNDP** data protection, and hosting inside Morocco.
- French and Arabic interface, therefore **RTL**.

MedCore is entirely in English, bills the patient directly, and notifies nobody.
Its seeded phone numbers are `+212` — the product is one decision away from a
market it does not currently address.

### 1.9 What engineers are expected to show in 2026

Distributed tracing with **OpenTelemetry** (Spring Boot 4 ships
`spring-boot-starter-opentelemetry` with native OTLP export), **Testcontainers**
for tests that touch a real database, contract tests between services, and a
deployment that exists. MedCore is on **Spring Boot 3.2.3 / Java 17**, released
February 2024. A reviewer reads the parent version before they read the code.

---

## Part 2 — Honest gap analysis

| Area | MedCore today | The field | Severity |
|---|---|---|---|
| Charting | none | encounter + SOAP + vitals + problems + allergies | **critical — the missing half** |
| Prescribing safety | free-text medicines | allergy and interaction checking at signing | **critical** |
| Availability | free time entry | `Schedule`/`Slot`, working hours, leave | **high** |
| Reminders / no-shows | none | multi-channel; 30–40% no-show reduction | **high — best return in the plan** |
| Audit trail | none | mandated, six-year, break-glass | **high** |
| Interop | private REST | FHIR R4 | medium-high |
| Billing depth | catalogue-priced invoice | payers, coding, superbill, statements | medium-high |
| Localisation | English only | FR/AR + RTL, AMO/CNSS, WhatsApp | **market-defining, if the market is Morocco** |
| Platform currency | Boot 3.2.3 / Java 17 | Boot 3.5+/4, Java 21 | medium, cheap to fix |
| CI, OpenAPI, e2e, deploy | none | assumed | medium, cheap to fix |
| Test depth | 149 tests, rules only; 5 of 8 modules bare, no Spring context, no DB | Testcontainers slice + integration | medium |
| Telehealth | none | commercially table stakes | deliberate omission (Part 5) |

**The one-line summary:** MedCore is an excellent *practice-management* system
and not yet a *clinical* one. It manages everything around the consultation and
records nothing that happens inside it.

---

## Part 3 — The strategic choice

Do not do all of the below. Two coherent products can be built from here, and
they share a foundation.

**Path A — the Moroccan clinic product.** Buyer: a real practice. Depth in
AMO/CNSS tiers-payant, FSE, WhatsApp reminders in darija, French/Arabic RTL,
ICE/IF/TVA invoicing, a hosting story under Loi 09-08. Wins freelance work.

**Path B — the standards-grade clinical platform.** Buyer: an engineering
employer. Depth in the encounter and clinical record, a FHIR R4 facade, audit
and break-the-glass, OpenTelemetry, Testcontainers, a live deployment. Wins
interviews.

**Recommendation: build the shared core (Phases 0–3), then branch.** Those
phases are required by both paths and are where the product gap actually is.
Choose the branch at that point and say in the README which one you chose and
why — a stated positioning reads as judgement, an unstated one reads as sprawl.

---

## Part 4 — The plan

Effort assumes focused solo part-time work, and is deliberately padded, on the
v1 plan's own principle that a schedule you fall behind on in week two gets
abandoned.

### Phase 0 — Pay the platform debt (4–6 days)

Cheap, mechanical, and it removes the two things a reviewer notices before
reading a line of domain code: a stale parent version and no CI badge.

- [ ] **Java 21 + Spring Boot 3.5.x across all eight modules**, Spring Cloud
      2025.x. Do *not* jump to Boot 4 unless you want the migration to be the
      story; 3.5 is a version-and-properties change, 4.x is a project. Delete
      the abandoned `.github/java-upgrade` and `.github/modernize` scaffolding —
      half-finished automation reads worse than none.
- [ ] **GitHub Actions CI** — frontend lint, build and Vitest; backend
      `mvn verify`; `docker compose config` validation; a dependency scan. Badge
      it in the README.
- [ ] **springdoc-openapi in every service**, aggregated behind the gateway so
      one Swagger UI covers all six domains. Two dependencies and a config block
      per service; it closes a stated README gap.
- [ ] **Testcontainers** — one `@DataJpaTest` against real PostgreSQL per
      schema-owning service, proving the Flyway migrations apply. This alone
      moves "no test starts a Spring context or touches a database" off the gap
      list.
- [ ] **`CallerIdentityTest` in `common-lib`.** It decides ownership for three
      services and is untested. It is the highest-risk untested class you have.

*Done when:* CI is green on a pull request, one Swagger UI lists every endpoint,
and `mvn verify` starts a database.

### Phase 1 — The clinical record (3–4 weeks) — **the centrepiece**

The phase that changes what the project *is*. Everything else here improves a
product that already demos well; this closes the category gap.

**New service: `clinical-service` (port 8007, `clinicaldb`).** It earns its
place by the same test the existing services pass — it owns data nothing else
owns, and it is the one service a doctor writes to during a consultation.

- [ ] **`Encounter`** — created at check-in or on completion, linked to the
      appointment, patient and doctor. FHIR's `Encounter`; the spine of the
      clinical record.
- [ ] **SOAP note** on the encounter — four fields, autosaved, and **versioned**:
      an amended note must not silently replace the original. Clinical notes are
      append-and-amend, never overwrite.
- [ ] **Vitals** — height, weight, blood pressure, pulse, temperature, SpO₂, per
      encounter. FHIR `Observation`. These give the record a *trend*, and a
      trend is the first thing that makes a chart feel real: blood pressure
      across eleven visits, drawn on the timeline you already built.
- [ ] **Problem list** (`Condition`) — active and resolved diagnoses, ICD-10
      coded, carried across encounters rather than re-entered.
- [ ] **Allergies** (`AllergyIntolerance`) — substance, reaction, severity.
- [ ] **The safety check.** When a prescription is written,
      `prescription-service` asks `clinical-service` for the patient's allergies
      and refuses the conflict before the prescription can be signed. Seed a
      patient with a penicillin allergy and put amoxicillin in the demo script.

**Why this is also the best engineering story in the plan:** it is a real
cross-service consistency problem — the allergy check is a synchronous call on a
write path that must fail **safe** (block, not silently allow) when the callee is
down. That is the opposite of every existing fallback in the system, where
degradation means showing less. Write that contrast up; it is more interesting
than another circuit breaker.

**Front end:** a **Consultation** screen for the doctor, opened from Today —
patient context in the rail you already have, note in the middle, vitals and the
lists to the side. The patient timeline gains its most important entry type: the
visit itself, with the note.

*Done when:* a doctor can run a full consultation without leaving the product,
and a prescription for a drug the patient is allergic to is refused with the
allergy named.

### Phase 2 — Scheduling a clinic recognises (2–3 weeks)

- [ ] **Availability model** in `doctor-service` — weekly working hours, slot
      duration per doctor, exceptions and leave. FHIR `Schedule` + `Slot`.
- [ ] **Booking becomes slot selection**, not free-text time. This retires the
      whole "booked at 03:00 on a Sunday" class of bug by construction rather
      than by validation, and it is what makes patient self-booking safe to
      offer at all.
- [ ] **`CHECKED_IN`** in the appointment lifecycle, with a front-desk arrivals
      view. The state machine is your strongest existing asset and it is missing
      the state the receptionist touches most.
- [ ] **`notification-service`** with a provider interface and three
      implementations: a logging demo provider (the default), email, and a
      **WhatsApp/SMS** adapter behind a feature flag. Triggers: booking
      confirmation, 24h reminder, 1h reminder, cancellation, result ready.
      Include the opt-out. Quote the 23–33% and 30–40% figures in the README — a
      feature justified by evidence reads differently from a feature listed.
- [ ] **Waitlist** — a cancelled slot offers itself to the people waiting.
- [ ] **Recall** — patients due for follow-up, as a work queue on the Overview.

*Done when:* a patient books a real slot, receives a confirmation and a
reminder, and a cancellation offers that slot to somebody else.

### Phase 3 — Money a clinic recognises (2 weeks)

- [ ] **Codes on the catalogue** — each `ClinicService` carries a procedure code,
      each invoice line carries the encounter's ICD-10 diagnosis. That is what
      turns your invoice into a **superbill**.
- [ ] **Payers.** An invoice splits between the patient's share and a third
      party. Model it generically (`Payer`, `Coverage`, `covered_amount`,
      `patient_amount`) so "AMO/CNSS" is configuration rather than a Moroccan
      branch running through the codebase.
- [ ] **Partial payments and payment history.** One `PAID` flag cannot express a
      30% co-payment, which is the normal case under AMO.
- [ ] **Documents** — receipt PDF and patient statement, through the same
      OpenPDF pipeline as the prescription. Add ICE, IF and TVA to the clinic
      profile so the invoice is legally shaped for Morocco.
- [ ] **Exports** — CSV of the ledger by date range, because every clinic's
      accountant asks for one.

*Done when:* an invoice shows what the patient owes and what the fund owes, a
partial payment is recordable, and a receipt prints.

### Phase 4 — Trust (1.5 weeks)

- [ ] **`audit-service`** — append-only: actor, role, action, resource type and
      id, patient id, timestamp, outcome, source IP, correlation id. Emitted
      from `common-lib` so all services get it from one place, which is exactly
      the argument that justified `common-lib` in the first place.
- [ ] **Break-the-glass** — a staff member outside the normal relationship can
      open a record by recording a written reason; the access is flagged.
- [ ] **"Who has seen my record"** on the patient portal. Rare even in
      commercial products, trivial once the audit log exists, and a genuinely
      striking demo moment.
- [ ] Retention policy stated (six years), even though the demo will not hold it.
- [ ] **Gateway rate limiting** on the patient-facing and authentication paths.
- [ ] **Correlation ids + OpenTelemetry over OTLP** to a Grafana/Tempo stack in
      Compose, so one booking traces gateway → appointment → patient → doctor →
      billing → notification in a single waterfall. Screenshot it; it is the
      best single image a microservices project can put in a README.

### Phase 5 — Interop, if Path B (1.5–2 weeks)

- [ ] **HAPI FHIR read facade** — a `fhir-service` serving `Patient`,
      `Practitioner`, `Appointment`, `Encounter`, `Observation`,
      `ServiceRequest`, `DiagnosticReport`, `MedicationRequest`, `Condition` and
      `AllergyIntolerance` as R4, composed from the existing services.
- [ ] **`GET /fhir/Patient/{id}/$everything` → a FHIR `Bundle`** — the whole
      record, exportable. Your patient timeline already assembles exactly this;
      the facade is largely a serialiser over work you have done.
- [ ] Read-only, and say so. A write-capable FHIR server is a different project.
- [ ] SMART-on-FHIR-style scopes on the Keycloak client — OAuth2 is the
      standard's own answer, and you already run Keycloak.

*Why it is worth it:* it converts "I designed a schema" into "I implemented an
international healthcare standard", which is the credential that separates a
healthcare developer from a CRUD developer.

### Phase 5′ — Localisation, if Path A (1.5–2 weeks)

- [ ] **i18n: French, Arabic, English**, with **RTL** for Arabic. Real work in a
      Tailwind codebase — logical properties (`ps-`/`pe-`) throughout, and your
      signature left-rule spine motif has to mirror. Budget for it honestly.
- [ ] **AMO/CNSS payer configuration** and fee-schedule import against the
      Phase 3 payer model.
- [ ] **WhatsApp adapter** promoted to the default notification provider.
- [ ] **Loi 09-08 / CNDP posture** documented: what is stored, where it is
      hosted, retention, patient rights.
- [ ] FSE export as a stretch — investigate the actual CNSS format before
      promising it. This is the item most likely to be harder than it looks.

### Phase 6 — Prove it (1 week)

- [ ] **Playwright e2e over the golden journey**, in CI against a Compose stack:
      register → book a slot → check in → consult and write the note → prescribe
      (allergy-checked) → order a lab → file the result → invoice and part-pay →
      patient sees all of it. One test, the whole product.
- [ ] **Automate the screenshot QA** you currently do by hand — 375/768/1024/1440,
      both themes, four roles, with a horizontal-overflow check. It closes the
      most honest gap in the current README.
- [ ] **Seed `NURSE` and `BILLING` demo accounts** with data. Two roles have
      route rules and no way to look at them.
- [ ] **Deploy.** One VM, Compose, Caddy for TLS, managed PostgreSQL, Keycloak
      behind the proxy with `hostname` set properly. Nightly reset to the seed.
- [ ] **90-second walkthrough video** following the golden journey exactly.
- [ ] **Case study** — the problem, the five decisions worth defending
      (three-layer authorization, the state machines, the four-colour system,
      the fail-safe allergy check, why the timeline merges in the browser), and
      what you deliberately did not build.

---

## Part 5 — Deliberately not building, and why

State these in the README. A reasoned exclusion list reads as judgement; silence
reads as an oversight.

- **Real e-prescribing** (Surescripts, EPCS) — needs certification and a
  pharmacy network. The printable prescription is the honest local equivalent.
- **Claim submission to a clearinghouse** — the superbill is the value; the
  transmission is an integration contract you cannot obtain.
- **Telehealth video** — commercially table stakes, but building it means
  embedding a third-party SDK, and a demo video call adds a screenshot rather
  than an idea. Reconsider only on Path A, where clients will ask for it.
- **AI scribe** — genuinely current, genuinely a differentiator, and genuinely a
  different project. If you want it, scope it to one feature: transcript →
  structured SOAP draft the doctor edits, stored as a draft until a human signs
  it. Never ship AI that writes into a chart unreviewed.
- **Kubernetes** — Compose on a VM is the right deployment at this size. Add
  manifests only if a target job posting names it.
- **DICOM / imaging** — a specialty in itself.
- **Any compliance claim.** Keep the fictional-data notice exactly as it is.

---

## Part 6 — If you only do one thing

**Phase 1.** A clinic system that cannot record a consultation is a scheduler
with good manners. Everything else here improves a product that already demos
well; Phase 1 is the difference between "manages a clinic's admin" and "is the
clinic's record".

And if you only have one afternoon: Phase 0's CI and OpenAPI. Two stated README
gaps closed for a few hours of work.

---

## Sources

Commercial products —
[Tebra vs athenahealth vs SimplePractice](https://www.tebra.com/compare-tebra-vs-athenahealth-vs-simplepractice) ·
[SelectHub comparison](https://www.selecthub.com/medical-practice-management-software/simplepractice-vs-athenahealth/) ·
[Best practice-management software 2026](https://softwarefinder.com/resources/best-medical-practice-management-software)

Open source —
[OpenEMR](https://github.com/openemr/openemr) ·
[Bahmni](https://www.bahmni.org/) ·
[Open-source EMR guide](https://lifebit.ai/blog/a-guide-to-the-most-popular-open-source-emr-systems/) ·
[Top 25 open-source clinic systems](https://medevel.com/hospital-clinic-manager-1844/)

Standards —
[HAPI FHIR](https://hapifhir.io/) ·
[FHIR R4 resource guide](https://www.capminds.com/blog/a-complete-guide-to-fhir-resources-fhir-api/) ·
[Spring Boot FHIR starter (IPF)](https://oehf.github.io/ipf-docs/docs/boot-fhir/)

Scheduling and no-shows —
[15 strategies to reduce no-shows](https://www.certifyhealth.com/blog/how-to-reduce-patient-no-shows-15-proven-strategies-for-2026/) ·
[10 proven tactics](https://omnimd.com/blog/how-to-reduce-patient-no-shows/) ·
[Best patient scheduling software 2026](https://waitwellsoftware.com/resources/articles/best-patient-scheduling-software/)

Clinical documentation —
[SOAP notes (StatPearls, NIH)](https://www.ncbi.nlm.nih.gov/books/NBK482263/) ·
[EHR components](https://www.altexsoft.com/blog/electronic-health-record-systems/) ·
[Allergy alerting in practice](https://learn.pcc.com/help/allergies/) ·
[e-prescribing with interaction checks](https://prognocis.com/e-prescription/)

Billing —
[ICD-10, superbills and CPT codes](https://carecloud.com/continuum/guide-on-icd-10-superbills-and-cpt-codes/) ·
[The RCM cycle](https://themedicalpractice.com/revenue-cycle-management/rcm-cycle-in-medical-billing/)

Compliance —
[HIPAA audit log requirements](https://www.kiteworks.com/hipaa-compliance/hipaa-audit-log-requirements/) ·
[EHR audit trails explained](https://www.accountablehq.com/post/ehr-audit-trail-explained-what-it-is-compliance-requirements-and-best-practices) ·
[10 HIPAA audit log requirements](https://censinet.com/perspectives/hipaa-audit-log-requirements-explained)

Morocco —
[Comparatif logiciels cliniques Maroc 2026](https://oasistechnocloud.com/blog/logiciel-gestion-clinique-maroc/) ·
[Comparatif prix cabinet médical](https://www.clinavi.ma/blog/comparatif-prix-logiciel-cabinet-medical-maroc-2026) ·
[Gestion de cabinet médical au Maroc](https://cabidoc.com/gestion-cabinet-medical-maroc)

Engineering —
[OpenTelemetry with Spring Boot](https://spring.io/blog/2025/11/18/opentelemetry-with-spring-boot/) ·
[Spring Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html) ·
[Monitoring Spring Boot microservices](https://uptrace.dev/blog/spring-boot-microservices-monitoring)

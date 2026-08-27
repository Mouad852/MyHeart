# MedCore — back end

Eight Spring Boot services, seven PostgreSQL databases and Keycloak, brought up
by one Compose file. The architecture, the authorization model and the reasoning
behind both live in the [root README](../README.md); this file is the part you
need with a terminal open.

## Start everything

```bash
cp .env.example .env      # then fill in the credentials
docker compose up --build -d
```

Sixteen containers. `api-gateway` and `appointment-service` are the last to
report healthy, so give it a minute or two. Compose reads `.env` for every
database and Keycloak credential and fails fast with a clear message if one is
missing.

```bash
docker compose ps                          # what is up, and what is healthy
docker compose logs -f appointment-service # follow one service
docker compose up -d --build lab-service   # rebuild one service
docker compose down -v                     # wipe the volumes; the next start reseeds
```

## The module layout

`pom.xml` at this level is an **aggregator only**. It exists so `common-lib` can
be built alongside the services that depend on it; each service keeps
`spring-boot-starter-parent` as its own Maven parent, so nothing about how a
service resolves its dependencies changes.

```bash
mvn -pl lab-service -am package    # one service and its shared code
mvn test                           # the whole suite: 57 tests
```

Each Dockerfile does the `-pl … -am` build for its own service, which is why the
build context is `Backend/` rather than the service folder.

| Module | Port | Database |
|---|---|---|
| `api-gateway` | 8080 | — |
| `eureka-server` | 8761 | — |
| `patient-service` | 8001 | `patientdb` |
| `billing-service` | 8002 | `billingdb` |
| `doctor-service` | 8003 | `doctordb` |
| `prescription-service` | 8004 | `prescriptiondb` |
| `lab-service` | 8005 | `labdb` |
| `appointment-service` | 8006 | `appointmentdb` |
| `keycloak` | 8480 → 8080 | `keycloakdb` |

`common-lib` is not a service. It holds `CallerIdentity` and
`KeycloakRoleConverter`, which is where the ownership rules and the realm-role
mapping live for every service that needs them.

## Migrations

Flyway, one location per service, `baseline-on-migrate=true`, and
`ddl-auto=validate` everywhere — a service refuses to start if its schema and its
entities disagree.

Read the numbering as three groups:

- `V1`, `V2`, `V3` — schema. Note that `V*__schema_reconciliation.sql` in each
  service exists because the original scripts were written to describe a schema
  Hibernate had already created and were never executed against an empty
  database. Four of six services could not start from a clean clone until those
  landed. Each one is written to be correct against both a clean database and an
  existing one.
- `V900__demo_seed.sql` — the demo clinic. Excluding this one file from
  `spring.flyway.locations` gives you the same system with nothing in it.

Every seeded date is relative to `now()`, so the clinic has a real today whenever
it is started or reset.

## Keycloak

The realm, its roles, the client and the demo users are imported from
`keycloak/realm-export.json` on first start, so a fresh clone needs no console
steps.

Two details that cost time if you change them:

- The gateway talks to Keycloak on the **internal** port `8080`; a browser uses
  the published `8480`. An issuer URI pointing at `keycloak:8480` resolves to
  nothing on the Docker network.
- `doctor.demo` carries a `doctorId` claim and `patient.demo` a `patientId`
  claim, set by protocol mappers in the export. Those claims are what every
  ownership check reads, and they match the seeded rows — renaming or
  renumbering either silently empties the screens scoped to them.

The admin console is at `http://localhost:8480` with the credentials from
`.env`.

## A token, for poking at the API by hand

Direct access grants are enabled on the demo client, so:

```bash
TOKEN=$(curl -s -X POST \
  "http://localhost:8480/realms/myheart/protocol/openid-connect/token" \
  -d "client_id=myheart-frontend" \
  -d "username=doctor.demo" -d "password=DemoPass123!" \
  -d "grant_type=password" | jq -r .access_token)

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/appointments/my-day" | jq
```

Paths are unprefixed at the gateway: `/patients`, `/doctors`, `/appointments`,
`/billing`, `/prescriptions`, `/labs`. The front end's `/api` prefix is a dev
proxy, not part of the contract.

Worth knowing when reading responses: `/appointments/my-day` and
`/appointments/search` return a page envelope, while `/appointments`,
`/billing`, `/prescriptions` and `/labs/requests` return bare arrays.

## Tests

```bash
mvn test
```

57 JUnit 5 tests across three modules, all of them over rules rather than
plumbing: the appointment lifecycle and its allowed transitions, the booking
rules, ownership decided from the token claim, and the invoice lifecycle
including when an invoice becomes overdue. Five of the eight modules have no
tests at all, which the root README says out loud rather than hides.

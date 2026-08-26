# My Heart Project - Healthcare Microservices System

Welcome to the **My Heart Project**, a comprehensive, full-stack healthcare management system built on a robust and scalable microservices architecture. This system is designed to handle core hospital operations including patient management, doctor scheduling, appointments, billing, prescriptions, and lab results.

## 🏗️ System Architecture

The application is split into two major components:
- **Backend**: Spring Boot microservices communicating via Eureka and API Gateway, each supported by its own isolated database.
- **Frontend**: A modern web interface built with React, Vite, and Tailwind CSS.

### 🔌 Backend Microservices Overview

The backend uses a true microservices approach where each functional domain manages its own data (Database-per-Service pattern).

| Service | Port | Database | Description |
|---|---|---|---|
| **API Gateway** | `8080` | None | Unified entry point for all client requests; handles routing to corresponding microservices. |
| **Eureka Server** | `8761` | None | Service Discovery registry; keeps track of all active microservice instances. |
| **Patient Service** | `8001` | `patientdb` | Manages patient profiles, medical histories, and personal details. |
| **Doctor Service** | `8003` | `doctordb` | Handles doctor profiles, specializations, and availability. |
| **Appointment Service**| `8006` | `appointmentdb`| Core orchestrator managing the lifecycle of appointments. Communicates with Client, Doctor, and Billing services. |
| **Billing Service** | `8002` | `billingdb` | Manages patient invoices, payments, and financial processing. |
| **Prescription Service**| `8004` | `prescriptiondb`| Manages medication records and digital prescriptions. |
| **Lab Service** | `8005` | `labdb` | Handles the recording and tracking of laboratory tests and results. |
| **Keycloak** | `8480` (host) → `8080` (internal) | `keycloakdb` | Identity provider issuing the JWTs the gateway validates. |

*All databases utilize **PostgreSQL** under the hood.*

### 🖥️ Frontend Overview

The frontend interacts directly with the API Gateway (`http://localhost:8080`) to provide a seamless user experience.

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State/Routing**: React Router, React Query
- **Requests**: Axios

## 🚀 Getting Started

Follow the instructions below to spin up both the backend and frontend environments locally.

### 1. Starting the Backend (Docker)

The easiest way to run the entire backend infrastructure (8 Spring Boot services, 7 PostgreSQL databases and Keycloak) is via Docker Compose.

```bash
# Navigate to the Backend directory
cd Backend

# Create your local environment file and fill in the credentials
cp .env.example .env

# Build and start all containers in detached mode
docker compose up --build -d
```

> Docker Compose reads `.env` for all database and Keycloak credentials.
> Compose fails fast with a clear message if a required variable is missing.
> `.env` is gitignored — never commit it.

> **Note**: Because the project spins up 16 containers (7 databases + 8 Spring Boot apps + Keycloak), it might take a minute or two for all services (especially the `api-gateway` and `appointment-service`) to become fully healthy. You can check the Eureka dashboard at `http://localhost:8761`.

### 2. Starting the Frontend

Make sure you have Node.js installed.

```bash
# Navigate to the Frontend directory
cd Frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend application should now be accessible at the local URL provided by Vite (often `http://localhost:5173`).

## 🔐 Authentication

All API traffic is authenticated with Keycloak using OpenID Connect
(Authorization Code Flow with PKCE). The React app never handles a password:
credentials are entered on Keycloak's own login screen.

The realm, its roles and the demo users are imported from
`Backend/keycloak/realm-export.json` when Keycloak first starts, so a fresh
clone gets an identical working setup with no manual console steps.

| Demo account | Role | Sees |
|---|---|---|
| `admin.demo` | Administrator | Everything |
| `doctor.demo` | Doctor | Patients, appointments, prescriptions, labs |
| `reception.demo` | Receptionist | Registration, scheduling, invoices |
| `patient.demo` | Patient | Only their own records |

All demo accounts use the password `DemoPass123!`.

> Every record in this deployment is fictional. This is a portfolio project and
> is not certified for real medical data.

**How authorization is layered**

1. The **API gateway** validates the token and applies coarse path plus role
   rules, mapping Keycloak's `realm_access.roles` claim onto Spring
   authorities.
2. **patient-service** validates the token again for itself, because any
   container on the Docker network could otherwise call it directly.
3. **Record ownership** is enforced per method: staff may read any patient, a
   patient may read only the record matching the `patientId` claim in their
   token. Changing the id in the URL returns 403, not another patient's data.

Keycloak is reachable at `http://localhost:8480` (admin console credentials
come from `.env`).

## 📁 Repository Structure

```text
My_Heart_Project/
├── Backend/
│   ├── api-gateway/            # Routing and unified API access
│   ├── appointment-service/    # Appointment orchestration
│   ├── billing-service/        # Invoicing and payments
│   ├── doctor-service/         # Doctor domain logic
│   ├── eureka-server/          # Service discovery
│   ├── lab-service/            # Lab test tracking
│   ├── patient-service/        # Patient details
│   ├── prescription-service/   # Medical prescriptions
│   └── docker-compose.yml      # Docker multi-container setup
└── Frontend/
    ├── src/                    # React components, pages, and context
    ├── public/                 # Static assets
    ├── package.json            # NPM dependencies
    ├── tailwind.config.js      # Utility CSS configurations
    └── vite.config.js          # Vite bundler configurations
```

## 🛠️ Technologies Used

- **Java & Spring Boot** (Backend logic and REST APIs)
- **Spring Cloud** (Netflix Eureka, Spring Cloud Gateway)
- **PostgreSQL** (Relational databases)
- **Docker & Docker Compose** (Containerization and orchestration)
- **React.js & Vite** (Frontend user interfaces)
- **Tailwind CSS** (Modern utility-first styling)

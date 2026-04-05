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
| **Patient Service** | `8081` | `patientdb` | Manages patient profiles, medical histories, and personal details. |
| **Doctor Service** | `8082` | `doctordb` | Handles doctor profiles, specializations, and availability. |
| **Appointment Service**| `8083` | `appointmentdb`| Core orchestrator managing the lifecycle of appointments. Communicates with Client, Doctor, and Billing services. |
| **Billing Service** | `8084` | `billingdb` | Manages patient invoices, payments, and financial processing. |
| **Prescription Service**| `8085` | `prescriptiondb`| Manages medication records and digital prescriptions. |
| **Lab Service** | `8086` | `labdb` | Handles the recording and tracking of laboratory tests and results. |

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

The easiest way to run the entire backend infrastructure (All 8 services + 6 PostgreSQL databases) is via Docker Compose.

```bash
# Navigate to the Backend directory
cd Backend

# Build and start all containers in detached mode
docker-compose up --build -d
```

> **Note**: Because the project spins up 14 containers (6 databases + 8 Spring Boot apps), it might take a minute or two for all services (especially the `api-gateway` and `appointment-service`) to become fully healthy. You can check the Eureka dashboard at `http://localhost:8761`.

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

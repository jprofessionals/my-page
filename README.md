3# my-page

Internal employee portal for JProfessionals - cabin bookings, job postings, and company resources.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Features](#features)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Docker & Testcontainers](#docker--testcontainers)
  - [Development Tools](#development-tools)
- [Running Locally](#running-locally)
  - [Backend API](#backend-api)
  - [Frontend App](#frontend-app)
  - [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone and enter development environment
git clone https://github.com/jprofessionals/my-page.git
cd my-page
nix develop  # or 'direnv allow' if using direnv

# 2. Start backend (in-memory H2 database)
cd my-page-api
../mvnw spring-boot:run -Dspring-boot.run.profiles=h2

# 3. In a new terminal, start frontend
cd my-page-app
npm install
npm run build:openapi
npm run dev

# 4. Open http://localhost:3000 🎉
```

**Backend API:** http://localhost:8080/api
**Swagger UI:** http://localhost:8080/api/swagger-ui/index.html
**Frontend:** http://localhost:3000

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend          │ ──────► │   Backend API        │
│   Next.js 15        │  :3000  │   Spring Boot 3.4    │
│   React 19          │         │   Kotlin 2.1         │
│   TypeScript        │         │   Java 21            │
└─────────────────────┘         └──────────────────────┘
                                         │
                                         ▼
                                ┌──────────────────────┐
                                │   Database           │
                                │   MySQL 5.7+ / H2    │
                                │   Liquibase          │
                                └──────────────────────┘
                                         │
                                         ▼
                                ┌──────────────────────┐
                                │   Google Cloud       │
                                │   App Engine         │
                                │   Cloud SQL          │
                                └──────────────────────┘
```

### Tech Stack

**Frontend:**
- Next.js 15.3 (Pages Router + App Router)
- React 19, TypeScript 5.8
- Tailwind CSS, DaisyUI, Radix UI
- TanStack Query (React Query)
- Google One Tap Authentication

**Backend:**
- Spring Boot 3.4.5
- Kotlin 2.1.21, Java 21
- JPA/Hibernate
- OpenAPI 3.0 (API-first design)
- OAuth2 JWT Authentication

**Database:**
- MySQL 5.7+ (Production/Test on Cloud SQL)
- H2 (Local development)
- Liquibase for schema management

**Infrastructure:**
- Google Cloud Platform
- App Engine (Hosting)
- Cloud SQL (Database)
- Cloud Storage, Secret Manager
- GitHub Actions (CI/CD)

### OpenAPI-First Design

```
┌─────────────────────────────────────────────────────┐
│  1. Define API in OpenAPI spec (api.yaml)           │
└─────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐      ┌──────────────────────┐
│  Backend         │      │  Frontend            │
│  Generate        │      │  Copy spec to        │
│  Kotlin          │      │  my-page-app/        │
│  interfaces      │      │  src/api.yaml        │
└──────────────────┘      └──────────────────────┘
        │                             │
        ▼                             ▼
┌──────────────────┐      ┌──────────────────────┐
│  Implement       │      │  Generate TypeScript │
│  delegate        │      │  types & client      │
│  controllers     │      │  (@hey-api)          │
└──────────────────┘      └──────────────────────┘
```

**Important:** Always run `npm run build:openapi` after backend API changes!

---

## Features

### 🏠 Cabin Booking & Lottery System
- Calendar-based booking interface for company cabin
- Biannual lottery system (Winter/Summer) with snake draft algorithm
- Admin dashboard for managing drawings, periods, and results
- User interface for submitting cabin wishes with priorities
- Automatic fair allocation with configurable random seed
- CSV import for bulk user wishes

### 👥 User Management
- Google OAuth2 authentication
- Admin/user role management
- User profile pages

### 💼 Job Postings
- Create and manage job postings
- File attachments support
- Customer and tag filtering
- Automatic notifications

### 📊 Other Features
- Responsive design with Tailwind CSS
- Real-time updates with WebSockets
- Comprehensive REST API with Swagger docs

---

## Development Setup

### Prerequisites

**Required:**
- Docker Desktop or [Colima](https://github.com/abiosoft/colima) (for Testcontainers)
- Git

**Choose one of:**
- **Option 1 (Recommended):** [Nix](https://nixos.org/) with flakes
- **Option 2:** Manual installation (NVM, SDK Man, Java 21, Maven 3.x, Node.js)

### Docker & Testcontainers

The test suite uses Testcontainers, which requires Docker.

#### For Docker Desktop Users

Just make sure Docker Desktop is running. No additional setup needed.

#### For Colima Users

Two setup steps required (as of 2025-01-24):

**1. Create symlink** (can cause conflicts if you later install Docker Desktop):
```bash
sudo Ln -sf $HOME/.colima/default/docker.sock /var/run/docker.sock
```

**2. Set environment variables** (add to `.zshrc`, `.bashrc`, or `.envrc`):
```bash
# Required for Colima and Testcontainers
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
```

**If using direnv:** The project includes an `.envrc` file with these variables. Just run:
```bash
direnv allow
```

**Verify setup:**
```bash
docker ps  # Should show running containers or empty list
```

### Development Tools

#### Option 1: Using Nix (Recommended)

This project includes a `flake.nix` that sets up everything automatically.

**Install Nix:**
```bash
sh <(curl -L https://nixos.org/nix/install) --daemon
```

**Enable flakes:**
```bash
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

**Install direnv (optional but recommended):**

If using [home-manager](https://github.com/nix-community/home-manager), add to your config:
```nix
programs.direnv = {
   enable = true;
   nix-direnv.enable = true;
};

# In home.nix initExtra:
eval "$(direnv hook zsh)"
```

**Enter development environment:**
```bash
nix develop  # Manual entry
# OR
direnv allow  # Automatic with direnv
```

All tools (Java 21, Maven, Kotlin, Node.js, npm, Terraform, gcloud) will be available.

#### Option 2: Manual Installation

**Install NVM:**
- https://github.com/nvm-sh/nvm#installation
- https://tecadmin.net/install-nvm-macos-with-homebrew/

**Install Node.js:**
```bash
nvm install node
```

**Install SDK Man:**
- https://sdkman.io/

**Install Java and Maven via SDK Man:**
```bash
sdk install java 21.0.1-tem
sdk install maven 3.9.6
```

**Install Google Cloud SDK** (only needed for deployments):
- https://cloud.google.com/sdk/docs/install
```bash
gcloud init
gcloud components install app-engine-java
gcloud config set project my-page-jpro
```

---

## Running Locally

### Backend API

The backend supports multiple profiles:

**Profile: `h2` (In-Memory Database - Fastest)**
```bash
cd my-page-api
../mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```
✅ Best for quick development - no database setup needed
❌ Data is lost on restart

**Profile: `local` (Local MySQL)**
```bash
# Start MySQL with Docker
docker-compose -f my-page-api/docker-compose.yaml up local-mypage-db -d

# Run API
cd my-page-api
../mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
✅ Persistent data, realistic environment
❌ Requires Docker and MySQL setup

**Profile: `mysql` (Cloud SQL)**
```bash
# For connecting to remote Cloud SQL instance
# See Deployment section for setup
```

**API Endpoints:**
- Base URL: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui/index.html
- Actuator: http://localhost:8080/api/actuator/health

### Frontend App

**Important:** The frontend requires backend OpenAPI types to be generated first.

**Initial setup:**
```bash
cd my-page-app

# Generate TypeScript types from OpenAPI spec
npm run build:openapi

# Install dependencies
npm install

# Start development server
npm run dev
```

**The app will run on:** http://localhost:3000

**Available scripts:**
```bash
npm run dev          # Development server with hot reload
npm run build        # Production build (runs build:openapi + build:next)
npm run build:openapi # Generate TypeScript types from API spec
npm run lint         # ESLint check
npm run format       # Prettier format check
npm run format:fix   # Auto-fix formatting
```

**Important:** Always regenerate types after backend API changes:
```bash
cd my-page-api
mvn clean compile  # Regenerates OpenAPI spec

cd ../my-page-app
npm run build:openapi  # Regenerates TypeScript types
```

### Database

#### Quick Option: Docker Compose (with test data)

```bash
docker-compose -f my-page-api/docker-compose.yaml up local-mypage-db -d
```

This creates a MySQL instance with:
- Database: `mypage`
- User: `mypage` / Password: `mypage`
- Root: `root` / Password: `root`
- Port: `3306`
- Semi-random test data included

#### Alternative: Plain MySQL Container

```bash
docker run \
  -e MYSQL_USER=mypage \
  -e MYSQL_PASSWORD=mypage \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=mypage \
  -d -p 3306:3306 \
  mysql:5.7.8
```

#### Database Migrations

The project uses Liquibase for schema management. Migrations are in:
```
my-page-api/src/main/resources/db/changelog/
```

Migrations run automatically when starting the API. To run manually:
```bash
cd my-page-api
../mvnw liquibase:update
```

**For remote databases** (requires cloud-sql-proxy):
```bash
# Start proxy
./cloud-sql-proxy --address 127.0.0.1 --port 3306 \
  my-page-jpro-test:europe-west1:my-page-jpro-test &

# Run migrations
cd my-page-api
../mvnw -Dliquibase.url=jdbc:mysql://root:@localhost:3306/my-page liquibase:update

# Stop proxy
kill %1
```

---

## Testing

### Backend Tests

**Run all tests:**
```bash
cd my-page-api
../mvnw test
```

**Run specific test:**
```bash
../mvnw test -Dtest=CabinLotteryServiceTest
```

**Requirements:**
- Docker must be running (Testcontainers)
- Environment variables must be set (see Docker section)

**Test structure:**
- Integration tests: `src/test/kotlin/.../integration/`
- Unit tests: `src/test/kotlin/.../service/`, `src/test/kotlin/.../repository/`
- Base class: `IntegrationTestBase` (provides test utilities)
- Test data: `ModelFactory`

### Frontend Tests

The frontend uses Vitest with React Testing Library for testing.

**Run all tests:**
```bash
cd my-page-app
npm test           # Watch mode
npm run test:run   # Run once
```

**Run tests with UI:**
```bash
npm run test:ui    # Interactive test dashboard
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Test structure:**
- Tests are co-located with source files (e.g., `utils/getAsNo.test.ts`)
- Setup: `src/test/setup.ts` (global test configuration)
- Framework: Vitest + React Testing Library + @testing-library/jest-dom
- Current coverage: 37 tests covering `utils/` with 100% coverage

**Linting:**
```bash
npm run lint
```

**Formatting:**
```bash
npm run format      # Check formatting
npm run format:fix  # Auto-fix formatting issues
```

**Note:** Tests run automatically in CI/CD before build and deployment.

---

## Deployment

### Architecture

The application deploys to Google Cloud App Engine with two services:

- **Frontend:** `default` service (my-page-app)
- **Backend:** `api` service (my-page-api)
- **Routing:** Configured in `my-page-app/dispatch.yaml`

### Manual Deployment

**Deploy Frontend:**
```bash
cd my-page-app
npm run build
gcloud app deploy app.yaml
cd ..
```

**Deploy Backend:**
```bash
cd my-page-api
../mvnw package appengine:deploy
cd ..
```

**Deploy Routing (one-time setup):**
```bash
gcloud app deploy my-page-app/dispatch.yaml
```

### Environments

- **Production:** `my-page-jpro` - https://my-page-jpro.appspot.com
- **Test:** `my-page-jpro-test` - https://my-page-jpro-test.appspot.com

---

## CI/CD

GitHub Actions handles continuous integration and deployment.

### Workflows

**.github/workflows/api.yml** - Backend Pipeline
- Triggers: Push to `main` or changes in `my-page-api/**`
- Steps:
  1. Build with Maven
  2. Run all tests (39 tests with Testcontainers)
  3. Deploy to Test environment
  4. Deploy to Production (if test succeeds)

**.github/workflows/app.yml** - Frontend Pipeline
- Triggers: Push to `main` or changes in `my-page-app/**`
- Steps:
  1. Run tests (37 unit tests with Vitest)
  2. npm ci && npm run build
  3. Deploy to Test environment
  4. Deploy to Production (if test succeeds)

### Viewing Build Status

```bash
# Using GitHub CLI
gh run list --limit 5

# Or visit
https://github.com/jprofessionals/my-page/actions
```

### Setting Up CI/CD (New Environment)

See [Setup New Environment](#setup-resources-in-a-new-account) section below for complete instructions on:
- Creating Cloud SQL database
- Setting up service accounts
- Configuring IAM permissions
- Deploying App Engine services

---

## Troubleshooting

### Tests fail with "Cannot connect to Docker daemon"

**Problem:** Testcontainers can't find Docker.

**Solution:**
```bash
# Check if Docker is running
docker ps

# Verify environment variables
echo $DOCKER_HOST
echo $TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE

# Load variables if using direnv
direnv allow

# Or source .envrc manually
source .envrc
```

### Frontend build fails with TypeScript errors

**Problem:** Generated types are out of sync with backend API.

**Solution:**
```bash
# Regenerate backend OpenAPI spec
cd my-page-api
mvn clean compile

# Regenerate frontend types
cd ../my-page-app
npm run build:openapi
```

### "Port 3000/8080 already in use"

**Problem:** Another process is using the port.

**Solution:**
```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database migration fails

**Problem:** Liquibase can't connect to database or changeset has errors.

**Solution:**
```bash
# Check database connection
mysql -h localhost -u root -proot mypage -e "SELECT 1"

# Check Liquibase status
cd my-page-api
../mvnw liquibase:status

# Manually run migrations
../mvnw liquibase:update

# Rollback last changeset if needed
../mvnw liquibase:rollback -Dliquibase.rollbackCount=1
```

### "Access denied" when deploying to GCP

**Problem:** Missing authentication or permissions.

**Solution:**
```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Verify you're using correct project
gcloud config get-value project

# Set correct project
gcloud config set project my-page-jpro
```

### Frontend shows 404 for API calls in production

**Problem:** Routing not configured or API service not deployed.

**Solution:**
```bash
# Verify both services are deployed
gcloud app services list

# Redeploy dispatch rules
gcloud app deploy my-page-app/dispatch.yaml

# Check service URLs
gcloud app browse --service=default
gcloud app browse --service=api
```

---

## Contributing

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**
   - Backend: Implement in `my-page-api/`
   - Frontend: Implement in `my-page-app/`
   - Update OpenAPI spec if adding/changing endpoints

3. **Test your changes:**
   ```bash
   # Backend
   cd my-page-api
   ../mvnw test

   # Frontend
   cd my-page-app
   npm run test:run  # Run tests
   npm run lint      # Lint check
   npm run format    # Format check
   ```

4. **Commit with descriptive message:**
   ```bash
   git add .
   git commit -m "Add cabin lottery period bulk creation"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/my-feature
   # Then create PR on GitHub
   ```

### Coding Standards

**Backend (Kotlin):**
- Use Kotlin idioms: data classes, extension functions, null safety
- Services should be `@Transactional` where appropriate
- Never expose entities directly - use DTOs
- Use `@PreAuthorize` for authorization
- Follow existing package structure

**Frontend (TypeScript):**
- Functional components with hooks
- Use TypeScript strictly - no `any` types
- Prefer generated API types over manual definitions
- Use TanStack Query for data fetching
- Components: PascalCase.tsx
- Services: camelCase.service.ts

**OpenAPI:**
- Update `my-page-api/src/main/resources/openapi/api.yaml` first
- Run `mvn compile` to generate Kotlin interfaces
- Copy spec to `my-page-app/src/api.yaml`
- Run `npm run build:openapi` to generate TypeScript

**Database:**
- All schema changes via Liquibase changesets
- Never manual DDL
- Place changesets in `my-page-api/src/main/resources/db/changelog/changes/`
- Reference in `db.changelog-root.yaml`

### Important Rules

- ⛔ Never commit directly to `main`
- ✅ All backend changes must have passing tests
- ✅ Frontend changes must pass lint
- ✅ Update CLAUDE.md if adding new patterns
- ✅ Regenerate OpenAPI types after API changes

### Code Review Checklist

- [ ] Backend tests pass (`mvnw test`)
- [ ] Frontend tests pass (`npm run test:run`)
- [ ] Lint passes (`npm run lint`)
- [ ] OpenAPI spec updated (if API changes)
- [ ] Liquibase changeset added (if database changes)
- [ ] README/CLAUDE.md updated (if new setup/patterns)
- [ ] No secrets committed
- [ ] Descriptive commit messages

---

## Setup Resources in a New Account

For setting up infrastructure from scratch in a new Google Cloud account.

### 1. Create Database

```bash
# Create Cloud SQL instance
gcloud sql instances create my-page-jpro-test \
  --region europe-west1 \
  --tier db-g1-small

# Create database
gcloud sql databases create my-page \
  --instance my-page-jpro-test
```

### 2. Run Database Migrations

**One-time proxy setup:**
```bash
# Download cloud-sql-proxy
curl -o cloud-sql-proxy \
  https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.2.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Authenticate
gcloud auth application-default login
```

**Run migrations:**
```bash
# Start proxy in background
./cloud-sql-proxy --address 127.0.0.1 --port 3306 \
  my-page-jpro-test:europe-west1:my-page-jpro-test &

# Run Liquibase
cd my-page-api
../mvnw -Dliquibase.url=jdbc:mysql://root:@localhost:3306/my-page liquibase:update
cd ..

# Stop proxy
kill %1
```

### 3. Setup GitHub Actions Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="Service account for Github Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding my-page-jpro-test \
  --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com \
  --role=roles/appengine.deployer

gcloud projects add-iam-policy-binding my-page-jpro-test \
  --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com \
  --role=roles/appengine.serviceAdmin

gcloud projects add-iam-policy-binding my-page-jpro-test \
  --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com \
  --role=roles/storage.objectAdmin

gcloud projects add-iam-policy-binding my-page-jpro-test \
  --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

gcloud projects add-iam-policy-binding my-page-jpro-test \
  --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com \
  --role=roles/cloudbuild.builds.editor

# Create and export key
gcloud iam service-accounts keys create \
  ./github-actions-service-account-private-key.json \
  --iam-account github-actions@my-page-jpro-test.iam.gserviceaccount.com

# Base64 encode for GitHub Secrets
base64 -i github-actions-service-account-private-key.json | pbcopy
```

Then add to GitHub Secrets as `GCP_SA_KEY`.

### 4. Create App Engine Application

```bash
# One-time setup
gcloud app create --region=europe-west
```

### 5. Deploy Services

```bash
# Deploy frontend (default service)
cd my-page-app
npm run build
gcloud app deploy app.yaml
cd ..

# Deploy backend (api service)
cd my-page-api
../mvnw package appengine:deploy
cd ..

# Deploy routing rules
gcloud app deploy my-page-app/dispatch.yaml
```

### 6. Configure OAuth

Follow guide: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

Add credentials to:
- Frontend: Environment variables
- Backend: `application.properties` or Secret Manager

---

## Additional Resources

- **Google Cloud Console:** https://console.cloud.google.com/appengine?project=my-page-jpro
- **OpenAPI Spec:** `my-page-api/src/main/resources/openapi/api.yaml`
- **Project Context:** See `CLAUDE.md` for detailed development context
- **Slack:** #hytte channel for cabin-related questions

---

## License

Internal JProfessionals project - not open source.
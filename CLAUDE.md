# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My-Page is a monorepo containing a Spring Boot Kotlin backend API and Next.js TypeScript frontend application, deployed to Google Cloud Platform App Engine.

**Tech Stack:**
- Backend: Spring Boot 3.4.5, Kotlin 2.1.21, Java 21, JPA/Hibernate, MySQL
- Frontend: Next.js 15.3, React 19, TypeScript 5.8, Tailwind CSS, TanStack Query
- Database: MySQL 5.7+ (Cloud SQL on GCP, local Docker for development)
- Infrastructure: Google Cloud Platform (App Engine, Cloud SQL, Cloud Storage, Secret Manager)
- Testing: JUnit 5, Testcontainers, Spring Security Test

## Development Environment Setup

### Using Nix (Recommended)
```bash
nix develop  # Enter development shell with all required tools
# OR with direnv
direnv allow  # Auto-loads environment when entering directory
```

### Docker Requirements
Testcontainers requires Docker. For Colima on macOS:
```bash
# Required symlink
sudo ln -sf $HOME/.colima/default/docker.sock /var/run/docker.sock

# Required environment variables (add to .envrc or shell config)
export DOCKER_HOST="unix://$HOME/.colima/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
```

## Build & Run Commands

### Backend (my-page-api)
```bash
# Build and run with H2 in-memory database
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=h2

# Build and run with local MySQL (requires Docker)
docker-compose -f my-page-api/docker-compose.yaml up local-mypage-db -d
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=local

# Compile (includes OpenAPI code generation)
mvn clean compile

# Run tests
./mvnw test

# Run specific test
./mvnw test -Dtest=CreateJobPostingTest

# Deploy to App Engine
cd my-page-api
../mvnw package appengine:deploy
```

**API runs on:** http://localhost:8080/api
**Swagger UI:** http://localhost:8080/api/swagger-ui/index.html

### Frontend (my-page-app)
```bash
# IMPORTANT: Generate TypeScript types from OpenAPI spec first
npm run build:openapi

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Format code
npm run format:fix

# Deploy to App Engine
cd my-page-app
npm run build
gcloud app deploy my-page-app/app.yaml
```

**App runs on:** http://localhost:3000 (proxies API requests to localhost:8080)

### Database Migrations
The project uses Liquibase for database schema management. Migrations are in `my-page-api/src/main/resources/db/changelog/`.

```bash
# Apply migrations to remote database (requires cloud-sql-proxy)
./cloud-sql-proxy --address 127.0.0.1 --port 3306 my-page-jpro-test:europe-west1:my-page-jpro-test &
cd my-page-api
../mvnw -Dliquibase.url=jdbc:mysql://root:@localhost:3306/my-page liquibase:update
```

## Architecture

### Backend Structure (my-page-api)

**Package Organization:**
- `controller/` - REST API controllers implementing OpenAPI delegate interfaces
- `service/` - Business logic layer
- `repository/` - Spring Data JPA repositories for database access
- `entity/` - JPA entity classes (database models)
- `dto/` - Data Transfer Objects for API requests/responses
- `config/` - Spring configuration classes (security, beans, etc.)
- `extensions/` - Kotlin extension functions
- `consumer/` - Event consumers and message handlers
- `provider/` - External service integrations
- `job/` - Scheduled jobs and background tasks
- `websocket/` - WebSocket endpoints
- `utils/` - Utility functions

**Key Patterns:**
- OpenAPI-first design: API spec at `src/main/resources/openapi/api.yaml` generates Kotlin interfaces
- Controllers implement generated delegate interfaces (e.g., `JobPostingApiDelegate`)
- Service layer contains business logic, repositories handle data access
- OAuth2 JWT authentication via Google (configured in SecurityConfig)
- Spring profiles: `h2` (in-memory), `local` (local MySQL), `mysql` (Cloud SQL)
- Liquibase manages all database schema changes

**Testing:**
- Integration tests extend `IntegrationTestBase` in `src/test/kotlin/.../integration/`
- Testcontainers provides MySQL and mock OAuth2 server
- Tests use `restClient(authenticated: Boolean)` helper for API calls
- `ModelFactory` creates test data

### Frontend Structure (my-page-app)

**Directory Organization:**
- `src/pages/` - Next.js pages router (main routing)
- `src/app/` - Next.js app router (newer features)
- `src/components/` - React components
- `src/services/` - API client services
- `src/data/types/` - Auto-generated TypeScript types from OpenAPI (DO NOT EDIT)
- `src/hooks/` - Custom React hooks
- `src/providers/` - React context providers
- `src/utils/` - Utility functions
- `src/styles/` - CSS and styling

**Key Patterns:**
- OpenAPI code generation: Run `npm run build:openapi` to regenerate types from `src/api.yaml`
- API client uses `@hey-api/client-fetch` (generated in `src/data/types/`)
- TanStack Query for server state management
- React Hook Form with Zod for form validation
- Tailwind CSS + DaisyUI + Radix UI for styling
- Google One Tap authentication

**Important:** Always run `npm run build:openapi` after backend API changes before running the app.

### API Communication

1. Backend defines OpenAPI spec: `my-page-api/src/main/resources/openapi/api.yaml`
2. Backend generates Kotlin interfaces via openapi-generator-maven-plugin
3. Frontend copies spec to `my-page-app/src/api.yaml`
4. Frontend generates TypeScript client via `@hey-api/openapi-ts` (run `npm run build:openapi`)
5. Frontend imports generated SDK from `src/data/types/`

## Coding Conventions

### Backend (Kotlin)
- Use Kotlin idioms: data classes, extension functions, null safety
- Services should be transactional where appropriate
- Repositories extend `JpaRepository` or custom repository interfaces
- DTOs separate from entities (never expose entities directly in API)
- Use Spring Security's `@PreAuthorize` for authorization
- JPA entities use `@Entity`, `@Table`, and Kotlin no-arg plugin

### Frontend (TypeScript)
- Functional React components with hooks
- Use TypeScript strictly (no `any` types)
- Prefer generated API types over manual definitions
- Use TanStack Query for data fetching
- Component files: PascalCase.tsx
- Service files: camelCase.service.js/ts

## Common Development Tasks

### Adding a New API Endpoint
1. Update `my-page-api/src/main/resources/openapi/api.yaml`
2. Run `mvn compile` to generate Kotlin interfaces
3. Implement delegate in appropriate controller
4. Add service layer logic
5. Copy updated spec to `my-page-app/src/api.yaml`
6. Run `npm run build:openapi` in frontend
7. Use generated types in frontend code

### Adding a Database Table
1. Create Liquibase changeset in `my-page-api/src/main/resources/db/changelog/changes/`
2. Reference changeset in `db.changelog-root.yaml`
3. Create JPA entity in `entity/` package
4. Create repository interface in `repository/` package
5. Run application to apply migration (or use `mvnw liquibase:update`)

### Running Tests Before Commit
```bash
# Backend tests
cd my-page-api
../mvnw test

# Frontend linting
cd my-page-app
npm run lint
npm run format
```

## Deployment

The project deploys to Google Cloud App Engine:
- Frontend: `default` service (my-page-app)
- Backend: `api` service (my-page-api)
- Routing configured in `my-page-app/dispatch.yaml`

GitHub Actions handles CI/CD (see `.github/workflows/`).

## Important Notes

- Never commit to main without tests passing
- Database schema changes require Liquibase changesets (no manual DDL)
- Always regenerate frontend types after OpenAPI spec changes
- Use Spring profiles appropriately (h2 for quick tests, local for integration testing)
- GCP secrets stored in Secret Manager (referenced via `sm://` in properties)
- WebSocket endpoint available for real-time features
- Use an actual TOOD.md file on the root of the project to show and update a plan of action

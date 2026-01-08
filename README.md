# my-page

## About

my-page is the internal employee portal for JProfessionals, a Norwegian IT consulting company. The application serves as a central hub for employees to manage company resources and internal processes.

**Key features:**
- **Cabin Booking & Lottery** - Book the company cabin and participate in biannual lottery draws (winter/summer) with a fair snake-draft allocation algorithm
- **Sales Pipeline** - Kanban-style board for tracking consultant availability and sales activities with drag-and-drop functionality
- **Job Postings** - Create, manage, and browse internal job postings with customer and tag filtering
- **KTU (Customer Satisfaction Survey)** - Annual customer satisfaction surveys with email invitations, response tracking, trend analysis, and public results page
- **Budget Calculator** - Personal budget and salary calculation tools

The application uses Google OAuth for authentication, ensuring only JProfessionals employees can access the portal.

## Quick Start

```bash
# 1. Clone and enter development environment
git clone https://github.com/jprofessionals/my-page.git
cd my-page
nix develop  # or 'direnv allow' if using direnv

# 2. Start backend with H2 in-memory database (simplest option)
cd my-page-api
../mvnw spring-boot:run -Dspring-boot.run.profiles=h2

# 3. In a new terminal, start frontend
cd my-page-app
npm install
npm run build:openapi
npm run dev

# 4. Open http://localhost:3000
```

**Alternative: Run with persistent MySQL database**
```bash
# 1. Start MySQL database
docker-compose -f my-page-api/docker-compose.yaml up local-mypage-db -d

# 2. Start backend with local profile
cd my-page-api
../mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 3. Start frontend (in new terminal)
cd my-page-app
npm install
npm run build:openapi
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui/index.html
- Public KTU Results: http://localhost:3000/ktu/resultater

## Public Pages

### KTU Results Page

The KTU results page (`/ktu/resultater`) is publicly accessible without authentication and displays customer satisfaction trends over time.

**Embedding on external sites:**

The results page supports query parameters for embedding on external websites:

| Parameter | Description |
|-----------|-------------|
| `embed=true` | Hides header and footer for clean embedding |
| `columns=2` | Displays charts in 2 columns instead of 1 |
| `hideResponseRate=true` | Hides the response rate chart |

**Examples:**
```
/ktu/resultater?embed=true
/ktu/resultater?columns=2
/ktu/resultater?embed=true&columns=2&hideResponseRate=true
```

**Embedding with iframe:**
```html
<iframe
  src="https://minside.jpro.no/ktu/resultater?embed=true&columns=2"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Spring Boot 3.4, Kotlin, Java 21 |
| Database | MySQL (Railway), H2 (local dev) |
| Infrastructure | Railway (production), GitHub Actions (CI/CD) |

## Project Structure

```
my-page/
├── my-page-api/     # Spring Boot backend
├── my-page-app/     # Next.js frontend
├── docs/            # Documentation
├── CLAUDE.md        # Detailed development guide
└── README.md        # This file
```

## Development

### Prerequisites

- Docker (for Testcontainers and local MySQL)
- Nix (recommended) or Node.js 18+ and Java 21

### Testing

```bash
# Backend tests (requires Docker for Testcontainers)
cd my-page-api
../mvnw test

# Frontend tests
cd my-page-app
npm run test:run
npm run lint
```

### OpenAPI Workflow

This project uses OpenAPI-first design. After changing the API:

```bash
# 1. Update spec in my-page-api/src/main/resources/openapi/api.yaml
# 2. Generate Kotlin interfaces
cd my-page-api && mvn compile

# 3. Regenerate TypeScript types
cd my-page-app && npm run build:openapi
```

## Deployment

The application is deployed on **Railway** with automatic deployments from the `main` branch.

- **Production:** Automatic deploy on push to `main`
- **Preview:** Automatic deploy on pull requests

## Contributing

1. Create a feature branch
2. Make changes and test locally
3. Ensure tests pass (`mvnw test` and `npm run test:run`)
4. Create a pull request

For detailed development guidelines, coding standards, and architecture details, see **[CLAUDE.md](./CLAUDE.md)**.

## Troubleshooting

### Tests fail with "Cannot connect to Docker daemon"

```bash
# Verify Docker is running
docker ps

# For Colima users, set environment variables:
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
```

### Frontend TypeScript errors

```bash
# Regenerate types from backend API
cd my-page-api && mvn compile
cd my-page-app && npm run build:openapi
```

### Port already in use

```bash
lsof -ti:8080 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

---

**Internal JProfessionals project**
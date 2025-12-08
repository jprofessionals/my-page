# Railway Migration Guide

This document describes how to migrate my-page from Google App Engine to Railway.

## Overview

The migration replaces:
- **Google App Engine** → Railway Services
- **Cloud SQL (MySQL)** → Railway PostgreSQL
- **GCP Secret Manager** → Railway Environment Variables
- **Cloud Storage** → TBD (Cloudflare R2 recommended)

## Prerequisites

1. Railway account at https://railway.app
2. Railway CLI installed: `npm install -g @railway/cli`
3. GitHub repository access

## Railway Project Setup

### 1. Create Railway Project

```bash
# Login to Railway
railway login

# Create a new project
railway init
```

### 2. Add PostgreSQL Database

In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Railway automatically creates `DATABASE_URL` environment variable

### 3. Create Services

Create two services in Railway:
- `my-page-api` (Backend)
- `my-page-app` (Frontend)

### 4. Configure Environment Variables

#### Backend (my-page-api)

Required environment variables:
```
DATABASE_URL=<auto-set by Railway PostgreSQL>
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
OPENAI_API_KEY=<your-openai-api-key>
TASK_SCHEDULER_KEY=<scheduler-auth-key>
SLACK_BOT_TOKEN=<slack-bot-token>
SLACK_APP_UTLYSNINGER_TOKEN=<slack-app-token>
FLOWCASE_API_KEY=<flowcase-api-key>
SLACK_HYTTEKANAL_ID=<slack-channel-id>
SLACK_UTLYSNING_CHANNEL=<slack-channel>
SLACK_SALGSTAVLE_ID=<slack-channel-id>
NOTIFICATION_JOB_ENABLED=true
```

#### Frontend (my-page-app)

Required environment variables:
```
API_URL=https://my-page-api-production.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

### 5. GitHub Actions Secrets

Add these secrets to your GitHub repository:

- `RAILWAY_TOKEN_TEST` - Railway project token for test environment
- `RAILWAY_TOKEN_PROD` - Railway project token for production environment

Get tokens from Railway dashboard: Project Settings → Tokens

## Database Migration

### Option A: Fresh Start (Recommended for Test)

1. Deploy to Railway
2. Liquibase will automatically create tables on first run

### Option B: Migrate Existing Data

1. Export data from Cloud SQL MySQL:
```bash
mysqldump -h <cloud-sql-ip> -u root -p my-page > backup.sql
```

2. Convert MySQL dump to PostgreSQL using pgloader or manual conversion

3. Import to Railway PostgreSQL:
```bash
railway connect postgres
\i converted_backup.sql
```

## Liquibase Compatibility

Some MySQL-specific types need PostgreSQL equivalents:
- `MEDIUMTEXT` → `TEXT`
- `LONGTEXT` → `TEXT`
- `TINYINT(1)` → `BOOLEAN`
- `DATETIME` → `TIMESTAMP`

The Liquibase migrations should work with PostgreSQL, but may need adjustments for database-specific features.

## Deployment

### Manual Deployment

```bash
# Deploy API
cd my-page-api
railway up --service my-page-api

# Deploy App
cd my-page-app
railway up --service my-page-app
```

### Automated Deployment

Push to `main` branch triggers:
1. Build and test
2. Deploy to test environment
3. Deploy to production (with approval)

See `.github/workflows/railway-deploy.yml`

## Domain Configuration

1. In Railway dashboard, go to service settings
2. Add custom domain
3. Configure DNS CNAME record pointing to Railway

## Monitoring

Railway provides:
- Built-in logs viewer
- Metrics dashboard
- Health checks (configured in `railway.toml`)

## Rollback

Railway keeps previous deployments. To rollback:
1. Go to Deployments in Railway dashboard
2. Click on previous deployment
3. Click "Redeploy"

## Cost Comparison

| Service | GCP App Engine | Railway |
|---------|----------------|---------|
| Compute | ~$50-100/month | ~$5-20/month |
| Database | ~$30/month | Included |
| Storage | ~$5/month | Separate (R2) |

## File Storage Migration (Future)

Current: Google Cloud Storage
Options:
1. **Cloudflare R2** - S3-compatible, cheap, good performance
2. **AWS S3** - Industry standard
3. **Keep GCS** - Continue using GCS separately

Implementation requires updating `JobPostingFilesService` and `GcsImageService`.

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check Railway PostgreSQL service is running

### Build Failures
- Check Docker build logs in Railway
- Ensure all dependencies are in `pom.xml` / `package.json`

### Health Check Failures
- Verify `/api/actuator/health` endpoint works
- Check startup time (increase `healthcheckTimeout` if needed)

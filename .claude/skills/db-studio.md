# /db-studio - Open Prisma Studio

Open Prisma Studio to browse and edit database records.

## Command

```bash
npx prisma studio
```

Opens at: http://localhost:5555

## What You Can Do

- Browse all tables (User, Contract, Analysis, Template, Workspace, etc.)
- View and edit records
- Filter and search data
- See relationships between models

## Prerequisites

Database must be running:

```bash
docker compose ps  # Check if PostgreSQL is running
docker compose up -d  # Start if needed
```

## Key Tables

| Table | Description |
|-------|-------------|
| User | User accounts and subscription info |
| Contract | Uploaded contracts |
| Analysis | AI analysis results |
| Template | Saved contract templates |
| Workspace | Team workspaces |
| WorkspaceMember | Workspace memberships |
| ApiKey | API keys for developers |

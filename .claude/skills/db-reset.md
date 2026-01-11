# Clausify Database Reset

Reset the local development database to a clean state.

## Warning

This will delete ALL data in your local database. Only use for development.

## Steps

### 1. Stop the Dev Server

Make sure the dev server is stopped first.

### 2. Reset Database

```bash
# Drop and recreate database
docker compose down -v
docker compose up -d

# Wait for PostgreSQL to start
sleep 3

# Push schema
npx prisma db push
```

### 3. Verify

```bash
npx prisma studio
```

## Alternative: Keep Container, Reset Data

```bash
# Connect to database and drop all tables
docker compose exec postgres psql -U clausify -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Push schema again
npx prisma db push
```

## Seed Data (Optional)

If you have seed data:

```bash
npx prisma db seed
```

## Production Warning

NEVER run these commands against production. The production DATABASE_URL should only be used through Railway's secure interface.

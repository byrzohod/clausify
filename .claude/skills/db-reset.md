# /db-reset - Reset Database

Reset the local development database to a clean state.

## Warning

This deletes ALL local data. Development only!

## Quick Reset

```bash
docker compose down -v && docker compose up -d && sleep 3 && npx prisma db push
```

## Step by Step

```bash
# 1. Stop and remove volumes
docker compose down -v

# 2. Start fresh database
docker compose up -d

# 3. Wait for PostgreSQL
sleep 3

# 4. Apply schema
npx prisma db push

# 5. Verify
npx prisma studio
```

## Alternative: Keep Container

Reset data without recreating container:

```bash
# Drop and recreate schema
docker compose exec postgres psql -U clausify -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Reapply Prisma schema
npx prisma db push
```

## Seed Data (Optional)

```bash
npx prisma db seed
```

## Never Run on Production!

The production DATABASE_URL should only be accessed through Railway's secure interface.

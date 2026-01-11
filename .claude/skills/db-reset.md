# /db-reset - Reset Local Database

Reset the local PostgreSQL database to a clean state.

## When to Use

- Testing fresh user signup flows
- After schema changes
- When data gets corrupted during development

## Commands to Execute

```bash
# Stop and remove the database container (keeps data)
docker compose down

# Remove the data volume for a full reset
docker volume rm clausify_postgres_data || true

# Start fresh database
docker compose up -d

# Wait for database
sleep 3

# Apply schema
DATABASE_URL="postgresql://clausify:clausify_dev_password@localhost:5432/clausify" npx prisma db push

echo "✓ Database reset complete"
```

## Alternative: Keep Structure, Clear Data

To clear all data but keep the schema:
```bash
DATABASE_URL="postgresql://clausify:clausify_dev_password@localhost:5432/clausify" npx prisma db push --force-reset
```

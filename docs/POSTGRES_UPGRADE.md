# PostgreSQL 18 to 19 in Docker Compose

The Compose database uses `postgres:19` and a new `postgres_data_19` volume mounted
at `/var/lib/postgresql`. The old `postgres_data` volume is retained. Starting
Compose with the new configuration initializes an empty database; it does not
migrate existing data. Complete the restore below before starting the app.

This procedure covers the single `rezeptor` database and role used by Compose.
Back up custom roles and grants separately if your installation has them. Recipe
photos and source files live outside PostgreSQL and need their own backup.

The Kubernetes manifest still uses PostgreSQL 18. Do not deploy PostgreSQL 19
against its existing PVC: that deployment needs a separate backup, restore to a
new PVC, and cutover plan.

## Backup and cutover

Use PowerShell from the repository root. Check each command's exit status and
stop on failure. Keep the app stopped throughout the dump, restore, and validation
so no writes are lost. These commands assume the Compose user and database are
both `rezeptor`, matching the application's Compose connection string.

1. Stop application writes and identify the old volume. Save a copy of the
   current Compose configuration and retain the current application image for
   rollback. Never run `docker compose down -v` during this procedure.

   ```powershell
   docker compose stop app
   New-Item -ItemType Directory -Force .backups | Out-Null
   $composeConfig = docker compose config --format json | ConvertFrom-Json
   $sourceVolume = "$($composeConfig.name)_postgres_data"
   docker volume inspect $sourceVolume
   if ($LASTEXITCODE -ne 0) { throw 'Original volume missing; stop and identify it manually.' }
   ```

2. Create a PostgreSQL 18 override that requires the original volume to exist.
   This also works after checking out the new Compose configuration. A custom
   project name must match the one originally used to create the volume.

   ```powershell
   @"
   services:
     database:
       image: postgres:18
       volumes:
         - postgres18_source:/var/lib/postgresql
   volumes:
     postgres18_source:
       external: true
       name: $sourceVolume
   "@ | Set-Content .backups/postgres18-source.yaml
   docker compose -f docker-compose.yaml -f .backups/postgres18-source.yaml up -d --no-deps database
   docker compose exec -T database psql -X -U rezeptor -d rezeptor -c 'SHOW server_version;'
   ```

   Wait for readiness and confirm version 18 before continuing. Inspect the
   container's mounts if there is any doubt about the original volume.

3. Dump the database and copy the binary archive without piping it through the
   shell. Keep a second backup outside this computer. The archive contains
   application data; `.backups` is ignored by Git.

   ```powershell
   docker compose exec -T database pg_dump -U rezeptor -d rezeptor -Fc -f /tmp/rezeptor-pg18.dump
   docker compose cp database:/tmp/rezeptor-pg18.dump .backups/rezeptor-pg18.dump
   docker compose exec -T database pg_restore --list /tmp/rezeptor-pg18.dump
   docker compose stop database
   ```

4. Start only the new PostgreSQL 19 database using the base configuration. Ensure
   its target volume is fresh; if it already contains data from an earlier attempt,
   stop and inspect it rather than overwriting it. Retain the original volume.

   ```powershell
   docker compose up -d --no-deps database
   docker compose exec -T database pg_isready -U rezeptor -d rezeptor
   docker compose exec -T database psql -X -U rezeptor -d rezeptor -c 'SHOW server_version;'
   docker compose cp .backups/rezeptor-pg18.dump database:/tmp/rezeptor-pg18.dump
   docker compose exec -T database pg_restore -U rezeptor -d rezeptor --no-owner --exit-on-error --single-transaction /tmp/rezeptor-pg18.dump
   ```

   Wait for readiness and confirm version 19 before restoring. The target role is
   created from the existing environment. `--no-owner` assigns restored objects
   to that role; `--single-transaction` prevents a partial restore.

5. Compare cookbook, author, recipe, and ingredient counts with the source and
   inspect known records, including nullable instructions and file references.
   Keep `app` stopped until that comparison succeeds. Start the application:

   ```powershell
   docker compose up -d --no-deps app
   docker compose logs --tail 100 app
   ```

   Its startup script runs Prisma migrations. Verify migration completion, recipe
   browsing/editing, and photo/source-file access before allowing users to write.

## Rollback

Before allowing writes on PostgreSQL 19, rollback is a switch to the preserved
PostgreSQL 18 volume and the previously retained application image:

```powershell
docker compose stop app database
docker compose -f docker-compose.yaml -f .backups/postgres18-source.yaml up -d --no-deps database
# Ensure the app uses the retained pre-upgrade image, then start it.
docker compose up -d --no-deps app
```

PostgreSQL 19 writes are not copied back to 18. After accepting new writes, stop
and plan data recovery before rolling back; switching volumes would lose them.
Do not delete either volume or the backups until the upgrade is accepted.

## Automated rehearsal

With Docker running and dependencies installed:

```powershell
npm run db:generate
node scripts/verifyPostgresUpgrade.mjs
```

The script creates uniquely named, labeled containers, volumes, and a network.
It applies the real Prisma migrations to PostgreSQL 18, inserts deterministic
recipe/cookbook data, and uses PostgreSQL 19's dump client to transfer it into
the Compose target image. It checks every application table and Prisma migration
history, reruns Prisma migrations, reads nested data through Prisma's PostgreSQL
adapter, and confirms the source remains intact. Cleanup checks ownership labels
before removing only resources created by that run. No existing Compose service,
volume, or Kubernetes resource is used. Interrupted runs can leave test resources
whose names begin with `rezeptor-pg-upgrade-`; inspect their labels before cleanup.

The `postgres-upgrade` CI job runs this rehearsal before image publishing. It does
not validate a user's actual data, credentials, file storage, or browser flows.

References: [PostgreSQL major-version upgrades](https://www.postgresql.org/docs/19/upgrading.html)
and the [official Docker image](https://hub.docker.com/_/postgres).

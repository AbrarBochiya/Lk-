# PostgreSQL backup and restore

Configure Dokploy PostgreSQL backups daily, encrypt the destination, retain at least 30 daily and 12 monthly recovery points, and store a second copy outside the VPS. Monitor backup failures.

For a manual logical backup, run `pg_dump` from an authenticated infrastructure shell against the private database and write a custom-format archive to protected backup storage. Record the application version, migration level, UTC timestamp, and archive checksum. Never put a dump in Git.

Verify monthly by restoring into a **new isolated PostgreSQL service**, pointing a temporary application instance at it, running `/api/health`, signing in with a controlled test account, and checking record counts and key balances. Delete the isolated test environment after verification.

Emergency restore procedure:

1. Stop writes or place the application in maintenance mode.
2. Preserve a final backup of the damaged database.
3. Create a new empty PostgreSQL database; do not overwrite the active database first.
4. Restore the selected archive with `pg_restore` into the new database.
5. Point a temporary app at it and verify migrations, health, login, totals, supplier balances, and audit history.
6. Change `DATABASE_URL` only after approval and verification.
7. Keep the old database read-only until the recovery is signed off.

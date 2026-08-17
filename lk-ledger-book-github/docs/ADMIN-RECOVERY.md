# Admin recovery

There is no master password, hidden user, or backdoor.

Recovery requires authenticated infrastructure/database access. First take a backup. Identify the intended Admin by email and confirm ownership outside the application. Generate a unique temporary password, hash it with the same bcrypt cost used by `scripts/bootstrap-admin.ts`, and update only that Admin's `passwordHash`; increment `sessionVersion` and delete their active sessions. Record the operator, reason, UTC time, and affected user ID in `AuditLog` as a password-change event. Deliver the temporary password through a separate secure channel and require immediate change.

If no Admin exists, set the three `ADMIN_*` variables and run `npm run bootstrap:admin` once from the application container. If an Admin exists, the script intentionally refuses to create or overwrite one.

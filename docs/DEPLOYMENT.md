# Hostinger VPS + Dokploy deployment

## 1. GitHub

Push this repository to GitHub. Use the deployed branch (currently `master`) as the Dokploy source. Do not add `.env` or credentials to GitHub.

## 2. PostgreSQL service

In Dokploy create a PostgreSQL service named `lk-ledger-postgres` with database `lk_ledger_book`, a dedicated user, and a generated strong password. Keep it on Dokploy's private network. Copy the internal PostgreSQL connection URL; do not expose port 5432 publicly.

Enable persistent storage before the first deployment. Confirm the database reports healthy.

## 3. Application service

Create an Application named `lk-ledger-book`:

- Source provider: GitHub
- Repository: `AbrarBochiya/Lk-`
- Branch: `master`
- Build type: Dockerfile
- Dockerfile path: `Dockerfile`
- Container port: `3000`
- Restart policy: unless stopped / always
- Health path: `/api/health`
- Health expected status: `200`

Add these environment variables in **Dokploy → Application → Environment Variables**:

```text
DATABASE_URL=<internal PostgreSQL URL from lk-ledger-postgres>
DIRECT_URL=<same internal URL unless a separate direct URL is supplied>
AUTH_SECRET=<at least 32 random bytes>
ADMIN_NAME=<owner name>
ADMIN_EMAIL=<owner login email>
ADMIN_PASSWORD=<temporary unique password, minimum 12 characters>
APP_URL=https://ledger.your-domain.example
NODE_ENV=production
FILE_STORAGE_PATH=/app/storage
```

Attach persistent storage at `/app/storage` before using Documents.

## 4. First deployment

Deploy. Container startup runs `prisma migrate deploy`, then the idempotent Admin bootstrap, then the Next.js server. Do not add a destructive database command.

Open `/api/health`; both `application` and `database` must report healthy. Open the application and sign in with `ADMIN_EMAIL` and the temporary `ADMIN_PASSWORD`. Change the password under Settings → My Account as soon as that account screen is enabled. The environment password is only a bootstrap value and will never overwrite an existing Admin.

## 5. Domain and TLS

In Dokploy add the public domain to the Application, direct its DNS A/AAAA record to the Hostinger VPS, enable automatic TLS, and force HTTPS. Set `APP_URL` to the final HTTPS origin and redeploy. Do not publish the database service.

## 6. Redeployment

Future pushes build a fresh image. Migrations are forward-only and execute before the server starts. A migration failure prevents the new container from serving traffic, protecting schema/application compatibility. Review logs and fix the migration; never reset production.

## 7. Verification

Test login, logout, role restrictions, daily-sale duplicate prevention, a test sale and reversal, supplier partial allocation, health status, restart persistence, and a backup/restore rehearsal. Remove test financial entries using authorised reversals, not deletion.

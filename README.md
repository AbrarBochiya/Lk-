# LK Ledger Book

LK Ledger Book is a PostgreSQL-backed internal finance application for multi-shop sales, profit, operating expenses, personal withdrawals, supplier liabilities, and daily cash accountability. It uses strict TypeScript, Next.js App Router, Prisma, server-side sessions, Zod validation, and an auditable financial data model.

## What is implemented

- Premium responsive login, management dashboard, navigation, KPI drill-downs, charting, shop ranking, and mobile quick actions.
- Secure password hashing, opaque database sessions, protected routes, server-side role and shop authorization, and first-Admin bootstrap.
- Daily sales entry with duplicate constraints and central calculation functions for gross/net sales, profit, margins, contribution, and expense allocation.
- PostgreSQL schema for businesses, shops, access, sales/categories, expenses/allocations, suppliers, bills, payments/allocations, ledger, closings, cash movements, targets, alerts, filters, documents, audit logs, and reversals.
- Production Docker image, safe forward-only migrations, health endpoint, seed data, and unit tests.
- Additive 2026 financial-management upgrade with safe shop archiving/deletion, effective margin history, invoice-aware sales, monthly fixed-cost and EMI structures, shared report filters, real P&L/cash-flow routes, expanded RBAC, and a secret-safe Data & Backup page.

## Architecture

`Browser → Next.js Server Components/Actions → authorization + Zod → financial services → Prisma → PostgreSQL`

Financial calculations live in `src/lib/financial.ts`; data access in `src/lib/db.ts`; authentication and authorization in `src/lib/auth.ts`; audit writes in `src/lib/audit.ts`. Persisted money uses PostgreSQL `Decimal`, never JavaScript floating point as the database source of truth.

## Local development

Requirements: Node.js 24+, npm, and PostgreSQL.

1. Copy `.env.example` to `.env` and provide a local PostgreSQL `DATABASE_URL`.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.
6. Set bootstrap Admin values, then run `npm run bootstrap:admin`.
7. Run `npm run dev` and open `http://localhost:3000`.

The bootstrap script only creates an Admin when none exists. Changing `ADMIN_PASSWORD` later never overwrites the database password.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL connection URL from Dokploy |
| `DIRECT_URL` | Optional direct URL used by Prisma CLI migrations |
| `AUTH_SECRET` | Strong random application secret (reserve for signing/recovery extensions) |
| `ADMIN_NAME` | First Admin display name |
| `ADMIN_EMAIL` | First Admin login email |
| `ADMIN_PASSWORD` | Temporary bootstrap password, minimum 12 characters |
| `APP_URL` | Public HTTPS URL |
| `FILE_STORAGE_PATH` | Private persistent document storage path |

Never commit `.env`, credentials, or storage contents.

## Core accounting rules

- Gross sales = cash + UPI + card + bank + other.
- Net sales = gross sales − returns.
- Gross profit = net sales − COGS.
- Operating profit = gross profit − operating expenses.
- Profit after personal withdrawals = operating profit − personal withdrawals.
- Supplier liabilities never enter profit calculations.
- Posted financial records are reversed, not deleted. Reversal records retain the original link and reason in audit history.
- Supplier outstanding = bill total − allocated payments. Payments may span multiple bills and cannot exceed the payment or bill balance.
- Daily cash variance = counted cash − expected cash; approval and explanation are retained.

Zero denominators return 0%, and central allocation assigns any rounding remainder to the final allocation so totals remain exact.

## Roles and access

- `ADMIN`: all businesses, shops, users, approvals, settings, reversals, and audits.
- `MANAGER`: assigned shops and permitted operational/approval work.
- `STAFF`: assigned shop data entry only.

Every server action must call `requireUser()` and validate shop access. Hiding a UI control is never treated as authorization.

## Commands

```text
npm run typecheck
npm run lint
npm test
npm run build
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run bootstrap:admin
```

Never use `prisma migrate reset` in production.

## API

`GET /api/health` returns only application status, database status, and timestamp. It returns HTTP 503 if PostgreSQL cannot be reached and never exposes configuration.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/BACKUP-RESTORE.md](docs/BACKUP-RESTORE.md), [docs/ADMIN-RECOVERY.md](docs/ADMIN-RECOVERY.md), and [docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md).

For the coordinated 2026 upgrade, exact upload, verification, and rollback steps, see [docs/UPGRADE-2026-08.md](docs/UPGRADE-2026-08.md).

## Testing and troubleshooting

Run the quality commands above before every push. If login fails, verify the Admin exists, account status is `ACTIVE`, the database URL is reachable from the application container, and the application clock is correct. If deployment stops during startup, inspect migration output first; the application intentionally will not start on a failed migration.

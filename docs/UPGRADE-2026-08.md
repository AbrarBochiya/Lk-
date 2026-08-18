# LK Ledger Book coordinated financial-management upgrade

## Audit and root causes

The deployed application was connected to PostgreSQL, but most navigation routes were served by one generic placeholder page. Consequently, reports, cash flow, settings, suppliers, and other pages could only display “No records yet.” Sales were stored as one daily aggregate per shop/shift and only the dashboard queried them. The dashboard hard-coded the current month, while other modules had no shared date-query implementation. Shop management only changed `ACTIVE`/`INACTIVE`; there was no edit, archive timestamp, margin history, or safe-delete rule. Fixed expenses used a flag on an ordinary expense, which could not enforce “once per month.” Roles were limited to Admin/Manager/Staff.

Earlier deployment failures were separate configuration issues: `127.0.0.1:5432` addressed the application container itself, and the later value treated `postgres/lk_ledger_book` as one database name. Use the exact Dokploy internal PostgreSQL URL and exactly one database path. `DATABASE_URL` and `DIRECT_URL` must be identical unless a separate migration endpoint genuinely exists.

## Architecture and data preservation

The working Next.js + Prisma + PostgreSQL architecture is retained. Migration `20260819120000_financial_management` is additive: it does not rename, truncate, or replace existing financial tables. Existing shop, user, session, daily sale, expense, and audit identifiers remain valid. New capabilities are added around those records.

Browser → authenticated Server Component/Action → shop/role authorization → validation/calculation service → Prisma transaction → PostgreSQL.

## Added data structures

- Shop code and archive timestamp; safe permanent deletion is allowed only when no financial relations exist.
- Effective-dated `ShopMargin` history.
- Invoice/customer/source/discount/tax/received/cancellation fields on existing daily sales.
- `MonthlyFixedCost`, enforcing one recurring key per business and month.
- `Loan` and `EmiPayment`, separating principal and interest.
- `AccountingPeriod` for month closing.
- `ImportBatch` and `ImportRow` for preview/error/audit/rollback metadata.
- Expanded roles: Owner, Administrator, Accountant, Shop Manager, Data Entry, Viewer; legacy Manager/Staff remain compatible.

## Shared calculations

- Gross sales = cash + UPI + card + bank + other.
- Net sales = gross sales − discounts − returns/refunds.
- Estimated COGS = net sales × (1 − effective gross-margin percentage / 100) when actual COGS is unavailable.
- Gross profit = net sales − COGS.
- Net profit/loss = gross profit − variable operating expenses − monthly fixed costs − EMI interest − allocated central costs.
- EMI principal is excluded from accounting profit but included as a cash outflow.
- Consolidated central costs are queried once and must never be multiplied by shop count.
- Cash flow uses paid/payment dates, not the accounting transaction date.

## Deployment — one coordinated upload

1. In GitHub open `AbrarBochiya/Lk-`, choose **Add file → Upload files**.
2. Extract `LK-ledger-book-complete-update.zip` on your computer.
3. Upload the *contents* of its `LK-ledger-book-complete-update` folder to the repository root. Preserve folders such as `src`, `prisma`, `scripts`, and `docs`. Do not upload the containing folder as an extra nested level.
4. Commit all uploaded files in one commit.
5. In Dokploy application **Environment**, verify `DATABASE_URL` and `DIRECT_URL` use the PostgreSQL **Internal Connection URL**. They must end with `/postgres` (or the single real database name), never `/postgres/lk_ledger_book`, and never use `127.0.0.1`.
6. Keep `APP_URL=https://lkenterprise.tech`, `NODE_ENV=production`, and `FILE_STORAGE_PATH=/app/storage`.
7. Confirm the persistent volume maps to `/app/storage`. Do not expose PostgreSQL port 5432 publicly.
8. Create a PostgreSQL backup/snapshot before deployment.
9. Press **Deploy** once. Startup runs `prisma migrate deploy`, bootstraps the first admin only if no user exists, then starts the web server on internal port 3000.
10. In logs confirm `20260819120000_financial_management` applied and the server remains running. Visit `/api/health`, then `/shops`, `/sales`, `/reports`, `/cash-flow`, and `/data-backup`.

Never use `prisma migrate reset` in production. If migration fails, keep the database and previous image, copy the complete log, and resolve forward.

## Manual verification

1. Edit an existing shop, add a margin effective today, archive it, view Archived, then restore it.
2. Add a new shop. Confirm permanent deletion works only before it has financial history.
3. Add a sale and refresh. Confirm it appears in Sales, Dashboard, Reports, and Cash Flow where payment data applies.
4. Cancel the sale. Confirm it remains visible as reversed but leaves normal totals.
5. Test This month, Last month, financial year, and custom date filters.
6. Add a fixed monthly cost and confirm it appears once in the selected month.
7. Record an EMI with principal and interest; confirm only interest affects P&L while both affect cash flow after payment.
8. Check `/data-backup` without expecting or exposing secrets.

## Backup and rollback

Take a Dokploy PostgreSQL backup before deployment and retain the previously working application image. Application rollback means selecting that image/commit in Dokploy. Database rollback should normally be a forward corrective migration; restore the pre-deployment backup only after confirming that discarding all post-backup writes is acceptable. Test restoration into a separate database before calling backups verified.

## Current limitations requiring a later controlled phase

The schema and audit foundations for imports, accounting locks, and EMI exist, but a production-grade `.xlsx/.xls` streaming parser, object-storage upload UI, PDF generation, background job progress, full custom allocation editor, and end-to-end browser tests require additional dependencies and infrastructure. They are intentionally not falsely represented as verified. CSV/XLSX import should not be enabled in production until file-type scanning, row preview, transactional rollback, and large-file limits are completed and tested.

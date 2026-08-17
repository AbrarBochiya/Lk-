# Production checklist

- [ ] PostgreSQL uses private networking and persistent storage.
- [ ] Required environment variables are set only in Dokploy.
- [ ] `AUTH_SECRET` and Admin password are unique and strong.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, Prisma validation, and `npm run build` pass.
- [ ] Container runs as non-root and `/api/health` is healthy.
- [ ] Domain points to the VPS; TLS is valid; HTTPS is forced.
- [ ] Admin can sign in and bootstrap does not recreate the account.
- [ ] Admin temporary password is changed and sessions behave correctly.
- [ ] Staff/Manager cannot access unassigned shops or Admin URLs.
- [ ] Duplicate sales, negative amounts, and over-allocation are rejected.
- [ ] Reversals preserve originals and audit reasons.
- [ ] Personal withdrawals remain outside operating expenses.
- [ ] Supplier liabilities remain outside profit.
- [ ] Backups, offsite retention, alerts, and restore rehearsal are configured.
- [ ] Responsive QA completed at 320, 375, 390, 430, 768, 820, 1024, 1280, 1440, and 1920px.
- [ ] Chrome, Safari, Edge, and Firefox smoke tests completed.

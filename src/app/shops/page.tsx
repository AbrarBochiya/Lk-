/* eslint-disable @next/next/no-html-link-for-pages */
import { AppShell } from "@/components/app-shell";
import { archiveShopAction, createMarginAction, createShopAction, deleteShopAction, updateShopAction } from "@/app/actions/management";
import { ADMIN_ROLES, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ShopsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const user = await requireUser(ADMIN_ROLES);
  const businesses = await prisma.business.findMany({ orderBy: { name: "asc" } });
  const shops = await prisma.shop.findMany({
    where: query.view === "active" ? { archivedAt: null } : query.view === "archived" ? { archivedAt: { not: null } } : {},
    include: {
      margins: { orderBy: { effectiveFrom: "desc" } },
      _count: { select: { sales: true, expenses: true, bills: true, closings: true, cashMovements: true } },
    },
    orderBy: { name: "asc" },
  });

  return <AppShell user={user}>
    <div className="mx-auto max-w-6xl">
      <p className="label">Organisation</p>
      <h1 className="mt-2 text-4xl font-semibold">Shops &amp; branches</h1>
      <p className="mt-3 text-[#66736b]">Set a separate default gross margin for every shop, with optional overrides for individual months.</p>
      <div className="mt-4 flex gap-2"><a className="button-secondary" href="/shops?view=active">Active</a><a className="button-secondary" href="/shops?view=archived">Archived</a><a className="button-secondary" href="/shops?view=all">All</a></div>

      <details className="card mt-5 p-5">
        <summary className="cursor-pointer font-bold">Add a shop</summary>
        <form action={createShopAction} className="mt-4 grid gap-3 sm:grid-cols-3">
          {businesses.length ? <select className="input" name="businessId">{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select> : <input className="input" name="businessName" defaultValue="LK Ledger Book" />}
          <input className="input" name="name" placeholder="Shop name" required />
          <input className="input" name="code" placeholder="Unique code" />
          <input className="input" name="branch" placeholder="Branch" />
          <input className="input" name="managerName" placeholder="Manager" />
          <input className="input" name="contactNumber" placeholder="Contact" />
          <input className="input" name="city" placeholder="City" />
          <input className="input" name="state" placeholder="State" />
          <input className="input" name="defaultMarginPercent" type="number" min="0" max="100" step="0.01" placeholder="Default gross margin %" required />
          <textarea className="input py-3" name="address" placeholder="Address" />
          <button className="button-primary">Create shop</button>
        </form>
      </details>

      <div className="mt-5 space-y-4">{shops.map((shop) => {
        const related = Object.values(shop._count).some((count) => count > 0);
        return <details className="card p-5" key={shop.id}>
          <summary className="flex cursor-pointer justify-between gap-4">
            <span><b>{shop.name}</b> <small>{shop.code || "No code"} · {shop.archivedAt ? "ARCHIVED" : "ACTIVE"}</small></span>
            <span>{Number(shop.defaultMarginPercent)}% default margin</span>
          </summary>

          <form action={updateShopAction} className="mt-5 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="id" value={shop.id} />
            <input className="input" name="name" defaultValue={shop.name} required />
            <input className="input" name="code" defaultValue={shop.code || ""} placeholder="Code" />
            <input className="input" name="branch" defaultValue={shop.branch || ""} placeholder="Branch" />
            <input className="input" name="managerName" defaultValue={shop.managerName || ""} placeholder="Manager" />
            <input className="input" name="contactNumber" defaultValue={shop.contactNumber || ""} placeholder="Contact" />
            <input className="input" name="openingDate" type="date" defaultValue={shop.openingDate?.toISOString().slice(0, 10)} />
            <input className="input" name="city" defaultValue={shop.city || ""} placeholder="City" />
            <input className="input" name="state" defaultValue={shop.state || ""} placeholder="State" />
            <input className="input" name="address" defaultValue={shop.address || ""} placeholder="Address" />
            <div><label className="mb-2 block text-sm font-semibold" htmlFor={`default-margin-${shop.id}`}>Default gross margin %</label><input className="input" id={`default-margin-${shop.id}`} name="defaultMarginPercent" type="number" min="0" max="100" step="0.01" defaultValue={Number(shop.defaultMarginPercent)} required /></div>
            <button className="button-primary self-end">Save shop details</button>
          </form>

          <form action={createMarginAction} className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-4">
            <input type="hidden" name="shopId" value={shop.id} />
            <div><label className="mb-2 block text-sm font-semibold" htmlFor={`month-${shop.id}`}>Override month</label><input className="input" id={`month-${shop.id}`} name="periodMonth" type="month" required /></div>
            <div><label className="mb-2 block text-sm font-semibold" htmlFor={`margin-${shop.id}`}>Gross margin %</label><input className="input" id={`margin-${shop.id}`} name="marginPercent" type="number" min="0" max="100" step="0.01" required /></div>
            <div><label className="mb-2 block text-sm font-semibold" htmlFor={`note-${shop.id}`}>Reason / note</label><input className="input" id={`note-${shop.id}`} name="note" placeholder="Optional" /></div>
            <button className="button-primary self-end">Save monthly override</button>
          </form>
          <p className="mt-2 text-sm text-[#66736b]">The override applies only to the selected calendar month. Every other month continues using this shop&apos;s default margin.</p>

          {shop.margins.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{shop.margins.slice(0, 12).map((margin) => <span className="rounded-full bg-[#eef4ef] px-3 py-2 text-sm" key={margin.id}>{margin.effectiveFrom.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}: <b>{Number(margin.marginPercent)}%</b>{margin.note ? ` · ${margin.note}` : ""}</span>)}</div>}

          <div className="mt-4 flex flex-wrap gap-2">
            <form action={archiveShopAction}><input type="hidden" name="id" value={shop.id} /><input type="hidden" name="operation" value={shop.archivedAt ? "restore" : "archive"} /><button className="button-secondary">{shop.archivedAt ? "Restore" : "Archive"}</button></form>
            {!related && <form action={deleteShopAction}><input type="hidden" name="id" value={shop.id} /><button className="button-danger">Permanently delete empty shop</button></form>}
            {related && <small className="self-center text-[#66736b]">Permanent deletion is blocked because financial history exists.</small>}
          </div>
        </details>;
      })}</div>
    </div>
  </AppShell>;
}

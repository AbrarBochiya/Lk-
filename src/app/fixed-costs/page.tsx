import { createFixedCostAction } from "@/app/actions/management";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function FixedCostsPage() {
  const user = await requireUser();
  const allShops = ["OWNER", "ADMIN", "ACCOUNTANT"].includes(user.role);
  const allowedIds = user.shopAccess.map((entry) => entry.shopId);
  const [businesses, shops, costs] = await Promise.all([
    prisma.business.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.shop.findMany({ where: { status: "ACTIVE", ...(allShops ? {} : { id: { in: allowedIds } }) }, orderBy: { name: "asc" } }),
    prisma.monthlyFixedCost.findMany({ where: allShops ? {} : { OR: [{ shopId: { in: allowedIds } }, { shopId: null }] }, include: { shop: true }, orderBy: { periodMonth: "desc" }, take: 100 }),
  ]);
  return <AppShell user={user}><div className="mx-auto max-w-6xl"><p className="label">Planning & payments</p><h1 className="mt-2 text-4xl font-semibold">Monthly fixed costs</h1><p className="mt-3 text-[#66736b]">Record rent, salaries, retainers, subscriptions, and other recurring monthly costs without duplicating them as variable expenses.</p>
    <div className="card mt-7 p-6"><h2 className="text-xl font-semibold">Add monthly fixed cost</h2>{businesses.length ? <form action={createFixedCostAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold">Business<select className="input mt-2" name="businessId">{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Shop allocation<select className="input mt-2" name="shopId"><option value="">Central/unallocated</option>{shops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Month<input className="input mt-2" type="month" name="periodMonth" required /></label>
      <label className="text-sm font-semibold">Name<input className="input mt-2" name="name" placeholder="Rent" required /></label>
      <label className="text-sm font-semibold">Category<input className="input mt-2" name="category" required /></label>
      <label className="text-sm font-semibold">Amount<input className="input mt-2" type="number" min="0.01" step="0.01" name="amount" required /></label>
      <label className="text-sm font-semibold">Allocation<select className="input mt-2" name="allocationMethod"><option>UNALLOCATED</option><option>EQUAL</option><option>SALES</option><option>GROSS_PROFIT</option><option>DIRECT</option><option>CUSTOM</option></select></label>
      <label className="text-sm font-semibold">Payment status<select className="input mt-2" name="paymentStatus"><option>UNPAID</option><option>PARTIALLY_PAID</option><option>PAID</option></select></label>
      <label className="text-sm font-semibold">Payment date<input className="input mt-2" type="date" name="paymentDate" /></label>
      <label className="text-sm font-semibold">Vendor<input className="input mt-2" name="vendor" /></label>
      <label className="text-sm font-semibold">Recurring key<input className="input mt-2" name="recurringKey" placeholder="rent-main-shop" /></label>
      <label className="text-sm font-semibold lg:col-span-2">Notes<input className="input mt-2" name="notes" /></label>
      <button className="button-primary sm:w-fit">Save fixed cost</button>
    </form> : <p className="mt-4 text-sm text-[#bd3038]">Create a shop/business first.</p>}</div>
    <div className="card mt-6 overflow-hidden"><div className="border-b p-5"><h2 className="text-xl font-semibold">Recorded fixed costs</h2></div>{costs.length ? <div className="divide-y">{costs.map(cost=><div className="flex justify-between gap-4 p-5" key={cost.id}><div><b>{cost.name}</b><p className="text-sm text-[#66736b]">{cost.periodMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"})} · {cost.shop?.name || "Central"} · {cost.paymentStatus}</p></div><b>{formatCurrency(Number(cost.amount))}</b></div>)}</div> : <p className="p-5 text-sm text-[#66736b]">No monthly fixed costs recorded.</p>}</div>
  </div></AppShell>;
}

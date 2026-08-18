import { createFixedCostAction, duplicateFixedCostsToNextMonthAction } from "@/app/actions/management";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function FixedCostsPage() {
  const user = await requireUser();
  const allShops = ["OWNER", "ADMIN", "ACCOUNTANT"].includes(user.role);
  const allowedIds = user.shopAccess.map((entry) => entry.shopId);
  const [shops, costs] = await Promise.all([
    prisma.shop.findMany({ where: { status: "ACTIVE", ...(allShops ? {} : { id: { in: allowedIds } }) }, orderBy: { name: "asc" } }),
    prisma.monthlyFixedCost.findMany({ where: allShops ? {} : { OR: [{ shopId: { in: allowedIds } }, { shopId: null }] }, include: { shop: true }, orderBy: { periodMonth: "desc" }, take: 100 }),
  ]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  type Cost = (typeof costs)[number];
  type CostGroup = { key: string; month: string; shopId: string | null; shopName: string; costs: Cost[] };
  const groups = Array.from(costs.reduce((map, cost) => {
    const month = cost.periodMonth.toISOString().slice(0, 7);
    const key = `${cost.shopId || "central"}:${month}`;
    const group = map.get(key) || { key, month, shopId: cost.shopId, shopName: cost.shop?.name || "Central", costs: [] };
    group.costs.push(cost);
    map.set(key, group);
    return map;
  }, new Map<string, CostGroup>()).values());

  return <AppShell user={user}><div className="mx-auto max-w-6xl">
    <p className="label">Planning & payments</p>
    <h1 className="mt-2 text-4xl font-semibold">Monthly fixed costs</h1>
    <p className="mt-3 text-[#66736b]">Record the main monthly expenses for each branch and reuse them in future months.</p>
    <div className="card mt-7 p-6">
      <h2 className="text-xl font-semibold">Add monthly branch expenses</h2>
      <p className="mt-2 text-sm text-[#66736b]">Leave an unused expense at zero. Saving the same branch and month again updates it instead of creating a duplicate.</p>
      {shops.length ? <form action={createFixedCostAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-semibold">Branch<select className="input mt-2" name="shopId" required><option value="">Select branch</option>{shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Month<input className="input mt-2" type="month" name="periodMonth" defaultValue={currentMonth} required /></label>
        <label className="text-sm font-semibold">Continue these amounts<select className="input mt-2" name="repeatMonths" defaultValue="1"><option value="1">Only this month</option><option value="3">This month + next 2 months</option><option value="6">Continue for 6 months</option><option value="12">Continue for 12 months</option></select></label>
        <label className="text-sm font-semibold">Rent amount<input className="input mt-2" type="number" min="0" step="0.01" name="rent" defaultValue="0" /></label>
        <label className="text-sm font-semibold">Salaries amount<input className="input mt-2" type="number" min="0" step="0.01" name="salaries" defaultValue="0" /></label>
        <label className="text-sm font-semibold">Electricity bill amount<input className="input mt-2" type="number" min="0" step="0.01" name="electricity" defaultValue="0" /></label>
        <label className="text-sm font-semibold">Tea and others amount<input className="input mt-2" type="number" min="0" step="0.01" name="teaAndOthers" defaultValue="0" /></label>
        <label className="text-sm font-semibold">Other expense amount<input className="input mt-2" type="number" min="0" step="0.01" name="otherExpense" defaultValue="0" /></label>
        <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Notes (optional)<input className="input mt-2" name="notes" /></label>
        <button className="button-primary sm:w-fit">Save monthly expenses</button>
      </form> : <p className="mt-4 text-sm text-[#bd3038]">Create a branch first.</p>}
    </div>
    <div className="card mt-6 overflow-hidden">
      <div className="border-b p-5"><h2 className="text-xl font-semibold">Recorded monthly expenses</h2></div>
      {groups.length ? <div className="divide-y">{groups.map((group) => <div className="p-5" key={group.key}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><b>{group.shopName}</b><p className="text-sm text-[#66736b]">{new Date(`${group.month}-01T00:00:00.000Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}</p></div>
          <div className="text-right"><b>{formatCurrency(group.costs.reduce((sum, cost) => sum + Number(cost.amount), 0))}</b>{group.shopId ? <form action={duplicateFixedCostsToNextMonthAction} className="mt-2"><input type="hidden" name="shopId" value={group.shopId} /><input type="hidden" name="sourceMonth" value={group.month} /><button className="text-sm font-semibold text-[#0d4a35] underline">Copy all to next month</button></form> : null}</div>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{group.costs.map((cost) => <div className="flex justify-between rounded-xl bg-[#f5f7f3] px-3 py-2" key={cost.id}><span>{cost.name}</span><b>{formatCurrency(Number(cost.amount))}</b></div>)}</div>
      </div>)}</div> : <p className="p-5 text-sm text-[#66736b]">No monthly expenses recorded.</p>}
    </div>
  </div></AppShell>;
}

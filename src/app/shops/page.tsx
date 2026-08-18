import { AppShell } from "@/components/app-shell";
import { createShopAction, updateShopStatusAction } from "@/app/actions/management";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ShopsPage() {
  const user = await requireUser(["ADMIN"]);
  const [businesses, shops] = await Promise.all([prisma.business.findMany({ where: { status: "ACTIVE" } }), prisma.shop.findMany({ include: { business: true }, orderBy: { createdAt: "desc" } })]);
  return <AppShell user={user}><div className="mx-auto max-w-6xl"><p className="label">Organisation</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Shops & branches</h1><p className="mt-3 text-[#66736b]">Add every shop location with its branch, manager, contact, and targets.</p>
    <div className="card mt-7 p-5 sm:p-7"><h2 className="text-xl font-semibold">Add shop</h2><form action={createShopAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.length ? <label className="text-sm font-semibold">Business<select className="input mt-2" name="businessId" required>{businesses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label> : <label className="text-sm font-semibold">Business name<input className="input mt-2" name="businessName" defaultValue="LK Ledger Book" required /></label>}
      <label className="text-sm font-semibold">Shop name<input className="input mt-2" name="name" placeholder="LK Fashion" required /></label><label className="text-sm font-semibold">Branch<input className="input mt-2" name="branch" placeholder="Main Road" /></label>
      <label className="text-sm font-semibold">Manager<input className="input mt-2" name="managerName" /></label><label className="text-sm font-semibold">Contact number<input className="input mt-2" name="contactNumber" /></label><label className="text-sm font-semibold">City<input className="input mt-2" name="city" /></label>
      <label className="text-sm font-semibold">State<input className="input mt-2" name="state" /></label><label className="text-sm font-semibold">Daily target<input className="input mt-2" name="dailyTarget" type="number" min="0" step="0.01" /></label><label className="text-sm font-semibold">Monthly target<input className="input mt-2" name="monthlyTarget" type="number" min="0" step="0.01" /></label>
      <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Address<textarea className="input mt-2 min-h-20 py-3" name="address" /></label><button className="button-primary sm:w-fit" type="submit">Add shop</button>
    </form></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{shops.map(shop=><div className="card p-5" key={shop.id}><div className="flex justify-between gap-4"><div><h3 className="font-semibold">{shop.name}</h3><p className="text-sm text-[#66736b]">{shop.branch || "Main branch"} · {shop.city || "City not set"}</p><p className="mt-2 text-xs text-[#66736b]">Manager: {shop.managerName || "Not assigned"}</p></div><span className="text-xs font-bold">{shop.status}</span></div><form action={updateShopStatusAction} className="mt-4 flex gap-2"><input name="id" type="hidden" value={shop.id}/><select className="input" name="status" defaultValue={shop.status}><option>ACTIVE</option><option>INACTIVE</option></select><button className="button-primary" type="submit">Save</button></form></div>)}</div>
  </div></AppShell>;
}

import { AppShell } from "@/components/app-shell";
import { createUserAction, updateUserAction } from "@/app/actions/management";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function UsersPage() {
  const current = await requireUser(["ADMIN"]);
  const [users, shops] = await Promise.all([
    prisma.user.findMany({ include: { shopAccess: { include: { shop: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.shop.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  return <AppShell user={current}><div className="mx-auto max-w-6xl">
    <p className="label">Administration</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Users & roles</h1>
    <p className="mt-3 text-[#66736b]">Create staff accounts, assign roles, control status, and grant branch access.</p>
    <div className="card mt-7 p-5 sm:p-7"><h2 className="text-xl font-semibold">Add user</h2>
      <form action={createUserAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">Name<input className="input mt-2" name="name" required /></label>
        <label className="text-sm font-semibold">Email<input className="input mt-2" name="email" type="email" required /></label>
        <label className="text-sm font-semibold">Temporary password<input className="input mt-2" name="password" type="password" minLength={12} required /></label>
        <label className="text-sm font-semibold">Role<select className="input mt-2" name="role"><option>STAFF</option><option>MANAGER</option><option>ADMIN</option></select></label>
        {shops.length > 0 && <fieldset className="sm:col-span-2 lg:col-span-4"><legend className="text-sm font-semibold">Shop access</legend><div className="mt-2 flex flex-wrap gap-4">{shops.map(shop=><label className="flex items-center gap-2 text-sm" key={shop.id}><input name="shopIds" type="checkbox" value={shop.id}/>{shop.name}{shop.branch ? ` — ${shop.branch}` : ""}</label>)}</div></fieldset>}
        <button className="button-primary sm:w-fit" type="submit">Create user</button>
      </form>
    </div>
    <div className="mt-6 grid gap-4">{users.map(user=><div className="card p-5" key={user.id}><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="font-semibold">{user.name}</h3><p className="text-sm text-[#66736b]">{user.email}</p><p className="mt-1 text-xs text-[#66736b]">{user.shopAccess.length ? user.shopAccess.map(x=>x.shop.name).join(", ") : user.role === "ADMIN" ? "All shops" : "No shop assigned"}</p></div><form action={updateUserAction} className="flex flex-wrap items-end gap-3"><input name="id" type="hidden" value={user.id}/><label className="text-xs font-semibold">Role<select className="input mt-1 min-w-32" name="role" defaultValue={user.role}><option>STAFF</option><option>MANAGER</option><option>ADMIN</option></select></label><label className="text-xs font-semibold">Status<select className="input mt-1 min-w-32" name="status" defaultValue={user.status}><option>ACTIVE</option><option>INACTIVE</option></select></label><button className="button-primary" type="submit">Update</button></form></div></div>)}</div>
  </div></AppShell>;
}

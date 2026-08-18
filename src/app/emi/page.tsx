import { createEmiPaymentAction } from "@/app/actions/management";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function EmiPage() {
  const user = await requireUser();
  const unrestricted = ["OWNER", "ADMIN", "ACCOUNTANT"].includes(user.role);
  const allowedIds = user.shopAccess.map(x=>x.shopId);
  const [businesses, shops, payments] = await Promise.all([
    prisma.business.findMany({ where: { status: "ACTIVE" } }),
    prisma.shop.findMany({ where: { status: "ACTIVE", ...(unrestricted ? {} : { id: { in: allowedIds } }) }, orderBy: { name: "asc" } }),
    prisma.emiPayment.findMany({ where: unrestricted ? {} : { OR: [{ shopId: { in: allowedIds } }, { shopId: null }] }, include: { loan: true, shop: true }, orderBy: { dueDate: "desc" }, take: 100 }),
  ]);
  return <AppShell user={user}><div className="mx-auto max-w-6xl"><p className="label">Finance</p><h1 className="mt-2 text-4xl font-semibold">Loans & EMI</h1><p className="mt-3 text-[#66736b]">Track principal and interest separately so cash flow and profit reports remain correct.</p>
    <div className="card mt-7 p-6"><h2 className="text-xl font-semibold">Add EMI payment</h2>{businesses.length ? <form action={createEmiPaymentAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="businessId" value={businesses[0].id}/><label className="text-sm font-semibold">Loan name<input className="input mt-2" name="loanName" required /></label><label className="text-sm font-semibold">Lender<input className="input mt-2" name="lender" required /></label><label className="text-sm font-semibold">Loan start<input className="input mt-2" type="date" name="startDate" /></label><label className="text-sm font-semibold">Due date<input className="input mt-2" type="date" name="dueDate" required /></label>
      <label className="text-sm font-semibold">Shop<select className="input mt-2" name="shopId"><option value="">Central</option>{shops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="text-sm font-semibold">Total EMI<input className="input mt-2" type="number" step="0.01" min="0.01" name="totalAmount" required /></label><label className="text-sm font-semibold">Principal<input className="input mt-2" type="number" step="0.01" min="0" name="principalAmount" required /></label><label className="text-sm font-semibold">Interest<input className="input mt-2" type="number" step="0.01" min="0" name="interestAmount" required /></label>
      <label className="text-sm font-semibold">Status<select className="input mt-2" name="paymentStatus"><option>UNPAID</option><option>PARTIALLY_PAID</option><option>PAID</option></select></label><label className="text-sm font-semibold">Paid date<input className="input mt-2" type="date" name="paidDate" /></label><label className="text-sm font-semibold">Allocation<select className="input mt-2" name="allocationMethod"><option>UNALLOCATED</option><option>EQUAL</option><option>SALES</option><option>GROSS_PROFIT</option><option>DIRECT</option><option>CUSTOM</option></select></label><label className="text-sm font-semibold">Notes<input className="input mt-2" name="notes" /></label><button className="button-primary sm:w-fit">Save EMI</button>
    </form> : <p className="mt-4 text-sm text-[#bd3038]">Create a shop/business first.</p>}</div>
    <div className="card mt-6 overflow-hidden">{payments.length ? <div className="divide-y">{payments.map(p=><div className="flex justify-between gap-4 p-5" key={p.id}><div><b>{p.loan.name}</b><p className="text-sm text-[#66736b]">{p.loan.lender} · {p.shop?.name || "Central"} · Due {p.dueDate.toLocaleDateString("en-IN")} · {p.paymentStatus}</p><p className="text-xs text-[#66736b]">Principal {formatCurrency(Number(p.principalAmount))} · Interest {formatCurrency(Number(p.interestAmount))}</p></div><b>{formatCurrency(Number(p.totalAmount))}</b></div>)}</div> : <p className="p-5 text-sm text-[#66736b]">No EMI records.</p>}</div>
  </div></AppShell>;
}

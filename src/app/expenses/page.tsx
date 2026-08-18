import { AppShell } from "@/components/app-shell";
import { createExpenseAction } from "@/app/actions/management";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function ExpensesPage() {
  const user = await requireUser();
  const allowed = user.role === "ADMIN" ? undefined : user.shopAccess.map(x=>x.shopId);
  const [businesses, shops, categories, expenses] = await Promise.all([
    prisma.business.findMany({ where: { status: "ACTIVE" } }), prisma.shop.findMany({ where: { status: "ACTIVE", ...(allowed ? { id: { in: allowed } } : {}) } }),
    prisma.expenseCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }), prisma.expense.findMany({ where: allowed ? { shopId: { in: allowed } } : undefined, include: { category: true, shop: true }, orderBy: { expenseDate: "desc" }, take: 50 }),
  ]);
  return <AppShell user={user}><div className="mx-auto max-w-6xl"><p className="label">Money out</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Expenses</h1><p className="mt-3 text-[#66736b]">Record one-time or fixed recurring expenses for a shop or the central business.</p>
    <div className="card mt-7 p-5 sm:p-7"><h2 className="text-xl font-semibold">Add expense</h2>{!businesses.length ? <p className="mt-4 text-sm text-[#bd3038]">Create a shop first to create the business workspace.</p> : <form action={createExpenseAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold">Date<input className="input mt-2" name="expenseDate" type="date" required /></label><label className="text-sm font-semibold">Business<select className="input mt-2" name="businessId">{businesses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Expense type<select className="input mt-2" name="type"><option value="SHOP">Shop</option><option value="CENTRAL">Central business</option><option value="PERSONAL">Personal/withdrawal</option></select></label><label className="text-sm font-semibold">Shop<select className="input mt-2" name="shopId"><option value="">Not applicable</option>{shops.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Category<input className="input mt-2" name="category" list="expense-categories" required/><datalist id="expense-categories">{categories.map(x=><option key={x.id} value={x.name}/>)}</datalist></label><label className="text-sm font-semibold">Description<input className="input mt-2" name="description" required /></label><label className="text-sm font-semibold">Amount<input className="input mt-2" name="amount" type="number" min="0.01" step="0.01" required /></label>
      <label className="text-sm font-semibold">Payment method<select className="input mt-2" name="paymentMethod"><option>CASH</option><option>UPI</option><option>CARD</option><option>BANK_TRANSFER</option><option>CHEQUE</option><option>OTHER</option></select></label><label className="text-sm font-semibold">Vendor/payee<input className="input mt-2" name="vendor" /></label><label className="text-sm font-semibold">Frequency<select className="input mt-2" name="frequency"><option>MONTHLY</option><option>WEEKLY</option><option>QUARTERLY</option><option>YEARLY</option></select></label><label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input name="isFixed" type="checkbox"/> Fixed recurring expense</label>
      <label className="text-sm font-semibold sm:col-span-2 lg:col-span-4">Notes<textarea className="input mt-2 min-h-20 py-3" name="notes" /></label><button className="button-primary sm:w-fit" type="submit">Save expense</button>
    </form>}</div>
    <div className="card mt-6 overflow-hidden"><div className="border-b border-[#dfe5df] p-5"><h2 className="text-xl font-semibold">Recent expenses</h2></div>{expenses.length ? <div className="divide-y divide-[#dfe5df]">{expenses.map(x=><div className="flex flex-col justify-between gap-2 p-5 sm:flex-row sm:items-center" key={x.id}><div><b>{x.description}</b><p className="text-sm text-[#66736b]">{x.category.name} · {x.shop?.name || x.type} · {x.expenseDate.toLocaleDateString("en-IN")}{x.isFixed ? ` · Fixed ${x.frequency?.toLowerCase()}` : ""}</p></div><b className="currency">{formatCurrency(Number(x.amount))}</b></div>)}</div> : <p className="p-5 text-sm text-[#66736b]">No expenses recorded yet.</p>}</div>
  </div></AppShell>;
}

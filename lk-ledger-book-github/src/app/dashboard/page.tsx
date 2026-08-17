import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Building2, CircleAlert, IndianRupee, ReceiptText, ShoppingBag, Store, TrendingUp, Truck, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardChart } from "@/components/dashboard-chart";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatPercent } from "@/lib/utils";

const quick = [["Add Sale", "/sales/new", ShoppingBag], ["Add Expense", "/expenses/new", ReceiptText], ["Add Bill", "/bills/new", Truck], ["Daily Closing", "/daily-closing", CircleAlert]] as const;

export default async function Dashboard() {
  const user = await requireUser(); const data = await getDashboardData(user);
  const kpis = [
    ["Net sales", data.netSales, "Sales after returns", ShoppingBag, "positive"], ["Gross profit", data.grossProfit, formatPercent(data.grossMargin), TrendingUp, "positive"],
    ["Operating expenses", data.operatingExpenses, `${formatPercent(data.expenseRatio)} of sales`, ReceiptText, "neutral"], ["Operating profit", data.operatingProfit, formatPercent(data.operatingMargin), IndianRupee, data.operatingProfit >= 0 ? "positive" : "negative"],
    ["Supplier outstanding", data.outstanding, `${formatCurrency(data.overdue)} overdue`, Truck, data.overdue > 0 ? "negative" : "neutral"], ["After withdrawals", data.profitAfterWithdrawals, `${formatCurrency(data.personal)} personal`, Building2, "neutral"],
  ] as const;
  return <AppShell user={user}><div className="mx-auto max-w-[1580px]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="label">Management overview</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Good day, {user.name.split(" ")[0]}</h1><p className="mt-2 text-sm text-[#68756d]">Your live financial position for the current month.</p></div><div className="grid grid-cols-2 gap-2 sm:flex">{quick.map(([label, href, Icon]) => <Link className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-bold hover:border-[#1d6a49]" key={href} href={href}><Icon className="size-4 text-[#1d6a49]" />{label}</Link>)}</div></div>
    <section aria-label="Key performance indicators" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{kpis.map(([label, value, note, Icon, tone]) => <Link href={label.includes("Supplier") ? "/outstanding" : "/reports"} key={label} className="card group p-5 transition hover:-translate-y-0.5 hover:border-[#bfcabe]"><div className="flex items-start justify-between"><div><p className="label">{label}</p><p className="currency mt-3 text-3xl font-semibold">{formatCurrency(value)}</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#edf3ed] text-[#1d6a49]"><Icon className="size-5" /></span></div><div className="mt-4 flex items-center justify-between border-t border-[#edf0ed] pt-3 text-xs text-[#6c7870]"><span>{note}</span>{tone === "positive" ? <ArrowUpRight className="size-4 text-[#17824f]" /> : tone === "negative" ? <ArrowDownRight className="size-4 text-[#bd3038]" /> : <span>View details →</span>}</div></Link>)}</section>
    <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.85fr]"><div className="card p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="label">Performance trend</p><h2 className="mt-1 text-xl font-semibold">Sales and gross profit</h2></div><span className="rounded-full bg-[#eff3ee] px-3 py-1 text-xs font-semibold text-[#536158]">This month</span></div><DashboardChart data={data.chart} /></div>
      <div className="card p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="label">Shop ranking</p><h2 className="mt-1 text-xl font-semibold">Sales contribution</h2></div><Store className="size-5 text-[#1d6a49]" /></div><div className="mt-5 space-y-5">{data.ranking.length ? data.ranking.slice(0,5).map((shop, i) => <div key={shop.name}><div className="flex items-center justify-between text-sm"><span className="font-semibold"><span className="mr-2 text-[#9aa49d]">0{i+1}</span>{shop.name}</span><span className="currency font-bold">{formatCurrency(shop.sales)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8ede8]"><div className="h-full rounded-full bg-[#1d6a49]" style={{width:`${data.ranking[0]?.sales ? shop.sales/data.ranking[0].sales*100 : 0}%`}} /></div></div>) : <div className="grid min-h-56 place-items-center text-center text-sm text-[#738078]"><div><Store className="mx-auto mb-3 size-8 opacity-40" /><b className="text-[#33453a]">No shop activity yet</b><p className="mt-1">Rankings appear after sales are posted.</p></div></div>}</div></div></section>
    <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      {label:"Active shops",value:String(data.shopCount),Icon:Store},
      {label:"Bills recorded",value:String(data.totalBills),Icon:ReceiptText},
      {label:"Customers",value:String(data.totalCustomers),Icon:Users},
      {label:"Average / shop",value:formatCurrency(data.averageShop),Icon:IndianRupee},
    ].map(({label,value,Icon}) => <div className="card p-4" key={label}><Icon className="size-4 text-[#1d6a49]" /><p className="mt-4 text-xs text-[#6b776f]">{label}</p><p className="currency mt-1 text-xl font-bold">{value}</p></div>)}</section>
  </div></AppShell>;
}

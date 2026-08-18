"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSaleAction } from "@/app/actions/sales";
import { calculateSale } from "@/lib/financial";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { toast } from "sonner";

function Submit() { const { pending } = useFormStatus(); return <button disabled={pending} className="button-primary w-full sm:w-auto" type="submit">{pending ? "Saving sale…" : "Save daily sale"}</button>; }

export function SaleForm({ shops }: { shops: Array<{id:string;name:string}> }) {
  const [values, setValues] = useState({cash:0,upi:0,card:0,bank:0,other:0});
  const total = useMemo(() => calculateSale(values), [values]);
  const field = (key: keyof typeof values, label: string) => <div><label className="mb-2 block text-sm font-semibold" htmlFor={key}>{label}</label><input className="input" id={key} name={`${key}${key === "cash" || key === "upi" || key === "card" || key === "bank" || key === "other" ? "Sales" : ""}`} type="number" inputMode="decimal" min="0" step="0.01" value={values[key]} onChange={(e)=>setValues(v=>({...v,[key]:Number(e.target.value)}))} required /></div>;
  return <form action={async (formData) => { const result = await createSaleAction(formData); if (result.ok) toast.success("Daily sale saved"); else toast.error(result.error); }} className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold" htmlFor="saleDate">Date</label><input className="input" id="saleDate" name="saleDate" type="date" required /></div><div><label className="mb-2 block text-sm font-semibold" htmlFor="shopId">Shop</label><select className="input" id="shopId" name="shopId" required><option value="">Select shop</option>{shops.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div></div>
    <fieldset><legend className="mb-4 text-lg font-semibold">Payment breakdown</legend><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{field("cash","Cash")}{field("upi","UPI")}{field("card","Card")}{field("bank","Bank transfer")}{field("other","Other")}</div></fieldset>
    <div className="grid gap-3 rounded-2xl bg-[#123f2d] p-5 text-white sm:grid-cols-4"><div><p className="text-xs text-white/55">Gross sales</p><b className="currency mt-1 block text-xl">{formatCurrency(total.grossSales)}</b></div><div><p className="text-xs text-white/55">Net sales</p><b className="currency mt-1 block text-xl">{formatCurrency(total.netSales)}</b></div><div><p className="text-xs text-white/55">Gross profit</p><b className="currency mt-1 block text-xl">{formatCurrency(total.grossProfit)}</b></div><div><p className="text-xs text-white/55">Gross margin</p><b className="mt-1 block text-xl">{formatPercent(total.grossMargin)}</b></div></div>
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="notes">Notes</label><textarea className="input min-h-24 py-3" id="notes" name="notes" maxLength={2000} /></div><Submit />
  </form>;
}

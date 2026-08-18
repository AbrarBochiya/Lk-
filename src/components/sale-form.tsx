"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createSaleAction } from "@/app/actions/sales";
import { calculateCogsFromMargin, calculateSale } from "@/lib/financial";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { toast } from "sonner";

type ShopOption = {
  id: string;
  name: string;
  defaultMarginPercent: number;
  monthlyMargins: Array<{ periodMonth: string; marginPercent: number }>;
};

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="button-primary w-full sm:w-auto" type="submit">{pending ? "Saving sale…" : "Save daily sale"}</button>;
}

function localDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function SaleForm({ shops }: { shops: ShopOption[] }) {
  const [values, setValues] = useState({ cash: 0, upi: 0, card: 0, bank: 0, other: 0 });
  const [saleDate, setSaleDate] = useState(localDate);
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const selectedShop = shops.find((shop) => shop.id === shopId);
  const monthlyOverride = selectedShop?.monthlyMargins.find((margin) => margin.periodMonth === saleDate.slice(0, 7));
  const appliedMargin = monthlyOverride?.marginPercent ?? selectedShop?.defaultMarginPercent ?? 0;
  const paymentTotal = Object.values(values).reduce((sum, value) => sum + value, 0);
  const totals = calculateSale({ ...values, cogs: calculateCogsFromMargin(paymentTotal, appliedMargin) });

  const field = (key: keyof typeof values, label: string) => (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={key}>{label}</label>
      <input
        className="input"
        id={key}
        name={`${key}Sales`}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={values[key]}
        onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
        required
      />
    </div>
  );

  return <form action={async (formData) => {
    const result = await createSaleAction(formData);
    if (result.ok) toast.success("Daily sale saved");
    else toast.error(result.error);
  }} className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="saleDate">Date</label>
        <input className="input" id="saleDate" name="saleDate" type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="shopId">Shop</label>
        <select className="input" id="shopId" name="shopId" value={shopId} onChange={(event) => setShopId(event.target.value)} required>
          <option value="">Select shop</option>
          {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
        </select>
      </div>
    </div>

    {selectedShop && <p className="rounded-xl bg-[#eef4ef] px-4 py-3 text-sm text-[#52635a]">
      Using <b>{formatPercent(appliedMargin)}</b> {monthlyOverride ? "monthly override" : "default margin"} for {selectedShop.name}. Gross profit is calculated automatically.
    </p>}

    <fieldset>
      <legend className="mb-4 text-lg font-semibold">Payment breakdown</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{field("cash", "Cash")}{field("upi", "UPI")}{field("card", "Card")}{field("bank", "Bank transfer")}{field("other", "Other")}</div>
    </fieldset>

    <div className="grid gap-3 rounded-2xl bg-[#123f2d] p-5 text-white sm:grid-cols-4">
      <div><p className="text-xs text-white/55">Gross sales</p><b className="currency mt-1 block text-xl">{formatCurrency(totals.grossSales)}</b></div>
      <div><p className="text-xs text-white/55">Net sales</p><b className="currency mt-1 block text-xl">{formatCurrency(totals.netSales)}</b></div>
      <div><p className="text-xs text-white/55">Gross profit</p><b className="currency mt-1 block text-xl">{formatCurrency(totals.grossProfit)}</b></div>
      <div><p className="text-xs text-white/55">Gross margin</p><b className="mt-1 block text-xl">{formatPercent(totals.grossMargin)}</b></div>
    </div>

    <div><label className="mb-2 block text-sm font-semibold" htmlFor="notes">Notes</label><textarea className="input min-h-24 py-3" id="notes" name="notes" maxLength={2000} /></div>
    <Submit />
  </form>;
}

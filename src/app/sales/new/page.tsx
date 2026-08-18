import { AppShell } from "@/components/app-shell";
import { SaleForm } from "@/components/sale-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewSalePage() {
  const user = await requireUser();
  const allowed = user.role === "ADMIN" ? undefined : user.shopAccess.map((access) => access.shopId);
  const shops = await prisma.shop.findMany({
    where: { status: "ACTIVE", ...(allowed ? { id: { in: allowed } } : {}) },
    select: {
      id: true,
      name: true,
      defaultMarginPercent: true,
      margins: {
        select: { effectiveFrom: true, marginPercent: true },
        orderBy: { effectiveFrom: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const shopOptions = shops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    defaultMarginPercent: Number(shop.defaultMarginPercent),
    monthlyMargins: shop.margins.map((margin) => ({
      periodMonth: margin.effectiveFrom.toISOString().slice(0, 7),
      marginPercent: Number(margin.marginPercent),
    })),
  }));

  return <AppShell user={user}>
    <div className="mx-auto max-w-6xl">
      <p className="label">Fast entry</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Daily sales</h1>
      <p className="mt-3 text-[#66736b]">Enter the shop&apos;s daily payment totals. Profit uses that shop&apos;s default margin unless the selected month has an override.</p>
      <div className="card mt-7 p-5 sm:p-7"><SaleForm shops={shopOptions} /></div>
    </div>
  </AppShell>;
}

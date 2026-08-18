import { AppShell } from "@/components/app-shell";
import { SaleForm } from "@/components/sale-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewSalePage() {
  const user = await requireUser(); const allowed = user.role === "ADMIN" ? undefined : user.shopAccess.map(x=>x.shopId);
  const shops = await prisma.shop.findMany({where:{status:"ACTIVE",...(allowed?{id:{in:allowed}}:{})},select:{id:true,name:true}});
  return <AppShell user={user}><div className="mx-auto max-w-6xl"><p className="label">Fast entry</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Daily sales</h1><p className="mt-3 text-[#66736b]">Enter the shop's daily payment totals. The business is selected automatically from the shop.</p><div className="card mt-7 p-5 sm:p-7"><SaleForm shops={shops} /></div></div></AppShell>;
}

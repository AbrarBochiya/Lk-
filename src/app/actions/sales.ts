"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canAccessShop, requireUser } from "@/lib/auth";
import { saleSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function createSaleAction(formData: FormData) {
  const user = await requireUser();
  const parsed = saleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid sale" };
  if (!canAccessShop(user, parsed.data.shopId)) return { ok: false, error: "You do not have access to this shop." };
  try {
    const sale = await prisma.dailySale.create({ data: { ...parsed.data, createdById: user.id, updatedById: user.id } });
    await writeAudit({ userId: user.id, action: "CREATE", module: "SALES", recordId: sale.id, newValue: parsed.data });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (String(error).includes("Unique constraint")) return { ok: false, error: "A sale already exists for this shop, date, and shift." };
    return { ok: false, error: "The sale could not be saved." };
  }
}

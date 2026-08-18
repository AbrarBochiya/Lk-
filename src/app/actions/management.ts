"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canAccessShop, requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function createUserAction(data: FormData) {
  const actor = await requireUser(["ADMIN"]);
  const name = text(data, "name");
  const email = text(data, "email").toLowerCase();
  const password = text(data, "password");
  const role = text(data, "role") as "ADMIN" | "MANAGER" | "STAFF";
  const shopIds = data.getAll("shopIds").map(String);
  if (!name || !email.includes("@") || password.length < 12 || !["ADMIN", "MANAGER", "STAFF"].includes(role)) return;
  const user = await prisma.user.create({
    data: {
      name, email, passwordHash: await bcrypt.hash(password, 12), role,
      shopAccess: { create: shopIds.map((shopId) => ({ shopId, canEdit: role !== "STAFF", canApprove: role === "MANAGER" })) },
    },
  });
  await writeAudit({ userId: actor.id, action: "CREATE", module: "USERS", recordId: user.id, newValue: { name, email, role, shopIds } });
  revalidatePath("/users");
}

export async function updateUserAction(data: FormData) {
  const actor = await requireUser(["ADMIN"]);
  const id = text(data, "id");
  const role = text(data, "role") as "ADMIN" | "MANAGER" | "STAFF";
  const status = text(data, "status") as "ACTIVE" | "INACTIVE";
  if (!id || !["ADMIN", "MANAGER", "STAFF"].includes(role) || !["ACTIVE", "INACTIVE"].includes(status)) return;
  if (id === actor.id && (status === "INACTIVE" || role !== "ADMIN")) return;
  await prisma.user.update({ data: { role, status, sessionVersion: { increment: 1 } }, where: { id } });
  await writeAudit({ userId: actor.id, action: "UPDATE", module: "USERS", recordId: id, newValue: { role, status } });
  revalidatePath("/users");
}

export async function createShopAction(data: FormData) {
  const actor = await requireUser(["ADMIN"]);
  const name = text(data, "name");
  if (!name) return;
  let businessId = text(data, "businessId");
  if (!businessId) {
    const businessName = text(data, "businessName") || "LK Ledger Book";
    businessId = (await prisma.business.create({ data: { name: businessName } })).id;
  }
  const shop = await prisma.shop.create({ data: {
    businessId, name, branch: text(data, "branch") || null, address: text(data, "address") || null,
    city: text(data, "city") || null, state: text(data, "state") || null,
    managerName: text(data, "managerName") || null, contactNumber: text(data, "contactNumber") || null,
    monthlyTarget: text(data, "monthlyTarget") || null, dailyTarget: text(data, "dailyTarget") || null,
  }});
  await writeAudit({ userId: actor.id, action: "CREATE", module: "SHOPS", recordId: shop.id, newValue: { name, businessId } });
  revalidatePath("/shops"); revalidatePath("/sales/new");
}

export async function updateShopStatusAction(data: FormData) {
  const actor = await requireUser(["ADMIN"]);
  const id = text(data, "id");
  const status = text(data, "status") as "ACTIVE" | "INACTIVE";
  if (!id || !["ACTIVE", "INACTIVE"].includes(status)) return;
  await prisma.shop.update({ where: { id }, data: { status } });
  await writeAudit({ userId: actor.id, action: "UPDATE", module: "SHOPS", recordId: id, newValue: { status } });
  revalidatePath("/shops");
}

export async function createExpenseAction(data: FormData) {
  const actor = await requireUser();
  const description = text(data, "description");
  const amount = text(data, "amount");
  const categoryName = text(data, "category");
  const businessId = text(data, "businessId");
  const type = text(data, "type") as "SHOP" | "CENTRAL" | "PERSONAL";
  const shopId = text(data, "shopId") || null;
  if (!description || !amount || !categoryName || !businessId || !["SHOP", "CENTRAL", "PERSONAL"].includes(type)) return;
  if (type === "SHOP" && (!shopId || !canAccessShop(actor, shopId))) return;
  if (type !== "SHOP" && actor.role !== "ADMIN") return;
  const category = await prisma.expenseCategory.upsert({ where: { name: categoryName }, update: { isActive: true }, create: { name: categoryName } });
  const expense = await prisma.expense.create({ data: {
    businessId, shopId: type === "SHOP" ? shopId : null, categoryId: category.id,
    expenseDate: new Date(`${text(data, "expenseDate")}T00:00:00.000Z`), type, description, amount,
    paymentMethod: text(data, "paymentMethod") as "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
    vendor: text(data, "vendor") || null, notes: text(data, "notes") || null,
    isFixed: data.get("isFixed") === "on", frequency: data.get("isFixed") === "on" ? text(data, "frequency") || "MONTHLY" : null,
    createdById: actor.id, updatedById: actor.id,
  }});
  await writeAudit({ userId: actor.id, action: "CREATE", module: "EXPENSES", recordId: expense.id, newValue: { description, amount, type, shopId } });
  revalidatePath("/expenses"); revalidatePath("/dashboard");
}

"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ADMIN_ROLES, canAccessShop, requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function createUserAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const name = text(data, "name");
  const email = text(data, "email").toLowerCase();
  const password = text(data, "password");
  const roles = ["OWNER","ADMIN","ACCOUNTANT","SHOP_MANAGER","DATA_ENTRY","VIEWER","MANAGER","STAFF"] as const;
  const role = text(data, "role") as typeof roles[number];
  const shopIds = data.getAll("shopIds").map(String);
  if (!name || !email.includes("@") || password.length < 12 || !roles.includes(role)) return;
  const user = await prisma.user.create({
    data: {
      name, email, passwordHash: await bcrypt.hash(password, 12), role,
      shopAccess: { create: shopIds.map((shopId) => ({ shopId, canEdit: !["STAFF","DATA_ENTRY","VIEWER"].includes(role), canApprove: ["MANAGER","SHOP_MANAGER","ACCOUNTANT"].includes(role) })) },
    },
  });
  await writeAudit({ userId: actor.id, action: "CREATE", module: "USERS", recordId: user.id, newValue: { name, email, role, shopIds } });
  revalidatePath("/users");
}

export async function updateUserAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const id = text(data, "id");
  const roles = ["OWNER","ADMIN","ACCOUNTANT","SHOP_MANAGER","DATA_ENTRY","VIEWER","MANAGER","STAFF"] as const;
  const role = text(data, "role") as typeof roles[number];
  const status = text(data, "status") as "ACTIVE" | "INACTIVE";
  if (!id || !roles.includes(role) || !["ACTIVE", "INACTIVE"].includes(status)) return;
  if (id === actor.id && (status === "INACTIVE" || !["OWNER","ADMIN"].includes(role))) return;
  await prisma.user.update({ data: { role, status, sessionVersion: { increment: 1 } }, where: { id } });
  await writeAudit({ userId: actor.id, action: "UPDATE", module: "USERS", recordId: id, newValue: { role, status } });
  revalidatePath("/users");
}

export async function createShopAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const name = text(data, "name");
  if (!name) return;
  let businessId = text(data, "businessId");
  if (!businessId) {
    const businessName = text(data, "businessName") || "LK Ledger Book";
    businessId = (await prisma.business.create({ data: { name: businessName } })).id;
  }
  const shop = await prisma.shop.create({ data: {
    businessId, name, code: text(data, "code") || null, branch: text(data, "branch") || null, address: text(data, "address") || null,
    city: text(data, "city") || null, state: text(data, "state") || null,
    managerName: text(data, "managerName") || null, contactNumber: text(data, "contactNumber") || null,
    monthlyTarget: text(data, "monthlyTarget") || null, dailyTarget: text(data, "dailyTarget") || null,
  }});
  await writeAudit({ userId: actor.id, action: "CREATE", module: "SHOPS", recordId: shop.id, newValue: { name, businessId } });
  revalidatePath("/shops"); revalidatePath("/sales/new");
}

export async function updateShopStatusAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const id = text(data, "id");
  const status = text(data, "status") as "ACTIVE" | "INACTIVE";
  if (!id || !["ACTIVE", "INACTIVE"].includes(status)) return;
  await prisma.shop.update({ where: { id }, data: { status } });
  await writeAudit({ userId: actor.id, action: "UPDATE", module: "SHOPS", recordId: id, newValue: { status } });
  revalidatePath("/shops");
}

export async function updateShopAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const id = text(data, "id");
  const old = await prisma.shop.findUnique({ where: { id } });
  if (!old) return;
  const shop = await prisma.shop.update({ where: { id }, data: {
    name: text(data, "name"), code: text(data, "code") || null, branch: text(data, "branch") || null,
    address: text(data, "address") || null, city: text(data, "city") || null, state: text(data, "state") || null,
    openingDate: text(data, "openingDate") ? new Date(`${text(data, "openingDate")}T00:00:00.000Z`) : null,
    managerName: text(data, "managerName") || null, contactNumber: text(data, "contactNumber") || null,
  }});
  await writeAudit({ userId: actor.id, action: "UPDATE", module: "SHOPS", recordId: id, oldValue: old, newValue: shop });
  revalidatePath("/shops"); revalidatePath("/dashboard");
}

export async function archiveShopAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES); const id = text(data, "id"); const restore = text(data, "operation") === "restore";
  await prisma.shop.update({ where: { id }, data: { status: restore ? "ACTIVE" : "INACTIVE", archivedAt: restore ? null : new Date() } });
  await writeAudit({ userId: actor.id, action: restore ? "UPDATE" : "SOFT_DELETE", module: "SHOPS", recordId: id, newValue: { archived: !restore } });
  revalidatePath("/shops"); revalidatePath("/dashboard");
}

export async function deleteShopAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES); const id = text(data, "id");
  const related = await prisma.shop.findUnique({ where: { id }, select: { _count: { select: { sales: true, expenses: true, bills: true, closings: true, cashMovements: true } } } });
  if (!related || Object.values(related._count).some((count) => count > 0)) return;
  await prisma.$transaction([prisma.userShopAccess.deleteMany({ where: { shopId: id } }), prisma.shopMargin.deleteMany({ where: { shopId: id } }), prisma.shop.delete({ where: { id } })]);
  await writeAudit({ userId: actor.id, action: "SOFT_DELETE", module: "SHOPS", recordId: id, reason: "Permanent deletion confirmed; no financial records existed" });
  revalidatePath("/shops");
}

export async function createMarginAction(data: FormData) {
  const actor = await requireUser(ADMIN_ROLES); const shopId = text(data, "shopId");
  const marginPercent = Number(text(data, "marginPercent")); if (!shopId || marginPercent < 0 || marginPercent > 100) return;
  const effectiveFrom = new Date(`${text(data, "effectiveFrom")}T00:00:00.000Z`);
  await prisma.$transaction(async tx => {
    await tx.shopMargin.updateMany({ where: { shopId, effectiveFrom: { lt: effectiveFrom }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }] }, data: { effectiveTo: new Date(effectiveFrom.getTime() - 86400000) } });
    const margin = await tx.shopMargin.create({ data: { shopId, marginPercent, effectiveFrom, note: text(data, "note") || null, createdById: actor.id } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CREATE", module: "MARGINS", recordId: margin.id, newValue: { shopId, marginPercent, effectiveFrom } } });
  });
  revalidatePath("/shops"); revalidatePath("/profit"); revalidatePath("/dashboard");
}

export async function createFixedCostAction(data: FormData) {
  const actor = await requireUser(); const shopId = text(data, "shopId") || null; if (shopId && !canAccessShop(actor, shopId)) return;
  const cost = await prisma.monthlyFixedCost.create({ data: { businessId: text(data,"businessId"), shopId, name: text(data,"name"), category: text(data,"category"), periodMonth: new Date(`${text(data,"periodMonth")}-01T00:00:00.000Z`), amount: text(data,"amount"), allocationMethod: text(data,"allocationMethod") as never, paymentStatus: text(data,"paymentStatus") as never, paymentDate: text(data,"paymentDate") ? new Date(`${text(data,"paymentDate")}T00:00:00.000Z`) : null, paymentMethod: (text(data,"paymentMethod") || null) as never, vendor: text(data,"vendor") || null, notes: text(data,"notes") || null, recurringKey: text(data,"recurringKey") || null, createdById: actor.id } });
  await writeAudit({ userId: actor.id, action:"CREATE", module:"FIXED_COSTS", recordId:cost.id, newValue:{ name:cost.name, amount:String(cost.amount), periodMonth:cost.periodMonth } });
  revalidatePath("/expenses"); revalidatePath("/dashboard"); revalidatePath("/reports");
}

export async function createEmiPaymentAction(data: FormData) {
  const actor = await requireUser();
  const shopId = text(data, "shopId") || null;
  if (shopId && !canAccessShop(actor, shopId)) return;
  const businessId = text(data, "businessId");
  const name = text(data, "loanName");
  const lender = text(data, "lender");
  const dueDateText = text(data, "dueDate");
  const totalAmount = Number(text(data, "totalAmount"));
  const principalAmount = Number(text(data, "principalAmount"));
  const interestAmount = Number(text(data, "interestAmount"));
  if (!businessId || !name || !lender || !dueDateText || totalAmount <= 0 || principalAmount < 0 || interestAmount < 0) return;
  if (Math.abs(totalAmount - principalAmount - interestAmount) > 0.01) return;
  const startDateText = text(data, "startDate") || dueDateText;
  const loan = await prisma.loan.upsert({
    where: { businessId_name: { businessId, name } },
    update: { lender, isActive: true },
    create: { businessId, name, lender, startDate: new Date(`${startDateText}T00:00:00.000Z`) },
  });
  const payment = await prisma.emiPayment.create({ data: {
    loanId: loan.id, shopId, dueDate: new Date(`${dueDateText}T00:00:00.000Z`),
    paidDate: text(data, "paidDate") ? new Date(`${text(data, "paidDate")}T00:00:00.000Z`) : null,
    totalAmount, principalAmount, interestAmount,
    paymentStatus: text(data, "paymentStatus") as never,
    allocationMethod: text(data, "allocationMethod") as never,
    notes: text(data, "notes") || null,
  }});
  await writeAudit({ userId: actor.id, action: "CREATE", module: "EMI", recordId: payment.id, newValue: { loanId: loan.id, totalAmount, dueDate: dueDateText } });
  revalidatePath("/emi"); revalidatePath("/reports"); revalidatePath("/cash-flow");
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
  if (type !== "SHOP" && !["OWNER", "ADMIN", "ACCOUNTANT"].includes(actor.role)) return;
  const category = await prisma.expenseCategory.upsert({ where: { name: categoryName }, update: { isActive: true }, create: { name: categoryName } });
  const expense = await prisma.expense.create({ data: {
    businessId, shopId: type === "SHOP" ? shopId : null, categoryId: category.id,
    expenseDate: new Date(`${text(data, "expenseDate")}T00:00:00.000Z`), type, description, amount,
    paymentMethod: text(data, "paymentMethod") as "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
    vendor: text(data, "vendor") || null, notes: text(data, "notes") || null,
    isFixed: false, kind: (text(data, "kind") || "VARIABLE") as never, paidDate: text(data, "paidDate") ? new Date(`${text(data, "paidDate")}T00:00:00.000Z`) : null,
    createdById: actor.id, updatedById: actor.id,
  }});
  await writeAudit({ userId: actor.id, action: "CREATE", module: "EXPENSES", recordId: expense.id, newValue: { description, amount, type, shopId } });
  revalidatePath("/expenses"); revalidatePath("/dashboard");
}

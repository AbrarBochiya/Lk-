import { z } from "zod";

const amount = z.coerce.number().nonnegative().max(1_000_000_000_000);
export const loginSchema = z.object({ email: z.string().trim().email().toLowerCase(), password: z.string().min(8).max(128) });
export const saleSchema = z.object({
  businessId: z.string().cuid(), shopId: z.string().cuid(), saleDate: z.coerce.date(), shift: z.string().min(1).default("FULL_DAY"),
  invoiceNumber: z.string().trim().max(100).optional().transform(v => v || undefined),
  cashSales: amount, upiSales: amount, cardSales: amount, bankSales: amount, otherSales: amount,
  returns: amount, discount: amount.default(0), tax: amount.default(0), amountReceived: amount.optional(), cogs: amount, billCount: z.coerce.number().int().nonnegative(), customerCount: z.coerce.number().int().nonnegative(),
  customerName: z.string().trim().max(150).optional(), customerPhone: z.string().trim().max(30).optional(),
  notes: z.string().max(2000).optional(),
});

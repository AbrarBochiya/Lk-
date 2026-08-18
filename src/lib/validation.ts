import { z } from "zod";

const amount = z.coerce.number().nonnegative().max(1_000_000_000_000);
export const loginSchema = z.object({ email: z.string().trim().email().toLowerCase(), password: z.string().min(8).max(128) });
export const saleSchema = z.object({
  shopId: z.string().cuid(), saleDate: z.coerce.date(),
  cashSales: amount, upiSales: amount, cardSales: amount, bankSales: amount, otherSales: amount,
  notes: z.string().max(2000).optional(),
});

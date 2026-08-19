import { prisma } from "@/lib/db";
import { calculateProfit, calculateSale, safePercent } from "@/lib/financial";
import { dateRange } from "@/lib/filters";

export async function getDashboardData(user: { role: string; shopAccess: Array<{ shopId: string }> }) {
  const now = new Date();
  const { from, to } = dateRange("this-month", now);
  const hasAllShops = ["OWNER", "ADMIN", "ACCOUNTANT"].includes(user.role);
  const shopWhere = hasAllShops ? {} : { shopId: { in: user.shopAccess.map((a) => a.shopId) } };
  const [sales, expenses, bills, shopCount] = await Promise.all([
      prisma.dailySale.findMany({ where: { ...shopWhere, saleDate: { gte: from, lte: to }, status: { not: "REVERSED" } }, include: { shop: true }, orderBy: { saleDate: "asc" } }),
      prisma.expense.findMany({ where: { ...shopWhere, expenseDate: { gte: from, lte: to }, status: { not: "REVERSED" } } }),
    prisma.supplierBill.findMany({ where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } } }),
    prisma.shop.count({ where: { status: "ACTIVE", ...(hasAllShops ? {} : { id: { in: user.shopAccess.map((a) => a.shopId) } }) } }),
  ]);
  const saleRows = sales.map((s) => ({ ...calculateSale({ cash: s.cashSales.toString(), upi: s.upiSales.toString(), card: s.cardSales.toString(), bank: s.bankSales.toString(), other: s.otherSales.toString(), returns: s.returns.toString(), cogs: s.cogs.toString() }), date: s.saleDate, shop: s.shop.name, bills: s.billCount, customers: s.customerCount }));
  const netSales = saleRows.reduce((sum, x) => sum + x.netSales, 0); const cogs = sales.reduce((sum, x) => sum + Number(x.cogs), 0);
  const operatingExpenses = expenses.filter((x) => x.type !== "PERSONAL").reduce((sum, x) => sum + Number(x.amount), 0);
  const personal = expenses.filter((x) => x.type === "PERSONAL").reduce((sum, x) => sum + Number(x.amount), 0);
  const profit = calculateProfit({ netSales, cogs, operatingExpenses, personalWithdrawals: personal });
  const grossSales = saleRows.reduce((sum, x) => sum + x.grossSales, 0); const totalBills = saleRows.reduce((sum, x) => sum + x.bills, 0); const totalCustomers = saleRows.reduce((sum, x) => sum + x.customers, 0);
  const outstanding = bills.reduce((sum, bill) => sum + Number(bill.total) - Number(bill.paidAmount), 0);
  const overdue = bills.filter((bill) => bill.dueDate < now).reduce((sum, bill) => sum + Number(bill.total) - Number(bill.paidAmount), 0);
  const shops = new Map<string, { sales: number; profit: number }>(); saleRows.forEach((row) => { const current = shops.get(row.shop) ?? { sales: 0, profit: 0 }; current.sales += row.netSales; current.profit += row.grossProfit; shops.set(row.shop, current); });
  const ranking = [...shops.entries()].map(([name, value]) => ({ name, ...value })).sort((a,b) => b.sales-a.sales);
  const byDate = new Map<string, { sales: number; profit: number }>(); saleRows.forEach((row) => { const key = row.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); const v = byDate.get(key) ?? {sales:0,profit:0}; v.sales += row.netSales; v.profit += row.grossProfit; byDate.set(key,v); });
  return { grossSales, netSales, cogs, operatingExpenses, personal, ...profit, outstanding, overdue, shopCount, totalBills, totalCustomers, averageBill: totalBills ? netSales/totalBills : 0, averageShop: shopCount ? netSales/shopCount : 0, expenseRatio: safePercent(operatingExpenses, netSales), ranking, chart: [...byDate].map(([date, v]) => ({date,...v})) };
}

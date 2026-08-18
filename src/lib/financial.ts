export type MoneyInput = number | string;

const n = (value: MoneyInput | undefined) => Number(value ?? 0);

export const roundMoney = (value: MoneyInput) => Math.round(n(value) * 100) / 100;

export const normaliseMarginPercent = (value: MoneyInput) =>
  Math.min(100, Math.max(0, n(value)));

export const calculateCogsFromMargin = (netSales: MoneyInput, marginPercent: MoneyInput) =>
  roundMoney(n(netSales) * (1 - normaliseMarginPercent(marginPercent) / 100));

export const safePercent = (part: MoneyInput, whole: MoneyInput) =>
  n(whole) === 0 ? 0 : (n(part) / n(whole)) * 100;

export function calculateSale(input: {
  cash?: MoneyInput; upi?: MoneyInput; card?: MoneyInput; bank?: MoneyInput;
  other?: MoneyInput; returns?: MoneyInput; cogs?: MoneyInput;
}) {
  const grossSales = n(input.cash) + n(input.upi) + n(input.card) + n(input.bank) + n(input.other);
  const netSales = grossSales - n(input.returns);
  const grossProfit = netSales - n(input.cogs);
  return { grossSales, netSales, grossProfit, grossMargin: safePercent(grossProfit, netSales) };
}

export function calculateProfit(input: {
  netSales: MoneyInput; cogs: MoneyInput; operatingExpenses: MoneyInput; personalWithdrawals: MoneyInput;
}) {
  const grossProfit = n(input.netSales) - n(input.cogs);
  const operatingProfit = grossProfit - n(input.operatingExpenses);
  const profitAfterWithdrawals = operatingProfit - n(input.personalWithdrawals);
  return {
    grossProfit,
    grossMargin: safePercent(grossProfit, input.netSales),
    operatingProfit,
    operatingMargin: safePercent(operatingProfit, input.netSales),
    profitAfterWithdrawals,
  };
}

export function allocateCentralExpense(
  total: MoneyInput,
  shops: Array<{ id: string; weight?: MoneyInput }>,
  method: "EQUAL" | "SALES_CONTRIBUTION",
) {
  if (!shops.length) return [];
  const totalAmount = n(total);
  const weightTotal = method === "EQUAL" ? shops.length : shops.reduce((sum, shop) => sum + n(shop.weight), 0);
  return shops.map((shop, index) => {
    const weight = method === "EQUAL" ? 1 : n(shop.weight);
    const raw = weightTotal === 0 ? totalAmount / shops.length : (totalAmount * weight) / weightTotal;
    const amount = index === shops.length - 1
      ? totalAmount - shops.slice(0, -1).reduce((sum, item) => {
          const itemWeight = method === "EQUAL" ? 1 : n(item.weight);
          return sum + Math.round((weightTotal === 0 ? totalAmount / shops.length : totalAmount * itemWeight / weightTotal) * 100) / 100;
        }, 0)
      : Math.round(raw * 100) / 100;
    return { shopId: shop.id, amount, percentage: safePercent(amount, totalAmount) };
  });
}

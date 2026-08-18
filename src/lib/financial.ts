export const calculateCogsFromMargin = (
  netSales: MoneyInput,
  marginPercent: MoneyInput
) =>
  roundMoney(
    n(netSales) * (1 - normaliseMarginPercent(marginPercent) / 100)
  );

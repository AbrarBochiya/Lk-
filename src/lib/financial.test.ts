import { describe, expect, it } from "vitest";
import { allocateCentralExpense, calculateProfit, calculateSale, safePercent } from "./financial";

describe("financial calculation engine", () => {
  it("calculates sales, returns, COGS and margin", () => expect(calculateSale({cash:100,upi:50,card:25,bank:25,other:0,returns:20,cogs:90})).toEqual({grossSales:200,netSales:180,grossProfit:90,grossMargin:50}));
  it("separates operating expenses from personal withdrawals", () => expect(calculateProfit({netSales:1000,cogs:600,operatingExpenses:100,personalWithdrawals:50})).toEqual({grossProfit:400,grossMargin:40,operatingProfit:300,operatingMargin:30,profitAfterWithdrawals:250}));
  it("handles zero denominators", () => expect(safePercent(10,0)).toBe(0));
  it("allocates rounding differences without losing money", () => { const rows=allocateCentralExpense(100,[{id:"a"},{id:"b"},{id:"c"}],"EQUAL"); expect(rows.reduce((s,r)=>s+r.amount,0)).toBe(100); });
  it("allocates by sales contribution", () => expect(allocateCentralExpense(100,[{id:"a",weight:50},{id:"b",weight:30},{id:"c",weight:20}],"SALES_CONTRIBUTION").map(x=>x.amount)).toEqual([50,30,20]));
});

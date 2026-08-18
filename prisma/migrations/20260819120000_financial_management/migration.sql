-- Additive financial-management upgrade. Existing records and identifiers are preserved.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ACCOUNTANT';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SHOP_MANAGER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DATA_ENTRY';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VIEWER';
ALTER TYPE "AllocationMethod" ADD VALUE IF NOT EXISTS 'GROSS_PROFIT';
ALTER TYPE "AllocationMethod" ADD VALUE IF NOT EXISTS 'DIRECT';
ALTER TYPE "AllocationMethod" ADD VALUE IF NOT EXISTS 'CUSTOM';
CREATE TYPE "SaleSource" AS ENUM ('MANUAL', 'IMPORT');
CREATE TYPE "ExpenseKind" AS ENUM ('VARIABLE', 'FIXED', 'EMI', 'ONE_TIME', 'CENTRAL', 'CAPEX');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'VALIDATED', 'COMPLETED', 'PARTIAL', 'FAILED', 'ROLLED_BACK');

ALTER TABLE "Shop" ADD COLUMN "code" TEXT, ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Shop_businessId_code_key" ON "Shop"("businessId", "code");
ALTER TABLE "DailySale" ADD COLUMN "saleTime" TIMESTAMP(3), ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "discount" DECIMAL(18,2) NOT NULL DEFAULT 0, ADD COLUMN "tax" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "amountReceived" DECIMAL(18,2), ADD COLUMN "customerName" TEXT, ADD COLUMN "customerPhone" TEXT,
  ADD COLUMN "source" "SaleSource" NOT NULL DEFAULT 'MANUAL', ADD COLUMN "cancelledAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "DailySale_shopId_invoiceNumber_key" ON "DailySale"("shopId", "invoiceNumber");
ALTER TABLE "Expense" ADD COLUMN "kind" "ExpenseKind" NOT NULL DEFAULT 'VARIABLE', ADD COLUMN "paidDate" DATE;

CREATE TABLE "ShopMargin" (
  "id" TEXT PRIMARY KEY, "shopId" TEXT NOT NULL, "marginPercent" DECIMAL(7,4) NOT NULL,
  "effectiveFrom" DATE NOT NULL, "effectiveTo" DATE, "note" TEXT, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopMargin_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ShopMargin_shopId_effectiveFrom_key" ON "ShopMargin"("shopId", "effectiveFrom");
CREATE INDEX "ShopMargin_shopId_effectiveFrom_effectiveTo_idx" ON "ShopMargin"("shopId", "effectiveFrom", "effectiveTo");

CREATE TABLE "MonthlyFixedCost" (
  "id" TEXT PRIMARY KEY, "businessId" TEXT NOT NULL, "shopId" TEXT, "name" TEXT NOT NULL, "category" TEXT NOT NULL,
  "periodMonth" DATE NOT NULL, "amount" DECIMAL(18,2) NOT NULL, "allocationMethod" "AllocationMethod" NOT NULL DEFAULT 'UNALLOCATED',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID', "paymentDate" DATE, "paymentMethod" "PaymentMethod",
  "vendor" TEXT, "notes" TEXT, "recurringKey" TEXT, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyFixedCost_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MonthlyFixedCost_businessId_recurringKey_periodMonth_key" ON "MonthlyFixedCost"("businessId", "recurringKey", "periodMonth");
CREATE INDEX "MonthlyFixedCost_businessId_periodMonth_idx" ON "MonthlyFixedCost"("businessId", "periodMonth");
CREATE INDEX "MonthlyFixedCost_shopId_periodMonth_idx" ON "MonthlyFixedCost"("shopId", "periodMonth");

CREATE TABLE "Loan" ("id" TEXT PRIMARY KEY, "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "lender" TEXT NOT NULL,
  "startDate" DATE NOT NULL, "endDate" DATE, "isActive" BOOLEAN NOT NULL DEFAULT true, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE UNIQUE INDEX "Loan_businessId_name_key" ON "Loan"("businessId", "name");
CREATE TABLE "EmiPayment" ("id" TEXT PRIMARY KEY, "loanId" TEXT NOT NULL, "shopId" TEXT, "dueDate" DATE NOT NULL, "paidDate" DATE,
  "totalAmount" DECIMAL(18,2) NOT NULL, "principalAmount" DECIMAL(18,2) NOT NULL, "interestAmount" DECIMAL(18,2) NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID', "allocationMethod" "AllocationMethod" NOT NULL DEFAULT 'UNALLOCATED',
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmiPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EmiPayment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE UNIQUE INDEX "EmiPayment_loanId_dueDate_key" ON "EmiPayment"("loanId", "dueDate");
CREATE INDEX "EmiPayment_shopId_dueDate_idx" ON "EmiPayment"("shopId", "dueDate");

CREATE TABLE "AccountingPeriod" ("id" TEXT PRIMARY KEY, "businessId" TEXT NOT NULL, "periodMonth" DATE NOT NULL,
  "closedAt" TIMESTAMP(3), "closedById" TEXT, "note" TEXT);
CREATE UNIQUE INDEX "AccountingPeriod_businessId_periodMonth_key" ON "AccountingPeriod"("businessId", "periodMonth");
CREATE TABLE "ImportBatch" ("id" TEXT PRIMARY KEY, "businessId" TEXT NOT NULL, "dataType" TEXT NOT NULL, "fileName" TEXT NOT NULL,
  "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEW', "totalRows" INTEGER NOT NULL DEFAULT 0, "validRows" INTEGER NOT NULL DEFAULT 0,
  "invalidRows" INTEGER NOT NULL DEFAULT 0, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3), "rolledBackAt" TIMESTAMP(3));
CREATE INDEX "ImportBatch_businessId_createdAt_idx" ON "ImportBatch"("businessId", "createdAt");
CREATE TABLE "ImportRow" ("id" TEXT PRIMARY KEY, "batchId" TEXT NOT NULL, "rowNumber" INTEGER NOT NULL, "rawData" JSONB NOT NULL,
  "error" TEXT, "recordId" TEXT, CONSTRAINT "ImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "ImportRow_batchId_rowNumber_key" ON "ImportRow"("batchId", "rowNumber");

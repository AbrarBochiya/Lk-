-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'POSTED', 'APPROVED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('SHOP', 'CENTRAL', 'PERSONAL');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('UNALLOCATED', 'EQUAL', 'SALES_CONTRIBUTION', 'MANUAL');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ClosingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SOFT_DELETE', 'APPROVE', 'REJECT', 'PAYMENT_ALLOCATION', 'REVERSAL', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'EMAIL_CHANGE');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('BILL', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'OPENING_BALANCE', 'REVERSAL');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('INFLOW', 'OUTFLOW', 'WITHDRAWAL', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "contact" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "managerName" TEXT,
    "contactNumber" TEXT,
    "openingDate" TIMESTAMP(3),
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlyTarget" DECIMAL(18,2),
    "dailyTarget" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserShopAccess" (
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserShopAccess_pkey" PRIMARY KEY ("userId","shopId")
);

-- CreateTable
CREATE TABLE "DailySale" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "saleDate" DATE NOT NULL,
    "shift" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "cashSales" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "upiSales" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cardSales" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bankSales" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherSales" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "returns" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cogs" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "billCount" INTEGER NOT NULL DEFAULT 0,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'POSTED',
    "reversalOfId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCategorySale" (
    "id" TEXT NOT NULL,
    "dailySaleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sales" DECIMAL(18,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "cogs" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "DailyCategorySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT,
    "categoryId" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "vendor" TEXT,
    "notes" TEXT,
    "allocationMethod" "AllocationMethod" NOT NULL DEFAULT 'UNALLOCATED',
    "status" "RecordStatus" NOT NULL DEFAULT 'POSTED',
    "reversalOfId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentralExpenseAllocation" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "percentage" DECIMAL(7,4) NOT NULL,

    CONSTRAINT "CentralExpenseAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierBill" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierBillItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "rate" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "SupplierBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "paymentDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierLedgerEntry" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "referenceId" TEXT,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyClosing" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "closingDate" DATE NOT NULL,
    "expectedCash" DECIMAL(18,2) NOT NULL,
    "countedCash" DECIMAL(18,2) NOT NULL,
    "variance" DECIMAL(18,2) NOT NULL,
    "explanation" TEXT,
    "status" "ClosingStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "movementDate" DATE NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopTarget" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "sales" DECIMAL(18,2),
    "grossProfit" DECIMAL(18,2),
    "operatingProfit" DECIMAL(18,2),
    "expense" DECIMAL(18,2),
    "margin" DECIMAL(7,4),

    CONSTRAINT "ShopTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "threshold" DECIMAL(18,4) NOT NULL,
    "severity" "Severity" NOT NULL,
    "businessId" TEXT,
    "shopId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Shop_businessId_status_idx" ON "Shop"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_businessId_name_key" ON "Shop"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailySale_reversalOfId_key" ON "DailySale"("reversalOfId");

-- CreateIndex
CREATE INDEX "DailySale_businessId_saleDate_idx" ON "DailySale"("businessId", "saleDate");

-- CreateIndex
CREATE INDEX "DailySale_shopId_saleDate_idx" ON "DailySale"("shopId", "saleDate");

-- CreateIndex
CREATE INDEX "DailySale_status_idx" ON "DailySale"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailySale_shopId_saleDate_shift_key" ON "DailySale"("shopId", "saleDate", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_businessId_name_key" ON "ProductCategory"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "DailyCategorySale_shopId_categoryId_idx" ON "DailyCategorySale"("shopId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCategorySale_dailySaleId_categoryId_key" ON "DailyCategorySale"("dailySaleId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_reversalOfId_key" ON "Expense"("reversalOfId");

-- CreateIndex
CREATE INDEX "Expense_businessId_expenseDate_type_idx" ON "Expense"("businessId", "expenseDate", "type");

-- CreateIndex
CREATE INDEX "Expense_shopId_expenseDate_idx" ON "Expense"("shopId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_categoryId_expenseDate_idx" ON "Expense"("categoryId", "expenseDate");

-- CreateIndex
CREATE INDEX "CentralExpenseAllocation_shopId_idx" ON "CentralExpenseAllocation"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "CentralExpenseAllocation_expenseId_shopId_key" ON "CentralExpenseAllocation"("expenseId", "shopId");

-- CreateIndex
CREATE INDEX "Supplier_businessId_status_idx" ON "Supplier"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_businessId_name_key" ON "Supplier"("businessId", "name");

-- CreateIndex
CREATE INDEX "SupplierBill_businessId_dueDate_status_idx" ON "SupplierBill"("businessId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "SupplierBill_supplierId_status_idx" ON "SupplierBill"("supplierId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierBill_supplierId_invoiceNumber_key" ON "SupplierBill"("supplierId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_paymentDate_idx" ON "SupplierPayment"("supplierId", "paymentDate");

-- CreateIndex
CREATE INDEX "PaymentAllocation_billId_idx" ON "PaymentAllocation"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_billId_key" ON "PaymentAllocation"("paymentId", "billId");

-- CreateIndex
CREATE INDEX "SupplierLedgerEntry_supplierId_entryDate_idx" ON "SupplierLedgerEntry"("supplierId", "entryDate");

-- CreateIndex
CREATE INDEX "DailyClosing_businessId_closingDate_status_idx" ON "DailyClosing"("businessId", "closingDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyClosing_shopId_closingDate_key" ON "DailyClosing"("shopId", "closingDate");

-- CreateIndex
CREATE INDEX "CashMovement_shopId_movementDate_idx" ON "CashMovement"("shopId", "movementDate");

-- CreateIndex
CREATE INDEX "ShopTarget_businessId_periodStart_periodEnd_idx" ON "ShopTarget"("businessId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ShopTarget_shopId_periodStart_idx" ON "ShopTarget"("shopId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SavedFilter_userId_module_name_key" ON "SavedFilter"("userId", "module", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");

-- CreateIndex
CREATE INDEX "Document_ownerType_ownerId_idx" ON "Document"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "AuditLog_module_recordId_idx" ON "AuditLog"("module", "recordId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopAccess" ADD CONSTRAINT "UserShopAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopAccess" ADD CONSTRAINT "UserShopAccess_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "DailySale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCategorySale" ADD CONSTRAINT "DailyCategorySale_dailySaleId_fkey" FOREIGN KEY ("dailySaleId") REFERENCES "DailySale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCategorySale" ADD CONSTRAINT "DailyCategorySale_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCategorySale" ADD CONSTRAINT "DailyCategorySale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentralExpenseAllocation" ADD CONSTRAINT "CentralExpenseAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBill" ADD CONSTRAINT "SupplierBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBill" ADD CONSTRAINT "SupplierBill_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBill" ADD CONSTRAINT "SupplierBill_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBillItem" ADD CONSTRAINT "SupplierBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "SupplierBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "SupplierPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_billId_fkey" FOREIGN KEY ("billId") REFERENCES "SupplierBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierLedgerEntry" ADD CONSTRAINT "SupplierLedgerEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosing" ADD CONSTRAINT "DailyClosing_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosing" ADD CONSTRAINT "DailyClosing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopTarget" ADD CONSTRAINT "ShopTarget_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopTarget" ADD CONSTRAINT "ShopTarget_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


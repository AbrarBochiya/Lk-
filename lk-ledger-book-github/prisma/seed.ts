import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const categories = ["Rent", "Salary", "Electricity", "Internet", "Marketing", "Transport", "Maintenance", "Packaging", "Courier", "Commission", "Bank Charges", "Software", "Office Expenses", "Travel", "Miscellaneous"];
async function main() { for (const name of categories) await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } }); console.log("Seeded standard expense categories."); }
main().finally(() => prisma.$disconnect());

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  if (await prisma.user.count({ where: { role: "ADMIN" } })) {
    console.log("Admin already exists; bootstrap made no changes."); return;
  }
  const name = process.env.ADMIN_NAME?.trim(); const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password) throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required for first bootstrap.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE", module: "ADMIN_BOOTSTRAP", recordId: user.id } });
  console.log(`Created first Admin account for ${email}.`);
}
main().finally(() => prisma.$disconnect());

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

const COOKIE_NAME = "lk_session";
const SESSION_DAYS = 7;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({ data: { userId, tokenHash: hash(token), expiresAt } });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hash(token) } });
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findFirst({
    where: { tokenHash: hash(token), expiresAt: { gt: new Date() }, user: { status: "ACTIVE" } },
    include: { user: { include: { shopAccess: true } } },
  });
  return session?.user ?? null;
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export function canAccessShop(user: Awaited<ReturnType<typeof requireUser>>, shopId: string) {
  return ["OWNER", "ADMIN", "ACCOUNTANT"].includes(user.role) || user.shopAccess.some((access) => access.shopId === shopId);
}

export const ADMIN_ROLES: Role[] = ["OWNER", "ADMIN"];

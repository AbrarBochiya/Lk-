"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user && user.status === "ACTIVE" && await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "The email or password is incorrect." };
  await createSession(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({ userId: user.id, action: "LOGIN", module: "AUTH" });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

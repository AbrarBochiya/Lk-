import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try { await prisma.$queryRaw`SELECT 1`; return NextResponse.json({ application: "healthy", database: "connected", timestamp: new Date().toISOString() }); }
  catch { return NextResponse.json({ application: "unhealthy", database: "disconnected", timestamp: new Date().toISOString() }, { status: 503 }); }
}

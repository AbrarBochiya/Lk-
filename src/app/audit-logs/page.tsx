import { AppShell } from "@/components/app-shell";
import { ADMIN_ROLES, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AuditLogsPage() {
  const user = await requireUser(ADMIN_ROLES);
  const logs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return <AppShell user={user}><div className="mx-auto max-w-6xl"><p className="label">Governance</p><h1 className="mt-2 text-4xl font-semibold">Audit logs</h1><p className="mt-3 text-[#66736b]">Recent create, update, reversal, approval, login, and security activity.</p><div className="card mt-7 overflow-hidden">{logs.length ? <div className="divide-y">{logs.map(log=><div className="grid gap-2 p-5 md:grid-cols-[180px_120px_160px_1fr]" key={log.id}><span className="text-sm">{log.createdAt.toLocaleString("en-IN")}</span><b className="text-sm">{log.action}</b><span className="text-sm">{log.module}</span><span className="text-sm text-[#66736b]">{log.user?.email || "System"}{log.recordId ? ` · ${log.recordId}` : ""}{log.reason ? ` · ${log.reason}` : ""}</span></div>)}</div> : <p className="p-5 text-sm text-[#66736b]">No audit records yet.</p>}</div></div></AppShell>;
}

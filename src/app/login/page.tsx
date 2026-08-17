import { redirect } from "next/navigation";
import { BadgeIndianRupee, CheckCircle2, Landmark } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden overflow-hidden bg-[#103b2b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-28 -top-28 size-96 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 left-28 size-80 rounded-full bg-[#d7f56b]/10 blur-3xl" />
      <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#d7f56b] text-[#123f2d]"><Landmark /></span><div><b className="text-lg">LK LEDGER BOOK</b><p className="text-xs text-white/55">Business finance, made accountable.</p></div></div>
      <div className="relative max-w-xl"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#d7f56b]">Clarity from counter to supplier</p><h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.045em]">Every rupee.<br />Every shop.<br />One clear picture.</h1><p className="mt-6 max-w-md text-lg leading-8 text-white/65">A secure operating system for daily sales, profit, expenses, supplier dues, and cash closing.</p></div>
      <div className="relative grid grid-cols-3 gap-3 text-sm">{["Shop-wise access", "Auditable entries", "Real-time margins"].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3"><CheckCircle2 className="size-4 text-[#d7f56b]" />{item}</div>)}</div>
    </section>
    <section className="flex min-h-screen items-center justify-center p-5 sm:p-10">
      <div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid size-11 place-items-center rounded-2xl bg-[#123f2d] text-[#d7f56b]"><BadgeIndianRupee /></span><b>LK LEDGER BOOK</b></div>
        <p className="label text-[#1d6a49]">Welcome back</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Sign in to your ledger</h2><p className="mt-3 text-[#69756e]">Use the administrator credentials configured during deployment.</p><LoginForm />
        <p className="mt-8 text-center text-xs leading-5 text-[#7b867f]">Protected with server-side sessions and role-based access controls.</p></div>
    </section>
  </main>;
}

import { Bell, CalendarDays, ChevronDown, Search } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { logoutAction } from "@/app/actions/auth";

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; role: string } }) {
  return <div className="min-h-screen md:pl-[230px]"><Sidebar /><header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[#dfe5df] bg-[#f4f6f2]/90 px-4 pl-16 backdrop-blur md:px-7">
    <div className="hidden items-center gap-2 text-sm text-[#66736b] sm:flex"><CalendarDays className="size-4" /><span>This month</span><ChevronDown className="size-3" /></div>
    <div className="ml-auto flex items-center gap-2"><button aria-label="Search" className="grid size-10 place-items-center rounded-xl border border-[#dfe5df] bg-white"><Search className="size-4" /></button><button aria-label="Notifications" className="relative grid size-10 place-items-center rounded-xl border border-[#dfe5df] bg-white"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#bd3038]" /></button><div className="ml-1 hidden text-right sm:block"><p className="text-xs font-bold">{user.name}</p><p className="text-[10px] text-[#758179]">{user.role}</p></div><form action={logoutAction}><button className="grid size-10 place-items-center rounded-xl bg-[#123f2d] text-xs font-bold text-white" title="Sign out">{user.name.slice(0, 2).toUpperCase()}</button></form></div>
  </header><main className="p-4 pb-24 sm:p-6 lg:p-8">{children}</main></div>;
}

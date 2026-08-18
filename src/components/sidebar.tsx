"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ShoppingBag, Store, Package, ReceiptIndianRupee, TrendingUp, Truck, FileText, WalletCards, BookOpenText, CircleDollarSign, ClipboardCheck, ArrowLeftRight, Target, BarChart3, FolderLock, Bell, Users, ScrollText, Settings, Menu, X, Landmark, DatabaseBackup, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  ["Dashboard", "/dashboard", LayoutDashboard], ["Sales", "/sales", ShoppingBag], ["Shops", "/shops", Store], ["Products", "/products", Package],
  ["Expenses", "/expenses", ReceiptIndianRupee], ["Monthly Fixed Costs", "/fixed-costs", CalendarClock], ["Loans & EMI", "/emi", Landmark], ["Profit & Margins", "/profit", TrendingUp], ["Suppliers", "/suppliers", Truck], ["Bills", "/bills", FileText],
  ["Payments", "/payments", WalletCards], ["Ledger", "/ledger", BookOpenText], ["Outstanding", "/outstanding", CircleDollarSign], ["Daily Closing", "/daily-closing", ClipboardCheck],
  ["Cash Flow", "/cash-flow", ArrowLeftRight], ["Targets", "/targets", Target], ["Reports", "/reports", BarChart3], ["Documents", "/documents", FolderLock],
  ["Alerts", "/alerts", Bell], ["Users", "/users", Users], ["Audit Logs", "/audit-logs", ScrollText], ["Data & Backup", "/data-backup", DatabaseBackup], ["Settings", "/settings", Settings],
] as const;

export function Sidebar() {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  const nav = <><div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><span className="grid size-10 place-items-center rounded-xl bg-[#d7f56b] text-[#103b2b]"><Landmark className="size-5" /></span><div><b className="text-sm tracking-wide">LK LEDGER</b><p className="text-[10px] text-white/45">FINANCIAL CONTROL</p></div></div>
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">{items.map(([label, href, Icon]) => <Link onClick={() => setOpen(false)} key={href} href={href} className={cn("mb-1 flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-white/62 transition hover:bg-white/7 hover:text-white", pathname === href && "bg-white/10 text-white shadow-inner")}><Icon className={cn("size-[17px]", pathname === href && "text-[#d7f56b]")} /><span>{label}</span></Link>)}</nav>
    <div className="border-t border-white/10 p-4 text-[11px] text-white/40">Secure internal finance workspace</div></>;
  return <><button aria-label="Open navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-30 grid size-10 place-items-center rounded-xl border border-[#dfe5df] bg-white md:hidden"><Menu className="size-5" /></button>
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[230px] flex-col bg-[#123b2c] text-white md:flex">{nav}</aside>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Close navigation overlay" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/45" /><aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#123b2c] text-white"><button aria-label="Close navigation" onClick={() => setOpen(false)} className="absolute right-3 top-5 grid size-9 place-items-center rounded-lg bg-white/10"><X /></button>{nav}</aside></div>}
  </>;
}

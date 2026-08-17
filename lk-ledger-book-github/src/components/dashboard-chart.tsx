"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function DashboardChart({ data }: { data: Array<{ date: string; sales: number; profit: number }> }) {
  if (!data.length) return <div className="grid h-72 place-items-center rounded-xl border border-dashed border-[#d8dfd9] bg-[#fafbf9] text-center text-sm text-[#738078]"><div><p className="font-semibold text-[#33453a]">No sales in this period</p><p className="mt-1">Add a daily sale to begin the performance trend.</p></div></div>;
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: -16, right: 6, top: 10 }}><defs><linearGradient id="sales" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d6a49" stopOpacity={.32}/><stop offset="1" stopColor="#1d6a49" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9ede9"/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: "#758179"}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: "#758179"}} tickFormatter={(v) => `${Math.round(v/1000)}k`}/><Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{borderRadius: 12, borderColor: "#dfe5df"}}/><Area type="monotone" dataKey="sales" stroke="#1d6a49" strokeWidth={2.5} fill="url(#sales)"/><Area type="monotone" dataKey="profit" stroke="#a2bd35" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div>;
}

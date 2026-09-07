"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type BudgetDatum = { year: string; amount: number }
export function BudgetChart({ data }: { data: BudgetDatum[] }) {
  return <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><defs><linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--pulse)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--pulse)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} /><XAxis dataKey="year" stroke="var(--slate)" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="var(--slate)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${Number(value) / 1000}k`} /><Tooltip contentStyle={{ backgroundColor: "var(--canvas-deep)", borderColor: "var(--line)", color: "var(--paper)" }} /><Area type="monotone" dataKey="amount" stroke="var(--pulse)" fillOpacity={1} fill="url(#colorAmount)" /></AreaChart></ResponsiveContainer></div>
}

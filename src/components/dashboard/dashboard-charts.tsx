"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

type DivisionDatum = { name: string; count: number }
type StatusDatum = { name: string; value: number }
const COLORS = ["#3ed9a0", "#e2572b", "#f4b942", "#8792a0", "#efe9dc"]
const chartStyle = { backgroundColor: "var(--canvas-deep)", borderColor: "var(--line)", color: "var(--paper)" }

export function InventoryByDivisionChart({ data }: { data: DivisionDatum[] }) {
  return <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} /><XAxis dataKey="name" stroke="var(--slate)" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="var(--slate)" fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "var(--line)" }} contentStyle={chartStyle} /><Bar dataKey="count" fill="var(--pulse)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
}

export function StatusBreakdownChart({ data }: { data: StatusDatum[] }) {
  return <div className="h-80 w-full flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={chartStyle} /><Legend wrapperStyle={{ color: "var(--slate)" }} /></PieChart></ResponsiveContainer></div>
}

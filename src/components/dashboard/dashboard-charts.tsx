"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

const COLORS = ['#3ed9a0', '#e2572b', '#8792a0', '#efe9dc', '#4a473e', '#1c1912'];

export function InventoryByDivisionChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--slate)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--slate)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{ fill: 'var(--line)' }}
            contentStyle={{ backgroundColor: 'var(--canvas-deep)', borderColor: 'var(--line)', color: 'var(--paper)' }}
          />
          <Bar dataKey="count" fill="var(--pulse)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusBreakdownChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--canvas-deep)', borderColor: 'var(--line)', color: 'var(--paper)' }}
          />
          <Legend wrapperStyle={{ color: 'var(--slate)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

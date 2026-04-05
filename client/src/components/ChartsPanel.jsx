import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../lib/format";

export function ChartsPanel({ earningsTrend, incomeBySource }) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-[30px] border border-border bg-white p-6 shadow-card">
        <div className="mb-4">
          <p className="text-sm text-stone-500">Earnings line chart</p>
          <h3 className="font-display text-2xl text-ink">Monthly earnings trend</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={earningsTrend}>
              <CartesianGrid stroke="#eee3d4" strokeDasharray="4 4" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="amount" stroke="#c96d42" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-[30px] border border-border bg-white p-6 shadow-card">
        <div className="mb-4">
          <p className="text-sm text-stone-500">Income bar chart</p>
          <h3 className="font-display text-2xl text-ink">Income by source</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeBySource}>
              <CartesianGrid stroke="#eee3d4" strokeDasharray="4 4" />
              <XAxis dataKey="source" />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#2c7a5f" radius={[14, 14, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

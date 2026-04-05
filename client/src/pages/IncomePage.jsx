import { useEffect, useMemo, useState } from "react";
import { DollarSign, Trash2 } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { EmptyState } from "../components/EmptyState";
import { useToast }   from "../components/Toast";
import { api }        from "../lib/api";
import { formatINR, formatDate, monthKey } from "../lib/format";

const SOURCES  = ["YouTube", "Instagram", "Affiliate", "Brand Deal", "Other"];
const SOURCE_COLORS = {
  YouTube:    "#FF0000",
  Instagram:  "#E1306C",
  Affiliate:  "#F59E0B",
  "Brand Deal":"#7C3AED",
  Other:      "#6B7280",
};

const initialForm = { source: "YouTube", amount: "", date: "", note: "" };

const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
const labelCls = "mb-1 block text-xs font-medium text-[var(--ink2)]";

export function IncomePage() {
  const toast = useToast();
  const [income, setIncome]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(initialForm);
  const [saving, setSaving]   = useState(false);

  async function loadIncome() {
    setLoading(true);
    try {
      const data = await api.income.getAll();
      setIncome(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIncome(); }, []);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.amount || !form.date) return;
    setSaving(true);
    try {
      await api.income.create({ ...form, amount: Number(form.amount) });
      setForm(initialForm);
      await loadIncome();
      toast.success("Income logged");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this income entry?")) return;
    try {
      await api.income.delete(id);
      await loadIncome();
      toast.success("Entry removed");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const total = useMemo(() => income.reduce((s, i) => s + i.amount, 0), [income]);

  const bySource = useMemo(() => {
    return SOURCES.map((src) => ({
      name: src,
      value: income.filter((i) => i.source === src).reduce((s, i) => s + i.amount, 0),
    })).filter((s) => s.value > 0);
  }, [income]);

  const monthlyTrend = useMemo(() => {
    const now  = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const amt = income.filter((inc) => monthKey(inc.date) === key).reduce((s, inc) => s + inc.amount, 0);
      months.push({ month: label, amount: amt });
    }
    return months;
  }, [income]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      {/* ── LEFT ── */}
      <div className="space-y-4">
        {/* Add form */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
          <h3 className="mb-4 text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Add Income Entry
          </h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>Source</label>
                <select className={inputCls} value={form.source} onChange={(e) => setField("source", e.target.value)}>
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Amount (₹)</label>
                <input className={inputCls} type="number" min={0} required value={form.amount} onChange={(e) => setField("amount", e.target.value)} placeholder="5000" />
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input className={inputCls} type="date" required value={form.date} onChange={(e) => setField("date", e.target.value)} />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Adding…" : "Add Entry"}
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Note (optional)</label>
              <input className={inputCls} value={form.note} onChange={(e) => setField("note", e.target.value)} placeholder="e.g. AdSense payout April" />
            </div>
          </form>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-12" />)}</div>
        ) : income.length === 0 ? (
          <EmptyState icon={DollarSign} title="No income logged" description="Add your first income entry above." />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" style={{ boxShadow: "var(--shadow-md)" }}>
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="bg-[#FAFAF8]">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-[var(--ink3)]">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {income.map((entry) => (
                  <tr key={entry._id} className="hover:bg-[#FAFAF8]">
                    <td className="px-4 py-3 text-sm text-[var(--ink2)]">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ background: SOURCE_COLORS[entry.source] || "#6B7280" }}
                      >
                        {entry.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--ink)]">{formatINR(entry.amount)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--ink3)]">{entry.note || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink3)] hover:bg-[var(--red-bg)] hover:text-[var(--red)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── RIGHT ── */}
      <div className="space-y-4">
        {/* Donut chart */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
          <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Income by Source
          </h3>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={bySource} innerRadius="60%" outerRadius="80%" paddingAngle={3}>
                  {bySource.map((entry) => (
                    <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || "#9CA3AF"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                {formatINR(total)}
              </span>
              <span className="text-xs text-[var(--ink3)]">Total</span>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-3 space-y-2">
            {bySource.map((src) => (
              <div key={src.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: SOURCE_COLORS[src.name] || "#9CA3AF" }} />
                  {src.name}
                </span>
                <span className="text-[var(--ink2)]">
                  {Math.round((src.value / (total || 1)) * 100)}% · {formatINR(src.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Area chart */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
          <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Monthly Trend
          </h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE4" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v) => formatINR(v)} />
                <Area type="monotone" dataKey="amount" stroke="#7C3AED" fill="url(#incomeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

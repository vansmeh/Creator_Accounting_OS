import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { StatCard }  from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState }  from "../components/EmptyState";
import { useToast }    from "../components/Toast";
import { api }         from "../lib/api";
import { formatINR, formatDate, shortId } from "../lib/format";

export function InvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.invoices.getAll();
      setInvoices(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markPaid(id) {
    try {
      const updated = await api.invoices.update(id, { status: "paid" });
      setInvoices((prev) => prev.map((inv) => (inv._id === id ? updated : inv)));
      toast.success("Marked as paid");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function copyReminder(inv) {
    const msg = `Hi, this is a quick reminder for the pending payment of ${formatINR(inv.amount)} for ${inv.brandName}. Invoice ID: ${shortId(inv._id)}.`;
    await navigator.clipboard.writeText(msg);
    toast.success("Reminder copied");
  }

  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalPaid     = useMemo(() => invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalPending  = totalInvoiced - totalPaid;

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Invoiced" value={formatINR(totalInvoiced)} />
        <StatCard label="Total Paid"     value={formatINR(totalPaid)}     accentColor="var(--green)" />
        <StatCard label="Total Pending"  value={formatINR(totalPending)}  accentColor="var(--amber)" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Generate one from any deal's detail page."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" style={{ boxShadow: "var(--shadow-md)" }}>
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[#FAFAF8]">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-[var(--ink3)]">
                <th className="px-4 py-3">Invoice ID</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--ink2)]">{shortId(inv._id)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{inv.brandName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[var(--ink)]">{formatINR(inv.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-sm text-[var(--ink2)]">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {inv.status !== "paid" && (
                        <button
                          onClick={() => markPaid(inv._id)}
                          className="rounded-[var(--radius-sm)] bg-[var(--green-bg)] px-3 py-1 text-xs font-medium text-[var(--green)] hover:opacity-80"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => copyReminder(inv)}
                        className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1 text-xs text-[var(--ink2)] hover:bg-[var(--bg)]"
                      >
                        Copy Reminder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

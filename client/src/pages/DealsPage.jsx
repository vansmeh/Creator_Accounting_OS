import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Search, Briefcase } from "lucide-react";
import { BrandAvatar } from "../components/BrandAvatar";
import { StatusBadge }  from "../components/StatusBadge";
import { EmptyState }   from "../components/EmptyState";
import { Modal }        from "../components/Modal";
import { ActionButton } from "../components/ActionButton";
import { useToast }     from "../components/Toast";
import { api }          from "../lib/api";
import { formatINR, formatDate, daysUntil } from "../lib/format";

const FILTERS = ["All", "Pending", "Overdue", "Paid", "Partially Paid"];
const FILTER_STATUS = {
  All:            null,
  Pending:        ["sent", "draft", "follow-up"],
  Overdue:        ["overdue"],
  Paid:           ["paid"],
  "Partially Paid": ["partially-paid"],
};

const DELIVERABLES = ["Reel", "YouTube Video", "Story", "Blog Post", "Podcast", "Other"];
const STATUSES     = ["draft", "sent", "follow-up", "partially-paid", "paid", "overdue"];

const initialForm = {
  brandName: "", deliverable: "Reel", amountAgreed: "", amountReceived: "",
  dueDate: "", status: "sent", paymentLink: "", contentLink: "",
};

function AddDealForm({ onSubmit, onClose }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        amountAgreed:   Number(form.amountAgreed),
        amountReceived: Number(form.amountReceived || 0),
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
  const labelCls = "mb-1 block text-xs font-medium text-[var(--ink2)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Brand Name *</label>
        <input className={inputCls} required value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="e.g. Noise India" />
      </div>
      <div>
        <label className={labelCls}>Deliverable *</label>
        <select className={inputCls} required value={form.deliverable} onChange={(e) => set("deliverable", e.target.value)}>
          {DELIVERABLES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Amount Agreed (₹) *</label>
          <input className={inputCls} type="number" required min={0} value={form.amountAgreed} onChange={(e) => set("amountAgreed", e.target.value)} placeholder="50000" />
        </div>
        <div>
          <label className={labelCls}>Amount Received (₹)</label>
          <input className={inputCls} type="number" min={0} value={form.amountReceived} onChange={(e) => set("amountReceived", e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Due Date *</label>
          <input className={inputCls} type="date" required value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Payment Link</label>
        <input className={inputCls} type="url" value={form.paymentLink} onChange={(e) => set("paymentLink", e.target.value)} placeholder="https://razorpay.com/..." />
      </div>
      <div>
        <label className={labelCls}>Content / Proof of Work Link</label>
        <input className={inputCls} type="url" value={form.contentLink} onChange={(e) => set("contentLink", e.target.value)} placeholder="https://drive.google.com/..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving…" : "Save Deal"}
        </button>
        <button type="button" onClick={onClose} className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--ink2)] hover:bg-[var(--bg)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function RowMenu({ deal, onMarkPaid, onDelete }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--border)]"
      >
        <MoreHorizontal size={16} className="text-[var(--ink3)]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 min-w-[160px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-md)]"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: "View Detail",    action: () => navigate(`/deals/${deal._id}`) },
              { label: "Send Reminder",  action: () => navigate(`/deals/${deal._id}`) },
              { label: "Mark Paid",      action: () => { onMarkPaid(deal); setOpen(false); } },
              { label: "Delete",         action: () => { onDelete(deal._id); setOpen(false); }, danger: true },
            ].map(({ label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg)] ${danger ? "text-[var(--red)]" : "text-[var(--ink)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function DealsPage({ deals = [], loading, onAddDeal, onMarkPaid, onReload }) {
  const navigate = useNavigate();
  const toast    = useToast();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function handleCreate(payload) {
    try {
      await api.deals.create(payload);
      setModalOpen(false);
      onReload();
      toast.success("Deal created");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this deal?")) return;
    try {
      await api.deals.delete(id);
      onReload();
      toast.success("Deal deleted");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const filterStatuses = FILTER_STATUS[filter];
  const filtered = deals.filter((d) => {
    const matchFilter = !filterStatuses || filterStatuses.includes(d.status);
    const matchSearch = !search || d.brandName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            All Deals
          </h2>
          <span className="rounded-[var(--radius-pill)] bg-[var(--accent-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
            {deals.length}
          </span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Add Deal
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--card)] text-[var(--ink2)] hover:bg-[var(--border)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink3)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand..."
            className="rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--card)] py-1.5 pl-8 pr-4 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-14 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No deals yet"
          description="Add your first brand deal to start tracking payments."
          ctaLabel="Add Deal"
          ctaAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" style={{ boxShadow: "var(--shadow-md)" }}>
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[#FAFAF8]">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-[var(--ink3)]">
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Deliverable</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((deal) => {
                const pending = deal.pendingAmount ?? deal.amountAgreed - deal.amountReceived;
                const days    = daysUntil(deal.dueDate);
                return (
                  <tr
                    key={deal._id}
                    onClick={() => navigate(`/deals/${deal._id}`)}
                    className="cursor-pointer transition-colors hover:bg-[#FAFAF8]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <BrandAvatar name={deal.brandName} size={34} />
                        <div>
                          <p className="font-semibold text-[var(--ink)] leading-tight">{deal.brandName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink2)]">{deal.deliverable}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{formatINR(deal.amountAgreed)}</td>
                    <td className="px-4 py-3 text-sm">
                      {pending > 0
                        ? <span style={{ color: "var(--amber)" }} className="font-medium">{formatINR(pending)}</span>
                        : <span className="text-[var(--ink3)]">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={deal.status} /></td>
                    <td className="px-4 py-3 text-sm text-[var(--ink2)]">
                      <span>{formatDate(deal.dueDate)}</span>
                      {days < 0 && pending > 0 && (
                        <span className="ml-1.5 text-xs font-medium text-[var(--red)]">{Math.abs(days)}d late</span>
                      )}
                      {days >= 0 && days <= 7 && pending > 0 && (
                        <span className="ml-1.5 text-xs font-medium text-[var(--amber)]">in {days}d</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RowMenu deal={deal} onMarkPaid={onMarkPaid} onDelete={handleDelete} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Deal">
        <AddDealForm onSubmit={handleCreate} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

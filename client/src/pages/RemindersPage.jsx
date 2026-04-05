import { useMemo, useState } from "react";
import { Bell, CheckCircle2, Copy } from "lucide-react";
import { BrandAvatar }  from "../components/BrandAvatar";
import { useToast }     from "../components/Toast";
import { api }          from "../lib/api";
import { formatINR, formatDate, daysUntil } from "../lib/format";
import { buildReminderMessage, buildWhatsAppUrl } from "../lib/reminders";

const FILTERS = ["All", "Overdue", "Due This Week", "Followed Up"];
const TONES   = ["polite", "firm", "final"];

export function RemindersPage({ deals = [], onReload }) {
  const toast = useToast();
  const [filter, setFilter]   = useState("All");
  const [toneMap, setToneMap] = useState({});

  function getTone(id) { return toneMap[id] || "polite"; }
  function setTone(id, tone) { setToneMap((m) => ({ ...m, [id]: tone })); }

  const enriched = useMemo(() => {
    return deals
      .map((d) => {
        const pending  = d.pendingAmount ?? d.amountAgreed - d.amountReceived;
        const days     = daysUntil(d.dueDate);
        const isOverdue = days < 0 && pending > 0;
        const isDueThisWeek = days >= 0 && days <= 7 && pending > 0;
        const lastDays = d.lastFollowUpAt
          ? Math.floor((Date.now() - new Date(d.lastFollowUpAt)) / 86400000)
          : null;
        return { ...d, pending, days, isOverdue, isDueThisWeek, lastDays };
      })
      .filter((d) => {
        if (filter === "All")          return d.pending > 0;
        if (filter === "Overdue")      return d.isOverdue;
        if (filter === "Due This Week")return d.isDueThisWeek;
        if (filter === "Followed Up")  return d.lastFollowUpAt && d.pending > 0;
        return false;
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.days - b.days;
      });
  }, [deals, filter]);

  const overdueCount = useMemo(
    () => deals.filter((d) => {
      const pending = d.pendingAmount ?? d.amountAgreed - d.amountReceived;
      return pending > 0 && daysUntil(d.dueDate) < 0;
    }).length,
    [deals]
  );

  async function handleFollowUp(dealId) {
    try {
      await api.deals.markFollowUp(dealId);
      onReload();
      toast.success("Marked as followed up");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
          Reminders
        </h2>
        {overdueCount > 0 && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--red-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--red)]">
            {overdueCount} overdue
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--card)] text-[var(--ink2)] hover:bg-[var(--border)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--green)] bg-[var(--green-bg)] px-8 py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <CheckCircle2 size={24} style={{ color: "var(--green)" }} />
          </div>
          <h3 className="text-base font-semibold text-[var(--green)]" style={{ fontFamily: "var(--font-display)" }}>
            All caught up
          </h3>
          <p className="mt-1 text-sm text-[var(--green)]">No pending reminders. Great job staying on top of payments!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((deal) => {
            const tone    = getTone(deal._id);
            const message = buildReminderMessage(deal, tone);
            return (
              <div
                key={deal._id}
                className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  {/* Left info */}
                  <div className="flex flex-1 items-start gap-3">
                    <BrandAvatar name={deal.brandName} size={40} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[var(--ink)]">{deal.brandName}</p>
                        <span
                          className="rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: deal.isOverdue ? "var(--red-bg)" : "var(--amber-bg)",
                            color:      deal.isOverdue ? "var(--red)"    : "var(--amber)",
                          }}
                        >
                          {deal.isOverdue ? `${Math.abs(deal.days)}d overdue` : `Due in ${deal.days}d`}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--ink2)]">{deal.deliverable}</p>
                      <p
                        className="mt-1 text-2xl font-bold"
                        style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
                      >
                        {formatINR(deal.pending)}
                      </p>
                      <p className="text-xs text-[var(--ink3)]">
                        {deal.lastDays !== null
                          ? `Last contacted ${deal.lastDays} day${deal.lastDays !== 1 ? "s" : ""} ago`
                          : "Never followed up"}
                      </p>
                    </div>
                  </div>

                  {/* Right reminder */}
                  <div className="flex-1 md:max-w-sm">
                    {/* Tone tabs */}
                    <div className="mb-2 flex gap-1">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(deal._id, t)}
                          className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                            tone === t ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] text-[var(--ink2)] hover:bg-[var(--border)]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="mb-2 rounded-[var(--radius-md)] bg-[var(--bg)] px-3 py-2 text-xs italic leading-5 text-[var(--ink2)]">
                      {message}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(message); toast.success("Copied!"); }}
                        className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink2)] hover:bg-[var(--bg)]"
                      >
                        <Copy size={12} /> Copy
                      </button>
                      <a
                        href={buildWhatsAppUrl(message)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[var(--radius-md)] bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => handleFollowUp(deal._id)}
                        className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--ink3)] hover:bg-[var(--bg)]"
                      >
                        Mark Followed Up
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

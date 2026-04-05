import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronRight, Copy, ExternalLink, Sparkles } from "lucide-react";
import { BrandAvatar }  from "../components/BrandAvatar";
import { StatusBadge }  from "../components/StatusBadge";
import { useToast }     from "../components/Toast";
import { Modal }        from "../components/Modal";
import { api }          from "../lib/api";
import { formatINR, formatDate, daysUntil } from "../lib/format";
import { buildReminderMessage, buildWhatsAppUrl } from "../lib/reminders";

const TONES = ["polite", "firm", "final"];

export function DealDetailPage({ deals, onCreateInvoice, onMarkPaid, onReload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const deal = useMemo(() => deals.find((d) => d._id === id), [deals, id]);

  const [activeTab,   setActiveTab]   = useState("polite");
  const [noteText,    setNoteText]    = useState("");
  const [savingNote,  setSavingNote]  = useState(false);
  const [aiModal,     setAiModal]     = useState(null); // { title, content }
  const [aiLoading,   setAiLoading]   = useState(false);
  const [contractText,setContractText]= useState("");
  const [aiTool,      setAiTool]      = useState(null); // "reminder"|"research"|"contract"

  if (!deal) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-6 text-center" style={{ boxShadow: "var(--shadow-md)" }}>
        <p className="text-[var(--ink2)]">Deal not found.</p>
        <button onClick={() => navigate("/deals")} className="mt-4 text-sm text-[var(--accent)] hover:underline">← Back to deals</button>
      </div>
    );
  }

  const pending = deal.pendingAmount ?? deal.amountAgreed - deal.amountReceived;
  const days    = daysUntil(deal.dueDate);
  const message = buildReminderMessage(deal, activeTab);

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.deals.addNote(deal._id, noteText.trim());
      setNoteText("");
      onReload();
      toast.success("Note added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleMarkFollowUp() {
    try {
      await api.deals.markFollowUp(deal._id);
      onReload();
      toast.success("Marked as followed up");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAiAction(tool) {
    setAiTool(tool);
    setAiLoading(true);
    setAiModal({
      title: tool === "reminder" ? "AI Reminder" : tool === "research" ? `Brand Research: ${deal.brandName}` : "Contract Scan Results",
      content: null,
    });

    // Use mock results — no real API call
    await new Promise((r) => setTimeout(r, 2000));

    if (tool === "reminder") {
      // Use firm tone for AI rewrite
      const msg = buildReminderMessage(deal, "firm");
      setAiModal({ title: "AI Reminder", content: msg });
    } else if (tool === "research") {
      setAiModal({
        title: `Brand Research: ${deal.brandName}`,
        content: {
          about: `A growing D2C brand, ${deal.brandName} is known for aggressive influencer marketing campaigns. They typically work with mid-tier creators for product launches and awareness campaigns.`,
          typicalDealRange: { low: 20000, high: 80000 },
          paymentReputation: "mixed",
          redFlags: ["Long approval cycles (2–3 weeks)", "Frequent revision requests after approval"],
          greenFlags: ["Clear brief provided upfront", "Pays within 30 days usually"],
          negotiationTips: [
            "Ask for 50% advance before starting",
            "Get the brief approved in writing before shooting",
            "Clarify usage rights in the first email",
          ],
        },
      });
    } else if (tool === "contract") {
      setAiModal({
        title: "Contract Scan Results",
        content: [
          { severity: "high",   clause: "Exclusivity window of 6 months",      risk: "Blocks you from working with competing brands for 6 months",                    suggestion: "Negotiate down to 30 days or remove entirely" },
          { severity: "medium", clause: "Payment within 45 days of invoice",   risk: "Industry standard is 30 days. You may wait longer than expected",              suggestion: "Push for NET-30 payment terms" },
          { severity: "low",    clause: "Brand retains right to repurpose content", risk: "They can use your content in ads without additional payment",              suggestion: "Add a clause limiting repurposing to 90 days" },
        ],
      });
    }

    setAiLoading(false);
  }

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--ink3)]">
        <Link to="/deals" className="hover:text-[var(--accent)]">Deals</Link>
        <ChevronRight size={14} />
        <span className="text-[var(--ink)]">{deal.brandName}</span>
      </nav>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        {/* ── LEFT ── */}
        <div className="space-y-4">
          {/* Card 1 — Header */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandAvatar name={deal.brandName} size={48} />
                <div>
                  <h2 className="text-2xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                    {deal.brandName}
                  </h2>
                  <p className="text-sm text-[var(--ink2)]">{deal.deliverable}</p>
                </div>
              </div>
              <StatusBadge status={deal.status} />
            </div>
            {days < 0 && pending > 0 && (
              <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--red-bg)] px-4 py-2.5 text-sm font-medium text-[var(--red)]">
                {Math.abs(days)} days overdue — send a reminder now
              </div>
            )}
            {days >= 0 && days <= 7 && pending > 0 && (
              <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--amber-bg)] px-4 py-2.5 text-sm font-medium text-[var(--amber)]">
                Due in {days} day{days !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Card 2 — Financials */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Agreed", value: deal.amountAgreed, bg: "var(--bg)" },
              { label: "Received", value: deal.amountReceived, bg: "var(--bg)" },
              { label: "Pending", value: pending, bg: pending > 0 ? "var(--red-bg)" : "var(--green-bg)" },
            ].map(({ label, value, bg }) => (
              <div key={label} className="rounded-[var(--radius-md)] p-4" style={{ background: bg }}>
                <p className="text-xs text-[var(--ink3)]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                  {formatINR(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Card 3 — Details */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5 space-y-3" style={{ boxShadow: "var(--shadow-md)" }}>
            <h3 className="text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Details</h3>
            <div className="space-y-2 text-sm">
              <Row label="Due Date" value={formatDate(deal.dueDate)} />
              <Row label="Last Follow-up" value={deal.lastFollowUpAt ? formatDate(deal.lastFollowUpAt) : "Never"} />
              {deal.contentLink && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink3)]">Proof of Work</span>
                  <a href={deal.contentLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--accent)] hover:underline">
                    View <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {deal.paymentLink && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink3)]">Payment Link</span>
                  <div className="flex items-center gap-2">
                    <a href={deal.paymentLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--accent)] hover:underline">
                      Open <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(deal.paymentLink);
                        toast.success("Copied!");
                      }}
                      className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--ink2)] hover:bg-[var(--bg)]"
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 4 — Notes */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
            <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Notes</h3>
            {(deal.notes || []).length === 0 ? (
              <p className="text-xs text-[var(--ink3)]">No notes yet.</p>
            ) : (
              <div className="mb-3 space-y-2">
                {deal.notes.map((note, i) => (
                  <div key={i} className="rounded-[var(--radius-md)] bg-[var(--bg)] px-3 py-2">
                    <p className="text-sm text-[var(--ink)]">{note.text}</p>
                    <p className="mt-1 text-xs text-[var(--ink3)]">{formatDate(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className={inputCls}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={savingNote || !noteText.trim()}
                className="shrink-0 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {pending > 0 && (
              <button
                onClick={() => onMarkPaid(deal)}
                className="rounded-[var(--radius-md)] bg-[var(--green)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Mark Paid
              </button>
            )}
            <button
              onClick={() => onCreateInvoice(deal)}
              className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              Create Invoice
            </button>
            <button
              onClick={() => navigate("/deals")}
              className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm text-[var(--ink2)] hover:bg-[var(--bg)]"
            >
              Back
            </button>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-4">
          {/* Card 5 — Reminders */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
            <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Send Reminder</h3>
            {/* Tone tabs */}
            <div className="mb-3 flex gap-1">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    activeTab === t ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] text-[var(--ink2)] hover:bg-[var(--border)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Message preview */}
            <div className="mb-3 rounded-[var(--radius-md)] bg-[var(--bg)] px-4 py-3 text-sm italic leading-6 text-[var(--ink2)]">
              {message}
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => { await navigator.clipboard.writeText(message); toast.success("Copied!"); }}
                className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--ink2)] hover:bg-[var(--bg)]"
              >
                <Copy size={13} /> Copy
              </button>
              <a
                href={buildWhatsAppUrl(message)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                WhatsApp
              </a>
            </div>
            <button
              onClick={handleMarkFollowUp}
              className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--border)] py-2 text-xs text-[var(--ink2)] hover:bg-[var(--bg)]"
            >
              Mark Followed Up
            </button>
          </div>

          {/* Card 7 — AI Assist */}
          <div
            className="rounded-[var(--radius-lg)] p-5 space-y-3"
            style={{ background: "var(--accent-light)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
                AI Tools for this Deal
              </h3>
            </div>
            {[
              { key: "reminder", label: "Rewrite Reminder with AI" },
              { key: "research", label: "Research this Brand" },
              { key: "contract", label: "Scan Contract" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "contract") {
                    setAiTool("contract");
                    setAiModal({ title: "Scan Contract", content: "input" });
                  } else {
                    handleAiAction(key);
                  }
                }}
                className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-left text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      <Modal
        open={!!aiModal}
        onClose={() => setAiModal(null)}
        title={aiModal?.title || "AI Result"}
      >
        {aiLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : aiModal?.content === "input" ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--ink2)]">Paste the brand email or contract text:</p>
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              rows={10}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Paste contract or email text here..."
            />
            <button
              onClick={() => handleAiAction("contract")}
              disabled={!contractText.trim()}
              className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              Scan for Red Flags
            </button>
          </div>
        ) : typeof aiModal?.content === "string" ? (
          <div>
            <div className="rounded-[var(--radius-md)] bg-[#F8F4FF] px-4 py-4 text-sm leading-7 text-[var(--ink)] whitespace-pre-wrap">
              {aiModal.content}
            </div>
            <button
              onClick={async () => { await navigator.clipboard.writeText(aiModal.content); toast.success("Copied!"); }}
              className="mt-3 flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
            >
              <Copy size={13} /> Copy message
            </button>
          </div>
        ) : aiModal?.content ? (
          <AiJsonResult content={aiModal.content} tool={aiTool} />
        ) : null}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--ink3)]">{label}</span>
      <span className="text-[var(--ink)]">{value}</span>
    </div>
  );
}

function AiJsonResult({ content, tool }) {
  if (tool === "research" && typeof content === "object") {
    const r = content;
    return (
      <div className="space-y-4 text-sm">
        {r.about && <p className="leading-6 text-[var(--ink)]">{r.about}</p>}
        {r.typicalDealRange && (
          <p className="text-[var(--ink2)]">
            Typical deal: {formatINR(r.typicalDealRange.low)} – {formatINR(r.typicalDealRange.high)}
          </p>
        )}
        {r.redFlags?.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-[var(--red)]">Red Flags</p>
            <ul className="list-disc pl-4 text-[var(--red)] space-y-1">
              {r.redFlags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
        {r.greenFlags?.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-[var(--green)]">Green Flags</p>
            <ul className="list-disc pl-4 text-[var(--green)] space-y-1">
              {r.greenFlags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
        {r.negotiationTips?.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-[var(--ink)]">Negotiation Tips</p>
            <ul className="list-disc pl-4 text-[var(--ink2)] space-y-1">
              {r.negotiationTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (tool === "contract" && Array.isArray(content)) {
    if (content.length === 0) {
      return <p className="text-sm text-[var(--green)]">No major red flags found. Still review carefully.</p>;
    }
    return (
      <div className="space-y-3">
        {content.map((flag, i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
            <span className={`inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-semibold ${
              flag.severity === "high" ? "bg-[var(--red-bg)] text-[var(--red)]"
              : flag.severity === "medium" ? "bg-[var(--amber-bg)] text-[var(--amber)]"
              : "bg-[var(--blue-bg)] text-[var(--blue)]"
            }`}>{flag.severity}</span>
            <p className="mt-2 font-mono text-xs text-[var(--ink)]">{flag.clause}</p>
            <p className="mt-1.5 text-xs text-[var(--red)]">{flag.risk}</p>
            <p className="mt-1 text-xs text-[var(--green)]">{flag.suggestion}</p>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(content, null, 2)}</pre>;
}

import { useMemo, useState } from "react";
import {
  FileSearch, BarChart2, Search, MessageSquare, TrendingUp, Mail,
  Sparkles, Copy, Loader2,
} from "lucide-react";
import { useToast }     from "../components/Toast";
import { formatINR, daysUntil, formatDate } from "../lib/format";
import { buildReminderMessage } from "../lib/reminders";

const TOOLS = [
  { id: "contract",  icon: FileSearch,    name: "Contract Scanner",      description: "Scan brand emails or contracts for red flags" },
  { id: "benchmark", icon: BarChart2,     name: "Rate Benchmarker",      description: "Get market rate ranges for your deliverables" },
  { id: "research",  icon: Search,        name: "Brand Researcher",      description: "Research a brand before signing the deal" },
  { id: "reminder",  icon: MessageSquare, name: "AI Reminder Writer",    description: "Generate a human-sounding payment reminder" },
  { id: "forecast",  icon: TrendingUp,    name: "Cash Flow Forecaster",  description: "Predict when money will actually arrive" },
  { id: "coming",    icon: Mail,          name: "Brand Email Generator", description: "Auto-write pitch emails to brands", disabled: true },
];

const NICHES    = ["Tech", "Lifestyle", "Finance", "Food", "Fashion", "Fitness", "Gaming", "Other"];
const PLATFORMS = ["Instagram", "YouTube", "Twitter/X", "LinkedIn", "Podcast"];
const DELIVS    = ["Reel", "YouTube Video", "Story", "Tweet Thread", "Podcast Ad", "Other"];
const TONES     = ["polite", "firm", "final"];

const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
const labelCls = "mb-1 block text-xs font-medium text-[var(--ink2)]";

function Spinner() {
  return <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />;
}

// ── Mock results ──────────────────────────────────────────────────────────────
const MOCK_CONTRACT = [
  {
    severity: "high",
    clause: "Exclusivity window of 6 months",
    risk: "Blocks you from working with competing brands for 6 months",
    suggestion: "Negotiate down to 30 days or remove entirely",
  },
  {
    severity: "medium",
    clause: "Payment within 45 days of invoice",
    risk: "Industry standard is 30 days. You may wait longer than expected",
    suggestion: "Push for NET-30 payment terms",
  },
  {
    severity: "low",
    clause: "Brand retains right to repurpose content",
    risk: "They can use your content in ads without additional payment",
    suggestion: "Add a clause limiting repurposing to 90 days",
  },
];

function getMockBenchmark(form) {
  return {
    lowEnd:    15000,
    midRange:  35000,
    highEnd:   75000,
    reasoning: `Based on current market rates for ${form.platform} ${form.deliverable}s in the ${form.niche} niche with ${Number(form.followers).toLocaleString("en-IN")} followers. Brands typically pay a premium for high engagement rates over raw follower count.`,
    tips: [
      "Always ask for usage rights fee separately (30–50% of base rate)",
      "Charge 2× for exclusivity windows over 30 days",
      "Add a revision limit (max 2 revisions) in your rate card",
    ],
  };
}

function getMockResearch(brandName) {
  return {
    about: `A growing D2C brand, ${brandName} is known for aggressive influencer marketing campaigns across Instagram and YouTube. They typically work with mid-tier creators (10K–200K followers) for product launches and awareness campaigns.`,
    typicalDealRange: { low: 20000, high: 80000 },
    paymentReputation: "mixed",
    redFlags: ["Long approval cycles (2–3 weeks)", "Frequent revision requests after approval"],
    greenFlags: ["Clear brief provided upfront", "Pays within 30 days usually"],
    negotiationTips: [
      "Ask for 50% advance before starting",
      "Get the brief approved in writing before shooting",
      "Clarify usage rights in the first email",
    ],
  };
}

function getMockForecast(deals) {
  const now    = new Date();
  const d30    = new Date(now); d30.setDate(d30.getDate() + 30);
  const d60    = new Date(now); d60.setDate(d60.getDate() + 60);
  const d90    = new Date(now); d90.setDate(d90.getDate() + 90);

  const pending = deals.filter((d) => d.status !== "paid");

  let next30 = 0, next60 = 0, next90 = 0, atRisk = 0;
  const timeline = [];

  pending.forEach((deal) => {
    const due     = deal.dueDate ? new Date(deal.dueDate) : null;
    if (!due) return;
    const amount  = Math.max((deal.amountAgreed || 0) - (deal.amountReceived || 0), 0);
    const delayed = new Date(due);
    delayed.setDate(delayed.getDate() + 12); // avg 12d delay

    if (delayed <= d30) next30 += amount;
    if (delayed <= d60) next60 += amount;
    if (delayed <= d90) next90 += amount;
    if (due < now)      atRisk += amount;

    timeline.push({
      date:           formatDate(delayed),
      expectedAmount: amount,
      dealOrSource:   deal.brandName,
    });
  });

  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    next30Days: next30,
    next60Days: next60,
    next90Days: next90,
    atRisk,
    recommendations: [
      "Follow up on overdue deals immediately — each day adds friction",
      "Ask new brands for 50% upfront to reduce collection risk",
      "Set calendar reminders 3 days before each due date",
    ],
    timeline: timeline.slice(0, 8),
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIToolsPage({ deals = [], income = [] }) {
  const toast   = useToast();
  const [active, setActive]   = useState("contract");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  // Tool-specific form state
  const [contractText,  setContractText]  = useState("");
  const [benchForm,     setBenchForm]     = useState({ niche: "Tech", platform: "Instagram", deliverable: "Reel", followers: "" });
  const [brandName,     setBrandName]     = useState("");
  const [reminderForm,  setReminderForm]  = useState({ brandName: "", amount: "", deliverable: "", daysOverdue: "0", tone: "polite", dealHistory: "" });

  function switchTool(id) { setActive(id); setResult(null); }

  async function fakeFetch(fn) {
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      setResult(fn());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reminder: computed instantly, no delay
  function getLocalReminder() {
    const deal = {
      brandName:      reminderForm.brandName || "Brand",
      deliverable:    reminderForm.deliverable || "deliverable",
      amountAgreed:   Number(reminderForm.amount) || 0,
      amountReceived: 0,
      dueDate:        new Date(Date.now() - Number(reminderForm.daysOverdue) * 86400000).toISOString(),
      paymentLink:    "",
    };
    return { result: buildReminderMessage(deal, reminderForm.tone) };
  }

  // ── Workspace renderers ───────────────────────────────────────────────────
  function renderWorkspace() {
    switch (active) {

      // Contract Scanner ─────────────────────────────────────────────────────
      case "contract":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Paste brand email or contract text</label>
              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                rows={10}
                className={inputCls}
                placeholder="Paste the contract or email here..."
              />
            </div>
            <button
              disabled={loading || !contractText.trim()}
              onClick={() => fakeFetch(() => MOCK_CONTRACT)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {loading ? <Spinner /> : <Sparkles size={15} />}
              {loading ? "Analyzing contract…" : "Scan for Red Flags"}
            </button>

            {Array.isArray(result) && result.length === 0 && (
              <div className="rounded-[var(--radius-md)] bg-[var(--green-bg)] px-4 py-3 text-sm text-[var(--green)]">
                No major red flags found. Still review carefully.
              </div>
            )}
            {Array.isArray(result) && result.length > 0 && (
              <div className="space-y-3">
                {result.map((flag, i) => (
                  <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border)] p-4">
                    <span className={`inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-semibold ${
                      flag.severity === "high"   ? "bg-[var(--red-bg)] text-[var(--red)]"
                      : flag.severity === "medium"? "bg-[var(--amber-bg)] text-[var(--amber)]"
                      : "bg-[var(--blue-bg)] text-[var(--blue)]"
                    }`}>{flag.severity}</span>
                    <p className="mt-2 font-mono text-xs text-[var(--ink)]">{flag.clause}</p>
                    <p className="mt-1.5 text-sm text-[var(--red)]">{flag.risk}</p>
                    <p className="mt-1 text-sm text-[var(--green)]">{flag.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // Rate Benchmarker ─────────────────────────────────────────────────────
      case "benchmark":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Your Niche",  field: "niche",       opts: NICHES },
                { label: "Platform",    field: "platform",    opts: PLATFORMS },
                { label: "Deliverable", field: "deliverable", opts: DELIVS },
              ].map(({ label, field, opts }) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <select className={inputCls} value={benchForm[field]} onChange={(e) => setBenchForm((f) => ({ ...f, [field]: e.target.value }))}>
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className={labelCls}>Follower Count</label>
                <input className={inputCls} type="number" min={0} value={benchForm.followers} onChange={(e) => setBenchForm((f) => ({ ...f, followers: e.target.value }))} placeholder="50000" />
              </div>
            </div>
            <button
              disabled={loading || !benchForm.followers}
              onClick={() => fakeFetch(() => getMockBenchmark(benchForm))}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {loading ? <Spinner /> : <BarChart2 size={15} />}
              {loading ? "Calculating…" : "Get Market Rate"}
            </button>
            {result && typeof result === "object" && !Array.isArray(result) && result.lowEnd !== undefined && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Low End",   value: result.lowEnd },
                    { label: "Mid Range", value: result.midRange },
                    { label: "High End",  value: result.highEnd },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-center">
                      <p className="text-xs text-[var(--ink3)]">{label}</p>
                      <p className="mt-1 text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                        {formatINR(value)}
                      </p>
                    </div>
                  ))}
                </div>
                {result.reasoning && <p className="text-sm leading-6 text-[var(--ink2)]">{result.reasoning}</p>}
                {result.tips?.length > 0 && (
                  <ul className="list-disc space-y-1 pl-4">
                    {result.tips.map((tip, i) => <li key={i} className="text-sm text-[var(--ink2)]">{tip}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        );

      // Brand Researcher ─────────────────────────────────────────────────────
      case "research":
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                className={inputCls}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name, e.g. Noise India"
                onKeyDown={(e) => e.key === "Enter" && brandName.trim() && fakeFetch(() => getMockResearch(brandName))}
              />
              <button
                disabled={loading || !brandName.trim()}
                onClick={() => fakeFetch(() => getMockResearch(brandName))}
                className="shrink-0 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {loading ? <Spinner /> : "Research"}
              </button>
            </div>
            {result && typeof result === "object" && result.about && (
              <div className="space-y-4 text-sm">
                <div className="rounded-[var(--radius-md)] bg-[var(--bg)] px-4 py-3 leading-6 text-[var(--ink)]">{result.about}</div>
                <div className="flex flex-wrap items-center gap-3">
                  {result.typicalDealRange && (
                    <p className="text-[var(--ink2)]">
                      Typical deal: <strong>{formatINR(result.typicalDealRange.low)}</strong> — <strong>{formatINR(result.typicalDealRange.high)}</strong>
                    </p>
                  )}
                  {result.paymentReputation && (
                    <span className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${
                      result.paymentReputation === "good" ? "bg-[var(--green-bg)] text-[var(--green)]"
                      : result.paymentReputation === "poor" ? "bg-[var(--red-bg)] text-[var(--red)]"
                      : "bg-[var(--amber-bg)] text-[var(--amber)]"
                    }`}>Payment: {result.paymentReputation}</span>
                  )}
                </div>
                {result.redFlags?.length > 0 && (
                  <div><p className="mb-1 font-semibold text-[var(--red)]">Red Flags</p>
                    <ul className="list-disc space-y-1 pl-4 text-[var(--red)]">{result.redFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}
                {result.greenFlags?.length > 0 && (
                  <div><p className="mb-1 font-semibold text-[var(--green)]">Green Flags</p>
                    <ul className="list-disc space-y-1 pl-4 text-[var(--green)]">{result.greenFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}
                {result.negotiationTips?.length > 0 && (
                  <div><p className="mb-1 font-semibold text-[var(--ink)]">Negotiation Tips</p>
                    <ul className="list-disc space-y-1 pl-4 text-[var(--ink2)]">{result.negotiationTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      // AI Reminder Writer ───────────────────────────────────────────────────
      case "reminder": {
        const liveMsg = reminderForm.brandName && reminderForm.amount
          ? getLocalReminder().result
          : null;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Brand Name</label><input className={inputCls} value={reminderForm.brandName} onChange={(e) => setReminderForm((f) => ({ ...f, brandName: e.target.value }))} placeholder="Noise India" /></div>
              <div><label className={labelCls}>Amount (₹)</label><input className={inputCls} type="number" value={reminderForm.amount} onChange={(e) => setReminderForm((f) => ({ ...f, amount: e.target.value }))} placeholder="50000" /></div>
              <div><label className={labelCls}>Deliverable</label><input className={inputCls} value={reminderForm.deliverable} onChange={(e) => setReminderForm((f) => ({ ...f, deliverable: e.target.value }))} placeholder="Instagram Reel" /></div>
              <div><label className={labelCls}>Days Overdue</label><input className={inputCls} type="number" min={0} value={reminderForm.daysOverdue} onChange={(e) => setReminderForm((f) => ({ ...f, daysOverdue: e.target.value }))} /></div>
            </div>
            <div>
              <label className={labelCls}>Tone</label>
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <button key={t} onClick={() => setReminderForm((f) => ({ ...f, tone: t }))}
                    className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-sm font-medium capitalize transition-colors ${reminderForm.tone === t ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] text-[var(--ink2)] hover:bg-[var(--border)]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Any context (optional)</label>
              <textarea className={inputCls} rows={2} value={reminderForm.dealHistory} onChange={(e) => setReminderForm((f) => ({ ...f, dealHistory: e.target.value }))} placeholder="e.g. They've been ghosting for 2 weeks" />
            </div>
            {liveMsg && (
              <div>
                <div className="max-w-md rounded-[var(--radius-lg)] bg-[#DCF8C6] px-5 py-4 text-sm leading-7 text-[var(--ink)]">
                  {liveMsg}
                </div>
                <div className="mt-3 flex gap-3">
                  <button onClick={async () => { await navigator.clipboard.writeText(liveMsg); toast.success("Copied!"); }}
                    className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline">
                    <Copy size={13} /> Copy
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(liveMsg)}`} target="_blank" rel="noreferrer"
                    className="text-sm text-[#25D366] hover:underline">WhatsApp</a>
                </div>
              </div>
            )}
            {!liveMsg && (
              <p className="text-xs text-[var(--ink3)]">Fill in Brand Name and Amount to generate a reminder instantly.</p>
            )}
          </div>
        );
      }

      // Cash Flow Forecaster ─────────────────────────────────────────────────
      case "forecast": {
        const forecast = result && typeof result === "object" && result.next30Days !== undefined ? result : null;
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--ink2)]">
              Uses your {deals.length} deal{deals.length !== 1 ? "s" : ""} and {income.length} income {income.length !== 1 ? "entries" : "entry"} to forecast cash flow.
            </p>
            <button
              disabled={loading}
              onClick={() => fakeFetch(() => getMockForecast(deals))}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {loading ? <Spinner /> : <TrendingUp size={15} />}
              {loading ? "Forecasting…" : "Run Forecast"}
            </button>
            {forecast && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Next 30 Days", value: forecast.next30Days },
                    { label: "Next 60 Days", value: forecast.next60Days },
                    { label: "Next 90 Days", value: forecast.next90Days },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-center">
                      <p className="text-xs text-[var(--ink3)]">{label}</p>
                      <p className="mt-1 text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>{formatINR(value || 0)}</p>
                    </div>
                  ))}
                </div>
                {forecast.atRisk > 0 && (
                  <div className="rounded-[var(--radius-md)] bg-[var(--red-bg)] px-4 py-3 text-sm font-medium text-[var(--red)]">
                    At risk: {formatINR(forecast.atRisk)} — deals that may not pay on time
                  </div>
                )}
                {forecast.recommendations?.length > 0 && (
                  <div><p className="mb-2 font-semibold text-[var(--ink)]">Recommendations</p>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--ink2)]">{forecast.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                )}
                {forecast.timeline?.length > 0 && (
                  <div>
                    <p className="mb-2 font-semibold text-[var(--ink)]">Expected Timeline</p>
                    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                        <thead className="bg-[#FAFAF8]"><tr className="text-xs font-medium text-[var(--ink3)]">
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">From</th>
                        </tr></thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {forecast.timeline.map((row, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 text-[var(--ink2)]">{row.date}</td>
                              <td className="px-4 py-2 font-medium text-[var(--ink)]">{formatINR(row.expectedAmount || 0)}</td>
                              <td className="px-4 py-2 text-[var(--ink2)]">{row.dealOrSource}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  }

  return (
    <div className="space-y-5">
      {/* Tool cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const Icon    = tool.icon;
          const isActive= active === tool.id;
          return (
            <button
              key={tool.id}
              disabled={tool.disabled}
              onClick={() => !tool.disabled && switchTool(tool.id)}
              className={`text-left rounded-[var(--radius-lg)] border p-4 transition-all ${
                tool.disabled
                  ? "cursor-not-allowed opacity-50 border-[var(--border)] bg-[var(--card)]"
                  : isActive
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
              }`}
              style={{ boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-sm)" }}
            >
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] ${isActive ? "bg-[var(--accent)]" : "bg-[var(--accent-light)]"}`}>
                <Icon size={18} style={{ color: isActive ? "white" : "var(--accent)" }} />
              </div>
              <p className={`text-sm font-semibold ${isActive ? "text-[var(--accent)]" : "text-[var(--ink)]"}`} style={{ fontFamily: "var(--font-display)" }}>
                {tool.name}
                {tool.disabled && <span className="ml-2 text-xs font-normal text-[var(--ink3)]">Coming Soon</span>}
              </p>
              <p className="mt-1 text-xs text-[var(--ink3)]">{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Workspace */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-6" style={{ boxShadow: "var(--shadow-md)" }}>
        <div className="mb-5 flex items-center gap-2">
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-base font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            {TOOLS.find((t) => t.id === active)?.name}
          </h3>
        </div>
        {renderWorkspace()}
      </div>
    </div>
  );
}

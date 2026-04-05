import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee, Briefcase, Clock, CheckCircle2, Sparkles, ArrowRight,
  AlertTriangle, Zap, TrendingUp, TrendingDown, Shield, Send,
  CalendarClock, ChevronRight, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { BrandAvatar }  from "../components/BrandAvatar";
import { StatusBadge }  from "../components/StatusBadge";
import { EmptyState }   from "../components/EmptyState";
import { formatINR, formatDate, daysUntil, monthKey } from "../lib/format";
import { buildReminderMessage, buildWhatsAppUrl } from "../lib/reminders";

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCE_COLORS = {
  YouTube:     "#EF4444",
  Instagram:   "#EC4899",
  Affiliate:   "#22C55E",
  "Brand Deal":"var(--accent)",
  Other:       "#6B7280",
};

const GOAL = 50000;

// ── Small helpers ─────────────────────────────────────────────────────────────
function pending(deal) {
  return Math.max((deal.amountAgreed || 0) - (deal.amountReceived || 0), 0);
}

function Skeleton({ h = "h-24", w = "w-full" }) {
  return <div className={`skeleton ${h} ${w} rounded-[var(--radius-lg)]`} />;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <Skeleton h="h-14" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4].map((i) => <Skeleton key={i} h="h-28" />)}
      </div>
      <Skeleton h="h-40" />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Skeleton h="h-72" /><Skeleton h="h-72" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
        <Skeleton h="h-64" /><Skeleton h="h-64" />
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--card)] px-3 py-2 text-xs" style={{ boxShadow: "var(--shadow-md)" }}>
      <p className="mb-1 font-semibold text-[var(--ink)]">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill === "url(#projGrad)" ? "#A78BFA" : p.fill }}>
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── SVG circular progress ─────────────────────────────────────────────────────
function CircularProgress({ percent, size = 96 }) {
  const r    = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = ((Math.min(percent, 100) / 100) * circ).toFixed(1);
  const cx   = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx} textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: size * 0.2, fill:"var(--ink)" }}>
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, cardBg, subLabel, subLabelColor }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: cardBg || "var(--card)", boxShadow: "var(--shadow-md)" }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: iconBg }}>
        <Icon size={20} color="white" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink3)]">{label}</p>
      <p className="mt-1 text-[26px] font-semibold leading-tight text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}>{value}</p>
      {subLabel && (
        <p className="mt-1 text-[11px] font-medium" style={{ color: subLabelColor || "var(--ink3)" }}>{subLabel}</p>
      )}
    </div>
  );
}

// ── Money Alert Banner ────────────────────────────────────────────────────────
function AlertBanner({ overdueDeals, dueSoonDeals, overdueTotal, navigate }) {
  if (overdueDeals.length > 0) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] px-5 py-3.5"
        style={{ background: "var(--red-bg)", border: "1px solid #FECACA" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--red)]">
            <AlertTriangle size={15} color="white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--red)]">
              {overdueDeals.length} payment{overdueDeals.length > 1 ? "s" : ""} overdue —{" "}
              {formatINR(overdueTotal)} at risk.
            </span>
            <span className="ml-1.5 text-sm text-[var(--red)] opacity-80">
              Each day you wait adds friction.
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate("/reminders")}
          className="shrink-0 rounded-[var(--radius-md)] bg-[var(--red)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Send Reminders →
        </button>
      </div>
    );
  }
  if (dueSoonDeals.length > 0) {
    const soonTotal = dueSoonDeals.reduce((s, d) => s + pending(d), 0);
    return (
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] px-5 py-3.5"
        style={{ background: "var(--amber-bg)", border: "1px solid #FDE68A" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--amber)]">
            <CalendarClock size={15} color="white" />
          </div>
          <span className="text-sm font-semibold text-[var(--amber)]">
            {dueSoonDeals.length} deal{dueSoonDeals.length > 1 ? "s" : ""} due within 7 days —{" "}
            {formatINR(soonTotal)} incoming soon.
          </span>
        </div>
        <button
          onClick={() => navigate("/deals")}
          className="shrink-0 rounded-[var(--radius-md)] bg-[var(--amber)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          View Deals →
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] px-5 py-3"
      style={{ background: "var(--green-bg)", border: "1px solid #BBF7D0" }}>
      <CheckCircle2 size={16} style={{ color: "var(--green)" }} className="shrink-0" />
      <span className="text-sm font-medium text-[var(--green)]">
        All payments on track. No overdue or urgent deals right now.
      </span>
    </div>
  );
}

// ── Today's Actions ───────────────────────────────────────────────────────────
function TodayActions({ overdueDeals, dueSoonDeals, onMarkPaid, navigate }) {
  const items = [
    ...overdueDeals.map((d) => ({ deal: d, urgency: "overdue", days: Math.abs(daysUntil(d.dueDate)) })),
    ...dueSoonDeals.map((d) => ({ deal: d, urgency: "soon",    days: daysUntil(d.dueDate) })),
  ].slice(0, 5);

  if (items.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Today's Actions
          </h3>
          <span className="rounded-[var(--radius-pill)] bg-[var(--accent-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
            {items.length}
          </span>
        </div>
        <button onClick={() => navigate("/reminders")} className="text-xs text-[var(--accent)] hover:underline">
          All reminders →
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map(({ deal, urgency, days }) => {
          const amt     = pending(deal);
          const reminder= buildReminderMessage(deal, urgency === "overdue" ? "firm" : "polite");
          return (
            <div
              key={deal._id}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3"
              style={{
                background: urgency === "overdue" ? "#FFF8F8" : "#FFFBF0",
                border: `1px solid ${urgency === "overdue" ? "#FECACA" : "#FDE68A"}`,
              }}
            >
              <BrandAvatar name={deal.brandName} size={32} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{deal.brandName}</p>
                <p className="text-xs text-[var(--ink3)]">
                  {deal.deliverable} ·{" "}
                  <span style={{ color: urgency === "overdue" ? "var(--red)" : "var(--amber)", fontWeight: 600 }}>
                    {urgency === "overdue" ? `${days}d overdue` : `due in ${days}d`}
                  </span>
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                {formatINR(amt)}
              </p>
              <div className="flex shrink-0 gap-1.5">
                <a
                  href={buildWhatsAppUrl(reminder)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[#25D366] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
                  title="Send WhatsApp reminder"
                >
                  <Send size={11} /> Remind
                </a>
                <button
                  onClick={() => onMarkPaid(deal)}
                  className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink2)] hover:bg-[var(--green-bg)] hover:text-[var(--green)]"
                >
                  Paid
                </button>
                <button
                  onClick={() => navigate(`/deals/${deal._id}`)}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white text-[var(--ink3)] hover:text-[var(--ink)]"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Money Health Score ────────────────────────────────────────────────────────
function computeHealth(deals, income, overdueDeals, pendingAmount, paidThisMonth) {
  let score   = 100;
  const reasons = [];

  // Overdue penalty
  if (overdueDeals.length > 0) {
    const cut = Math.min(overdueDeals.length * 12, 40);
    score -= cut;
    reasons.push({ text: `${overdueDeals.length} overdue deal${overdueDeals.length > 1 ? "s" : ""}`, points: -cut, color: "var(--red)" });
  }

  // High pending relative to total agreed
  const totalAgreed = deals.reduce((s, d) => s + (d.amountAgreed || 0), 0);
  if (totalAgreed > 0 && pendingAmount / totalAgreed > 0.6) {
    score -= 15;
    reasons.push({ text: "Over 60% of deals unpaid", points: -15, color: "var(--amber)" });
  }

  // No income this month
  if (paidThisMonth === 0 && deals.length > 0) {
    score -= 10;
    reasons.push({ text: "No income collected this month", points: -10, color: "var(--amber)" });
  }

  // Long overdue (>30 days)
  const veryLate = overdueDeals.filter((d) => Math.abs(daysUntil(d.dueDate)) > 30);
  if (veryLate.length > 0) {
    score -= 10;
    reasons.push({ text: `${veryLate.length} deal${veryLate.length > 1 ? "s" : ""} 30+ days overdue`, points: -10, color: "var(--red)" });
  }

  // No deals at all
  if (deals.length === 0) {
    score -= 5;
    reasons.push({ text: "No deals tracked yet", points: -5, color: "var(--ink3)" });
  }

  score = Math.max(score, 0);

  const grade =
    score >= 80 ? { label: "Excellent", color: "var(--green)",  bg: "var(--green-bg)" } :
    score >= 55 ? { label: "Fair",      color: "var(--amber)",  bg: "var(--amber-bg)" } :
                  { label: "At Risk",   color: "var(--red)",    bg: "var(--red-bg)"   };

  if (reasons.length === 0) {
    reasons.push({ text: "No overdue deals. Payments on schedule.", points: 0, color: "var(--green)" });
  }

  return { score, grade, reasons };
}

function HealthScore({ score, grade, reasons }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={15} style={{ color: grade.color }} />
        <h3 className="text-sm font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
          Money Health
        </h3>
      </div>
      <div className="flex items-center gap-4">
        <CircularProgress percent={score} size={88} />
        <div className="flex-1">
          <span
            className="inline-block rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-bold"
            style={{ background: grade.bg, color: grade.color }}
          >
            {grade.label}
          </span>
          <div className="mt-2 space-y-1.5">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--ink3)]">{r.text}</span>
                {r.points !== 0 && (
                  <span className="text-[11px] font-semibold" style={{ color: r.color }}>
                    {r.points}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Embedded AI Insights ──────────────────────────────────────────────────────
function computeInsights(deals, income, overdueDeals, overdueTotal, pendingAmount, paidThisMonth, now) {
  const insights = [];
  const thisMonthKey  = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey  = monthKey(lastMonthDate);

  const thisInc = income.filter((i) => monthKey(i.date) === thisMonthKey).reduce((s, i) => s + i.amount, 0);
  const lastInc = income.filter((i) => monthKey(i.date) === lastMonthKey).reduce((s, i) => s + i.amount, 0);

  // 1. Growth / decline
  if (lastInc > 0) {
    const delta = Math.round(((thisInc - lastInc) / lastInc) * 100);
    if (delta >= 0) {
      insights.push({
        icon: TrendingUp, color: "var(--green)", bg: "var(--green-bg)",
        text: `Income up ${delta}% vs last month. ${formatINR(thisInc)} vs ${formatINR(lastInc)}.`,
      });
    } else {
      insights.push({
        icon: TrendingDown, color: "var(--red)", bg: "var(--red-bg)",
        text: `Income down ${Math.abs(delta)}% vs last month. ${formatINR(thisInc)} vs ${formatINR(lastInc)}.`,
      });
    }
  }

  // 2. Overdue risk
  if (overdueDeals.length > 0) {
    const avgDaysLate = Math.round(
      overdueDeals.reduce((s, d) => s + Math.abs(daysUntil(d.dueDate)), 0) / overdueDeals.length
    );
    insights.push({
      icon: AlertTriangle, color: "var(--red)", bg: "var(--red-bg)",
      text: `${overdueDeals.length} deal${overdueDeals.length > 1 ? "s" : ""} overdue by avg ${avgDaysLate}d. ${formatINR(overdueTotal)} at risk.`,
    });
  }

  // 3. Pipeline / due this week
  const dueThisWeek = deals.filter((d) => {
    const d_ = daysUntil(d.dueDate);
    return d_ >= 0 && d_ <= 7 && pending(d) > 0;
  });
  if (dueThisWeek.length > 0) {
    const weekTotal = dueThisWeek.reduce((s, d) => s + pending(d), 0);
    insights.push({
      icon: CalendarClock, color: "var(--amber)", bg: "var(--amber-bg)",
      text: `${dueThisWeek.length} deal${dueThisWeek.length > 1 ? "s" : ""} due this week — ${formatINR(weekTotal)} incoming if collected on time.`,
    });
  }

  // 4. Source concentration
  const srcMap = {};
  income.forEach((i) => { srcMap[i.source] = (srcMap[i.source] || 0) + i.amount; });
  const srcList = Object.entries(srcMap).sort((a, b) => b[1] - a[1]);
  const totalInc = income.reduce((s, i) => s + i.amount, 0);
  if (srcList.length > 0 && totalInc > 0) {
    const [topSrc, topAmt] = srcList[0];
    const pct = Math.round((topAmt / totalInc) * 100);
    insights.push({
      icon: Activity, color: pct > 70 ? "var(--amber)" : "var(--blue)", bg: pct > 70 ? "var(--amber-bg)" : "var(--blue-bg)",
      text: pct > 70
        ? `${topSrc} drives ${pct}% of your income — high concentration risk.`
        : `${topSrc} is your top source at ${pct}%. Good diversification.`,
    });
  }

  // 5. Collection speed / no paid deals
  const paidDeals = deals.filter((d) => d.status === "paid");
  if (deals.length > 3 && paidDeals.length === 0) {
    insights.push({
      icon: Clock, color: "var(--amber)", bg: "var(--amber-bg)",
      text: `${deals.length} deals logged but none marked paid yet. Chase those collections.`,
    });
  } else if (paidDeals.length > 0 && deals.length > 0) {
    const rate = Math.round((paidDeals.length / deals.length) * 100);
    if (rate < 40) {
      insights.push({
        icon: Clock, color: "var(--amber)", bg: "var(--amber-bg)",
        text: `Collection rate is ${rate}% — only ${paidDeals.length} of ${deals.length} deals paid. Follow up harder.`,
      });
    }
  }

  return insights.slice(0, 5);
}

function EmbeddedInsights({ insights }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
          Smart Insights
        </h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-xs text-[var(--ink3)]">Add more deals and income to unlock insights.</p>
      ) : (
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5"
                style={{ background: ins.bg }}
              >
                <div className="mt-0.5 shrink-0">
                  <Icon size={13} style={{ color: ins.color }} />
                </div>
                <p className="text-[12px] leading-[1.6] text-[var(--ink2)]">{ins.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function DashboardPage({
  deals = [],
  income = [],
  loading = false,
  error = null,
  onMarkPaid,
  onOpenDealModal,
  onOpenIncomeModal,
  onRetry,
}) {
  const navigate     = useNavigate();
  const now          = new Date();
  const thisMonthKey = monthKey(now);

  // ── Core metrics ──────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => income.reduce((s, i) => s + i.amount, 0) +
          deals.filter((d) => d.status === "paid").reduce((s, d) => s + d.amountAgreed, 0),
    [deals, income]
  );

  const pendingAmount = useMemo(
    () => deals.filter((d) => d.status !== "paid").reduce((s, d) => s + pending(d), 0),
    [deals]
  );

  const overdueDeals = useMemo(
    () => deals
      .filter((d) => d.status !== "paid" && d.dueDate && daysUntil(d.dueDate) < 0)
      .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)),
    [deals]
  );

  const overdueTotal = useMemo(
    () => overdueDeals.reduce((s, d) => s + pending(d), 0),
    [overdueDeals]
  );

  const dueSoonDeals = useMemo(
    () => deals.filter((d) => {
      const days = daysUntil(d.dueDate);
      return d.status !== "paid" && days >= 0 && days <= 7 && pending(d) > 0;
    }).sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)),
    [deals]
  );

  const paidThisMonth = useMemo(
    () => deals
        .filter((d) => d.status === "paid" && monthKey(d.dueDate || d.createdAt) === thisMonthKey)
        .reduce((s, d) => s + d.amountAgreed, 0) +
      income
        .filter((i) => monthKey(i.date) === thisMonthKey)
        .reduce((s, i) => s + i.amount, 0),
    [deals, income, thisMonthKey]
  );

  const activeDealsCount = useMemo(
    () => deals.filter((d) => d.status !== "paid").length,
    [deals]
  );

  // ── Cashflow prediction ───────────────────────────────────────────────────
  const next7  = useMemo(() => dueSoonDeals.reduce((s, d) => s + pending(d), 0), [dueSoonDeals]);
  const next30 = useMemo(
    () => deals
      .filter((d) => { const days = daysUntil(d.dueDate); return days >= 0 && days <= 30 && d.status !== "paid"; })
      .reduce((s, d) => s + pending(d), 0),
    [deals]
  );

  // ── Chart: last 6 months + 2 projected months ─────────────────────────────
  const chartData = useMemo(() => {
    const months = [];
    // 6 historical months
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const lbl = d.toLocaleDateString("en-IN", { month: "short" });
      const dealAmt = deals
        .filter((dl) => dl.status === "paid" && monthKey(dl.dueDate || dl.createdAt) === key)
        .reduce((s, dl) => s + dl.amountAgreed, 0);
      const incAmt = income
        .filter((inc) => monthKey(inc.date) === key)
        .reduce((s, inc) => s + inc.amount, 0);
      months.push({ month: lbl, deals: dealAmt, income: incAmt, projected: 0 });
    }
    // 2 projected months
    for (let i = 1; i <= 2; i++) {
      const d   = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const lbl = d.toLocaleDateString("en-IN", { month: "short" }) + " *";
      const projectedDeals = deals
        .filter((dl) => {
          const dd = daysUntil(dl.dueDate);
          return dl.status !== "paid" && dd >= 0 && monthKey(dl.dueDate) === monthKey(d);
        })
        .reduce((s, dl) => s + pending(dl), 0);
      months.push({ month: lbl, deals: 0, income: 0, projected: projectedDeals });
    }
    return months;
  }, [deals, income]);

  // ── Income by source ──────────────────────────────────────────────────────
  const totalIncome    = useMemo(() => income.reduce((s, i) => s + i.amount, 0), [income]);
  const incomeBySource = useMemo(() => {
    const map = {};
    income.forEach((i) => { map[i.source] = (map[i.source] || 0) + i.amount; });
    return Object.entries(map)
      .map(([source, amount]) => ({
        source, amount,
        percent: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [income, totalIncome]);

  // ── Goal ──────────────────────────────────────────────────────────────────
  const goalPct = Math.min((paidThisMonth / GOAL) * 100, 100);

  // ── Health score ──────────────────────────────────────────────────────────
  const { score: healthScore, grade: healthGrade, reasons: healthReasons } = useMemo(
    () => computeHealth(deals, income, overdueDeals, pendingAmount, paidThisMonth),
    [deals, income, overdueDeals, pendingAmount, paidThisMonth]
  );

  // ── Smart insights ────────────────────────────────────────────────────────
  const insights = useMemo(
    () => computeInsights(deals, income, overdueDeals, overdueTotal, pendingAmount, paidThisMonth, now),
    [deals, income, overdueDeals, overdueTotal, pendingAmount, paidThisMonth]
  );

  // ── Recent deals ──────────────────────────────────────────────────────────
  const recentDeals = useMemo(
    () => [...deals].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [deals]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--red-bg)] p-6 text-center" style={{ border: "1px solid #FECACA" }}>
        <p className="text-sm font-medium text-[var(--red)]">
          Could not load dashboard data. Is the server running on port 5001?
        </p>
        {onRetry && (
          <button onClick={onRetry}
            className="mt-4 rounded-[var(--radius-md)] bg-[var(--red)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── 0. Money Alert Banner ────────────────────────────────────────── */}
      <AlertBanner
        overdueDeals={overdueDeals}
        dueSoonDeals={dueSoonDeals}
        overdueTotal={overdueTotal}
        navigate={navigate}
      />

      {/* ── A. 4 StatCards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue"    value={formatINR(totalRevenue)}  icon={IndianRupee}  iconBg="var(--accent)" cardBg="var(--accent-light)" />
        <StatCard label="Active Deals"     value={activeDealsCount}         icon={Briefcase}    iconBg="#3B82F6" />
        <StatCard label="Pending Amount"   value={formatINR(pendingAmount)} icon={Clock}        iconBg="#F59E0B"
          subLabel={overdueDeals.length > 0 ? `${overdueDeals.length} overdue` : null}
          subLabelColor="var(--red)" />
        <StatCard label="Paid This Month"  value={formatINR(paidThisMonth)} icon={CheckCircle2} iconBg="#16A34A" />
      </div>

      {/* ── 1. Today's Actions ───────────────────────────────────────────── */}
      <TodayActions
        overdueDeals={overdueDeals}
        dueSoonDeals={dueSoonDeals}
        onMarkPaid={onMarkPaid}
        navigate={navigate}
      />

      {/* ── B. Chart + Health/Insights ───────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">

        {/* Cashflow chart */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-6" style={{ boxShadow: "var(--shadow-md)" }}>
          {/* Cashflow prediction numbers */}
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                Revenue &amp; Cashflow
              </h3>
              <p className="text-xs text-[var(--ink3)]">Last 6 months · 2 months projected</p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-[var(--ink3)]">Next 7 days</p>
                <p className="text-base font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                  {formatINR(next7)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-[var(--ink3)]">Next 30 days</p>
                <p className="text-base font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                  {formatINR(next30)}
                </p>
              </div>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={10} barCategoryGap="30%"
                margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#A78BFA" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--ink3)" }} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F9F8FF" }} />
                <Bar dataKey="deals"     name="Deals collected"    fill="var(--accent)" radius={[4,4,0,0]} />
                <Bar dataKey="income"    name="Platform income"    fill="#3B82F6"        radius={[4,4,0,0]} />
                <Bar dataKey="projected" name="Projected (pending)" fill="url(#projGrad)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--ink3)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" /> Deals
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#3B82F6]" /> Platform Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#A78BFA]" /> Projected *
            </span>
          </div>
        </div>

        {/* Right column: Health Score + Monthly Goal + Smart Insights */}
        <div className="flex flex-col gap-4">

          {/* Health score */}
          <HealthScore score={healthScore} grade={healthGrade} reasons={healthReasons} />

          {/* Monthly goal — compact */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--card)] px-5 py-4" style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink3)]">Monthly Goal</p>
                <p className="mt-0.5 text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                  {Math.round(goalPct)}%
                  <span className="ml-1.5 text-xs font-normal text-[var(--ink3)]">of ₹50,000</span>
                </p>
                <p className="mt-1 text-[11px] font-semibold"
                  style={{ color: goalPct >= 80 ? "var(--green)" : goalPct >= 40 ? "var(--amber)" : "var(--red)" }}>
                  {goalPct >= 80 ? "On track!" : goalPct >= 40 ? "Halfway there" : "Behind target"}
                </p>
              </div>
              <CircularProgress percent={goalPct} size={72} />
            </div>
          </div>

          {/* Smart Insights */}
          <EmbeddedInsights insights={insights} />
        </div>
      </div>

      {/* ── C. Recent Deals + Income by Source ───────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">

        {/* Recent deals */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-6" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Recent Deals</h3>
            <button onClick={() => navigate("/deals")} className="text-xs text-[var(--accent)] hover:underline">View All →</button>
          </div>
          {recentDeals.length === 0 ? (
            <EmptyState icon={Briefcase} title="No deals yet" description="Add your first deal to start tracking payments."
              ctaLabel="Add Deal" ctaAction={onOpenDealModal} />
          ) : (
            <div>
              {recentDeals.map((deal, i) => (
                <div key={deal._id} onClick={() => navigate(`/deals/${deal._id}`)}
                  className={`flex cursor-pointer items-center gap-3 py-3 hover:bg-[#FAFAF8] -mx-6 px-6 ${i < recentDeals.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                  <BrandAvatar name={deal.brandName} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--ink)]">{deal.brandName}</p>
                    <p className="truncate text-xs text-[var(--ink3)]">{deal.deliverable}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                      {formatINR(deal.amountAgreed)}
                    </p>
                    <StatusBadge status={deal.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income by source */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5" style={{ boxShadow: "var(--shadow-md)" }}>
          <h3 className="text-base font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Top Sources</h3>
          <p className="mb-4 text-xs text-[var(--ink3)]">Income breakdown</p>
          {incomeBySource.length === 0 ? (
            <EmptyState icon={IndianRupee} title="No income logged yet" description="Add income to see your source breakdown."
              ctaLabel="Add Income" ctaAction={onOpenIncomeModal} />
          ) : (
            <>
              <div className="space-y-4">
                {incomeBySource.map((src) => (
                  <div key={src.source}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="font-bold text-[var(--ink)]">{src.source}</span>
                      <span className="font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                        {formatINR(src.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div className="h-full rounded-full" style={{ width: `${src.percent}%`, background: SOURCE_COLORS[src.source] || "#6B7280" }} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{src.percent}%</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[13px] text-[var(--ink2)]">Total</span>
                <span className="text-[13px] font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                  {formatINR(totalIncome)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

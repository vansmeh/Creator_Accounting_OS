import { Suspense, lazy, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Modal } from "./components/Modal";
import { AddDealModal } from "./components/AddDealModal";
import { AddIncomeModal } from "./components/AddIncomeModal";
import { ReminderModal } from "./components/ReminderModal";
import { ToastProvider, useToast } from "./components/Toast";
import { useAccountingData } from "./hooks/useAccountingData";
import { api } from "./lib/api";

const DashboardPage  = lazy(() => import("./pages/DashboardPage").then((m)  => ({ default: m.DashboardPage })));
const DealsPage      = lazy(() => import("./pages/DealsPage").then((m)      => ({ default: m.DealsPage })));
const DealDetailPage = lazy(() => import("./pages/DealDetailPage").then((m) => ({ default: m.DealDetailPage })));
const InvoicePage    = lazy(() => import("./pages/InvoicePage").then((m)    => ({ default: m.InvoicePage })));
const IncomePage     = lazy(() => import("./pages/IncomePage").then((m)     => ({ default: m.IncomePage })));
const InvoicesPage   = lazy(() => import("./pages/InvoicesPage").then((m)   => ({ default: m.InvoicesPage })));
const RemindersPage  = lazy(() => import("./pages/RemindersPage").then((m)  => ({ default: m.RemindersPage })));
const AIToolsPage    = lazy(() => import("./pages/AIToolsPage").then((m)    => ({ default: m.AIToolsPage })));

const ROUTE_TITLES = {
  "/":          "Dashboard",
  "/deals":     "Deals",
  "/income":    "Income",
  "/invoices":  "Invoices",
  "/reminders": "Reminders",
  "/ai":        "AI Tools",
};

function PageFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-24 w-full" />
      ))}
    </div>
  );
}

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { deals, income, loading, error, reload } = useAccountingData();
  const [dealModalOpen, setDealModalOpen]     = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderDealId, setReminderDealId]   = useState("");

  const pageTitle = ROUTE_TITLES[location.pathname] ?? "Creator OS";

  // ── Handlers ──────────────────────────────────────────────────────
  async function handleCreateDeal(payload) {
    try {
      await api.deals.create(payload);
      setDealModalOpen(false);
      reload();
      toast.success("Deal created");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCreateIncome(payload) {
    try {
      await api.income.create(payload);
      setIncomeModalOpen(false);
      reload();
      toast.success("Income logged");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleMarkPaid(deal) {
    try {
      await api.deals.update(deal._id, { amountReceived: deal.amountAgreed, status: "paid" });
      reload();
      toast.success("Marked as paid");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCreateInvoice(deal) {
    try {
      const invoice = await api.invoices.create({
        dealId: deal._id,
        amount: deal.pendingAmount ?? deal.amountAgreed - deal.amountReceived,
        dueDate: deal.dueDate,
      });
      navigate(`/invoice/${invoice._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleMarkedFollowUp(dealId) {
    try {
      await api.deals.markFollowUp(dealId);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const actionableDeals = useMemo(
    () => deals.filter((d) => (d.pendingAmount ?? d.amountAgreed - d.amountReceived) > 0),
    [deals]
  );

  // ── CTA per route ─────────────────────────────────────────────────
  function getCta() {
    const path = location.pathname;
    if (path === "/" || path === "/deals") {
      return (
        <button
          onClick={() => setDealModalOpen(true)}
          className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Add Deal
        </button>
      );
    }
    if (path === "/income") {
      return (
        <button
          onClick={() => setIncomeModalOpen(true)}
          className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Add Income
        </button>
      );
    }
    return null;
  }

  return (
    <AppLayout title={pageTitle} cta={getCta()}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                deals={deals}
                income={income}
                loading={loading}
                error={error}
                onMarkPaid={handleMarkPaid}
                onRetry={reload}
                onOpenReminder={(dealId) => {
                  setReminderDealId(dealId || actionableDeals[0]?._id || "");
                  setReminderModalOpen(true);
                }}
                onOpenDealModal={() => setDealModalOpen(true)}
                onOpenIncomeModal={() => setIncomeModalOpen(true)}
              />
            }
          />
          <Route
            path="/deals"
            element={
              <DealsPage
                deals={deals}
                loading={loading}
                onAddDeal={() => setDealModalOpen(true)}
                onMarkPaid={handleMarkPaid}
                onReload={reload}
              />
            }
          />
          <Route
            path="/deals/:id"
            element={
              <DealDetailPage
                deals={deals}
                onCreateInvoice={handleCreateInvoice}
                onMarkPaid={handleMarkPaid}
                onReload={reload}
              />
            }
          />
          <Route path="/invoice/:id"  element={<InvoicePage />} />
          <Route path="/income"       element={<IncomePage />} />
          <Route path="/invoices"     element={<InvoicesPage />} />
          <Route path="/reminders"    element={<RemindersPage deals={deals} onReload={reload} />} />
          <Route path="/ai"           element={<AIToolsPage deals={deals} income={income} />} />
        </Routes>
      </Suspense>

      <AddDealModal open={dealModalOpen} onClose={() => setDealModalOpen(false)} onSubmit={handleCreateDeal} />
      <AddIncomeModal open={incomeModalOpen} onClose={() => setIncomeModalOpen(false)} onSubmit={handleCreateIncome} />
      <ReminderModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        deals={actionableDeals}
        initialDealId={reminderDealId}
        onMarkedFollowUp={handleMarkedFollowUp}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

import express from "express";
import { Deal } from "../models/Deal.js";
import { Income } from "../models/Income.js";

const router = express.Router();

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

router.get("/stats", async (_req, res) => {
  try {
    const [deals, incomes] = await Promise.all([
      Deal.find().lean({ virtuals: true }),
      Income.find().lean(),
    ]);

    const now = new Date();
    const thisMonthKey  = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey  = monthKey(lastMonthDate);

    // ── Total revenue ──────────────────────────────────────────────
    const totalRevenue = incomes.reduce((s, i) => s + i.amount, 0)
      + deals.reduce((s, d) => s + (d.amountReceived || 0), 0);

    // ── Active deals ───────────────────────────────────────────────
    const activeDealsCount = deals.filter((d) => d.status !== "paid").length;

    // ── Pending + overdue ──────────────────────────────────────────
    const pendingAmount = deals.reduce((s, d) => s + Math.max((d.amountAgreed - (d.amountReceived || 0)), 0), 0);
    const overdueDeals  = deals.filter((d) => {
      const pending = d.amountAgreed - (d.amountReceived || 0);
      return pending > 0 && d.dueDate && new Date(d.dueDate) < now;
    });
    const overdueCount = overdueDeals.length;
    const overdueTotal = overdueDeals.reduce((s, d) => s + Math.max(d.amountAgreed - (d.amountReceived || 0), 0), 0);

    // ── Paid this month ────────────────────────────────────────────
    const paidThisMonth = incomes
      .filter((i) => monthKey(new Date(i.date)) === thisMonthKey)
      .reduce((s, i) => s + i.amount, 0);
    const paidLastMonth = incomes
      .filter((i) => monthKey(new Date(i.date)) === lastMonthKey)
      .reduce((s, i) => s + i.amount, 0);
    const paidThisMonthDelta = paidLastMonth > 0
      ? Math.round(((paidThisMonth - paidLastMonth) / paidLastMonth) * 100)
      : null;

    // ── Monthly revenue (last 6 months) ───────────────────────────
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const dealTotal = deals
        .filter((dl) => dl.createdAt && monthKey(new Date(dl.createdAt)) === key)
        .reduce((s, dl) => s + (dl.amountReceived || 0), 0);
      const incomeTotal = incomes
        .filter((inc) => monthKey(new Date(inc.date)) === key)
        .reduce((s, inc) => s + inc.amount, 0);
      monthlyRevenue.push({ month: monthLabel(d), deals: dealTotal, income: incomeTotal });
    }

    // ── Income by source ───────────────────────────────────────────
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0) || 1;
    const sourceMap   = {};
    for (const inc of incomes) {
      sourceMap[inc.source] = (sourceMap[inc.source] || 0) + inc.amount;
    }
    const incomeBySource = Object.entries(sourceMap)
      .map(([source, amount]) => ({
        source,
        amount,
        percent: Math.round((amount / totalIncome) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);

    // ── Monthly goal ───────────────────────────────────────────────
    const GOAL = 50000;
    const monthlyGoalPercent = Math.min(Math.round((paidThisMonth / GOAL) * 100), 100);

    // ── Top insight ────────────────────────────────────────────────
    let topInsight;
    if (overdueCount > 0) {
      topInsight = {
        type: "overdue",
        message: `${overdueCount} deal${overdueCount > 1 ? "s" : ""} overdue — ₹${overdueTotal.toLocaleString("en-IN")} at risk.`,
      };
    } else if (paidThisMonthDelta !== null && paidThisMonthDelta > 0) {
      topInsight = { type: "growth", message: `Income up ${paidThisMonthDelta}% vs last month.` };
    } else if (incomeBySource.length > 0) {
      topInsight = { type: "source", message: `${incomeBySource[0].source} is your top earner.` };
    } else {
      topInsight = { type: "start", message: "Add your first deal or income entry to see insights." };
    }

    res.json({
      totalRevenue,
      totalRevenueDelta:    null,
      activeDealsCount,
      activeDealsCountDelta: null,
      pendingAmount,
      overdueCount,
      overdueTotal,
      paidThisMonth,
      paidThisMonthDelta,
      monthlyRevenue,
      incomeBySource,
      monthlyGoalPercent,
      topInsight,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

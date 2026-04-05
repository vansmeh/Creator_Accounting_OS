import { Deal }    from "../models/Deal.js";
import { Invoice } from "../models/Invoice.js";

function normalizeStatus(deal) {
  const pending = Math.max(deal.amountAgreed - (deal.amountReceived || 0), 0);
  if (pending <= 0)                return "paid";
  if (deal.dueDate && new Date(deal.dueDate) < new Date()) return "overdue";
  if ((deal.amountReceived || 0) > 0) return "partially-paid";
  return deal.status || "sent";
}

export async function getDeals(_req, res) {
  const deals = await Deal.find().sort({ createdAt: -1 }).lean({ virtuals: true });
  res.json(deals);
}

export async function getDeal(req, res) {
  const deal = await Deal.findById(req.params.id).lean({ virtuals: true });
  if (!deal) return res.status(404).json({ message: "Deal not found" });
  res.json(deal);
}

export async function createDeal(req, res) {
  const deal  = await Deal.create({ ...req.body, status: req.body.status || "sent" });
  const saved = await Deal.findById(deal._id).lean({ virtuals: true });
  res.status(201).json(saved);
}

export async function updateDeal(req, res) {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ message: "Deal not found" });

  Object.assign(deal, req.body);
  deal.status = normalizeStatus(deal);

  if (req.body.markFollowUp) {
    deal.lastFollowUpAt = new Date();
  }

  await deal.save();

  if (deal.status === "paid") {
    await Invoice.updateMany({ dealId: deal._id, status: { $ne: "paid" } }, { $set: { status: "paid" } });
  }

  const saved = await Deal.findById(deal._id).lean({ virtuals: true });
  res.json(saved);
}

export async function deleteDeal(req, res) {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) return res.status(404).json({ message: "Deal not found" });
  res.json({ ok: true });
}

export async function markFollowUp(req, res) {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ message: "Deal not found" });
  deal.lastFollowUpAt = new Date();
  if (deal.status !== "paid") deal.status = "follow-up";
  await deal.save();
  const saved = await Deal.findById(deal._id).lean({ virtuals: true });
  res.json(saved);
}

export async function addNote(req, res) {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Note text required" });

  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ message: "Deal not found" });

  deal.notes.push({ text: text.trim() });
  await deal.save();
  const saved = await Deal.findById(deal._id).lean({ virtuals: true });
  res.json(saved);
}

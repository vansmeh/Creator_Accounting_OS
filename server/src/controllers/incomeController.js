import { Income } from "../models/Income.js";

export async function getIncome(_req, res) {
  const income = await Income.find().sort({ date: -1, createdAt: -1 });
  res.json(income);
}

export async function createIncome(req, res) {
  const income = await Income.create(req.body);
  res.status(201).json(income);
}

export async function deleteIncome(req, res) {
  const income = await Income.findByIdAndDelete(req.params.id);
  if (!income) return res.status(404).json({ message: "Income entry not found" });
  res.json({ ok: true });
}

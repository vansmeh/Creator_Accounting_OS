import { Deal }    from "../models/Deal.js";
import { Invoice } from "../models/Invoice.js";

export async function getInvoices(_req, res) {
  const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();
  res.json(invoices);
}

export async function createInvoice(req, res) {
  const { dealId, amount, dueDate } = req.body;
  const deal = await Deal.findById(dealId);

  if (!deal) {
    return res.status(404).json({ message: "Deal not found" });
  }

  const invoice = await Invoice.create({
    dealId: deal._id,
    brandName: deal.brandName,
    amount: amount ?? Math.max(deal.amountAgreed - deal.amountReceived, 0),
    dueDate: dueDate ?? deal.dueDate,
    status: new Date(dueDate ?? deal.dueDate) < new Date() ? "overdue" : "sent",
  });

  return res.status(201).json(invoice);
}

export async function getInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id).populate("dealId");

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  res.json(invoice);
}

export async function updateInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  Object.assign(invoice, req.body);
  await invoice.save();

  if (req.body.status === "paid") {
    const deal = await Deal.findById(invoice.dealId);

    if (deal) {
      deal.amountReceived = Math.max(deal.amountReceived, deal.amountAgreed);
      deal.status = "paid";
      await deal.save();
    }
  }

  res.json(invoice);
}

import { formatCurrency, formatDate } from "./format";

const tones = {
  polite: "Hi {brand}, just sharing a quick reminder that {amount} is pending for {deliverable}. The due date was {dueDate}. Please let me know once the payment is processed. {paymentLine}",
  firm: "Hi {brand}, following up on the pending payment of {amount} for {deliverable}. This was due on {dueDate}. Please process it at the earliest today. {paymentLine}",
  final: "Hi {brand}, this is a final follow-up for the pending payment of {amount} for {deliverable}, due on {dueDate}. Please clear it immediately and confirm once done. {paymentLine}",
};

export function buildReminderMessage(deal, tone = "polite") {
  const paymentLine = deal.paymentLink ? `Payment link: ${deal.paymentLink}` : "";

  return tones[tone]
    .replace("{brand}", deal.brandName)
    .replace("{amount}", formatCurrency(deal.pendingAmount ?? deal.amountAgreed - deal.amountReceived))
    .replace("{deliverable}", deal.deliverable)
    .replace("{dueDate}", formatDate(deal.dueDate))
    .replace("{paymentLine}", paymentLine)
    .trim();
}

export function buildWhatsAppUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

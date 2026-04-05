import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { ActionButton } from "../components/ActionButton";
import { formatCurrency, formatDate } from "../lib/format";

export function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedReminder, setCopiedReminder] = useState(false);

  useEffect(() => {
    api.invoices
      .getOne(id)
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function markPaid() {
    try {
      const updated = await api.invoices.update(id, { status: "paid" });
      setInvoice(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyReminder() {
    const msg = `Hey, sharing a quick reminder for the pending payment of ${formatCurrency(invoice.amount)} for ${invoice.brandName}.`;
    await navigator.clipboard.writeText(msg);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2000);
  }

  if (loading) {
    return <section className="rounded-[30px] border border-border bg-white p-6 shadow-card">Loading invoice...</section>;
  }

  if (error) {
    return (
      <section className="rounded-[30px] border border-border bg-white p-6 shadow-card">
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <ActionButton variant="secondary" onClick={() => navigate("/deals")}>Back to deals</ActionButton>
        </div>
      </section>
    );
  }

  if (!invoice) {
    return <section className="rounded-[30px] border border-border bg-white p-6 shadow-card">Invoice not found.</section>;
  }

  const isPaid = invoice.status === "paid";

  return (
    <section className="mx-auto max-w-3xl rounded-[30px] border border-border bg-white p-8 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Invoice</p>
          <h2 className="mt-1 font-display text-4xl text-ink">{invoice.brandName}</h2>
        </div>
        <span className={`mt-2 inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-medium capitalize ${isPaid ? "bg-[#eff8f3] text-[#2c7a5f]" : "bg-[#fff5ef] text-[#c96d42]"}`}>
          {invoice.status}
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] bg-sand p-5">
          <p className="text-sm text-stone-500">Amount</p>
          <p className="mt-2 text-2xl text-ink">{formatCurrency(invoice.amount)}</p>
        </div>
        <div className="rounded-[24px] bg-sand p-5">
          <p className="text-sm text-stone-500">Due date</p>
          <p className="mt-2 text-2xl text-ink">{formatDate(invoice.dueDate)}</p>
        </div>
        <div className="rounded-[24px] bg-sand p-5">
          <p className="text-sm text-stone-500">Invoice ID</p>
          <p className="mt-2 font-mono text-sm text-stone-600 break-all">{invoice._id}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {!isPaid && <ActionButton onClick={markPaid}>Mark as paid</ActionButton>}
        <ActionButton variant="secondary" onClick={copyReminder}>
          {copiedReminder ? "Copied!" : "Copy reminder"}
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate("/deals")}>
          Back to deals
        </ActionButton>
      </div>
    </section>
  );
}

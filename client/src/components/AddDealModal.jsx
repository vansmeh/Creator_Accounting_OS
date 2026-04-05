import { useState } from "react";
import { Modal } from "./Modal";
import { ActionButton } from "./ActionButton";

const initialState = {
  brandName: "",
  deliverable: "",
  amountAgreed: "",
  amountReceived: "",
  dueDate: "",
  status: "sent",
  contentLink: "",
  paymentLink: "",
};

export function AddDealModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(initialState);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      ...form,
      amountAgreed: Number(form.amountAgreed),
      amountReceived: Number(form.amountReceived || 0),
    });
    setForm(initialState);
  }

  return (
    <Modal open={open} title="Add Deal" onClose={onClose}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <input name="brandName" placeholder="Brand name" required className="rounded-2xl border border-border px-4 py-3" value={form.brandName} onChange={handleChange} />
        <input name="deliverable" placeholder="Deliverable" required className="rounded-2xl border border-border px-4 py-3" value={form.deliverable} onChange={handleChange} />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="amountAgreed" type="number" placeholder="Amount agreed" required className="rounded-2xl border border-border px-4 py-3" value={form.amountAgreed} onChange={handleChange} />
          <input name="amountReceived" type="number" placeholder="Amount received" className="rounded-2xl border border-border px-4 py-3" value={form.amountReceived} onChange={handleChange} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="dueDate" type="date" required className="rounded-2xl border border-border px-4 py-3" value={form.dueDate} onChange={handleChange} />
          <select name="status" className="rounded-2xl border border-border px-4 py-3" value={form.status} onChange={handleChange}>
            <option value="sent">Sent</option>
            <option value="follow-up">Follow-up</option>
            <option value="partially-paid">Partially paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <input name="contentLink" placeholder="Content link" className="rounded-2xl border border-border px-4 py-3" value={form.contentLink} onChange={handleChange} />
        <input name="paymentLink" placeholder="Payment link" className="rounded-2xl border border-border px-4 py-3" value={form.paymentLink} onChange={handleChange} />
        <div className="flex justify-end">
          <ActionButton type="submit">Save deal</ActionButton>
        </div>
      </form>
    </Modal>
  );
}

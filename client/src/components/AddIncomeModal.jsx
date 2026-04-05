import { useState } from "react";
import { Modal } from "./Modal";
import { ActionButton } from "./ActionButton";

const initialState = {
  source: "YouTube",
  amount: "",
  date: "",
};

export function AddIncomeModal({ open, onClose, onSubmit }) {
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
      amount: Number(form.amount),
    });
    setForm(initialState);
  }

  return (
    <Modal open={open} title="Add Income" onClose={onClose}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <select name="source" className="rounded-2xl border border-border px-4 py-3" value={form.source} onChange={handleChange}>
          <option value="YouTube">YouTube</option>
          <option value="Instagram">Instagram</option>
          <option value="Affiliate">Affiliate</option>
          <option value="Brand Deal">Brand Deal</option>
          <option value="Other">Other</option>
        </select>
        <input name="amount" type="number" placeholder="Amount" required className="rounded-2xl border border-border px-4 py-3" value={form.amount} onChange={handleChange} />
        <input name="date" type="date" required className="rounded-2xl border border-border px-4 py-3" value={form.date} onChange={handleChange} />
        <div className="flex justify-end">
          <ActionButton type="submit">Save income</ActionButton>
        </div>
      </form>
    </Modal>
  );
}

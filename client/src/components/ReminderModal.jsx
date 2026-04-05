import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { ActionButton } from "./ActionButton";
import { buildReminderMessage, buildWhatsAppUrl } from "../lib/reminders";

export function ReminderModal({ open, onClose, deals, initialDealId, onMarkedFollowUp }) {
  const [selectedId, setSelectedId] = useState(initialDealId || deals[0]?._id || "");
  const [tone, setTone] = useState("polite");

  useEffect(() => {
    setSelectedId(initialDealId || deals[0]?._id || "");
  }, [initialDealId, deals, open]);

  const selectedDeal = useMemo(
    () => deals.find((deal) => deal._id === selectedId) || null,
    [deals, selectedId]
  );

  const message = selectedDeal ? buildReminderMessage(selectedDeal, tone) : "";

  async function copyReminder() {
    await navigator.clipboard.writeText(message);
    if (selectedDeal) {
      onMarkedFollowUp(selectedDeal._id);
    }
  }

  function openWhatsApp() {
    if (!selectedDeal) {
      return;
    }
    onMarkedFollowUp(selectedDeal._id);
    window.open(buildWhatsAppUrl(message), "_blank");
  }

  return (
    <Modal open={open} title="Reminder" onClose={onClose}>
      <div className="grid gap-4">
        <select className="rounded-2xl border border-border px-4 py-3" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {deals.map((deal) => (
            <option key={deal._id} value={deal._id}>
              {deal.brandName}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {["polite", "firm", "final"].map((level) => (
            <button
              key={level}
              type="button"
              className={`rounded-full px-4 py-2 text-sm capitalize ${
                tone === level ? "bg-ink text-white" : "bg-sand text-stone-700"
              }`}
              onClick={() => setTone(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <textarea className="min-h-48 rounded-3xl border border-border px-4 py-4 leading-7" value={message} onChange={() => {}} readOnly />
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton variant="secondary" type="button" onClick={copyReminder}>
            Copy reminder
          </ActionButton>
          <ActionButton variant="accent" type="button" onClick={openWhatsApp}>
            WhatsApp
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}

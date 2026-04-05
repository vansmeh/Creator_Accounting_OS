import { ActionButton } from "./ActionButton";

export function EmptyOnboarding({ onAddDeal, onAddIncome, onSendReminder }) {
  return (
    <section className="rounded-[30px] border border-dashed border-border bg-white/80 p-8 text-center shadow-card">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Start Here</p>
      <h2 className="mt-3 font-display text-3xl text-ink">Creator accounting, without the clutter</h2>
      <div className="mx-auto mt-6 grid max-w-3xl gap-4 md:grid-cols-3">
        <div className="rounded-[24px] bg-sand p-5 text-left">
          <p className="text-sm text-stone-500">1. Add deal</p>
          <p className="mt-2 text-stone-700">Log the brand, amount, due date, and payment link.</p>
          <div className="mt-4">
            <ActionButton onClick={onAddDeal}>Add deal</ActionButton>
          </div>
        </div>
        <div className="rounded-[24px] bg-sand p-5 text-left">
          <p className="text-sm text-stone-500">2. Add income</p>
          <p className="mt-2 text-stone-700">Track YouTube, Instagram, affiliate, and other cash inflow.</p>
          <div className="mt-4">
            <ActionButton onClick={onAddIncome}>Add income</ActionButton>
          </div>
        </div>
        <div className="rounded-[24px] bg-sand p-5 text-left">
          <p className="text-sm text-stone-500">3. Send reminder</p>
          <p className="mt-2 text-stone-700">Copy a ready message and nudge overdue brands quickly.</p>
          <div className="mt-4">
            <ActionButton onClick={onSendReminder}>Open reminder</ActionButton>
          </div>
        </div>
      </div>
    </section>
  );
}

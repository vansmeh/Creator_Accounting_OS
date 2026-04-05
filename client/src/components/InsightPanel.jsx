export function InsightPanel({ insights }) {
  return (
    <section className="rounded-[30px] border border-border bg-white p-6 shadow-card">
      <p className="text-sm text-stone-500">Rule-based insights</p>
      <h3 className="mt-1 font-display text-2xl text-ink">What needs attention</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-[24px] bg-sand p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{insight.kicker}</p>
            <h4 className="mt-3 text-lg text-ink">{insight.title}</h4>
            <p className="mt-2 text-sm leading-6 text-stone-600">{insight.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 rounded-2xl border border-black/10 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${active === tab.value ? "bg-ink text-cream shadow-sm dark:bg-gold dark:text-ink" : "text-elegant hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"}`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

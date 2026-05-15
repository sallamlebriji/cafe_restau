import { Search } from "lucide-react";

export const TrackOrder = () => (
  <main className="mx-auto max-w-3xl px-4 py-10">
    <section className="premium-surface rounded-lg p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Suivi</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Suivre une commande</h1>
      <div className="mt-6 flex gap-2">
        <input className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" placeholder="Code commande ORD-..." />
        <button className="rounded-lg bg-ink px-4 text-cream"><Search /></button>
      </div>
      <div className="mt-6 rounded-lg bg-white p-5">
        <p className="font-bold text-ink">ORD-DEMO</p>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {["Confirmee", "En preparation", "Prete", "Livree"].map((step, index) => (
            <div key={step} className={`rounded-lg px-3 py-3 text-sm font-bold ${index < 2 ? "bg-gold text-ink" : "bg-cream text-zinc-500"}`}>{step}</div>
          ))}
        </div>
      </div>
    </section>
  </main>
);

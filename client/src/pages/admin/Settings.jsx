export const Settings = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Configuration</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Parametres et apparence</h1>
    </div>
    <form className="premium-surface grid gap-5 rounded-lg p-6 md:grid-cols-2">
      {["Nom etablissement", "Telephone", "Email", "Adresse", "Couleur principale", "WhatsApp"].map((label) => (
        <label key={label} className="block">
          <span className="text-sm font-semibold text-zinc-700">{label}</span>
          <input className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" />
        </label>
      ))}
      <label className="md:col-span-2">
        <span className="text-sm font-semibold text-zinc-700">Horaires</span>
        <textarea className="mt-2 min-h-28 w-full rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" />
      </label>
      <button className="rounded-lg bg-ink px-5 py-3 font-bold text-cream md:w-max">Enregistrer</button>
    </form>
  </div>
);

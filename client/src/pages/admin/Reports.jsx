import { Download, FileSpreadsheet, Printer } from "lucide-react";

export const Reports = () => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Analyse</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Rapports et statistiques</h1>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {["Rapport journalier", "Rapport hebdomadaire", "Rapport mensuel"].map((title) => (
        <div key={title} className="premium-surface rounded-lg p-5">
          <FileSpreadsheet className="text-copper" />
          <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
          <p className="mt-2 text-sm text-zinc-500">Ventes, paiements, occupation des tables, produits et performance equipe.</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg bg-ink p-2 text-cream"><Download size={18} /></button>
            <button className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700"><Printer size={18} /></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

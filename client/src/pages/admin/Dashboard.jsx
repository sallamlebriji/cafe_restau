import { BarChart3, CalendarDays, CreditCard, Receipt, Table2, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "../../components/StatCard";

const sales = [
  { date: "Lun", total: 4200 },
  { date: "Mar", total: 6100 },
  { date: "Mer", total: 5400 },
  { date: "Jeu", total: 7800 },
  { date: "Ven", total: 9200 },
  { date: "Sam", total: 12400 },
  { date: "Dim", total: 9800 }
];

const categories = [
  { name: "Plats", value: 42 },
  { name: "Cafe", value: 28 },
  { name: "Desserts", value: 16 },
  { name: "Livraison", value: 22 }
];

export const Dashboard = () => (
  <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Vue globale</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Dashboard admin</h1>
      </div>
      <button className="rounded-lg bg-ink px-5 py-3 text-sm font-bold text-cream">Exporter le rapport</button>
    </div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={CreditCard} label="Chiffre d'affaires" value="18 450 DH" hint="Aujourd'hui" />
      <StatCard icon={Receipt} label="Commandes" value="126" hint="32 en cours" tone="copper" />
      <StatCard icon={Table2} label="Tables occupees" value="18/34" hint="Taux 52%" tone="green" />
      <StatCard icon={CalendarDays} label="Reservations" value="14" hint="Ce soir" tone="dark" />
    </section>
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <div className="premium-surface rounded-lg p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Ventes par jour</h2>
          <BarChart3 size={20} className="text-copper" />
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={sales}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8a24a" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c8a24a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#b87333" fill="url(#sales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="premium-surface rounded-lg p-5">
        <h2 className="mb-5 text-lg font-bold text-ink">Canaux et categories</h2>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={categories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#111111" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
    <section className="grid gap-6 lg:grid-cols-3">
      {["Produits les plus vendus", "Employes actifs", "Stock faible"].map((title, index) => (
        <div key={title} className="premium-surface rounded-lg p-5">
          <h3 className="mb-4 font-bold text-ink">{title}</h3>
          {["Espresso", "Tacos poulet", "Cheesecake"].map((item, itemIndex) => (
            <div key={item} className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0">
              <span className="text-sm font-semibold text-zinc-700">{index === 1 ? ["Sara", "Youssef", "Mina"][itemIndex] : item}</span>
              <span className="rounded-full bg-cream px-2 py-1 text-xs font-bold text-copper">{42 - itemIndex * 9}</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  </div>
);

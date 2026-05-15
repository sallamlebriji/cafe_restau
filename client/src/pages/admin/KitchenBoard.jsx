import { Clock, Flame, UtensilsCrossed } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";

const tickets = [
  { id: 1, table: "T04", status: "PREPARING", time: "08:42", items: ["2x Tacos poulet", "1x Salade burrata"], note: "Sans oignon" },
  { id: 2, table: "Comptoir", status: "READY", time: "04:15", items: ["3x Espresso", "1x Cheesecake"], note: "Priorite" },
  { id: 3, table: "Livraison", status: "CONFIRMED", time: "01:28", items: ["1x Pizza royale", "2x Jus orange"], note: "Client attend dehors" }
];

export const KitchenBoard = ({ mode = "Cuisine" }) => (
  <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Temps reel</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Interface {mode}</h1>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="premium-surface rounded-lg p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-ink">{ticket.table}</h2>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                <Clock size={16} />
                {ticket.time}
              </div>
            </div>
            <StatusBadge value={ticket.status} />
          </div>
          <ul className="space-y-2">
            {ticket.items.map((item) => (
              <li key={item} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
                <UtensilsCrossed size={15} className="text-copper" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{ticket.note}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold">En preparation</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-bold text-cream">
              <Flame size={16} />
              Pret
            </button>
          </div>
        </article>
      ))}
    </div>
  </div>
);

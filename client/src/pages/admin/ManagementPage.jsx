import { Edit, Plus, Trash2 } from "lucide-react";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";

const sampleRows = {
  establishments: [
    { id: 1, name: "Maison Cafe", type: "CAFE_RESTAURANT", phone: "+212 600 000 000", status: "Actif" },
    { id: 2, name: "Terrasse Atlas", type: "RESTAURANT", phone: "+212 611 111 111", status: "Actif" }
  ],
  menu: [
    { id: 1, name: "Plats", products: 32, status: "Actif" },
    { id: 2, name: "Boissons chaudes", products: 18, status: "Actif" }
  ],
  products: [
    { id: 1, name: "Tajine poulet citron", category: "Plats", price: "78 DH", status: "Disponible" },
    { id: 2, name: "Latte caramel", category: "Boissons chaudes", price: "28 DH", status: "Disponible" }
  ],
  tables: [
    { id: 1, number: "T01", capacity: 4, zone: "Terrasse", status: "OCCUPIED" },
    { id: 2, number: "VIP 2", capacity: 6, zone: "Salon VIP", status: "RESERVED" }
  ],
  orders: [
    { id: 1, code: "ORD-1024", source: "TABLE", total: "342 DH", status: "PREPARING" },
    { id: 2, code: "ORD-1025", source: "DELIVERY", total: "189 DH", status: "READY" }
  ],
  reservations: [
    { id: 1, customerName: "Amina Benali", phone: "+212 622 222 222", guests: 5, status: "CONFIRMED" },
    { id: 2, customerName: "Karim Idrissi", phone: "+212 633 333 333", guests: 2, status: "PENDING" }
  ],
  customers: [
    { id: 1, name: "Amina Benali", phone: "+212 622 222 222", loyaltyPoints: 240, status: "VIP" },
    { id: 2, name: "Karim Idrissi", phone: "+212 633 333 333", loyaltyPoints: 85, status: "normal" }
  ],
  employees: [
    { id: 1, name: "Sara El Mansouri", role: "WAITER", schedule: "14:00 - 22:00", status: "Actif" },
    { id: 2, name: "Youssef Amrani", role: "KITCHEN", schedule: "10:00 - 18:00", status: "Actif" }
  ],
  stocks: [
    { id: 1, name: "Cafe arabica", quantity: "8 kg", alert: "5 kg", status: "OK" },
    { id: 2, name: "Mozzarella", quantity: "2 kg", alert: "4 kg", status: "Faible" }
  ],
  payments: [
    { id: 1, order: "ORD-1023", method: "CARD", amount: "342 DH", status: "PAID" },
    { id: 2, order: "ORD-1022", method: "CASH", amount: "98 DH", status: "PAID" }
  ]
};

const columnsByType = {
  establishments: ["name", "type", "phone", "status"],
  menu: ["name", "products", "status"],
  products: ["name", "category", "price", "status"],
  tables: ["number", "capacity", "zone", "status"],
  orders: ["code", "source", "total", "status"],
  reservations: ["customerName", "phone", "guests", "status"],
  customers: ["name", "phone", "loyaltyPoints", "status"],
  employees: ["name", "role", "schedule", "status"],
  stocks: ["name", "quantity", "alert", "status"],
  payments: ["order", "method", "amount", "status"]
};

export const ManagementPage = ({ type, title, description }) => {
  const rows = sampleRows[type] || sampleRows.products;
  const columns = columnsByType[type].map((key) => ({
    key,
    label: key,
    render: (row) => (key === "status" && /^[A-Z_]+$/.test(String(row[key])) ? <StatusBadge value={row[key]} /> : row[key])
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Gestion</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-cream">
          <Plus size={18} />
          Ajouter
        </button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        actions={() => (
          <div className="flex gap-2">
            <button className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600"><Edit size={16} /></button>
            <button className="rounded-lg border border-zinc-200 bg-white p-2 text-red-600"><Trash2 size={16} /></button>
          </div>
        )}
      />
    </div>
  );
};

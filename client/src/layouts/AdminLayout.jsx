import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShoppingBag,
  Table2,
  Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const nav = [
  ["Dashboard", "/admin/dashboard", LayoutDashboard],
  ["Etablissements", "/admin/establishments", Building2],
  ["Menu", "/admin/menu", Menu],
  ["Produits", "/admin/products", ShoppingBag],
  ["Tables", "/admin/tables", Table2],
  ["Commandes", "/admin/orders", Receipt],
  ["Cuisine", "/admin/kitchen", ChefHat],
  ["Reservations", "/admin/reservations", CalendarDays],
  ["Clients", "/admin/customers", Users],
  ["Employes", "/admin/employees", Users],
  ["Stocks", "/admin/stocks", Boxes],
  ["Paiements", "/admin/payments", CreditCard],
  ["Rapports", "/admin/reports", BarChart3],
  ["Parametres", "/admin/settings", Settings]
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 bg-ink p-5 text-cream lg:block">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Premium POS</p>
          <h1 className="mt-2 text-2xl font-extrabold">Maison Service</h1>
        </div>
        <nav className="space-y-1">
          {nav.map(([label, href, Icon]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-gold text-ink" : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-cream/85 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Bienvenue</p>
              <h2 className="text-lg font-bold text-ink">{user?.name || "Administrateur"}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700">
                <Bell size={19} />
              </button>
              <button onClick={logout} className="rounded-lg bg-ink p-2 text-cream">
                <LogOut size={19} />
              </button>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

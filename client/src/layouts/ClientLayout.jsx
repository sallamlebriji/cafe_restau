import { Link, Outlet } from "react-router-dom";
import { ShoppingCart, Utensils } from "lucide-react";
import { useCart } from "../context/CartContext";

export const ClientLayout = () => {
  const { items } = useCart();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
            <span className="rounded-lg bg-ink p-2 text-gold">
              <Utensils size={20} />
            </span>
            Maison Cafe
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-700 md:flex">
            <Link to="/menu">Menu</Link>
            <Link to="/reservation">Reservation</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/track">Suivi</Link>
          </nav>
          <Link to="/cart" className="relative rounded-lg bg-ink p-2 text-cream">
            <ShoppingCart size={21} />
            {items.length > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-gold px-1.5 text-xs font-bold text-ink">{items.length}</span>}
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
};

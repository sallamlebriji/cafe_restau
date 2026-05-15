import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { Menu, ShoppingBag, Sparkles, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { api } from "../../services/api";

const fallbackVenue = {
  id: 1,
  name: "Maison Cafe",
  slug: "maison-cafe",
  type: "CAFE_RESTAURANT",
  address: "Avenue Mohammed V, Casablanca",
  phone: "+212 600 000 000",
  primaryColor: "#C8A96A",
  categories: []
};

const publicLinks = (basePath, type) => [
  { label: "Accueil", path: basePath || "/" },
  { label: "Menu", path: `${basePath}/menu` },
  ...(type === "CAFE" ? [] : [{ label: "Reservation", path: `${basePath}/reservation` }]),
  { label: "Contact", path: `${basePath}/contact` }
];

export const PublicShell = () => {
  const { slug: routeSlug } = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [establishment, setEstablishment] = useState(fallbackVenue);
  const [loading, setLoading] = useState(true);
  const cartCount = useAppStore((state) => {
    const cart = Array.isArray(state.cart) ? state.cart : [];
    return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  });
  const slug = routeSlug || fallbackVenue.slug;
  const basePath = routeSlug ? `/${routeSlug}` : "";
  const links = useMemo(() => publicLinks(basePath, establishment.type), [basePath, establishment.type]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/public/establishments/${encodeURIComponent(slug)}`)
      .then(({ data }) => {
        if (mounted && data.data) setEstablishment(data.data);
      })
      .catch(() => {
        if (mounted) setEstablishment({ ...fallbackVenue, slug });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:py-4">
          <Link to={basePath || "/"} className="flex min-w-0 items-center gap-3 text-lg font-black sm:text-xl">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-gold"><Utensils size={21} /></span>
            <span className="truncate">{establishment.name}</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-2xl border border-black/10 bg-white/70 p-1 md:flex">
            {links.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === (basePath || "/")} className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-bold transition ${isActive ? "bg-ink text-cream" : "text-elegant hover:bg-black/5"}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMobileOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-2xl border border-black/10 bg-white/75 md:hidden">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to={`${basePath}/cart`} className="relative grid h-11 w-11 place-items-center rounded-2xl bg-ink text-cream">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-gold px-2 text-xs font-black text-ink">{cartCount}</span>}
            </Link>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mx-auto grid max-w-7xl gap-2 border-t border-black/5 px-4 py-3 md:hidden">
            {links.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === (basePath || "/")} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black ${isActive ? "bg-ink text-cream" : "bg-white/75 text-elegant"}`}>
                {item.label}
                <Sparkles size={15} />
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <Outlet context={{ establishment, slug, basePath, loading }} />
    </div>
  );
};

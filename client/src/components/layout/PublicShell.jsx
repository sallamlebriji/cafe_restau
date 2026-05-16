import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { CalendarDays, ChevronRight, Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { api } from "../../services/api";

const fallbackVenue = {
  id: 1, name: "Maison Café", slug: "maison-cafe",
  type: "CAFE_RESTAURANT",
  address: "Avenue Mohammed V, Casablanca",
  phone: "+212 600 000 000",
  primaryColor: "#C8A96A", categories: []
};

const publicLinks = (basePath, type) => [
  { label: "Accueil",      path: basePath || "/" },
  { label: "Menu",         path: `${basePath}/menu` },
  ...(type === "CAFE" ? [] : [{ label: "Réservation", path: `${basePath}/reservation` }]),
  { label: "Contact",      path: `${basePath}/contact` },
];

export const PublicShell = () => {
  const { slug: routeSlug } = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [establishment, setEstablishment] = useState(fallbackVenue);
  const [loading, setLoading] = useState(true);
  const cartCount = useAppStore((s) => {
    const cart = Array.isArray(s.cart) ? s.cart : [];
    return cart.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  });
  const slug = routeSlug || fallbackVenue.slug;
  const basePath = routeSlug ? `/${routeSlug}` : "";
  const links = useMemo(() => publicLinks(basePath, establishment.type), [basePath, establishment.type]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/public/establishments/${encodeURIComponent(slug)}`)
      .then(({ data }) => { if (mounted && data.data) setEstablishment(data.data); })
      .catch(() => { if (mounted) setEstablishment({ ...fallbackVenue, slug }); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Fermer menu mobile au scroll
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const color = establishment.primaryColor || "#C8A96A";

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1A1A1A]" style={{ "--brand": color }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF8F4]/95 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-xl py-2"
          : "bg-transparent py-4"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link to={basePath || "/"} className="flex items-center gap-3 min-w-0">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white text-lg font-black shadow-sm"
              style={{ background: color }}
            >
              {establishment.name.charAt(0)}
            </span>
            <span className="truncate text-lg font-black tracking-tight">{establishment.name}</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === (basePath || "/")}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#1A1A1A] text-white"
                      : "text-[#6B6B6B] hover:bg-black/5 hover:text-[#1A1A1A]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {establishment.type !== "CAFE" && (
              <Link
                to={`${basePath}/reservation`}
                className="hidden items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A1A] shadow-sm transition hover:border-black/20 sm:flex"
              >
                <CalendarDays size={15} />
                Réserver
              </Link>
            )}
            <Link
              to={`${basePath}/cart`}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm transition hover:opacity-90"
              style={{ background: color }}
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1A1A1A] text-[10px] font-black text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#1A1A1A] shadow-sm md:hidden"
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Menu mobile overlay ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-72 bg-[#FAF8F4] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <span className="font-black">{establishment.name}</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1">
              {links.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === (basePath || "/")}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#1A1A1A] text-white"
                        : "text-[#6B6B6B] hover:bg-black/5"
                    }`
                  }
                >
                  {item.label}
                  <ChevronRight size={15} />
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-black/5">
              <Link
                to={`${basePath}/cart`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 text-sm font-bold text-white"
                style={{ background: color }}
              >
                <ShoppingBag size={16} />
                Panier {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="pt-16">
        <Outlet context={{ establishment, slug, basePath, loading }} />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-black/5 bg-[#1A1A1A] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-2xl text-white font-black"
                  style={{ background: color }}
                >
                  {establishment.name.charAt(0)}
                </span>
                <span className="font-black text-lg">{establishment.name}</span>
              </div>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                {establishment.address || "Adresse non renseignée"}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color }}>Navigation</p>
              <div className="space-y-2">
                {links.map((item) => (
                  <Link key={item.path} to={item.path} className="block text-sm text-zinc-400 hover:text-white transition">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color }}>Contact</p>
              <div className="space-y-2 text-sm text-zinc-400">
                {establishment.phone && <p>{establishment.phone}</p>}
                {establishment.email && <p>{establishment.email}</p>}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-xs text-zinc-500 text-center">
            © {new Date().getFullYear()} {establishment.name}. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

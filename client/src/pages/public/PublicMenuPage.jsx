import { Filter, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { categories as mockCategories, products as mockProducts } from "../../data/mockData";
import { api } from "../../services/api";
import { useAppStore } from "../../store/useAppStore";

const fallbackImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80";

const mapMenu = (establishment) => {
  const serverCategories = establishment?.categories || [];
  if (!serverCategories.length) return { categories: mockCategories, products: mockProducts };
  return {
    categories: [{ id: "all", name: "Tout" }, ...serverCategories.map((c) => ({ id: String(c.id), name: c.name }))],
    products: serverCategories.flatMap((c) =>
      (c.products || []).map((p) => ({
        id: p.id, productId: p.id, establishmentId: p.establishmentId,
        name: p.name, category: String(c.id), price: Number(p.price),
        image: p.image || fallbackImage, prep: p.preparationTime,
        tva: Number(p.tva || 0), description: p.description || "",
        available: p.isAvailable, variants: p.variants || [],
      }))
    )
  };
};

// ── Carte produit ────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAdd, color }) => {
  const [qty, setQty] = useState(0);
  const handleAdd = () => {
    setQty(1);
    onAdd(product);
    toast.success(`${product.name} ajouté`);
  };
  const handleInc = () => { setQty((q) => q + 1); onAdd(product); };
  const handleDec = () => {
    if (qty <= 1) { setQty(0); return; }
    setQty((q) => q - 1);
  };

  return (
    <div className={`group flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:shadow-lg ${!product.available ? "opacity-60" : ""}`}>
      <div className="relative h-44 overflow-hidden sm:h-52">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-xl bg-white/90 px-3 py-1 text-xs font-black">Indisponible</span>
          </div>
        )}
        {product.prep && (
          <span className="absolute bottom-2.5 left-2.5 rounded-xl bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {product.prep} min
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-black text-[#1A1A1A] leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-[#6B6B6B] leading-relaxed">{product.description}</p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <strong className="text-lg font-black text-[#1A1A1A]">{product.price} DH</strong>
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!product.available}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1A1A] transition hover:opacity-80 active:scale-95 disabled:cursor-not-allowed"
              style={{ background: color || "#C8A96A" }}
            >
              <Plus size={14} /> Ajouter
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleDec} className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 transition hover:bg-black/10">
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-black">{qty}</span>
              <button onClick={handleInc} className="flex h-8 w-8 items-center justify-center rounded-xl text-white transition hover:opacity-80"
                style={{ background: color || "#C8A96A" }}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PublicMenuPage = () => {
  const { slug: routeSlug } = useParams();
  const context = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const establishmentSlug = routeSlug || searchParams.get("establishment") || context.slug || "maison-cafe";
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState({ categories: mockCategories, products: mockProducts });
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const catRef = useRef(null);
  const addToCart = useAppStore((s) => s.addToCart);
  const cartCount = useAppStore((s) => (Array.isArray(s.cart) ? s.cart : []).reduce((n, i) => n + (i.qty || 0), 0));
  const setCurrentTable = useAppStore((s) => s.setCurrentTable);
  const venue = context.establishment || {};
  const color = venue.primaryColor || "#C8A96A";

  useEffect(() => { if (tableParam) setCurrentTable(tableParam); }, [tableParam, setCurrentTable]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/public/establishments/${encodeURIComponent(establishmentSlug)}`)
      .then(({ data }) => { if (mounted && data.data) setMenu(mapMenu(data.data)); })
      .catch(async () => {
        try {
          const { data } = await api.get("/categories?limit=100");
          if (mounted) setMenu(mapMenu({ categories: data.data || [] }));
        } catch { if (mounted) setMenu({ categories: mockCategories, products: mockProducts }); }
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [establishmentSlug]);

  const filtered = useMemo(() =>
    menu.products.filter((p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
    ),
    [category, menu.products, query]
  );

  // Scroll catégorie active dans la barre
  const scrollCatIntoView = (id) => {
    setCategory(id);
    const el = catRef.current?.querySelector(`[data-cat="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <main className="min-h-screen bg-[#FAF8F4]">
      {/* ── Barre de recherche sticky ── */}
      <div className="sticky top-16 z-20 border-b border-black/5 bg-[#FAF8F4]/95 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-3">
          {/* Titre + badge table */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="truncate text-xl font-black sm:text-2xl">{venue.name || "Menu"}</h1>
              {tableParam && (
                <span
                  className="shrink-0 rounded-xl px-3 py-1 text-xs font-black text-[#1A1A1A]"
                  style={{ background: `${color}30` }}
                >
                  Table {tableParam}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowQR((v) => !v)}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#1A1A1A] shadow-sm transition hover:border-black/20"
              title="QR Code"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/>
              </svg>
            </button>
          </div>
          {/* Recherche */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Café, tajine, salade..."
              className="h-11 w-full rounded-2xl border border-black/10 bg-white pl-10 pr-10 text-sm font-medium text-[#1A1A1A] outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
                <X size={15} />
              </button>
            )}
          </div>
          {/* Catégories */}
          <div ref={catRef} className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {menu.categories.map((c) => (
              <button
                key={c.id}
                data-cat={c.id}
                onClick={() => scrollCatIntoView(c.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  category === c.id
                    ? "text-[#1A1A1A] shadow-sm"
                    : "bg-white text-[#6B6B6B] border border-black/8 hover:border-black/15"
                }`}
                style={category === c.id ? { background: color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── QR Modal ── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
          <div className="rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black">QR Code table</h3>
              <button onClick={() => setShowQR(false)} className="h-8 w-8 flex items-center justify-center rounded-xl bg-black/5"><X size={15} /></button>
            </div>
            <div className="grid place-items-center rounded-2xl bg-white p-4 border border-black/10">
              <QRCodeSVG
                value={`${window.location.origin}/${establishmentSlug}/menu${tableParam ? `?table=${encodeURIComponent(tableParam)}` : ""}`}
                size={200}
              />
            </div>
            <p className="mt-3 text-xs text-center text-[#6B6B6B]">Scannez pour ouvrir ce menu</p>
          </div>
        </div>
      )}

      {/* ── Grille produits ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-black/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Filter size={40} className="text-[#C8C8C8]" />
            <p className="font-black text-[#1A1A1A]">Aucun produit trouvé</p>
            <p className="text-sm text-[#6B6B6B]">Essayez une autre catégorie ou effacez la recherche.</p>
            <button onClick={() => { setQuery(""); setCategory("all"); }} className="mt-2 rounded-xl px-4 py-2 text-sm font-bold text-[#1A1A1A]" style={{ background: color }}>
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} color={color} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB panier ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-30 px-4">
          <a
            href={`/${establishmentSlug}/cart`}
            className="flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-bold text-[#1A1A1A] shadow-2xl transition hover:opacity-90 active:scale-95"
            style={{ background: color }}
          >
            <ShoppingBag size={18} />
            Voir le panier
            <span className="rounded-xl bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-black text-white">{cartCount}</span>
          </a>
        </div>
      )}
    </main>
  );
};

import { Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { categories as mockCategories, products as mockProducts } from "../../data/mockData";
import { api } from "../../services/api";
import { useAppStore } from "../../store/useAppStore";

const fallbackImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80";

const mapMenu = (establishment) => {
  const serverCategories = establishment?.categories || [];
  if (!serverCategories.length) {
    return { categories: mockCategories, products: mockProducts };
  }

  return {
    categories: [
      { id: "all", name: "Tous" },
      ...serverCategories.map((category) => ({ id: String(category.id), name: category.name }))
    ],
    products: serverCategories.flatMap((category) =>
      (category.products || []).map((product) => ({
        id: product.id,
        productId: product.id,
        establishmentId: product.establishmentId,
        name: product.name,
        category: String(category.id),
        price: Number(product.price),
        image: product.image || fallbackImage,
        prep: product.preparationTime,
        tva: Number(product.tva || 0),
        badge: product.isAvailable ? "disponible" : "indisponible",
        allergens: [],
        calories: 0,
        available: product.isAvailable,
        variants: product.variants || []
      }))
    )
  };
};

const mapApiMenu = (categories = []) => {
  if (!categories.length) return { categories: mockCategories, products: mockProducts };
  return {
    categories: [
      { id: "all", name: "Tous" },
      ...categories.map((category) => ({ id: String(category.id), name: category.name }))
    ],
    products: categories.flatMap((category) =>
      (category.products || []).map((product) => ({
        id: product.id,
        productId: product.id,
        establishmentId: product.establishmentId,
        name: product.name,
        category: String(category.id),
        price: Number(product.price),
        image: product.image || fallbackImage,
        prep: product.preparationTime,
        tva: Number(product.tva || 0),
        badge: product.isAvailable ? "disponible" : "indisponible",
        description: product.description || "",
        allergens: [],
        calories: 0,
        available: product.isAvailable,
        variants: product.variants || []
      }))
    )
  };
};

export const PublicMenuPage = () => {
  const { slug: routeSlug } = useParams();
  const context = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const establishmentSlug = routeSlug || searchParams.get("establishment") || context.slug || "maison-cafe";
  const isPreview = searchParams.get("preview") === "1";
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState({ categories: mockCategories, products: mockProducts });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const addToCart = useAppStore((state) => state.addToCart);
  const currentTable = useAppStore((state) => state.currentTable);
  const setCurrentTable = useAppStore((state) => state.setCurrentTable);
  const venue = context.establishment || {};

  useEffect(() => {
    if (tableParam) setCurrentTable(tableParam);
  }, [tableParam, setCurrentTable]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError("");
    api.get(`/public/establishments/${encodeURIComponent(establishmentSlug)}`)
      .then(({ data }) => {
        if (mounted && data.data) setMenu(mapMenu(data.data));
      })
      .catch(async () => {
        try {
          const { data } = await api.get("/categories?limit=100");
          if (mounted) setMenu(mapApiMenu(data.data || []));
        } catch {
          if (mounted) {
            setMenu({ categories: mockCategories, products: mockProducts });
            setLoadError("Menu API indisponible, affichage du menu demo.");
          }
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [establishmentSlug]);

  const filtered = useMemo(() => menu.products.filter((p) => (category === "all" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())), [category, menu.products, query]);
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-copper">Menu digital</p><h1 className="mt-2 text-4xl font-black md:text-5xl">{isPreview ? "Apercu menu client" : venue.name || "Commander a table"}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-elegant">Selection de l'etablissement, disponible pour commande et consultation.</p>
          {currentTable && <p className="mt-3 inline-flex rounded-2xl bg-gold/15 px-4 py-2 text-sm font-black text-copper">Table {currentTable}</p>}
          {loading && <Card className="mt-5 p-4 text-sm font-bold text-elegant">Chargement du menu...</Card>}
          {loadError && <Card className="mt-5 border-warning/20 bg-warning/5 p-4 text-sm font-bold text-warning">{loadError}</Card>}
          <div className="mt-6"><Input icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cafe, tacos, tajine..." /></div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{menu.categories.map((item) => <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black ${category === item.id ? "bg-ink text-cream" : "bg-white text-elegant shadow-sm"}`}>{item.name}</button>)}</div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <Card key={product.id} interactive className="overflow-hidden"><img src={product.image} className="h-52 w-full object-cover" /><div className="p-5"><div className="flex justify-between gap-3"><h3 className="font-black">{product.name}</h3><Badge tone="gold">{product.badge}</Badge></div><p className="mt-2 text-sm text-elegant">{product.prep} min{product.calories ? ` - ${product.calories} kcal` : ""}</p>{product.description && <p className="mt-2 line-clamp-2 text-sm text-elegant">{product.description}</p>}<div className="mt-3 flex flex-wrap gap-1">{product.allergens.map((a) => <Badge key={a} tone="warning">{a}</Badge>)}</div><Button className="mt-4 w-full" onClick={() => { addToCart(product); toast.success("Ajoute au panier"); }}>Ajouter - {product.price} DH</Button></div></Card>)}</div>
        </div>
        <Card className="sticky top-24 h-max p-5"><h2 className="text-xl font-black">QR Code table</h2><p className="mt-2 text-sm text-elegant">Scannez pour ouvrir ce menu directement.</p><div className="mt-5 grid place-items-center rounded-3xl bg-white p-5"><QRCodeSVG value={`${window.location.origin}/${establishmentSlug}/menu${currentTable ? `?table=${encodeURIComponent(currentTable)}` : ""}`} size={190} /></div></Card>
      </div>
    </main>
  );
};

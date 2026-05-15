import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import { ProductCard } from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";

const featured = [
  { id: 1, name: "Brunch signature", price: 95, description: "Oeufs, pain artisanal, fromage frais, jus et cafe de specialite." },
  { id: 2, name: "Latte noisette", price: 32, description: "Espresso intense, lait texture, noisette douce et mousse fine." },
  { id: 3, name: "Pizza truffe", price: 120, description: "Creme, mozzarella, champignons, huile de truffe et roquette." }
];

export const Home = () => {
  const { addItem } = useCart();

  return (
    <main>
      <section className="relative min-h-[78vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=80"
          alt="Cafe restaurant elegant"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/65 to-transparent" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-20">
          <div className="max-w-2xl text-cream">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-gold">Cafe restaurant</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight md:text-7xl">Maison Cafe</h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-100">Cuisine genereuse, cafe de specialite, reservation simple et commande en ligne fluide depuis votre telephone.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/menu" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 font-bold text-ink">
                Voir le menu
                <ArrowRight size={18} />
              </Link>
              <Link to="/reservation" className="inline-flex items-center justify-center gap-2 rounded-lg border border-cream/40 px-6 py-3 font-bold text-cream">
                <CalendarDays size={18} />
                Reserver
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Selection</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Les favoris du moment</h2>
          </div>
          <a href="https://wa.me/212600000000" className="hidden items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white md:inline-flex">
            <MessageCircle size={18} />
            WhatsApp
          </a>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addItem} />
          ))}
        </div>
      </section>
    </main>
  );
};

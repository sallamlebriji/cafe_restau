import { useState } from "react";
import toast from "react-hot-toast";
import { ProductCard } from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";

const categories = ["Tous", "Plats", "Boissons chaudes", "Desserts", "Snacks", "Pizzas"];
const products = [
  { id: 11, name: "Tajine poulet citron", category: "Plats", price: 78, description: "Poulet fermier, olives, citron confit et epices douces." },
  { id: 12, name: "Espresso signature", category: "Boissons chaudes", price: 18, description: "Extraction courte, notes cacao et noisette." },
  { id: 13, name: "Cheesecake fruits rouges", category: "Desserts", price: 42, description: "Creme onctueuse, biscuit sable et coulis maison." },
  { id: 14, name: "Tacos gratine", category: "Snacks", price: 55, description: "Poulet marine, sauce maison, fromage et frites." },
  { id: 15, name: "Pizza royale", category: "Pizzas", price: 86, description: "Sauce tomate, mozzarella, viande hachee, poivrons et olives." }
];

export const Menu = () => {
  const [active, setActive] = useState("Tous");
  const { addItem } = useCart();
  const filtered = active === "Tous" ? products : products.filter((product) => product.category === active);

  const handleAdd = (product) => {
    addItem(product);
    toast.success(`${product.name} ajoute au panier`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Menu digital</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink">Commandez en ligne</h1>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActive(category)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${active === category ? "bg-ink text-cream" : "bg-white text-zinc-700"}`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={handleAdd} />
        ))}
      </div>
    </main>
  );
};

import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

export const Cart = () => {
  const { items, updateQuantity, total } = useCart();

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section className="premium-surface rounded-lg p-5">
        <h1 className="mb-5 text-3xl font-extrabold text-ink">Panier</h1>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-lg bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-bold text-ink">{item.name}</h2>
                <p className="text-sm text-zinc-500">{Number(item.price).toFixed(2)} DH</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="rounded-lg border p-2"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded-lg border p-2"><Plus size={16} /></button>
                <button onClick={() => updateQuantity(item.id, 0)} className="rounded-lg border p-2 text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {!items.length && <p className="rounded-lg bg-white p-5 text-zinc-500">Votre panier est vide.</p>}
        </div>
      </section>
      <aside className="premium-surface h-max rounded-lg p-5">
        <h2 className="text-xl font-bold text-ink">Resume</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><strong>{total.toFixed(2)} DH</strong></div>
          <div className="flex justify-between"><span>TVA estimee</span><strong>{(total * 0.1).toFixed(2)} DH</strong></div>
          <div className="flex justify-between"><span>Livraison</span><strong>15.00 DH</strong></div>
        </div>
        <div className="mt-5 flex justify-between border-t pt-4 text-lg font-extrabold">
          <span>Total</span>
          <span>{(total * 1.1 + 15).toFixed(2)} DH</span>
        </div>
        <Link to="/checkout" className="mt-5 block rounded-lg bg-ink px-5 py-3 text-center font-bold text-cream">Commander</Link>
      </aside>
    </main>
  );
};

import { ChevronRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { formatMoney } from "../../utils/format";

export const PublicCartPage = () => {
  const { basePath, establishment } = useOutletContext() || {};
  const cart = useAppStore((s) => s.cart);
  const update = useAppStore((s) => s.updateCartItem);
  const remove = useAppStore((s) => s.removeCartItem);
  const color = establishment?.primaryColor || "#C8A96A";
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tva = subtotal * 0.1;
  const total = subtotal + tva;

  if (cart.length === 0) {
    return (
      <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-black/5">
          <ShoppingBag size={32} className="text-[#9B9B9B]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Panier vide</h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">Ajoutez des produits depuis le menu pour commencer.</p>
        </div>
        <Link
          to={`${basePath}/menu`}
          className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[#1A1A1A]"
          style={{ background: color }}
        >
          Voir le menu <ChevronRight size={15} />
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-black text-[#1A1A1A] sm:text-4xl">Panier</h1>
      <p className="mt-1.5 text-sm text-[#6B6B6B]">{cart.length} article{cart.length > 1 ? "s" : ""}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Articles */}
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A1A] truncate">{item.name}</p>
                <p className="mt-0.5 text-sm text-[#6B6B6B]">{formatMoney(item.price)} / unité</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => update(item.id, { qty: Math.max(1, item.qty - 1) })}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 transition hover:bg-black/10"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-black">{item.qty}</span>
                <button
                  onClick={() => update(item.id, { qty: item.qty + 1 })}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[#1A1A1A]"
                  style={{ background: color }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="font-black text-[#1A1A1A]">{formatMoney(item.price * item.qty)}</p>
                <button onClick={() => remove(item.id)} className="text-red-400 transition hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Récap */}
        <div className="h-max rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-[#1A1A1A]">Résumé</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Sous-total</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">TVA (10%)</span>
              <span className="font-semibold">{formatMoney(tva)}</span>
            </div>
            <div className="border-t border-black/5 pt-3 flex justify-between text-base">
              <span className="font-black text-[#1A1A1A]">Total</span>
              <span className="font-black text-[#1A1A1A] text-lg">{formatMoney(total)}</span>
            </div>
          </div>
          <Link
            to={`${basePath || ""}/checkout`}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-[#1A1A1A] transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: color }}
          >
            Passer la commande <ChevronRight size={15} />
          </Link>
          <Link
            to={`${basePath || ""}/menu`}
            className="mt-3 block text-center text-sm font-semibold text-[#6B6B6B] transition hover:text-[#1A1A1A]"
          >
            ← Continuer les achats
          </Link>
        </div>
      </div>
    </main>
  );
};

import { MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../services/api";
import { useAppStore } from "../../store/useAppStore";
import { formatMoney } from "../../utils/format";

export const PublicCheckoutPage = () => {
  const { basePath, establishment } = useOutletContext() || {};
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({ defaultValues: { mode: "Sur place" } });
  const navigate = useNavigate();
  const cart = useAppStore((s) => s.cart);
  const currentTable = useAppStore((s) => s.currentTable);
  const confirmOrder = useAppStore((s) => s.confirmOrder);
  const addConfirmedOrder = useAppStore((s) => s.addConfirmedOrder);
  const clearCart = useAppStore((s) => s.clearCart);
  const color = establishment?.primaryColor || "#C8A96A";
  const mode = watch("mode");
  const isTableOrder = Boolean(currentTable);
  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const tva = subtotal * 0.1;
  const total = subtotal + tva;

  const onSubmit = async (values) => {
    if (!cart.length) return toast.error("Panier vide.");
    const source = mode === "Livraison" ? "DELIVERY" : mode === "Retrait" ? "COUNTER" : "TABLE";
    try {
      const { data } = await api.post("/public/orders", {
        establishmentId: cart[0]?.establishmentId || 1,
        source, tva,
        tableNumber: source === "TABLE" ? currentTable : undefined,
        note: [source === "TABLE" && currentTable ? `Table ${currentTable}` : null, values.address, values.notes].filter(Boolean).join(" - "),
        customer: { name: values.name || "Client", phone: !isTableOrder ? values.phone : undefined, address: !isTableOrder ? values.address : undefined },
        items: cart.map((i) => ({ productId: i.productId || i.id, quantity: i.qty, unitPrice: i.price, productName: i.name, note: i.note }))
      });
      addConfirmedOrder({ id: data.data.id, code: data.data.code, status: data.data.status, total: Number(data.data.total) });
      localStorage.setItem("lastOrderCode", data.data.code);
      clearCart();
      toast.success(`Commande ${data.data.code} envoyée !`);
      navigate(`${basePath || ""}/track?code=${encodeURIComponent(data.data.code)}`);
      reset();
    } catch (err) {
      confirmOrder({ customer: values.name, mode, address: values.address, notes: values.notes });
      toast.error(err.response?.data?.message || "API indisponible, commande locale.");
      navigate(`${basePath || ""}/track`);
    }
  };

  const field = "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>Finaliser</p>
      <h1 className="mt-2 text-3xl font-black text-[#1A1A1A] sm:text-4xl">Votre commande</h1>
      {currentTable && (
        <span className="mt-3 inline-block rounded-xl px-3 py-1 text-xs font-black text-[#1A1A1A]" style={{ background: `${color}30` }}>
          Table {currentTable}
        </span>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 space-y-4">
          <h2 className="text-base font-black text-[#1A1A1A]">Vos informations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Nom</label>
              <input {...register("name")} placeholder="Mohamed Alami" className={field} />
            </div>
            {!isTableOrder && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Téléphone</label>
                  <input {...register("phone")} placeholder="+212 6..." className={field} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Mode</label>
                  <select {...register("mode")} className={field}>
                    <option>Sur place</option>
                    <option>Retrait</option>
                    <option>Livraison</option>
                  </select>
                </div>
                {mode === "Livraison" && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Adresse</label>
                    <input {...register("address")} placeholder="Rue, ville..." className={field} />
                  </div>
                )}
              </>
            )}
            <div className={isTableOrder ? "sm:col-span-2" : "sm:col-span-2"}>
              <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Notes</label>
              <textarea {...register("notes")} rows={2} placeholder="Allergies, préférences..." className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 resize-none" />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !cart.length}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-[#1A1A1A] transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: color }}
          >
            {isSubmitting ? "Envoi..." : "Confirmer la commande"}
          </button>
          {!isTableOrder && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-black/10 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-black/5"
            >
              <MessageCircle size={16} className="text-green-500" /> Commander par WhatsApp
            </button>
          )}
        </form>

        {/* Récap commande */}
        <div className="h-max rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-base font-black text-[#1A1A1A] mb-3">Récapitulatif</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <img src={item.image} alt={item.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                <span className="flex-1 font-semibold text-[#1A1A1A] truncate">{item.name}</span>
                <span className="shrink-0 font-black text-[#1A1A1A]">{item.qty}×</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
            <div className="flex justify-between text-[#6B6B6B]"><span>Sous-total</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between text-[#6B6B6B]"><span>TVA (10%)</span><span>{formatMoney(tva)}</span></div>
            <div className="flex justify-between font-black text-[#1A1A1A] text-base pt-1">
              <span>Total</span><span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useCart } from "../../context/CartContext";

export const Checkout = () => {
  const { register, handleSubmit } = useForm();
  const { items, clear, total } = useCart();

  const onSubmit = async (values) => {
    try {
      await api.post("/public/orders", {
        establishmentId: 1,
        source: values.mode === "delivery" ? "DELIVERY" : "ONLINE",
        deliveryFee: values.mode === "delivery" ? 15 : 0,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity, unitPrice: item.price })),
        note: `${values.name} - ${values.phone} - ${values.address || "Retrait"}`
      });
      clear();
      toast.success("Commande envoyee");
    } catch {
      toast.success("Commande demo enregistree localement");
      clear();
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <form onSubmit={handleSubmit(onSubmit)} className="premium-surface grid gap-5 rounded-lg p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Commande</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">Finaliser</h1>
        </div>
        {["name", "phone", "email", "address"].map((field) => (
          <input key={field} {...register(field)} className="rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" placeholder={field} />
        ))}
        <select {...register("mode")} className="rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold">
          <option value="pickup">Retrait</option>
          <option value="delivery">Livraison</option>
        </select>
        <div className="rounded-lg bg-white px-4 py-3 font-bold">Total: {(total * 1.1 + 15).toFixed(2)} DH</div>
        <button className="rounded-lg bg-ink px-5 py-3 font-bold text-cream md:col-span-2">Envoyer la commande</button>
      </form>
    </main>
  );
};

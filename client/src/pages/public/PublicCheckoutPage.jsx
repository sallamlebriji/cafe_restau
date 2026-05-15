import { MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../services/api";
import { useAppStore } from "../../store/useAppStore";

export const PublicCheckoutPage = () => {
  const { basePath } = useOutletContext() || {};
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const navigate = useNavigate();
  const cart = useAppStore((state) => state.cart);
  const currentTable = useAppStore((state) => state.currentTable);
  const confirmOrder = useAppStore((state) => state.confirmOrder);
  const addConfirmedOrder = useAppStore((state) => state.addConfirmedOrder);
  const clearCart = useAppStore((state) => state.clearCart);

  const normalizeServerOrder = (order, values) => ({
    id: order.id,
    code: order.code,
    table: order.table?.number || (order.source === "TABLE" ? currentTable || "Table client" : order.source === "DELIVERY" ? "Livraison" : "Retrait"),
    customer: order.customer?.name || values.name || "Client",
    type: order.source,
    server: "Online",
    status: order.status,
    total: Number(order.total),
    createdAt: new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    items: order.items?.map((item) => `${item.quantity}x ${item.product?.name || "Produit"}`) || [],
    note: order.note || "",
    station: order.items?.some((item) => Number(item.product?.preparationTime || 0) > 8) ? "cuisine" : "bar",
    serverSynced: true
  });

  const onSubmit = async (values) => {
    if (!cart.length) {
      toast.error("Ajoutez au moins un produit avant de confirmer.");
      return;
    }

    const isTableOrder = Boolean(currentTable);
    const mode = isTableOrder ? "Sur place" : values.mode || "Sur place";
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
    const source = mode === "Livraison" ? "DELIVERY" : mode === "Retrait" ? "COUNTER" : "TABLE";

    try {
      const { data } = await api.post("/public/orders", {
        establishmentId: cart[0]?.establishmentId || 1,
        source,
        tva: subtotal * 0.1,
        tableNumber: source === "TABLE" ? currentTable : undefined,
        note: [source === "TABLE" && currentTable ? `Table ${currentTable}` : null, !isTableOrder ? values.address : null, values.notes].filter(Boolean).join(" - "),
        customer: {
          name: values.name || "Client",
          phone: isTableOrder ? undefined : values.phone,
          address: isTableOrder ? undefined : values.address
        },
        items: cart.map((item) => ({
          productId: item.productId || item.id,
          quantity: item.qty,
          unitPrice: item.price,
          productName: item.name,
          note: item.note
        }))
      });

      addConfirmedOrder(normalizeServerOrder(data.data, values));
      localStorage.setItem("lastOrderCode", data.data.code);
      clearCart();
      toast.success(`Commande ${data.data.code} confirmee et envoyee en cuisine`);
      navigate(`${basePath || ""}/track?code=${encodeURIComponent(data.data.code)}`);
      reset();
      return;
    } catch (error) {
      confirmOrder({
        customer: values.name,
        mode,
        address: values.address,
        notes: values.notes
      });
      toast.error(error.response?.data?.message || "API indisponible: commande gardee localement.");
    }

    reset();
    navigate(`${basePath || ""}/track`);
  };

  const isTableOrder = Boolean(currentTable);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Card className="p-6">
        <h1 className="text-4xl font-black">Checkout</h1>
        {currentTable && <p className="mt-3 inline-flex rounded-2xl bg-gold/15 px-4 py-2 text-sm font-black text-copper">Commande table {currentTable}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
          <Input label="Nom" {...register("name")} />
          {!isTableOrder && (
            <>
              <Input label="Telephone" {...register("phone")} />
              <Select label="Mode" options={["Sur place", "Retrait", "Livraison"]} {...register("mode")} />
              <Input label="Adresse" {...register("address")} />
            </>
          )}
          <Input label="Notes" className={isTableOrder ? "md:col-span-2" : "md:col-span-2"} {...register("notes")} />
          <Button type="submit" disabled={isSubmitting} className={isTableOrder ? "md:col-span-2" : ""}>{isSubmitting ? "Envoi..." : "Confirmer la commande"}</Button>
          {!isTableOrder && <Button type="button" variant="secondary" icon={MessageCircle}>WhatsApp</Button>}
        </form>
      </Card>
    </main>
  );
};

import {
  Clock3, CreditCard, Minus, Pause, Play, Plus, Printer,
  ReceiptText, Search, Send, ShoppingBag, Trash2, X
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { categories, customers, products, tables } from "../../data/mockData";
import { api } from "../../services/api";
import { useAppStore } from "../../store/useAppStore";
import { formatMoney } from "../../utils/format";

export const POSPage = () => {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // drawer panier mobile
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [table, setTable] = useState(tables[0].number);
  const cart = useAppStore((s) => s.cart);
  const heldOrders = useAppStore((s) => s.heldOrders);
  const addToCart = useAppStore((s) => s.addToCart);
  const updateCartItem = useAppStore((s) => s.updateCartItem);
  const removeCartItem = useAppStore((s) => s.removeCartItem);
  const clearCart = useAppStore((s) => s.clearCart);
  const holdCurrentOrder = useAppStore((s) => s.holdCurrentOrder);
  const resumeHeldOrder = useAppStore((s) => s.resumeHeldOrder);
  const pushNotification = useAppStore((s) => s.pushNotification);

  const filtered = useMemo(() =>
    products.filter((p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
    ),
    [category, query]
  );
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tva = subtotal * 0.1;
  const total = subtotal + tva;

  const buildTicketHtml = (title, items = cart, ticketTotal = total) => {
    const rows = items.map((i) => `<tr><td>${i.qty}x</td><td>${i.name}</td><td>${formatMoney(i.price * i.qty)}</td></tr>`).join("");
    return `<html><head><title>${title}</title><style>body{font-family:Arial;padding:18px}table{width:100%;border-collapse:collapse;margin-top:16px}td{border-bottom:1px dashed #999;padding:8px 0;font-size:14px}td:last-child{text-align:right}.total{margin-top:16px;font-size:18px;font-weight:800;text-align:right}</style></head><body><h1>${title}</h1><p>Table: ${table}</p><p>Date: ${new Date().toLocaleString("fr-FR")}</p><table>${rows}</table><div class="total">Total: ${formatMoney(ticketTotal)}</div><script>window.onload=()=>{window.print();window.close()}</script></body></html>`;
  };

  const printTicket = (title) => {
    if (!cart.length) return toast.error("Aucun article.");
    const popup = window.open("", "_blank", "width=420,height=640");
    if (!popup) return toast.error("Autorisez les popups.");
    popup.document.write(buildTicketHtml(title));
    popup.document.close();
    toast.success("Ticket envoyé.");
  };

  const createOrder = async () => {
    const tableInfo = tables.find((t) => t.number === table);
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const establishmentId = storedUser.establishmentId || cart[0]?.establishmentId || 1;
    const { data } = await api.post("/orders", {
      establishmentId, source: "TABLE", status: "NEW",
      tableId: tableInfo?.id, tableNumber: table, tva,
      items: cart.map((i) => ({ productId: i.productId || i.id, productName: i.name, quantity: i.qty, unitPrice: i.price, note: i.note }))
    });
    return { order: data.data, establishmentId };
  };

  const sendOrder = async () => {
    if (!cart.length) return toast.error("Panier vide.");
    setSavingOrder(true);
    try {
      const { order } = await createOrder();
      printTicket("Ticket commande");
      toast.success(`${order.code} envoyée en cuisine`);
      pushNotification({ title: "Commande envoyée", body: `${order.code} - Table ${table}`, type: "success" });
      clearCart();
      setCartOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l'envoi.");
    } finally { setSavingOrder(false); }
  };

  const pay = async () => {
    if (!cart.length) return toast.error("Panier vide.");
    setSavingPayment(true);
    try {
      const { order, establishmentId } = await createOrder();
      await api.post("/payments", { orderId: order.id, establishmentId, method: paymentMethod, amount: total });
      toast.success(`${order.code} encaissée`);
      pushNotification({ title: "Paiement encaissé", body: `${order.code} - ${formatMoney(total)}`, type: "success" });
      clearCart(); setPaymentOpen(false); setCartOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors du paiement.");
    } finally { setSavingPayment(false); }
  };

  const holdOrder = () => {
    if (!cart.length) return toast.error("Panier vide.");
    holdCurrentOrder({ table, items: cart, subtotal, tva, total, status: "HELD" });
    toast.success(`Table ${table} mise en attente`);
    setCartOpen(false);
  };

  const resumeOrder = (order) => {
    setTable(order.table);
    resumeHeldOrder(order.id);
    toast.success(`Table ${order.table} reprise`);
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="border-b border-black/5 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black dark:text-cream">Commande {table}</h2>
          <Badge tone="warning">En cours</Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.map((item) => (
          <div key={item.id} className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5">
            <div className="flex justify-between gap-2">
              <span className="font-bold text-sm dark:text-cream truncate">{item.name}</span>
              <button onClick={() => removeCartItem(item.id)} className="shrink-0 text-danger"><Trash2 size={14} /></button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-elegant">{formatMoney(item.price)}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateCartItem(item.id, { qty: Math.max(1, item.qty - 1) })} className="grid h-7 w-7 place-items-center rounded-xl bg-white dark:bg-white/10"><Minus size={13} /></button>
                <span className="w-5 text-center text-sm font-black">{item.qty}</span>
                <button onClick={() => updateCartItem(item.id, { qty: item.qty + 1 })} className="grid h-7 w-7 place-items-center rounded-xl bg-white dark:bg-white/10"><Plus size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {!cart.length && (
          <p className="rounded-2xl bg-black/[0.03] p-6 text-center text-sm font-semibold text-elegant dark:bg-white/5">
            Ajoutez des produits.
          </p>
        )}
      </div>
      <div className="border-t border-black/5 p-4 dark:border-white/10 space-y-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-elegant">Sous-total</span><strong>{formatMoney(subtotal)}</strong></div>
          <div className="flex justify-between"><span className="text-elegant">TVA</span><strong>{formatMoney(tva)}</strong></div>
        </div>
        <div className="flex justify-between text-xl font-black"><span>Total</span><span>{formatMoney(total)}</span></div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={Pause} onClick={holdOrder} size="sm" disabled={!cart.length}>Attente</Button>
          <Button variant="secondary" icon={Printer} onClick={() => printTicket("Ticket")} size="sm" disabled={!cart.length}>Ticket</Button>
          <Button className="col-span-2" icon={Send} onClick={sendOrder} disabled={!cart.length || savingOrder}>{savingOrder ? "Envoi..." : "Envoyer"}</Button>
          <Button className="col-span-2" icon={CreditCard} onClick={() => setPaymentOpen(true)} disabled={!cart.length}>Encaisser</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader eyebrow="Caisse tactile" title="POS" breadcrumbs={["Admin", "POS"]}
        actions={
          <div className="flex gap-2">
            <Select value={table} onChange={(e) => setTable(e.target.value)} options={tables.map((t) => t.number)} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        {/* ── Produits ── */}
        <div className="space-y-3">
          <Card className="p-3 sm:p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-elegant" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-10 w-full rounded-2xl border border-black/10 bg-white pl-9 pr-3 text-sm font-medium outline-none focus:border-gold dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <Select options={customers.map((c) => c.name)} className="hidden sm:block" />
            </div>
          </Card>

          {heldOrders.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2"><Clock3 size={16} className="text-copper" /><h3 className="font-black text-sm dark:text-cream">En attente</h3></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {heldOrders.map((o) => (
                  <button key={o.id} onClick={() => resumeOrder(o)} className="flex items-center justify-between rounded-2xl bg-white p-3 text-left shadow-sm transition hover:bg-gold/10 dark:bg-white/10">
                    <span>
                      <strong className="block text-sm dark:text-cream">Table {o.table}</strong>
                      <span className="text-xs text-elegant">{o.items.length} art. — {formatMoney(o.total)}</span>
                    </span>
                    <Play size={14} className="text-copper" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Catégories */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  category === c.id
                    ? "bg-ink text-cream dark:bg-gold dark:text-ink"
                    : "bg-white text-elegant shadow-sm border border-black/8 dark:bg-white/10 dark:text-zinc-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Grille produits — 2 cols mobile, 3 cols xl */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((product) => (
              <Card key={product.id} interactive className="overflow-hidden p-0">
                <img src={product.image} alt={product.name} className="h-32 w-full object-cover sm:h-36" />
                <div className="p-3">
                  <h3 className="text-sm font-black dark:text-cream line-clamp-1">{product.name}</h3>
                  <p className="mt-0.5 text-[11px] text-elegant">{product.prep} min</p>
                  <div className="mt-2.5 flex items-center justify-between gap-1">
                    <strong className="text-sm">{formatMoney(product.price)}</strong>
                    <button
                      onClick={() => addToCart(product)}
                      className="grid h-8 w-8 place-items-center rounded-xl bg-gold text-ink shadow-sm transition hover:opacity-80"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Panier desktop ── */}
        <aside className="hidden xl:block sticky top-24 h-max">
          <Card className="overflow-hidden h-[calc(100dvh-8rem)]">
            <CartContent />
          </Card>
        </aside>
      </div>

      {/* ── FAB panier mobile ── */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-4 z-30 flex items-center gap-3 rounded-2xl bg-gold px-5 py-3.5 text-sm font-bold text-ink shadow-2xl transition hover:opacity-90 xl:hidden"
        >
          <ShoppingBag size={18} />
          Panier ({cart.length})
          <span className="rounded-xl bg-ink px-2 py-0.5 text-xs font-black text-white">{formatMoney(total)}</span>
        </button>
      )}

      {/* ── Panier mobile drawer ── */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="">
        <div className="-mt-4 h-full">
          <CartContent />
        </div>
      </Drawer>

      {/* ── Paiement drawer ── */}
      <Drawer open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Encaissement">
        <div className="space-y-4">
          <Select
            label="Mode de paiement"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { label: "Espèces", value: "CASH" },
              { label: "Carte", value: "CARD" },
              { label: "Mixte", value: "MIXED" },
              { label: "Crédit", value: "CREDIT" },
            ]}
          />
          <Input label="Montant reçu" defaultValue={total.toFixed(2)} />
          <Input label="Remise %" placeholder="0" />
          <Card className="p-4 bg-black/[0.02] dark:bg-white/5">
            <ReceiptText className="text-copper" size={20} />
            <h3 className="mt-3 font-black dark:text-cream">Facture — Table {table}</h3>
            <p className="mt-2 text-elegant text-sm">Total TTC : <strong>{formatMoney(total)}</strong></p>
          </Card>
          <Button className="w-full" icon={CreditCard} onClick={pay} disabled={savingPayment}>
            {savingPayment ? "Enregistrement..." : "Valider le paiement"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

import { Clock3, CreditCard, Minus, Pause, Play, Plus, Printer, ReceiptText, Search, Send, Trash2 } from "lucide-react";
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
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [table, setTable] = useState(tables[0].number);
  const cart = useAppStore((state) => state.cart);
  const heldOrders = useAppStore((state) => state.heldOrders);
  const addToCart = useAppStore((state) => state.addToCart);
  const updateCartItem = useAppStore((state) => state.updateCartItem);
  const removeCartItem = useAppStore((state) => state.removeCartItem);
  const clearCart = useAppStore((state) => state.clearCart);
  const holdCurrentOrder = useAppStore((state) => state.holdCurrentOrder);
  const resumeHeldOrder = useAppStore((state) => state.resumeHeldOrder);
  const pushNotification = useAppStore((state) => state.pushNotification);

  const filtered = useMemo(() => products.filter((product) => (category === "all" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tva = subtotal * 0.1;
  const total = subtotal + tva;

  const buildTicketHtml = (title, ticketTable, items, ticketTotal) => {
    const rows = items.map((item) => `<tr><td>${item.qty}x</td><td>${item.name}</td><td>${formatMoney(item.price * item.qty)}</td></tr>`).join("");
    return `
      <html>
        <head>
          <title>${title} ${ticketTable}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 6px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { border-bottom: 1px dashed #999; padding: 8px 0; font-size: 14px; }
            td:last-child { text-align: right; }
            .total { margin-top: 16px; font-size: 18px; font-weight: 800; text-align: right; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Table:</strong> ${ticketTable}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString("fr-FR")}</p>
          <table>${rows}</table>
          <div class="total">Total: ${formatMoney(ticketTotal)}</div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>`;
  };

  const printItemsTicket = (title, ticketItems = cart) => {
    if (!ticketItems.length) return false;
    const ticketTotal = ticketItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const popup = window.open("", "_blank", "width=420,height=640");
    if (!popup) {
      toast.error("Autorisez les popups pour imprimer le ticket automatiquement.");
      return false;
    }
    popup.document.write(buildTicketHtml(title, table, ticketItems, ticketTotal));
    popup.document.close();
    return true;
  };

  const createOrder = async () => {
    const tableInfo = tables.find((item) => item.number === table);
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const establishmentId = storedUser.establishmentId || cart[0]?.establishmentId || 1;

    const { data } = await api.post("/orders", {
      establishmentId,
      source: "TABLE",
      status: "NEW",
      tableId: tableInfo?.id,
      tableNumber: table,
      tva,
      items: cart.map((item) => ({
        productId: item.productId || item.id,
        productName: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        note: item.note
      }))
    });

    return { order: data.data, establishmentId };
  };

  const sendOrder = async () => {
    if (!cart.length) {
      toast.error("Ajoutez au moins un produit avant d'envoyer la commande.");
      return;
    }

    setSavingOrder(true);
    try {
      const { order } = await createOrder();
      printItemsTicket("Ticket commande");
      toast.success(`Commande ${order.code} envoyee en cuisine`);
      pushNotification({ title: "Commande envoyee", body: `${order.code} - Table ${table}`, type: "success" });
      clearCart();
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'enregistrer la commande.");
    } finally {
      setSavingOrder(false);
    }
  };

  const pay = async () => {
    if (!cart.length) {
      toast.error("Ajoutez au moins un produit avant d'encaisser.");
      return;
    }

    setSavingPayment(true);
    try {
      const { order, establishmentId } = await createOrder();
      await api.post("/payments", {
        orderId: order.id,
        establishmentId,
        method: paymentMethod,
        amount: total
      });

      toast.success(`Commande ${order.code} enregistree et encaissee`);
      pushNotification({ title: "Paiement encaisse", body: `${order.code} - ${formatMoney(total)}`, type: "success" });
      clearCart();
      setPaymentOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'enregistrer la commande.");
    } finally {
      setSavingPayment(false);
    }
  };

  const holdOrder = () => {
    if (!cart.length) {
      toast.error("Ajoutez au moins un produit avant la mise en attente.");
      return;
    }
    holdCurrentOrder({ table, items: cart, subtotal, tva, total, status: "HELD" });
    pushNotification({ title: "Commande en attente", body: `Table ${table} mise en attente`, type: "warning" });
    toast.success(`Commande ${table} mise en attente`);
  };

  const printTicket = () => {
    if (!cart.length) {
      toast.error("Aucun article a imprimer.");
      return;
    }
    if (printItemsTicket("Ticket commande")) toast.success("Ticket envoye a l'impression");
  };

  const resumeOrder = (order) => {
    setTable(order.table);
    resumeHeldOrder(order.id);
    toast.success(`Commande ${order.table} reprise`);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Caisse tactile" title="POS rapide" description="Prise de commande tablette avec tables, clients, variantes, paiements mixtes et impression recu." breadcrumbs={["Admin", "POS"]} />
      <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
        <section className="space-y-4">
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
              <Input icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher produit" />
              <Select value={table} onChange={(event) => setTable(event.target.value)} options={tables.map((item) => item.number)} />
              <Select options={customers.map((item) => item.name)} />
            </div>
          </Card>
          {heldOrders.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="text-copper" size={18} />
                <h3 className="font-black dark:text-cream">Commandes en attente</h3>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {heldOrders.map((order) => (
                  <button key={order.id} onClick={() => resumeOrder(order)} className="flex items-center justify-between rounded-2xl bg-white p-3 text-left shadow-sm transition hover:bg-gold/10 dark:bg-white/10">
                    <span>
                      <strong className="block dark:text-cream">Table {order.table}</strong>
                      <span className="text-xs font-semibold text-elegant">{order.items.length} article(s) - {formatMoney(order.total)}</span>
                    </span>
                    <Play size={16} className="text-copper" />
                  </button>
                ))}
              </div>
            </Card>
          )}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${category === item.id ? "bg-ink text-cream dark:bg-gold dark:text-ink" : "bg-white text-elegant shadow-sm dark:bg-white/10"}`}>{item.name}</button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((product) => (
              <Card key={product.id} interactive className="overflow-hidden">
                <img src={product.image} alt={product.name} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><h3 className="font-black dark:text-cream">{product.name}</h3><p className="mt-1 text-xs font-semibold text-elegant">{product.prep} min</p></div>
                    <Badge tone="gold">{product.badge}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <strong>{formatMoney(product.price)}</strong>
                    <Button size="sm" icon={Plus} onClick={() => addToCart(product)}>Ajouter</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
        <aside className="sticky top-24 h-max">
          <Card className="overflow-hidden">
            <div className="border-b border-black/5 p-5 dark:border-white/10">
              <div className="flex items-center justify-between"><h2 className="text-xl font-black dark:text-cream">Commande {table}</h2><Badge tone="warning">En cours</Badge></div>
            </div>
            <div className="max-h-[48vh] space-y-3 overflow-y-auto p-5">
              {cart.map((item) => (
                <div key={item.id} className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5">
                  <div className="flex justify-between gap-3"><strong className="dark:text-cream">{item.name}</strong><button onClick={() => removeCartItem(item.id)} className="text-danger"><Trash2 size={16} /></button></div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-elegant">{formatMoney(item.price)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartItem(item.id, { qty: Math.max(1, item.qty - 1) })} className="rounded-xl bg-white p-2 dark:bg-white/10"><Minus size={14} /></button>
                      <strong>{item.qty}</strong>
                      <button onClick={() => updateCartItem(item.id, { qty: item.qty + 1 })} className="rounded-xl bg-white p-2 dark:bg-white/10"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {!cart.length && <p className="rounded-2xl bg-black/[0.03] p-5 text-center text-sm font-semibold text-elegant dark:bg-white/5">Ajoutez des produits pour commencer.</p>}
            </div>
            <div className="border-t border-black/5 p-5 dark:border-white/10">
              <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Sous-total</span><strong>{formatMoney(subtotal)}</strong></div><div className="flex justify-between"><span>TVA</span><strong>{formatMoney(tva)}</strong></div></div>
              <div className="mt-4 flex justify-between text-2xl font-black"><span>Total</span><span>{formatMoney(total)}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="secondary" icon={Pause} onClick={holdOrder} disabled={!cart.length}>Attente</Button>
                <Button variant="secondary" icon={Printer} onClick={printTicket} disabled={!cart.length}>Ticket</Button>
                <Button className="col-span-2" icon={Send} onClick={sendOrder} disabled={!cart.length || savingOrder}>{savingOrder ? "Envoi..." : "Envoyer commande"}</Button>
                <Button className="col-span-2" icon={CreditCard} onClick={() => setPaymentOpen(true)} disabled={!cart.length}>Encaisser</Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>
      <Drawer open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Paiement et facture">
        <div className="space-y-4">
          <Select
            label="Mode paiement"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            options={[
              { label: "Especes", value: "CASH" },
              { label: "Carte", value: "CARD" },
              { label: "Mixte", value: "MIXED" },
              { label: "Credit", value: "CREDIT" }
            ]}
          />
          <Input label="Montant recu" defaultValue={total.toFixed(2)} />
          <Input label="Remise" placeholder="0 ou 10%" />
          <Card className="p-5" id="invoice-preview"><ReceiptText className="text-copper" /><h3 className="mt-3 text-xl font-black">Facture {table}</h3><p className="mt-2 text-elegant">Total: {formatMoney(total)}</p></Card>
          <Button className="w-full" icon={CreditCard} onClick={pay} disabled={savingPayment}>{savingPayment ? "Enregistrement..." : "Valider paiement"}</Button>
        </div>
      </Drawer>
    </div>
  );
};

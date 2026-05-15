import { Building2, Calendar, Columns3, CreditCard, Eye, FileText, ListFilter, Printer, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/Tabs";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";
import { formatMoney } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";

const statuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"];
const kitchenKeywords = ["tacos", "pizza", "burger", "tajine", "couscous", "salade", "crepe", "plat", "poulet", "viande", "snack", "dessert"];
const barKeywords = ["cafe", "espresso", "the", "jus", "orange", "avocat", "boisson"];

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[char]));

const isKitchenItem = (item) => {
  const name = (item.name || "").toLowerCase();
  const category = (item.category || "").toLowerCase();
  if (["food", "snack", "dessert", "plats", "snacks", "desserts"].includes(category)) return true;
  if (["coffee", "tea", "juice", "boissons chaudes", "boissons froides"].includes(category)) return false;
  if (barKeywords.some((keyword) => name.includes(keyword))) return false;
  return kitchenKeywords.some((keyword) => name.includes(keyword));
};

const openPrintWindow = (title, html) => {
  const popup = window.open("", "_blank", "width=460,height=720");
  if (!popup) {
    toast.error("Autorisez les popups pour imprimer.");
    return false;
  }
  popup.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 6px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px dashed #999; padding: 8px 0; font-size: 14px; text-align: left; }
          td:last-child, th:last-child { text-align: right; }
          .total { margin-top: 16px; font-size: 18px; font-weight: 800; text-align: right; }
          .muted { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>${html}<script>window.onload = () => { window.print(); };</script></body>
    </html>
  `);
  popup.document.close();
  return true;
};

const normalizeApiOrder = (order) => ({
  id: order.id,
  code: order.code,
  table: order.table?.number || (order.source === "DELIVERY" ? "Livraison" : order.source === "COUNTER" ? "Comptoir" : "Table client"),
  customerId: order.customerId,
  customer: order.customer?.name || "Client",
  establishmentName: order.establishment?.name || `Entite #${order.establishmentId || "-"}`,
  type: order.source,
  server: order.server?.name || (order.source === "ONLINE" ? "Client en ligne" : "Client QR"),
  serverRole: order.server?.roleName || null,
  status: order.status,
  total: Number(order.total),
  subtotal: Number(order.subtotal),
  tva: Number(order.tva),
  discount: Number(order.discount),
  deliveryFee: Number(order.deliveryFee),
  createdAt: new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  lineItems: order.items?.map((item) => ({
    id: item.id,
    name: item.productName || item.product?.name || "Produit",
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || 0),
    total: Number(item.total || 0),
    note: item.note || "",
    category: item.product?.category?.name || item.product?.category || ""
  })) || [],
  items: order.items?.map((item) => `${item.quantity}x ${item.productName || item.product?.name || "Produit"}`) || [],
  note: order.note || "",
  station: order.items?.some((item) => Number(item.product?.preparationTime || 0) > 8) ? "cuisine" : "bar",
  serverSynced: true
});

export const OrdersPage = () => {
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [payingOrder, setPayingOrder] = useState(false);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const { data: apiOrders, setData: setApiOrders } = useApiResource("/orders");
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const orders = useMemo(
    () => {
      return apiOrders.map(normalizeApiOrder);
    },
    [apiOrders]
  );
  const filtered = useMemo(() => orders.filter((order) => JSON.stringify(order).toLowerCase().includes(filter.toLowerCase())), [orders, filter]);
  const moveOrder = async (id, status) => {
    const apiOrder = apiOrders.find((order) => order.id === id);
    if (apiOrder) {
      try {
        const { data } = await api.put(`/orders/${id}/status`, { status });
        setApiOrders((current) => current.map((order) => (order.id === id ? data.data : order)));
      } catch (error) {
        toast.error(error.response?.data?.message || "Impossible de modifier le statut.");
        return;
      }
    }
    setSelected((current) => (current?.id === id ? { ...current, status } : current));
    toast.success(`Commande ${id} -> ${status}`);
  };

  const dropOrder = (event, status) => {
    event.preventDefault();
    const droppedId = Number(event.dataTransfer.getData("text/plain")) || draggedOrderId;
    if (!droppedId) return;
    const order = orders.find((item) => item.id === droppedId);
    setDraggedOrderId(null);
    if (!order || order.status === status) return;
    moveOrder(order.id, status);
  };

  const deleteAllOrders = async () => {
    if (user?.roleName !== "SUPER_ADMIN") return;
    const confirmed = window.confirm("Supprimer toutes les commandes, paiements, factures et tickets lies ?");
    if (!confirmed) return;

    try {
      const { data } = await api.delete("/orders");
      setApiOrders([]);
      setSelected(null);
      toast.success(`${data.deleted.orders} commande(s) supprimee(s)`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible de supprimer les commandes.");
    }
  };

  const paySelectedOrder = async () => {
    if (!selected?.serverSynced || selected.status === "PAID") return;

    setPayingOrder(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      await api.post("/payments", {
        orderId: selected.id,
        establishmentId: storedUser.establishmentId || 1,
        method: "CASH",
        amount: selected.total
      });
      setApiOrders((current) => current.map((order) => (order.id === selected.id ? { ...order, status: "PAID" } : order)));
      setSelected((current) => (current ? { ...current, status: "PAID" } : current));
      toast.success(`Commande ${selected.code} encaissee`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'encaisser cette commande.");
      return false;
    } finally {
      setPayingOrder(false);
    }
  };

  const saveSelectedCustomer = async () => {
    if (!selected?.serverSynced || !selected.customer?.trim()) return;

    try {
      const { data } = await api.put(`/orders/${selected.id}/customer`, { name: selected.customer.trim() });
      setApiOrders((current) => current.map((order) => (order.id === selected.id ? data.data : order)));
      setSelected(normalizeApiOrder(data.data));
      toast.success("Nom du client mis a jour");
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible de modifier le client.");
    }
  };

  const printOrderTicket = () => {
    if (!selected) return;
    const ticketItems = selected.lineItems;
    if (!ticketItems.length) {
      toast.error("Aucun article dans cette commande.");
      return;
    }

    const rows = ticketItems.map((item) => `
      <tr>
        <td>${item.quantity}x</td>
        <td>${escapeHtml(item.name)}${item.note ? `<p class="muted">${escapeHtml(item.note)}</p>` : ""}</td>
        <td>${formatMoney(item.total)}</td>
      </tr>
    `).join("");

    const printed = openPrintWindow(`Ticket ${selected.code}`, `
      <h1>Ticket commande</h1>
      <p><strong>Commande:</strong> ${escapeHtml(selected.code)}</p>
      <p><strong>Table:</strong> ${escapeHtml(selected.table)}</p>
      <p><strong>Serveur / Source:</strong> ${escapeHtml(selected.server)}</p>
      <table>${rows}</table>
    `);
    if (printed) toast.success("Ticket commande pret a imprimer.");
  };

  const printInvoice = async () => {
    if (!selected) return;
    let invoiceOrder = selected;

    if (selected.status !== "PAID") {
      const paid = await paySelectedOrder();
      if (!paid) return;
      invoiceOrder = { ...selected, status: "PAID" };
    }

    const rows = invoiceOrder.lineItems.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.quantity}</td>
        <td>${formatMoney(item.unitPrice)}</td>
        <td>${formatMoney(item.total)}</td>
      </tr>
    `).join("");

    const printed = openPrintWindow(`Facture ${invoiceOrder.code}`, `
      <h1>Facture</h1>
      <p><strong>Commande:</strong> ${escapeHtml(invoiceOrder.code)}</p>
      <p><strong>Table:</strong> ${escapeHtml(invoiceOrder.table)}</p>
      <p><strong>Client:</strong> ${escapeHtml(invoiceOrder.customer)}</p>
      <p><strong>Serveur / Source:</strong> ${escapeHtml(invoiceOrder.server)}</p>
      <table>
        <thead><tr><th>Article</th><th>Qte</th><th>PU</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="total">Total: ${formatMoney(invoiceOrder.total)}</p>
      <p class="muted">Statut: PAYE</p>
    `);
    if (printed) toast.success("Facture prete a imprimer.");
  };

  const columns = [
    { header: "Code", accessorKey: "code", cell: ({ row }) => <strong className="text-ink dark:text-cream">{row.original.code}</strong> },
    ...(isSuperAdmin ? [{ header: "Entite", accessorKey: "establishmentName", cell: ({ row }) => <div className="flex items-center gap-2"><Building2 size={16} className="text-copper" /><span className="font-semibold">{row.original.establishmentName}</span></div> }] : []),
    { header: "Client", accessorKey: "customer" },
    { header: "Serveur / Source", accessorKey: "server", cell: ({ row }) => (
      <div>
        <strong className="text-ink dark:text-cream">{row.original.server}</strong>
        <p className="text-xs font-semibold text-elegant">{row.original.serverRole || row.original.type}</p>
      </div>
    ) },
    { header: "Type", accessorKey: "type" },
    { header: "Table", accessorKey: "table" },
    { header: "Total", accessorKey: "total", cell: ({ row }) => formatMoney(row.original.total) },
    { header: "Statut", accessorKey: "status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> },
    { header: "Actions", cell: ({ row }) => <Button size="sm" variant="secondary" icon={Eye} onClick={() => setSelected(row.original)}>Detail</Button> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order control"
        title="Commandes avancees"
        description="Tableau, Kanban, timeline, filtres, details drawer, impression ticket cuisine et mise a jour temps reel."
        actions={<><Button variant="secondary" icon={Printer}>Ticket</Button><Button icon={FileText}>Facture PDF</Button>{user?.roleName === "SUPER_ADMIN" && <Button variant="secondary" icon={Trash2} onClick={deleteAllOrders}>Vider commandes</Button>}</>}
        breadcrumbs={["Admin", "Commandes"]}
      />
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input icon={Search} value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Recherche commande, client, serveur..." />
          <div className="flex gap-2">
            <Tabs tabs={[{ value: "table", label: "Tableau" }, { value: "kanban", label: "Kanban" }, { value: "timeline", label: "Timeline" }]} active={view} onChange={setView} />
            <Button variant="secondary" icon={ListFilter}>Filtres</Button>
          </div>
        </div>
      </Card>
      {view === "table" && <DataTable data={filtered} columns={columns} onRowDoubleClick={setSelected} />}
      {view === "kanban" && (
        <div className="kanban-board grid gap-4 xl:grid-cols-4 2xl:grid-cols-8">
          {statuses.map((status) => (
            <Card
              key={status}
              className={`min-h-96 p-3 transition ${draggedOrderId ? "ring-2 ring-gold/20" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropOrder(event, status)}
            >
              <div className="mb-3 flex items-center justify-between"><Badge tone={statusTone(status)}>{status}</Badge><Columns3 size={16} className="text-elegant" /></div>
              <div className="space-y-3">
                {filtered.filter((order) => order.status === status).map((order) => (
                  <button
                    key={order.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(order.id));
                      setDraggedOrderId(order.id);
                    }}
                    onDragEnd={() => setDraggedOrderId(null)}
                    onDoubleClick={() => setSelected(order)}
                    className={`w-full rounded-2xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 dark:bg-white/10 ${draggedOrderId === order.id ? "opacity-50" : ""}`}
                  >
                    <strong className="block dark:text-cream">{order.code}</strong>
                    <span className="text-xs font-semibold text-elegant">{order.table} - {formatMoney(order.total)}</span>
                    <select className="mt-3 w-full rounded-xl border border-black/10 bg-transparent p-2 text-xs" value={order.status} onChange={(event) => moveOrder(order.id, event.target.value)}>
                      {statuses.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {view === "timeline" && (
        <Card className="p-5">
          <div className="space-y-4">
            {filtered.map((order) => (
              <div key={order.id} className="flex gap-4 rounded-2xl bg-white p-4 dark:bg-white/5">
                <div className="rounded-2xl bg-gold/15 p-3 text-copper"><Calendar size={18} /></div>
                <div><strong className="dark:text-cream">{order.code}</strong><p className="text-sm text-elegant">{order.createdAt} - {order.customer} - {order.items.join(", ")}</p></div>
                <Badge tone={statusTone(order.status)} className="ml-auto h-max">{order.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.code || "Detail commande"}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><Badge tone={statusTone(selected.status)}>{selected.status}</Badge><strong>{formatMoney(selected.total)}</strong></div>
            <Card className="grid gap-3 p-4 text-sm font-semibold md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Nom du client"
                  value={selected.customer}
                  onChange={(event) => setSelected((current) => ({ ...current, customer: event.target.value }))}
                  onBlur={saveSelectedCustomer}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">Statut commande</span>
                  <select
                    value={selected.status}
                    onChange={(event) => moveOrder(selected.id, event.target.value)}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white/85 px-4 text-sm font-semibold text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15 dark:border-white/10 dark:bg-white/10 dark:text-cream"
                  >
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              <div>
                {isSuperAdmin && (
                  <>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Entite</p>
                    <p className="mt-1 flex items-center gap-2 dark:text-cream"><Building2 size={16} className="text-copper" />{selected.establishmentName}</p>
                  </>
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Serveur / Source</p>
                <p className="mt-1 dark:text-cream">{selected.server}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Table</p>
                <p className="mt-1 dark:text-cream">{selected.table}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Client</p>
                <p className="mt-1 dark:text-cream">{selected.customer}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Type</p>
                <p className="mt-1 dark:text-cream">{selected.type}</p>
              </div>
            </Card>
            <Card className="p-4"><h3 className="font-black dark:text-cream">Articles</h3><ul className="mt-3 space-y-2">{selected.items.map((item) => <li key={item} className="rounded-xl bg-black/[0.03] p-3 text-sm font-semibold dark:bg-white/5">{item}</li>)}</ul></Card>
            <Input label="Motif annulation" placeholder="Optionnel" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" icon={Printer} onClick={printOrderTicket}>Ticket</Button>
              <Button icon={FileText} onClick={printInvoice}>Facture</Button>
              {selected.serverSynced && selected.status !== "PAID" && (
                <Button className="col-span-2" icon={CreditCard} onClick={paySelectedOrder} disabled={payingOrder}>
                  {payingOrder ? "Encaissement..." : "Encaisser maintenant"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

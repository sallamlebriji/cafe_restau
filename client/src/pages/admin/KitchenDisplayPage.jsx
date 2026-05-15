import { AlertTriangle, CheckCircle2, Clock, Maximize2, Minimize2, Play, Printer, RefreshCw, SearchX, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";

const activeStatuses = ["NEW", "CONFIRMED", "PREPARING", "READY"];
const barCategories = ["coffee", "tea", "juice", "boissons chaudes", "boissons froides", "boissons", "bar"];
const kitchenCategories = ["food", "snack", "dessert", "plats", "plat", "snacks", "desserts", "pizzas", "cuisine"];
const barKeywords = ["cafe", "coffee", "espresso", "the", "tea", "jus", "juice", "orange", "avocat", "boisson", "latte", "mocha", "cappuccino", "eau", "soda"];
const kitchenKeywords = ["tacos", "pizza", "burger", "tajine", "couscous", "salade", "crepe", "plat", "poulet", "viande", "snack", "dessert", "fromage", "sandwich"];

const normalizeText = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const itemName = (item) => item.productName || item.product?.name || "Produit";
const itemCategory = (item) => item.product?.category?.name || item.product?.category || "";

const isBarItem = (item) => {
  const name = normalizeText(itemName(item));
  const category = normalizeText(itemCategory(item));
  if (barCategories.includes(category)) return true;
  if (kitchenCategories.includes(category)) return false;
  return barKeywords.some((keyword) => name.includes(keyword));
};

const isKitchenItem = (item) => {
  const name = normalizeText(itemName(item));
  const category = normalizeText(itemCategory(item));
  if (kitchenCategories.includes(category)) return true;
  if (barCategories.includes(category)) return false;
  if (barKeywords.some((keyword) => name.includes(keyword))) return false;
  return kitchenKeywords.some((keyword) => name.includes(keyword));
};

const orderMatchesStation = (order, station) => {
  if (station === "bar") return (order.items || []).some(isBarItem);
  if (station === "cuisine") return (order.items || []).some(isKitchenItem);
  return true;
};

const isVisiblePreparationOrder = (order) => activeStatuses.includes(order.status) && !(order.sourceChannel === "QR" && order.status === "NEW");

const tableLabel = (order) => order.table?.number || (order.source === "DELIVERY" ? "Livraison" : order.source === "COUNTER" ? "Comptoir" : "Table client");

const waitMinutes = (createdAt) => {
  const start = new Date(createdAt).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 60000));
};

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[char]));

const normalizeTicket = (order, station) => ({
  id: order.id,
  code: order.code,
  status: order.status,
  table: tableLabel(order),
  server: order.server?.name || (order.source === "ONLINE" ? "Client en ligne" : "Client QR"),
  note: order.note || "",
  wait: waitMinutes(order.createdAt),
  items: (order.items || []).map((item) => ({
    id: item.id,
    label: `${Number(item.quantity || 1)}x ${itemName(item)}`,
    note: item.note || ""
  }))
});

export const KitchenDisplayPage = () => {
  const { user } = useAuth();
  const defaultStation = user?.roleName === "BAR" ? "bar" : user?.roleName === "KITCHEN" ? "cuisine" : "all";
  const [station, setStation] = useState(defaultStation);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [refreshing, setRefreshing] = useState(false);
  const knownTicketIds = useRef(new Set());
  const { data: apiOrders, loading, setData, refetch } = useApiResource("/orders");
  const stationTabs = useMemo(() => {
    if (user?.roleName === "BAR") return [{ value: "bar", label: "Bar" }];
    if (user?.roleName === "KITCHEN") return [{ value: "cuisine", label: "Cuisine" }];
    return [
      { value: "all", label: "Toutes" },
      { value: "cuisine", label: "Cuisine" },
      { value: "bar", label: "Bar" }
    ];
  }, [user?.roleName]);

  const tickets = useMemo(() => (
    apiOrders
      .filter(isVisiblePreparationOrder)
      .filter((order) => orderMatchesStation(order, station))
      .map((order) => normalizeTicket(order, station))
      .filter((ticket) => ticket.items.length)
  ), [apiOrders, station]);

  const playBeep = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  };

  const toggleSound = () => {
    setSoundEnabled((enabled) => {
      if (!enabled) {
        playBeep();
        toast.success("Son active.");
      } else {
        toast("Son desactive.");
      }
      return !enabled;
    });
  };

  const refreshTickets = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success("Tickets actualises.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'actualiser les tickets.");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      toast.error("Le plein ecran n'est pas autorise par le navigateur.");
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const currentIds = new Set(tickets.map((ticket) => ticket.id));
    const hasNewTicket = tickets.some((ticket) => !knownTicketIds.current.has(ticket.id));
    if (soundEnabled && knownTicketIds.current.size && hasNewTicket) playBeep();
    knownTicketIds.current = currentIds;
  }, [soundEnabled, tickets]);

  const updateStatus = async (ticket, status) => {
    try {
      const { data } = await api.put(`/orders/${ticket.id}/status`, { status });
      setData((current) => current.map((order) => (order.id === ticket.id ? data.data : order)));
      toast.success(`${ticket.code} -> ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible de modifier le statut.");
    }
  };

  const printTicket = (ticket) => {
    const popup = window.open("", "_blank", "width=420,height=650");
    if (!popup) {
      toast.error("Autorisez les popups pour imprimer le ticket.");
      return;
    }

    const rows = ticket.items.map((item) => `
      <tr>
        <td>${escapeHtml(item.label)}</td>
        <td>${item.note ? escapeHtml(item.note) : ""}</td>
      </tr>
    `).join("");

    popup.document.write(`
      <html>
        <head>
          <title>Ticket ${escapeHtml(ticket.code)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
            h1 { font-size: 22px; margin: 0 0 8px; }
            p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { border-bottom: 1px dashed #999; padding: 10px 0; font-size: 15px; font-weight: 700; vertical-align: top; }
            td:last-child { color: #666; font-size: 12px; font-weight: 600; text-align: right; }
            .meta { margin-top: 12px; padding-top: 12px; border-top: 2px solid #111; }
          </style>
        </head>
        <body>
          <h1>Ticket ${station === "bar" ? "Bar" : station === "cuisine" ? "Cuisine" : "Preparation"}</h1>
          <p><strong>Commande:</strong> ${escapeHtml(ticket.code)}</p>
          <p><strong>Table:</strong> ${escapeHtml(ticket.table)}</p>
          <p><strong>Serveur / Source:</strong> ${escapeHtml(ticket.server)}</p>
          <p><strong>Statut:</strong> ${escapeHtml(ticket.status)}</p>
          <div class="meta"><table>${rows}</table></div>
          ${ticket.note ? `<p class="meta"><strong>Note:</strong> ${escapeHtml(ticket.note)}</p>` : ""}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    popup.document.close();
    toast.success("Ticket pret a imprimer.");
  };

  return (
    <div className="dark min-h-[calc(100vh-110px)] rounded-3xl bg-ink p-5 text-cream">
      <PageHeader
        eyebrow="Kitchen Display System"
        title={user?.roleName === "BAR" ? "Bar" : user?.roleName === "KITCHEN" ? "Cuisine" : "Cuisine / Bar"}
        description="Commandes temps reel par poste, articles filtres, priorites et changement de statut."
        actions={<><Button variant={soundEnabled ? "gold" : "secondary"} icon={soundEnabled ? Volume2 : VolumeX} onClick={toggleSound}>{soundEnabled ? "Son actif" : "Son"}</Button><Button variant="secondary" icon={RefreshCw} loading={refreshing} onClick={refreshTickets}>Actualiser</Button><Button variant="gold" icon={fullscreen ? Minimize2 : Maximize2} onClick={toggleFullscreen}>{fullscreen ? "Quitter" : "Plein ecran"}</Button></>}
      />
      <Tabs tabs={stationTabs} active={station} onChange={setStation} />

      {loading ? (
        <Card className="mt-6 border-white/10 bg-white/[0.06] p-8 text-center text-cream">Chargement des tickets...</Card>
      ) : tickets.length === 0 ? (
        <Card className="mt-6 border-white/10 bg-white/[0.06] p-10 text-center text-cream">
          <SearchX className="mx-auto text-gold" size={42} />
          <h2 className="mt-4 text-2xl font-black">Aucun ticket {station === "bar" ? "bar" : station === "cuisine" ? "cuisine" : "actif"}</h2>
          <p className="mt-2 text-sm font-semibold text-cream/65">Les nouvelles commandes apparaissent ici des qu'elles sont envoyees.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket, index) => (
            <Card key={ticket.id} className={`border-white/10 bg-white/[0.06] p-5 ${index === 0 ? "ring-2 ring-warning" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gold">{ticket.table} - {ticket.server}</p>
                  <h2 className="mt-1 text-3xl font-black text-cream">{ticket.code}</h2>
                </div>
                <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-black/25 p-3 text-sm font-bold"><Clock size={18} className="text-warning" /> Attente {ticket.wait} min</div>
              <div className="mt-4 space-y-2">
                {ticket.items.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/10 p-3 text-lg font-black">
                    {item.label}
                    {item.note && <p className="mt-1 text-xs font-semibold text-cream/65">{item.note}</p>}
                  </div>
                ))}
              </div>
              {ticket.note && <div className="mt-4 rounded-2xl bg-warning/20 p-3 text-sm font-bold text-orange-200"><AlertTriangle size={16} className="mr-2 inline" />{ticket.note}</div>}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  icon={Play}
                  disabled={["PREPARING", "READY"].includes(ticket.status)}
                  className={["PREPARING", "READY"].includes(ticket.status) ? "border-white/5 bg-white/5 text-cream/45 hover:border-white/5" : ""}
                  onClick={() => updateStatus(ticket, "PREPARING")}
                >
                  Start
                </Button>
                <Button variant="gold" icon={CheckCircle2} onClick={() => updateStatus(ticket, "READY")}>Pret</Button>
                <Button variant="danger" icon={AlertTriangle} onClick={() => updateStatus(ticket, "CANCELLED")}>Probleme</Button>
                {ticket.status === "PREPARING" && (
                  <Button className="col-span-3" variant="secondary" icon={Printer} onClick={() => printTicket(ticket)}>Imprimer ticket</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

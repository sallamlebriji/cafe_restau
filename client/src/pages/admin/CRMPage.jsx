import { BarChart3, BrainCircuit, Building2, Crown, MessageCircle, RefreshCw, Save, Sparkles, Tag, Trash2, TrendingUp, UserRoundPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { useApiResource } from "../../hooks/useApiResource";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { formatMoney } from "../../utils/format";

const emptyCustomer = { name: "", phone: "", email: "", address: "", establishmentId: "" };

const customerLevel = (total) => {
  if (total >= 5000) return "VIP";
  if (total >= 1500) return "Fidele";
  return "Nouveau";
};

const daysSince = (date) => {
  if (!date) return null;
  const value = new Date(date).getTime();
  if (Number.isNaN(value)) return null;
  return Math.floor((Date.now() - value) / 86400000);
};

const InsightCard = ({ icon: Icon, label, value, helper, tone = "gold" }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div className={`rounded-2xl p-3 ${tone === "dark" ? "bg-ink text-cream" : "bg-gold/15 text-copper"}`}>
        <Icon size={20} />
      </div>
      {helper && <Badge tone={tone === "dark" ? "dark" : "success"}>{helper}</Badge>}
    </div>
    <p className="mt-5 text-sm font-bold text-elegant">{label}</p>
    <strong className="mt-1 block text-3xl font-black dark:text-cream">{value}</strong>
  </Card>
);

export const CRMPage = () => {
  const { user } = useAuth();
  const { data: customers, loading, error, setData, refetch } = useApiResource("/customers?limit=100");
  const { data: orders } = useApiResource("/orders");
  const { data: reservations } = useApiResource("/reservations?limit=100");
  const { data: customerManagement } = useApiResource("/settings/customer-management");
  const { data: establishments } = useApiResource(user?.roleName === "SUPER_ADMIN" ? "/establishments?limit=100" : null);
  const [selectedId, setSelectedId] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyCustomer);
  const canManageCustomers = (customerManagement.roles || ["SUPER_ADMIN", "MANAGER"]).includes(user?.roleName);
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const establishmentOptions = establishments.map((item) => ({ value: item.id, label: item.name }));

  const customerStats = useMemo(() => orders.reduce((acc, order) => {
    if (!order.customerId) return acc;
    const current = acc[order.customerId] || { visits: 0, reservations: 0, total: 0 };
    current.visits += 1;
    current.total += Number(order.total || 0);
    const orderDate = order.createdAt || order.updatedAt;
    if (orderDate && (!current.lastOrder || new Date(orderDate) > new Date(current.lastOrder))) {
      current.lastOrder = orderDate;
    }
    acc[order.customerId] = current;
    return acc;
  }, {}), [orders]);

  const reservationStats = useMemo(() => reservations.reduce((acc, reservation) => {
    const key = reservation.customerId || `phone:${reservation.phone || reservation.customerName}`;
    const current = acc[key] || { reservations: 0 };
    current.reservations += 1;
    current.lastReservation = reservation.reservationDate;
    current.name = reservation.customer?.name || reservation.customerName || current.name;
    current.phone = reservation.customer?.phone || reservation.phone || current.phone;
    acc[key] = current;
    return acc;
  }, {}), [reservations]);

  const rows = useMemo(() => {
    const customerRows = customers.map((customer) => {
    const stats = customerStats[customer.id] || { visits: 0, reservations: 0, total: 0 };
    const reservationInfo = reservationStats[customer.id] || (customer.phone ? reservationStats[`phone:${customer.phone}`] : null) || { reservations: 0 };
    const level = customerLevel(stats.total);
    return {
      ...customer,
      visits: stats.visits + Number(reservationInfo.reservations || 0),
      ordersCount: stats.visits,
      reservationsCount: Number(reservationInfo.reservations || 0),
      total: stats.total,
      points: Number(customer.loyaltyPoints || Math.floor(stats.total / 10)),
      establishmentName: customer.establishment?.name || `Entite #${customer.establishmentId || "-"}`,
      level,
      source: reservationInfo.reservations ? "Client + reservation" : "Client",
      lastActivity: stats.lastOrder || reservationInfo.lastReservation || customer.updatedAt || customer.createdAt,
      tags: [level, customer.status || "normal", reservationInfo.reservations ? "reservation" : null].filter(Boolean)
    };
  });

    const existingPhones = new Set(customers.map((customer) => customer.phone).filter(Boolean));
    const reservationOnlyRows = Object.entries(reservationStats)
      .filter(([key]) => key.startsWith("phone:") && !existingPhones.has(key.replace("phone:", "")))
      .map(([key, info]) => ({
        id: key,
        name: info.name || "Client reservation",
        phone: info.phone || "-",
        email: "",
        address: "",
        visits: info.reservations,
        ordersCount: 0,
        reservationsCount: info.reservations,
        total: 0,
        points: 0,
        establishmentName: info.establishment?.name || "-",
        level: "Nouveau",
        source: "Reservation",
        lastActivity: info.lastReservation,
        virtual: true,
        tags: ["Nouveau", "reservation"]
      }));

    return [...customerRows, ...reservationOnlyRows];
  }, [customers, customerStats, reservationStats]);

  const crmBI = useMemo(() => {
    const totalRevenue = rows.reduce((sum, customer) => sum + Number(customer.total || 0), 0);
    const totalOrders = rows.reduce((sum, customer) => sum + Number(customer.ordersCount || 0), 0);
    const totalReservations = rows.reduce((sum, customer) => sum + Number(customer.reservationsCount || 0), 0);
    const activeCustomers = rows.filter((customer) => daysSince(customer.lastActivity) !== null && daysSince(customer.lastActivity) <= 30).length;
    const dormantCustomers = rows.filter((customer) => {
      const age = daysSince(customer.lastActivity);
      return age === null || age > 45;
    });
    const vipCustomers = rows.filter((customer) => customer.level === "VIP");
    const loyalCustomers = rows.filter((customer) => customer.level === "Fidele");
    const topCustomers = [...rows].sort((a, b) => Number(b.total || 0) - Number(a.total || 0)).slice(0, 5);
    const reservationLeads = rows.filter((customer) => customer.reservationsCount > 0 && customer.ordersCount === 0);
    const segmentData = [
      { name: "VIP", value: vipCustomers.length, color: "#C8A96A" },
      { name: "Fidele", value: loyalCustomers.length, color: "#B87333" },
      { name: "Nouveau", value: rows.filter((customer) => customer.level === "Nouveau").length, color: "#0B0B0F" }
    ];
    const sourceData = [
      { name: "Commandes", value: totalOrders },
      { name: "Reservations", value: totalReservations },
      { name: "Fiches", value: rows.filter((customer) => customer.source === "Client").length }
    ];

    return {
      totalRevenue,
      totalOrders,
      totalReservations,
      activeCustomers,
      dormantCustomers,
      vipCustomers,
      loyalCustomers,
      topCustomers,
      reservationLeads,
      avgBasket: totalOrders ? totalRevenue / totalOrders : 0,
      conversionRate: rows.length ? Math.round((activeCustomers / rows.length) * 100) : 0,
      segmentData,
      sourceData
    };
  }, [rows]);

  const selected = rows.find((customer) => customer.id === selectedId) || rows[0];
  const openWhatsAppCampaign = (target = selected, messageType = "default") => {
    if (!target?.phone || target.phone === "-") {
      toast.error("Telephone client manquant.");
      return;
    }
    const cleanPhone = target.phone.replace(/[^\d+]/g, "");
    const message = messageType === "dormant"
      ? `Bonjour ${target.name}, Maison Cafe vous invite a revenir profiter de nos nouveaux menus.`
      : `Bonjour ${target.name}, merci pour votre fidelite chez Maison Cafe. Nous avons une offre speciale pour vous.`;
    window.open(`https://wa.me/${cleanPhone.replace("+", "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const createCustomer = async (event) => {
    event.preventDefault();
    if (!canManageCustomers) {
      toast.error("Votre role ne permet pas d'ajouter des clients.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      const targetEstablishmentId = Number(isSuperAdmin ? form.establishmentId : user?.establishmentId);
      if (!targetEstablishmentId) {
        toast.error("Selectionnez l'entite du client.");
        return;
      }
      const { data } = await api.post("/customers", {
        establishmentId: targetEstablishmentId,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        loyaltyPoints: 0,
        status: "normal"
      });
      setData((current) => [data.data, ...current]);
      setSelectedId(data.data.id);
      setForm({ ...emptyCustomer, establishmentId: isSuperAdmin ? form.establishmentId : "" });
      setCustomerOpen(false);
      toast.success("Client ajoute.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible d'ajouter le client.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async () => {
    if (!selected || selected.virtual) {
      toast.error("Cette fiche vient d'une reservation ancienne non liee. Modifiez ou supprimez la reservation.");
      return;
    }
    if (!canManageCustomers) {
      toast.error("Votre role ne permet pas de supprimer les clients.");
      return;
    }
    if (!window.confirm(`Supprimer le client ${selected.name} ? Les commandes et reservations restent conservees.`)) return;

    try {
      await api.delete(`/customers/${selected.id}`);
      setData((current) => current.filter((customer) => customer.id !== selected.id));
      setSelectedId(null);
      toast.success("Client supprime.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible de supprimer le client.");
    }
  };

  const columns = [
    { header: "Client", accessorKey: "name", cell: ({ row }) => <strong className="dark:text-cream">{row.original.name}</strong> },
    ...(isSuperAdmin ? [{ header: "Entite", accessorKey: "establishmentName", cell: ({ row }) => <div className="flex items-center gap-2"><Building2 size={16} className="text-copper" /><span className="font-semibold">{row.original.establishmentName}</span></div> }] : []),
    { header: "Telephone", accessorKey: "phone", cell: ({ row }) => row.original.phone || "-" },
    { header: "Source", accessorKey: "source" },
    { header: "Niveau", accessorKey: "level", cell: ({ row }) => <Badge tone={row.original.level === "VIP" ? "gold" : "success"}>{row.original.level}</Badge> },
    { header: "Points", accessorKey: "points" },
    { header: "Visites", accessorKey: "visits" },
    { header: "Total", accessorKey: "total", cell: ({ row }) => formatMoney(row.original.total) }
  ];

  const openCustomerForm = () => {
    setForm((current) => ({
      ...current,
      establishmentId: isSuperAdmin ? String(current.establishmentId || establishmentOptions[0]?.value || "") : ""
    }));
    setCustomerOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client 360"
        title="CRM et fidelite"
        description="Fiche client, historique commandes/reservations, points, tags, preferences et campagnes WhatsApp."
        actions={<Button icon={UserRoundPlus} disabled={!canManageCustomers} onClick={openCustomerForm}>Client</Button>}
      />

      {error && (
        <Card className="flex flex-col gap-3 border-danger/20 bg-danger/5 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-black text-danger">Clients indisponibles</h3>
            <p className="mt-1 text-sm font-semibold text-elegant">{error.response?.data?.message || "Impossible de charger les clients."}</p>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Reessayer</Button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard icon={TrendingUp} label="Chiffre client cumule" value={formatMoney(crmBI.totalRevenue)} helper={`${crmBI.totalOrders} commandes`} />
        <InsightCard icon={Users} label="Clients actifs 30j" value={crmBI.activeCustomers} helper={`${crmBI.conversionRate}% base`} />
        <InsightCard icon={Crown} label="VIP / fideles" value={`${crmBI.vipCustomers.length} / ${crmBI.loyalCustomers.length}`} helper="segments" />
        <InsightCard icon={MessageCircle} label="Clients a relancer" value={crmBI.dormantCustomers.length} helper="WhatsApp" tone="dark" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-copper">Segmentation</p>
              <h2 className="text-xl font-black dark:text-cream">Valeur client</h2>
            </div>
            <BarChart3 className="text-copper" />
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={crmBI.segmentData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={4}>
                  {crmBI.segmentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {crmBI.segmentData.map((segment) => <Badge key={segment.name} tone={segment.name === "VIP" ? "gold" : "default"}>{segment.name}: {segment.value}</Badge>)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-copper">Activite</p>
            <h2 className="text-xl font-black dark:text-cream">Sources CRM</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={crmBI.sourceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#B87333" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gold/15 p-3 text-copper"><BrainCircuit /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-copper">Recommandations BI</p>
              <h2 className="text-xl font-black dark:text-cream">Actions prioritaires</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/10">
              <p className="text-sm font-black">Relancer les clients dormants</p>
              <p className="mt-1 text-sm text-elegant">{crmBI.dormantCustomers.length} clients sans activite recente. Lancez une campagne WhatsApp ciblée.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/10">
              <p className="text-sm font-black">Convertir les reservations</p>
              <p className="mt-1 text-sm text-elegant">{crmBI.reservationLeads.length} clients ont reserve sans commande liee. Offrez un avantage prochaine visite.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/10">
              <p className="text-sm font-black">Panier moyen</p>
              <p className="mt-1 text-sm text-elegant">Panier moyen client: {formatMoney(crmBI.avgBasket)}. Ciblez les fideles avec menus premium.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black dark:text-cream">Top clients</h2>
            <Sparkles className="text-copper" />
          </div>
          <div className="space-y-3">
            {crmBI.topCustomers.map((customer, index) => (
              <button key={customer.id} type="button" onClick={() => setSelectedId(customer.id)} className="flex w-full items-center justify-between rounded-2xl bg-white/80 p-4 text-left transition hover:bg-gold/10 dark:bg-white/10">
                <div>
                  <p className="font-black dark:text-cream">{index + 1}. {customer.name}</p>
                  <p className="text-sm text-elegant">{customer.ordersCount || 0} commandes - {customer.reservationsCount || 0} reservations</p>
                </div>
                <strong>{formatMoney(customer.total)}</strong>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black dark:text-cream">Campagne intelligente</h2>
            <Button size="sm" variant="secondary" icon={MessageCircle} onClick={() => crmBI.dormantCustomers[0] ? openWhatsAppCampaign(crmBI.dormantCustomers[0], "dormant") : toast.error("Aucun client dormant.")}>Relancer</Button>
          </div>
          <div className="space-y-3">
            {crmBI.dormantCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between rounded-2xl bg-white/80 p-4 dark:bg-white/10">
                <div>
                  <p className="font-black dark:text-cream">{customer.name}</p>
                  <p className="text-sm text-elegant">{daysSince(customer.lastActivity) === null ? "Aucune activite" : `${daysSince(customer.lastActivity)} jours sans activite`}</p>
                </div>
                <Button size="sm" variant="secondary" icon={MessageCircle} onClick={() => openWhatsAppCampaign(customer, "dormant")}>WhatsApp</Button>
              </div>
            ))}
            {!crmBI.dormantCustomers.length && <p className="text-sm font-semibold text-elegant">Aucun client a relancer pour le moment.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {loading && <p className="text-sm font-bold text-elegant">Chargement des clients...</p>}
          <DataTable data={rows} columns={columns} onRowClick={(customer) => setSelectedId(customer.id)} />
        </div>
        <Card className="p-5">
          {selected ? (
            <>
              <h2 className="text-2xl font-black dark:text-cream">{selected.name}</h2>
              <p className="mt-1 text-elegant">{selected.phone || "Telephone non renseigne"}</p>
              <p className="mt-1 text-sm text-elegant">{selected.email || selected.address || selected.source || "Fiche client caisse"}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Card className="p-4"><p className="text-xs text-elegant">Points</p><strong className="text-2xl">{selected.points}</strong></Card>
                <Card className="p-4"><p className="text-xs text-elegant">Depenses</p><strong className="text-2xl">{formatMoney(selected.total)}</strong></Card>
                <Card className="p-4"><p className="text-xs text-elegant">Commandes</p><strong className="text-2xl">{selected.ordersCount || 0}</strong></Card>
                <Card className="p-4"><p className="text-xs text-elegant">Reservations</p><strong className="text-2xl">{selected.reservationsCount || 0}</strong></Card>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map((tag) => <Badge key={tag}><Tag size={12} className="mr-1" />{tag}</Badge>)}</div>
              <div className="mt-5 grid gap-2">
                <Button className="w-full" icon={MessageCircle} onClick={() => toast.success("Client pret pour contact WhatsApp.")}>Campagne WhatsApp</Button>
                {canManageCustomers && <Button className="w-full" variant="danger" icon={Trash2} onClick={deleteCustomer} disabled={selected.virtual}>Supprimer client</Button>}
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-elegant">Aucun client pour le moment.</p>
          )}
        </Card>
      </div>

      <Modal open={customerOpen} onClose={() => setCustomerOpen(false)} title="Ajouter client">
        <form onSubmit={createCustomer} className="grid gap-4 md:grid-cols-2">
          {isSuperAdmin && <Select label="Entite" value={form.establishmentId} onChange={(event) => setForm((current) => ({ ...current, establishmentId: event.target.value }))} options={establishmentOptions.length ? establishmentOptions : [{ value: "", label: "Aucune entite disponible" }]} />}
          <Input label="Nom client" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <Input label="Telephone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input label="Adresse" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
          <Button className="md:col-span-2" icon={Save} loading={saving}>Enregistrer</Button>
        </form>
      </Modal>
    </div>
  );
};

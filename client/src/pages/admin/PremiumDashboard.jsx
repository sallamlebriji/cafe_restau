import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  Download, Grip, Lightbulb, PackageCheck, ReceiptText,
  RefreshCw, Star, Table2, TrendingUp, Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useApiResource } from "../../hooks/useApiResource";
import { exportElementToPdf } from "../../services/exportService";
import { formatMoney } from "../../utils/format";

const colors = ["#C8A96A", "#B87333", "#16A34A", "#F97316", "#0B0B0F"];

const emptyOverview = {
  kpis: { revenue: 0, orders: 0, activeOrders: 0, tableOccupancy: 0, activeClients: 0, averageBasket: 0, criticalStockCount: 0 },
  salesSeries: [], paymentMethods: [], channelData: [],
  employeePerformance: [], activityHeatmap: [], topProducts: [],
  criticalStocks: [], recommendations: []
};

export const PremiumDashboard = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("today");
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, refetch } = useApiResource(`/dashboard/overview?period=${period}`);
  const overview = data || emptyOverview;

  const kpis = useMemo(() => [
    { label: t("revenue") || "CA",              value: formatMoney(overview.kpis?.revenue),        delta: period === "today" ? "Aujourd'hui" : "7 jours", icon: TrendingUp, color: "bg-gold/15 text-copper" },
    { label: t("orders") || "Commandes",        value: overview.kpis?.orders || 0,                 delta: `${overview.kpis?.activeOrders || 0} en cours`,  icon: ReceiptText, color: "bg-gold/15 text-copper" },
    { label: t("table_occupancy") || "Tables",  value: `${overview.kpis?.tableOccupancy || 0}%`,   delta: "Temps réel",                                     icon: Table2, color: "bg-blue-500/15 text-blue-600" },
    { label: t("active_clients") || "Clients",  value: overview.kpis?.activeClients || 0,          delta: "Période",                                        icon: Users, color: "bg-purple-500/15 text-purple-600" },
    { label: t("average_basket") || "Panier",   value: formatMoney(overview.kpis?.averageBasket),  delta: "Moy. commandes",                                 icon: Star, color: "bg-success/15 text-success" },
    { label: t("critical_stock") || "Stock ⚠",  value: overview.kpis?.criticalStockCount || 0,     delta: "À traiter",                                      icon: PackageCheck, color: "bg-danger/15 text-danger" },
  ], [overview.kpis, period, t]);

  const refresh = async () => {
    try { await refetch(); toast.success("Dashboard actualisé."); }
    catch (e) { toast.error("Impossible de charger le dashboard."); }
  };

  const exportPdf = async () => {
    setExporting(true);
    try { await exportElementToPdf("dashboard-export", `dashboard-${period}.pdf`); }
    finally { setExporting(false); }
  };

  return (
    <div id="dashboard-export" className="space-y-5">
      <PageHeader
        eyebrow="Cockpit"
        title="Dashboard"
        description="Vue temps réel de l'activité, des performances et des indicateurs clés."
        breadcrumbs={["Admin", "Dashboard"]}
        actions={
          <>
            <Button variant="secondary" className={period === "today" ? "border-gold text-copper" : ""} onClick={() => setPeriod("today")}>Aujourd'hui</Button>
            <Button variant="secondary" className={period === "week" ? "border-gold text-copper" : ""} onClick={() => setPeriod("week")}>Semaine</Button>
            <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Actualiser</Button>
            <Button icon={Download} loading={exporting} onClick={exportPdf} className="hidden sm:inline-flex">PDF</Button>
          </>
        }
      />

      {error && (
        <Card className="border-danger/20 bg-danger/5 p-5">
          <p className="font-black text-danger">Dashboard indisponible</p>
          <Button variant="secondary" icon={RefreshCw} onClick={refresh} className="mt-3">Réessayer</Button>
        </Card>
      )}

      {loading && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />)}
        </div>
      )}

      {/* ── KPIs ── */}
      {!loading && (
        <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <Card key={kpi.label} interactive className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className={`rounded-xl p-2.5 ${kpi.color}`}>
                  <kpi.icon size={18} />
                </div>
                <Badge tone="success" className="hidden sm:flex text-[10px]">{kpi.delta}</Badge>
              </div>
              <p className="mt-3 text-xs font-semibold text-elegant truncate">{kpi.label}</p>
              <p className="mt-1 text-xl font-black text-ink dark:text-cream">{kpi.value}</p>
              <p className="mt-1 text-[10px] text-elegant sm:hidden">{kpi.delta}</p>
            </Card>
          ))}
        </section>
      )}

      {/* ── Graphes ── */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
        <Card>
          <CardHeader eyebrow="Chiffre d'affaires" title="Évolution du CA" action={<Grip className="text-elegant" size={18} />} />
          <div className="h-64 p-4 sm:h-80 sm:p-5">
            <ResponsiveContainer>
              <AreaChart data={overview.salesSeries || []}>
                <defs>
                  <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A96A" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#C8A96A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#B87333" fill="url(#goldArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Paiements" title="Méthodes" />
          <div className="h-64 p-4 sm:h-80 sm:p-5">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={overview.paymentMethods || []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {(overview.paymentMethods || []).map((e, i) => <Cell key={e.name} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader eyebrow="Canaux" title="Ventes par canal" />
          <div className="h-56 p-4 sm:h-64 sm:p-5">
            <ResponsiveContainer>
              <BarChart data={overview.salesSeries || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="table"    stackId="a" fill="#0B0B0F" radius={[8, 8, 0, 0]} />
                <Bar dataKey="delivery" stackId="a" fill="#B87333" />
                <Bar dataKey="counter"  stackId="a" fill="#C8A96A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Équipe" title="Performance" />
          <div className="h-56 p-4 sm:h-64 sm:p-5">
            {(overview.employeePerformance || []).length ? (
              <ResponsiveContainer>
                <RadarChart data={overview.employeePerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar dataKey="commandes" stroke="#B87333" fill="#C8A96A" fillOpacity={0.35} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : <p className="p-5 text-sm font-semibold text-elegant">Aucune donnée équipe.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Activité" title="Heatmap horaire" />
          <div className="grid grid-cols-2 gap-2 p-4 sm:p-5">
            {(overview.activityHeatmap || []).slice(0, 12).map(([hour, value]) => (
              <div key={hour} className="rounded-xl p-2.5 text-xs font-bold" style={{ background: `rgba(200,169,106,${0.12 + Math.min(value, 20) / 30})` }}>
                <span className="float-left">{hour}</span>
                <span className="float-right">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Recommandations ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(overview.recommendations || []).length ? (
          overview.recommendations.map(([title, body, hint, tone]) => (
            <Card key={title} className="p-5">
              <Lightbulb className="text-copper" />
              <h3 className="mt-3 font-black text-ink dark:text-cream">{title}</h3>
              <p className="mt-2 text-sm font-semibold text-elegant">{body}</p>
              <Badge tone={tone} className="mt-3">{hint}</Badge>
            </Card>
          ))
        ) : (
          <Card className="p-5 sm:col-span-2 lg:col-span-3">
            <Lightbulb className="text-copper" />
            <h3 className="mt-3 font-black text-ink dark:text-cream">Recommandations</h3>
            <p className="mt-2 text-sm font-semibold text-elegant">Les recommandations apparaissent après les premières commandes, paiements et mouvements de stock.</p>
          </Card>
        )}
      </section>
    </div>
  );
};

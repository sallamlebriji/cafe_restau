import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Grip, Lightbulb, PackageCheck, ReceiptText, RefreshCw, Star, Table2, TrendingUp, Users } from "lucide-react";
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
  kpis: {
    revenue: 0,
    orders: 0,
    activeOrders: 0,
    tableOccupancy: 0,
    activeClients: 0,
    averageBasket: 0,
    criticalStockCount: 0
  },
  salesSeries: [],
  paymentMethods: [],
  channelData: [],
  employeePerformance: [],
  activityHeatmap: [],
  topProducts: [],
  criticalStocks: [],
  recommendations: []
};

export const PremiumDashboard = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("today");
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, refetch } = useApiResource(`/dashboard/overview?period=${period}`);
  const overview = data || emptyOverview;
  const kpis = useMemo(() => [
    { label: t("revenue_short"), value: formatMoney(overview.kpis?.revenue), delta: period === "today" ? t("today") : t("seven_days"), icon: TrendingUp },
    { label: t("orders"), value: overview.kpis?.orders || 0, delta: t("orders_in_progress", { count: overview.kpis?.activeOrders || 0 }), icon: ReceiptText },
    { label: t("table_occupancy"), value: `${overview.kpis?.tableOccupancy || 0}%`, delta: t("realtime_badge"), icon: Table2 },
    { label: t("active_clients"), value: overview.kpis?.activeClients || 0, delta: t("period_badge"), icon: Users },
    { label: t("average_basket"), value: formatMoney(overview.kpis?.averageBasket), delta: t("payments_badge"), icon: Star },
    { label: t("critical_stock"), value: overview.kpis?.criticalStockCount || 0, delta: t("todo_badge"), icon: PackageCheck }
  ], [overview.kpis, period, t]);

  const refresh = async () => {
    try {
      await refetch();
      toast.success(t("dashboard_refreshed"));
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || t("cannot_load_dashboard"));
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportElementToPdf("dashboard-export", `dashboard-${period}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="dashboard-export" className="space-y-6">
      <PageHeader
        eyebrow={t("executive_cockpit")}
        title={t("premium_dashboard")}
        description={t("premium_dashboard_desc")}
        actions={<><Button variant="secondary" className={period === "today" ? "border-gold text-copper" : ""} onClick={() => setPeriod("today")}>{t("today")}</Button><Button variant="secondary" className={period === "week" ? "border-gold text-copper" : ""} onClick={() => setPeriod("week")}>{t("week")}</Button><Button variant="secondary" icon={RefreshCw} onClick={refresh}>{t("refresh")}</Button><Button icon={Download} loading={exporting} onClick={exportPdf}>{t("pdf_export")}</Button></>}
        breadcrumbs={["Admin", "Dashboard"]}
      />

      {error && (
        <Card className="flex flex-col gap-3 border-danger/20 bg-danger/5 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-black text-danger">{t("dashboard_unavailable")}</h3>
            <p className="mt-1 text-sm font-semibold text-elegant">{error.response?.data?.message || t("cannot_load_dashboard")}</p>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={refresh}>{t("retry")}</Button>
        </Card>
      )}

      {loading && <Card className="p-5 text-sm font-bold text-elegant">{t("loading_dashboard")}</Card>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} interactive className="p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-gold/15 p-3 text-copper"><kpi.icon size={20} /></div>
              <Badge tone="success">{kpi.delta}</Badge>
            </div>
            <p className="mt-5 text-sm font-semibold text-elegant">{kpi.label}</p>
            <p className="mt-1 text-2xl font-black text-ink dark:text-cream">{kpi.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader eyebrow={t("revenue_section")} title={t("revenue_evolution_title")} action={<Grip className="text-elegant" size={18} />} />
          <div className="h-80 p-5">
            <ResponsiveContainer>
              <AreaChart data={overview.salesSeries || []}>
                <defs><linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8A96A" stopOpacity={0.55} /><stop offset="95%" stopColor="#C8A96A" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#B87333" fill="url(#goldArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow={t("payment_section")} title={t("payment_methods_title")} />
          <div className="h-80 p-5">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={overview.paymentMethods || []} dataKey="value" nameKey="name" innerRadius={70} outerRadius={112} paddingAngle={4}>
                  {(overview.paymentMethods || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader eyebrow={t("channel_section")} title={t("sales_by_channel_title")} />
          <div className="h-72 p-5">
            <ResponsiveContainer>
              <BarChart data={overview.salesSeries || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="table" stackId="a" fill="#0B0B0F" radius={[8, 8, 0, 0]} />
                <Bar dataKey="delivery" stackId="a" fill="#B87333" />
                <Bar dataKey="counter" stackId="a" fill="#C8A96A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow={t("team_section")} title={t("employee_performance_title")} />
          <div className="h-72 p-5">
            {(overview.employeePerformance || []).length ? (
              <ResponsiveContainer>
                <RadarChart data={overview.employeePerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar dataKey="commandes" stroke="#B87333" fill="#C8A96A" fillOpacity={0.35} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : <p className="p-5 text-sm font-semibold text-elegant">{t("no_employee_perf")}</p>}
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow={t("activity_section")} title={t("hourly_heatmap_title")} />
          <div className="grid grid-cols-2 gap-2 p-5">
            {(overview.activityHeatmap || []).map(([hour, value]) => (
              <div key={hour} className="rounded-2xl p-3 text-sm font-bold" style={{ background: `rgba(200,169,106,${0.12 + Math.min(value, 20) / 30})` }}>
                <span>{hour}</span>
                <span className="float-right">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {(overview.recommendations || []).length ? overview.recommendations.map(([title, body, hint, tone]) => (
          <Card key={title} className="p-5">
            <Lightbulb className="text-copper" />
            <h3 className="mt-4 font-black text-ink dark:text-cream">{title}</h3>
            <p className="mt-2 text-sm font-semibold text-elegant">{body}</p>
            <Badge tone={tone} className="mt-4">{hint}</Badge>
          </Card>
        )) : (
          <Card className="p-5 lg:col-span-3">
            <Lightbulb className="text-copper" />
            <h3 className="mt-4 font-black text-ink dark:text-cream">{t("recommendations_title")}</h3>
            <p className="mt-2 text-sm font-semibold text-elegant">{t("recommendations_hint")}</p>
          </Card>
        )}
      </section>
    </div>
  );
};

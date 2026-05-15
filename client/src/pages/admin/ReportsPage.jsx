import { Download, Printer, RefreshCw } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { useApiResource } from "../../hooks/useApiResource";
import { exportElementToPdf, exportRowsToCsv } from "../../services/exportService";
import { formatMoney } from "../../utils/format";

export const ReportsPage = () => {
  const [period, setPeriod] = useState("week");
  const { data: overview, loading, error, refetch } = useApiResource(`/dashboard/overview?period=${period}`);
  const salesSeries = overview?.salesSeries || [];
  const topProducts = overview?.topProducts || [];
  const criticalStocks = overview?.criticalStocks || [];

  const exportCsv = () => {
    exportRowsToCsv([
      ["date", "revenue", "table", "delivery", "counter"],
      ...salesSeries.map((row) => [row.date, row.revenue, row.table, row.delivery, row.counter])
    ], `rapport-${period}.csv`);
    toast.success("Rapport CSV exporte.");
  };

  return (
    <div id="reports-export" className="space-y-6">
      <PageHeader
        eyebrow="Business intelligence"
        title="Rapports avances"
        description="Ventes, commandes, canaux, produits, paiements, stock critique et recommandations."
        actions={<><Button variant="secondary" icon={Printer} onClick={() => exportElementToPdf("reports-export", `rapport-${period}.pdf`)}>Imprimer</Button><Button icon={Download} onClick={exportCsv}>Exporter</Button></>}
      />
      <Card className="grid gap-4 p-4 md:grid-cols-[220px_1fr_180px]">
        <Select label="Periode" value={period} onChange={(event) => setPeriod(event.target.value)} options={[{ value: "today", label: "Aujourd'hui" }, { value: "week", label: "Semaine" }]} />
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="p-4"><p className="text-xs text-elegant">CA</p><strong>{formatMoney(overview?.kpis?.revenue || 0)}</strong></Card>
          <Card className="p-4"><p className="text-xs text-elegant">Commandes</p><strong>{overview?.kpis?.orders || 0}</strong></Card>
          <Card className="p-4"><p className="text-xs text-elegant">Panier moyen</p><strong>{formatMoney(overview?.kpis?.averageBasket || 0)}</strong></Card>
          <Card className="p-4"><p className="text-xs text-elegant">Stock critique</p><strong>{overview?.kpis?.criticalStockCount || 0}</strong></Card>
        </div>
        <Button className="self-end" variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Appliquer</Button>
      </Card>

      {error && <Card className="p-4 text-sm font-bold text-danger">Rapports indisponibles: {error.response?.data?.message || "Erreur API"}</Card>}
      {loading && <Card className="p-4 text-sm font-bold text-elegant">Chargement des rapports...</Card>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader title="Ventes par periode" /><div className="h-80 p-5"><ResponsiveContainer><AreaChart data={salesSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => formatMoney(value)} /><Area dataKey="revenue" stroke="#B87333" fill="#C8A96A55" /></AreaChart></ResponsiveContainer></div></Card>
        <Card><CardHeader title="Commandes par canal" /><div className="h-80 p-5"><ResponsiveContainer><BarChart data={salesSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="table" stackId="a" fill="#0B0B0F" radius={[8, 8, 0, 0]} /><Bar dataKey="delivery" stackId="a" fill="#B87333" /><Bar dataKey="counter" stackId="a" fill="#C8A96A" /></BarChart></ResponsiveContainer></div></Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-black dark:text-cream">Produits les plus vendus</h3>
          <div className="mt-4 space-y-3">{topProducts.length ? topProducts.map((item) => <div key={item.name} className="flex justify-between rounded-2xl bg-black/[0.03] p-3 text-sm font-bold dark:bg-white/5"><span>{item.name}</span><span>{item.quantity}</span></div>) : <p className="text-sm text-elegant">Aucune vente.</p>}</div>
        </Card>
        <Card className="p-5">
          <h3 className="font-black dark:text-cream">Paiements</h3>
          <div className="mt-4 space-y-3">{(overview?.paymentMethods || []).map((item) => <div key={item.name} className="flex justify-between rounded-2xl bg-black/[0.03] p-3 text-sm font-bold dark:bg-white/5"><span>{item.name}</span><span>{formatMoney(item.value)}</span></div>)}</div>
        </Card>
        <Card className="p-5">
          <h3 className="font-black dark:text-cream">Stock faible</h3>
          <div className="mt-4 space-y-3">{criticalStocks.length ? criticalStocks.map((item) => <div key={item.id} className="flex justify-between rounded-2xl bg-black/[0.03] p-3 text-sm font-bold dark:bg-white/5"><span>{item.name}</span><span>{item.quantity} {item.unit}</span></div>) : <p className="text-sm text-elegant">Aucune alerte stock.</p>}</div>
        </Card>
      </section>
    </div>
  );
};

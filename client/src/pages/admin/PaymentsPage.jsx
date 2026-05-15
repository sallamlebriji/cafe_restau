import { Building2, Download, FileText, Printer, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { exportElementToPdf } from "../../services/exportService";
import { formatMoney } from "../../utils/format";

const methodLabels = {
  CASH: "Especes",
  CARD: "Carte",
  MIXED: "Mixte",
  CREDIT: "Credit"
};

const formatPaymentDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

export const PaymentsPage = () => {
  const { user } = useAuth();
  const { data: payments, loading, error, refetch } = useApiResource("/payments");
  const [selectedId, setSelectedId] = useState(null);
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const rows = useMemo(() => payments.map((payment) => {
    const order = payment.order || {};
    const customer = order.customer?.name || "Client comptoir";
    return {
      id: payment.id,
      invoice: `FAC-${new Date(payment.paidAt || payment.createdAt || Date.now()).getFullYear()}-${String(payment.id).padStart(4, "0")}`,
      orderCode: order.code || `CMD-${payment.orderId}`,
      table: order.table?.number || (order.source === "DELIVERY" ? "Livraison" : "Comptoir"),
      customer,
      method: payment.method,
      methodLabel: methodLabels[payment.method] || payment.method,
      amount: Number(payment.amount || 0),
      establishmentName: payment.establishment?.name || order.establishment?.name || `Entite #${payment.establishmentId || order.establishmentId || "-"}`,
      paidAt: payment.paidAt || payment.createdAt,
      reference: payment.reference || "",
      status: order.status === "PAID" ? "PAID" : "CREDIT"
    };
  }), [payments]);

  const selected = rows.find((payment) => payment.id === selectedId) || rows[0];
  const totalPaid = rows.reduce((sum, payment) => sum + payment.amount, 0);
  const cashTotal = rows.filter((payment) => payment.method === "CASH").reduce((sum, payment) => sum + payment.amount, 0);
  const cardTotal = rows.filter((payment) => payment.method === "CARD").reduce((sum, payment) => sum + payment.amount, 0);

  const printInvoice = () => {
    window.print();
    toast.success("Facture envoyee a l'impression.");
  };

  const columns = [
    { header: "Facture", accessorKey: "invoice", cell: ({ row }) => <strong className="dark:text-cream">{row.original.invoice}</strong> },
    ...(isSuperAdmin ? [{ header: "Entite", accessorKey: "establishmentName", cell: ({ row }) => <div className="flex items-center gap-2"><Building2 size={16} className="text-copper" /><span className="font-semibold">{row.original.establishmentName}</span></div> }] : []),
    { header: "Commande", accessorKey: "orderCode" },
    { header: "Client", accessorKey: "customer" },
    { header: "Mode", accessorKey: "methodLabel" },
    { header: "Date", accessorKey: "paidAt", cell: ({ row }) => formatPaymentDate(row.original.paidAt) },
    { header: "Montant", accessorKey: "amount", cell: ({ row }) => formatMoney(row.original.amount) },
    { header: "Statut", accessorKey: "status", cell: ({ row }) => <Badge tone={row.original.status === "PAID" ? "success" : "warning"}>{row.original.status}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cash control"
        title="Paiements et factures"
        description="Encaissements, credits, recus imprimables, PDF facture et historique caisse."
        actions={<><Button variant="secondary" icon={Printer} onClick={printInvoice}>Imprimer</Button><Button icon={Download} onClick={() => exportElementToPdf("invoice-demo", "facture.pdf")}>PDF</Button></>}
      />

      {error && (
        <Card className="flex flex-col gap-3 border-danger/20 bg-danger/5 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-black text-danger">Paiements indisponibles</h3>
            <p className="mt-1 text-sm font-semibold text-elegant">{error.response?.data?.message || "Impossible de charger les paiements."}</p>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Reessayer</Button>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Total encaisse</p>
          <h3 className="mt-2 text-2xl font-black dark:text-cream">{formatMoney(totalPaid)}</h3>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Especes</p>
          <h3 className="mt-2 text-2xl font-black dark:text-cream">{formatMoney(cashTotal)}</h3>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-elegant">Carte</p>
          <h3 className="mt-2 text-2xl font-black dark:text-cream">{formatMoney(cardTotal)}</h3>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {loading && <p className="text-sm font-bold text-elegant">Chargement des paiements...</p>}
          <DataTable data={rows} columns={columns} onRowClick={(payment) => setSelectedId(payment.id)} />
        </div>
        <Card className="p-5" id="invoice-demo">
          {selected ? (
            <>
              <FileText className="text-copper" />
              <h2 className="mt-4 text-2xl font-black dark:text-cream">{selected.invoice}</h2>
              <p className="mt-1 text-elegant">Maison Cafe - Casablanca</p>
              {isSuperAdmin && <p className="mt-1 flex items-center gap-2 text-sm font-bold text-copper"><Building2 size={16} />{selected.establishmentName}</p>}
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5"><span>Commande</span><strong>{selected.orderCode}</strong></div>
                <div className="flex justify-between rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5"><span>Client</span><strong>{selected.customer}</strong></div>
                <div className="flex justify-between rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5"><span>Mode</span><strong>{selected.methodLabel}</strong></div>
                <div className="flex justify-between rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5"><span>Date</span><strong>{formatPaymentDate(selected.paidAt)}</strong></div>
              </div>
              <div className="mt-5 flex justify-between border-t pt-4 text-xl font-black"><span>Total</span><span>{formatMoney(selected.amount)}</span></div>
            </>
          ) : (
            <p className="text-sm font-semibold text-elegant">Aucun paiement encaisse pour le moment.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

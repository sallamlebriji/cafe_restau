import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { api } from "../../services/api";
import { formatMoney } from "../../utils/format";

const steps = [
  { label: "Confirmee", statuses: ["NEW", "CONFIRMED"] },
  { label: "Preparation", statuses: ["PREPARING"] },
  { label: "Prete", statuses: ["READY"] },
  { label: "Servie", statuses: ["SERVED", "PAID"] }
];

const progressIndex = (status) => {
  const index = steps.findIndex((step) => step.statuses.includes(status));
  return index === -1 ? 0 : index;
};

export const PublicTrackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || localStorage.getItem("lastOrderCode") || "";
  const [code, setCode] = useState(initialCode);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeStep = useMemo(() => progressIndex(order?.status), [order]);

  const trackOrder = async (nextCode = code) => {
    if (!nextCode.trim()) {
      toast.error("Entrez le code de commande.");
      return;
    }

    setLoading(true);
    try {
      const normalizedCode = nextCode.trim().toUpperCase();
      const { data } = await api.get(`/public/orders/${encodeURIComponent(normalizedCode)}`);
      setOrder(data.data);
      setCode(normalizedCode);
      localStorage.setItem("lastOrderCode", normalizedCode);
      setSearchParams({ code: normalizedCode });
    } catch (error) {
      setOrder(null);
      toast.error(error.response?.data?.message || "Commande introuvable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) trackOrder(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-6">
        <h1 className="text-4xl font-black">Suivi commande</h1>
        {order?.code && (
          <div className="mt-4 rounded-2xl bg-gold/15 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-copper">Votre code de suivi</p>
            <p className="mt-1 text-3xl font-black text-ink">{order.code}</p>
          </div>
        )}
        <form onSubmit={(event) => { event.preventDefault(); trackOrder(); }} className="mt-6 flex gap-2">
          <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="ORD-..." />
          <Button icon={Search} disabled={loading}>{loading ? "Recherche..." : "Suivre"}</Button>
        </form>
        <div className="mt-6 grid gap-2 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.label} className={`rounded-2xl p-4 text-center font-black ${index <= activeStep ? "bg-gold text-ink" : "bg-white text-elegant"}`}>
              {step.label}
            </div>
          ))}
        </div>
        {order && (
          <div className="mt-6 rounded-2xl bg-white/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-elegant">Table</p>
                <p className="font-black">{order.table?.number || "Client"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-elegant">Total</p>
                <p className="font-black">{formatMoney(order.total)}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="rounded-xl bg-black/[0.03] p-3 text-sm font-semibold">
                  {item.quantity}x {item.product?.name || item.productName || "Produit"}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </main>
  );
};

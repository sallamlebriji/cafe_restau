import { Check, ChefHat, Clock, CreditCard, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import { formatMoney } from "../../utils/format";

const steps = [
  { label: "Confirmée",    statuses: ["NEW", "CONFIRMED"],   icon: Check,     color: "bg-green-500" },
  { label: "Préparation",  statuses: ["PREPARING"],          icon: ChefHat,   color: "bg-amber-500" },
  { label: "Prête",        statuses: ["READY"],              icon: Clock,     color: "bg-blue-500" },
  { label: "Servie",       statuses: ["SERVED", "PAID"],     icon: CreditCard, color: "bg-[#1A1A1A]" },
];
const progressIndex = (status) => {
  const i = steps.findIndex((s) => s.statuses.includes(status));
  return i === -1 ? 0 : i;
};

export const PublicTrackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || localStorage.getItem("lastOrderCode") || "";
  const [code, setCode] = useState(initialCode);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const activeStep = useMemo(() => progressIndex(order?.status), [order]);

  const trackOrder = async (nextCode = code) => {
    if (!nextCode.trim()) return toast.error("Entrez le code de commande.");
    setLoading(true);
    try {
      const normalized = nextCode.trim().toUpperCase();
      const { data } = await api.get(`/public/orders/${encodeURIComponent(normalized)}`);
      setOrder(data.data);
      setCode(normalized);
      localStorage.setItem("lastOrderCode", normalized);
      setSearchParams({ code: normalized });
    } catch (err) {
      setOrder(null);
      toast.error(err.response?.data?.message || "Commande introuvable.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (initialCode) trackOrder(initialCode); }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-black uppercase tracking-widest text-[#C8A96A]">Suivi en temps réel</p>
      <h1 className="mt-2 text-3xl font-black text-[#1A1A1A] sm:text-4xl">Votre commande</h1>

      {/* Barre de recherche */}
      <form
        onSubmit={(e) => { e.preventDefault(); trackOrder(); }}
        className="mt-6 flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ORD-XXXX"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 text-sm font-bold text-white transition hover:bg-black/80 disabled:opacity-60"
        >
          {loading ? "..." : "Suivre"}
        </button>
      </form>

      {order && (
        <div className="mt-6 space-y-4">
          {/* Code */}
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-[#9B9B9B]">Code de commande</p>
            <p className="mt-1 text-3xl font-black text-[#1A1A1A]">{order.code}</p>
          </div>

          {/* Stepper */}
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-black text-[#1A1A1A]">Progression</p>
            <div className="relative">
              {/* Ligne de fond */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-black/8" />
              {/* Ligne colorée */}
              <div
                className="absolute top-5 left-5 h-0.5 bg-[#C8A96A] transition-all duration-700"
                style={{ width: `${(activeStep / (steps.length - 1)) * (100 - (100 / steps.length))}%` }}
              />
              <div className="relative flex justify-between">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  const done = i <= activeStep;
                  return (
                    <div key={step.label} className="flex flex-col items-center gap-2">
                      <div className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-all ${
                        done
                          ? "border-[#C8A96A] bg-[#C8A96A] text-[#1A1A1A] scale-110"
                          : "border-black/10 bg-white text-[#C8C8C8]"
                      }`}>
                        <Icon size={16} />
                      </div>
                      <p className={`text-[11px] font-bold text-center ${done ? "text-[#1A1A1A]" : "text-[#9B9B9B]"}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-[#9B9B9B] font-semibold">Table</p>
                <p className="font-black text-[#1A1A1A]">{order.table?.number || "Client"}</p>
              </div>
              <div className="text-right">
                <p className="text-[#9B9B9B] font-semibold">Total</p>
                <p className="font-black text-[#1A1A1A]">{formatMoney(order.total)}</p>
              </div>
            </div>
            {order.items?.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#1A1A1A]">{item.quantity}× {item.product?.name || item.productName || "Produit"}</span>
                    <span className="text-[#6B6B6B]">{formatMoney((item.unitPrice || 0) * (item.quantity || 1))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

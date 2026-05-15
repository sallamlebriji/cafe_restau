import { AlertTriangle, Boxes, Building2, ClipboardList, PackagePlus, Plus, RefreshCw, Save, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";
import { formatMoney } from "../../utils/format";

const statusTone = (status) => status === "OUT" ? "danger" : status === "LOW" ? "warning" : "success";
const movementLabels = { IN: "Entree", OUT: "Sortie", ADJUST: "Ajustement" };

const getStatus = (item) => {
  const quantity = Number(item.quantity || 0);
  const threshold = Number(item.alertThreshold || 0);
  if (quantity <= 0) return "OUT";
  if (quantity <= threshold) return "LOW";
  return "NORMAL";
};

const buildTrend = (item) => {
  const movements = [...(item.movements || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const values = movements.map((movement) => Number(movement.afterQuantity ?? movement.quantity)).filter(Number.isFinite).slice(-6);
  if (values.length) return values.map((value, index) => ({ index, value }));
  const quantity = Number(item.quantity || 0);
  const threshold = Number(item.alertThreshold || 0);
  return [quantity + threshold, quantity + threshold * 0.7, quantity + threshold * 0.4, quantity].map((value, index) => ({ index, value: Math.max(0, Number(value.toFixed(2))) }));
};

const normalizeStock = (item) => ({
  ...item,
  quantity: Number(item.quantity || 0),
  alertThreshold: Number(item.alertThreshold || 0),
  cost: Number(item.cost || 0),
  supplierName: item.supplierName || item.supplier || "Non defini",
  establishmentName: item.establishment?.name || `Entite #${item.establishmentId || "-"}`,
  status: getStatus(item)
});

export const StockPage = () => {
  const { user } = useAuth();
  const { data: stockData, loading, error, setData, refetch } = useApiResource("/stocks?limit=100");
  const { data: stockManagement } = useApiResource("/settings/stock-management");
  const canWrite = (stockManagement.roles || ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"]).includes(user?.roleName);
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const [movementOpen, setMovementOpen] = useState(false);
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [savingMovement, setSavingMovement] = useState(false);
  const [savingIngredient, setSavingIngredient] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [movementForm, setMovementForm] = useState({ type: "IN", quantity: "", reason: "" });
  const [ingredientForm, setIngredientForm] = useState({ name: "", supplierName: "", quantity: "", unit: "kg", alertThreshold: "", cost: "" });

  const stocks = useMemo(() => stockData.map(normalizeStock), [stockData]);
  const alerts = useMemo(() => stocks.filter((item) => item.status !== "NORMAL"), [stocks]);
  const selectedStock = useMemo(() => stocks.find((item) => item.id === Number(selectedStockId)) || stocks[0], [stocks, selectedStockId]);
  const totalValue = useMemo(() => stocks.reduce((sum, item) => sum + item.quantity * item.cost, 0), [stocks]);
  const recentMovements = useMemo(() => (
    stocks
      .flatMap((item) => (item.movements || []).map((movement) => ({ ...movement, stockName: item.name, unit: item.unit })))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8)
  ), [stocks]);

  const openMovement = (stock) => {
    setSelectedStockId(String(stock?.id || selectedStock?.id || ""));
    setMovementForm({ type: "IN", quantity: "", reason: "" });
    setMovementOpen(true);
  };

  const createMovement = async (event) => {
    event.preventDefault();
    const stockId = Number(selectedStockId || selectedStock?.id);
    if (!stockId) {
      toast.error("Selectionnez un ingredient.");
      return;
    }

    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) {
      toast.error("Saisissez une quantite superieure a 0.");
      return;
    }

    setSavingMovement(true);
    try {
      const { data } = await api.post(`/stocks/${stockId}/movements`, {
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        reason: movementForm.reason
      });
      setData((current) => current.map((item) => (item.id === stockId ? data.data.stock : item)));
      setMovementOpen(false);
      toast.success("Mouvement stock enregistre.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'enregistrer le mouvement.");
    } finally {
      setSavingMovement(false);
    }
  };

  const createIngredient = async (event) => {
    event.preventDefault();
    if (!ingredientForm.name.trim()) {
      toast.error("Le nom de l'ingredient est obligatoire.");
      return;
    }
    if (!ingredientForm.quantity || Number(ingredientForm.quantity) < 0) {
      toast.error("La quantite initiale doit etre positive.");
      return;
    }
    if (!ingredientForm.alertThreshold || Number(ingredientForm.alertThreshold) < 0) {
      toast.error("Le seuil d'alerte doit etre positif.");
      return;
    }

    setSavingIngredient(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const { data } = await api.post("/stocks", {
        establishmentId: storedUser.establishmentId || 1,
        name: ingredientForm.name.trim(),
        supplierName: ingredientForm.supplierName.trim(),
        quantity: Number(ingredientForm.quantity),
        unit: ingredientForm.unit.trim() || "unite",
        alertThreshold: Number(ingredientForm.alertThreshold),
        cost: Number(ingredientForm.cost || 0)
      });
      setData((current) => [data.data, ...current]);
      setIngredientForm({ name: "", supplierName: "", quantity: "", unit: "kg", alertThreshold: "", cost: "" });
      setIngredientOpen(false);
      toast.success("Ingredient ajoute.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'ajouter l'ingredient.");
    } finally {
      setSavingIngredient(false);
    }
  };

  const columns = [
    { header: "Ingredient", accessorKey: "name", cell: ({ row }) => <strong className="dark:text-cream">{row.original.name}</strong> },
    ...(isSuperAdmin ? [{ header: "Entite", accessorKey: "establishmentName", cell: ({ row }) => <div className="flex items-center gap-2"><Building2 size={16} className="text-copper" /><span className="font-semibold">{row.original.establishmentName}</span></div> }] : []),
    { header: "Fournisseur", accessorKey: "supplierName" },
    { header: "Quantite", accessorKey: "quantity", cell: ({ row }) => `${row.original.quantity} ${row.original.unit}` },
    { header: "Seuil", accessorKey: "alertThreshold", cell: ({ row }) => `${row.original.alertThreshold} ${row.original.unit}` },
    { header: "Cout", accessorKey: "cost", cell: ({ row }) => formatMoney(row.original.cost) },
    { header: "Valeur", accessorKey: "value", cell: ({ row }) => formatMoney(row.original.quantity * row.original.cost) },
    { header: "Statut", accessorKey: "status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> },
    { header: "Action", cell: ({ row }) => <Button size="sm" variant="secondary" icon={PackagePlus} disabled={!canWrite} onClick={() => openMovement(row.original)}>Mouvement</Button> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory intelligence"
        title="Stock avance"
        description="Ingredients, fournisseurs, mouvements, seuils, cout de revient, marge et prevision reapprovisionnement."
        actions={<><Button variant="secondary" icon={Plus} disabled={!canWrite} onClick={() => setIngredientOpen(true)}>Ajouter ingredient</Button><Button icon={PackagePlus} disabled={!canWrite || !stocks.length} onClick={() => openMovement(selectedStock)}>Mouvement stock</Button></>}
      />

      {error && (
        <Card className="flex flex-col gap-3 border-danger/20 bg-danger/5 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-black text-danger">Stocks indisponibles</h3>
            <p className="mt-1 text-sm font-semibold text-elegant">{error.response?.data?.message || "Impossible de charger les ingredients."}</p>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Reessayer</Button>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <Boxes className="text-copper" />
          <h3 className="mt-3 font-black dark:text-cream">{stocks.length} ingredients</h3>
          <p className="mt-1 text-sm text-elegant">Valeur stock: {formatMoney(totalValue)}</p>
        </Card>
        <Card className="p-5">
          <AlertTriangle className={alerts.length ? "text-warning" : "text-success"} />
          <h3 className="mt-3 font-black dark:text-cream">{alerts.length} alertes</h3>
          <p className="mt-1 text-sm text-elegant">{alerts.length ? "Articles sous seuil ou rupture" : "Stock stable pour le moment"}</p>
        </Card>
        <Card className="p-5">
          <ClipboardList className="text-copper" />
          <h3 className="mt-3 font-black dark:text-cream">{recentMovements.length} mouvements recents</h3>
          <p className="mt-1 text-sm text-elegant">Entrees, sorties et ajustements</p>
        </Card>
      </section>

      {alerts.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {alerts.map((item) => (
            <Card key={item.id} className="p-5">
              <AlertTriangle className={item.status === "OUT" ? "text-danger" : "text-warning"} />
              <h3 className="mt-3 font-black dark:text-cream">{item.name}</h3>
              <p className="mt-1 text-sm text-elegant">{item.quantity} {item.unit} restant, seuil {item.alertThreshold}</p>
              {canWrite && <Button className="mt-4" size="sm" variant="secondary" icon={PackagePlus} onClick={() => openMovement(item)}>Reapprovisionner</Button>}
            </Card>
          ))}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <div className="space-y-3">
          {loading && <p className="text-sm font-bold text-elegant">Chargement des stocks...</p>}
          <DataTable data={stocks} columns={columns} searchPlaceholder="Recherche ingredient, fournisseur..." pageSize={8} onRowDoubleClick={openMovement} />
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <TrendingDown className="text-copper" />
            <h2 className="mt-3 text-xl font-black dark:text-cream">Consommation stock</h2>
            <div className="mt-5 space-y-5">
              {stocks.map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex justify-between text-sm font-bold"><span>{item.name}</span><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>
                  <div className="h-16">
                    <ResponsiveContainer>
                      <LineChart data={buildTrend(item)}>
                        <Tooltip />
                        <Line dataKey="value" stroke="#B87333" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
              {!stocks.length && !loading && <p className="text-sm font-semibold text-elegant">Aucun ingredient en stock.</p>}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-xl font-black dark:text-cream">Derniers mouvements</h2>
            <div className="mt-4 space-y-3">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="rounded-2xl bg-black/[0.03] p-3 text-sm dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="dark:text-cream">{movement.stockName}</strong>
                    <Badge tone={movement.type === "IN" ? "success" : movement.type === "OUT" ? "warning" : "default"}>{movementLabels[movement.type] || movement.type}</Badge>
                  </div>
                  <p className="mt-1 text-elegant">{movement.quantity} {movement.unit} - {movement.reason || "Sans motif"}</p>
                </div>
              ))}
              {!recentMovements.length && <p className="text-sm font-semibold text-elegant">Aucun mouvement encore.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={movementOpen} onClose={() => setMovementOpen(false)} title="Mouvement stock">
        <form onSubmit={createMovement} className="grid gap-4 md:grid-cols-2">
          <Select label="Ingredient" value={selectedStockId} onChange={(event) => setSelectedStockId(event.target.value)} options={stocks.map((item) => ({ value: item.id, label: `${item.name} (${item.quantity} ${item.unit})` }))} />
          <Select label="Type" value={movementForm.type} onChange={(event) => setMovementForm((form) => ({ ...form, type: event.target.value }))} options={[{ value: "IN", label: "Entree stock" }, { value: "OUT", label: "Sortie stock" }, { value: "ADJUST", label: "Ajuster quantite" }]} />
          <Input label={movementForm.type === "ADJUST" ? "Nouvelle quantite" : "Quantite"} type="number" min="0" step="0.01" value={movementForm.quantity} onChange={(event) => setMovementForm((form) => ({ ...form, quantity: event.target.value }))} required />
          <Input label="Motif" value={movementForm.reason} onChange={(event) => setMovementForm((form) => ({ ...form, reason: event.target.value }))} placeholder="Achat, consommation, correction..." />
          <Button className="md:col-span-2" icon={Save} loading={savingMovement}>Enregistrer</Button>
        </form>
      </Modal>

      <Modal open={ingredientOpen} onClose={() => setIngredientOpen(false)} title="Ajouter ingredient">
        <form onSubmit={createIngredient} className="grid gap-4 md:grid-cols-2">
          <Input label="Nom ingredient" value={ingredientForm.name} onChange={(event) => setIngredientForm((form) => ({ ...form, name: event.target.value }))} required />
          <Input label="Fournisseur" value={ingredientForm.supplierName} onChange={(event) => setIngredientForm((form) => ({ ...form, supplierName: event.target.value }))} />
          <Input label="Quantite initiale" type="number" min="0" step="0.01" value={ingredientForm.quantity} onChange={(event) => setIngredientForm((form) => ({ ...form, quantity: event.target.value }))} required />
          <Input label="Unite" value={ingredientForm.unit} onChange={(event) => setIngredientForm((form) => ({ ...form, unit: event.target.value }))} required />
          <Input label="Seuil alerte" type="number" min="0" step="0.01" value={ingredientForm.alertThreshold} onChange={(event) => setIngredientForm((form) => ({ ...form, alertThreshold: event.target.value }))} required />
          <Input label="Cout unitaire" type="number" min="0" step="0.01" value={ingredientForm.cost} onChange={(event) => setIngredientForm((form) => ({ ...form, cost: event.target.value }))} />
          <Button className="md:col-span-2" icon={Save} loading={savingIngredient}>Ajouter</Button>
        </form>
      </Modal>
    </div>
  );
};

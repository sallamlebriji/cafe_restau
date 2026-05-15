import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy,
  Eye,
  EyeOff,
  Gauge,
  Key,
  Layers3,
  Loader2,
  LogIn,
  Package,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Utensils,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

const TYPE_CONFIG = {
  CAFE: {
    label: "Cafe",
    icon: Coffee,
    color: "bg-amber-500/15 text-amber-600 border-amber-400/30"
  },
  RESTAURANT: {
    label: "Restaurant",
    icon: Utensils,
    color: "bg-emerald-500/15 text-emerald-600 border-emerald-400/30"
  },
  CAFE_RESTAURANT: {
    label: "Cafe-Restaurant",
    icon: Store,
    color: "bg-gold/15 text-copper border-gold/30"
  }
};

const PLAN_CONFIG = {
  Launch: "bg-sky-500/12 text-sky-700 border-sky-400/30",
  Growth: "bg-violet-500/12 text-violet-700 border-violet-400/30",
  Scale: "bg-copper/12 text-copper border-copper/30"
};

const money = (value) => `${Number(value || 0).toLocaleString("fr-MA")} DH`;

const getTenantCounts = (tenant) => tenant._count || tenant.stats || {};

const getTenantPlan = (tenant) => {
  const count = getTenantCounts(tenant);
  const footprint =
    Number(count.orders || 0) +
    Number(count.products || 0) +
    Number(count.customers || 0) +
    Number(count.users || 0);

  if (footprint >= 120) return "Scale";
  if (footprint >= 35) return "Growth";
  return "Launch";
};

const getTenantHealth = (tenant) => {
  if (!tenant.isActive) {
    return {
      label: "Suspendu",
      score: 0,
      tone: "text-danger",
      bg: "bg-danger"
    };
  }

  const count = getTenantCounts(tenant);
  const score = Math.min(
    100,
    42 +
      Math.min(18, Number(count.orders || 0) * 2) +
      Math.min(14, Number(count.products || 0)) +
      Math.min(14, Number(count.customers || 0)) +
      Math.min(12, Number(count.users || 0) * 2)
  );

  if (score >= 82) {
    return { label: "Excellent", score, tone: "text-success", bg: "bg-success" };
  }
  if (score >= 62) {
    return { label: "Stable", score, tone: "text-copper", bg: "bg-copper" };
  }
  return { label: "A surveiller", score, tone: "text-warning", bg: "bg-warning" };
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.CAFE_RESTAURANT;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
};

const PlanBadge = ({ plan }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase ${PLAN_CONFIG[plan] || PLAN_CONFIG.Launch}`}>
    <Sparkles size={12} />
    {plan}
  </span>
);

const MetricCard = ({ icon: Icon, label, value, hint, tone = "text-ink" }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-elegant">{label}</p>
        <p className={`mt-2 text-2xl font-black dark:text-cream ${tone}`}>{value}</p>
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/10">
        <Icon size={20} className={tone} />
      </div>
    </div>
    {hint && <p className="mt-3 text-xs font-semibold text-elegant">{hint}</p>}
  </Card>
);

const TenantCard = ({ tenant, onSelect, onToggle, onImpersonate, onDelete, onCreateAdmin }) => {
  const admin = tenant.users?.[0];
  const count = getTenantCounts(tenant);
  const plan = getTenantPlan(tenant);
  const health = getTenantHealth(tenant);
  const publicBasePath = tenant.slug ? `/${tenant.slug}` : "/";
  const totalUsage =
    Number(count.orders || 0) +
    Number(count.products || 0) +
    Number(count.customers || 0) +
    Number(count.tables || 0);

  return (
    <Card className={`flex min-h-[25rem] flex-col overflow-hidden p-0 ${!tenant.isActive ? "opacity-70" : ""}`} interactive>
      <div className="border-b border-black/5 bg-gradient-to-br from-white to-beige/35 p-5 dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-black text-white shadow-sm"
              style={{ background: tenant.primaryColor || "#C8A96A" }}
            >
              {tenant.name?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-ink dark:text-cream">{tenant.name}</h3>
              <p className="truncate text-xs font-semibold text-elegant">/{tenant.slug}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tenant.isActive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
            {tenant.isActive ? "Actif" : "Inactif"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TypeBadge type={tenant.type} />
          <PlanBadge plan={plan} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-elegant">Usage</p>
            <p className="mt-1 text-xl font-black dark:text-cream">{totalUsage}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-elegant">Sante</p>
            <p className={`mt-1 text-xl font-black ${health.tone}`}>{health.score}%</p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-elegant">
            <span>{health.label}</span>
            <span>{health.score}/100</span>
          </div>
          <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
            <div className={`h-full rounded-full ${health.bg}`} style={{ width: `${health.score}%` }} />
          </div>
        </div>

        {admin ? (
          <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-black/[0.025] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <Shield size={14} className="shrink-0 text-copper" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold dark:text-cream">{admin.name}</p>
              <p className="truncate text-[11px] text-elegant">{admin.email}</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onCreateAdmin(tenant)}
            className="flex items-center gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-3 py-2 text-left transition hover:border-warning"
          >
            <UserPlus size={14} className="shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-warning">Admin manquant</p>
              <p className="truncate text-[11px] text-elegant">Creer le compte proprietaire</p>
            </div>
          </button>
        )}

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Users", value: count.users || 0 },
            { label: "Menu", value: count.products || 0 },
            { label: "Cmd", value: count.orders || 0 },
            { label: "Tables", value: count.tables || 0 }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-black/[0.025] px-2 py-2 dark:bg-white/[0.04]">
              <p className="text-sm font-black dark:text-cream">{item.value}</p>
              <p className="text-[10px] font-semibold text-elegant">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" icon={Settings2} onClick={() => onSelect(tenant)} className="col-span-2">
            Console tenant
          </Button>
          <Button size="sm" variant="secondary" icon={admin ? LogIn : UserPlus} onClick={() => admin ? onImpersonate(tenant) : onCreateAdmin(tenant)}>
            {admin ? "Acceder" : "Creer admin"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Power}
            onClick={() => onToggle(tenant)}
            className={tenant.isActive ? "border-danger/30 text-danger hover:bg-danger hover:text-white" : "border-success/30 text-success hover:bg-success hover:text-white"}
          >
            {tenant.isActive ? "Suspendre" : "Activer"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={ArrowUpRight}
            onClick={() => window.open(publicBasePath, "_blank", "noopener,noreferrer")}
          >
            Page publique
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Utensils}
            onClick={() => window.open(`${publicBasePath}/menu`, "_blank", "noopener,noreferrer")}
          >
            Menu
          </Button>
          <button
            onClick={() => onDelete(tenant)}
            className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-danger/20 text-xs font-bold text-danger transition hover:bg-danger hover:text-white"
          >
            <Trash2 size={15} />
            Supprimer definitivement
          </button>
        </div>
      </div>
    </Card>
  );
};

const ProvisionModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    type: "CAFE_RESTAURANT",
    address: "",
    phone: "",
    email: "",
    primaryColor: "#C8A96A",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    seedCategories: true,
    seedTables: false,
    tableCount: 5
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({
      name: "",
      type: "CAFE_RESTAURANT",
      address: "",
      phone: "",
      email: "",
      primaryColor: "#C8A96A",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      seedCategories: true,
      seedTables: false,
      tableCount: 5
    });
    setStep(1);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Nom de l'etablissement requis.");
    if (!form.adminName.trim()) return toast.error("Nom de l'admin requis.");
    if (!form.adminEmail.trim()) return toast.error("Email de l'admin requis.");
    if (form.adminPassword.length < 8) return toast.error("Mot de passe: 8 caracteres minimum.");

    setSaving(true);
    try {
      const { data } = await api.post("/tenants/provision", {
        ...form,
        tableCount: form.seedTables ? Number(form.tableCount) : 0
      });
      toast.success(`Tenant "${data.data.establishment.name}" cree.`);
      onCreated(data.data);
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la creation.");
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    { id: "CAFE", label: "Cafe", icon: Coffee, desc: "Vente rapide, menu, caisse" },
    { id: "RESTAURANT", label: "Restaurant", icon: Utensils, desc: "Tables, cuisine, reservations" },
    { id: "CAFE_RESTAURANT", label: "Hybride", icon: Store, desc: "Tous les modules actifs" }
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Provisionner un tenant SaaS"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {[1, 2, 3].map((item) => (
              <button
                key={item}
                onClick={() => setStep(item)}
                className={`h-2 rounded-full transition-all ${step === item ? "w-8 bg-gold" : "w-2 bg-black/15 dark:bg-white/15"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Retour
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Suivant</Button>
            ) : (
              <Button icon={saving ? Loader2 : Plus} loading={saving} onClick={handleCreate}>
                Lancer l'instance
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-elegant">Identite commerciale et type d'exploitation du client.</p>
          <Input label="Nom de l'etablissement *" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Le Cafe de Paris" />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Template d'instance</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => update("type", option.id)}
                    className={`flex min-h-[7.5rem] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
                      form.type === option.id
                        ? "border-gold bg-gold/10"
                        : "border-black/10 hover:border-gold/50 dark:border-white/10"
                    }`}
                  >
                    <Icon size={18} className={form.type === option.id ? "text-copper" : "text-elegant"} />
                    <span className="text-xs font-black dark:text-cream">{option.label}</span>
                    <span className="text-[10px] leading-relaxed text-elegant">{option.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Telephone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+212..." />
            <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="contact@..." />
          </div>
          <Input label="Adresse" value={form.address} onChange={(e) => update("address", e.target.value)} />
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 p-3 dark:border-white/10">
            <input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="h-10 w-16 cursor-pointer rounded-xl border border-black/10" />
            <div>
              <p className="text-sm font-semibold">Couleur de marque</p>
              <p className="text-xs text-elegant">{form.primaryColor}</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-elegant">Compte proprietaire du tenant. Cet utilisateur administrera uniquement son instance.</p>
          <div className="rounded-2xl border border-copper/25 bg-copper/5 p-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-copper">Isolation SaaS</p>
            <p className="mt-1 text-xs text-elegant">Les donnees, utilisateurs, produits et commandes restent cloisonnes par tenant.</p>
          </div>
          <Input label="Nom complet *" value={form.adminName} onChange={(e) => update("adminName", e.target.value)} placeholder="Ex: Mohamed Alami" />
          <Input label="Email *" type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} placeholder="admin@etablissement.ma" />
          <div className="relative">
            <Input label="Mot de passe *" type={showPwd ? "text" : "password"} value={form.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} placeholder="8 caracteres minimum" />
            <button type="button" onClick={() => setShowPwd((value) => !value)} className="absolute bottom-3 end-3 text-elegant hover:text-ink dark:hover:text-cream">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.adminPassword.length > 0 && form.adminPassword.length < 8 && <p className="text-xs text-danger">Mot de passe trop court.</p>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-elegant">Choisissez les donnees initiales a deployer avec l'instance.</p>
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-elegant">Recap provisioning</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ background: form.primaryColor }} />
              <span className="font-bold dark:text-cream">{form.name || "Nouveau tenant"}</span>
              <TypeBadge type={form.type} />
            </div>
            <p className="mt-2 text-xs text-elegant">Admin: <strong>{form.adminEmail || "non renseigne"}</strong></p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4 transition hover:border-gold/50 dark:border-white/10">
            <input type="checkbox" checked={form.seedCategories} onChange={(e) => update("seedCategories", e.target.checked)} className="mt-0.5 h-5 w-5 accent-copper" />
            <div>
              <p className="font-bold dark:text-cream">Catalogue de depart</p>
              <p className="mt-0.5 text-xs text-elegant">Categories standard: boissons, snacks, plats, desserts.</p>
            </div>
          </label>

          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${form.seedTables ? "border-gold/50 bg-gold/5" : "border-black/10 hover:border-gold/50 dark:border-white/10"}`}>
            <input type="checkbox" checked={form.seedTables} onChange={(e) => update("seedTables", e.target.checked)} className="mt-0.5 h-5 w-5 accent-copper" />
            <div className="flex-1">
              <p className="font-bold dark:text-cream">Tables et QR codes</p>
              <p className="mt-0.5 text-xs text-elegant">Prepare les tables de salle pour les restaurants.</p>
              {form.seedTables && (
                <div className="mt-3 flex items-center gap-3">
                  <input type="range" min="1" max="50" value={form.tableCount} onChange={(e) => update("tableCount", e.target.value)} className="flex-1 accent-copper" />
                  <span className="w-8 text-center font-black text-copper">{form.tableCount}</span>
                </div>
              )}
            </div>
          </label>
        </div>
      )}
    </Modal>
  );
};

const AdminModal = ({ tenant, onClose, onCreated }) => {
  const [form, setForm] = useState({
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      adminName: tenant.name ? `Admin ${tenant.name}` : "",
      adminEmail: tenant.email || "",
      adminPassword: ""
    });
    setShowPwd(false);
  }, [tenant?.id]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.adminName.trim()) return toast.error("Nom de l'admin requis.");
    if (!form.adminEmail.trim()) return toast.error("Email de l'admin requis.");
    if (form.adminPassword.length < 8) return toast.error("Mot de passe: 8 caracteres minimum.");

    setSaving(true);
    try {
      await api.post(`/tenants/${tenant.id}/admin`, form);
      toast.success(`Admin cree pour "${tenant.name}".`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Impossible de creer l'admin.");
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) return null;

  return (
    <Modal
      open={Boolean(tenant)}
      onClose={onClose}
      title={`Creer admin - ${tenant.name}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button icon={UserPlus} loading={saving} onClick={handleCreate}>Creer admin</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-warning/25 bg-warning/10 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-warning">Admin manquant</p>
          <p className="mt-1 text-xs text-elegant">
            Ce tenant existe, mais aucun compte ADMIN_ESTABLISHMENT n'est rattache. Creez le compte proprietaire pour permettre l'acces.
          </p>
        </div>
        <Input label="Nom complet *" value={form.adminName} onChange={(e) => update("adminName", e.target.value)} />
        <Input label="Email *" type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} placeholder="admin@etablissement.ma" />
        <div className="relative">
          <Input
            label="Mot de passe *"
            type={showPwd ? "text" : "password"}
            value={form.adminPassword}
            onChange={(e) => update("adminPassword", e.target.value)}
            placeholder="8 caracteres minimum"
          />
          <button type="button" onClick={() => setShowPwd((value) => !value)} className="absolute bottom-3 end-3 text-elegant">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const TenantDetailModal = ({ tenant, onClose, onRefresh }) => {
  const [stats, setStats] = useState(null);
  const [loadStats, setLoadStats] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenant) return;
    setLoadStats(true);
    api
      .get(`/tenants/${tenant.id}/stats`)
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoadStats(false));
  }, [tenant?.id]);

  const handleImpersonate = async () => {
    try {
      const { data } = await api.post(`/tenants/${tenant.id}/impersonate`);
      localStorage.setItem("sa_token", localStorage.getItem("token"));
      localStorage.setItem("sa_user", localStorage.getItem("user"));
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      navigate("/admin/dashboard", { replace: true });
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Impossible d'acceder a ce tenant.");
    }
  };

  const handleResetPwd = async () => {
    if (newPwd.length < 8) return toast.error("8 caracteres minimum.");
    setSaving(true);
    try {
      await api.post(`/tenants/${tenant.id}/reset-admin`, { newPassword: newPwd });
      toast.success("Mot de passe reinitialise.");
      setNewPwd("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const copyLoginToken = async () => {
    try {
      const { data } = await api.post(`/tenants/${tenant.id}/impersonate`);
      await navigator.clipboard.writeText(data.data.token);
      toast.success("Token copie.");
    } catch {
      toast.error("Impossible de copier le token.");
    }
  };

  if (!tenant) return null;

  const admin = tenant.users?.find((item) => item.roleName === "ADMIN_ESTABLISHMENT") || tenant.users?.[0];
  const health = getTenantHealth(tenant);
  const plan = getTenantPlan(tenant);

  return (
    <Modal open={Boolean(tenant)} onClose={onClose} title={`Console tenant - ${tenant.name}`}>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-black text-white shadow" style={{ background: tenant.primaryColor || "#C8A96A" }}>
            {tenant.name?.charAt(0)?.toUpperCase() || "T"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black dark:text-cream">{tenant.name}</h3>
              <TypeBadge type={tenant.type} />
              <PlanBadge plan={plan} />
            </div>
            <p className="text-sm text-elegant">/{tenant.slug}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-black dark:text-cream">Score de sante SaaS</p>
            <span className={`text-sm font-black ${health.tone}`}>{health.score}%</span>
          </div>
          <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
            <div className={`h-full rounded-full ${health.bg}`} style={{ width: `${health.score}%` }} />
          </div>
          <p className="mt-2 text-xs text-elegant">{health.label}</p>
        </div>

        {loadStats ? (
          <div className="text-sm text-elegant">Chargement des stats...</div>
        ) : (
          stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Commandes", value: stats.orders, icon: Activity, color: "text-copper" },
                { label: "CA total", value: money(stats.totalRevenue), icon: TrendingUp, color: "text-success" },
                { label: "Utilisateurs", value: stats.users, icon: Users, color: "text-violet-500" },
                { label: "Produits", value: stats.products, icon: Package, color: "text-sky-500" },
                { label: "Tables", value: stats.tables, icon: Building2, color: "text-amber-600" },
                { label: "Clients", value: stats.customers, icon: Users, color: "text-pink-500" }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl border border-black/10 p-3 text-center dark:border-white/10">
                  <Icon size={18} className={`mx-auto mb-1 ${color}`} />
                  <p className="text-lg font-black dark:text-cream">{value}</p>
                  <p className="text-[10px] text-elegant">{label}</p>
                </div>
              ))}
            </div>
          )
        )}

        {admin && (
          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-copper">Admin tenant</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold dark:text-cream">{admin.name}</p>
                <p className="truncate text-xs text-elegant">{admin.email}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${admin.isActive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                {admin.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button icon={LogIn} onClick={handleImpersonate} className="col-span-2">
            Ouvrir l'instance comme admin
          </Button>
          <Button variant="secondary" icon={Copy} onClick={copyLoginToken}>
            Copier token
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={onRefresh}>
            Actualiser
          </Button>
        </div>

        <div className="space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <p className="text-sm font-black dark:text-cream">Reinitialiser le mot de passe admin</p>
          <div className="relative">
            <Input label="Nouveau mot de passe" type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="8 caracteres minimum" />
            <button type="button" onClick={() => setShowPwd((value) => !value)} className="absolute bottom-3 end-3 text-elegant">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button size="sm" variant="secondary" icon={Key} onClick={handleResetPwd} loading={saving}>
            Reinitialiser
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const TenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [adminTenant, setAdminTenant] = useState(null);
  const searchRef = useRef(null);

  const fetchTenants = async (page = 1, q = search, options = {}) => {
    const silent = Boolean(options.silent);
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/tenants", { params: { page, limit: 12, search: q } });
      setTenants(data.data);
      setMeta(data.meta);
      setLastUpdated(new Date());
    } catch {
      toast.error("Impossible de charger les tenants.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(1, "");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchTenants(1, search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTenants(meta.page, search, { silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, [meta.page, search]);

  const handleToggle = async (tenant) => {
    const action = tenant.isActive ? "suspendre" : "activer";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${tenant.name}" et tous ses utilisateurs ?`)) return;
    try {
      const { data } = await api.patch(`/tenants/${tenant.id}/toggle`);
      toast.success(data.message);
      setTenants((prev) => prev.map((item) => (item.id === tenant.id ? { ...item, isActive: data.data.isActive } : item)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur.");
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Supprimer DEFINITIVEMENT "${tenant.name}" et toutes ses donnees ?\n\nCette action est irreversible.`)) return;
    try {
      const { data } = await api.delete(`/tenants/${tenant.id}`);
      toast.success(data.message);
      setTenants((prev) => prev.filter((item) => item.id !== tenant.id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  const handleImpersonate = async (tenant) => {
    try {
      const { data } = await api.post(`/tenants/${tenant.id}/impersonate`);
      localStorage.setItem("sa_token", localStorage.getItem("token"));
      localStorage.setItem("sa_user", localStorage.getItem("user"));
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      toast.success(`Acces a "${tenant.name}"`);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      toast.error(err.response?.data?.message || "Impossible d'acceder.");
    }
  };

  const handleCreated = () => {
    setSearch("");
    fetchTenants(1, "");
  };

  const pageStats = useMemo(() => {
    const active = tenants.filter((tenant) => tenant.isActive).length;
    const inactive = tenants.length - active;
    const usage = tenants.reduce((sum, tenant) => {
      const count = getTenantCounts(tenant);
      return sum + Number(count.orders || 0) + Number(count.products || 0) + Number(count.customers || 0) + Number(count.users || 0);
    }, 0);
    const scale = tenants.filter((tenant) => getTenantPlan(tenant) === "Scale").length;
    const avgHealth = tenants.length
      ? Math.round(tenants.reduce((sum, tenant) => sum + getTenantHealth(tenant).score, 0) / tenants.length)
      : 0;

    return { active, inactive, usage, scale, avgHealth };
  }, [tenants]);

  const stats = meta.summary || pageStats;

  const filteredTenants = useMemo(() => {
    if (filter === "ACTIVE") return tenants.filter((tenant) => tenant.isActive);
    if (filter === "SUSPENDED") return tenants.filter((tenant) => !tenant.isActive);
    if (filter === "SCALE") return tenants.filter((tenant) => getTenantPlan(tenant) === "Scale");
    return tenants;
  }, [filter, tenants]);

  const filters = [
    { id: "ALL", label: "Tous", value: tenants.length },
    { id: "ACTIVE", label: "Actifs", value: pageStats.active },
    { id: "SUSPENDED", label: "Suspendus", value: pageStats.inactive },
    { id: "SCALE", label: "Scale", value: pageStats.scale }
  ];

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Jamais";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SaaS Control Center"
        title="Plateforme multi-tenant"
        description="Pilotez les clients, les plans, la sante des instances et le provisioning de votre solution cafe-restau depuis une console super admin."
        breadcrumbs={["Super Admin", "SaaS"]}
        actions={
          <Button icon={Plus} onClick={() => setProvisionOpen(true)}>
            Nouveau tenant
          </Button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border border-black/5 bg-ink text-cream shadow-premium dark:border-white/10">
          <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                <Layers3 size={14} />
                Architecture SaaS par tenant
              </div>
              <h2 className="mt-5 max-w-2xl text-2xl font-black leading-tight md:text-3xl">
                Un cockpit pour vendre, activer et suivre chaque instance client.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-300">
                Chaque etablissement garde son espace, ses utilisateurs, ses modules et ses donnees. Le super admin garde la vision plateforme.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="gold" icon={Plus} onClick={() => setProvisionOpen(true)}>
                  Provisionner
                </Button>
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={() => fetchTenants(meta.page, search, { silent: true })}
                  className="border-white/10 bg-white/10 text-cream hover:border-gold"
                >
                  Synchroniser
                </Button>
              </div>
              <p className="mt-3 text-xs font-semibold text-zinc-500">
                Derniere mise a jour: {lastUpdatedLabel} · auto-refresh 30s
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Tenants", value: meta.total || tenants.length },
                { label: "Actifs", value: stats.active },
                { label: "Sante moy.", value: `${stats.avgHealth}%` },
                { label: "Usage", value: stats.usage }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-copper">Onboarding</p>
              <h3 className="mt-1 font-black dark:text-cream">Pipeline SaaS</h3>
            </div>
            <Gauge size={20} className="text-copper" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Lead signe", value: "Contrat valide", done: true },
              { label: "Instance creee", value: `${stats.active} clients actifs`, done: stats.active > 0 },
              { label: "Admin invite", value: "Acces tenant pret", done: tenants.some((tenant) => tenant.users?.length) },
              { label: "Usage verifie", value: `${stats.avgHealth}% sante moyenne`, done: stats.avgHealth > 60 }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-black/5 p-3 dark:border-white/10">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${item.done ? "bg-success/15 text-success" : "bg-black/5 text-elegant dark:bg-white/10"}`}>
                  <CheckCircle2 size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold dark:text-cream">{item.label}</p>
                  <p className="truncate text-xs text-elegant">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard icon={Building2} label="Tenants" value={meta.total || tenants.length} hint="Total plateforme" tone="text-copper" />
        <MetricCard icon={CheckCircle2} label="Actifs" value={stats.active} hint={`${stats.inactive} suspendu(s)`} tone="text-success" />
        <MetricCard icon={Sparkles} label="Plan Scale" value={stats.scale} hint="Clients a fort usage" tone="text-violet-600" />
        <MetricCard icon={Gauge} label="Sante" value={`${stats.avgHealth}%`} hint="Moyenne plateforme" tone="text-warning" />
        <MetricCard icon={Activity} label="Usage" value={stats.usage} hint="Objets metier suivis" tone="text-sky-600" />
      </div>

      <section className="rounded-3xl border border-black/5 bg-white/80 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-black transition ${
                  filter === item.id
                    ? "border-ink bg-ink text-cream dark:border-gold dark:bg-gold dark:text-ink"
                    : "border-black/10 text-elegant hover:border-gold dark:border-white/10"
                }`}
              >
                {item.label}
                <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">{item.value}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute start-3 top-3.5 text-elegant" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, slug, email..."
                className="h-11 w-full rounded-2xl border border-black/10 bg-white/80 ps-10 pe-10 text-sm font-semibold text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15 dark:border-white/10 dark:bg-white/10 dark:text-cream"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute end-3 top-3.5 text-elegant hover:text-ink dark:hover:text-cream">
                  <X size={16} />
                </button>
              )}
            </div>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchTenants(1, search)}>
              Actualiser
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="h-[25rem] animate-pulse bg-black/5 dark:bg-white/5" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <Building2 size={48} className="text-elegant/30" />
          <div>
            <p className="font-black dark:text-cream">Aucun tenant trouve</p>
            <p className="mt-1 text-sm text-elegant">
              {search ? `Aucun resultat pour "${search}"` : "Creez votre premier tenant pour commencer."}
            </p>
          </div>
          {!search && (
            <Button icon={Plus} onClick={() => setProvisionOpen(true)}>
              Creer le premier tenant
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onSelect={setSelected}
              onToggle={handleToggle}
              onImpersonate={handleImpersonate}
              onDelete={handleDelete}
              onCreateAdmin={setAdminTenant}
            />
          ))}
        </div>
      )}

      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" icon={ChevronLeft} disabled={meta.page === 1} onClick={() => fetchTenants(meta.page - 1)} />
          {Array.from({ length: meta.pages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchTenants(page)}
              className={`h-9 w-9 rounded-xl text-sm font-bold transition ${
                page === meta.page ? "bg-gold text-ink shadow" : "border border-black/10 text-elegant hover:border-gold dark:border-white/10"
              }`}
            >
              {page}
            </button>
          ))}
          <Button variant="secondary" icon={ChevronRight} disabled={meta.page === meta.pages} onClick={() => fetchTenants(meta.page + 1)} />
        </div>
      )}

      {localStorage.getItem("sa_token") && (
        <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-ink px-4 py-3 shadow-premium">
          <div className="flex min-w-0 items-center gap-2 text-cream">
            <Shield size={16} className="shrink-0 text-gold" />
            <span className="truncate text-sm font-bold">Mode Super Admin actif</span>
          </div>
          <button
            onClick={() => {
              const saToken = localStorage.getItem("sa_token");
              const saUser = localStorage.getItem("sa_user");
              localStorage.setItem("token", saToken);
              localStorage.setItem("user", saUser);
              localStorage.removeItem("sa_token");
              localStorage.removeItem("sa_user");
              window.location.href = "/admin/tenants";
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gold px-3 py-1.5 text-xs font-black text-ink hover:bg-amber-400"
          >
            Retour
            <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      <ProvisionModal open={provisionOpen} onClose={() => setProvisionOpen(false)} onCreated={handleCreated} />
      <AdminModal
        tenant={adminTenant}
        onClose={() => setAdminTenant(null)}
        onCreated={() => fetchTenants(meta.page, search)}
      />
      <TenantDetailModal tenant={selected} onClose={() => setSelected(null)} onRefresh={() => { setSelected(null); fetchTenants(meta.page); }} />
    </div>
  );
};

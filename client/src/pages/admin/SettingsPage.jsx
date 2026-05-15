import { Coffee, Save, Store, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { moduleLabels, roleLabels, establishmentTypeLabels, moduleByType } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const configurableRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"];
const moduleOrder = ["dashboard", "pos", "orders", "kitchen", "products", "tables", "reservations", "customers", "employees", "stock", "payments", "reports", "settings"];

// ─── Sélecteur de mode établissement ────────────────────────────────────────
const EstablishmentModeSelector = ({ value, onChange }) => {
  const { t } = useTranslation();
  const modes = [
    {
      id: "CAFE",
      label: t("mode_cafe"),
      icon: Coffee,
      description: t("mode_desc_cafe"),
      color: "border-amber-400 bg-amber-50 dark:bg-amber-900/20",
      activeColor: "ring-2 ring-amber-400",
      iconColor: "text-amber-500",
      modules: [t("pos"), t("orders"), t("products"), t("customers"), t("stock"), t("payments"), t("reports")]
    },
    {
      id: "RESTAURANT",
      label: t("mode_restaurant"),
      icon: Utensils,
      description: t("mode_desc_restaurant"),
      color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
      activeColor: "ring-2 ring-emerald-400",
      iconColor: "text-emerald-500",
      modules: [t("pos"), t("orders"), t("kitchen"), t("products"), t("tables"), t("reservations"), t("customers"), t("stock"), t("payments"), t("reports")]
    },
    {
      id: "CAFE_RESTAURANT",
      label: t("mode_cafe_restaurant"),
      icon: Store,
      description: t("mode_desc_hybrid"),
      color: "border-gold bg-amber-50/50 dark:bg-yellow-900/20",
      activeColor: "ring-2 ring-gold",
      iconColor: "text-gold",
      modules: [t("all_modules_active")]
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${mode.color} ${
              isActive ? mode.activeColor + " shadow-md" : "border-black/10 dark:border-white/10"
            }`}
          >
            {isActive && (
              <span className="absolute right-3 top-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink">
                {t("active")}
              </span>
            )}
            <div className={`rounded-xl bg-white/70 p-2.5 dark:bg-white/10 ${mode.iconColor}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="font-black dark:text-cream">{mode.label}</p>
              <p className="mt-1 text-xs font-semibold text-elegant">{mode.description}</p>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {mode.modules.map((m) => (
                <span key={m} className="rounded-lg bg-black/5 px-2 py-0.5 text-[10px] font-bold dark:bg-white/10">
                  {m}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─── Matrice permissions ────────────────────────────────────────────────────
const PermissionMatrix = ({ title, description, roles, onToggle }) => {
  const { t } = useTranslation();
  return (
    <Card className="space-y-4 p-5 xl:col-span-2">
      <div>
        <h2 className="text-xl font-black dark:text-cream">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-elegant">{description}</p>
        <p className="mt-1 text-xs font-bold text-copper">{t("super_admin_protected")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {configurableRoles.map((role) => (
          <label
            key={role}
            className={`flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-black dark:border-white/10 dark:bg-white/5 ${role === "SUPER_ADMIN" ? "opacity-70" : ""}`}
          >
            <input
              type="checkbox"
              checked={roles.includes(role)}
              disabled={role === "SUPER_ADMIN"}
              onChange={() => onToggle(role)}
              className="h-5 w-5 accent-copper"
            />
            <span>{t(`role_${role}`) || roleLabels[role] || role}</span>
          </label>
        ))}
      </div>
    </Card>
  );
};

// ─── Matrice accès modules ──────────────────────────────────────────────────
const ModuleAccessMatrix = ({ modules, onToggle, establishmentType }) => {
  const { t } = useTranslation();
  return (
    <Card className="space-y-4 p-5 xl:col-span-2">
      <div>
        <h2 className="text-xl font-black dark:text-cream">{t("module_access")}</h2>
        <p className="mt-1 text-sm font-semibold text-elegant">{t("module_access_desc")}</p>
        <p className="mt-1 text-xs font-bold text-copper">{t("super_admin_always")}</p>
      </div>
      <div className="space-y-4">
        {moduleOrder.map((module) => {
          const disabledByType =
            establishmentType &&
            establishmentType !== "SUPER_ADMIN" &&
            moduleByType[module] &&
            !moduleByType[module].includes(establishmentType);
          return (
            <div
              key={module}
              className={`rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5 ${disabledByType ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-black dark:text-cream">{t(module) || moduleLabels[module] || module}</h3>
                {disabledByType && (
                  <span className="rounded-lg bg-black/10 px-2 py-0.5 text-[10px] font-bold dark:bg-white/10">
                    {t("disabled_mode", { mode: establishmentTypeLabels[establishmentType] })}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {configurableRoles.map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 text-sm font-black dark:border-white/10 dark:bg-white/5 ${role === "SUPER_ADMIN" ? "opacity-70" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={(modules[module] || []).includes(role)}
                      disabled={role === "SUPER_ADMIN" || disabledByType}
                      onChange={() => onToggle(module, role)}
                      className="h-5 w-5 accent-copper"
                    />
                    <span className="text-xs">{t(`role_${role}`) || roleLabels[role] || role}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─── Page principale ────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const [orderVisibilityRoles, setOrderVisibilityRoles] = useState(["SUPER_ADMIN", "MANAGER", "CASHIER"]);
  const [tableManagementRoles, setTableManagementRoles] = useState(["SUPER_ADMIN", "MANAGER"]);
  const [customerManagementRoles, setCustomerManagementRoles] = useState(["SUPER_ADMIN", "MANAGER"]);
  const [productManagementRoles, setProductManagementRoles] = useState(["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"]);
  const [stockManagementRoles, setStockManagementRoles] = useState(["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"]);
  const [roleAssignmentRoles, setRoleAssignmentRoles] = useState(["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"]);
  const [moduleAccessRoles, setModuleAccessRoles] = useState({});
  const [establishments, setEstablishments] = useState([]);
  const [establishment, setEstablishment] = useState({
    id: null, name: "", phone: "", address: "", primaryColor: "#C8A96A", type: "CAFE_RESTAURANT"
  });
  const [originalType, setOriginalType] = useState("CAFE_RESTAURANT");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/establishments?limit=100")
      .then(({ data }) => {
        setEstablishments(data.data);
        const current = data.data.find((item) => item.id === user?.establishmentId) || data.data[0];
        if (current) {
          const type = current.type || "CAFE_RESTAURANT";
          setEstablishment({
            id: current.id,
            name: current.name || "",
            phone: current.phone || "",
            address: current.address || "",
            primaryColor: current.primaryColor || "#C8A96A",
            type
          });
          setOriginalType(type);
        }
      })
      .catch(() => toast.error(t("cannot_load_establishment")));
  }, [user?.establishmentId, t]);

  useEffect(() => {
    if (!establishment.id) return;
    const params = { establishmentId: establishment.id };
    Promise.all([
      api.get("/settings/order-visibility", { params }),
      api.get("/settings/table-management", { params }),
      api.get("/settings/customer-management", { params }),
      api.get("/settings/product-management", { params }),
      api.get("/settings/stock-management", { params }),
      api.get("/settings/role-assignment", { params }),
      api.get("/settings/module-access", { params })
    ])
      .then(([orderRes, tableRes, customerRes, productRes, stockRes, roleRes, moduleRes]) => {
        setOrderVisibilityRoles(orderRes.data.data.roles);
        setTableManagementRoles(tableRes.data.data.roles);
        setCustomerManagementRoles(customerRes.data.data.roles);
        setProductManagementRoles(productRes.data.data.roles);
        setStockManagementRoles(stockRes.data.data.roles);
        setRoleAssignmentRoles(roleRes.data.data.roles);
        setModuleAccessRoles(moduleRes.data.data.modules);
      })
      .catch(() => toast.error(t("cannot_load_permissions")));
  }, [establishment.id, t]);

  const toggleRole = (role, setter) => {
    if (role === "SUPER_ADMIN") return;
    setter((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
    );
  };

  const toggleModuleRole = (module, role) => {
    if (role === "SUPER_ADMIN") return;
    setModuleAccessRoles((current) => {
      const roles = current[module] || ["SUPER_ADMIN"];
      return {
        ...current,
        [module]: roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role]
      };
    });
  };

  const selectEstablishment = (id) => {
    const current = establishments.find((item) => item.id === Number(id));
    if (current) {
      const type = current.type || "CAFE_RESTAURANT";
      setEstablishment({
        id: current.id,
        name: current.name || "",
        phone: current.phone || "",
        address: current.address || "",
        primaryColor: current.primaryColor || "#C8A96A",
        type
      });
      setOriginalType(type);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { id, ...establishmentPayload } = establishment;
      const settingPayload = { establishmentId: id };
      const typeChanged = establishment.type !== originalType;

      if (isSuperAdmin && typeChanged && id) {
        await api.put("/settings/establishment-type", {
          establishmentId: id,
          type: establishment.type
        });
        setOriginalType(establishment.type);
        window.dispatchEvent(new CustomEvent("establishment-type-changed", {
          detail: { establishmentId: id, type: establishment.type }
        }));
      }

      const [, orderRes, tableRes, customerRes, productRes, stockRes, roleRes, moduleRes] = await Promise.all([
        id ? api.put(`/establishments/${id}`, establishmentPayload) : Promise.resolve(),
        api.put("/settings/order-visibility", { ...settingPayload, roles: orderVisibilityRoles }),
        api.put("/settings/table-management", { ...settingPayload, roles: tableManagementRoles }),
        api.put("/settings/customer-management", { ...settingPayload, roles: customerManagementRoles }),
        api.put("/settings/product-management", { ...settingPayload, roles: productManagementRoles }),
        api.put("/settings/stock-management", { ...settingPayload, roles: stockManagementRoles }),
        api.put("/settings/role-assignment", { ...settingPayload, roles: roleAssignmentRoles }),
        api.put("/settings/module-access", { ...settingPayload, modules: moduleAccessRoles })
      ]);

      setOrderVisibilityRoles(orderRes.data.data.roles);
      setTableManagementRoles(tableRes.data.data.roles);
      setCustomerManagementRoles(customerRes.data.data.roles);
      setProductManagementRoles(productRes.data.data.roles);
      setStockManagementRoles(stockRes.data.data.roles);
      setRoleAssignmentRoles(roleRes.data.data.roles);
      setModuleAccessRoles(moduleRes.data.data.modules);

      if (typeChanged) {
        toast.success(t("mode_changed_success", { mode: establishmentTypeLabels[establishment.type] }));
      } else {
        toast.success(t("settings_saved"));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t("cannot_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title={t("settings_title")}
        description={t("settings_desc")}
        actions={
          <Button icon={Save} onClick={saveSettings} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">

        {/* ── Mode d'exploitation (Super Admin uniquement) ── */}
        {isSuperAdmin && (
          <Card className="space-y-5 p-5 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black dark:text-cream">{t("exploitation_mode")}</h2>
                <p className="mt-1 text-sm font-semibold text-elegant">
                  {t("mode_desc_cafe") ? "Définit les modules visibles dans la navigation pour tous les utilisateurs de cet établissement." : ""}
                </p>
              </div>
              <span className="shrink-0 self-start rounded-xl bg-gold/20 px-3 py-1.5 text-xs font-black text-gold border border-gold/30">
                {t("super_admin_only")}
              </span>
            </div>

            {establishments.length > 1 && (
              <Select
                label={t("establishment_to_configure")}
                value={establishment.id || ""}
                onChange={(e) => selectEstablishment(e.target.value)}
                options={establishments.map((item) => ({ value: item.id, label: item.name }))}
              />
            )}

            <EstablishmentModeSelector
              value={establishment.type}
              onChange={(type) => setEstablishment((prev) => ({ ...prev, type }))}
            />

            {establishment.type !== originalType && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  ⚠️ {t("mode_warning")} → <strong>{establishmentTypeLabels[establishment.type]}</strong>
                </span>
              </div>
            )}
          </Card>
        )}

        {/* ── Informations établissement ── */}
        <Card className="space-y-4 p-5">
          <h2 className="text-xl font-black dark:text-cream">{t("establishment")}</h2>
          {!isSuperAdmin && establishments.length > 1 && (
            <Select
              label={t("establishment_to_configure")}
              value={establishment.id || ""}
              onChange={(e) => selectEstablishment(e.target.value)}
              options={establishments.map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <Input
            label={t("name")}
            value={establishment.name}
            onChange={(e) => setEstablishment((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label={t("phone")}
            value={establishment.phone}
            onChange={(e) => setEstablishment((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <Input
            label={t("address")}
            value={establishment.address}
            onChange={(e) => setEstablishment((prev) => ({ ...prev, address: e.target.value }))}
          />
          <Input
            label={t("primary_color")}
            type="color"
            value={establishment.primaryColor}
            onChange={(e) => setEstablishment((prev) => ({ ...prev, primaryColor: e.target.value }))}
          />
        </Card>

        {/* ── Paramètres opérationnels ── */}
        <Card className="space-y-4 p-5">
          <h2 className="text-xl font-black dark:text-cream">{t("operation")}</h2>
          {!isSuperAdmin ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-elegant">{t("current_mode")}</p>
              <p className="mt-1 font-black dark:text-cream">
                {establishmentTypeLabels[establishment.type] || establishment.type}
              </p>
              <p className="mt-1 text-xs text-elegant">{t("only_super_admin_mode")}</p>
            </div>
          ) : (
            <Select
              label={t("type_readonly_hint")}
              value={establishment.type}
              onChange={(e) => setEstablishment((prev) => ({ ...prev, type: e.target.value }))}
              options={[
                { value: "CAFE_RESTAURANT", label: t("mode_cafe_restaurant") },
                { value: "CAFE", label: t("mode_cafe") },
                { value: "RESTAURANT", label: t("mode_restaurant") }
              ]}
            />
          )}
          <Select label={t("default_lang")} options={[
            { value: "fr", label: "Français" },
            { value: "ar", label: "العربية" },
            { value: "en", label: "English" }
          ]} />
          <Input label={t("default_vat")} defaultValue="10%" />
          <Input label={t("whatsapp")} defaultValue="+212600000000" />
        </Card>

        {/* ── Matrices ── */}
        <ModuleAccessMatrix
          modules={moduleAccessRoles}
          onToggle={toggleModuleRole}
          establishmentType={establishment.type}
        />
        <PermissionMatrix
          title={t("order_visibility")}
          description={t("order_visibility_desc")}
          roles={orderVisibilityRoles}
          onToggle={(role) => toggleRole(role, setOrderVisibilityRoles)}
        />
        <PermissionMatrix
          title={t("table_management")}
          description={t("table_management_desc")}
          roles={tableManagementRoles}
          onToggle={(role) => toggleRole(role, setTableManagementRoles)}
        />
        <PermissionMatrix
          title={t("customer_management")}
          description={t("customer_management_desc")}
          roles={customerManagementRoles}
          onToggle={(role) => toggleRole(role, setCustomerManagementRoles)}
        />
        <PermissionMatrix
          title={t("product_management")}
          description={t("product_management_desc")}
          roles={productManagementRoles}
          onToggle={(role) => toggleRole(role, setProductManagementRoles)}
        />
        <PermissionMatrix
          title={t("stock_management")}
          description={t("stock_management_desc")}
          roles={stockManagementRoles}
          onToggle={(role) => toggleRole(role, setStockManagementRoles)}
        />
        <PermissionMatrix
          title={t("role_assignment")}
          description={t("role_assignment_desc")}
          roles={roleAssignmentRoles}
          onToggle={(role) => toggleRole(role, setRoleAssignmentRoles)}
        />
      </div>
    </div>
  );
};

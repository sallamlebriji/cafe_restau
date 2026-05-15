import { Building2, CheckSquare, Clock, Mail, Phone, RefreshCw, Save, ShieldCheck, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { roleLabels } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";

const staffRoles = ["MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"];
const emptyForm = { name: "", email: "", phone: "", password: "Password123", roleName: "WAITER", establishmentId: "", schedule: "", isActive: true };

export const EmployeesPage = () => {
  const { user } = useAuth();
  const { data: employees, loading, error, setData, refetch } = useApiResource("/employees?limit=100");
  const { data: roleAssignment } = useApiResource("/settings/role-assignment");
  const { data: establishments } = useApiResource(user?.roleName === "SUPER_ADMIN" ? "/establishments?limit=100" : null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const canAssignRoles = (roleAssignment.roles || ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"]).includes(user?.roleName);
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const establishmentOptions = establishments.map((item) => ({ value: item.id, label: item.name }));

  const rows = useMemo(() => employees.map((employee) => ({
    ...employee,
    name: employee.user?.name || employee.name || "Employe",
    email: employee.user?.email || "-",
    phone: employee.user?.phone || "-",
    role: employee.user?.roleName || employee.position,
    establishmentName: employee.establishment?.name || employee.user?.establishment?.name || `Entite #${employee.establishmentId || "-"}`,
    shift: employee.schedule?.shift || employee.schedule || "-",
    status: employee.isActive === false ? "Inactif" : "Actif"
  })), [employees]);

  const openCreate = () => {
    setSelected({});
    setForm({ ...emptyForm, establishmentId: isSuperAdmin ? String(establishmentOptions[0]?.value || "") : String(user?.establishmentId || "") });
  };

  const openEdit = (employee) => {
    setSelected(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone === "-" ? "" : employee.phone,
      password: "",
      roleName: employee.role || "WAITER",
      establishmentId: String(employee.establishmentId || employee.user?.establishmentId || ""),
      schedule: employee.shift === "-" ? "" : employee.shift,
      isActive: employee.isActive !== false
    });
  };

  const saveEmployee = async () => {
    if (!form.name.trim() || !form.email.trim() || (!selected?.id && !form.password.trim())) {
      toast.error("Nom, email et mot de passe sont obligatoires.");
      return;
    }
    if (!canAssignRoles) {
      toast.error("Votre role ne permet pas d'attribuer des roles.");
      return;
    }
    if (form.roleName === "SUPER_ADMIN") {
      toast.error("Le role Super Admin est protege.");
      return;
    }
    const targetEstablishmentId = Number(isSuperAdmin ? form.establishmentId : user?.establishmentId);
    if (!targetEstablishmentId) {
      toast.error("Selectionnez l'entite d'affectation.");
      return;
    }

    setSaving(true);
    try {
      if (selected?.id) {
        const { data } = await api.put(`/employees/${selected.id}`, {
          position: form.roleName,
          schedule: { shift: form.schedule },
          isActive: form.isActive,
          establishmentId: targetEstablishmentId
        });
        setData((current) => current.map((item) => (item.id === selected.id ? data.data : item)));
        toast.success("Employe modifie");
      } else {
        const registered = await api.post("/auth/register", {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          roleName: form.roleName,
          establishmentId: targetEstablishmentId
        });
        const { data } = await api.post("/employees", {
          userId: registered.data.user.id,
          establishmentId: targetEstablishmentId,
          position: form.roleName,
          schedule: { shift: form.schedule },
          isActive: true
        });
        setData((current) => [data.data, ...current]);
        toast.success("Employe et compte crees");
      }
      setSelected(null);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible d'enregistrer l'employe.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Employe", accessorKey: "name", cell: ({ row }) => <div><strong className="dark:text-cream">{row.original.name}</strong><p className="text-xs text-elegant">{row.original.email}</p></div> },
    ...(isSuperAdmin ? [{ header: "Entite", accessorKey: "establishmentName", cell: ({ row }) => <div className="flex items-center gap-2"><Building2 size={16} className="text-copper" /><span className="font-semibold">{row.original.establishmentName}</span></div> }] : []),
    { header: "Role", accessorKey: "role", cell: ({ row }) => roleLabels[row.original.role] || row.original.role },
    { header: "Planning", accessorKey: "shift" },
    { header: "Telephone", accessorKey: "phone" },
    { header: "Statut", accessorKey: "status", cell: ({ row }) => <Badge tone={row.original.status === "Actif" ? "success" : "danger"}>{row.original.status}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team OS"
        title="Employes et permissions"
        description="Comptes equipe, roles, statut actif, planning et acces operationnels."
        actions={<><Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Actualiser</Button><Button icon={UserPlus} disabled={!canAssignRoles} onClick={openCreate}>Employe</Button></>}
      />
      {error && <Card className="p-4 text-sm font-bold text-danger">Employes indisponibles: {error.response?.data?.message || "Erreur API"}</Card>}
      {loading && <p className="text-sm font-bold text-elegant">Chargement des employes...</p>}
      <DataTable data={rows} columns={columns} onRowClick={openEdit} />
      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.id ? form.name : "Nouvel employe"}>
        <div className="space-y-5">
          <Card className="p-4">
            <ShieldCheck className="text-copper" />
            <h3 className="mt-3 font-black dark:text-cream">{roleLabels[form.roleName] || form.roleName}</h3>
            <p className="mt-1 flex gap-2 text-sm text-elegant"><Clock size={16} />{form.schedule || "Planning non defini"}</p>
          </Card>
          <Input label="Nom" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} disabled={Boolean(selected?.id)} />
          <Input label="Email" icon={Mail} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} disabled={Boolean(selected?.id)} />
          <Input label="Telephone" icon={Phone} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} disabled={Boolean(selected?.id)} />
          {!selected?.id && <Input label="Mot de passe" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />}
          {isSuperAdmin && <Select label="Entite d'affectation" value={form.establishmentId} onChange={(event) => setForm((current) => ({ ...current, establishmentId: event.target.value }))} options={establishmentOptions.length ? establishmentOptions : [{ value: "", label: "Aucune entite disponible" }]} disabled={Boolean(selected?.id)} />}
          <Select label="Role" value={form.roleName} onChange={(event) => setForm((current) => ({ ...current, roleName: event.target.value }))} options={staffRoles.map((role) => ({ value: role, label: roleLabels[role] || role }))} disabled={Boolean(selected?.id)} />
          <Input label="Planning" placeholder="09:00 - 17:00" value={form.schedule} onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))} />
          <label className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-bold dark:bg-white/10">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Employe actif
          </label>
          <Button className="w-full" icon={selected?.id ? CheckSquare : Save} loading={saving} disabled={!canAssignRoles} onClick={saveEmployee}>Enregistrer</Button>
        </div>
      </Drawer>
    </div>
  );
};

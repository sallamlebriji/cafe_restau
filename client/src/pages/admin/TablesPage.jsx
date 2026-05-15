import { Building2, Download, Move, Plus, QrCode, Save, UserRound, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";
import { tables as mockTables } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";

const statuses = ["FREE", "OCCUPIED", "RESERVED", "CLEANING", "OUT_OF_SERVICE"];
const shapes = [
  { label: "Ronde", value: "round" },
  { label: "Carree", value: "square" },
  { label: "Rectangle", value: "rectangle" }
];
const serverRoles = ["WAITER", "BAR", "KITCHEN"];

const statusColors = {
  FREE: "#16A34A",
  OCCUPIED: "#DC2626",
  RESERVED: "#F97316",
  CLEANING: "#F97316",
  OUT_OF_SERVICE: "#6B7280"
};

const fallbackLayout = (table, index) => {
  const mock = mockTables.find((item) => item.number === table.number) || mockTables[index];
  return {
    ...table,
    x: Number(table.x ?? mock?.x ?? 12 + (index % 4) * 22),
    y: Number(table.y ?? mock?.y ?? 18 + Math.floor(index / 4) * 24),
    shape: table.shape || mock?.shape || "round",
    establishmentName: table.establishment?.name || `Entite #${table.establishmentId || "-"}`,
    zone: table.zone || mock?.zone || "Interieur",
    qrCode: table.qrCode || `${window.location.origin}/menu?table=${encodeURIComponent(table.number)}`
  };
};

export const TablesPage = () => {
  const planRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const { user } = useAuth();
  const { data, setData } = useApiResource("/tables");
  const { data: employees } = useApiResource("/employees");
  const { data: tableManagementSettings } = useApiResource("/settings/table-management");

  const tables = useMemo(() => data.map(fallbackLayout), [data]);
  const servers = useMemo(
    () => employees
      .map((employee) => employee.user)
      .filter((user) => user && serverRoles.includes(user.roleName)),
    [employees]
  );
  const selectedTable = selected ? tables.find((table) => table.id === selected.id) || selected : null;
  const tableManagementRoles = tableManagementSettings?.roles || ["SUPER_ADMIN", "MANAGER"];
  const canManageTables = tableManagementRoles.includes(user?.roleName);
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const serverOptions = [
    { label: "Non assignee", value: "" },
    ...servers.map((server) => ({ label: `${server.name} - ${server.roleName}`, value: String(server.id) }))
  ];

  const persistTable = async (table, patch) => {
    const assignedServer = Object.prototype.hasOwnProperty.call(patch, "assignedServerId")
      ? servers.find((server) => server.id === patch.assignedServerId) || null
      : table.assignedServer;
    const next = { ...table, ...patch, assignedServer };
    setData((current) => current.map((item) => (item.id === table.id ? { ...item, ...patch, assignedServer } : item)));
    setSelected((current) => (current?.id === table.id ? next : current));
    await api.put(`/tables/${table.id}`, patch);
    return next;
  };

  const saveTable = async (patch) => {
    if (!selectedTable) return;
    try {
      await persistTable(selectedTable, patch);
      toast.success(`Table ${selectedTable.number} mise a jour`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible de sauvegarder la table.");
    }
  };

  const addTable = async () => {
    if (!canManageTables) {
      toast.error("Vous n'avez pas la permission d'ajouter une table.");
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const nextNumber = `T${String(tables.length + 1).padStart(2, "0")}`;
    try {
      const { data: response } = await api.post("/tables", {
        number: nextNumber,
        capacity: 2,
        zone: "Interieur",
        status: "FREE",
        shape: "round",
        x: 48,
        y: 48,
        qrCode: `${window.location.origin}/menu?table=${encodeURIComponent(nextNumber)}`,
        establishmentId: storedUser.establishmentId || 1
      });
      setData((current) => [...current, response.data]);
      setSelected(response.data);
      setEditMode(true);
      toast.success(`Table ${nextNumber} ajoutee`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'ajouter la table.");
    }
  };

  const startDrag = (event, table) => {
    if (!editMode) {
      setSelected(table);
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(table.id);
    setSelected(table);
  };

  const openDetails = (table) => {
    setSelected(table);
    setDetailsOpen(true);
  };

  const dragTable = (event, table) => {
    if (!editMode || draggingId !== table.id || !planRef.current) return;
    const rect = planRef.current.getBoundingClientRect();
    const x = Math.min(92, Math.max(2, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(86, Math.max(5, ((event.clientY - rect.top) / rect.height) * 100));
    setData((current) => current.map((item) => (item.id === table.id ? { ...item, x, y } : item)));
    setSelected((current) => (current?.id === table.id ? { ...current, x, y } : current));
  };

  const endDrag = async (event, table) => {
    if (!editMode || draggingId !== table.id) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingId(null);
    const latest = tables.find((item) => item.id === table.id) || table;
    try {
      await api.put(`/tables/${table.id}`, { x: latest.x, y: latest.y });
      toast.success(`Disposition ${table.number} sauvegardee`);
    } catch {
      toast.error("Impossible de sauvegarder la position.");
    }
  };

  const printQr = (table = selectedTable) => {
    if (!table) {
      toast.error("Selectionnez une table d'abord.");
      return;
    }
    const popup = window.open("", "_blank", "width=420,height=620");
    if (!popup) {
      toast.error("Autorisez les popups pour imprimer.");
      return;
    }
    popup.document.write(`
      <html>
        <head><title>QR ${table.number}</title><style>body{font-family:Arial;padding:24px;text-align:center} h1{margin:0 0 8px}.box{display:inline-block;padding:18px;border:1px solid #ddd}</style></head>
        <body>
          <h1>Table ${table.number}</h1>
          <p>Scannez pour commander</p>
          <div class="box">${document.getElementById(`qr-${table.id}`)?.innerHTML || ""}</div>
          <p>${table.qrCode}</p>
          <script>window.onload=()=>window.print()</script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Floor plan"
        title="Tables et salle"
        description="Plan visuel editable, zones, QR Code, capacite, formes et statut temps reel."
        actions={
          <>
            {canManageTables && (
              <>
                <Button variant={editMode ? "gold" : "secondary"} icon={Move} onClick={() => setEditMode((value) => !value)}>
                  {editMode ? "Mode edition actif" : "Mode edition"}
                </Button>
                <Button variant="secondary" icon={Plus} onClick={addTable}>Ajouter table</Button>
              </>
            )}
            <Button icon={QrCode} onClick={() => printQr()}>Imprimer QR</Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div
          ref={planRef}
          className="relative h-[620px] overflow-hidden rounded-2xl border border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(200,169,106,.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.9),rgba(233,221,199,.55))] p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
        >
          <div className="absolute inset-x-6 top-6 flex justify-between text-xs font-black uppercase tracking-[0.18em] text-elegant">
            <span>Interieur</span><span>Terrasse</span>
          </div>
          <div className="absolute bottom-6 left-6 right-6 h-px bg-black/10" />
          <div className="absolute bottom-10 left-6 text-xs font-black uppercase tracking-[0.18em] text-elegant">Zone VIP / Salon</div>
          {tables.map((table) => (
            <button
              key={table.id}
              onPointerDown={(event) => startDrag(event, table)}
              onPointerMove={(event) => dragTable(event, table)}
              onPointerUp={(event) => endDrag(event, table)}
              onDoubleClick={() => openDetails(table)}
              className={`absolute grid touch-none place-items-center border-2 bg-white/90 p-3 text-center shadow-soft transition dark:bg-anthracite ${
                table.shape === "round" ? "rounded-full" : table.shape === "rectangle" ? "rounded-3xl" : "rounded-2xl"
              } ${editMode ? "cursor-move ring-2 ring-gold/30" : "hover:scale-105"} ${selectedTable?.id === table.id ? "shadow-premium" : ""}`}
              style={{
                left: `${table.x}%`,
                top: `${table.y}%`,
                width: table.shape === "rectangle" ? 150 : 108,
                height: table.shape === "rectangle" ? 92 : 108,
                borderColor: statusColors[table.status] || "#6B7280"
              }}
            >
              <strong className="text-lg dark:text-cream">{table.number}</strong>
              <span className="text-xs font-bold text-elegant">{table.capacity} pers.</span>
              {isSuperAdmin && !editMode && <span className="max-w-full truncate text-[10px] font-black text-copper">{table.establishmentName}</span>}
              {table.assignedServer && !editMode && <span className="max-w-full truncate text-[10px] font-black text-copper">{table.assignedServer.name}</span>}
              {editMode && <span className="text-[10px] font-black text-copper">{Math.round(table.x)}%, {Math.round(table.y)}%</span>}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {statuses.map((status) => (
            <Card key={status} className="flex items-center justify-between p-4">
              <Badge tone={statusTone(status)}>{status}</Badge>
              <span className="font-black">{tables.filter((table) => table.status === status).length}</span>
            </Card>
          ))}
          <Card className="space-y-3 p-4">
            <h3 className="font-black dark:text-cream">Aide edition</h3>
            <p className="text-sm font-semibold text-elegant">{canManageTables ? "Activez le mode edition, glissez les tables sur le plan, puis ajustez les details dans le panneau." : "Mode visuel uniquement. La gestion des tables est reservee aux roles autorises."}</p>
          </Card>
        </div>
      </div>
      <Drawer open={detailsOpen && Boolean(selectedTable)} onClose={() => setDetailsOpen(false)} title={`Table ${selectedTable?.number || ""}`}>
        {selectedTable && (
          <div className="space-y-5">
            <Card className="grid place-items-center p-8">
              <div id={`qr-${selectedTable.id}`}><QRCodeSVG value={selectedTable.qrCode} size={220} /></div>
              <p className="mt-4 break-all text-center text-sm font-bold text-elegant">{selectedTable.qrCode}</p>
            </Card>
            <div className="grid gap-3 md:grid-cols-2">
              <Input disabled={!canManageTables} label="Numero" value={selectedTable.number} onChange={(event) => saveTable({ number: event.target.value, qrCode: `${window.location.origin}/menu?table=${encodeURIComponent(event.target.value)}` })} />
              <Input disabled={!canManageTables} label="Capacite" type="number" value={selectedTable.capacity} onChange={(event) => saveTable({ capacity: Number(event.target.value) })} />
              <Select disabled={!canManageTables} label="Statut" value={selectedTable.status} options={statuses} onChange={(event) => saveTable({ status: event.target.value })} />
              <Select disabled={!canManageTables} label="Forme" value={selectedTable.shape} options={shapes} onChange={(event) => saveTable({ shape: event.target.value })} />
              <Select disabled={!canManageTables} label="Serveur assigne" value={selectedTable.assignedServerId || ""} options={serverOptions} onChange={(event) => saveTable({ assignedServerId: event.target.value ? Number(event.target.value) : null })} />
              <Input disabled={!canManageTables} label="Zone" value={selectedTable.zone || ""} onChange={(event) => saveTable({ zone: event.target.value })} />
              <Input disabled={!canManageTables} label="Position X" type="number" value={Math.round(selectedTable.x)} onChange={(event) => saveTable({ x: Number(event.target.value) })} />
              <Input disabled={!canManageTables} label="Position Y" type="number" value={Math.round(selectedTable.y)} onChange={(event) => saveTable({ y: Number(event.target.value) })} />
            </div>
            <Badge tone={statusTone(selectedTable.status)}>{selectedTable.status}</Badge>
            {isSuperAdmin && <p className="flex items-center gap-2 font-bold"><Building2 /> Entite {selectedTable.establishmentName}</p>}
            <p className="flex items-center gap-2 font-bold"><Users /> Capacite {selectedTable.capacity}</p>
            <p className="flex items-center gap-2 font-bold"><UserRound /> Serveur {selectedTable.assignedServer?.name || "Non assigne"}</p>
            <div className="grid grid-cols-2 gap-2">
              {canManageTables && <Button variant="secondary" icon={Save} onClick={() => toast.success("Disposition sauvegardee dans Mongo")}>Sauvegarde OK</Button>}
              <Button className="w-full" icon={Download} onClick={() => printQr(selectedTable)}>Imprimer QR</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

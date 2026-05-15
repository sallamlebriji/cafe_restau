import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { MessageCircle, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";

const emptyReservation = {
  customerName: "",
  phone: "",
  reservationDate: new Date().toISOString().slice(0, 10),
  reservationTime: "20:00",
  guests: 2,
  tableId: "",
  status: "PENDING",
  notes: ""
};

const toForm = (reservation = {}) => {
  const date = reservation.reservationDate ? new Date(reservation.reservationDate) : new Date();
  return {
    ...emptyReservation,
    ...reservation,
    customerName: reservation.customerName || reservation.customer?.name || "",
    reservationDate: date.toISOString().slice(0, 10),
    reservationTime: date.toTimeString().slice(0, 5),
    tableId: reservation.tableId || reservation.table?.id || ""
  };
};

export const ReservationsPage = () => {
  const { data: reservations, loading, error, setData, refetch } = useApiResource("/reservations?limit=100");
  const { data: tables } = useApiResource("/tables?limit=100");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyReservation);

  const rows = useMemo(() => reservations.map((reservation) => ({
    ...reservation,
    customer: reservation.customerName || reservation.customer?.name || "Client",
    tableLabel: reservation.table?.number || "-",
    dateLabel: new Date(reservation.reservationDate).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
  })), [reservations]);

  const availableTableOptions = useMemo(() => {
    const selectedTableId = Number(form.tableId || selected?.tableId || selected?.table?.id || 0);
    return tables
      .filter((table) => table.status === "FREE" || table.id === selectedTableId)
      .map((table) => ({
        value: table.id,
        label: `${table.number} - ${table.capacity || 0} pers.${table.status !== "FREE" ? " (deja attribuee)" : ""}`
      }));
  }, [form.tableId, selected, tables]);

  const calendarEvents = useMemo(() => rows.map((reservation) => ({
    id: String(reservation.id),
    title: `${reservation.status === "CONFIRMED" ? "OK " : ""}${reservation.tableLabel} - ${reservation.guests || 1}p`,
    start: reservation.reservationDate,
    backgroundColor: reservation.status === "CONFIRMED" ? "#16A34A" : reservation.status === "CANCELLED" ? "#DC2626" : "#C8A96A",
    borderColor: reservation.status === "CONFIRMED" ? "#15803D" : reservation.status === "CANCELLED" ? "#B91C1C" : "#B87333",
    textColor: "#FFFFFF",
    extendedProps: {
      status: reservation.status,
      customer: reservation.customer,
      table: reservation.tableLabel,
      guests: reservation.guests || 1,
      phone: reservation.phone
    }
  })), [rows]);

  const openReservation = (reservation = null) => {
    setSelected(reservation);
    setForm(toForm(reservation || {}));
  };

  const saveReservation = async () => {
    if (!form.customerName.trim() || !form.phone.trim() || !Number(form.guests)) {
      toast.error("Nom, telephone et nombre de personnes sont obligatoires.");
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const payload = {
        establishmentId: storedUser.establishmentId || 1,
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        reservationDate: new Date(`${form.reservationDate}T${form.reservationTime || "20:00"}`).toISOString(),
        guests: Number(form.guests),
        tableId: form.tableId ? Number(form.tableId) : null,
        status: form.status,
        notes: form.notes || null
      };
      const response = selected?.id
        ? await api.put(`/reservations/${selected.id}`, payload)
        : await api.post("/reservations", payload);
      setData((current) => selected?.id
        ? current.map((item) => (item.id === selected.id ? response.data.data : item))
        : [response.data.data, ...current]);
      setSelected(null);
      toast.success("Reservation enregistree");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible d'enregistrer la reservation.");
    }
  };

  const deleteReservation = async () => {
    if (!selected?.id || !window.confirm("Supprimer cette reservation ?")) return;
    try {
      await api.delete(`/reservations/${selected.id}`);
      setData((current) => current.filter((item) => item.id !== selected.id));
      setSelected(null);
      toast.success("Reservation supprimee");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible de supprimer la reservation.");
    }
  };

  const columns = [
    { header: "Client", accessorKey: "customer" },
    { header: "Date", accessorKey: "dateLabel" },
    { header: "Table", accessorKey: "tableLabel" },
    { header: "Personnes", accessorKey: "guests" },
    { header: "Telephone", accessorKey: "phone" },
    { header: "Statut", accessorKey: "status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Booking desk"
        title="Reservations premium"
        description="Calendrier jour/semaine/mois, attribution table, statut, liste d'attente et suivi manager."
        actions={<><Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Actualiser</Button><Button icon={Plus} onClick={() => openReservation()}>Nouvelle reservation</Button></>}
      />
      {error && <Card className="p-4 text-sm font-bold text-danger">Reservations indisponibles: {error.response?.data?.message || "Erreur API"}</Card>}
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.75fr)_minmax(360px,0.65fr)]">
        <Card className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            events={calendarEvents}
            height={780}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventClassNames={(info) => info.event.extendedProps.status === "CONFIRMED" ? ["reservation-confirmed-event"] : []}
            eventContent={(info) => (
              <div className="w-full overflow-hidden px-1 py-0.5 leading-tight">
                <strong className="block truncate text-[10px]">{info.timeText} {info.event.title}</strong>
                <span className="block truncate text-[9px] font-black">
                  {info.event.extendedProps.customer}
                </span>
              </div>
            )}
            eventClick={(info) => openReservation(rows.find((item) => String(item.id) === info.event.id))}
            dateClick={(info) => {
              const clicked = new Date(info.date);
              setSelected({});
              setForm({ ...emptyReservation, reservationDate: clicked.toISOString().slice(0, 10), reservationTime: clicked.toTimeString().slice(0, 5) });
            }}
          />
        </Card>
        <div className="space-y-3">
          {loading && <p className="text-sm font-bold text-elegant">Chargement des reservations...</p>}
          <DataTable data={rows} columns={columns} onRowClick={openReservation} pageSize={6} />
        </div>
      </div>
      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.id ? "Modifier reservation" : "Nouvelle reservation"}>
        <div className="space-y-4">
          <Input label="Nom client" value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
          <Input label="Telephone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.reservationDate} onChange={(event) => setForm((current) => ({ ...current, reservationDate: event.target.value }))} />
            <Input label="Heure" type="time" value={form.reservationTime} onChange={(event) => setForm((current) => ({ ...current, reservationTime: event.target.value }))} />
          </div>
          <Input label="Personnes" type="number" min="1" value={form.guests} onChange={(event) => setForm((current) => ({ ...current, guests: event.target.value }))} />
          <Select label="Table attribuee" value={form.tableId} onChange={(event) => setForm((current) => ({ ...current, tableId: event.target.value }))} options={[{ value: "", label: "Non attribuee" }, ...availableTableOptions]} />
          <Select label="Statut" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} options={["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]} />
          <Input label="Notes client" value={form.notes || ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Preference, allergenes, occasion..." />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={MessageCircle} onClick={() => toast.success("Message WhatsApp prepare.")}>WhatsApp</Button>
            <Button icon={Save} onClick={saveReservation}>Enregistrer</Button>
            {selected?.id && <Button className="col-span-2" variant="danger" icon={Trash2} onClick={deleteReservation}>Supprimer</Button>}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

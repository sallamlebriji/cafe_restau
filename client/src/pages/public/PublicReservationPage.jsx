import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CalendarDays, Clock3, Users } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { api } from "../../services/api";

export const PublicReservationPage = () => {
  const { establishment } = useOutletContext() || {};
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await api.post("/public/reservations", {
        customerName: values.name,
        phone: values.phone,
        reservationDate: new Date(`${values.date}T${values.time || "00:00"}`).toISOString(),
        guests: Number(values.guests),
        note: values.notes,
        establishmentId: establishment?.id || 1
      });
      toast.success("Demande envoyee");
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'envoyer la reservation.");
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[.8fr_1.2fr] md:py-12">
      <Card className="bg-ink p-6 text-cream">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-gold">Reservation</p>
        <h1 className="mt-3 text-4xl font-black">{establishment?.name || "Reserver une table"}</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-300">Envoyez une demande de reservation. L'equipe confirme ensuite selon la disponibilite.</p>
        <div className="mt-8 space-y-4 text-sm font-bold text-zinc-200">
          <p className="flex items-center gap-3"><CalendarDays className="text-gold" /> Date et heure souhaitees</p>
          <p className="flex items-center gap-3"><Users className="text-gold" /> Nombre de personnes</p>
          <p className="flex items-center gap-3"><Clock3 className="text-gold" /> Confirmation rapide</p>
        </div>
      </Card>
      <Card className="p-5 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <Input label="Nom" {...register("name", { required: "Nom requis" })} error={errors.name?.message} />
          <Input label="Telephone" {...register("phone", { required: "Telephone requis" })} error={errors.phone?.message} />
          <Input label="Date" type="date" {...register("date", { required: "Date requise" })} error={errors.date?.message} />
          <Input label="Heure" type="time" {...register("time", { required: "Heure requise" })} error={errors.time?.message} />
          <Input label="Personnes" type="number" min="1" {...register("guests", { required: "Nombre de personnes requis", min: { value: 1, message: "Indiquez au moins 1 personne" } })} error={errors.guests?.message} />
          <Input label="Notes" {...register("notes")} />
          <Button className="md:col-span-2" disabled={isSubmitting}>{isSubmitting ? "Envoi..." : "Envoyer la demande"}</Button>
        </form>
      </Card>
    </main>
  );
};

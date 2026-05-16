import { CalendarDays, Check, Clock3, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";
import { api } from "../../services/api";

const features = [
  { icon: CalendarDays, text: "Choisissez votre date et heure" },
  { icon: Users,        text: "Indiquez le nombre de convives" },
  { icon: Clock3,       text: "Confirmation rapide par l'équipe" },
  { icon: Check,        text: "Rappel automatique avant votre venue" },
];

export const PublicReservationPage = () => {
  const { establishment } = useOutletContext() || {};
  const color = establishment?.primaryColor || "#C8A96A";
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await api.post("/public/reservations", {
        customerName: values.name,
        phone: values.phone,
        reservationDate: new Date(`${values.date}T${values.time || "00:00"}`).toISOString(),
        guests: Number(values.guests),
        note: values.notes,
        establishmentId: establishment?.id || 1,
      });
      toast.success("Demande envoyée ! Nous confirmons rapidement.");
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Impossible d'envoyer la réservation.");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Gauche */}
        <div className="rounded-3xl bg-[#1A1A1A] p-7 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>Réservation</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            {establishment?.name || "Réserver une table"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Envoyez votre demande en ligne. Notre équipe confirme rapidement selon les disponibilités.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${color}25`, color }}
                >
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          {establishment?.phone && (
            <a
              href={`tel:${establishment.phone.replace(/\s/g, "")}`}
              className="mt-8 flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
              style={{ color }}
            >
              Ou appelez-nous directement →
            </a>
          )}
        </div>

        {/* Formulaire */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-[#1A1A1A]">Votre réservation</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Nom */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Nom complet *</label>
                <input
                  {...register("name", { required: "Nom requis" })}
                  placeholder="Mohamed Alami"
                  className={`h-11 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:ring-2 ${errors.name ? "border-red-400 focus:ring-red-200" : "border-black/10 focus:border-black/30 focus:ring-black/5"}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              {/* Téléphone */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Téléphone *</label>
                <input
                  {...register("phone", { required: "Téléphone requis" })}
                  placeholder="+212 6 00 00 00 00"
                  className={`h-11 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:ring-2 ${errors.phone ? "border-red-400 focus:ring-red-200" : "border-black/10 focus:border-black/30 focus:ring-black/5"}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              {/* Date */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Date *</label>
                <input
                  type="date"
                  {...register("date", { required: "Date requise" })}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:ring-2 ${errors.date ? "border-red-400 focus:ring-red-200" : "border-black/10 focus:border-black/30 focus:ring-black/5"}`}
                />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
              </div>
              {/* Heure */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Heure *</label>
                <input
                  type="time"
                  {...register("time", { required: "Heure requise" })}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:ring-2 ${errors.time ? "border-red-400 focus:ring-red-200" : "border-black/10 focus:border-black/30 focus:ring-black/5"}`}
                />
                {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time.message}</p>}
              </div>
              {/* Personnes */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Nombre de personnes *</label>
                <input
                  type="number" min="1" max="20"
                  {...register("guests", { required: "Requis", min: { value: 1, message: "Minimum 1 personne" } })}
                  placeholder="2"
                  className={`h-11 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:ring-2 ${errors.guests ? "border-red-400 focus:ring-red-200" : "border-black/10 focus:border-black/30 focus:ring-black/5"}`}
                />
                {errors.guests && <p className="mt-1 text-xs text-red-500">{errors.guests.message}</p>}
              </div>
              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-[#6B6B6B]">Notes (optionnel)</label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Occasion spéciale, allergies, préférences..."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5 resize-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-[#1A1A1A] transition hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
              style={{ background: color }}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

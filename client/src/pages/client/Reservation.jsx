import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export const Reservation = () => {
  const { register, handleSubmit, reset } = useForm();
  const onSubmit = () => {
    toast.success("Reservation envoyee. Confirmation WhatsApp possible.");
    reset();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <form onSubmit={handleSubmit(onSubmit)} className="premium-surface grid gap-5 rounded-lg p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Table</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">Reserver une table</h1>
        </div>
        {["Nom client", "Telephone", "Email", "Nombre de personnes", "Date", "Heure"].map((label) => (
          <input key={label} {...register(label)} className="rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" placeholder={label} />
        ))}
        <button className="rounded-lg bg-ink px-5 py-3 font-bold text-cream md:col-span-2">Confirmer la demande</button>
      </form>
    </main>
  );
};

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Coffee } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
  const { register, handleSubmit } = useForm();
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success("Connexion reussie");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Connexion impossible");
    }
  };

  return (
    <main className="grid min-h-screen bg-ink lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80"
          className="h-full w-full object-cover opacity-70"
          alt="Restaurant premium"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-xl text-cream">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Restaurant Cafe ERP</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight">Pilotez salle, cuisine, caisse et clients depuis un seul espace.</h1>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg bg-cream p-8 shadow-soft">
          <div className="mb-8 flex items-center gap-3">
            <span className="rounded-lg bg-ink p-3 text-gold">
              <Coffee size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-ink">Connexion</h2>
              <p className="text-sm text-zinc-500">Acces administration</p>
            </div>
          </div>
          <label className="mb-4 block">
            <span className="text-sm font-semibold text-zinc-700">Email</span>
            <input {...register("email")} className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" placeholder="admin@demo.com" />
          </label>
          <label className="mb-6 block">
            <span className="text-sm font-semibold text-zinc-700">Mot de passe</span>
            <input type="password" {...register("password")} className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 outline-none focus:border-gold" placeholder="********" />
          </label>
          <button disabled={loading} className="w-full rounded-lg bg-ink px-5 py-3 font-bold text-cream transition hover:bg-graphite">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
};

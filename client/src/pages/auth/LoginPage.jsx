import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { getHomeForRole, roleLabels } from "../../constants/navigation";
import { api } from "../../services/api";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "admin@demo.com", password: "Password123" } });
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      let moduleAccess = null;
      try {
        const moduleResponse = await api.get("/settings/module-access", {
          params: user.establishmentId ? { establishmentId: user.establishmentId } : undefined
        });
        moduleAccess = moduleResponse.data.data.modules;
      } catch {
        moduleAccess = null;
      }
      toast.success("Bienvenue dans Maison Cafe Suite");
      navigate(getHomeForRole(user.roleName, moduleAccess));
    } catch {
      toast.error("Connexion impossible");
    }
  };
  return (
    <main className="grid min-h-screen bg-ink lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:block"><img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80" className="h-full w-full object-cover opacity-70" /><div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" /><div className="absolute bottom-12 left-12 max-w-2xl text-cream"><p className="text-sm font-black uppercase tracking-[0.35em] text-gold">SaaS restaurant premium</p><h1 className="mt-5 text-6xl font-black leading-tight">Un cockpit complet pour salle, caisse, cuisine et clients.</h1></div></section>
      <section className="flex items-center justify-center p-5">
        <Card className="w-full max-w-md bg-cream p-8">
          <div className="mb-8 flex items-center gap-3"><span className="rounded-2xl bg-ink p-3 text-gold"><Coffee /></span><div><h2 className="text-3xl font-black">Connexion</h2><p className="text-sm text-elegant">Acces equipe et administration</p></div></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><Input label="Email" icon={Mail} {...register("email")} error={errors.email?.message} /><Input label="Mot de passe" type="password" icon={Lock} {...register("password")} error={errors.password?.message} /><Button className="w-full" loading={loading}>Se connecter</Button></form>
          <div className="mt-6 rounded-2xl bg-black/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-copper">Comptes demo par role</p>
            <div className="mt-3 grid gap-2 text-xs font-semibold text-elegant">
              {[
                ["admin@demo.com", "SUPER_ADMIN"],
                ["manager@demo.com", "MANAGER"],
                ["serveur@demo.com", "WAITER"],
                ["caissier@demo.com", "CASHIER"],
                ["cuisine@demo.com", "KITCHEN"],
                ["bar@demo.com", "BAR"]
              ].map(([email, role]) => <span key={email}>{roleLabels[role]}: {email}</span>)}
            </div>
            <p className="mt-3 text-xs font-bold text-elegant">Mot de passe pour tous: Password123</p>
          </div>
        </Card>
      </section>
    </main>
  );
};

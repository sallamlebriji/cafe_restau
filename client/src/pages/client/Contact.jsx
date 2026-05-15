import { MapPin, MessageCircle, Phone } from "lucide-react";

export const Contact = () => (
  <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[0.8fr_1.2fr]">
    <section className="premium-surface rounded-lg p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper">Contact</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Nous trouver</h1>
      <div className="mt-6 space-y-4 text-sm font-semibold text-zinc-700">
        <p className="flex gap-3"><MapPin className="text-copper" /> Avenue Mohammed V, Casablanca</p>
        <p className="flex gap-3"><Phone className="text-copper" /> +212 600 000 000</p>
        <p className="flex gap-3"><MessageCircle className="text-copper" /> WhatsApp direct</p>
      </div>
    </section>
    <img className="h-96 w-full rounded-lg object-cover shadow-soft" src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1400&q=80" alt="Cafe interieur" />
  </main>
);

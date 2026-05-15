import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";

export const PublicContactPage = () => {
  const { establishment } = useOutletContext() || {};
  const venue = establishment || {};
  const phoneHref = venue.phone ? `tel:${String(venue.phone).replace(/\s/g, "")}` : null;
  const whatsappHref = venue.phone ? `https://wa.me/${String(venue.phone).replace(/[^\d]/g, "")}` : null;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-12">
      <Card className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-copper">Contact</p>
        <h1 className="mt-2 text-4xl font-black">{venue.name || "Contact"}</h1>
        <div className="mt-6 space-y-4 font-bold text-elegant">
          <p className="flex gap-3"><MapPin className="shrink-0 text-copper" />{venue.address || "Adresse non renseignee"}</p>
          <p className="flex gap-3"><Phone className="shrink-0 text-copper" />{phoneHref ? <a href={phoneHref}>{venue.phone}</a> : "Telephone non renseigne"}</p>
          <p className="flex gap-3"><MessageCircle className="shrink-0 text-copper" />{whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp direct</a> : "WhatsApp non disponible"}</p>
        </div>
      </Card>
      <img src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1400&q=80" alt={venue.name || "Contact"} className="h-80 w-full rounded-3xl object-cover shadow-premium lg:h-96" />
    </main>
  );
};

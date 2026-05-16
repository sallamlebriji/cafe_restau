import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useOutletContext } from "react-router-dom";

export const PublicContactPage = () => {
  const { establishment } = useOutletContext() || {};
  const venue = establishment || {};
  const color = venue.primaryColor || "#C8A96A";
  const phoneHref   = venue.phone ? `tel:${String(venue.phone).replace(/\s/g, "")}` : null;
  const whatsappHref = venue.phone ? `https://wa.me/${String(venue.phone).replace(/[^\d]/g, "")}` : null;

  const cards = [
    { icon: MapPin,        title: "Adresse",   value: venue.address || "Non renseignée",      href: venue.address ? `https://maps.google.com?q=${encodeURIComponent(venue.address)}` : null, cta: "Voir sur la carte" },
    { icon: Phone,         title: "Téléphone", value: venue.phone   || "Non renseigné",        href: phoneHref,    cta: "Appeler maintenant" },
    { icon: MessageCircle, title: "WhatsApp",  value: "Contact direct via WhatsApp",           href: whatsappHref, cta: "Ouvrir WhatsApp" },
  ];

  return (
    <main className="min-h-[80dvh]">
      {/* Hero image */}
      <div className="relative h-56 overflow-hidden sm:h-72">
        <img
          src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1400&q=80"
          alt={venue.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F4] via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>Contact</p>
        <h1 className="mt-2 text-3xl font-black text-[#1A1A1A] sm:text-4xl">{venue.name || "Nous contacter"}</h1>
        <p className="mt-3 max-w-lg text-sm text-[#6B6B6B] leading-relaxed">
          Retrouvez toutes nos coordonnées. L'équipe est disponible pour répondre à vos questions.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map(({ icon: Icon, title, value, href, cta }) => (
            <div key={title} className="flex flex-col rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl mb-4"
                style={{ background: `${color}20`, color }}
              >
                <Icon size={20} />
              </span>
              <p className="text-xs font-black uppercase tracking-widest text-[#9B9B9B]">{title}</p>
              <p className="mt-1.5 text-sm font-semibold text-[#1A1A1A]">{value}</p>
              {href && (
                <a
                  href={href}
                  target={href.startsWith("tel") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center rounded-xl py-2.5 text-sm font-bold text-[#1A1A1A] transition hover:opacity-90 active:scale-95"
                  style={{ background: `${color}20` }}
                >
                  {cta}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Horaires si renseignés */}
        {venue.openingHours && (
          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color }}>Horaires d'ouverture</p>
            <p className="text-sm text-[#6B6B6B] whitespace-pre-line leading-relaxed">{venue.openingHours}</p>
          </div>
        )}
      </div>
    </main>
  );
};

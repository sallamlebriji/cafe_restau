import {
  ArrowRight, CalendarDays, Clock3, MapPin, MessageCircle,
  Phone, QrCode, ReceiptText, Sparkles, Star, Utensils, ChevronRight
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { products as mockProducts } from "../../data/mockData";
import { formatMoney } from "../../utils/format";

const heroImages = {
  CAFE: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=85",
  RESTAURANT: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=85",
  CAFE_RESTAURANT: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=85",
};

const getProducts = (establishment) => {
  const fromApi = (establishment?.categories || [])
    .flatMap((c) => (c.products || []).map((p) => ({
      ...p, categoryName: c.name,
      image: p.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"
    }))).slice(0, 6);
  return fromApi.length ? fromApi : mockProducts.filter((p) => p.featured).slice(0, 6);
};

const badges = [
  { icon: Clock3,   text: "Ouvert aujourd'hui" },
  { icon: QrCode,   text: "Commande QR" },
  { icon: Star,     text: "Service premium" },
];

export const PublicHomePage = () => {
  const { establishment, basePath, loading } = useOutletContext() || {};
  const venue = establishment || {};
  const type = venue.type || "CAFE_RESTAURANT";
  const showReservation = type !== "CAFE";
  const featuredProducts = getProducts(venue);
  const color = venue.primaryColor || "#C8A96A";
  const phoneHref = venue.phone ? `tel:${String(venue.phone).replace(/\s/g, "")}` : null;
  const whatsappHref = venue.phone ? `https://wa.me/${String(venue.phone).replace(/[^\d]/g, "")}` : null;

  const actionCards = [
    { title: "Menu digital", text: "Consultez nos plats, boissons et ajoutez au panier en un clic.", icon: Utensils, link: `${basePath}/menu`, cta: "Ouvrir le menu" },
    ...(showReservation ? [{ title: "Réservation", text: "Réservez votre table pour une expérience sans attente.", icon: CalendarDays, link: `${basePath}/reservation`, cta: "Réserver" }] : []),
    { title: "Suivi commande", text: "Retrouvez l'état de votre commande avec votre code.", icon: ReceiptText, link: `${basePath}/track`, cta: "Suivre" },
    { title: "Contact", text: "Adresse, téléphone et contact direct.", icon: MessageCircle, link: `${basePath}/contact`, cta: "Contacter" },
  ];

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92dvh] overflow-hidden bg-[#1A1A1A] text-white">
        <img
          src={heroImages[type] || heroImages.CAFE_RESTAURANT}
          alt={venue.name}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative mx-auto grid min-h-[92dvh] max-w-7xl items-center gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest"
              style={{ borderColor: `${color}50`, color, background: `${color}15` }}
            >
              <Sparkles size={12} />
              {type === "CAFE" ? "Café premium" : type === "RESTAURANT" ? "Restaurant gastronomique" : "Café-Restaurant"}
            </div>

            <h1 className="mt-5 text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.95] tracking-tight">
              {venue.name || "Maison Café"}
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
              Une expérience culinaire authentique, un menu digital fluide et un service connecté pour chaque visite.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={`${basePath}/menu`}
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[#1A1A1A] shadow-lg transition hover:opacity-90 active:scale-95"
                style={{ background: color }}
              >
                Voir le menu <ArrowRight size={16} />
              </Link>
              {showReservation && (
                <Link
                  to={`${basePath}/reservation`}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
                >
                  <CalendarDays size={16} /> Réserver
                </Link>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {badges.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                  <Icon size={15} style={{ color }} /> {text}
                </span>
              ))}
            </div>
          </div>

          {/* Accès rapide */}
          <div className="hidden lg:block">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
              <p className="mb-4 text-xs font-black uppercase tracking-widest" style={{ color }}>Accès rapide</p>
              <div className="space-y-2">
                {actionCards.map((item) => (
                  <Link
                    key={item.title}
                    to={item.link}
                    className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/8 p-4 transition hover:border-white/20 hover:bg-white/12"
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                      style={{ background: `${color}25`, color }}
                    >
                      <item.icon size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{item.text}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-zinc-500 transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Accès rapide mobile — sous le hero */}
      </section>

      {/* Accès rapide mobile */}
      <section className="bg-[#FAF8F4] px-4 py-8 sm:px-6 lg:hidden">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-center" style={{ color }}>Accès rapide</p>
        <div className="grid grid-cols-2 gap-3">
          {actionCards.map((item) => (
            <Link
              key={item.title}
              to={item.link}
              className="flex flex-col items-start gap-3 rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-95"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: `${color}20`, color }}
              >
                <item.icon size={18} />
              </span>
              <div>
                <p className="font-bold text-sm text-[#1A1A1A]">{item.title}</p>
                <p className="mt-0.5 text-xs text-[#6B6B6B]">{item.cta} →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Produits vedettes ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>Notre sélection</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">À découvrir</h2>
          </div>
          <Link
            to={`${basePath}/menu`}
            className="flex items-center gap-1.5 text-sm font-bold transition hover:opacity-70"
            style={{ color }}
          >
            Voir tout le menu <ChevronRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-black/5" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <Link
                key={product.id || product.name}
                to={`${basePath}/menu`}
                className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="relative h-52 overflow-hidden sm:h-60">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>
                    {product.categoryName || product.badge || "Sélection"}
                  </p>
                  <h3 className="mt-1.5 text-lg font-black text-[#1A1A1A]">{product.name}</h3>
                  {product.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-[#6B6B6B]">{product.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <strong className="text-lg font-black">{formatMoney(product.price || 0)}</strong>
                    <span
                      className="rounded-xl px-3 py-1.5 text-xs font-bold text-[#1A1A1A]"
                      style={{ background: `${color}20` }}
                    >
                      Commander
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Infos établissement ──────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
          <p className="mb-8 text-xs font-black uppercase tracking-widest text-center" style={{ color }}>Nous trouver</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Adresse",
                content: venue.address || "Adresse non renseignée",
                href: venue.address ? `https://maps.google.com?q=${encodeURIComponent(venue.address)}` : null
              },
              {
                icon: Phone,
                title: "Téléphone",
                content: venue.phone || "Non renseigné",
                href: phoneHref
              },
              {
                icon: MessageCircle,
                title: "WhatsApp",
                content: "Contacter sur WhatsApp",
                href: whatsappHref
              }
            ].map(({ icon: Icon, title, content, href }) => (
              <a
                key={title}
                href={href || undefined}
                target={href && !href.startsWith("tel") ? "_blank" : undefined}
                rel="noreferrer"
                className={`flex items-start gap-4 rounded-2xl border border-white/8 bg-white/5 p-5 transition ${href ? "hover:bg-white/10" : ""}`}
              >
                <span
                  className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${color}20`, color }}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{title}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-200">{content}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

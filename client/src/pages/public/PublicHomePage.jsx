import { ArrowRight, CalendarDays, Clock3, MapPin, MessageCircle, Phone, QrCode, ReceiptText, Sparkles, Star, Utensils } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { products as mockProducts } from "../../data/mockData";
import { formatMoney } from "../../utils/format";

const heroImages = {
  CAFE: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=85",
  RESTAURANT: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=85",
  CAFE_RESTAURANT: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=85"
};

const typeLabel = {
  CAFE: "Cafe premium",
  RESTAURANT: "Restaurant premium",
  CAFE_RESTAURANT: "Restaurant cafe premium"
};

const getProducts = (establishment) => {
  const fromApi = (establishment?.categories || [])
    .flatMap((category) => (category.products || []).map((product) => ({
      ...product,
      categoryName: category.name,
      image: product.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"
    })))
    .slice(0, 6);
  return fromApi.length ? fromApi : mockProducts.filter((item) => item.featured).slice(0, 6);
};

export const PublicHomePage = () => {
  const { establishment, basePath, loading } = useOutletContext() || {};
  const venue = establishment || {};
  const type = venue.type || "CAFE_RESTAURANT";
  const showReservation = type !== "CAFE";
  const featuredProducts = getProducts(venue);
  const phoneHref = venue.phone ? `tel:${String(venue.phone).replace(/\s/g, "")}` : null;
  const whatsappHref = venue.phone ? `https://wa.me/${String(venue.phone).replace(/[^\d]/g, "")}` : null;
  const heroImage = heroImages[type] || heroImages.CAFE_RESTAURANT;

  const actionCards = [
    {
      title: "Menu digital",
      text: "Voir les categories, prix, disponibilites et ajouter au panier.",
      icon: Utensils,
      link: `${basePath}/menu`,
      cta: "Ouvrir le menu"
    },
    ...(showReservation ? [{
      title: "Reservation",
      text: "Choisir une date, une heure et envoyer une demande directement.",
      icon: CalendarDays,
      link: `${basePath}/reservation`,
      cta: "Reserver"
    }] : []),
    {
      title: "Suivi commande",
      text: "Retrouver l'etat d'une commande avec son code.",
      icon: ReceiptText,
      link: `${basePath}/track`,
      cta: "Suivre"
    },
    {
      title: "Contact",
      text: "Adresse, telephone et contact rapide pour l'etablissement.",
      icon: MessageCircle,
      link: `${basePath}/contact`,
      cta: "Contacter"
    }
  ];

  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-cream">
        <img src={heroImage} alt={venue.name || "Etablissement"} className="absolute inset-0 h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,.96),rgba(9,9,11,.72),rgba(9,9,11,.18))]" />
        <div className="relative mx-auto grid min-h-[78dvh] max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.05fr_.95fr] md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gold">
              <Sparkles size={15} />
              {typeLabel[type] || typeLabel.CAFE_RESTAURANT}
            </p>
            <h1 className="mt-6 text-5xl font-black leading-none sm:text-6xl lg:text-8xl">{venue.name || "Maison Cafe"}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-100 sm:text-lg">
              Menu digital, commande simple, experience fluide et service connecte pour chaque visite.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link to={`${basePath}/menu`}><Button variant="gold" size="lg" icon={ArrowRight} className="w-full sm:w-auto">Voir le menu</Button></Link>
              {showReservation && <Link to={`${basePath}/reservation`}><Button variant="secondary" size="lg" icon={CalendarDays} className="w-full sm:w-auto">Reserver</Button></Link>}
            </div>
            <div className="mt-8 grid gap-3 text-sm font-bold text-zinc-200 sm:grid-cols-3">
              <span className="flex items-center gap-2"><Clock3 className="text-gold" size={18} />Ouvert aujourd'hui</span>
              <span className="flex items-center gap-2"><QrCode className="text-gold" size={18} />Commande QR</span>
              <span className="flex items-center gap-2"><Star className="text-gold" size={18} />Service premium</span>
            </div>
          </div>

          <Card className="border-white/10 bg-white/12 p-5 text-cream backdrop-blur-2xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gold">Acces rapide</p>
            <div className="mt-5 grid gap-3">
              {actionCards.map((item) => (
                <Link key={item.title} to={item.link} className="group rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold text-ink"><item.icon size={20} /></span>
                    <div className="min-w-0">
                      <h2 className="font-black">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-300">{item.text}</p>
                      <p className="mt-3 text-sm font-black text-gold">{item.cta} <span aria-hidden="true">-&gt;</span></p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-copper">Selection</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">A decouvrir</h2>
          </div>
          <Link to={`${basePath}/menu`} className="font-bold text-copper">Voir tout le menu</Link>
        </div>
        {loading ? (
          <Card className="p-6 text-sm font-bold text-elegant">Chargement de l'etablissement...</Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <Card key={product.id || product.name} interactive className="overflow-hidden">
                <img src={product.image} alt={product.name} className="h-56 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-copper">{product.categoryName || product.badge || "Selection"}</p>
                  <h3 className="mt-2 text-xl font-black">{product.name}</h3>
                  {product.description && <p className="mt-2 line-clamp-2 text-sm text-elegant">{product.description}</p>}
                  <strong className="mt-4 block">{formatMoney(product.price || 0)}</strong>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="bg-ink py-12 text-cream md:py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/10 p-6">
            <MapPin className="text-gold" />
            <h3 className="mt-4 text-xl font-black">Adresse</h3>
            <p className="mt-2 text-zinc-300">{venue.address || "Adresse non renseignee"}</p>
          </Card>
          <Card className="border-white/10 bg-white/10 p-6">
            <Phone className="text-gold" />
            <h3 className="mt-4 text-xl font-black">Telephone</h3>
            {phoneHref ? <a href={phoneHref} className="mt-2 block text-zinc-300">{venue.phone}</a> : <p className="mt-2 text-zinc-300">Telephone non renseigne</p>}
          </Card>
          <Card className="border-white/10 bg-white/10 p-6">
            <MessageCircle className="text-gold" />
            <h3 className="mt-4 text-xl font-black">WhatsApp</h3>
            {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-2 block text-zinc-300">Contacter maintenant</a> : <p className="mt-2 text-zinc-300">Contact indisponible</p>}
          </Card>
        </div>
      </section>
    </main>
  );
};

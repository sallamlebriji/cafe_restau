import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export const NotFoundPage = () => <main className="grid min-h-screen place-items-center bg-cream px-4 text-center"><div><p className="text-sm font-black uppercase tracking-[0.3em] text-copper">404</p><h1 className="mt-3 text-5xl font-black">Page introuvable</h1><p className="mt-3 text-elegant">La page demandee n'existe pas ou a ete deplacee.</p><Link to="/"><Button className="mt-6">Retour accueil</Button></Link></div></main>;

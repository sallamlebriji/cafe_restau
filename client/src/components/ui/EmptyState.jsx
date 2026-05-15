import { SearchX } from "lucide-react";
import { Button } from "./Button";

export const EmptyState = ({ title = "Aucun resultat", description = "Modifiez vos filtres ou creez un nouvel element.", actionLabel, onAction }) => (
  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 p-8 text-center dark:border-white/15 dark:bg-white/5">
    <div className="rounded-3xl bg-gold/15 p-4 text-copper"><SearchX size={30} /></div>
    <h3 className="mt-4 text-lg font-extrabold text-ink dark:text-cream">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-elegant">{description}</p>
    {actionLabel && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

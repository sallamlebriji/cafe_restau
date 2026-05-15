const tones = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
  success: "bg-green-50 text-success dark:bg-green-500/15 dark:text-green-300",
  danger: "bg-red-50 text-danger dark:bg-red-500/15 dark:text-red-300",
  warning: "bg-orange-50 text-warning dark:bg-orange-500/15 dark:text-orange-300",
  gold: "bg-gold/15 text-copper dark:text-gold",
  dark: "bg-ink text-cream dark:bg-cream dark:text-ink"
};

export const Badge = ({ children, tone = "default", className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`}>{children}</span>
);

export const statusTone = (status) => {
  if (["PAID", "READY", "FREE", "CONFIRMED", "ARRIVED", "NORMAL", "Actif"].includes(status)) return "success";
  if (["CANCELLED", "REFUNDED", "OUT", "Hors service"].includes(status)) return "danger";
  if (["PREPARING", "RESERVED", "CLEANING", "LOW", "PENDING", "NEW"].includes(status)) return "warning";
  return "default";
};

import { useTranslation } from "react-i18next";

export const Card = ({ children, className = "", interactive = false, ...props }) => (
  <div
    className={`rounded-2xl border border-black/5 bg-white/80 shadow-soft backdrop-blur-xl transition dark:border-white/10 dark:bg-white/[0.06] ${
      interactive ? "hover:-translate-y-0.5 hover:shadow-premium" : ""
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

const keyFromLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export const CardHeader = ({ eyebrow, title, action, children }) => {
  const { t } = useTranslation();
  const translateMaybe = (value) => t(keyFromLabel(value), { defaultValue: value });

  return (
    <div className="flex flex-col gap-3 border-b border-black/5 p-4 dark:border-white/10 sm:p-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-copper sm:text-xs sm:tracking-[0.22em]">{translateMaybe(eyebrow)}</p>}
        {title && <h2 className="mt-1 text-lg font-extrabold text-ink dark:text-cream sm:text-xl">{translateMaybe(title)}</h2>}
        {children}
      </div>
      {action}
    </div>
  );
};

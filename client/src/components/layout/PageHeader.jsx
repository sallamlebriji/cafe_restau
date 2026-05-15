import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const keyFromLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export const PageHeader = ({ eyebrow, title, description, actions, breadcrumbs = [] }) => {
  const { t } = useTranslation();
  const translateMaybe = (value) => t(keyFromLabel(value), { defaultValue: value });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-col justify-between gap-4 md:mb-6 md:flex-row md:items-end">
      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold text-elegant">
            {breadcrumbs.map((item, index) => (
              <span key={item}>{translateMaybe(item)}{index < breadcrumbs.length - 1 ? " /" : ""}</span>
            ))}
          </div>
        )}
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-copper sm:text-xs sm:tracking-[0.28em]">{translateMaybe(eyebrow)}</p>}
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink dark:text-cream sm:text-3xl md:text-4xl">{translateMaybe(title)}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-elegant">{translateMaybe(description)}</p>}
      </div>
      {actions && <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">{actions}</div>}
    </motion.div>
  );
};

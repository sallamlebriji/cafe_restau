import { ChevronRight } from "lucide-react";

export const PageHeader = ({ eyebrow, title, description, actions, breadcrumbs = [] }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      {breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-elegant">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} />}
              <span className={i === breadcrumbs.length - 1 ? "font-bold text-copper" : ""}>{crumb}</span>
            </span>
          ))}
        </nav>
      )}
      {eyebrow && (
        <p className="text-xs font-black uppercase tracking-widest text-copper">{eyebrow}</p>
      )}
      <h1 className="mt-1 text-2xl font-black text-ink dark:text-cream sm:text-3xl">{title}</h1>
      {description && (
        <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-relaxed text-elegant">{description}</p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>
    )}
  </div>
);
